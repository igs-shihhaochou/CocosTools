/**
 * AwardController 的「BingoFrame 顯示流程」拆檔。
 *
 * 把 showBingoFrameProcess / showOneBingoFrameEnd / createShowFrameList /
 * showWinEffect 四個 method body 拆成 module-level function,純粹為了
 * 控制單檔行數,不改任何外部 API、@property、scene 序列化、繼承關係。
 */
import {SlotGDK} from '../Define/SlotGDK';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import HostSetting from '../Define/HostSetting';
import {ShowFrameObj} from './AwardSet';
import {WinEffectManager} from './WinEffectManager';
import {BingoArgs, WinType, ShowMode} from '../Define/SlotGameData';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {AwardController} from './AwardController';

export function showBingoFrameProcessImpl(
  host: AwardController,
  showFrameObject: ShowFrameObj,
  firstIn = true
): void {
  if (DebugLogSetting.awardController) {
    console.log(
      '[showBingoFrameProcess]',
      firstIn,
      host.waitScatterIn,
      host.scatterStopped
    );
  }

  if (
    firstIn &&
    host.waitScatterIn &&
    SlotGameMediator.instance.mainGameHost.isReadyToEnterSG() &&
    !host.scatterStopped
  ) {
    host.onAfterScatterStopCB.push(
      host.showBingoFrameProcess.bind(host, showFrameObject, false)
    );
    if (DebugLogSetting.awardController) {
      console.warn('[AwardController] [wait showBingoFrameProcess] ');
    }
    return;
  }
  const bingoArgsList: BingoArgs[] =
    host.awardData.bingoDataList[showFrameObject.awardDataId].bingoList;
  let bingoArgs: BingoArgs = null;
  let bingoPosList: number[][] = null;
  let isShowAll = false;
  switch (HostSetting.instance.bingo.showMode) {
    case ShowMode.All:
      isShowAll = true;
      break;
    case ShowMode.AllThenLine:
      isShowAll = showFrameObject.lineId === 0;
      break;
    case ShowMode.LineThenAll:
      isShowAll = showFrameObject.lineId === bingoArgsList.length;
      break;
    default:
      if (Define.DEBUG_LOG) {
        console.warn(
          '[AwardController] [showBingoFrameProcess] Error Show Mode: ',
          HostSetting.instance.bingo.showMode
        );
      }
      break;
  }
  if (isShowAll) {
    bingoPosList =
      host.awardData.bingoDataList[showFrameObject.awardDataId]
        .allBingoSymbolPosition;
    bingoArgs = null;
    host.scheduleOnce(() => {
      host._allBingoFrameShowEnd.notify();
    }, HostSetting.instance.bingo.showDuation);
    const showGameWin =
      SlotGameMediator.instance.mainGameHost.isReadyToEnterSG() ? true : false;
    SlotGDK.instance.eventShowAllBingoFrameData.notify(
      host.awardData.thisWin,
      bingoArgsList,
      showGameWin
    );
  } else {
    if (HostSetting.instance.bingo.showMode === ShowMode.AllThenLine) {
      bingoPosList = bingoArgsList[showFrameObject.lineId - 1].bingoPosList;
      bingoArgs = bingoArgsList[showFrameObject.lineId - 1];
    } else {
      bingoPosList = bingoArgsList[showFrameObject.lineId].bingoPosList;
      bingoArgs = bingoArgsList[showFrameObject.lineId];
    }
    if (bingoArgs.lineId !== undefined) {
      SlotGDK.instance.eventShowLineBingoFrameData.notify(
        bingoArgs.lineId,
        bingoArgs.symbolId,
        bingoArgs.symbolCount,
        bingoArgs.multiplier,
        bingoArgs.win
      );
    } else if (bingoArgs.waysCount !== undefined) {
      SlotGDK.instance.eventShowWaysBingoFrameData.notify(
        bingoArgs.waysCount,
        bingoArgs.symbolId,
        bingoArgs.symbolCount,
        bingoArgs.multiplier,
        bingoArgs.win
      );
    } else {
      SlotGDK.instance.eventShowCountBingoFrameData.notify(
        bingoArgs.symbolTotalCount,
        bingoArgs.symbolId,
        bingoArgs.symbolCount,
        bingoArgs.multiplier,
        bingoArgs.win
      );
    }
  }
  showFrameObject.showBingoFrame(bingoPosList);
  showFrameObject.showWheelMask(bingoPosList);
  showFrameObject.hideOffClippingSymbol(bingoPosList);
  if (host.awardData.isSpecialGame) {
    if (host._showBingoFrameProcess) {
      host.unschedule(host._showBingoFrameProcess);
    }
    host._showBingoFrameProcess = null;
    showFrameObject.stopSGSymbolAnimation();
  }
  if (
    HostSetting.instance.bingo.dontShowAllBingoAnimationInMG === false ||
    isShowAll === false ||
    host.awardData.isSpecialGame === true
  ) {
    showFrameObject.showSymbolAnimation(
      bingoPosList,
      host.awardData.isSpecialGame
    );
  }
  host._showBingoFrameProcess = host.showOneBingoFrameEnd.bind(
    host,
    showFrameObject
  );
  host.scheduleOnce(
    host._showBingoFrameProcess,
    HostSetting.instance.bingo.showDuation
  );
}

