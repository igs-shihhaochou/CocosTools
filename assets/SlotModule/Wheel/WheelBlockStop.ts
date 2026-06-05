/**
 * WheelBlockController 的「停輪 / quickStop」流程拆檔。
 *
 * 把 doAllStop / doWheelsStop / stopAll / doQuickStop / stopSingle /
 * stopSingleDelay / callNextWheelReadyToStop / allStopped /
 * onSingleWheelStopped / onSingleWheelSymbolsPlay 等 method body 拆出,
 * 純粹為了控制單檔行數,不改任何外部 API。
 */
import {
  GamePlayMode,
  WheelStatus,
  FeatureType,
  SymbolInfomation,
} from '../Define/SlotGameData';
import {Status, Wheel} from './Wheel';
import {Symbol} from './Symbol';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {SlotGDK} from '../Define/SlotGDK';
import HostSetting from '../Define/HostSetting';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {TimeManager} from '../../CommonModule/Script/Define/GlobalSetting';
import {WheelBlockController, PlayMode} from './WheelBlockController';

export async function doAllStopImpl(host: WheelBlockController): Promise<void> {
  let stopDelayTime = 0;
  if (host.playMode === PlayMode.Rotate) {
    stopDelayTime =
      SlotGDK.instance.fastSpin &&
      SlotGameMediator.instance.mainGameHost.getNowPlayMode() ===
        GamePlayMode.Normal
        ? host.nowRotateInfo.readyToFastStopDelayTime
        : host.nowRotateInfo.readyToStopDelayTime;
  } else if (host.playMode === PlayMode.Drop) {
    stopDelayTime =
      SlotGDK.instance.fastSpin &&
      SlotGameMediator.instance.mainGameHost.getNowPlayMode() ===
        GamePlayMode.Normal
        ? host.nowDropSetting.readyToFastStopDelayTime
        : host.nowDropSetting.readyToStopDelayTime;
  }
  host.gameStatus = WheelStatus.ReadyToStop;
  for (let i = 0; i < host.wheelAmount; i++) {
    if (
      host.wheelAry[i].wheelStatus !== Status.Stop &&
      host.wheelAry[i].wheelStatus !== Status.Idle
    ) {
      host.wheelAry[i].readyToStop();
    }
  }
  if (host.isDoQuickStop) {
    host.doQuickStop();
  } else {
    host.doWheelsStop(stopDelayTime);
  }
}

