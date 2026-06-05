import {_decorator, Component} from 'cc';
const {ccclass, property} = _decorator;

import {
  BingoArgs,
  WinType,
  SpinResultExArgs,
  WheelBlockResultArgs,
  GameStatusArgs,
  GamePlayMode,
  AwardData,
  BingoFrameData,
} from '../Define/SlotGameData';
import {WinEffectManager} from './WinEffectManager';
import {SlotGDK} from '../Define/SlotGDK';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import HostSetting from '../Define/HostSetting';
import {ShowFrameObj} from './AwardSet';
import {
  Delegate,
  Queue,
  waitForSeconds,
} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {
  showBingoFrameProcessImpl,
  showOneBingoFrameEndImpl,
  createShowFrameListImpl,
  showWinEffectImpl,
} from './AwardBingoFrame';
import {updateStateImpl} from './AwardStateMachine';

export enum State {
  Start,
  ShowBingoFrame,
  ShowWin,
  CheckBingoFrameAndWinEnd,
  PlayBingoAlarmSound,
  ShowSpecialSymbolWin,
  End,
}

@ccclass('AwardController')
export class AwardController extends Component {
  public static startShowBingoEvent: Delegate = new Delegate();
  public static startShowBingoDataEvent: Delegate = new Delegate();
  public static startWinEffectEvent: Delegate = new Delegate();
  public static finishEvent: Delegate = new Delegate();
  public static beforeDoBingoAlarm: Delegate = new Delegate();
  public static forcehideAllAward: Delegate = new Delegate();
  /** @internal — 給 helper 用 */
  public _allBingoFrameShowEnd: Delegate = new Delegate();

  @property({displayName: '等待Scatter In動畫結束後才報獎'})
  /** @internal — 給 helper 用 */
  public waitScatterIn = false;

  @property({type: WinEffectManager, displayName: 'Win Effect Manager'})
  public winEffectManager: WinEffectManager = null;

  @property([ShowFrameObj])
  public showFrameObj: ShowFrameObj[] = [];

  private stateQueue: Queue<State> = new Queue<State>();
  /** @internal */
  public awardData: AwardData = null;
  /** @internal */
  public state: State = State.Start;
  /** @internal */
  public isShowFirstBingoFrameEnd = false;
  /** @internal */
  public isShowBingoWinEnd = false;
  protected scatterWin = 0;
  protected tempFrameObject: ShowFrameObj = null;
  /** @internal */
  public _showBingoFrameProcess: Function = null;
  /** @internal */
  public onAfterScatterStopCB: Function[] = [];
  /** @internal */
  public scatterStopped = true;
  protected bingoAlarmFinishCalled = false;

  protected onLoad() {
    SlotGameMediator.instance.awardController = this;
    if (HostSetting.instance.bingo.useBingoFrame) {
      if (Define.DEBUG_LOG && DebugLogSetting.awardController) {
        console.warn('[AwardController] [onLoad] useBingoFrame');
      }
    }
    if (HostSetting.instance.bingo.useWheelMask) {
      if (Define.DEBUG_LOG && DebugLogSetting.awardController) {
        console.warn('[AwardController] [onLoad] useWheelMask');
      }
    }
    SlotGDK.instance.eventOnLastScatterStopCompleted.insert(
      this.onLastScatterStopCompleted,
      this
    );
    SlotGDK.instance.eventIsRecoveryStatus.insert(() => {
      this.scatterStopped = true;
    }, this);
  }

  protected onDestroy() {
    WinEffectManager.finishEvent.remove(this.winEffectPlayFinish, this);
    SlotGDK.instance.eventOnLastScatterStopCompleted.remove(
      this.onLastScatterStopCompleted,
      this
    );
    AwardController.beforeDoBingoAlarm.clear();
    AwardController.finishEvent.clear();
    AwardController.forcehideAllAward.clear();
    AwardController.startShowBingoDataEvent.clear();
    AwardController.startShowBingoEvent.clear();
    AwardController.startWinEffectEvent.clear();
  }

  protected GetScatterWin(args: SpinResultExArgs) {
    try {
      if (
        args.wheelResultArgsList &&
        args.wheelResultArgsList[0].featurList[0] &&
        args.wheelResultArgsList[0].featurList[0].value['scatterWin']
      )
        return Number(
          args.wheelResultArgsList[0].featurList[0].value['scatterWin']
        );
      else return 0;
    } catch {
      return 0;
    }
  }

  public SetSpGameWinSoundLoopEnable(enable: boolean) {
    this.winEffectManager.spGameWinSoundLoopEnable = enable;
  }

