import {WheelsBlockManager} from '../Wheel/WheelsBlockManager';
import {AwardController} from '../Award/AwardController';
import {SpecialGameAgent} from '../SpecialGame/SpecialGameAgent';
import {
  SpecialGameEndProcess,
  GamePlayMode,
  WinType,
} from '../Define/SlotGameData';
import {SlotGDK} from '../Define/SlotGDK';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import HostSetting from '../Define/HostSetting';
import {Delegate, Queue} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {
  _decorator,
  Component,
  CCInteger,
  CCString,
  CCFloat,
  CCBoolean,
} from 'cc';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import GameActivityManager from '../../CommonModule/Script/Manager/GameActivityManager';
import {
  setActivityEventSubscription,
  clearPauseRefreshBalanceResumeTimer,
  activityPauseRefreshBalance,
  activityGameChangeBet,
  activityGetGameBet,
  activityGetGameTotalBet,
  activityGetGameTotalBetWithScale,
  activityInteractionLockChanged,
  activityIntermissionEventBegin,
  activityIntermissionEventEnd,
  activityMainGameReady,
  activityGetMainGameReady,
} from './MainGameHostActivity';
import {
  playMainGameBgm,
  fadeOutMainGameBgm,
  setMainGameBgmPause,
  setMainGameBgmResume,
  stopMainGameBgm,
} from './MainGameHostBgm';
import {
  flowReadyToSpin,
  flowSpin,
  flowWaitForSpinRequestCallBack,
  flowWaitForWheelStop,
  flowWheelsAllStopped,
  flowShowAward,
  flowAfterShowAward,
  flowProcessFinish,
  flowOnPrewinStart,
  flowOnShowAwardStart,
  flowOnBingoAlarmStart,
  flowOnBackToMainGameMode,
} from './MainGameHostFlow';
import {
  handleStartGameData,
  handleSpinData,
  handleFeverGameData,
} from './MainGameHostServer';

const {ccclass, property} = _decorator;

export enum GameStatus {
  //Process Queue
  ProcessStart = 0,
  ReadyToSpin = 1,
  Spin = 2,
  WaitForSpinRequestCallBack = 3,
  WaitForWheelStop = 4,
  WheelsAllStopped = 5,
  ShowAward = 6,
  AfterShowAward = 7,
  ProcessFinish = 8,
}

@ccclass
export class MainGameHost extends Component {
  @property(CCString)
  /** @internal — 給 MainGameHostBgm helper 用(原 private,改 public 不影響 scene 序列化) */
  public mainGameBGM = '';
  @property([CCInteger])
  /** @internal — 給 MainGameHostServer helper 用 */
  public dontPlayRecoveryAlarmSgId: number[] = [];

  /** 狀態機Queue */
  private statusQueue: Queue<GameStatus> = new Queue<GameStatus>();
  /** 現在狀態 */
  private nowGameStatus: GameStatus = GameStatus.ProcessStart;
  get getNowGameStatus() {
    return this.nowGameStatus;
  }
  /**
   * @internal 設為 true 時可以卡住 Spin 流程, 設為 false 時自動跑下一個流程。
   * helper 可直接讀寫,但建議仍走 setStopProcess / runWithProcessPaused。
   */
  public _isStopProcess = false;
  /** 特殊遊戲回到MG的時候需要的delay的時間 */
  @property(CCFloat)
  /** @internal — 給 MainGameHostFlow helper 用 */
  public sGtoMGNeedDelayTime = 1;
  /** @internal — 給 MainGameHostServer helper 用 */
  public isStarted = false;
  /** @internal — 由 init 注入,helper 也會用 */
  public wheelsManager: WheelsBlockManager = null;
  /** @internal — 由 init 注入,helper 也會用 */
  public awardController: AwardController = null;
  /** @internal — 由 init 注入,helper 也會用 */
  public specialGameAgent: SpecialGameAgent = null;
  /** @internal — recovery 旗標,helper 會讀寫 */
  public hasRecovery = false;

  @property(CCBoolean)
  /** @internal — 給 MainGameHostFlow helper 用 */
  public autoFade = true;

  @property({
    type: CCFloat,
    displayName: '額外設定報獎時遊戲bgm大小，0代表暫停，-1代表不使用',
  })
  private _showAwardVolume = -1;
  public get ShowAwardVolume(): number {
    return this._showAwardVolume;
  }
  /** @internal — 給 MainGameHostBgm helper 用 */
  public _mainGameBgmAudioId: number = undefined;
  /** @internal */
  public _isFadeOutBgm = false;
  /** @internal */
  public _isPauseBgm = false;
  /** @internal */
  public _delaySetBgmVolumeFunction: Function = null;
  private isProcessComplete = false;

