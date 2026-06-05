import {
  _decorator,
  Component,
  Enum,
  CCBoolean,
  CCInteger,
  CCFloat,
  Node,
} from 'cc';
const {ccclass, property} = _decorator;
import {
  GamePlayMode,
  SymbolInfomation,
  WheelStatus,
  FeatureType,
  FeatureData,
  WheelBlockResultArgs,
  WheelRotateSetting,
  WheelDropSetting,
} from '../Define/SlotGameData';
import {Wheel} from './Wheel';
import {Symbol} from './Symbol';
import {SymbolSetting} from './SymbolSetting';
import {FeatureController} from '../Feature/FeatureController';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {WheelFakeRotController} from './WheelFakeRotController';
import {Delegate, waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {
  Define,
  TimeManager,
} from '../../CommonModule/Script/Define/GlobalSetting';
import {
  doAllStopImpl,
  doWheelsStopImpl,
  stopSingleDelayImpl,
  stopSingleImpl,
  callNextWheelReadyToStopImpl,
  doQuickStopImpl,
  allStoppedImpl,
  onSingleWheelSymbolsPlayImpl,
  onSingleWheelStoppedImpl,
  doWaitFeatureFinishedImpl,
} from './WheelBlockStop';
import {
  initImpl,
  sortWheelStopImpl,
  prepareSpinImpl,
  spinAllImpl,
  spinAllbyInfoImpl,
  spinSingleImpl,
  spinRequestImpl,
} from './WheelBlockSpin';
export enum PlayMode {
  Rotate,
  Drop,
}

@ccclass('WheelBlockController')
export class WheelBlockController extends Component {
  @property({type: Enum(PlayMode), displayName: '轉輪模式'})
  /** @internal — 給 helper 用 */
  public playMode: PlayMode = PlayMode.Rotate;
  @property(CCBoolean)
  /** @internal — 給 helper 用 */
  public needPlayAudio = true;

  /// <summary> Wheel列表 </summary>
  @property([Wheel])
  public wheelAry: Wheel[] = [];

  /**
   * 對所有 wheel 內每顆 symbol 執行 callback。包含 / 排除盤面外 symbol 由
   * `includeOutOfTop` / `includeOutOfBottom` 控制。
   *
   * 統一掉各遊戲(BuddhaSpin / MummyMia 等)為了壓暗 / 套色 / 套件 numNode
   * 而各自寫的「for(i) for(j)」迴圈樣板。子類只負責 callback 內的一個 symbol 處理邏輯。
   */
  public forEachSymbol(
    callback: (wheelIndex: number, sortedIndex: number, symbol: Symbol) => void,
    options: {includeOutOfTop?: boolean; includeOutOfBottom?: boolean} = {}
  ): void {
    const {includeOutOfTop = false, includeOutOfBottom = false} = options;
    for (let i = 0; i < this.wheelAry.length; i++) {
      const wheel = this.wheelAry[i];
      const start = includeOutOfTop ? 0 : wheel.outOfTopSymbolAmount;
      const end = includeOutOfBottom
        ? wheel.symbolAmount
        : wheel.outOfTopSymbolAmount + wheel.visibleSymbolAmount;
      for (let j = start; j < end; j++) {
        const symbol = wheel.symbolAry[j];
        if (!symbol || !symbol.symbolInfo) continue;
        callback(i, j, symbol);
      }
    }
  }

  /// <summary> 關於Wheel在各種Stop Type下的資訊 </summary>
  @property({type: [WheelRotateSetting]})
  public wheelRotateInfoList: WheelRotateSetting[] = [];

  /// <summary> 關於Wheel在各種Stop Type下的資訊 </summary>
  @property({type: [WheelDropSetting]})
  public wheelDropSettingList: WheelDropSetting[] = [];

  /// <summary> Prepare to All Spin </summary>
  public eventPrepareSpin: Delegate = new Delegate();

  /// <summary> Start All Spin </summary>
  public eventAllSpin: Delegate = new Delegate();

  /// <summary> Prewin開始(Controller Index, Wheel Index) </summary>
  public eventPrewinStart: Delegate = new Delegate();

  /// <summary> Prewin結束(Controller Index, Wheel Index) </summary>
  public eventPrewinFinished: Delegate = new Delegate();

  /// <summary> 本區轉輪動畫全停下(Controller Index) </summary>
  public eventAllStopped: Delegate = new Delegate();

  /// <summary> 本區轉輪動畫全結束，給WheelsManagerEx接(Controller Index) </summary>
  public eventFinished: Delegate = new Delegate();

  public eventSpinSingleWheel: Delegate = new Delegate();

  /// <summary> 當Ctrl取得Spin Request，在執行Stop之前的Event(Result Data) </summary>
  public eventGetSpinRequest: Delegate = new Delegate();

  /// <summary>呼叫下一輪停的狀況需要自己做(Wheel Index, QuickStop, last Wheel is Prewin status) </summary>
  public eventDoCustomNextStop: Delegate = new Delegate();

  /// <summary> 第一個單輪停下的Event(Controller Index, Wheel Index, SymbolEx Array(Sorted)) </summary>
  public eventFirstWheelStopped: Delegate = new Delegate();

  /// <summary> 單輪停下的Event(Controller Index, Wheel Index, SymbolEx Array(Sorted)) </summary>
  public eventSingleWheelStopped: Delegate = new Delegate();

  /// <summary> 呼叫特定Symbol顯示Bingo特效(Show Pos Array, is SG?) </summary>
  public eventShowBingo: Delegate = new Delegate();

  /// <summary> 呼叫特定Symbol停止顯示Bingo特效(Show Pos Array, is SG?) </summary>
  public eventStopBingo: Delegate = new Delegate();

  /// <summary> 要求Hide所有超框Symbol(WheelAry) </summary>
  public eventHideOverFrameSymbol: Delegate = new Delegate();

  /// <summary> 確認並且顯示特定Symbol自定義的停輪特效(Wheel, Sorted Symbol Array, Show Pos Array) </summary>
  public eventCheckAndShowCustomStopEffect: Delegate = new Delegate();

  /// <summary> 回傳哪些Symbol需要停下時候做表演的一個Array(WheelEx[], Result Arry) </summary>
  public eventBuildStopShowArray: Delegate = new Delegate();

  public gameStatus: WheelStatus = WheelStatus.Initialize;
  public get thisGameObject(): Node {
    return this.node;
  }

  /// <summary> 執行Stop的Wheel順序(第五輪最先停就在Index4的位置填0)，順序值可以重複，會變成同時停下 </summary>
  @property([CCInteger])
  public stopWheelSequenceAry: number[] = [];

  /// <summary> 特殊大symbol需要比普通symbol的圖層來的高 </summary>
  public specialSymbolDepth: number[] = null;

  /// <summary> 旋轉的時候不用真的轉而是用旋轉的圖片去替代，null就是表示不需要 </summary>
  @property(WheelFakeRotController)
  public fakeRotSpriteCtrl: WheelFakeRotController = null; //UGUI_WheelFakeRotControllerEx = null;

  /// <summary> 該轉輪區塊的Feature Controller，若null就表示不會主動表演Feature </summary>
  @property(FeatureController)
  /** @internal — 給 helper 用 */
  public featureController: FeatureController = null;

  @property(CCBoolean)
  /** @internal — 給 helper 用 */
  public isQuickStopSkipPrewin = false;

  /// <summary> Wheel Controller Index (WheelMangerEx Set) </summary>
  public wheelCtrlIndex = 0;

  /// <summary> 現在使用的Rotate參數 </summary>
  public nowRotateInfo: WheelRotateSetting = null; //WheelRotateInfo = null;
  public nowDropSetting: WheelDropSetting = null;

  /// <summary> 現在是不是有轉輪在轉 </summary>
  public isNowRotateWheel = false;

  /// <summary> 盤面結果 */
  /** @internal */
  public resultAry: number[][] = null;

  /// <summary> 停下時候要判斷要不要表演的Symbol ID Array */
  /** @internal */
  public stopShowSpecialSymbolIDList: number[][] = null;

  /// <summary> 聽牌Array */
  /** @internal */
  public _prewinAry: number[] = null;

  public get prewinAry(): number[] {
    return this._prewinAry;
  }

  /** @internal */ public sortStopWheelList = [];
  /** @internal */ public stopIndex = 0;
  /** @internal */ public maxSortedStopIndex = 0;
  /** @internal */ public rotateWheelAry: number[] = [];
  /** @internal */ public waitforStopWheelAry: number[] = [];
  /** @internal */ public _isDoQuickStop = false;
  public get isDoQuickStop(): boolean {
    return this._isDoQuickStop;
  }
  /** @internal */ public spinWheelGapTime = 0.05;
  @property(CCFloat) /** @internal */ public quickStopGapTime = 0.1;
  /** @internal */ public fastSpinSpeedMultiple = 2;
  /** @internal */ public isWheelFirstStopped = false;
  /** @internal */ public _isPrewin = false;
  public get isPrewin(): boolean {
    return this._isPrewin;
  }

  /** @internal */
  public waitFeatureCoroutine = null;
  protected waitForFixedUpdate = TimeManager.FixedTimestep;

  /** @internal */
  public _wheelAmount = 0;
  public get wheelAmount(): number {
    return this._wheelAmount;
  }

  /** @internal */
  public wheelTweenFunc: Function[] = [];
  protected dtAmulation = 0;
  /** @internal */
  public getSpinRequest = false;

  /** @internal */
  public wheelStopAudioName = '';

  /** @internal */
  public wheelSpinAudioName = '';

  public init(WheelCtrlNo: number): void {
    initImpl(this, WheelCtrlNo);
  }

  /// <summary> 排序停輪的順序 */
  public sortWheelStop(): void {
    sortWheelStopImpl(this);
  }

  public update(dt) {
    this.dtAmulation += dt;
    while (this.dtAmulation >= TimeManager.FixedTimestep) {
      this.dtAmulation -= TimeManager.FixedTimestep;
      this.fixedUpdate();
    }
  }

  public fixedUpdate() {
    this.wheelAry.forEach(wheel => {
      wheel.wheelBlockUpdate();
    });
  }

  public onDestroy(): void {
    if (this.waitFeatureCoroutine) {
      this.waitFeatureCoroutine = null;
    }
    for (let i = 0; i < this.wheelTweenFunc.length; i++) {
      if (this.wheelTweenFunc[i]) {
        this.unschedule(this.wheelTweenFunc[i]);
        this.wheelTweenFunc[i] = null;
      }
    }
  }

  /// <summary>
  /// 設定轉輪帶資料
  /// </summary>
  /// <param name="FakeWheelResultAry">假轉輪帶</param>
  /// <param name="NowResultAry">現在可以看到的牌面</param>
  public setWheelData(
    fakeWheelResultAry: number[][],
    nowResultAry: number[][]
  ): void {
    for (let i = 0; i < this.wheelAmount; i++) {
      if (fakeWheelResultAry && fakeWheelResultAry[i])
        this.wheelAry[i].setFakeWheelSymbolAry(
          this.getSymbolArrayInfo(fakeWheelResultAry[i])
        );
      if (nowResultAry && nowResultAry[i])
        this.wheelAry[i].setResultWheelSymbolAry(
          this.getSymbolArrayInfo(nowResultAry[i])
        );
    }
  }

  public finished(): void {
    this.isNowRotateWheel = false;
    //確認結束時是不是還在執行Feature Game，如果是，則由FeatureGame自己來叫Finish停
    if (this.checkHaveFeaturePlaying()) {
      //if (Define.DEBUG_LOG)
      //console.console.log("[WheelControllerEx][Finished] CheckHaveFeaturePlaying() is TRUE");
      //等待Feature Game自己叫停
    } else {
      if (this.eventFinished.length > 0) {
        this.eventFinished.notify(this.wheelCtrlIndex);
      }
    }
  }

  public prepareSpin(): void {
    prepareSpinImpl(this);
  }

  public spinAll(PlayMode: GamePlayMode): Promise<void> {
    return spinAllImpl(this, PlayMode);
  }

  public spinAllbyInfo(rotateInfo: WheelRotateSetting): Promise<void> {
    return spinAllbyInfoImpl(this, rotateInfo);
  }

  public spinSingleByMode(
    wheelIndex: number,
    PlayModeName: GamePlayMode
  ): void {
    this.spinSingle(wheelIndex, this.getRotateSetting(PlayModeName));
  }

  public spinSingle(
    wheelIndex: number,
    TargetRotInfo: WheelRotateSetting | WheelDropSetting
  ): void {
    spinSingleImpl(this, wheelIndex, TargetRotInfo);
  }

  public spinRequest(Args: WheelBlockResultArgs): void {
    spinRequestImpl(this, Args);
  }

  public stopAll(): void {
    ///YCMark : Add
    if (this.gameStatus !== WheelStatus.Rotate) {
      if (Define.DEBUG_LOG)
        console.log('Wheel Block GameStatus Not Is : ' + WheelStatus.Rotate);
      return;
    }
    if (this.resultAry === null) {
      if (Define.DEBUG_LOG)
        console.log(
          'Wheel Block ' +
            this.wheelCtrlIndex +
            " can't do StopAll(), You don't set SpinRequest!"
        );
      return;
    }
    //         //Do! prepare Stop!
    this.stopIndex = 0;
    //         //if have rotation feature
    if (this.checkHaveFeature(FeatureType.Rotating)) {
      this.waitFeatureCoroutine = this.doWaitRotFeatureFinished();
    } else {
      this.doAllStop();
    }
  }

  /** @internal */
  public async doWaitRotFeatureFinished() {
    await this.doWaitFeatureFinished(FeatureType.Rotating);
    this.doAllStop();
  }

  public doAllStop(): Promise<void> {
    return doAllStopImpl(this);
  }

  public doWheelsStop(delayTime = 0): void {
    doWheelsStopImpl(this, delayTime);
  }

  public stopSingleDelay(
    delayTime: number,
    wheelIndex: number,
    resultAry: number[],
    isCallNextStop = true
  ): void {
    stopSingleDelayImpl(this, delayTime, wheelIndex, resultAry, isCallNextStop);
  }

  public stopSingle(
    wheelIndex: number,
    resultAry: number[],
    isCallNextStop = true
  ): void {
    stopSingleImpl(this, wheelIndex, resultAry, isCallNextStop);
  }

  /// <summary> 叫下一個轉輪停止 */
  public callNextWheelReadyToStop(wheelIndex: number): void {
    callNextWheelReadyToStopImpl(this, wheelIndex);
  }

  public doQuickStop(): void {
    doQuickStopImpl(this);
  }

  public quickStopSingleWheel(wheelIndex: number, resultAry: number[]): void {
    this.stopSingle(wheelIndex, resultAry, false);
  }

  /** @internal */
  public allStopped(): void {
    allStoppedImpl(this);
  }

  /** @internal */
  public async doWaitEndFeatureFinished() {
    await this.doWaitFeatureFinished(FeatureType.End);
    await this.doCheckSingleFeatureFinished();
  }

  /** @internal */
  public async doCheckSingleFeatureFinished() {
    if (this.checkHaveFeaturePlayingByType(FeatureType.SingleEnd)) {
      while (this.checkHaveFeaturePlayingByType(FeatureType.SingleEnd)) {
        await waitForSeconds(this.waitForFixedUpdate);
      }
    }
    this.finished();
  }

  /** @internal */
  public setFeatureData(featureDataList: FeatureData[]): void {
    if (this.featureController && featureDataList) {
      this.featureController.setFeatureData(featureDataList);
    }
  }

  /** @internal */
  public checkHaveFeature(featureSectionType: FeatureType): boolean {
    if (this.featureController === null) {
      return false;
    }
    const returnFlag: boolean =
      this.featureController.checkIsFeature(featureSectionType);
    return returnFlag;
  }

  /** @internal */
  public checkHaveFeaturePlayingByType(
    featureSectionType: FeatureType
  ): boolean {
    if (this.featureController === null) {
      return false;
    }
    const returnFlag: boolean =
      this.featureController.checkHasPlayFeature(featureSectionType);
    return returnFlag;
  }

  /** @internal */
  public checkHaveFeaturePlaying(): boolean {
    if (this.featureController === null) {
      return false;
    }
    const returnFlag: boolean = this.featureController.checkHasPlayFeature();
    return returnFlag;
  }

  /** @internal */
  public doWaitFeatureFinished(featureSectionType: FeatureType): Promise<void> {
    return doWaitFeatureFinishedImpl(this, featureSectionType);
  }

  /** @internal */
  public showPrewin(wheelIndex: number): void {
    const preiwnInfo: WheelRotateSetting = this.getRotateSetting(
      GamePlayMode.Prewin
    );
    this.wheelAry[wheelIndex].setRotateInfo(preiwnInfo);
    if (this.eventPrewinStart.length > 0) {
      this.eventPrewinStart.notify(this.wheelCtrlIndex, wheelIndex);
    }
  }

  /** @internal */
  public hidePrewin(wheelIndex: number): void {
    if (this.eventPrewinFinished.length > 0) {
      this.eventPrewinFinished.notify(this.wheelCtrlIndex, wheelIndex);
    }
  }

  /// <summary> 確認這輪Wheel有沒有聽台 </summary>
  public checkIsPrewinWheel(wheelIndex: number): boolean {
    if (this.isPrewin) {
      if (wheelIndex >= 0 && wheelIndex < this.wheelAmount)
        return this._prewinAry[wheelIndex] > 0;
    }
    return false;
  }

  /// <summary> 得到設定的Rotate參數 </summary>
  public getRotateSetting(
    playModeName: GamePlayMode
  ): WheelRotateSetting | WheelDropSetting {
    if (this.playMode === PlayMode.Rotate) {
      let rotInfo: WheelRotateSetting = this.wheelRotateInfoList.filter(x => {
        return x.playModeName === playModeName;
      })[0];
      if (!rotInfo) {
        rotInfo = this.wheelRotateInfoList[0];
      }
      return rotInfo;
    } else if (this.playMode === PlayMode.Drop) {
      let dropSetting: WheelDropSetting = this.wheelDropSettingList.filter(
        x => {
          return x.playModeName === playModeName;
        }
      )[0];
      if (dropSetting) {
        dropSetting = this.wheelDropSettingList[0];
      }
      return dropSetting;
    }
    return null;
  }

  /// <summary> 得到設定的Drop參數 </summary>
  public getDropSetting(playModeName: GamePlayMode): WheelDropSetting {
    let dropSetting: WheelDropSetting = this.wheelDropSettingList.filter(x => {
      return x.playModeName === playModeName;
    })[0];
    if (dropSetting === null) {
      dropSetting = this.wheelDropSettingList[0];
    }
    return dropSetting;
  }

  /// <summary> 得到SymbolEx Array資料 </summary>
  public getSymbolArrayInfo(symbolIndexAry: number[]): SymbolInfomation[] {
    const count = symbolIndexAry.length;
    const infoAry: SymbolInfomation[] = [];
    const symbolSetting: SymbolSetting =
      SlotGameMediator.instance.symbolSetting;
    for (let i = 0; i < count; i++) {
      infoAry.push(symbolSetting.createSymbolInfo(symbolIndexAry[i]));
    }
    return infoAry;
  }

  /// <summary> 得到SymbolEx資料 </summary>
  public getSymbolInfo(symbolID: number): SymbolInfomation {
    const symbolSetting: SymbolSetting =
      SlotGameMediator.instance.symbolSetting;
    return symbolSetting.createSymbolInfo(symbolID);
  }

  public getSymbolByIndex(wheelIndex: number, symbolIndex: number): Symbol {
    return this.wheelAry[wheelIndex].getSymbolEx(symbolIndex);
  }

  public getSymbolByVisibleSortedIndex(
    wheelIndex: number,
    frameIndex: number
  ): Symbol {
    const _index: number =
      frameIndex + this.wheelAry[wheelIndex].outOfTopSymbolAmount;
    return this.wheelAry[wheelIndex].getSymbolEx(_index);
  }

  public getSymbolTransByVisibleSortedIndex(
    wheelIndex: number,
    frameIndex: number
  ): Node {
    const index: number =
      frameIndex + this.wheelAry[wheelIndex].outOfTopSymbolAmount;
    const trans: Node = this.wheelAry[wheelIndex].getSymbolEx(index).node;
    return trans;
  }

  /// <summary> 確認有沒有該Symbol在最後的結果中出現 </summary>
  public checkSymbolIDInResult(wheelIndex: number, symbolID: number): boolean {
    let haveSymbol = false;
    const length: number =
      this.wheelAry[wheelIndex].outOfTopSymbolAmount +
      this.wheelAry[wheelIndex].visibleSymbolAmount;
    for (
      let i: number = this.wheelAry[wheelIndex].outOfTopSymbolAmount;
      i < length;
      i++
    ) {
      if (this.resultAry[wheelIndex][i] === symbolID) {
        haveSymbol = true;
        break;
      }
    }
    return haveSymbol;
  }

  /// <summary> 取得這一次SpinRequest的Result </summary>
  public getResultAry(): number[][] {
    return this.resultAry;
  }

  /// <summary> 設定這一次SpinRequest的Result </summary>
  public setResultAry(resultList: []): void {
    if (Define.DEBUG_LOG) console.log('[WheelControllerEx][SetResultAry]');
    this.resultAry = resultList;
  }

  /// <summary> 設置停輪表演的Wheel + Symbol List </summary>
  public setStopShowSpecialSymbolIDList(symIDList: []): void {
    this.stopShowSpecialSymbolIDList = symIDList;
  }

  //for AwardControllerEx
  public stopSGSymbolsShowAnimation(): void {}

  /// <summary>
  /// 呼叫Symbol們進行Bingo動畫
  /// </summary>
  /// <param name="ShowPosList">可視範圍內的Symbol要顯示動畫，例如三輪可視範圍為3，則傳{{0,0,1},{1,1,0},{0,1,0}}</param>
  /// <param name="IsShowSGBingo">這個是不是Show Scatter/Special Bingo</param>
  public showBingoSymbolAnim(
    showPosList: number[][],
    isShowSGBingo: boolean
  ): void {
    if (this.eventShowBingo.length > 0) {
      this.eventShowBingo.notify(showPosList, isShowSGBingo);
    }
  }

  /// <summary> 呼叫正在播動畫的Symbol們停止動畫 </summary>
  public stopSymbolsShowAnimation(
    bingoSymbolList: number[][],
    bIsSpecialGame: boolean
  ): void {
    if (this.eventStopBingo.length > 0) {
      this.eventStopBingo.notify(bingoSymbolList, bIsSpecialGame);
    }
  }

  /// <summary> 呼叫Symbol們停止所有動畫 </summary>
  public stopAllSymbolsShowAnimation(): void {
    if (this.eventStopBingo.length > 0) {
      this.eventStopBingo.notify(null, false);
    }
  }

  /// <summary> 要求Hide所有超框Symbol </summary>
  public hideOverFrameSymbol(): void {
    if (this.eventHideOverFrameSymbol.length > 0) {
      this.eventHideOverFrameSymbol.notify(this.wheelAry);
    }
  }

  public hideAllWheel() {
    for (let i = 0; i < this.wheelAry.length; i++) {
      this.wheelAry[i].hideWheelSymbols();
    }
  }

  public hideSingleWheel(wheelIndex: number) {
    this.wheelAry[wheelIndex].hideWheelSymbols();
  }

  public openAllWheel() {
    for (let i = 0; i < this.wheelAry.length; i++) {
      this.wheelAry[i].openWheelSymbols();
    }
  }

  /** @internal */
  public onSingleWheelSymbolsPlay(
    wheelIndex: number,
    sortedSymbolAry: Wheel[]
  ): boolean {
    return onSingleWheelSymbolsPlayImpl(this, wheelIndex, sortedSymbolAry);
  }

  /** @internal */
  public onSingleWheelStopped(
    wheelIndex: number,
    sortedSymbolAry: Symbol[]
  ): void {
    onSingleWheelStoppedImpl(this, wheelIndex, sortedSymbolAry);
  }
}