  public initObject(): void {
    for (const showFrameObj of this.showFrameObj) {
      showFrameObj.init();
    }
  }

  public init(args: SpinResultExArgs, bingoFrameStayTime = 2) {
    if (Define.DEBUG_LOG && DebugLogSetting.awardController) {
      console.log('[AwardController] [init] ', args, bingoFrameStayTime);
    }
    this.isShowFirstBingoFrameEnd = false;
    this.isShowBingoWinEnd = false;
    if (args) {
      this.awardData = null;
      //// 在這一手有獲獎類型 或 要進特殊遊戲的狀況下, 才要設定AwardData
      if (
        args.thisWinType > 0 ||
        SlotGameMediator.instance.mainGameHost.isReadyToEnterSG()
      ) {
        this.awardData = new AwardData();
        if (args.wheelResultArgsList && args.wheelResultArgsList.length > 0) {
          this.awardData.bingoDataList = null;
          this.awardData.bingoDataList = [];
          for (let i = 0; i < args.wheelResultArgsList.length; i++) {
            const data: BingoFrameData = new BingoFrameData();
            data.wheelBlockIndex = args.wheelResultArgsList[i].wheelCtrlIndex;
            data.bingoList = args.wheelResultArgsList[i].bingoArgsList;
            data.spSymbolBingoList = args.wheelResultArgsList[i].scatterAry;
            this.awardData.bingoDataList.push(data);
          }
          this.awardData.haveSpSymobolWin = this.spSymbolAnimWheelBlockAmt > 0;
          this.awardData.thisWin = args.thisWin;
          this.awardData.totalWin = args.totalWin;
          this.awardData.winType = args.thisWinType;
          this.awardData.winOdds =
            args.thisWin / PlatformData.instance.currentTotalBet;
          this.awardData.isEnterSpecialGame =
            SlotGameMediator.instance.mainGameHost.isReadyToEnterSG();
          this.awardData.isSpecialGame =
            SlotGameMediator.instance.mainGameHost.getNowPlayMode() !==
            GamePlayMode.Normal;
          this.awardData.needBingoAlarm =
            SlotGameMediator.instance.mainGameHost.isNeedBingoAlarm();
          this.awardData.bingoFrameStayTime = bingoFrameStayTime;
        }
      }
      if (HostSetting.instance.bingo.useScatterWin) {
        this.scatterWin = this.GetScatterWin(args);
        this.awardData.totalWin -= this.scatterWin;
        if (this.scatterWin > 0) {
          SlotGDK.instance.postponeWin.notify(this.scatterWin);
        }
      }
    }
  }

  /** 需要非 SPIN 狀況 init AwardCtrl */
  public initCustomized(
    thisWin: number,
    totalWin: number,
    thisWinType: WinType,
    wheelBlockResultArgsList: WheelBlockResultArgs[],
    statusArgs: GameStatusArgs = null,
    bingoFrameStayTime = 2
  ) {
    const spinArgs: SpinResultExArgs = new SpinResultExArgs();
    spinArgs.thisWin = thisWin;
    spinArgs.thisWinType = thisWinType;
    spinArgs.totalWin = totalWin;
    if (wheelBlockResultArgsList === null) {
      wheelBlockResultArgsList = [];
      wheelBlockResultArgsList.push(new WheelBlockResultArgs());
    }
    spinArgs.wheelResultArgsList = wheelBlockResultArgsList;
    if (statusArgs === null) {
      statusArgs = new GameStatusArgs();
    }
    spinArgs.gameStatusData = statusArgs;
    this.init(spinArgs, bingoFrameStayTime);
  }

  public async doStart() {
    if (HostSetting.instance.gameSetting.isUseShutter) {
      await waitForSeconds(0.5);
    }
    if (DebugLogSetting.awardController) {
      console.log('[AwardCtrl] doStart');
    }
    /// 特殊遊戲有可能不走報獎流程
    if (!this.awardData) {
      if (AwardController.finishEvent.length > 0) {
        AwardController.finishEvent.notify();
      }
      return;
    }
    this.stateQueue.clear();
    const stateKey = Object.keys(State).filter(k => {
      return typeof State[k] === 'number';
    });
    const state = stateKey.map(k => State[k]);
    for (let i = 0; i < state.length; i++) {
      this.stateQueue.enqueue(state[i]);
    }
    this.nextState();
  }