  /** @internal — 給 MainGameHostActivity helper 用,外部勿直接讀寫 */
  public _isIntermission = false;
  /** @internal — 給 MainGameHostActivity helper 用 */
  public _isMainGameReady = false;
  /** @internal — PAUSE_REFRESH_BALANCE 自動恢復計時器,給 helper 用 */
  public _pauseRefreshBalanceResumeTimerId: number | null = null;

  //記錄這次Spin的時間，主要用在送審時spin秒數規範(timestamp)
  /** @internal — 給 MainGameHostFlow helper 用 */
  public spinStartTime: number;

  public onLoad() {
    SlotGameMediator.instance.mainGameHost = this;
  }

  public onDestroy() {
    this.setSlotGDKEvent(false);
    this.setActivityEvent(false);
    this.clearPauseRefreshBalanceResumeTimer();
    this.wheelsManager = null;
    this.awardController = null;
    this.specialGameAgent = null;

    this._isMainGameReady = false;
  }

  public init(): void {
    this.wheelsManager = SlotGameMediator.instance.wheelsManager;
    this.awardController = SlotGameMediator.instance.awardController;
    this.specialGameAgent = SlotGameMediator.instance.specialGameAgent;

    this.setSlotGDKEvent(true);

    //新增活動模組初始化完成監聽
    GameActivityManager.instance.AddActivityInitListener(
      this.registerActivityEvent,
      this
    );

    if (this.specialGameAgent) {
      this.specialGameAgent.init();
      this.specialGameAgent.eventBackToMaingameMode.insert(
        this.onBackToMainGameMode,
        this
      );
    }

    if (
      HostSetting.instance.gameSetting.bgm.fadeInWhenSpin === false &&
      !this.hasRecovery
    ) {
      if (DebugLogSetting.mainGameHost) {
        console.log('155 playMainGameBGM');
      }
      this.playMainGameBGM();
    }
    this.wheelsManager.init();
    /** 必須在 WheelMgr init 之後，否則 Wheel Symbol 數量錯誤 */
    this.awardController.initObject();
  }

  private registerActivityEvent() {
    //活動模組初始化完成，進行活動相關事件註冊
    this.setActivityEvent(true);
  }

  /**
   * 推進狀態機(原 private,改 public 讓 helper 可以呼叫)。
   * 外部不應直接呼叫 — 仍應透過 setStopProcess / runWithProcessPaused。
   * @internal
   */
  public nextProcess(): void {
    if (this._isStopProcess) return;

    if (!this.statusQueue || this.statusQueue.count === 0) {
      if (DebugLogSetting.mainGameHost && Define.DEBUG_LOG) {
        console.log('[MainGameHost] [nextProcess] m_StatusQueue.Count is 0');
      }
      return;
    }
    this.nowGameStatus = this.statusQueue.dequeue();
    if (DebugLogSetting.mainGameHost && Define.DEBUG_LOG) {
      console.log(
        '[MainGameHost] [nextProcess] m_NowGameStatus : ' +
          GameStatus[this.nowGameStatus]
      );
    }
    this.isProcessComplete = true;
    switch (this.nowGameStatus) {
      case GameStatus.ReadyToSpin:
        this.readyToSpin();
        break;
      case GameStatus.Spin:
        this.spin();
        break;
      case GameStatus.WaitForSpinRequestCallBack:
        this.waitForSpinRequestCallBack();
        break;
      case GameStatus.WaitForWheelStop:
        this.waitForWheelStop();
        break;
      case GameStatus.WheelsAllStopped:
        this.wheelsAllStopped();
        break;
      case GameStatus.ShowAward:
        this.showAward();
        break;
      case GameStatus.AfterShowAward:
        this.afterShowAward();
        break;
      case GameStatus.ProcessFinish:
        this.processFinish();
        break;
    }

    this.isProcessComplete = false;
  }

  public setStopProcess(IsOn: boolean) {
    this._isStopProcess = IsOn;
    if (!this._isStopProcess && !this.isProcessComplete) {
      this.nextProcess();
    }
  }