export function showOneBingoFrameEndImpl(
  host: AwardController,
  showFrameObject: ShowFrameObj
): void {
  if (!host.awardData) {
    host.unschedule(host._showBingoFrameProcess);
    host._showBingoFrameProcess = null;
    return;
  }
  if (SlotGDK.instance.eventOneBingoLineShowFinished.length > 0) {
    SlotGDK.instance.eventOneBingoLineShowFinished.notify();
  }
  let nextlineId: number = showFrameObject.lineId + 1;
  const bingoArgsList: BingoArgs[] =
    host.awardData.bingoDataList[showFrameObject.awardDataId].bingoList;
  let bingoPosList: number[][] = null;
  if (showFrameObject.lineId > 0) {
    bingoPosList = bingoArgsList[showFrameObject.lineId - 1].bingoPosList;
  } else {
    bingoPosList =
      host.awardData.bingoDataList[showFrameObject.awardDataId]
        .allBingoSymbolPosition;
  }
  if (nextlineId >= bingoArgsList.length + 1) {
    nextlineId = 0;
  }
  showFrameObject.stopSymbolAnimation(
    bingoPosList,
    host.awardData.isSpecialGame
  );
  showFrameObject.hideBingoFrame();
  if (
    PlatformData.instance.autospin &&
    HostSetting.instance.bingo.skipLineWhenAutoEnabled
  ) {
    showFrameObject.hideWheelMask();
    showFrameObject.showOffClippingSymbol();
    host._showBingoFrameProcess = null;
    return;
  }
  showFrameObject.lineId = nextlineId;
  host._showBingoFrameProcess = host.showBingoFrameProcess.bind(
    host,
    showFrameObject
  );
  host.scheduleOnce(
    host._showBingoFrameProcess,
    HostSetting.instance.bingo.hideDuration
  );
}

export function createShowFrameListImpl(bingoList: BingoArgs[]): number[][] {
  const allBingoFrameAry: number[][] = [];
  if (
    bingoList === null ||
    bingoList.length <= 0 ||
    bingoList[0].bingoPosList === null
  ) {
    return allBingoFrameAry;
  }
  for (let i = 0; i < bingoList[0].bingoPosList.length; i++) {
    const posAry: number[] = bingoList[0].bingoPosList[i];
    const ary: number[] = [];
    for (let j = 0; j < ary.length; j++) ary.push(posAry[j]);
    allBingoFrameAry.push(ary);
  }
  for (let i = 0; i < bingoList.length; i++) {
    const bingoArgs: BingoArgs = bingoList[i];
    for (
      let wheelIndex = 0;
      wheelIndex < bingoArgs.bingoPosList.length;
      wheelIndex++
    ) {
      for (
        let frameIndex = 0;
        frameIndex < bingoArgs.bingoPosList[wheelIndex].length;
        frameIndex++
      ) {
        if (bingoArgs.bingoPosList[wheelIndex][frameIndex] > 0) {
          allBingoFrameAry[wheelIndex][frameIndex] = 1;
        } else if (
          HostSetting.instance.bingo.useWheelMask &&
          allBingoFrameAry[wheelIndex][frameIndex] !== 1
        ) {
          allBingoFrameAry[wheelIndex][frameIndex] = -1;
        }
      }
    }
  }
  return allBingoFrameAry;
}

export async function showWinEffectImpl(host: AwardController): Promise<void> {
  let delay = 0;
  switch (host.awardData.winType) {
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
  WinEffectManager.finishEvent.insert(host.winEffectPlayFinish, host);
  await waitForSeconds(delay);
  if (AwardController.startWinEffectEvent.length > 0) {
    AwardController.startWinEffectEvent.notify();
  }
  host.winEffectManager.playEffect(host.awardData);
}
