/**
 * MainGameHost 的「狀態機 flow body」拆檔。
 *
 * 把 readyToSpin / spin / waitForWheelStop / wheelsAllStopped /
 * showAward / afterShowAward / processFinish 等方法的 body 拆成
 * module-level function,純粹為了控制單檔行數,不改任何外部 API、@property、
 * scene 序列化、繼承關係。
 *
 * 公開介面 = MainGameHost class 上的 method;這些 helper 由 class wrapper 呼叫。
 */
import {SlotGDK} from '../Define/SlotGDK';
import {
  SlotGameDataEx,
  GamePlayMode,
  WinType,
  SpecialGameEnterTiming,
  SpecialGameEndProcess,
} from '../Define/SlotGameData';
import {AwardController} from '../Award/AwardController';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import EventManager from '../../CommonModule/Script/Manager/EventManager';
import HostSetting from '../Define/HostSetting';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {MainGameHost} from './MainGameHost';

/**
 * 並行 await 一個 Delegate 上所有 listener 的 Promise(支援同步 listener)。
 *
 * NOTE(脆弱性):這裡透過 cast 讀 Delegate._callbacks(CommonModule 的 private)
 * 是因為 Delegate 目前沒有公開的 forEach API,而 Delegate 是被 50 款遊戲共用的
 * 基礎類別,改 Delegate 風險太高。若 Delegate 內部欄位日後改名,這個 cast 會
 * 變成 silent no-op(Promise.all 跑空陣列,listener 不會被觸發)。下次有機會
 * 改 CommonModule 時請在 Delegate 加 public forEach(cb) 並改用該 API。
 */
export async function notifyDelegateAsync(
  delegate: Delegate,
  ...args: unknown[]
): Promise<void> {
  if (!delegate || delegate.length === 0) return;
  const callbacks: {func: Function; owner: unknown}[] =
    (delegate as unknown as {_callbacks: {func: Function; owner: unknown}[]})
      ._callbacks ?? [];
  if (callbacks.length === 0) return;
  await Promise.all(
    callbacks.map(c => Promise.resolve(c.func.apply(c.owner, args)))
  );
}

export async function flowReadyToSpin(host: MainGameHost): Promise<void> {
  host.hasRecovery = false;
  if (host.eventBeforeReadyToSpin.length > 0) {
    await host.runWithProcessPaused(() =>
      notifyDelegateAsync(host.eventBeforeReadyToSpin)
    );
  }
  if (host._isIntermission) {
    SlotGDK.instance.eventBlockAllBtn.notify(true);
    // 只有真正 idle（且互動鎖放掉）時才派發 GAME_PLAYER_IDLE；
    // 若仍 busy，交由 onInteractionLockChanged 在鎖釋放時補派一次。
    if (!SlotGDK.instance.interactionLock.isBusy) {
      EventManager.instance.dispatchEvent(
        PlatformData.gameEventName.GAME_PLAYER_IDLE
      );
    }
  } else {
    if (SlotGDK.instance.eventReadyToSpin.length > 0) {
      SlotGDK.instance.eventReadyToSpin.notify();
    }
  }
}

export async function flowSpin(host: MainGameHost): Promise<void> {
  if (DebugLogSetting.mainGameHost) {
    console.log('spin playMainGameBGM');
  }
  if (PlatformData.useCert && PlatformData.licenseSetting.isDelay) {
    host.spinStartTime = Date.now();
  }
  host.playMainGameBGM();

  // 舊版相容處理，避免舊遊戲複寫wheelsManager.spin，導致快停功能異常(之後應該要拿掉) 2025/08/12 by LIU
  host.wheelsManager.updateSpinActiveTurboFlag();

  // 重要: 只有真有 listener 才走 runWithProcessPaused,避免空 hook 也觸發
  // setStopProcess(true→false) 讓 nextProcess() 提前推進狀態機(會跟下面
  // 顯式的 host.nextProcess() 疊加,造成多走一格)。
  if (host.eventBeforeSpin.length > 0) {
    await host.runWithProcessPaused(async () => {
      await host.onBeforeSpin();
      await notifyDelegateAsync(host.eventBeforeSpin);
    });
  } else {
    await host.onBeforeSpin();
  }

  host.wheelsManager.spin();
  host.awardController.reset();

  host.nextProcess();
}

export function flowWaitForSpinRequestCallBack(_host: MainGameHost): void {
  if (typeof ActivityModule !== 'undefined' && ActivityModule !== null) {
    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.GAME_PLAYER_CLICK_BET
    );
  }
}