  /**
   * 在 fn 執行期間自動暫停狀態機,完成(含 reject)後自動恢復。
   *
   * 用以取代各遊戲手動成對呼叫:
   *   mainGameHost.setStopProcess(true); ... mainGameHost.setStopProcess(false);
   *
   * 適合任何想在報獎/特殊轉場/收集動畫等狀態機 tick 之間插入 await 的場景:
   *
   *   await mainGameHost.runWithProcessPaused(async () => {
   *     await this.playCollectAnim();
   *     await this.refreshLabel();
   *   });
   *
   * 嵌套呼叫安全 — 內層完成不會提前釋放外層的暫停。
   */
  private _processPauseDepth = 0;
  public async runWithProcessPaused<T>(fn: () => Promise<T> | T): Promise<T> {
    this._processPauseDepth++;
    if (this._processPauseDepth === 1) {
      // 直接設旗標,不走 setStopProcess(false 那次會觸發 nextProcess() 副作用)。
      this._isStopProcess = true;
    }
    try {
      return await fn();
    } finally {
      this._processPauseDepth--;
      if (this._processPauseDepth === 0) {
        this._isStopProcess = false;
      }
    }
  }

  /**
   * 報獎開始前的 hook(預設空,子類可覆寫)。
   * 在 showAward() 流程啟動 AwardController 之前自動以暫停狀態機方式執行,
   * 子類覆寫即可在不必手動 setStopProcess 的情況下插入 await 工作。
   */
  public async onBeforeShowAward(): Promise<void> {}

  /**
   * AfterShowAward 進入 specialGame 檢查之前的 hook(預設空,子類可覆寫)。
   * 自動暫停狀態機,允許 await 收尾動畫(送禮、煙火、collect→send 等)。
   */
  public async onBeforeAfterShowAward(): Promise<void> {}

  /**
   * Spin 啟動之前的 hook(預設空,子類可覆寫)。
   * 自動暫停狀態機,允許 await 開鏡頭/UI 收合。
   */
  public async onBeforeSpin(): Promise<void> {}

  /**
   * ===== 公開 async Delegate hook =====
   * 為了讓遊戲不必 extends MainGameHost,以下 Delegate 接受 async listener。
   * 任何同節點(或場景中可取得 ref 的)Component 在 onLoad 內 insert(callback, owner),
   * 在 onDestroy 內 remove(callback, owner) 即可注入流程行為。
   * MainGameHost 會在對應時點以 runWithProcessPaused 包覆,並 await 所有 listener Promise.all。
   *
   * listener 簽章: () => Promise<void> | void
   * 多個 listener 會「並行」執行(Promise.all),如需序列請在單一 listener 內串接 await。
   */
  /** 報獎開始前(showAward 內,啟動 AwardController 之前) */
  public readonly eventBeforeShowAward: Delegate = new Delegate();
  /** AfterShowAward 進入 specialGame 檢查之前 */
  public readonly eventBeforeAfterShowAward: Delegate = new Delegate();
  /** Spin 啟動之前(updateSpinActiveTurboFlag 之後) */
  public readonly eventBeforeSpin: Delegate = new Delegate();
  /** ReadyToSpin 之前(可用於 idle 條件門控) */
  public readonly eventBeforeReadyToSpin: Delegate = new Delegate();

  public setMainGameProcessQueue() {
    this.statusQueue.clear();
    for (const Item in GameStatus) {
      if (!isNaN(Number(Item))) {
        const status: GameStatus = Number(Item);
        if (status > GameStatus.ProcessStart) {
          this.statusQueue.enqueue(status);
        }
      }
    }
  }

  public setAwardProcessQueue() {
    this.statusQueue.clear();
    for (const Item in GameStatus) {
      if (!isNaN(Number(Item))) {
        const status: GameStatus = Number(Item);
        if (status >= GameStatus.ShowAward) {
          this.statusQueue.enqueue(status);
        }
      }
    }
  }

  public setAfterShowAwardProcessQueue() {}

  /**
   * 自訂 process queue 起點。從給定 status 開始 enqueue 到 ProcessFinish。
   * 例如: setProcessQueueFromStatus(GameStatus.AfterShowAward) 從 AfterShowAward 起跑。
   */
  public setProcessQueueFromStatus(startStatus: GameStatus) {
    this.statusQueue.clear();
    for (const Item in GameStatus) {
      if (!isNaN(Number(Item))) {
        const status: GameStatus = Number(Item);
        if (status >= startStatus) {
          this.statusQueue.enqueue(status);
        }
      }
    }
  }