  /**  正常是在spin按下去的時候使用 */
  public reset(): void {
    if (SlotGDK.instance.eventClearBingoData.length > 0) {
      SlotGDK.instance.eventClearBingoData.notify();
    }
    this.stopBingoAnimation();
    this.resetWinEffect();
    this.scatterStopped = false;
    this.awardData = null;
    this.unscheduleAllCallbacks();
    this.bingoAlarmFinishCalled = false;
  }

  /** 只關閉中獎效果(垃圾話 or BigWin...) */
  public resetWinEffect(): void {
    this.winEffectManager.resetWinEffect();
  }

  /** @internal — body 委派至 AwardStateMachine helper */
  public updateState(): void {
    updateStateImpl(this);
  }

  /** 根據贏分類型來設定延遲報獎的時間 */
  protected GetShowWinDelay(winType: WinType): number {
    let delay = 0;
    switch (winType) {
      case WinType.NormalWin:
      case WinType.LightWin:
      case WinType.SmallWin:
        delay = HostSetting.instance.winEffect.smallWin.showDelay;
        break;
      case WinType.BigWin:
        delay = HostSetting.instance.winEffect.bigWin.showDelay;
        break;
      case WinType.MegaWin:
        delay = HostSetting.instance.winEffect.megaWin.showDelay;
        break;
      case WinType.SuperWin:
        delay = HostSetting.instance.winEffect.superWin.showDelay;
        break;
    }
    return delay;
  }

  /** @internal */
  public async bingoAlarmProcess() {
    if (AwardController.beforeDoBingoAlarm.length > 0) {
      AwardController.beforeDoBingoAlarm.notify();
    }
    this.resetWinEffect();
    const alarmDelayTime = HostSetting.instance.awardSetting
      ? HostSetting.instance.awardSetting.alarmDelayTime
      : 1;
    await waitForSeconds(alarmDelayTime);
    console.log(
      ' %c [AwardController] [bingoAlarmProcess] trigger_alarm_new',
      'color:red'
    );
    const audioId: number =
      SlotGameMediator.instance.audioManager.play('trigger_alarm1');
    SlotGameMediator.instance.audioManager.setFinishCallback(
      audioId,
      this.bingoAlarmFinish,
      this
    );
    //避免音效沒有播成功導致沒觸發callback
    this.scheduleOnce(this.bingoAlarmFinish, 3);
  }

  private bingoAlarmFinish() {
    if (this.bingoAlarmFinishCalled) return;
    this.bingoAlarmFinishCalled = true;
    this.unschedule(this.bingoAlarmFinish);
    this.nextState();
  }

  /**
   * 特殊 symbol(scatter / bonus 等)中獎流程主入口。
   *
   * 流程:
   *   1. notifyScatterWin()       — 對外通知 + 累計 totalWin + 滾分
   *   2. showSpSymbolBingoUI()    — 顯示 frame / 動畫 / mask
   *   3. (waitTime 後)
   *   4. autoCleanupSpSymbolUI()  — 若不需 bingoAlarm 自動清掉 UI
   *   5. nextState()
   *
   * 不希望整段重寫的子類可只 override 個別 step:
   *   - 子類想跳過 bingo frame UI    → showSpSymbolBingoUI() 改空 + getSpSymbolWaitTime() 回 0
   *   - 子類想改 wait 秒數            → getSpSymbolWaitTime()
   *   - 子類想完全自己接管            → spSymbolWinProcess() 整支 override(向後相容)
   */
  /** @internal */
  public spSymbolWinProcess() {
    this.notifyScatterWin();
    this.showSpSymbolBingoUI();
    this.scheduleOnce(() => {
      this.autoCleanupSpSymbolUI();
      if (SlotGDK.instance.hideSpecialSymbol.length > 0) {
        SlotGDK.instance.hideSpecialSymbol.notify();
      }
      this.nextState();
    }, this.getSpSymbolWaitTime());
  }

  /** Hook:scatter / 特殊 symbol 中獎時通知外部 + 累計 totalWin + 滾分。 */
  protected notifyScatterWin(): void {
    if (SlotGDK.instance.showSpecialSymbol.length > 0) {
      SlotGDK.instance.showSpecialSymbol.notify(this.scatterWin);
    }
    if (HostSetting.instance.bingo.useScatterWin) {
      this.awardData.totalWin += this.scatterWin;
      if (this.scatterWin > 0) {
        SlotGDK.instance.addPostponeWin.notify(this.scatterWin);
      }
      this.showWinNumAni();
    }
  }