export function flowWaitForWheelStop(host: MainGameHost): void {
  if (SlotGDK.instance.eventWaitForWheelStop.length > 0) {
    SlotGDK.instance.eventWaitForWheelStop.notify();
  }

  host.checkEnterSpecialGame(SpecialGameEnterTiming.WheelRotating, null, () => {
    if (DebugLogSetting.mainGameHost && Define.DEBUG_LOG) {
      console.log('[MainGameHost] [waitForWheelStop]  Add Event');
    }
    host.wheelsManager.eventFinished.insert(host.onWheelManagerFinish, host);
    host.wheelsManager.eventPrewinStart.insert(host.onPrewinStart, host);
  });

  if (
    HostSetting.instance.gameSetting.quickStopWhenFastSpin &&
    SlotGDK.instance.fastSpin
  ) {
    host.wheelsManager.quickStop();
  }
}

export function flowWheelsAllStopped(host: MainGameHost): void {
  if (SlotGDK.instance.eventWheelStop.length > 0) {
    SlotGDK.instance.eventWheelStop.notify();
  }
  host.nextProcess();
}

export async function flowShowAward(host: MainGameHost): Promise<void> {
  if (host.eventBeforeShowAward.length > 0) {
    await host.runWithProcessPaused(async () => {
      await host.onBeforeShowAward();
      await notifyDelegateAsync(host.eventBeforeShowAward);
    });
  } else {
    await host.onBeforeShowAward();
  }
  const showAwardFunc = () => {
    AwardController.finishEvent.insert(host.onAwardProcessFinish, host);
    AwardController.beforeDoBingoAlarm.insert(host.onBingoAlarmStart, host);
    host.awardController.doStart();
  };
  //檢查是否顯示贏分上限
  SlotGDK.instance.eventCheckMaxWin.notify(
    SlotGameDataEx.instance.spinData,
    showAwardFunc
  );
}

export async function flowAfterShowAward(host: MainGameHost): Promise<void> {
  if (host.eventBeforeAfterShowAward.length > 0) {
    await host.runWithProcessPaused(async () => {
      await host.onBeforeAfterShowAward();
      await notifyDelegateAsync(host.eventBeforeAfterShowAward);
    });
  } else {
    await host.onBeforeAfterShowAward();
  }
  host.checkEnterSpecialGame(
    SpecialGameEnterTiming.AfterShowAward,
    () => {
      host.awardController.onEnterSpGameBtnClick();
      host.wheelsManager.setWheelBlocksHideOverFrameSymbol(); //despawn top symbols
    },
    () => {
      host.wheelsManager.setPlayMode(GamePlayMode.Normal);
      host.nextProcess();
    }
  );
}

export function flowProcessFinish(host: MainGameHost): void {
  if (
    PlatformData.useCert &&
    PlatformData.licenseSetting.isDelay &&
    PlatformData.licenseClientModeSetting.delayTime.length > 0
  ) {
    const spinEndTime = Date.now();
    const totalSpinTime = (spinEndTime - host.spinStartTime) / 1000;
    const delayTime = PlatformData.licenseClientModeSetting.delayTime[0];
    if (totalSpinTime < delayTime) {
      const delay = delayTime - totalSpinTime;
      host.scheduleOnce(() => {
        host.processFinish();
      }, delay);
      return;
    }
  }
  if (SlotGDK.instance.eventProcessFinish.length > 0) {
    SlotGDK.instance.eventProcessFinish.notify();
  }
  host.setDelayToHideMainGameBGM();
  host.setMainGameProcessQueue();
  host.nextProcess();
}

/** 開始報獎流程，報獎時bgm大小控制 */
export function flowOnShowAwardStart(host: MainGameHost, winType: WinType) {
  if (host.autoFade && winType >= WinType.BigWin) host.fadeOutMainGameBGM();
}

export function flowOnPrewinStart(host: MainGameHost): void {
  if (host.autoFade) host.fadeOutMainGameBGM();
}

export function flowOnBingoAlarmStart(host: MainGameHost): void {
  if (host.autoFade) host.fadeOutMainGameBGM();
  if (host.specialGameAgent !== null) {
    host.specialGameAgent.onWhenSpecialAlarm();
  }
}

/** 從特殊遊戲回到MG的時候，判斷是不是要再報獎一次或是直接往下走到ProcessFinished */
export function flowOnBackToMainGameMode(
  host: MainGameHost,
  nextProcessType: SpecialGameEndProcess
): void {
  host._isStopProcess = false;
  PlatformData.instance.isBonusPlay = false;
  if (SlotGDK.instance.eventSpecialGameEnded.length > 0) {
    SlotGDK.instance.eventSpecialGameEnded.notify();
  }
  host.playMainGameBGM();
  host.wheelsManager.setPlayMode(GamePlayMode.Normal);
  //reset queue
  if (nextProcessType === SpecialGameEndProcess.NeedShowAward) {
    host.setAwardProcessQueue();
    host.nextProcess();
  } else if (nextProcessType === SpecialGameEndProcess.NeedAfterShowAward) {
    host.setAfterShowAwardProcessQueue();
    host.nextProcess();
  } else {
    host.scheduleOnce(host.nextProcess.bind(host), host.sGtoMGNeedDelayTime);
  }
}