  public clearProcessQueue() {
    this.statusQueue.clear();
  }

  /**
   * 設定SlotGDK事件
   * @param option
   */
  private setSlotGDKEvent(option: boolean) {
    const f = option ? 'insert' : 'remove';
    SlotGDK.instance.eventPlayBgm[f](this.playMainGameBGM, this);
    SlotGDK.instance.eventSpin[f](this.onSpin, this);
    SlotGDK.instance.eventClickStop[f](
      this.wheelsManager.quickStop,
      this.wheelsManager
    );
    SlotGDK.instance.eventSetStartGameData[f](this.onSetStartGameData, this);
    SlotGDK.instance.eventShowAwardStart[f](this.onShowAwardStart, this);
    SlotGDK.instance.eventClickChangeBet[f](this.onGameChangeBet, this);
    SlotGDK.instance.eventOnOpeningFinished[f](this.onMainGameReady, this);
    SlotGDK.instance.interactionLock.eventChanged[f](
      this.onInteractionLockChanged,
      this
    );
  }

  /** 設定活動模組事件 */
  private setActivityEvent(option: boolean) {
    setActivityEventSubscription(this, option);
  }

  private clearPauseRefreshBalanceResumeTimer(): void {
    clearPauseRefreshBalanceResumeTimer(this);
  }

  /** 活動 PAUSE_REFRESH_BALANCE */
  public onActivityPauseRefreshBalance = (
    isPause: boolean,
    autoResumeAfterSec?: number
  ): void => {
    activityPauseRefreshBalance(this, isPause, autoResumeAfterSec);
  };

  /** 事件:遊戲押注變更 */
  public onGameChangeBet() {
    activityGameChangeBet(this);
  }

  /** 事件:活動取得遊戲 lineBet */
  public onActivityGetGameBet(bet: number) {
    activityGetGameBet(this, bet);
  }

  /** 事件:活動取得遊戲總押注 */
  public onActivityGetGameTotalBet(totalBet: number) {
    activityGetGameTotalBet(this, totalBet);
  }

  /** 事件:活動取得遊戲總押注(含 Scale) */
  public onActivityGetGameTotalBetWithScale(totalBet: number) {
    activityGetGameTotalBetWithScale(this, totalBet);
  }

  /** 互動鎖狀態變動 */
  public onInteractionLockChanged(isBusy: boolean) {
    activityInteractionLockChanged(this, isBusy);
  }

  /** 事件:活動中場休息開始 */
  public onIntermissionEventBegin(
    param: ActivityModule.IntermissionEventParam
  ) {
    activityIntermissionEventBegin(this, param);
  }

  /** 事件:活動中場休息結束 */
  public onIntermissionEventEnd() {
    activityIntermissionEventEnd(this);
  }

  // ===== 狀態機 flow methods(body 委派至 MainGameHostFlow)=====

  public readyToSpin(): Promise<void> {
    return flowReadyToSpin(this);
  }

  public spin(): Promise<void> {
    return flowSpin(this);
  }

  public waitForSpinRequestCallBack(): void {
    flowWaitForSpinRequestCallBack(this);
  }

  public waitForWheelStop(): void {
    flowWaitForWheelStop(this);
  }

  public wheelsAllStopped(): void {
    flowWheelsAllStopped(this);
  }

  public showAward(): Promise<void> {
    return flowShowAward(this);
  }

  public afterShowAward(): Promise<void> {
    return flowAfterShowAward(this);
  }

  public processFinish(): void {
    flowProcessFinish(this);
  }

  public checkEnterSpecialGame(
    EnterType: import('../Define/SlotGameData').SpecialGameEnterTiming,
    HaveSG: Function,
    NoSG: Function
  ) {
    if (this.specialGameAgent !== null) {
      const isHaveSpecialGame: boolean =
        this.specialGameAgent.enterSpecialGameMessage(
          EnterType,
          IsCallSpecialStart => {
            //一定有Special Game要跑
            if (IsCallSpecialStart) {
              //// SlotGDK待重構
              if (SlotGDK.instance.eventSpecialGameStarted.length)
                SlotGDK.instance.eventSpecialGameStarted.notify();
            }
            if (HaveSG !== null) {
              HaveSG();
            }
          },
          this
        );
      if (!isHaveSpecialGame) {
        if (NoSG !== null) {
          NoSG();
        }
      }
    } else {
      if (NoSG !== null) {
        NoSG();
      }
    }
  }

