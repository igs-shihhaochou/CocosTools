/**
 * MainGameHost 的「活動模組(ActivityModule)」相關事件處理。
 *
 * 把這批 handler 從 MainGameHost class 拆出來成 module-level function 是純粹為了控制
 * 單檔行數,不改任何外部 API、@property、scene 序列化、繼承關係。
 *
 * 公開介面 = MainGameHost class 上的 method;這些 helper 由 class wrapper 呼叫。
 */
import {SlotGDK} from '../Define/SlotGDK';
import {GameStatus, MainGameHost} from './MainGameHost';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import EventManager from '../../CommonModule/Script/Manager/EventManager';

/** 活動 Module 是否可用 */
function isActivityModuleAvailable(): boolean {
  return typeof ActivityModule !== 'undefined' && ActivityModule !== null;
}

/** 設定/取消活動模組事件訂閱 */
export function setActivityEventSubscription(
  host: MainGameHost,
  option: boolean
): void {
  if (!isActivityModuleAvailable()) {
    console.warn(
      '[MainGameHost] unregisterActivityEvent ActivityModule is null'
    );
    return;
  }
  const f =
    EventManager.instance[option ? 'addEventListener' : 'removeEventListener'];
  const actEvent = ActivityModule.ActivityEventName;
  // 這些 wrapper 由 host class 提供;activity 子系統只負責 register/unregister 與業務邏輯。
  f(actEvent.GET_GAME_BET, host.onActivityGetGameBet, host);
  f(actEvent.GET_GAME_TOTAL_BET, host.onActivityGetGameTotalBet, host);
  f(
    actEvent.GET_GAME_TOTAL_BET_WITH_SCALE,
    host.onActivityGetGameTotalBetWithScale,
    host
  );
  f(actEvent.INTERMISSION_EVENT_BEGIN, host.onIntermissionEventBegin, host);
  f(actEvent.INTERMISSION_EVENT_ALL_END, host.onIntermissionEventEnd, host);
  f(actEvent.GET_MAIN_GAME_READY, host.onActivityGetMainGameReady, host);
  f(actEvent.PAUSE_REFRESH_BALANCE, host.onActivityPauseRefreshBalance, host);
}

/** PAUSE_REFRESH_BALANCE: 暫停/恢復刷新餘額 + 可選自動恢復計時器 */
export function activityPauseRefreshBalance(
  host: MainGameHost,
  isPause: boolean,
  autoResumeAfterSec?: number
): void {
  clearPauseRefreshBalanceResumeTimer(host);
  PlatformData.pauseRefreshBalance = !!isPause;

  if (
    isPause &&
    autoResumeAfterSec !== undefined &&
    autoResumeAfterSec !== null
  ) {
    const sec = Number(autoResumeAfterSec);
    if (Number.isFinite(sec) && sec > 0) {
      host._pauseRefreshBalanceResumeTimerId = setInterval(() => {
        clearPauseRefreshBalanceResumeTimer(host);
        PlatformData.pauseRefreshBalance = false;
      }, sec * 1000) as unknown as number;
    }
  }
}

/** 清掉 PAUSE_REFRESH_BALANCE 自動恢復計時器 */
export function clearPauseRefreshBalanceResumeTimer(host: MainGameHost): void {
  if (host._pauseRefreshBalanceResumeTimerId !== null) {
    clearInterval(host._pauseRefreshBalanceResumeTimerId);
    host._pauseRefreshBalanceResumeTimerId = null;
  }
}

/** 遊戲押注變更 — 通知活動模組 */
export function activityGameChangeBet(_host: MainGameHost): void {
  if (!isActivityModuleAvailable()) {
    console.warn('[MainGameHost] onGameChangeBet ActivityModule is null');
    return;
  }
  EventManager.instance.dispatchEvent(
    ActivityModule.ActivityEventName.GAME_CHANGE_BET,
    PlatformData.instance.originalTotalBet,
    PlatformData.instance.currentTotalBet
  );
}

/** 活動取得遊戲 lineBet (沒給 bet=null 才回填) */
export function activityGetGameBet(_host: MainGameHost, bet: number): void {
  if (bet !== null) return;
  EventManager.instance.dispatchEvent(
    ActivityModule.ActivityEventName.GET_GAME_BET,
    PlatformData.instance.originalTotalBet,
    PlatformData.instance.currentTotalBet
  );
}

/** 活動取得遊戲總押注 */
export function activityGetGameTotalBet(
  _host: MainGameHost,
  totalBet: number
): void {
  if (totalBet !== null) return;
  totalBet = PlatformData.instance.originalTotalBet;
  EventManager.instance.dispatchEvent(
    ActivityModule.ActivityEventName.GET_GAME_TOTAL_BET,
    totalBet
  );
}

/** 活動取得遊戲總押注(含 Scale) */
export function activityGetGameTotalBetWithScale(
  _host: MainGameHost,
  totalBet: number
): void {
  if (totalBet !== null) return;
  totalBet = PlatformData.instance.currentTotalBet;
  EventManager.instance.dispatchEvent(
    ActivityModule.ActivityEventName.GET_GAME_TOTAL_BET_WITH_SCALE,
    totalBet
  );
}

/** 活動取得 MainGameReady 狀態 */
export function activityGetMainGameReady(
  host: MainGameHost,
  isReady: boolean
): void {
  if (isReady !== null && isReady !== undefined) return;
  EventManager.instance.dispatchEvent(
    ActivityModule.ActivityEventName.GET_MAIN_GAME_READY,
    host._isMainGameReady
  );
}

/**
 * 互動鎖狀態變動:busy→idle 時若已在 ReadyToSpin 且仍在 intermission,
 * 補派一次 GAME_PLAYER_IDLE 給 onIntermissionEventBegin 註冊的 listener 接續。
 */
export function activityInteractionLockChanged(
  host: MainGameHost,
  isBusy: boolean
): void {
  if (isBusy) return;
  if (!host._isIntermission) return;
  if (host.getNowGameStatus !== GameStatus.ReadyToSpin) return;
  EventManager.instance.dispatchEvent(
    PlatformData.gameEventName.GAME_PLAYER_IDLE
  );
}

/** 活動中場休息開始 */
export function activityIntermissionEventBegin(
  host: MainGameHost,
  param: ActivityModule.IntermissionEventParam
): void {
  const eventID: string = param.ID;
  host._isIntermission = true;
  if (
    host.getNowGameStatus === GameStatus.ReadyToSpin &&
    !SlotGDK.instance.interactionLock.isBusy
  ) {
    SlotGDK.instance.eventBlockAllBtn.notify(true);
    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.INTERMISSION_EVENT_GAME_READY,
      eventID
    );
    return;
  }
  // 玩家閒置时執行中場事件
  const onPlayerIdleEvent: Function = () => {
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.GAME_PLAYER_IDLE,
      onPlayerIdleEvent,
      host
    );
    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.INTERMISSION_EVENT_GAME_READY,
      eventID
    );
  };
  EventManager.instance.addEventListener(
    PlatformData.gameEventName.GAME_PLAYER_IDLE,
    onPlayerIdleEvent,
    host
  );
}

/** 活動中場休息結束 */
export function activityIntermissionEventEnd(host: MainGameHost): void {
  host._isIntermission = false;
  host.readyToSpin();
}

/** 主遊戲 Ready 通知活動模組 */
export function activityMainGameReady(host: MainGameHost): void {
  host._isMainGameReady = true;
  SlotGDK.instance.eventOnOpeningFinished.remove(host.onMainGameReady, host);
  if (isActivityModuleAvailable()) {
    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.MAIN_GAME_READY
    );
  }
}