export function doWheelsStopImpl(
  host: WheelBlockController,
  delayTime = 0
): void {
  if (Define.DEBUG_LOG && DebugLogSetting.wheelBlockController)
    console.log(
      '[WheelControllerEx][DoWheelsStop] Prepare Stop (Index = ' +
        host.stopIndex +
        ')' +
        '==============================='
    );
  let isThisWheelStopped = false;
  const WheelItem = host.sortStopWheelList.find(a => {
    return a.sortIndex === host.stopIndex;
  });
  let wheelList: number[] = [];
  if (WheelItem) {
    wheelList = WheelItem.wheelIndexAry;
  }
  for (let i = 0, count: number = wheelList.length; i < count; i++) {
    const wheelIndex = wheelList[i];
    let gapTime = 0;
    if (host.playMode === PlayMode.Rotate) {
      gapTime = host.nowRotateInfo.wheelStopGapTime;
    } else if (host.playMode === PlayMode.Drop) {
      gapTime = host.nowDropSetting.wheelStopGapTime;
    }
    if (
      SlotGDK.instance.fastSpin &&
      SlotGameMediator.instance.mainGameHost.getNowPlayMode() ===
        GamePlayMode.Normal
    ) {
      gapTime = gapTime / host.fastSpinSpeedMultiple;
    }
    if (
      host.playMode === PlayMode.Rotate &&
      host.wheelAry[wheelIndex].nowRotateInfo
    ) {
      gapTime = host.wheelAry[wheelIndex].nowRotateInfo.wheelStopGapTime;
    } else if (
      host.playMode === PlayMode.Drop &&
      host.wheelAry[wheelIndex].nowDropSetting
    ) {
      gapTime = host.wheelAry[wheelIndex].nowDropSetting.wheelStopGapTime;
    }
    let wheelDelayTime = 0;
    const wheelStatus: Status = host.wheelAry[wheelIndex].wheelStatus;
    if (
      wheelStatus !== Status.Idle &&
      Number(wheelStatus) < Number(Status.Stopping)
    ) {
      const _isWheelHavePrewin =
        host.isPrewin && host._prewinAry[wheelIndex] === 1;
      if (_isWheelHavePrewin) {
        const _preiwnInfo = host.getRotateSetting(GamePlayMode.Prewin);
        host.showPrewin(wheelIndex);
        wheelDelayTime += _preiwnInfo.wheelStopGapTime;
      } else {
        if (host.stopIndex > 0) {
          wheelDelayTime = delayTime + gapTime;
        } else {
          wheelDelayTime = delayTime;
        }
      }
      if (Define.DEBUG_LOG && DebugLogSetting.wheelBlockController)
        console.log(
          '[WheelControllerEx][DoWheelsStop] StopIndex = ' +
            host.stopIndex +
            ' | WheelStatus(' +
            wheelIndex +
            ') = ' +
            host.wheelAry[wheelIndex].wheelStatus +
            ' | Delay ' +
            wheelDelayTime +
            ' sec To Stop!'
        );
      let isNextWheelHavePrewin = false;
      if (host._isPrewin && host.stopIndex + 1 <= host.maxSortedStopIndex) {
        const nextPrewinWheelItem = host.sortStopWheelList.find(a => {
          return a.sortIndex === host.stopIndex + 1;
        });
        if (nextPrewinWheelItem) {
          isNextWheelHavePrewin =
            host._prewinAry[nextPrewinWheelItem.wheelIndexAry[0]] === 1;
        }
      }
      const isCallNextStop: boolean =
        !host.isDoQuickStop &&
        !isNextWheelHavePrewin &&
        !_isWheelHavePrewin &&
        host.stopIndex < host.maxSortedStopIndex &&
        i === 0;
      host.stopSingleDelay(
        wheelDelayTime,
        wheelIndex,
        host.resultAry[wheelIndex],
        isCallNextStop
      );
    } else {
      isThisWheelStopped = true;
    }
  }
  if (host.stopIndex <= host.maxSortedStopIndex) {
    host.stopIndex++;
    if (Define.DEBUG_LOG && DebugLogSetting.wheelBlockController)
      console.log(
        '[WheelControllerEx][DoWheelsStop] m_StopIndex++, m_StopIndex=' +
          host.stopIndex
      );
    if (isThisWheelStopped) {
      host.doWheelsStop(0);
    }
  } else {
    if (Define.DEBUG_LOG && DebugLogSetting.wheelBlockController)
      console.log(
        '[WheelControllerEx][DoWheelsStop] StopIndex = ' +
          host.stopIndex +
          ' is Larger than MaxSortedStopIndex(' +
          host.maxSortedStopIndex +
          '), please check Wheel StopIndex or Call AllStopped()'
      );
  }
}

export function stopSingleDelayImpl(
  host: WheelBlockController,
  delayTime: number,
  wheelIndex: number,
  resultAry: number[],
  isCallNextStop = true
): void {
  if (HostSetting.instance.gameSetting.isUseShutter) {
    host.hideSingleWheel(wheelIndex);
  }

  host.wheelTweenFunc[wheelIndex] = host.stopSingle.bind(
    host,
    wheelIndex,
    resultAry,
    isCallNextStop
  );
  host.scheduleOnce(host.wheelTweenFunc[wheelIndex], delayTime);
}