  // ===== Server callback handlers(body 委派至 MainGameHostServer)=====

  private onSetStartGameData() {
    handleStartGameData(this);
  }

  public setSpinData(JsonData: JSON) {
    handleSpinData(this, JsonData);
  }

  /** Fever Game Recieve */
  public setFeverGameData(JsonData: JSON): void {
    handleFeverGameData(this, JsonData);
  }

  // ===== 內部事件 handler =====

  private onSpin() {
    if (this.nowGameStatus === GameStatus.ReadyToSpin) {
      this.nextProcess();
    } else {
      if (DebugLogSetting.mainGameHost && Define.DEBUG_LOG) {
        console.log(
          '[MainGameHost] [onSpin] m_NowGameStatus(' +
            GameStatus[this.nowGameStatus] +
            ') is not ReadyToSpin.'
        );
      }
    }
  }

  /** @internal — flow helper 透過 wheelsManager.eventPrewinStart 觸發 */
  public onPrewinStart() {
    flowOnPrewinStart(this);
  }

  /** 開始報獎流程，報獎時bgm大小控制 */
  private onShowAwardStart(winType: WinType) {
    flowOnShowAwardStart(this, winType);
  }

  /** @internal — flow helper 註冊到 wheelsManager.eventFinished */
  public onWheelManagerFinish() {
    if (DebugLogSetting.mainGameHost && Define.DEBUG_LOG) {
      console.log('[MainGameHost] [onWheelManagerFinish] Dec Event');
    }
    this.wheelsManager.eventFinished.remove(this.onWheelManagerFinish, this);
    this.wheelsManager.eventPrewinStart.remove(this.onPrewinStart, this);
    if (this.nowGameStatus === GameStatus.WaitForWheelStop) {
      this.nextProcess();
    }
  }

  /** 從特殊遊戲回到MG的時候，判斷是不是要再報獎一次或是直接往下走到ProcessFinished */
  private onBackToMainGameMode(NextProcessType: SpecialGameEndProcess): void {
    flowOnBackToMainGameMode(this, NextProcessType);
  }

  /** @internal — AwardController.beforeDoBingoAlarm listener */
  public onBingoAlarmStart(): void {
    flowOnBingoAlarmStart(this);
  }

  /** @internal — AwardController.finishEvent listener */
  public onAwardProcessFinish(): void {
    AwardController.beforeDoBingoAlarm.remove(this.onBingoAlarmStart, this);
    AwardController.finishEvent.remove(this.onAwardProcessFinish, this);
    this.nextProcess();
  }

  /** 取得現在是甚麼遊戲模式 */
  public getNowPlayMode(): GamePlayMode {
    if (this.specialGameAgent !== null) {
      if (this.specialGameAgent.nowSpecialGamePlayMode) {
        return GamePlayMode.SpecialGame;
      }
    }
    return GamePlayMode.Normal;
  }

  /** 這手是不是要準備進入特殊遊戲 */
  public isReadyToEnterSG(): boolean {
    if (this.specialGameAgent !== null) {
      return this.specialGameAgent.checkReadyToEnterSpecialGame();
    }
    return false;
  }

  /** 這手需要進入特殊遊戲的鈴聲嗎 */
  public isNeedBingoAlarm(): boolean {
    if (this.specialGameAgent !== null) {
      return this.specialGameAgent.isNeedBingoAlarm();
    }
    return false;
  }

  /** MainGame BGM */
  public playMainGameBGM() {
    playMainGameBgm(this);
  }

  public fadeOutMainGameBGM() {
    fadeOutMainGameBgm(this);
  }

  public setMainGameBGMPause() {
    setMainGameBgmPause(this);
  }

  public setMainGameBGMResume() {
    setMainGameBgmResume(this);
  }

  public stopMainGameBGM() {
    stopMainGameBgm(this);
  }

  /** @internal — flow helper 用 */
  public setDelayToHideMainGameBGM() {
    if (!this._mainGameBgmAudioId) return;
    // (原邏輯為空,保留 method 給未來擴充)
  }

  /** 主遊戲開場動畫完成 */
  public onMainGameReady() {
    activityMainGameReady(this);
  }

  /** 事件:活動取得主遊戲是否就緒 */
  public onActivityGetMainGameReady(isReady: boolean) {
    activityGetMainGameReady(this, isReady);
  }
}
