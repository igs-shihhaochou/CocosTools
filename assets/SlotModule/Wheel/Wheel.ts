import {_decorator, Component, Vec2, Vec3, CCFloat, Node, tween} from 'cc';
const {ccclass, property} = _decorator;

import {
  RotateDirection,
  SymbolInfomation,
  GamePlayMode,
  WheelDropInfo,
  WheelRotateSetting,
  WheelDropSetting,
} from '../Define/SlotGameData';
import {WheelFakeRotController} from './WheelFakeRotController';
import {Symbol} from './Symbol';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {SlotGDK} from '../Define/SlotGDK';
import {PlayMode} from './WheelBlockController';
import {DropSymbolNodeMember} from './DropModuleData';
import HostSetting from '../Define/HostSetting';
import {
  Delegate,
  Queue,
  waitForSeconds,
} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {setOpacity} from '../../CommonModule/Script/Utility/NodeProperty';
import NodeEx from '../../CommonModule/Script/Utility/NodeEx';
import {
  rotateDropImpl,
  rotateImpl,
  fakeRotateImpl,
  rotateMoveImpl,
  startFakeRotAllImpl,
  stopFakeRotAllImpl,
  passTheSymbolImpl,
  checkOverSymbolChangingPosImpl,
  boundImpl,
  breakAndBoundImpl,
  stoppedImpl,
  getSymbolRotationTimeImpl,
  getNextFakeSymbolImpl,
} from './WheelRotation';

export enum Status {
  Idle,
  Clearing,
  Rotating,
  ReadyToStop,
  Stopping,
  BreakToBound,
  Stop,
}

@ccclass('Wheel')
export class Wheel extends Component {
  /// <summary> 當Symbol換皮(Wheel Index, Symbol Index, Symbol Object) </summary>
  public eventSymbolChanged: Delegate = new Delegate();
  /// <summary> 確認Symbol要呈現特別表演(Wheel Index, SymbolEx[](sort by position)) </summary>
  public eventSymbolSpecialPlay: Delegate = new Delegate();
  /// <summary> 當Wheel進行停輪反彈，給WheelControllerEx接過去 (wheel index) </summary>
  public eventBeforeWheelBreakAndBound: Delegate = new Delegate();
  /// <summary> 當Wheel進行停輪反彈，給WheelControllerEx接過去 (wheel index) </summary>
  public eventWheelBreakAndBound: Delegate = new Delegate();
  /// <summary> 當Wheel停下，給WheelControllerEx接過去 (wheel index, SymbolEx[](sort by position)) </summary>
  public eventWheelStopped: Delegate = new Delegate();
  /// <summary> 非正規方式停輪的表演(WheelEx , SymbolEx[]) </summary>
  public eventDoSpecialStopShow: Delegate = new Delegate();
  /// <summary> 當得到Result (ResultSymbolsInfo Array) 通常是給BigSymbol掛載</summary>
  public eventGetWheelResult: Delegate = new Delegate();
  /// <summary> 當一開始初始盤面時 (ResultSymbolsInfo Array) 通常是給BigSymbol掛載</summary>
  public eventInitWheelResult: Delegate = new Delegate();
  /** @internal — 給 WheelRotation helper 用 */
  public directVector: Vec2 = Vec2.ZERO;
  /// <summary> 在轉輪區內可見的Symbol初始數量 </summary>
  @property(CCFloat)
  public visibleSymbolAmount = 3;
  /// <summary> 在轉輪區外不可見的上邊Symbol初始數量 </summary>
  @property(CCFloat)
  public outOfTopSymbolAmount = 1;
  /// <summary> 在轉輪區外不可見的下邊Symbol初始數量 </summary>
  @property(CCFloat)
  public outOfBottomSymbolAmount = 1;
  /// <summary> 轉輪的旋轉參數 </summary>
  public nowRotateInfo: WheelRotateSetting = null;
  public nowDropSetting: WheelDropSetting = null;
  /// <summary> 是否有整輪Symbol的Rotate Feature(讓停輪Symbol不做表演)，由該FeatureRemote設定，SPIN時候會恢復成False </summary>
  public isHaveWholeWheelFeature = false;
  protected _wheelIndex = 0;
  get wheelIndex() {
    return this._wheelIndex;
  }
  get symbolAmount() {
    return this.symbolAry.length;
  }
  /// <summary> 轉輪內的symbol 物件 </summary>
  @property([Symbol])
  symbolAry: Symbol[] = [];
  /// <summary> 旋轉時的Symbol換張位置 </summary>
  /** @internal — 給 WheelRotation helper 用 */
  public symbolChangingPos: Vec2 = Vec2.ZERO;
  /// <summary> 轉輪初始的位置 </summary>
  /** @internal — 給 WheelRotation helper 用 */
  public originWheelPos: Vec2 = Vec2.ZERO;
  /// <summary> 轉輪初始位置與換張位置的距離 </summary>
  /** @internal — 給 WheelRotation helper 用 */
  public rotationDistance: Vec2 = Vec2.ZERO;
  /// <summary> 轉輪旋轉的方向 </summary>
  /** @internal — 給 WheelRotation helper 用 */
  public direction: RotateDirection = RotateDirection.Down;
  /// <summary> 轉輪旋轉的速度 </summary>
  /** @internal — 給 WheelRotation helper 用 */
  public rotationSpeed = 0;
  /** @internal */
  public initRotateSpeed = -3;
  /** @internal */
  public currentRotationSpeed = 0;
  /** @internal */
  public rotateAddForce = 0.3;