export function stopSingleImpl(
  host: WheelBlockController,
  wheelIndex: number,
  resultAry: number[],
  isCallNextStop = true
): void {
  if (host.wheelTweenFunc[wheelIndex]) {
    host.unschedule(host.wheelTweenFunc[wheelIndex]);
    host.wheelTweenFunc[wheelIndex] = null;
  }
  const _resultInfoAry: SymbolInfomation[] = host.getSymbolArrayInfo(resultAry);
  const wheel: Wheel = host.wheelAry[wheelIndex];
  wheel.stop(_resultInfoAry);
  host.waitforStopWheelAry.push(wheelIndex);
  if (isCallNextStop) {
    host.callNextWheelReadyToStop(wheelIndex);
  }
}

export function callNextWheelReadyToStopImpl(
  host: WheelBlockController,
  wheelIndex: number
): void {
  if (host.rotateWheelAry.length > 0) {
    const isWheelHavePrewin: boolean =
      host._isPrewin && host._prewinAry[wheelIndex] === 1;
    if (host.eventDoCustomNextStop.length > 0) {
      host.eventDoCustomNextStop.notify(
        wheelIndex,
        host.isDoQuickStop,
        isWheelHavePrewin
      );
    } else {
      if (host.isDoQuickStop) {
        host.doQuickStop();
      }
      host.doWheelsStop(0);
    }
  }
}

export function doQuickStopImpl(host: WheelBlockController): void {
  host._isDoQuickStop = true;
  if (host.gameStatus !== WheelStatus.ReadyToStop) {
    return;
  }
  if (
    host.checkHaveFeature(FeatureType.Rotating) ||
    host.checkHaveFeaturePlayingByType(FeatureType.Rotating)
  ) {
    return;
  }
  const stopWheelAmount = host.wheelAmount - host.rotateWheelAry.length;
  for (let i: number = stopWheelAmount; i < host.wheelAmount; i++) {
    const wheelItem = host.sortStopWheelList.find(a => {
      return a.sortIndex === i;
    });
    let wheelList: number[] = [];
    if (wheelItem) {
      wheelList = wheelItem.wheelIndexAry;
    }
    for (let j = 0; j < wheelList.length; j++) {
      const wheelIndex: number = wheelList[j];
      const isWheelHavePrewin: boolean =
        host._isPrewin && host._prewinAry[wheelIndex] === 1;
      const status: Status = host.wheelAry[wheelIndex].wheelStatus;
      if (isWheelHavePrewin) {
        if (status < Status.ReadyToStop) {
          host.doWheelsStop(0);
        }
        return;
      } else {
        if (
          status === Status.Stopping ||
          status === Status.Stop ||
          status === Status.Idle ||
          status === Status.BreakToBound
        ) {
          continue;
        }
        if (host.rotateWheelAry[i] < host._wheelAmount - 1) {
          const nextWheelIndex: number =
            host.sortStopWheelList[host.rotateWheelAry[i] + 1].wheelIndex;
          const isNextWheelHavePrewin: boolean =
            host._isPrewin && host._prewinAry[nextWheelIndex] === 1;
          if (!isNextWheelHavePrewin) {
            host.wheelAry[host.rotateWheelAry[i]].setNoStopWheelSound();
          }
        }
        if (host.wheelTweenFunc[wheelIndex]) {
          host.unschedule(host.wheelTweenFunc[wheelIndex]);
          host.wheelTweenFunc[wheelIndex] = null;
        }
        if (host._isPrewin) {
          host.stopSingleDelay(
            0.1 * (i - stopWheelAmount),
            wheelIndex,
            host.resultAry[wheelIndex],
            false
          );
        } else {
          host.stopSingleDelay(
            host.quickStopGapTime * (i - stopWheelAmount),
            wheelIndex,
            host.resultAry[wheelIndex],
            false
          );
        }
      }
    }
  }
}

export function allStoppedImpl(host: WheelBlockController): void {
  host.gameStatus = WheelStatus.AllStopped;
  if (host.eventAllStopped.length > 0) {
    host.eventAllStopped.notify(host.wheelCtrlIndex);
  }
  if (host.checkHaveFeature(FeatureType.End)) {
    host.waitFeatureCoroutine = host.doWaitEndFeatureFinished();
  } else {
    host.waitFeatureCoroutine = host.doCheckSingleFeatureFinished();
  }
}