  /** Hook:展示 bingo frame / symbol 動畫 / mask。子類想跳過 UI 可空實作。 */
  protected showSpSymbolBingoUI(): void {
    for (let i = 0; i < this.awardData.bingoDataList.length; i++) {
      const data: BingoFrameData = this.awardData.bingoDataList[i];
      if (data.spSymbolBingoList && data.spSymbolBingoList.length > 0) {
        this.showFrameObj[data.wheelBlockIndex].showSymbolAnimation(
          data.spSymbolBingoList,
          true
        );
        this.showFrameObj[data.wheelBlockIndex].showBingoFrame(
          data.spSymbolBingoList
        );
        this.showFrameObj[data.wheelBlockIndex].showWheelMask(
          data.spSymbolBingoList
        );
      }
    }
  }

  /** Hook:不需 bingoAlarm 時自動清掉 UI。awardData.needBingoAlarm 為 true 時跳過。 */
  protected autoCleanupSpSymbolUI(): void {
    if (this.awardData.needBingoAlarm) return;
    for (let i = 0; i < this.awardData.bingoDataList.length; i++) {
      const data: BingoFrameData = this.awardData.bingoDataList[i];
      if (data.spSymbolBingoList && data.spSymbolBingoList.length > 0) {
        this.showFrameObj[data.wheelBlockIndex].stopSymbolAnimation(
          data.spSymbolBingoList,
          true
        );
        this.showFrameObj[data.wheelBlockIndex].hideBingoFrame();
        this.showFrameObj[data.wheelBlockIndex].hideWheelMask();
      }
    }
  }

  /** Hook:特殊 symbol UI 顯示秒數,子類可調或回 0 跳過。 */
  protected getSpSymbolWaitTime(): number {
    return 2;
  }

  public onEnterSpGameBtnClick(): void {
    if (this.awardData && this.awardData.haveSpSymobolWin) {
      for (let i = 0; i < this.awardData.bingoDataList.length; i++) {
        const data: BingoFrameData = this.awardData.bingoDataList[i];
        if (data.spSymbolBingoList && data.spSymbolBingoList.length > 0) {
          this.showFrameObj[data.wheelBlockIndex].stopSGSymbolAnimation();
        }
      }
    }
  }

  public hideAllAward(): void {
    if (AwardController.forcehideAllAward.length > 0) {
      AwardController.forcehideAllAward.notify();
    }
    if (
      this.awardData &&
      this.state === State.End &&
      this.awardData.thisWin > 0
    ) {
      this.stopBingoAnimation();
    }
  }

  /**  取得有特殊symbol動畫中獎的轉輪區數量*/
  get spSymbolAnimWheelBlockAmt(): number {
    let cnt = 0;
    for (let i = 0; i < this.awardData.bingoDataList.length; i++) {
      const data: BingoFrameData = this.awardData.bingoDataList[i];
      if (data.spSymbolBingoList && data.spSymbolBingoList.length > 0) {
        cnt++;
      }
    }
    return cnt;
  }

  /** @internal */
  public stopBingoAnimation(): void {
    if (this.awardData && this.awardData.bingoDataList) {
      SlotGDK.instance.eventOnBingoAnimationStopped.notify();
      this.unschedule(this._showBingoFrameProcess);
      this._showBingoFrameProcess = null;
      for (let i = 0; i < this.awardData.bingoDataList.length; i++) {
        const data: BingoFrameData = this.awardData.bingoDataList[i];
        if (
          data &&
          this.showFrameObj[data.wheelBlockIndex] &&
          this.showFrameObj[data.wheelBlockIndex].frameControllerEx
        ) {
          this.showFrameObj[data.wheelBlockIndex].stopAll();
          this.showFrameObj[data.wheelBlockIndex].showOffClippingSymbol();
        }
      }
    }
  }

  private changeBetClickHandler(): void {
    this.hideAllAward();
  }

  /** @internal */
  public winEffectPlayFinish(): void {
    WinEffectManager.finishEvent.remove(this.winEffectPlayFinish, this);
    this.isShowBingoWinEnd = true;
    this.changeState(State.CheckBingoFrameAndWinEnd);
  }

  protected allBingoFrameShowEnd(): void {
    this._allBingoFrameShowEnd.remove(this.allBingoFrameShowEnd, this);
    this.isShowFirstBingoFrameEnd = true;
    this.changeState(State.CheckBingoFrameAndWinEnd);
  }

