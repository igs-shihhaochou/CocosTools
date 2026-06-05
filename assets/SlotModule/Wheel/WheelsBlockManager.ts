import {_decorator, CCFloat, CCBoolean, Component} from 'cc';
const {ccclass, property} = _decorator;

import {
  WheelStatus,
  GamePlayMode,
  WheelDataArgs,
  WheelBlockResultArgs,
  StopBtnClickedType,
} from '../Define/SlotGameData';
import {WheelBlockController} from './WheelBlockController';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {SlotGDK} from '../Define/SlotGDK';
import {Delegate, waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';

@ccclass('WheelCtrlItem')
export class WheelCtrlItem {
  // WheelBlock指的是SLOT的轉輪區域，同一款SLOT可能有好幾個WheelBlock
  @property(CCFloat)
  public wheelIndex = 0;
  @property(WheelBlockController)
  public wheelBlock: WheelBlockController = null;

  // SpinIndex只要設成0，這個WheelBlock就會Spin
  // ActiveOnStart是物件的開關
  @property(CCFloat)
  public spinIndex = 0;
  @property(CCBoolean)
  public activeOnStart = true;
}
@ccclass('WheelsBlockManager')
export class WheelsBlockManager extends Component {
  // WheelCtrlItem是用來控制WheelBlock的資料結構
  // WheelControllerList就是用來管理這款SLOT會用到的WheelCtrlItem
  @property([WheelCtrlItem])
  public wheelControllerList: WheelCtrlItem[] = [];
  public eventFinished: Delegate = new Delegate();
  public eventPrewinStart: Delegate = new Delegate();
  public eventPrewinFinished: Delegate = new Delegate();
  protected wheelBlockCount = 0;
  protected resultList: WheelBlockResultArgs[] = [];
  protected spiningWheelControllerCount = 0;
  protected isDoQuickStop = false;
  protected isThisSpinActiveTurbo = false;

  // 現在的遊戲方式
  protected gamePlayMode: GamePlayMode = GamePlayMode.Normal;

  // Coroutine : Wait Time.
  protected waitForSeconds: number;
  protected waitForFixedUpdate: number;
  protected wheelCtrlStopGapTime = 0.5;

  public onLoad() {
    SlotGameMediator.instance.wheelsManager = this;
    // 子類想接 startGame / spinResult / changeBet 三個高頻事件時,
    // override 對應 hook(onStartGameDataReceived / onSpinResultReceived /
    // onBetChanged)即可,parent 自動處理 insert/remove 生命週期。
    SlotGDK.instance.receiveStartGame.insert(
      this.onStartGameDataReceived,
      this
    );
    SlotGDK.instance.receiveSpinData.insert(this.onSpinResultReceived, this);
    SlotGDK.instance.eventClickChangeBet.insert(this.onBetChanged, this);
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventSpin.remove(this.hideAllWheelBlock, this);
    SlotGDK.instance.receiveStartGame.remove(
      this.onStartGameDataReceived,
      this
    );
    SlotGDK.instance.receiveSpinData.remove(this.onSpinResultReceived, this);
    SlotGDK.instance.eventClickChangeBet.remove(this.onBetChanged, this);
  }

  /** Hook:server startGame 封包到達。預設空實作。 */
  protected onStartGameDataReceived(_args: unknown): void {
    // override in subclass
  }

  /** Hook:server spin 封包到達。預設空實作。 */
  protected onSpinResultReceived(_args: unknown): void {
    // override in subclass
  }

  /** Hook:玩家點換 bet。預設空實作。 */
  protected onBetChanged(): void {
    // override in subclass
  }

  public resetQuickStop() {
    this.isDoQuickStop = false;
  }

  public init(): void {
    this.wheelBlockCount = this.wheelControllerList.length;
    this.wheelControllerList.sort(
      (a: WheelCtrlItem, b: WheelCtrlItem): number => {
        if (a.spinIndex > b.spinIndex) {
          return 1;
        } else if (a.spinIndex === b.spinIndex) {
          return 0;
        } else {
          return -1;
        }
      }
    );
    for (let i = 0; i < this.wheelBlockCount; i++) {
      const item: WheelCtrlItem = this.wheelControllerList[i];
      item.wheelBlock.thisGameObject.active = item.activeOnStart;
      item.wheelBlock.init(item.wheelIndex);
      item.wheelBlock.eventFinished.remove(this.onWheelCtrlFinished, this);
      item.wheelBlock.eventFinished.insert(this.onWheelCtrlFinished, this);
      item.wheelBlock.eventPrewinStart.remove(this.onPrewinStart, this);
      item.wheelBlock.eventPrewinStart.insert(this.onPrewinStart, this);
      item.wheelBlock.eventPrewinFinished.remove(this.onPrewinFinished, this);
      item.wheelBlock.eventPrewinFinished.insert(this.onPrewinFinished, this);
    }
    SlotGDK.instance.eventSpin.remove(this.hideAllWheelBlock, this);
    SlotGDK.instance.eventSpin.insert(this.hideAllWheelBlock, this);
  }

  public openAllWheelBlock() {
    for (let i = 0; i < this.wheelControllerList.length; i++) {
      const wheelBlock: WheelBlockController =
        this.wheelControllerList[i].wheelBlock;
      wheelBlock.openAllWheel();
    }
  }

  public hideAllWheelBlock() {
    for (let i = 0; i < this.wheelControllerList.length; i++) {
      const wheelBlock: WheelBlockController =
        this.wheelControllerList[i].wheelBlock;
      wheelBlock.hideAllWheel();
    }
  }

  public setFakeWheelsArrayData(args: WheelDataArgs[]): void {
    if (this.wheelBlockCount === 1) {
      const argData: WheelDataArgs = args[0];
      this.setFakeWheelsData(argData);
    } else {
      const argsCount: number = args.length;
      for (let i = 0; i < argsCount; i++) {
        const argData: WheelDataArgs = args[i];
        const item: WheelCtrlItem = this.wheelControllerList.find(obj => {
          return obj.wheelIndex === argData.wheelCtrlIndex;
        });
        if (item) {
          item.wheelBlock.setWheelData(
            argData.fakeWheelDataAry,
            argData.resultWheelDataAry
          );
        } else {
          if (Define.DEBUG_LOG) {
            console.warn(
              '[WheelsBlockManagerEx][SetWheesData] wheel ID ' +
                argData.wheelCtrlIndex +
                ' is NULL.'
            );
          }
        }
      }
    }
  }

  public setFakeWheelsData(argData: WheelDataArgs): void {
    const item: WheelCtrlItem = this.wheelControllerList[0];
    item.wheelBlock.setWheelData(
      argData.fakeWheelDataAry,
      argData.resultWheelDataAry
    );
  }

  public setPlayMode(mode: GamePlayMode): void {
    this.gamePlayMode = mode;
  }

  public updateSpinActiveTurboFlag() {
    this.isThisSpinActiveTurbo = PlatformData.instance.fastspin;
  }

  /**
   * 啟動本輪轉動。
   *
   * 預設:迭代所有 spinIndex===0 且 activeOnStart 的 wheelController 啟動 spin。
   * 子類可 override 兩個 hook 而不用整支重寫:
   *   - onBeforeSpin()        — spin 前的 state 清理(預設清空 resultList)
   *   - canSpinItem(item)     — 過濾不該轉的 item(預設:只擋 Rotate / ReadyToStop)
   *
   * 之前的 single-block 限制(`wheelBlockCount === 1`)已移除,
   * 多 block 情境(多輪盤遊戲)不需 override 整支 spin()。
   */
  public spin(): void {
    this.updateSpinActiveTurboFlag();
    this.onBeforeSpin();
    if (this.wheelBlockCount === 0) {
      if (Define.DEBUG_LOG) {
        console.warn(
          '[WheelsBlockManager][Spin] wheelControllerList Count is 0!'
        );
      }
      return;
    }
    // 若沒任何 item 可 spin(全在 Rotate/ReadyToStop),直接 return,不重置
    // spiningWheelControllerCount。否則第二次呼叫會把前次 count 蓋成 0,
    // 等 wheel 真的停下時 count-- 變負數,eventFinished 永不 notify。
    const spinIndex = 0;
    let anyCanSpin = false;
    for (let i = 0; i < this.wheelBlockCount; i++) {
      const item: WheelCtrlItem = this.wheelControllerList[i];
      if (!item.activeOnStart) continue;
      if (item.spinIndex !== spinIndex) continue;
      if (this.canSpinItem(item)) {
        anyCanSpin = true;
        break;
      }
    }
    if (!anyCanSpin) return;
    this.spiningWheelControllerCount = 0;
    this.isDoQuickStop = false;
    for (let i = 0; i < this.wheelBlockCount; i++) {
      const item: WheelCtrlItem = this.wheelControllerList[i];
      if (!item.activeOnStart) continue;
      if (item.spinIndex !== spinIndex) continue;
      if (!this.canSpinItem(item)) continue;
      item.wheelBlock.spinAll(this.gamePlayMode);
      this.spiningWheelControllerCount++;
    }
  }

  /** Hook:spin 前的 state 清理。預設清空上一輪結果。 */
  protected onBeforeSpin(): void {
    if (this.resultList.length > 0) this.resultList.length = 0;
  }

  /** Hook:某個 wheel item 是否可以開始轉。預設擋 Rotate / ReadyToStop。 */
  protected canSpinItem(item: WheelCtrlItem): boolean {
    return (
      item.wheelBlock.gameStatus !== WheelStatus.Rotate &&
      item.wheelBlock.gameStatus !== WheelStatus.ReadyToStop
    );
  }

  public spinRequestToAllBlock(args: WheelBlockResultArgs[]): void {
    this.resultList = args;
    if (args.length === 1) {
      const argData: WheelBlockResultArgs = this.resultList[0];
      this.spinRequest(argData);
    } else {
      // 先塞SpinRequest
      for (let i = 0; i < args.length; i++) {
        const argData: WheelBlockResultArgs = args[i];
        const item: WheelCtrlItem = this.wheelControllerList.find(w => {
          return w.wheelIndex === argData.wheelCtrlIndex;
        });
        item.wheelBlock.spinRequest(argData);
      }
      this.waitForSeconds = this.wheelCtrlStopGapTime;
      this.doStopSequence();
    }
  }

  public spinRequest(argData: WheelBlockResultArgs): void {
    if (this.resultList === null) {
      this.resultList = [];
      this.resultList.push(argData);
    }
    const item: WheelCtrlItem = this.wheelControllerList.find(w => {
      return w.wheelIndex === argData.wheelCtrlIndex;
    });
    if (item !== null) {
      item.wheelBlock.spinRequest(argData);
      item.wheelBlock.stopAll();
    } else {
      if (Define.DEBUG_LOG) {
        console.error(
          '[WheelsBlockManagerEx][spinRequest] Wheel Block is NULL.'
        );
      }
    }
  }

  protected async doStopSequence() {
    let nowSpinIndex = 0;
    for (let i = 0; i < this.wheelBlockCount; i++) {
      const item: WheelCtrlItem = this.wheelControllerList[i];
      if (item.spinIndex === nowSpinIndex) {
        let isSendRequest = false;
        while (!isSendRequest) {
          if (
            item.activeOnStart &&
            item.wheelBlock.gameStatus === WheelStatus.Rotate
          ) {
            item.wheelBlock.stopAll();
            isSendRequest = true;
          }
          await waitForSeconds(this.waitForFixedUpdate);
        }
      } else {
        nowSpinIndex++;
        await waitForSeconds(this.waitForSeconds);
      }
    }
    if (Define.DEBUG_LOG && DebugLogSetting.wheelBlockManager) {
      console.log('[WheelsBlockManagerEx][DoStopSequence] Finish Stop');
    }
  }

  public quickStop(
    triggerType: StopBtnClickedType = StopBtnClickedType.Manual
  ): void {
    if (this.resultList === null) {
      return;
    }
    if (this.isDoQuickStop) {
      return;
    }
    if (
      triggerType === StopBtnClickedType.TURBO_AUTO &&
      !this.isThisSpinActiveTurbo
    ) {
      return;
    }
    this.isDoQuickStop = true;
    // 全部Quick
    for (let i = 0; i < this.wheelBlockCount; i++) {
      const item: WheelCtrlItem = this.wheelControllerList[i];
      // const argData: WheelBlockResultArgs = this.resultList.find(Data => {
      //   return Data.wheelCtrlIndex === item.wheelIndex;
      // });
      if (
        item.activeOnStart &&
        (item.wheelBlock.gameStatus === WheelStatus.StartRotate ||
          item.wheelBlock.gameStatus === WheelStatus.Rotate ||
          item.wheelBlock.gameStatus === WheelStatus.ReadyToStop)
      ) {
        item.wheelBlock.doQuickStop();
      }
    }
  }

  protected onWheelCtrlFinished(wheelCtrlIndex: number): void {
    this.spiningWheelControllerCount--;
    if (this.spiningWheelControllerCount === 0) {
      if (this.eventFinished.length > 0) {
        this.eventFinished.notify(wheelCtrlIndex);
      }
    }
  }

  protected onPrewinStart(ctrlIndex: number, wheelIndex: number): void {
    if (this.eventPrewinStart.length > 0) {
      this.eventPrewinStart.notify(ctrlIndex, wheelIndex);
    }
  }

  protected onPrewinFinished(ctrlIndex: number, wheelIndex: number) {
    if (this.eventPrewinFinished.length > 0) {
      this.eventPrewinFinished.notify(ctrlIndex, wheelIndex);
    }
  }

  public getWheelBlock(ctrlIndex: number): WheelBlockController {
    if (ctrlIndex >= this.wheelBlockCount) {
      if (Define.DEBUG_LOG) {
        console.error(
          '[WheelsBlockManagerEx] Index(' +
            ctrlIndex +
            ') larger than TotalCount(' +
            this.wheelBlockCount +
            ')'
        );
      }
      return null;
    }
    return this.wheelControllerList[ctrlIndex].wheelBlock;
  }

  public setWheelBlocksHideOverFrameSymbol(): void {
    for (let i = 0; i < this.wheelBlockCount; i++) {
      this.wheelControllerList[i].wheelBlock.hideOverFrameSymbol();
    }
  }
}