export function onSingleWheelSymbolsPlayImpl(
  host: WheelBlockController,
  wheelIndex: number,
  sortedSymbolAry: Wheel[]
): boolean {
  const isHadSpecialShow = !(
    host.stopShowSpecialSymbolIDList === null ||
    host.stopShowSpecialSymbolIDList.length === 0
  );
  if (host.eventCheckAndShowCustomStopEffect.length > 0) {
    host.eventCheckAndShowCustomStopEffect.notify(
      host.wheelAry[wheelIndex],
      sortedSymbolAry,
      isHadSpecialShow ? host.stopShowSpecialSymbolIDList[wheelIndex] : null
    );
    return true;
  }
  return false;
}

export async function doWaitFeatureFinishedImpl(
  host: WheelBlockController,
  featureSectionType: FeatureType
): Promise<void> {
  let isPlaying = true;
  while (isPlaying) {
    isPlaying = host.featureController.playFeatureProcess(
      featureSectionType,
      host.resultAry
    );
    if (isPlaying) {
      while (host.checkHaveFeaturePlayingByType(featureSectionType)) {
        await waitForSeconds(TimeManager.FixedTimestep);
      }
    }
    await waitForSeconds(TimeManager.FixedTimestep);
  }
}

export function onSingleWheelStoppedImpl(
  host: WheelBlockController,
  wheelIndex: number,
  sortedSymbolAry: Symbol[]
): void {
  host.wheelAry[wheelIndex].eventWheelStopped.remove(
    host.onSingleWheelStopped,
    host
  );
  if (host._prewinAry && host._prewinAry.length > wheelIndex) {
    if (host._prewinAry[wheelIndex] === 1) {
      host.hidePrewin(wheelIndex);
    }
  }
  if (
    host.checkHaveFeature(FeatureType.SingleEnd) ||
    host.checkHaveFeaturePlayingByType(FeatureType.SingleEnd)
  ) {
    host.featureController.playSingleEndFeature(
      !host.isWheelFirstStopped,
      wheelIndex,
      FeatureType.SingleEnd,
      null
    );
  }
  if (!host.isWheelFirstStopped) {
    if (host.eventFirstWheelStopped.length > 0) {
      host.eventFirstWheelStopped.notify(
        host.wheelCtrlIndex,
        wheelIndex,
        sortedSymbolAry
      );
    }
  }
  if (host.eventSingleWheelStopped.length > 0) {
    host.eventSingleWheelStopped.notify(
      host.wheelCtrlIndex,
      wheelIndex,
      sortedSymbolAry
    );
  }
  host.isWheelFirstStopped = true;
  host.rotateWheelAry = host.rotateWheelAry.filter(x => {
    return x !== wheelIndex;
  });
  if (host.rotateWheelAry.length === 0) {
    host.allStopped();
  } else {
    const isWheelHavePrewin: boolean =
      host.isPrewin && host._prewinAry[wheelIndex] === 1;
    let isNextWheelHavePrewin = false;
    let passThisWheelCheck = false;
    if (host.isPrewin) {
      const thisWheelItem = host.sortStopWheelList.find(a => {
        return a.wheelIndexAry.includes(wheelIndex);
      });
      const nextPrewinWheelItem = host.sortStopWheelList.find(a => {
        return a.sortIndex === thisWheelItem.sortIndex + 1;
      });
      if (thisWheelItem.wheelIndexAry[0] !== wheelIndex) {
        passThisWheelCheck = true;
      }
      if (nextPrewinWheelItem) {
        isNextWheelHavePrewin =
          host._prewinAry[nextPrewinWheelItem.wheelIndexAry[0]] === 1;
      }
    }
    if (!passThisWheelCheck) {
      if (isWheelHavePrewin || isNextWheelHavePrewin) {
        host.callNextWheelReadyToStop(wheelIndex);
      }
    }
  }
}
