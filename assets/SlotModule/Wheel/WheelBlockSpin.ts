/**
 * WheelBlockController 的「Spin 流程」拆檔。
 *
 * 把 spinAll / spinAllbyInfo / spinSingle / spinSingleByMode / spinRequest
 * 等 method body 拆出,純粹為了控制單檔行數。
 */
import {
  GamePlayMode,
  WheelStatus,
  WheelRotateSetting,
  WheelDropSetting,
  WheelBlockResultArgs,
} from '../Define/SlotGameData';
import {Wheel} from './Wheel';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {WheelBlockController, PlayMode} from './WheelBlockController';
import {FeatureController} from '../Feature/FeatureController';

export function initImpl(
  host: WheelBlockController,
  WheelCtrlNo: number
): void {
  host.wheelCtrlIndex = WheelCtrlNo;
  host._wheelAmount = host.wheelAry.length;
  if (host.featureController === null) {
    host.featureController =
      host.getComponentInChildren<FeatureController>(FeatureController);
  }
  if (
    host.stopWheelSequenceAry === null ||
    host.stopWheelSequenceAry.length === 0
  ) {
    host.stopWheelSequenceAry = [];
    for (let i = 0; i < host._wheelAmount; i++) {
      host.stopWheelSequenceAry.push(i);
    }
  }
  host.wheelAry.map((curr, index) => {
    curr.init(index);
    curr.setMute(!host.needPlayAudio);
  });
  host.nowRotateInfo = host.getRotateSetting(GamePlayMode.Normal);
  host.nowDropSetting = host.getDropSetting(GamePlayMode.Normal);
  host.sortWheelStop();
  for (let i = 0; i < host._wheelAmount; i++) {
    host.wheelTweenFunc.push(null);
  }
  for (let i = 0; i < host._wheelAmount; i++) {
    if (host.needPlayAudio) {
      host.wheelAry[i].wheelStopAudioName = host.wheelStopAudioName;
    }
  }
}

/// <summary> 排序停輪的順序 */
export function sortWheelStopImpl(host: WheelBlockController): void {
  host.sortStopWheelList = [];
  host.maxSortedStopIndex = 0;
  for (let i = 0; i < host._wheelAmount; i++) {
    const index = host.sortStopWheelList.findIndex(x => {
      return x.sortIndex === host.stopWheelSequenceAry[i];
    });
    if (index === -1) {
      const item = {
        wheelIndexAry: [],
        sortIndex: host.stopWheelSequenceAry[i],
      };
      item.wheelIndexAry.push(i);
      host.sortStopWheelList.push(item);
    } else {
      host.sortStopWheelList[index].wheelIndexAry.push(i);
    }
    if (host.maxSortedStopIndex < host.stopWheelSequenceAry[i])
      host.maxSortedStopIndex = host.stopWheelSequenceAry[i];
  }
  host.sortStopWheelList.sort((a, b) => {
    return a.sortIndex - b.sortIndex;
  });
}

export function prepareSpinImpl(host: WheelBlockController): void {
  host.getSpinRequest = false;
  host._isDoQuickStop = false;
  host.isWheelFirstStopped = false;
  host.rotateWheelAry = [];
  host.resultAry = null;
  if (host.eventPrepareSpin.length > 0) {
    host.eventPrepareSpin.notify();
  }
}

export async function spinAllImpl(
  host: WheelBlockController,
  PlayModeName: GamePlayMode
): Promise<void> {
  host.isNowRotateWheel = true;
  host.prepareSpin();
  host.gameStatus = WheelStatus.StartRotate;
  if (host.wheelSpinAudioName && host.wheelSpinAudioName !== '') {
    if (host.needPlayAudio) {
      SlotGameMediator.instance.audioManager.play(host.wheelSpinAudioName);
    }
  }
  for (let i = 0; i < host._wheelAmount; i++) {
    for (let j = 0; j < host.stopWheelSequenceAry.length; j++) {
      if (host.stopWheelSequenceAry[j] === i) {
        host.spinSingleByMode(j, PlayModeName);
      }
    }
  }
  host.gameStatus = WheelStatus.Rotate;
  if (host.eventAllSpin.length > 0) {
    host.eventAllSpin.notify();
  }
  if (host.getSpinRequest) {
    host.stopAll();
  }
}

export async function spinAllbyInfoImpl(
  host: WheelBlockController,
  rotateInfo: WheelRotateSetting
): Promise<void> {
  host.isNowRotateWheel = true;
  host.prepareSpin();
  host.gameStatus = WheelStatus.StartRotate;
  for (let i = 0; i < host._wheelAmount; i++) {
    for (let j = 0; j < host.stopWheelSequenceAry.length; j++) {
      if (host.stopWheelSequenceAry[j] === i) {
        host.spinSingle(j, rotateInfo);
      }
    }
    await waitForSeconds(host.spinWheelGapTime);
  }
  host.gameStatus = WheelStatus.Rotate;
  if (host.eventAllSpin.length > 0) {
    host.eventAllSpin.notify();
  }
  if (host.getSpinRequest) {
    host.stopAll();
  }
}

export function spinSingleImpl(
  host: WheelBlockController,
  wheelIndex: number,
  TargetRotInfo: WheelRotateSetting | WheelDropSetting
): void {
  if (host.playMode === PlayMode.Rotate) {
    host.nowRotateInfo = TargetRotInfo as WheelRotateSetting;
    if (!host.nowRotateInfo) {
      if (Define.DEBUG_LOG)
        console.error(
          'console.error! ' + host.node.name + ' Have No Rotate Data!'
        );
      return;
    }
  } else if (host.playMode === PlayMode.Drop) {
    host.nowDropSetting = TargetRotInfo as WheelDropSetting;
    if (!host.nowDropSetting) {
      if (Define.DEBUG_LOG)
        console.error(
          'console.error! ' + host.node.name + ' Have No Rotate Data!'
        );
      return;
    }
  }
  const wheel: Wheel = host.wheelAry[wheelIndex];
  wheel.eventWheelStopped.remove(host.onSingleWheelStopped, host);
  wheel.eventWheelStopped.insert(host.onSingleWheelStopped, host);
  if (host.playMode === PlayMode.Rotate) {
    wheel.spin(host.nowRotateInfo, host.fakeRotSpriteCtrl, host.playMode);
  } else if (host.playMode === PlayMode.Drop) {
    wheel.spin(host.nowDropSetting, host.fakeRotSpriteCtrl, host.playMode);
  }
  host.rotateWheelAry.push(wheelIndex);
  if (host.eventSpinSingleWheel.length > 0) {
    host.eventSpinSingleWheel.notify(wheelIndex, wheel);
  }
}

export function spinRequestImpl(
  host: WheelBlockController,
  Args: WheelBlockResultArgs
): void {
  if (Args.resultAry === null) return;
  host.getSpinRequest = true;
  host.stopShowSpecialSymbolIDList = Args.scatterAry;
  host._prewinAry = Args.preWinAry;

  host._isPrewin = !(host._prewinAry === null || host._prewinAry.length === 0);

  if (host.isQuickStopSkipPrewin && PlatformData.instance.fastspin)
    host._isPrewin = false;

  host.resultAry = Args.resultAry;
  host.setFeatureData(Args.featurList);
  if (host.eventGetSpinRequest.length > 0) {
    host.eventGetSpinRequest.notify(Args);
  }
}