  /** @internal */
  public showBingoFrame(delay: number) {
    /// protect
    if (
      this.awardData === null ||
      this.awardData.bingoDataList === null ||
      this.awardData.bingoDataList.length <= 0
    ) {
      console.log('[showBingoFrame] data is null, call nextState!');
      this.nextState();
      return;
    }
    this.scheduleOnce(this.startshowBingoFrame, delay);
  }

  protected startshowBingoFrame(): void {
    if (HostSetting.instance.bingo.showWinEffectAfterAllBingo) {
      this._allBingoFrameShowEnd.insert(this.nextState, this);
    } else {
      console.log('[startshowBingoFrame] call nextState');
      this.nextState();
    }
    let wheelBlockHasBingoCnt = 0;
    for (let i = 0; i < this.awardData.bingoDataList.length; i++) {
      const data: BingoFrameData = this.awardData.bingoDataList[i];
      if (data.bingoList && data.bingoList.length > 0) {
        ++wheelBlockHasBingoCnt;
        data.allBingoSymbolPosition = this.createShowFrameList(data.bingoList);
        this.showFrameObj[data.wheelBlockIndex].lineId = 0;
        this.showFrameObj[data.wheelBlockIndex].awardDataId = i;
        this._allBingoFrameShowEnd.insert(this.allBingoFrameShowEnd, this);
        this.showBingoFrameProcess(this.showFrameObj[data.wheelBlockIndex]);
      }
    }
    if (AwardController.startShowBingoDataEvent.length > 0) {
      AwardController.startShowBingoDataEvent.notify(this.awardData);
    }
    if (wheelBlockHasBingoCnt <= 0) {
      console.log('[startshowBingoFrame] wheelBlockHasBingoCnt <= 0');
      this.allBingoFrameShowEnd();
      this._allBingoFrameShowEnd.notify();
    }
  }

  protected async onLastScatterStopCompleted() {
    if (DebugLogSetting.awardController && Define.DEBUG_LOG) {
      console.warn(
        '[AwardController] [showBingoFrameProcess] Last Scatter Stop Completed.'
      );
    }
    this.scatterStopped = true;
    while (this.onAfterScatterStopCB.length) {
      await waitForSeconds(0.5);
      const callback = this.onAfterScatterStopCB.pop();
      if (typeof callback === 'function') callback();
    }
  }

  /** @internal — body 委派至 AwardBingoFrame helper */
  public showBingoFrameProcess(
    showFrameObject: ShowFrameObj,
    firstIn = true
  ): void {
    showBingoFrameProcessImpl(this, showFrameObject, firstIn);
  }

  /** @internal — body 委派至 AwardBingoFrame helper */
  public showOneBingoFrameEnd(showFrameObject: ShowFrameObj): void {
    showOneBingoFrameEndImpl(this, showFrameObject);
  }

  /** @internal — body 委派至 AwardBingoFrame helper */
  public createShowFrameList(bingoList: BingoArgs[]): number[][] {
    return createShowFrameListImpl(bingoList);
  }

  /** @internal — body 委派至 AwardBingoFrame helper */
  public showWinEffect(): Promise<void> {
    return showWinEffectImpl(this);
  }

  /** @internal */
  public nextState(): void {
    this._allBingoFrameShowEnd.remove(this.nextState, this);
    if (this.stateQueue.count > 0) {
      this.changeState(this.stateQueue.dequeue());
    }
  }

  private changeState(state: State): void {
    if (DebugLogSetting.awardController && Define.DEBUG_LOG) {
      console.warn(
        '[AwardController] [changeState] changeState to ' +
          State[state] +
          ', last state = ' +
          State[this.state]
      );
    }
    this.state = state;
    this.updateState();
  }

  /** @internal */
  public removeEventRegister() {
    WinEffectManager.finishEvent.remove(this.winEffectPlayFinish, this);
  }

  /** @internal */
  public showWinNumAni(): void {
    if (DebugLogSetting.awardController) {
      console.log('[AwardController] [ShowWinNumAni]');
    }
    if (
      this.awardData &&
      this.awardData.thisWin > 0 &&
      this.awardData.totalWin > 0
    ) {
      if (SlotGDK.instance.eventShowWinAnimCount.length > 0) {
        SlotGDK.instance.eventShowWinAnimCount.notify(
          this.awardData.totalWin,
          this.awardData.winLabelRollTime
        );
      }
      if (SlotGDK.instance.eventShowThisWin.length > 0) {
        SlotGDK.instance.eventShowThisWin.notify(this.awardData.thisWin);
      }
    }
  }

  public getIsShowBingoWinEnd(): boolean {
    return this.isShowBingoWinEnd;
  }
}
