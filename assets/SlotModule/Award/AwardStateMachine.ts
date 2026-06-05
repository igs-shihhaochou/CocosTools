/**
 * AwardController 的「狀態機 update」拆檔。
 *
 * 把 updateState method body 拆成 module-level function,純粹為了
 * 控制單檔行數,不改任何外部 API、@property、scene 序列化、繼承關係。
 */
import {SlotGDK} from '../Define/SlotGDK';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {AwardController, State} from './AwardController';

export function updateStateImpl(host: AwardController): void {
  switch (host.state) {
    case State.Start:
      if (DebugLogSetting.awardController) {
        console.log('[State.Start]');
      }
      if (SlotGDK.instance.eventShowAwardStart.length > 0) {
        SlotGDK.instance.eventShowAwardStart.notify(host.awardData.winType);
      }
      host.nextState();
      break;
    case State.ShowBingoFrame:
      if (host.awardData.thisWin > 0) {
        if (DebugLogSetting.awardController) {
          console.log('[State.ShowBingoFrame]');
        }
        if (AwardController.startShowBingoEvent.length > 0) {
          AwardController.startShowBingoEvent.notify(host.awardData.winType);
        }
        host.showBingoFrame(0);
      } else {
        host.nextState();
      }
      break;
    case State.ShowWin:
      if (host.awardData.thisWin > 0) {
        if (DebugLogSetting.awardController) {
          console.log('[State.ShowWin]');
        }
        host.showWinEffect();
        host.showWinNumAni();
        host.nextState();
      } else {
        host.nextState();
      }
      break;
    case State.CheckBingoFrameAndWinEnd:
      if (host.awardData && host.awardData.thisWin > 0) {
        if (DebugLogSetting.awardController) {
          console.log(
            '[State.CheckBingoFrameAndWinEnd]',
            host.isShowBingoWinEnd,
            host.isShowFirstBingoFrameEnd,
            host.awardData
          );
        }
        if (
          host.awardData.needBingoAlarm ||
          host.awardData.haveSpSymobolWin ||
          host.awardData.isSpecialGame ||
          host.awardData.waitBingoFrameEnd
        ) {
          if (host.isShowBingoWinEnd && host.isShowFirstBingoFrameEnd) {
            host.nextState();
          }
        } else {
          if (host.isShowBingoWinEnd) {
            host.nextState();
          }
        }
      } else {
        host.nextState();
      }
      break;
    case State.PlayBingoAlarmSound:
      if (host.awardData.needBingoAlarm) {
        if (DebugLogSetting.awardController && Define.DEBUG_LOG) {
          console.log(
            '[AwardController] [updateState] State.playBingoAlarmSound '
          );
        }
        if (host.waitScatterIn && !host.scatterStopped) {
          const callback = () => {
            host.stopBingoAnimation();
            host.bingoAlarmProcess();
          };
          host.onAfterScatterStopCB.push(callback);
        } else {
          host.stopBingoAnimation();
          host.bingoAlarmProcess();
        }
      } else {
        host.nextState();
      }
      break;
    case State.ShowSpecialSymbolWin:
      if (host.awardData.haveSpSymobolWin) {
        if (DebugLogSetting.awardController && Define.DEBUG_LOG) {
          console.log(
            '[AwardController] [updateState] State.showSpecialSymbolWin '
          );
        }
        host.spSymbolWinProcess();
      } else {
        host.nextState();
      }
      break;
    case State.End:
      if (DebugLogSetting.awardController) {
        console.log('[AwardController] [updateState] [State.End]');
      }
      host.removeEventRegister();
      if (SlotGDK.instance.eventShowAwardFinished.length > 0) {
        SlotGDK.instance.eventShowAwardFinished.notify();
      }
      if (AwardController.finishEvent.length > 0) {
        AwardController.finishEvent.notify();
      }
      host.scatterStopped = false;
      break;
  }
}