  /**
   * 公開的 speed override API。子類想 mid-spin 改速度,或從外部 game data 注入,
   * 不必整支 setSpecRot() override。
   *
   * 透過 onRotateSpeedChanged hook 通知子類做後續處理(例如重新計算 rotationDistance)。
   */
  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
    this.onRotateSpeedChanged();
  }
  public setInitRotateSpeed(speed: number): void {
    this.initRotateSpeed = speed;
    this.onRotateSpeedChanged();
  }
  public setRotateAddForce(force: number): void {
    this.rotateAddForce = force;
    this.onRotateSpeedChanged();
  }

  /** Hook:rotationSpeed / initRotateSpeed / rotateAddForce 改變時觸發。預設空實作。 */
  protected onRotateSpeedChanged(): void {
    // override in subclass for state-dependent adjustment
  }
  /// <summary> 轉輪目前的活動狀態 </summary>
  /** @internal — 給 WheelRotation helper 用 */
  public status: Status = Status.Idle;
  get wheelStatus() {
    return this.status;
  }
  /// <summary> 假轉輪的list </summary>
  /** @internal */
  public fakeWheelList: SymbolInfomation[] = [];
  /// <summary> 跑假轉輪用的index </summary>
  /** @internal */
  public fakeWheelCurrentIndex = -1;
  /** @internal */
  public resultQueue: Queue<SymbolInfomation> = new Queue<SymbolInfomation>();
  /** @internal */
  public fakeRotCtrl: WheelFakeRotController = null;
  /** @internal */
  public thisNode: Node | null = null;
  /** @internal */
  public thisLocalPosition: Vec2;
  /** @internal */
  public rotateFlag = false;
  /// <summary> 急停時限制轉輪停輪音 </summary>
  /** @internal */
  public noStopWheelSound = false;
  breakSneakingFrameAmount = 0;
  @property(CCFloat)
  protected fastSpinSpeedMultiple = 1;
  /// <summary> 改變停輪音效 </summary>
  public wheelStopAudioName: string = null;
  //----------------------------------------------------------------------------------
  //第一手盤面清空的定位
  @property(Node)
  protected clearEndNode: Node | null = null;
  //第一手盤面掉落的定位
  @property(Node)
  protected clearStartNode: Node | null = null;
  protected symbolNodeMember: DropSymbolNodeMember[] = [];
  /** @internal */
  public clearFlag = false;
  //掉落速度等相關的參數
  protected nowDropInfo: WheelDropInfo = null;
  /** @internal */
  public dropFlag = false;
  private isMute = false;
  //----------------------------------------------------------------------------------

  public init(index: number) {
    for (let i = 0; i < this.symbolAry.length; i++) {
      this.symbolAry[i].symbolIndex = i;
    }
    this._wheelIndex = index;
    this.thisNode = this.node;
    this.originWheelPos = new Vec2(
      this.node.getPosition().x,
      this.node.getPosition().y
    );
    switch (this.direction) {
      case RotateDirection.Up:
      case RotateDirection.Left:
        this.rotationDistance = new Vec2(
          this.symbolAry[0].node.position.x - this.symbolAry[1].node.position.x,
          this.symbolAry[0].node.position.y - this.symbolAry[1].node.position.y
        );
        break;
      case RotateDirection.Down:
      case RotateDirection.Right:
      default:
        this.rotationDistance = new Vec2(
          this.symbolAry[1].node.position.x - this.symbolAry[0].node.position.x,
          this.symbolAry[1].node.position.y - this.symbolAry[0].node.position.y
        );
        break;
    }
    this.symbolChangingPos = new Vec2(
      this.originWheelPos.x + this.rotationDistance.x,
      this.originWheelPos.y + this.rotationDistance.y
    );
    this.thisLocalPosition = new Vec2(
      this.node.getPosition().x,
      this.node.getPosition().y
    );
    this.clearDataInit();
    this.eventWheelStopped.remove(this.shutterStopEvent, this);
    this.eventWheelStopped.insert(this.shutterStopEvent, this);
  }

  public setMute(isMute) {
    this.isMute = isMute;
  }

  protected onDestroy(): void {
    this.eventWheelStopped.remove(this.shutterStopEvent, this);
  }

  //-----------------------------------------------------------------
  protected clearDataInit() {
    this.clearFlag = false;
    //把轉輪上的Symbol記錄下來
    for (let i = 0; i < this.symbolAry.length; i++) {
      const nodeMember: DropSymbolNodeMember = new DropSymbolNodeMember();
      nodeMember.showSymbolNode = this.symbolAry[i].node;
      nodeMember.originalPosition = new Vec2(
        this.symbolAry[i].node.position.x,
        this.symbolAry[i].node.position.y
      );
      nodeMember.endPosition = new Vec2(
        this.symbolAry[i].node.position.x,
        this.symbolAry[i].node.position.y
      );
      this.symbolNodeMember.push(nodeMember);
    }
  }

  /** @internal */
  public setClearSymbolPos(): void {
    this.clearFlag = false;
    const clearDistance =
      this.symbolNodeMember[0].originalPosition.y -
      this.clearEndNode.position.y;
    for (let i = 0; i < this.symbolNodeMember.length; i++) {
      const symbolNode: Node = this.symbolNodeMember[i].showSymbolNode;
      this.symbolNodeMember[i].endPosition = new Vec2(
        symbolNode.position.x,
        symbolNode.position.y - clearDistance
      );
    }
  }

  /** @internal */
  public async symbolClearing() {
    console.log('%cSymbolClearing', 'color:#20A4F3');
    for (let i = this.symbolNodeMember.length - 1; i >= 0; i--) {
      const tempNode = this.symbolNodeMember[i].showSymbolNode;
      const tempNodeEx = new NodeEx(tempNode);
      const clearDistance =
        this.symbolNodeMember[i].originalPosition.y -
        this.symbolNodeMember[this.symbolNodeMember.length - 1].originalPosition
          .y;
      tween(tempNodeEx)
        .to(
          this.nowDropInfo.clearTime,
          {
            y: this.symbolNodeMember[i].endPosition.y,
          },
          {easing: this.nowDropInfo.wheelEasing}
        )
        .call(() => {
          tempNode.position = this.nowDropInfo.constantDropSpeed
            ? new Vec3(
                tempNode.position.x,
                this.clearStartNode.position.y + clearDistance
              )
            : new Vec3(tempNode.position.x, this.clearStartNode.position.y);
        })
        .call(() => {
          if (i === 0) {
            console.log('SymbolClearing final');
            this.clearFlag = true;
          }
        })
        .start();
      await waitForSeconds(this.nowDropInfo.clearGapTime); //原先是0.03
    }
  }

  public async drop() {
    console.log('%cSymbolFalling', 'color:#20A4F3');
    for (let i = this.symbolNodeMember.length - 1; i >= 0; i--) {
      const tempNode = this.symbolNodeMember[i].showSymbolNode;
      const tempNodeEx = new NodeEx(tempNode);

      tween(tempNodeEx)
        .to(
          this.nowDropInfo.dropTime,
          {
            y: this.symbolNodeMember[i].originalPosition.y,
          },
          {easing: this.nowDropInfo.wheelEasing}
        )
        .call(() => {
          if (i === 0) {
            const isPlaySpecial = this.playSpeicialShow();
            if (!isPlaySpecial) this.playSoundWhenStop();
          }
        })
        .by(this.nowDropInfo.bounceUpTime, {
          y: this.nowDropInfo.bounceHeigh,
        })
        .by(
          this.nowDropInfo.bounceDownTime,
          {
            y: -this.nowDropInfo.bounceHeigh,
          },
          {easing: 'bounceOut'}
        )
        .call(() => {
          if (i === 0) {
            console.log('SymbolFalling final');
            this.stopped();
            if (this.eventWheelBreakAndBound.length > 0) {
              this.eventWheelBreakAndBound.notify(
                this._wheelIndex,
                this.symbolAry
              );
            }
          }
        })
        .start();
      await waitForSeconds(this.nowDropInfo.symbolGapTime); //同一輪 每顆symbol的間隔時間
    }
  }

  //-----------------------------------------------------------------
  public wheelBlockUpdate() {
    if (this.rotateFlag) {
      if (this.dropFlag) {
        this.rotateDrop();
      } else {
        this.rotate();
      }
    }
  }

  public spin(
    _info: WheelRotateSetting | WheelDropSetting,
    _fakeCtrl: WheelFakeRotController,
    playMode: PlayMode = PlayMode.Rotate
  ) {
    if (this.status !== Status.Idle && this.status !== Status.Stop) {
      return;
    }
    this.dropFlag = playMode === PlayMode.Drop;
    this.setRotateInfo(_info);
    this.isHaveWholeWheelFeature = false;
    this.noStopWheelSound = false;
    this.fakeRotCtrl = _fakeCtrl;
    this.currentRotationSpeed = this.initRotateSpeed;
    if (this.fakeRotCtrl !== null) {
      this.status = Status.Rotating;
      this.fakeRotate();
    } else {
      this.breakSneakingFrameAmount = 0;
      this.rotateFlag = true;
      if (playMode === PlayMode.Drop) {
        this.status = Status.Clearing;
      } else {
        this.status = Status.Rotating;
      }
    }
  }

  //轉輪旋轉的處理
  protected rotateDrop() {
    rotateDropImpl(this);
  }

  //轉輪旋轉的處理
  protected rotate() {
    rotateImpl(this);
  }

  protected fakeRotate(): Promise<void> {
    return fakeRotateImpl(this);
  }

  /** @internal — WheelRotation helper 用 */
  public rotateMove(customizedSpeed = 0): void {
    rotateMoveImpl(this, customizedSpeed);
  }

  /** @internal */
  public startFakeRotAll(): void {
    startFakeRotAllImpl(this);
  }

  /** @internal */
  public stopFakeRotAll(): void {
    stopFakeRotAllImpl(this);
  }

  /// <summary>
  /// 轉輪換張並且迅速位移
  /// </summary>
  /** @internal */
  public passTheSymbol(_info: SymbolInfomation = null): void {
    passTheSymbolImpl(this, _info);
  }

  /// <summary>
  /// 確認是否超過換張的判斷點
  /// </summary>
  /** @internal */
  public checkOverSymbolChangingPos(): boolean {
    return checkOverSymbolChangingPosImpl(this);
  }

  ///停輪時往下多轉一點後彈回來
  public bound(): void {
    boundImpl(this);
  }

  /// <summary>
  /// 停輪時的回彈效果
  /// </summary>
  /** @internal */
  public breakAndBound(): Promise<void> {
    return breakAndBoundImpl(this);
  }

  /** @internal */
  public stopped(): void {
    stoppedImpl(this);
  }

  public readyToStop() {
    this.status = Status.ReadyToStop;
  }

  public stop(_result: SymbolInfomation[]) {
    //經過Delay後真的要停下
    this.resultQueue = new Queue<SymbolInfomation>();
    //處理結束的牌面
    if (
      this.direction === RotateDirection.Down ||
      this.direction === RotateDirection.Right
    ) {
      //Info倒轉，最下面的Symbol必須要第一個塞入轉輪帶內
      _result.reverse();
    }
    for (let i = 0, count = _result.length; i < count; i++) {
      this.resultQueue.enqueue(_result[i]);
    }
    if (this.eventGetWheelResult.length > 0) {
      this.eventGetWheelResult.notify(this._wheelIndex, _result);
    }
    if (this.status === Status.ReadyToStop || this.status === Status.Rotating)
      this.status = Status.Stopping;
  }

  public setFakeWheelSymbolAry(_infoAry: SymbolInfomation[]) {
    this.fakeWheelList = _infoAry;
    //隨機選擇一個index
    this.fakeWheelCurrentIndex = Math.floor(
      Math.random() * this.fakeWheelList.length
    );
  }

  public getFakeWheelSymbolAry(): SymbolInfomation[] {
    return this.fakeWheelList;
  }

  public setResultWheelSymbolAry(_infoAry: SymbolInfomation[]) {
    for (let i = 0; i < this.symbolAry.length; i++) {
      this.symbolAry[i].changeSymbol(_infoAry[i]);
    }
  }

  public setRotateInfo(_info: WheelRotateSetting | WheelDropSetting) {
    //設定轉輪旋轉的參數
    if (!this.dropFlag) {
      this.nowRotateInfo = _info as WheelRotateSetting;
    } else {
      this.nowDropSetting = _info as WheelDropSetting;
    }
    this.changeDirection(_info.direction);
    this.rotationSpeed = _info.wheelRotateSpeed;
    this.initRotateSpeed = _info.initRotateSpeed;
    this.rotateAddForce = _info.addForce;
    if (
      SlotGDK.instance.fastSpin &&
      SlotGameMediator.instance.mainGameHost.getNowPlayMode() ===
        GamePlayMode.Normal
    ) {
      this.rotationSpeed = this.rotationSpeed * this.fastSpinSpeedMultiple;
      this.initRotateSpeed = this.initRotateSpeed * this.fastSpinSpeedMultiple;
      this.rotateAddForce = this.rotateAddForce * this.fastSpinSpeedMultiple;
    }
    switch (this.direction) {
      case RotateDirection.Up:
      case RotateDirection.Left:
        this.rotationDistance = new Vec2(
          this.symbolAry[0].node.position.x - this.symbolAry[1].node.position.x,
          this.symbolAry[0].node.position.y - this.symbolAry[1].node.position.y
        );
        break;
      case RotateDirection.Down:
      case RotateDirection.Right:
      default:
        this.rotationDistance = new Vec2(
          this.symbolAry[1].node.position.x - this.symbolAry[0].node.position.x,
          this.symbolAry[1].node.position.y - this.symbolAry[0].node.position.y
        );
        break;
    }
    this.symbolChangingPos = new Vec2(
      this.originWheelPos.x + this.rotationDistance.x,
      this.originWheelPos.y + this.rotationDistance.y
    );
    if (this.dropFlag) {
      if (SlotGDK.instance.fastSpin) {
        this.nowDropInfo = this.nowDropSetting.fastWheelDropInfo;
      } else {
        this.nowDropInfo = this.nowDropSetting.normalWheelDropInfo;
      }
    }
  }

  public getSymbolEx(_index): Symbol {
    if (_index >= 0 && _index < this.symbolAry.length) {
      return this.symbolAry[_index];
    } else {
      return null;
    }
  }

  /// <summary>
  /// 關閉停輪音(急停時避免停輪音重疊)
  /// </summary>
  public setNoStopWheelSound() {
    this.noStopWheelSound = true;
  }

  /// <summary>
  /// 停輪回彈的聲音播放
  /// </summary>
  /** @internal */
  public playSoundWhenStop() {
    if (!this.noStopWheelSound) {
      if (!this.isMute) {
        if (
          this.wheelStopAudioName !== null &&
          this.wheelStopAudioName !== ''
        ) {
          SlotGameMediator.instance.audioManager.play(this.wheelStopAudioName);
        } else {
          SlotGameMediator.instance.audioManager.play('wheel_stop');
        }
      }
    }
  }

  /// <summary>
  /// 如果有Symbol要做表演，回傳是否有要PlaySpecialSymbol
  /// </summary>
  /** @internal */
  public playSpeicialShow() {
    if (this.eventSymbolSpecialPlay.length > 0) {
      const isPlaySpecialEffect = this.eventSymbolSpecialPlay.notify(
        this._wheelIndex,
        this.symbolAry
      );
      return isPlaySpecialEffect;
    }
    return false;
  }

  protected changeDirection(_direction: RotateDirection) {
    this.direction = _direction;
    if (this.direction === RotateDirection.Down)
      this.directVector = new Vec2(0, -1);
    else if (this.direction === RotateDirection.Up)
      this.directVector = new Vec2(0, 1);
    else if (this.direction === RotateDirection.Left)
      this.directVector = new Vec2(-1, 0);
    else if (this.direction === RotateDirection.Right)
      this.directVector = new Vec2(1, 0);
  }

  public getSymbolRotationTime(): number {
    return getSymbolRotationTimeImpl(this);
  }

  /** @internal */
  public getNextFakeSymbol(): SymbolInfomation {
    return getNextFakeSymbolImpl(this);
  }

  public setSymbolRef() {
    if (Define.DEBUG_MODE) {
      this.symbolAry = this.node.getComponentsInChildren(Symbol);
    }
  }

  protected shutterStopEvent() {
    if (HostSetting.instance.gameSetting.isUseShutter) {
      this.openWheelSymbols();
    }
  }

  public hideWheelSymbols() {
    if (HostSetting.instance.gameSetting.isUseShutter) {
      setOpacity(this.node, 0);
    }
  }

  public openWheelSymbols() {
    setOpacity(this.node, 255);
  }
}
