import {ClickOKHandle} from './MessagePopup';
import {BottomBar} from './BottomBar';
import CustomCmdSender from './CustomCmdSender';
import {PopupRoot} from './PopupRoot';
import HostSetting from '../../SlotModule/Define/HostSetting';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {
  GamePlayMode,
  SpecialGameState,
  StartGameExArgs,
} from '../../SlotModule/Define/SlotGameData';
import {
  Define,
  ErrorCode,
} from '../../CommonModule/Script/Define/GlobalSetting';
import Functions from '../../CommonModule/Script/Utility/Functions';
import {MultLang} from '../../SlotModule/UIComponent/MultLang';
import TopViewManager from '../../0_Common/Script/Game/Manager/TopViewManager';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {GameStatus} from '../../SlotModule/Host/MainGameHost';
import {
  EventGameFlow,
  PlatformGDK,
  SlotUIFunc,
} from '../../CommonModule/Script/Platform/PlatformGDK';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {UserInfo} from '../../CommonModule/Script/Define/UserInfo';
import {MessageType} from './UIComponent/SystemMessageUI';
import EventManager from '../../CommonModule/Script/Manager/EventManager';
import FunctionManager from '../../CommonModule/Script/Manager/FunctionManager';
import MacrossClient from '../../CommonModule/Script/Network/Macross/MacrossClient';
import BQLogger from '../../CommonModule/Script/Log/BQLog/BQLogger';
import GameClient, {
  enumFromType,
} from '../../CommonModule/Script/Network/GameClient';
import {
  Component,
  resources,
  type Prefab,
  instantiate,
  log,
  sys,
  Button,
  Vec2,
  Node,
  _decorator,
  input,
  Input,
  type EventKeyboard,
  KeyCode,
  Vec3,
  CCBoolean,
} from 'cc';
import {getWorldSpaceAR} from '../../CommonModule/Script/Utility/NodeProperty';
const {ccclass, property} = _decorator;
export enum UserProtectStatus {
  Wait,
  CanSpin,
  CanStop,
  CanStart,
}

export enum SpinStatus {
  Spin,
  Stop,
  Skip,
  Start,
  AutoSpin,
  BlockSpin,
  BlockStop,
  SpecialGame,
  ShowAward,
  HideSpin,
}

@ccclass('InputController')
export class InputController extends Component {
  @property(Node)
  private uiRoot: Node = null;
  @property(CCBoolean)
  private hasInGameJP = false;

  public bottomBar: BottomBar = null;
  public popupRoot: PopupRoot = null;

  private isFreeGameBarShowing = false;

  private userProtectStatus: UserProtectStatus = UserProtectStatus.Wait;

  private beforeSpinBtnStatus: SpinStatus = SpinStatus.Spin;
  private spinBtnStatus: SpinStatus = SpinStatus.Spin;

  private resetWinNumberFunction: Function = null;

  private fastSpinFunction: Function = null;

  private blockShowPopupFlag = true; //可不可以打開popup的Flag

  private isAutoSpin = false;

  /** 是否為Spin前同步資產 */
  private needSyncAssetBeforeSpin = false;
  private isWin = false;
  private showInternetUnstableTipID = -1;
  private showInternetUnstableTipTime = 5; //網路不穩提示的顯示時間

  private isJackpot = false;
  private isClickedStop = false;

  private spinFunction: Function = null;
  @property(CCBoolean)
  private useLegiInfoPage = false;

  protected onLoad(): void {
    this.spinFunction = this.startSpin.bind(this, null);

    PlatformGDK.instance.showPopUpMessage.insert(
      this.showPopupMessageByErrorCode,
      this
    );

    PlatformGDK.instance.receiveStartGameData.insert(
      this.receiveStartGameData,
      this
    );

    PlatformGDK.instance.connectServerReady.insert(
      this.connectServerReady,
      this
    );
    PlatformGDK.instance.commandDataIsNull.insert(this.CommandDataIsNull, this);
    PlatformGDK.instance.commandErrorHandler.insert(this.CommandError, this);
    PlatformGDK.instance.rollGameWin.insert(this.ShowWinAnimCount, this);
    PlatformGDK.instance.registerFunction(
      SlotUIFunc.GetDownBarGameWin,
      this.getDownBarGameWin.bind(this)
    );
    SlotGDK.instance.receiveSpinData.insert(this.receiveSpinData, this);
    SlotGDK.instance.receiveFeverData.insert(this.ReceiveFeverGameData, this);
    SlotGDK.instance.receiveDoubleGameData.insert(
      this.ReceiveDoubleGameData,
      this
    );
    SlotGDK.instance.eventActiveExtraBetBtn.insert(
      this.activeExtraBetBtn,
      this
    );
    SlotGDK.instance.eventActiveFreeGameBar.insert(
      this.activeFreeGameBar,
      this
    );
    SlotGDK.instance.eventActiveTakeBtn.insert(this.activeSkipBtn, this);
    SlotGDK.instance.eventActiveSpinBtn.insert(this.activeSpinBtn, this);
    SlotGDK.instance.eventClearBingoData.insert(this.clearBingoData, this);
    SlotGDK.instance.eventClickExtraBet.insert(this.showExtraBetEffect, this);

    SlotGDK.instance.eventHideSpinBtn.insert(this.hideSpinBtn, this);
    SlotGDK.instance.eventIsRecoveryStatus.insert(this.onRecoverStatus, this);
    SlotGDK.instance.eventReadyToSpin.insert(this.onReadyToSpin, this);
    SlotGDK.instance.eventSetFreeGameBarSpinTimes.insert(
      this.SetFreeGameBarSpinTimes,
      this
    );
    SlotGDK.instance.eventSetFreeGameBarText.insert(
      this.SetFreeGameBarSpinTimesByString,
      this
    );
    SlotGDK.instance.eventShowAllBingoFrameData.insert(
      this.ShowAllBingoFrameData,
      this
    );
    SlotGDK.instance.eventShowAwardFinished.insert(
      this.onShowAwardFinished,
      this
    );
    SlotGDK.instance.eventShowAwardStart.insert(this.onShowAwardStart, this);
    SlotGDK.instance.eventShowCountBingoFrameData.insert(
      this.ShowCountBingoFrameData,
      this
    );
    SlotGDK.instance.eventShowEnterSpecialGameBtn.insert(
      this.activeEnterSpecialGameMsg,
      this
    );
    SlotGDK.instance.eventShowLineBingoFrameData.insert(
      this.ShowLineBingoFrameData,
      this
    );
    SlotGDK.instance.eventShowRetriggerMessage.insert(
      this.showRetriggerMessage,
      this
    );
    SlotGDK.instance.eventShowWaysBingoFrameData.insert(
      this.ShowWaysBingoFrameData,
      this
    );
    SlotGDK.instance.eventShowWinAnimCount.insert(this.ShowWinAnimCount, this);
    SlotGDK.instance.eventSpecialGameEnded.insert(
      this.onSpecialGameEnded,
      this
    );
    SlotGDK.instance.eventSpecialGameStarted.insert(
      this.onSpecialGameStarted,
      this
    );
    SlotGDK.instance.eventStopAutoSpin.insert(this.onStopAutoSpin, this);
    SlotGDK.instance.eventWaitForWheelStop.insert(
      this.onWaitForWheelStop,
      this
    );
    SlotGDK.instance.eventWheelStop.insert(this.onWheelAllStop, this);

    SlotGDK.instance.eventIniAutoSelectSetting.insert(
      this.InitAutoSelectSetting,
      this
    );
    SlotGDK.instance.eventStartAutoSelectTimer.insert(
      this.StartAutoSelectTimer,
      this
    );
    SlotGDK.instance.eventStopAutoSelectTimer.insert(
      this.StopAutoSelectTimer,
      this
    );
    SlotGDK.instance.eventShowTopBar.insert(this.showTopBar, this);
    SlotGDK.instance.eventGameStateChanged.insert(BQLogger.setStatus, BQLogger);
    SlotGDK.instance.eventTriggerSpecialSpin.insert(this.startSpin, this);

    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  private onKeyDown(event: EventKeyboard) {
    if (event.keyCode === KeyCode.SPACE) {
      this.onClickSpinButton();
      this.onClickStopButton();
    }
  }

  private bottomBarEventRegister(): void {
    this.bottomBar.clickClearFeature.insert(this.onClickClearFeature, this);
    this.bottomBar.spinClicked.insert(this.onClickSpinButton, this);
    this.bottomBar.startClicked.insert(this.onClickStartButton, this);
    this.bottomBar.stopClicked.insert(this.onClickStopButton, this);
    this.bottomBar.skipClicked.insert(this.onClickSkipButton, this);
    this.bottomBar.extraBetClicked.insert(this.onClickExtraBetButton, this);
    this.bottomBar.audioMute.insert(this.setAudioMute, this);
    this.bottomBar.clickFullScreen.insert(this.setFullScreen, this);
    this.bottomBar.autospinPopup.stopAutoSpin.insert(this.onStopAutoSpin, this);
    this.bottomBar.openAutospinPopupButtonClicked.insert(
      this.onClickAutospinPopupButton,
      this
    );
    this.bottomBar.openBetPopupButtonClicked.insert(
      this.onClickBetPopupButton,
      this
    );
    this.bottomBar.openMainMenuButtonClicked.insert(
      this.onClickOpenMainMenuButton,
      this
    );
    this.bottomBar.closeMainMenuButtonClicked.insert(
      this.onClickCloseMainMenuButton,
      this
    );
    this.bottomBar.infoPopupButtonClicked.insert(
      this.onClickInfoPopupButton,
      this
    );
    this.bottomBar.gameLogPopupButtonClicked.insert(
      this.onClickGameLogPopupButton,
      this
    );
    this.bottomBar.clickHome.insert(this.onClickHomeButton, this);
    this.bottomBar.autospinPopup.closePopup.insert(
      this.closeAutospinPopup,
      this
    );
    this.bottomBar.betPopup.closePopup.insert(this.closeBetPopup, this);
    this.bottomBar.betPopup.SetBetString.insert(this.setBetString, this);
    this.bottomBar.linkingJpMgr.jpClose.insert(
      this.adjustSerialNOPosition,
      this
    );
    this.bottomBar.showInSuffcientBalancePopUp.insert(
      this.ShowInSuffcientBalancePopUp,
      this
    );
  }

  protected start() {
    document.addEventListener('fullscreenchange', () => {
      this.bottomBar.OnChangeFullScreenBtn(!screen['fullScreen']());
    });
    document.addEventListener('webkitfullscreenchange', () => {
      this.bottomBar.OnChangeFullScreenBtn(!screen['fullScreen']());
    });
    document.addEventListener('MSFullscreenChange', () => {
      this.bottomBar.OnChangeFullScreenBtn(!screen['fullScreen']());
    });
    document.addEventListener('mozfullscreenchange', () => {
      this.bottomBar.OnChangeFullScreenBtn(!screen['fullScreen']());
    });
  }

  protected onDestroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);

    PlatformGDK.instance.showPopUpMessage.remove(
      this.showPopupMessageByErrorCode,
      this
    );

    PlatformGDK.instance.receiveStartGameData.remove(
      this.receiveStartGameData,
      this
    );

    PlatformGDK.instance.connectServerReady.remove(
      this.connectServerReady,
      this
    );
    PlatformGDK.instance.commandDataIsNull.remove(this.CommandDataIsNull, this);
    PlatformGDK.instance.commandErrorHandler.remove(this.CommandError, this);
    PlatformGDK.instance.rollGameWin.remove(this.ShowWinAnimCount, this);
    PlatformGDK.instance.unregisterFunction(SlotUIFunc.GetDownBarGameWin);

    if (this.bottomBar !== null) {
      this.bottomBar.clickClearFeature.remove(this.onClickClearFeature, this);
      this.bottomBar.spinClicked.remove(this.onClickSpinButton, this);
      this.bottomBar.startClicked.remove(this.onClickStartButton, this);
      this.bottomBar.stopClicked.remove(this.onClickStopButton, this);
      this.bottomBar.skipClicked.remove(this.onClickSkipButton, this);
      this.bottomBar.extraBetClicked.remove(this.onClickExtraBetButton, this);
      this.bottomBar.audioMute.remove(this.setAudioMute, this);
      this.bottomBar.clickFullScreen.remove(this.setFullScreen, this);
      this.bottomBar.autospinPopup.stopAutoSpin.remove(
        this.onStopAutoSpin,
        this
      );
      this.bottomBar.openAutospinPopupButtonClicked.remove(
        this.onClickAutospinPopupButton,
        this
      );
      this.bottomBar.openBetPopupButtonClicked.remove(
        this.onClickBetPopupButton,
        this
      );
      this.bottomBar.openMainMenuButtonClicked.remove(
        this.onClickOpenMainMenuButton,
        this
      );
      this.bottomBar.closeMainMenuButtonClicked.remove(
        this.onClickCloseMainMenuButton,
        this
      );
      this.bottomBar.infoPopupButtonClicked.remove(
        this.onClickInfoPopupButton,
        this
      );
      this.bottomBar.gameLogPopupButtonClicked.remove(
        this.onClickGameLogPopupButton,
        this
      );
      this.bottomBar.clickHome.remove(this.onClickHomeButton, this);
      this.bottomBar.autospinPopup.closePopup.remove(
        this.closeAutospinPopup,
        this
      );
      this.bottomBar.betPopup.closePopup.remove(this.closeBetPopup, this);
      this.bottomBar.betPopup.SetBetString.remove(this.setBetString, this);
      this.bottomBar.linkingJpMgr.jpClose.remove(
        this.adjustSerialNOPosition,
        this
      );
      this.bottomBar.showInSuffcientBalancePopUp.remove(
        this.ShowInSuffcientBalancePopUp,
        this
      );
    }

    SlotGDK.instance.receiveSpinData.remove(this.receiveSpinData, this);
    SlotGDK.instance.receiveFeverData.remove(this.ReceiveFeverGameData, this);
    SlotGDK.instance.receiveDoubleGameData.remove(
      this.ReceiveDoubleGameData,
      this
    );
    SlotGDK.instance.eventActiveExtraBetBtn.remove(
      this.activeExtraBetBtn,
      this
    );
    SlotGDK.instance.eventActiveFreeGameBar.remove(
      this.activeFreeGameBar,
      this
    );
    SlotGDK.instance.eventActiveTakeBtn.remove(this.activeSkipBtn, this);
    SlotGDK.instance.eventActiveSpinBtn.remove(this.activeSpinBtn, this);
    SlotGDK.instance.eventClearBingoData.remove(this.clearBingoData, this);
    SlotGDK.instance.eventClickExtraBet.remove(this.showExtraBetEffect, this);

    SlotGDK.instance.eventHideSpinBtn.remove(this.hideSpinBtn, this);
    SlotGDK.instance.eventIsRecoveryStatus.remove(this.onRecoverStatus, this);
    SlotGDK.instance.eventReadyToSpin.remove(this.onReadyToSpin, this);
    SlotGDK.instance.eventSetFreeGameBarSpinTimes.remove(
      this.SetFreeGameBarSpinTimes,
      this
    );
    SlotGDK.instance.eventSetFreeGameBarText.remove(
      this.SetFreeGameBarSpinTimesByString,
      this
    );
    SlotGDK.instance.eventShowAllBingoFrameData.remove(
      this.ShowAllBingoFrameData,
      this
    );
    SlotGDK.instance.eventShowAwardFinished.remove(
      this.onShowAwardFinished,
      this
    );
    SlotGDK.instance.eventShowAwardStart.remove(this.onShowAwardStart, this);
    SlotGDK.instance.eventShowCountBingoFrameData.remove(
      this.ShowCountBingoFrameData,
      this
    );
    SlotGDK.instance.eventShowEnterSpecialGameBtn.remove(
      this.activeEnterSpecialGameMsg,
      this
    );
    SlotGDK.instance.eventShowLineBingoFrameData.remove(
      this.ShowLineBingoFrameData,
      this
    );
    SlotGDK.instance.eventShowRetriggerMessage.remove(
      this.showRetriggerMessage,
      this
    );
    SlotGDK.instance.eventShowWaysBingoFrameData.remove(
      this.ShowWaysBingoFrameData,
      this
    );
    SlotGDK.instance.eventShowWinAnimCount.remove(this.ShowWinAnimCount, this);
    SlotGDK.instance.eventSpecialGameEnded.remove(
      this.onSpecialGameEnded,
      this
    );
    SlotGDK.instance.eventSpecialGameStarted.remove(
      this.onSpecialGameStarted,
      this
    );
    SlotGDK.instance.eventStopAutoSpin.remove(this.onStopAutoSpin, this);
    SlotGDK.instance.eventWaitForWheelStop.remove(
      this.onWaitForWheelStop,
      this
    );
    SlotGDK.instance.eventWheelStop.remove(this.onWheelAllStop, this);

    SlotGDK.instance.eventIniAutoSelectSetting.remove(
      this.InitAutoSelectSetting,
      this
    );
    SlotGDK.instance.eventStartAutoSelectTimer.remove(
      this.StartAutoSelectTimer,
      this
    );
    SlotGDK.instance.eventStopAutoSelectTimer.remove(
      this.StopAutoSelectTimer,
      this
    );
    SlotGDK.instance.eventShowTopBar.remove(this.showTopBar, this);

    SlotGDK.instance.eventGameStateChanged.remove(BQLogger.setStatus, BQLogger);
    SlotGDK.instance.eventTriggerSpecialSpin.remove(this.startSpin, this);

    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.ASSET_REFRESH,
      this.refreshAsset,
      this
    );
  }

  public async loadBottomBar() {
    if (Define.DEBUG_LOG) console.log('loadBottomBar');
    //生出BottomBar
    await new Promise(resolve => {
      const bottomBarLogo = PlatformData.gameSetting.BottomBarLogo ?? '';

      resources.load(
        `Common/Prefab/BottomBar${bottomBarLogo}`,
        (err: Error, prefab: Prefab) => {
          if (err) {
            this.showPopupMessage(
              PlatformData.instance.errorCodeDic.getValue(ErrorCode.UNKNOWN),
              ErrorCode.UNKNOWN.toString(),
              ClickOKHandle.CloseWeb
            );
            console.error('BottomBar Not Found');
            console.error(err);
            return;
          } else {
            resolve(prefab);
          }
        }
      );
    }).then(result => {
      try {
        let bottomBarNode: Node = null;
        bottomBarNode = instantiate(result as Prefab);
        bottomBarNode.parent = this.uiRoot;
        // bottomBarNode.setPosition(v2(0, 0));
        bottomBarNode.setSiblingIndex(1);
        const bottomBar = bottomBarNode.getComponent<BottomBar>(BottomBar);
        this.bottomBar = bottomBar;
        if (SlotGDK.instance.eventBottomBarLoaded.length > 0) {
          SlotGDK.instance.eventBottomBarLoaded.notify(this.bottomBar);
        }
        this.setAutospinInitData(
          PlatformData.gameConfig.autospin_times as Array<number>
        );

        if (Define.DEBUG_LOG) console.log('loadBottomBar Finish');
      } catch (err) {
        this.showPopupMessage(
          PlatformData.instance.errorCodeDic.getValue(ErrorCode.UNKNOWN),
          ErrorCode.UNKNOWN.toString(),
          ClickOKHandle.CloseWeb
        );
        console.error('BottomBar Not Found');
        console.error(err);
        return;
      }
    });
  }

  private getDownBarGameWin(): number {
    return this.bottomBar.winNumberCounter.getTargetNumber();
  }

  private setAutospinInitData(spinTimesAry: Number[]) {
    this.bottomBar.autospinPopup.node.active = true;
    this.bottomBar.autospinPopup.Init(spinTimesAry);
  }

  //Spin按鈕要不要壓暗
  private blockSpinButton(IsEnalbe: boolean): void {
    if (IsEnalbe) this.changeSpinBtnStatus(SpinStatus.BlockSpin);
    else this.changeSpinBtnStatus(this.beforeSpinBtnStatus);
  }

  // 因應花樣舞者進選擇面板時的需求，多設定一個"隱藏"spin鈕的function 2019/12/26 玟璇
  private hideSpinButton(IsEnalbe: boolean): void {
    if (IsEnalbe) this.changeSpinBtnStatus(SpinStatus.HideSpin);
    else this.changeSpinBtnStatus(this.beforeSpinBtnStatus);
  }

  //顯示stop按鈕
  private showStopButton(): void {
    if (!this.isFreeGameBarShowing && !PlatformData.instance.fastspin) {
      this.changeSpinBtnStatus(SpinStatus.Stop);
    }
  }

  //顯示Start按鈕
  private showStartSpecialGameButton(): void {
    this.changeSpinBtnStatus(SpinStatus.Start);
    if (PlatformData.instance.autoStartRecovery) {
      this.scheduleOnce(this.onClickStartButton, 10.0);
    }
  }

  //顯示Skip按鈕
  private showSkipButton(IsEnable: boolean): void {
    if (IsEnable) {
      this.changeSpinBtnStatus(SpinStatus.Skip);
    } else {
      this.changeSpinBtnStatus(this.beforeSpinBtnStatus);
    }
  }

  private showSpinBtn(bIsBlock: boolean): void {
    if (bIsBlock) {
      this.changeSpinBtnStatus(SpinStatus.BlockSpin);
    } else {
      this.changeSpinBtnStatus(SpinStatus.Spin);
    }
  }

  // 顯示ExtraBet按鈕
  private showExtraBetBtn(ratio: number): void {
    this.bottomBar.ShowExtraBetButton();
    this.bottomBar.betPopup.SetExtraBetRatio(ratio);
  }

  //報獎特殊處理
  public showBiggerWindAndDisable(): void {
    this.userProtectStatus = UserProtectStatus.Wait;
    this.changeSpinBtnStatus(SpinStatus.ShowAward);
  }

  //開關TopBar
  private showTopBar(IsShow: boolean): void {
    this.bottomBar?.ShowTopBar(IsShow);
  }

  /// <summary>
  /// 設定是否在特殊遊戲中
  /// </summary>
  /// <param name="isSpecailGame"></param>
  private setSpecialGameing(isSpecailGame: boolean): void {
    // 2020/09/15 如果設定結束免費即停止自動旋轉，則改變燈號狀態
    if (!isSpecailGame && PlatformData.instance.stopAutoInSpecialGame) {
      PlatformData.instance.autospinTimes = 0;
      PlatformData.instance.autospin = false;
      this.bottomBar.autospinPopup.SetAutospinLightButton();
    }
  }

  //顯示FreeGame按鈕
  private ShowFreeGameBar(IsEnable: boolean): void {
    this.isFreeGameBarShowing = IsEnable;
    if (IsEnable) {
      this.changeSpinBtnStatus(SpinStatus.SpecialGame);
    }
  }

  //顯示BlockSpin按鈕等待下一個流程
  private BlockSpinAndWait(): void {
    this.userProtectStatus = UserProtectStatus.Wait;
    this.changeSpinBtnStatus(SpinStatus.BlockSpin);
  }

  //顯示BlockStop按鈕等待下一個流程
  private BlockStopAndWait(): void {
    this.userProtectStatus = UserProtectStatus.Wait;
    this.changeSpinBtnStatus(SpinStatus.BlockStop);
  }

  //塞FreeGame次數
  private SetFreeGameBarSpinTimes(
    CurrentSpin: number,
    TotalSpin: number
  ): void {
    const _NewCurrentSpin: number = TotalSpin - CurrentSpin;
    this.bottomBar.SetFreeGameBarSpinTimes(_NewCurrentSpin, TotalSpin);
  }

  //塞FreeGame次數, by string
  private SetFreeGameBarSpinTimesByString(text: string): void {
    this.bottomBar.SetFreeGameBarSpinTimesByString(text);
  }

  //下一手AutoSpin
  private SetNextAutoSpin(): void {
    //had limit auto spin times
    if (PlatformData.instance.autospinTimes > 0) {
      PlatformData.instance.autospinTimes--;
    }

    if (
      PlatformData.instance.autospinTimes === 0 ||
      !PlatformData.instance.autospin
    ) {
      this.stopAutoSpin();
    }

    this.changeSpinBtnStatus(SpinStatus.AutoSpin);
  }

  private ShowWinAnimCount(dWinNum: number, fTotalTime = 0.1): void {
    if (this.resetWinNumberFunction !== null) {
      this.unschedule(this.resetWinNumberFunction);
      this.resetWinNumberFunction = null;
    }
    this.bottomBar.OnShowWinAnimCount(dWinNum, fTotalTime);
  }

  private DelayToResetWinNum(fDelay: number): void {
    this.resetWinNumberFunction = this.resetWinNum;
    this.scheduleOnce(this.resetWinNum, fDelay);
  }

  //Line線獎的資訊
  private ShowLineBingoFrameData(
    lineId: number,
    symbolId: number,
    symbolCount: number,
    multiplier: number,
    win: number
  ) {
    if (!HostSetting.instance.bingo.dontShowBottomBarMessage) {
      const bingoFrameData: Object = {
        lineId: lineId,
        symbolId: symbolId,
        symbolCount: symbolCount,
        multiplier: multiplier,
        win: win,
      };
      this.bottomBar.systemMessageUI.ShowMessage(
        MessageType.LineResult,
        bingoFrameData
      );
    }
  }

  //Ways獎的資訊
  private ShowWaysBingoFrameData(
    waysCount: number,
    symbolId: number,
    symbolCount: number,
    multiplier: number,
    win: number
  ) {
    if (!HostSetting.instance.bingo.dontShowBottomBarMessage) {
      const bingoFrameData: Object = {
        waysCount: waysCount,
        symbolId: symbolId,
        symbolCount: symbolCount,
        multiplier: multiplier,
        win: win,
      };
      this.bottomBar.systemMessageUI.ShowMessage(
        MessageType.WaysResult,
        bingoFrameData
      );
    }
  }

  //Count獎的資訊
  private ShowCountBingoFrameData(
    totalCount: number,
    symbolId: number,
    symbolCount: number,
    multiplier: number,
    win: number
  ) {
    if (!HostSetting.instance.bingo.dontShowBottomBarMessage) {
      const bingoFrameData: Object = {
        totalCount: totalCount,
        symbolId: symbolId,
        symbolCount: symbolCount,
        multiplier: multiplier,
        win: win,
      };
      this.bottomBar.systemMessageUI.ShowMessage(
        MessageType.CountResult,
        bingoFrameData
      );
    }
  }

  //Show全線的資訊
  private ShowAllBingoFrameData(thisWin: number) {
    if (!HostSetting.instance.bingo.dontShowBottomBarMessage) {
      const allBingoFrameData: Object = {thisWin: thisWin};

      this.bottomBar.systemMessageUI.ShowMessage(
        MessageType.ThisWin,
        allBingoFrameData
      );
      this.bottomBar.systemMessageUI.ShowMessage(
        MessageType.Gabage,
        allBingoFrameData
      );
    }
  }

  //顯示Retrigger訊息
  private showRetriggerMessage() {
    this.bottomBar.systemMessageUI.ShowMessage(MessageType.Retrigger);
  }

  //清除兌獎的資訊
  private clearBingoData() {
    this.bottomBar.systemMessageUI.ShowMessage(MessageType.Empty);
  }

  //關閉選Bet的頁面
  private closeBetPopup(changeSetting: boolean) {
    if (!changeSetting) return;

    this.setBetString();
    this.bottomBar.linkingJpMgr.SetLinkingJpLevel(
      PlatformData.instance.currentTotalBet
    );

    this.bottomBar.OnResetWinNum();

    if (typeof ActivityModule !== 'undefined' && ActivityModule !== null) {
      EventManager.instance.dispatchEvent(
        ActivityModule.ActivityEventName.GAME_CHANGE_BET,
        PlatformData.instance.originalTotalBet,
        PlatformData.instance.currentTotalBet
      );
    }

    if (SlotGDK.instance.eventClickChangeBet.length > 0) {
      SlotGDK.instance.eventClickChangeBet.notify(
        PlatformData.instance.currentLineBet,
        PlatformData.instance.currentTotalBet
      );
    }
  }

  private setBetString() {
    this.bottomBar.SetTotalBet();
  }

  //點下ExtraBet按鈕
  private onClickExtraBetButton() {
    if (!PlatformData.instance.isExtraBet) {
      //如果玩家資產不足不給開啟ExtraBet
      if (
        PlatformData.instance.originalTotalBet *
          PlatformData.instance.extraBetRatio >
        UserInfo.instance.balance
      ) {
        return;
      }
    }

    PlatformData.instance.isExtraBet = !PlatformData.instance.isExtraBet;

    if (SlotGDK.instance.eventClickExtraBet.length > 0) {
      SlotGDK.instance.eventClickExtraBet.notify(
        PlatformData.instance.isExtraBet
      );
    }
  }

  //點下ExtraBet按鈕
  private showExtraBetEffect(changeSetting: boolean) {
    this.bottomBar.betPopup.SetExtraBet(changeSetting);
  }

  //關閉Autospin的頁面
  private closeAutospinPopup(changeSetting: boolean) {
    this.bottomBar.autospinPopup.node.active = false;

    if (!changeSetting) return;

    this.setFastSpin();

    if (
      PlatformData.instance.autospinTimes > 0 ||
      PlatformData.instance.autospin
    ) {
      this.onClickAutoSpinButton();
    }
  }

  //點下自動旋轉視窗按鈕
  private onClickAutospinPopupButton() {
    if (this.blockShowPopupFlag) return;

    this.bottomBar.autospinPopup.node.active = true;
  }

  //點下選Bet視窗按鈕
  private onClickBetPopupButton() {
    if (this.blockShowPopupFlag) return;

    this.bottomBar.betPopup.node.active = true;
  }

  //點下Info頁面視窗按鈕
  private onClickInfoPopupButton() {
    this.bottomBar.infoPopup.active = true;
    this.bottomBar.gameLogPopup.active = false;

    this.bottomBar.infoPopup.active = true;
    let url = '';
    if (this.useLegiInfoPage) {
      url = `${PlatformData.gameConfig.GameInfo}${PlatformData.gameFolderName}/index.html/${MultLang.nowLangString}`;
    } else {
      url =
        PlatformData.gameConfig.GameInfo +
        PlatformData.gameFolderName +
        '/' +
        MultLang.nowLangString +
        '.html';
      url += '?lang=' + PlatformData.lang;
      url += '&currency=' + PlatformData.currency;
      url += '&ratio=' + PlatformData.currencyRatio;
      url += '&logo=' + PlatformData.logo;
    }
    this.bottomBar.infoWebView.url = url;
    this.registerIFrameEvent();
    this.setHomeBtnInteractable(false);
    this.BlockActivityInput(true);
  }

  private registerIFrameEvent() {
    const callback = event => {
      if (event.source !== window) {
        console.log('RegisterIFrameEvent', event.data);
        if (event.data === 'GetLicenseSetting') {
          PlatformData.licenseSetting.currencySymbol =
            PlatformData.currencySymbol;
          event.source.postMessage(
            JSON.stringify(PlatformData.licenseSetting),
            '*'
          );
          window.removeEventListener('message', callback);
        }
      }
    };
    window.addEventListener('message', callback);
  }

  //點下GameLog頁面視窗按鈕
  private onClickGameLogPopupButton() {
    const extraData =
      '{"ark_id":"' +
      PlatformData.aID +
      '","ark_token":"' +
      PlatformData.aToken +
      '","ark_key":"' +
      PlatformData.aKey +
      '","server_adress":"' +
      PlatformData.gameSetting.GameServer +
      '"}';
    if (Define.DEBUG_LOG) {
      log(extraData);
    }

    let url: string = (PlatformData.gameConfig.GameLog as string).replace(
      '%version',
      PlatformData.gameLogVersion
    );
    url += '?mid=' + PlatformData.mID;
    url += '&logo=' + PlatformData.logo;
    url += '&zone=' + PlatformData.zone;
    url += '&uid=' + PlatformData.uID;
    url += '&nickName=' + PlatformData.nickName;
    url += '&loginName=' + PlatformData.loginName;
    url += '&currency=' + PlatformData.currency;
    url += '&gameID=' + PlatformData.gameID;
    url += '&game=' + PlatformData.gameName;

    //白牌換logo
    if (Functions.getURLParameterByName('ShowLogo') !== '')
      url += '&ShowLogo=' + Functions.getURLParameterByName('ShowLogo');

    const eventListStr: string = Functions.getURLParameterByName('event');
    const eventList = (eventListStr as string).split(',');
    if (eventList.length >= 3) {
      url += '&log=' + eventList[2];
      url += '&ApiUrl=' + eventList[2];
    }

    url += '&lang=' + PlatformData.lang;

    this.bottomBar.gameLogPopup.active = true;
    this.bottomBar.infoPopup.active = false;

    if (PlatformData.isMacrossEnv) {
      //TODO:改別的方式取網址3
      url += '&MarcossLogServer=' + GameClient.arkClient.gameUrl;
      url += '&arkID=' + GameClient.arkClient.arkId;
      url += '&arkToken=' + GameClient.arkClient.arkToken;
      url += '&isMacrossEnv=true';
    }

    if (PlatformData.licenseSetting.logShowEndBalance) {
      url += `&showEndBalance=${PlatformData.licenseSetting.logShowEndBalance}`;
    }

    this.bottomBar.gameLogWebView.url = url;

    this.setHomeBtnInteractable(false);
    this.BlockActivityInput(true);

    if (Define.DEBUG_LOG) {
      log('GameLogUrl: ' + url);
    }
  }

  public openGameLog(url: string) {
    const div = document.createElement('div');
    div.style.display = 'block';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.right = '0px';
    div.style.touchAction = 'none';
    div.style.userSelect = 'none';
    div.style['webkitTapHighlightColor'] = 'rgba(0, 0, 0, 0)';

    const a = document.createElement('a');
    a.style.position = 'absolute';
    a.style.display = 'block';
    a.style.top = '0px';
    a.style.left = '0px';
    a.style.right = '0px';
    a.style.bottom = '0px';
    a.style.width = '99%';
    a.style.height = '99%';

    const close = document.createElement('span');
    close.style.position = 'fixed';
    close.style.padding = '40px 40px';
    close.style.backgroundImage =
      'url(https://vignette.wikia.nocookie.net/house-of-cards/images/a/a5/X.png/revision/latest?cb=20161128021903)';
    close.style.backgroundSize = 'contain';
    close.style.backgroundRepeat = 'no-repeat';
    close.style.backgroundPosition = 'center center';
    close.style.width = '40px';
    close.style.height = '40px';

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100vw';
    iframe.style.height = '100%';

    let resizeIframe: Function = () => {
      const canvas = document.getElementById('GameCanvas');
      a.style.marginLeft = '0px';
      a.style.marginRight = '0px';

      iframe.style.width = '100%';
      iframe.style.height = '100%';

      close.style.padding = '0px';
      close.style.right = '0px';

      if (sys.os === sys.OS.IOS) {
        a.style.marginTop = canvas.scrollHeight * 0.05 + 'px';
        close.style.top = canvas.scrollHeight * 0.03 + 'px';
      } else {
        a.style.marginTop =
          parseFloat(canvas.style.marginTop) +
          canvas.scrollHeight * 0.025 +
          'px';
        close.style.top = parseFloat(canvas.style.marginTop) + 'px';
      }
    };
    let orientationChanged: Function = () => {
      if (window.orientation === 180 || window.orientation === 0) {
        closeEvent();
      }
    };
    const updateScale = setInterval(() => {
      if (
        parseFloat(iframe.style.width) < 100 ||
        parseFloat(iframe.style.height) < 100
      ) {
        resizeIframe();
      }
    }, 1000);
    let onLoad: Function = () => {
      resizeIframe();
    };
    let closeEvent: Function = () => {
      clearInterval(updateScale);
      window.removeEventListener('resize', resizeIframe.bind(this), false);
      window.removeEventListener(
        'orientationchange',
        orientationChanged.bind(this),
        false
      );
      onLoad = null;
      resizeIframe = null;
      orientationChanged = null;
      closeEvent = null;

      div.parentNode.removeChild(div);
    };
    close.onclick = closeEvent.bind(this);

    a.onload = onLoad();
    window.addEventListener('resize', resizeIframe.bind(this), false);
    window.addEventListener(
      'orientationchange',
      orientationChanged.bind(this),
      false
    );

    document.body.appendChild(div);
    div.appendChild(a);
    a.appendChild(close);
    a.appendChild(iframe);
  }

  //點下首頁按鈕
  private onClickHomeButton() {
    FunctionManager.instance.CloseGame(PlatformData.isMute);
  }

  //顯示Popup訊息
  public showPopupMessage(
    text: string,
    subText: string,
    clickOkBtnHandle: ClickOKHandle
  ) {
    this.closeAllWebView();

    //   2023/07/12 因應Macross，調整為一律關閉遊戲不做刷新
    if (
      clickOkBtnHandle === ClickOKHandle.RestartGame ||
      clickOkBtnHandle === ClickOKHandle.CloseWeb
    ) {
      TopViewManager.instance.showMessageBox(text, subText, () => {
        Functions.closeGame(PlatformData.isMute);
      });
    } else {
      TopViewManager.instance.showMessageBox(text, subText);
    }

    // if (clickOkBtnHandle === ClickOKHandle.RestartGame) {
    //     TopViewManager.Instance.ShowMessageBox(text, subText, () => {
    //         director.loadScene(director.getScene().name);
    //     });
    // }
    // else if (clickOkBtnHandle === ClickOKHandle.CloseWeb) {
    //     TopViewManager.Instance.ShowMessageBox(text, subText, () => {
    //         Functions.closeGame(PlatformData.IsMute);
    //     });
    // }
    // else {
    //     TopViewManager.Instance.ShowMessageBox(text, subText);
    // }
  }

  private showPopupMessageByErrorCode(legalCode: number) {
    let handler: ClickOKHandle = ClickOKHandle.RestartGame;
    switch (legalCode) {
      case ErrorCode.INSUFFICIENT_AMOUNT:
      case ErrorCode.MAINTENANCE:
      case ErrorCode.LOGINFAILED_VERIFY_FAILED:
      case ErrorCode.UNKNOWN:
      case ErrorCode.HTML5_WEBGL_NOT_SUPPORT:
        handler = ClickOKHandle.CloseWeb;
        break;
    }

    this.showPopupMessage(
      PlatformData.instance.errorCodeDic.getValue(legalCode),
      legalCode.toString(),
      handler
    );
  }

  //點下展開主Menu按鈕
  private onClickOpenMainMenuButton() {
    if (this.blockShowPopupFlag) return;

    this.bottomBar.mainMenuRoot_Open.active = true;
    this.bottomBar.mainMenuRoot_Close.active = false;

    this.setAudioMute(PlatformData.isMute); //避免透過其他地方靜音未同步開關
  }

  //點下收起主Menu按鈕
  private onClickCloseMainMenuButton() {
    this.bottomBar.infoPopup.active = false;
    this.bottomBar.gameLogPopup.active = false;

    this.bottomBar.mainMenuRoot_Open.active = false;
    this.bottomBar.mainMenuRoot_Close.active = true;

    this.setHomeBtnInteractable(true);
    this.BlockActivityInput(false);
  }

  //設定金錢(帶參數就是假扣)
  private updateBalance(coin = 0) {
    UserInfo.instance.visibleBalance = coin;
    this.bottomBar.SetBalance(UserInfo.instance.visibleBalance);
  }

  //設定金錢(用滾的)
  private updateBalanceCount(updateTime: number) {
    UserInfo.instance.visibleBalance = UserInfo.instance.balance;
    this.bottomBar.SetBalanceCount(UserInfo.instance.balance, updateTime);
  }

  //設定金錢至指定金額 (用滾的)
  private updateBalanceCountTo(coin: number, updateTime: number) {
    UserInfo.instance.visibleBalance = coin;
    this.bottomBar.SetBalanceCount(coin, updateTime);
  }

  private setAudioMute(isAudioMute: boolean) {
    if (isAudioMute) {
      PlatformData.isMute = true;

      this.bottomBar.audioBtn_Open.active = false;
      this.bottomBar.audioBtn_Close.active = true;
    } else {
      PlatformData.isMute = false;

      this.bottomBar.audioBtn_Open.active = true;
      this.bottomBar.audioBtn_Close.active = false;
    }

    SlotGDK.instance.setMuted(isAudioMute);
  }

  private setFullScreen() {
    let isFullscreen = false;
    isFullscreen = screen['fullScreen']();
    try {
      if (isFullscreen) {
        screen['exitFullScreen']();
      } else {
        screen['requestFullScreen'](document.documentElement);
      }
    } catch (err) {
      console.error('[InputController] SetFullScreen error.', err);
    }
  }

  private setHomeBtnInteractable(isInteractable: boolean) {
    this.bottomBar.homeBtn.getComponent(Button).interactable = isInteractable;
  }

  // 切換Spin按鈕狀態
  private changeSpinBtnStatus(_SpinStatus: SpinStatus): void {
    this.beforeSpinBtnStatus = this.spinBtnStatus;
    this.spinBtnStatus = _SpinStatus;
    this.bottomBar.ChangeStyle(
      this.spinBtnStatus,
      PlatformData.instance.autospinTimes
    );
  }

  private resetWinNum(): void {
    this.bottomBar.systemMessageUI.ShowMessage(MessageType.Empty);
    this.bottomBar.ShowSystemMessageUI(false);
    this.bottomBar.OnResetWinNum();
    this.resetWinNumberFunction = null;
  }

  //結束Autospin
  private stopAutoSpin(): void {
    PlatformData.instance.autospinTimes = 0;
    PlatformData.instance.autospin = false;
    this.bottomBar.autospinPopup.SetAutospinLightButton();
    //將Auto鈕阻擋
    this.bottomBar.autoButtonBlock.active = true;

    if (this.userProtectStatus === UserProtectStatus.CanStop)
      this.changeSpinBtnStatus(SpinStatus.Stop);

    this.isAutoSpin = false;
  }

  /// Events
  /// <summary> 點選Auto Spin Button，-1為無限</summary>
  private onClickAutoSpinButton(): void {
    if (
      PlatformData.instance.autospinTimes === 0 ||
      !PlatformData.instance.autospin
    ) {
      this.stopAutoSpin();
    } else {
      this.bottomBar.SetAutoPlayTimesText(PlatformData.instance.autospinTimes);

      if (
        PlatformData.instance.autospinTimes > 0 ||
        PlatformData.instance.autospin
      ) {
        this.isAutoSpin = true;
      }

      if (
        PlatformData.instance.autospinTimes > 0 ||
        PlatformData.instance.autospin
      ) {
        this.startSpin();
      }
    }
  }

  private onClickSpinButton(): void {
    if (this.userProtectStatus !== UserProtectStatus.CanSpin) {
      return;
    }

    this.startSpin();
  }

  private onClickBuyBonusSpinButton(
    totalBet: number,
    cost: number,
    isExtraBet: boolean,
    specialGameType: string,
    buyBonusName: string
  ): void {
    if (this.userProtectStatus !== UserProtectStatus.CanSpin) {
      return;
    }

    //如有變更ExtraBet狀態才呼叫
    if (PlatformData.instance.isExtraBet !== isExtraBet) {
      PlatformData.instance.isExtraBet = isExtraBet;
      this.bottomBar.betPopup.SetExtraBet(isExtraBet);
    }

    this.bottomBar.betPopup.ChangeBetByTotalBet(totalBet);

    this.buyBonus(cost, specialGameType, buyBonusName);
  }

  private onClickStopButton(): void {
    if (this.userProtectStatus !== UserProtectStatus.CanStop) return;
    this.isClickedStop = true;
    if (
      (PlatformData.instance.autospinTimes === 0 ||
        !PlatformData.instance.autospin) &&
      this.spinBtnStatus !== SpinStatus.SpecialGame
    )
      this.BlockStopAndWait();
    else if (
      PlatformData.instance.autospinTimes !== 0 ||
      PlatformData.instance.autospin
    )
      this.BlockStopAndWait();
    else this.userProtectStatus = UserProtectStatus.Wait;

    if (SlotGDK.instance.eventClickStop.length > 0) {
      SlotGDK.instance.eventClickStop.notify();
    }
  }

  private onClickStartButton(): void {
    if (Define.DEBUG_LOG) {
      log('%cOnClickStartButton()', 'color:red');
    }
    this.unschedule(this.onClickStartButton);
    this.BlockSpinAndWait();
    if (SlotGDK.instance.eventClickSpGameStartBtn.length > 0)
      SlotGDK.instance.eventClickSpGameStartBtn.notify();
  }

  private onClickSkipButton(): void {
    if (SlotGDK.instance.eventClickSkipButton.length > 0)
      SlotGDK.instance.eventClickSkipButton.notify();

    this.bottomBar.OnForceStopWinAnim();
  }

  private setFastSpin(): void {
    if (PlatformData.instance.fastspin) {
      this.fastSpinFunction = this.onClickStopButton;

      this.schedule(this.onClickStopButton, 0.1);
    } else {
      if (this.fastSpinFunction !== null) {
        this.unschedule(this.fastSpinFunction);
        this.fastSpinFunction = null;
      }
    }
  }

  private onClickClearFeature() {
    if (PlatformGDK.instance.clearFeature.length > 0) {
      PlatformGDK.instance.clearFeature.notify();
    }
  }

  private adjustSerialNOPosition() {
    this.bottomBar.AdjustSerialNOPosition();
  }

  private closeAllWebView() {
    if (this.bottomBar) {
      this.bottomBar.infoPopup.active = false;
      this.bottomBar.gameLogPopup.active = false;
    }
  }

  /// <summary>
  /// 開關特殊遊戲開始鈕
  /// </summary>
  private activeEnterSpecialGameMsg(): void {
    this.showStartSpecialGameButton();
    this.userProtectStatus = UserProtectStatus.CanStart;
  }

  private onStopAutoSpin(): void {
    this.isAutoSpin = false;
  }

  /**
   * 開始Spin
   */
  private startSpin(spinData = null): void {
    PlatformGDK.instance.sendEventLog.notify(EventGameFlow.firstPlay);
    if (Define.DEBUG_LOG) {
      if (!this.needSyncAssetBeforeSpin) {
        log('----------開始Spin');
      } else {
        log('----------sync asset finished, StartSpin again');
      }
    }
    this.isWin = false;

    this.unschedule(this.spinFunction);

    //不可Spin的狀態且非Spin前同步資產流程則略過
    if (
      this.userProtectStatus !== UserProtectStatus.CanSpin &&
      !this.needSyncAssetBeforeSpin
    )
      return;

    // 餘額不足的處理流程
    const NoCoin: boolean =
      PlatformData.instance.currentTotalBet > UserInfo.instance.balance
        ? true
        : false;

    if (NoCoin) {
      if (!this.needSyncAssetBeforeSpin) {
        //同步資產流程
        //未同步資產 啟用同步資產流程
        this.needSyncAssetBeforeSpin = true;
        //取得玩家資產
        CustomCmdSender.instance.getAssetData(
          this.receiveGetAssetData.bind(this)
        );
      } else {
        //復原Spin流程第一段、彈出餘額不足視窗、關閉同步資產流程
        if (this.isAutoSpin) {
          this.stopAutoSpin();
        }

        this.changeSpinBtnStatus(SpinStatus.Spin);
        this.BlockActivityInput(false);

        this.blockShowPopupFlag = false;
        //第一次觸發StartSpin时已切換至Wait 故此須切回CanSpin
        this.userProtectStatus = UserProtectStatus.CanSpin;
        //Joya在autospin沒錢时不会透过此流程显示 20231122 by kyy
        if (!PlatformData.isDaraEnv) {
          this.showPopupMessage(
            PlatformData.instance.errorCodeDic.getValue(
              ErrorCode.INSUFFICIENT_AMOUNT
            ),
            ErrorCode.INSUFFICIENT_AMOUNT.toString(),
            ClickOKHandle.None
          );
        }

        this.needSyncAssetBeforeSpin = false;
        return;
      }
    } else {
      //資產足夠 確保關閉同步資產流程
      this.needSyncAssetBeforeSpin = false;
      //遊戲Spin中，使活動模組裡的活動無法點擊
      this.BlockActivityInput(true);
    }

    //Spin流程 第一段 (阻擋按鈕狀態、阻擋Popup)
    this.userProtectStatus = UserProtectStatus.Wait;

    SlotGDK.instance.fastSpin = PlatformData.instance.fastspin;

    // InputCtr事件
    this.blockShowPopupFlag = true;
    if (!this.isAutoSpin) {
      this.BlockSpinAndWait();
    }

    //啟用同步資產流程則略過第二段
    if (this.needSyncAssetBeforeSpin) return;

    //Spin流程 第二段 (AutoSpin次數減少、快速跳到最後贏分、設定停輪時間、餘額假扣、Spin事件觸發、網路不穩計時、發送Spin封包)
    // InputCtr事件
    //AutoSpin若放在第一段會造成先扣次數才進行同步資產的動作
    if (this.isAutoSpin) this.SetNextAutoSpin();
    //快速跳到最後贏分
    this.bottomBar.OnForceStopWinAnim();
    //設定停輪時間
    if (SlotGDK.instance.getPlayMode() === GamePlayMode.Normal) {
      //快速停輪时Delay时间较短
      if (!SlotGDK.instance.fastSpin) {
        this.DelayToResetWinNum(0.4);
      } else {
        this.DelayToResetWinNum(0.25);
      }
    }

    //Client 先假扣
    if (spinData === null)
      this.updateBalance(
        UserInfo.instance.balance - PlatformData.instance.currentTotalBet
      );
    // else
    //   this.updateBalance(
    //     UserInfo.instance.balance -
    //       Functions.getValueByRatio(
    //         this.bottomBar.itemCtrl.betAmt,
    //         PlatformData.currencyRatio
    //       )
    //   );

    this.showInternetUnstableTipID = setTimeout(() => {
      this.bottomBar.ShowInternetUnstableTip(true);
    }, this.showInternetUnstableTipTime * 1000);

    //Send Cmd
    if (SlotGDK.instance.eventSpin.length > 0) {
      SlotGDK.instance.eventSpin.notify(spinData);
    }
  }

  private buyBonus(
    cost: number,
    _specialGameType: string,
    _buyBonusName: string
  ): void {
    if (Define.DEBUG_LOG) {
      if (!this.needSyncAssetBeforeSpin) {
        log('----------開始BuyBonus');
      } else {
        log('----------sync asset finished, BuyBonus again');
      }
    }
    this.isWin = false;

    this.unschedule(this.buyBonus);

    //不可Spin的狀態且非Spin前同步資產流程則略過
    if (
      this.userProtectStatus !== UserProtectStatus.CanSpin &&
      !this.needSyncAssetBeforeSpin
    )
      return;

    // 餘額不足的處理流程
    const noCoin: boolean = cost > UserInfo.instance.balance ? true : false;

    if (noCoin) {
      if (!this.needSyncAssetBeforeSpin) {
        //同步資產流程
        //未同步資產 啟用同步資產流程
        this.needSyncAssetBeforeSpin = true;
        //取得玩家資產
        CustomCmdSender.instance.getAssetData(
          this.receiveGetAssetData.bind(this)
        );
      } else {
        this.changeSpinBtnStatus(SpinStatus.Spin);

        this.blockShowPopupFlag = false;
        this.BlockActivityInput(false);
        //第一次觸發StartSpin時已切換至Wait 故此須切回CanSpin
        this.userProtectStatus = UserProtectStatus.CanSpin;

        this.showPopupMessage(
          PlatformData.instance.errorCodeDic.getValue(
            ErrorCode.INSUFFICIENT_AMOUNT
          ),
          ErrorCode.INSUFFICIENT_AMOUNT.toString(),
          ClickOKHandle.None
        );

        this.needSyncAssetBeforeSpin = false;
        return;
      }
    } else {
      //資產足夠 確保關閉同步資產流程
      this.needSyncAssetBeforeSpin = false;
      this.BlockActivityInput(true);
    }

    //Spin流程 第一段 (阻擋按鈕狀態、阻擋Popup)
    this.userProtectStatus = UserProtectStatus.Wait;

    SlotGDK.instance.fastSpin = PlatformData.instance.fastspin;

    // InputCtr事件
    this.blockShowPopupFlag = true;
    if (!this.isAutoSpin) {
      this.BlockSpinAndWait();
    }

    //啟用同步資產流程則略過第二段
    if (this.needSyncAssetBeforeSpin) return;

    //快速跳到最後贏分
    this.bottomBar.OnForceStopWinAnim();
    //設定停輪時間
    if (SlotGDK.instance.getPlayMode() === GamePlayMode.Normal) {
      //快速停輪時Delay時間較短
      if (!SlotGDK.instance.fastSpin) {
        this.DelayToResetWinNum(0.4);
      } else {
        this.DelayToResetWinNum(0.25);
      }
    }

    //Client 先假扣
    this.updateBalance(UserInfo.instance.balance - cost);

    this.showInternetUnstableTipID = setTimeout(() => {
      this.bottomBar.ShowInternetUnstableTip(true);
    }, this.showInternetUnstableTipTime * 1000);

    //BuyBonus表演特效
    if (SlotGDK.instance.eventPlayBuyBonusEffect.length > 0) {
      SlotGDK.instance.eventPlayBuyBonusEffect.notify();
    }

    //Send Cmd
  }

  /// <summary>
  /// Game告訴平台現在目前為ReadyToSpin狀態
  /// </summary>
  private onReadyToSpin(): void {
    if (Define.DEBUG_LOG) {
      log('[MachineHostEx] OnReadyToSpin()');
    }
    this.userProtectStatus = UserProtectStatus.CanSpin;
    this.ShowFreeGameBar(false);

    //Check Auto Spin
    if (!this.isAutoSpin) {
      if (Define.DEBUG_LOG) {
        log('[MachineHostEx] m_bIsAutoSpin = false');
      }
      this.changeSpinBtnStatus(SpinStatus.Spin);
      this.blockShowPopupFlag = false;

      this.BlockActivityInput(false);
    } else {
      if (Define.DEBUG_LOG) {
        log('[MachineHostEx] m_bIsAutoSpin = true');
      }
      if (this.isWin) {
        this.scheduleOnce(
          this.spinFunction,
          HostSetting.instance.gameSetting.readyToSpinDelay.haveWin
        );
      } else {
        const delayTime = PlatformData.instance.fastspin
          ? HostSetting.instance.gameSetting.readyToSpinDelay.fastSpinNoWin *
            HostSetting.instance.gameSetting.readyToSpinDelay.multiplier
          : HostSetting.instance.gameSetting.readyToSpinDelay.noWin *
            HostSetting.instance.gameSetting.readyToSpinDelay.multiplier;
        this.scheduleOnce(this.spinFunction, delayTime);
      }
    }
  }

  private activeSpinBtn(bActive: boolean): void {
    this.blockSpinButton(bActive);
  }

  private hideSpinBtn(bActive: boolean): void {
    this.hideSpinButton(bActive);
  }

  private activeExtraBetBtn(ratio: number): void {
    this.showExtraBetBtn(ratio);
  }

  // 開始旋轉後，等待停輪
  private onWaitForWheelStop(): void {
    if (Define.DEBUG_LOG) {
      log('[MachineHostEx] OnWaitForWheelStop()');
    }
    this.showStopButton();
    this.userProtectStatus = UserProtectStatus.CanStop;
  }

  // 完成停輪
  private onWheelAllStop(): void {
    if (Define.DEBUG_LOG) {
      log('[MachineHostEx] OnWheelAllStop()');
    }
    if (!this.isAutoSpin) {
      if (this.isClickedStop) {
        this.BlockStopAndWait();
      } else {
        this.BlockSpinAndWait();
      }
    }
    this.isClickedStop = false;

    this.userProtectStatus = UserProtectStatus.Wait;

    if (this.isJackpot) {
      const curBalance: number = UserInfo.instance.visibleBalance;
      let jpWin = 0;
      let jpWinDuration = 0;
      //流程暫停
      SlotGDK.instance.setProcessToWaiting(true);
      //Linking Jackpot報獎略過事件
      const onLinkingJpSkip: Function = () => {
        this.bottomBar.OnForceStopWinAnim();
        this.updateBalance(curBalance + jpWin);
      };
      //Linking Jackpot報獎結束事件
      const onLinkingJpEnd: Function = () => {
        this.isJackpot = false;
        //Linking Jackpot報獎結束 流程繼續
        SlotGDK.instance.setProcessToWaiting(false);
      };
      //開始Linking Jackpot報獎
      const jpArg: Array<number> = this.bottomBar.linkingJpMgr.ShowJackpotBoard(
        onLinkingJpSkip,
        this,
        onLinkingJpEnd,
        this
      );

      CustomCmdSender.instance.getLinkingJPData(
        PlatformData.gameName,
        this.ReceiveLinkingJpInfoData.bind(this)
      );
      //贏分餘額數值滾動
      jpWin = jpArg[0];
      jpWinDuration = jpArg[1];
      this.ShowWinAnimCount(jpWin, jpWinDuration);
      this.updateBalanceCountTo(curBalance + jpWin, jpWinDuration);
    }
  }

  //進入免費遊戲
  private onSpecialGameStarted() {
    this.setSpecialGameing(true);
  }

  //免費遊戲結束
  private onSpecialGameEnded(): void {
    this.updateBalanceCount(1);

    this.BlockSpinAndWait();

    this.setSpecialGameing(false);

    if (PlatformData.instance.stopAutoInSpecialGame) {
      this.isAutoSpin = false;
    }
  }

  /// <summary>
  /// 開關略過大獎表演按鈕
  /// </summary>
  private activeSkipBtn(bActive: boolean): void {
    this.showSkipButton(bActive);
  }

  /// <summary>
  /// 開啟FreeGame特殊按鈕
  /// </summary>
  private activeFreeGameBar(bActive: boolean): void {
    this.ShowFreeGameBar(bActive);
  }

  // <summary>
  // 報獎開始
  // </summary>
  private onShowAwardStart() {
    this.isWin = true;
  }

  //接收Spin資料
  private receiveSpinData(data) {
    //關閉網路不穩的提示和Timeout
    if (this.showInternetUnstableTipID !== -1) {
      clearTimeout(this.showInternetUnstableTipID);
      this.showInternetUnstableTipID = -1;
      this.bottomBar.ShowInternetUnstableTip(false);
    }

    if (data.hasOwnProperty('data')) {
      const dataJson: JSON = data['data'];

      if (PlatformData.isMacrossEnv) {
        PlatformData.instance.lastMacrossUpdateBalanceTs = data['ts'] * 1000;
      }

      UserInfo.instance.balance = this.getBalance(dataJson);
      this.bottomBar.SetSerialNO(dataJson['serial_id']);
      this.bottomBar.SetProbVersion(dataJson);
      //Linking Jackpot
      if (dataJson.hasOwnProperty('jackpot_win')) {
        this.isJackpot = true;
        this.bottomBar.linkingJpMgr.SetJackpotWinInfo(dataJson['jackpot_win']);
      } else {
        this.isJackpot = false;
      }
    }
  }

  private getBalance(data: JSON): number {
    switch (PlatformData.logo) {
      case enumFromType.Joya:
        try {
          return data['balance']['Coin'];
        } catch {
          return UserInfo.instance.balance;
        }
      default:
        return data['balance'];
    }
  }

  private onRecoverStatus(): void {
    if (Define.DEBUG_LOG) {
      log('[MachineHostEx] OnRecoverStatus()');
    }

    this.changeSpinBtnStatus(SpinStatus.BlockSpin);
    this.blockShowPopupFlag = true;
    this.BlockActivityInput(true);
  }

  /// <summary>
  /// 報獎結束
  /// </summary>
  private onShowAwardFinished() {
    if (
      SlotGDK.instance.getPlayMode() === GamePlayMode.Normal &&
      !SlotGDK.instance.isReadyToEnterSG()
    ) {
      this.updateBalanceCount(1);
    }
  }

  private connectServerReady() {
    // if (PlatformGDK.Instance.ConnectServerReady.Length > 0) {
    //     PlatformGDK.Instance.ConnectServerReady.Notify();
    // }
    console.log(
      '[InputController] connectServerReady',
      PlatformData.instance.haveGetUserInfoCmd
    );

    if (PlatformData.instance.haveGetUserInfoCmd) {
      CustomCmdSender.instance.getUserInfo(this.receiveUserInfoData.bind(this));
    } else {
      switch (PlatformData.logo) {
        case enumFromType.Joya:
          this.setJoyaUserInfoData();
          break;
        default:
          break;
      }
    }
  }

  private setJoyaUserInfoData() {
    UserInfo.instance.nickName = MacrossClient.aid.toString();
    this.bottomBar.SetNickName(UserInfo.instance.nickName);
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.ASSET_REFRESH,
      this.refreshAsset,
      this
    );
    GameClient.instance.joyaSendGetAsset();
    this.updateBalance(UserInfo.instance.balance);
  }

  //接收UserInfo資料
  private receiveUserInfoData(result, data) {
    const cmdData = data['cmd_data'];

    console.log('[command]onReceiveUserInfoData' + JSON.stringify(cmdData));
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.VerifyDataCode(cmdData);
    if (legalCode !== 0) {
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(legalCode),
        legalCode.toString(),
        ClickOKHandle.RestartGame
      );
      return;
    }

    //暱稱及餘額設定
    let nickName = '';
    let balance = 0;
    try {
      nickName = cmdData['data']['ThirdPartyNick'];
      balance = cmdData['data']['Balance'];
    } catch (err) {
      nickName = null;
      balance = null;
      console.error(err);
    } finally {
      if (nickName === null && balance === null) {
        //暱稱及餘額錯誤 不做處理
        // return;
      }
      UserInfo.instance.nickName = nickName;
      UserInfo.instance.balance = balance;

      window.eventLogNickName = UserInfo.instance.nickName;

      this.bottomBar.SetNickName(UserInfo.instance.nickName);

      this.updateBalance(UserInfo.instance.balance);

      EventManager.instance.addEventListener(
        PlatformData.gameEventName.ASSET_REFRESH,
        this.refreshAsset,
        this
      );
    }
  }

  /**
   * 定時同步資產的處理
   * @param asset
   */
  private refreshAsset(asset: number, ts: number) {
    if (SlotGameMediator.instance !== null) {
      if (
        SlotGameMediator.instance.mainGameHost.getNowGameStatus ===
        GameStatus.ReadyToSpin
      ) {
        if (PlatformData.isMacrossEnv) {
          PlatformData.instance.lastMacrossUpdateBalanceTs = ts;
        }
        UserInfo.instance.balance = asset;
        this.updateBalance(asset);
      } else if (
        SlotGameMediator.instance.mainGameHost.getNowGameStatus ===
          GameStatus.ProcessStart &&
        PlatformData.isDaraEnv
      ) {
        UserInfo.instance.balance = asset;
        this.updateBalance(asset);
      }
    }
  }

  /**
   * 接收到GetAsset資料
   * @param data
   */
  private receiveGetAssetData(result, data) {
    const cmdData = data.cmd_data;

    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.VerifyDataCode(cmdData);
    if (legalCode !== 0) {
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(legalCode),
        legalCode.toString(),
        ClickOKHandle.RestartGame
      );
      return;
    }
    //更新資產
    try {
      let asset = Number(cmdData['Asset']);
      if (asset < 0 || isNaN(asset)) asset = Number(cmdData['Coin']);

      if (asset < 0 || isNaN(asset)) asset = 0;

      if (PlatformData.isMacrossEnv) {
        const ts: number = data.cmd_data['ts'];
        if (ts <= PlatformData.instance.lastMacrossUpdateBalanceTs) {
          if (this.needSyncAssetBeforeSpin) {
            this.startSpin();
          }
          return;
        }

        PlatformData.instance.lastMacrossUpdateBalanceTs = ts;
      }
      UserInfo.instance.balance = asset;
      this.updateBalance(asset);
    } catch (err) {
      console.error(err);
    }

    if (this.needSyncAssetBeforeSpin) {
      this.startSpin();
    }
  }

  //接收StartGame資料
  private receiveStartGameData(data) {
    if (data.hasOwnProperty('data')) {
      //初始化BottomBar
      const dataJson: JSON = data['data'];
      this.bottomBarEventRegister();
      this.bottomBar.Init(dataJson);

      PlatformData.licenseSetting.oddsInfo = dataJson['odds'];

      SlotGDK.instance.setBottomBarInfo(
        'BottonBar_ugui',
        0,
        getWorldSpaceAR(this.bottomBar.betPopup.node),
        this.bottomBar.spinButton.node.getPosition()
      );

      //開始發送Linking Jackpot
      if (PlatformData.instance.haveLinkingJpCmd) {
        //TODO: iGaming串接後移除此判斷
        CustomCmdSender.instance.getLinkingJPData(
          PlatformData.gameName,
          this.ReceiveLinkingJpInfoData.bind(this)
        );
      }

      //TODO: iGaming串接後移除此判斷
      if (PlatformData.instance.haveMarqueeCmd) {
        CustomCmdSender.instance.getMarqueesData(
          this.ReceiveMarqueesData.bind(this)
        );
      }

      const Args: StartGameExArgs = new StartGameExArgs().parse(data['data']);

      //2021-10-25 新增:加入ExtraBet功能
      if (Args.extraBetInfo !== null) {
        //如果"Enable"參數為true，就顯示ExtraBet按鈕
        if (Args.extraBetInfo.hasOwnProperty('Enable')) {
          if (Args.extraBetInfo['Enable'] === true) {
            if (Args.extraBetInfo.hasOwnProperty('Status')) {
              PlatformData.instance.isExtraBet =
                Args.extraBetInfo['Status'] === true;
            }

            if (SlotGDK.instance.eventActiveExtraBetBtn.length > 0) {
              SlotGDK.instance.eventActiveExtraBetBtn.notify(
                Args.extraBetInfo['Ratio']
              );
            }

            //如果"Status"參數為false，就顯示ExtraBet教學頁面
            if (Args.extraBetInfo.hasOwnProperty('Status')) {
              if (Args.extraBetInfo['Status'] === true) {
                this.bottomBar.betPopup.SetAllBetUI(true);

                // if (SlotGDK.instance.Event_ClickExtraBet.Length > 0) {
                //     SlotGDK.instance.Event_ClickExtraBet.Notify(true);
                // }
              } else {
                if (Args.gameStatusData.sgState === SpecialGameState.NO_SG) {
                  if (
                    SlotGDK.instance.eventShowExtraBetPopup.length > 0 &&
                    !PlatformData.isDaraEnv
                  ) {
                    SlotGDK.instance.eventShowExtraBetPopup.notify();
                  }
                }
              }
            }
          }
        }
      }

      //Recovery顯示金錢
      if (dataJson.hasOwnProperty('total_win_amount')) {
        if (dataJson['total_win_amount'] > 0)
          this.ShowWinAnimCount(dataJson['total_win_amount'], 0);
      }
    }
  }

  //接收FeverGame資料
  private ReceiveFeverGameData(data) {
    if (data.hasOwnProperty('data')) {
      const dataJson: JSON = data['data'];

      if (PlatformData.isMacrossEnv) {
        PlatformData.instance.lastMacrossUpdateBalanceTs = data['ts'] * 1000;
      }

      UserInfo.instance.balance = this.getBalance(dataJson);
      this.bottomBar.SetSerialNO(dataJson['serial_id']);
      this.bottomBar.SetProbVersion(dataJson);
    }
  }

  //接收比倍遊戲資料
  private ReceiveDoubleGameData(data) {
    if (data.hasOwnProperty('data')) {
      const dataJson: JSON = data['data'];

      if (dataJson.hasOwnProperty('balance')) {
        if (PlatformData.isMacrossEnv) {
          PlatformData.instance.lastMacrossUpdateBalanceTs = data['ts'] * 1000;
        }

        UserInfo.instance.balance = this.getBalance(dataJson);
      }

      this.bottomBar.SetSerialNO(dataJson['serial_id']);
    }
  }

  //接收LinkingJp資料
  private ReceiveLinkingJpInfoData(result, data) {
    const cmdData = data.cmd_data;
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.VerifyDataCode(cmdData);
    if (legalCode !== 0) {
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(legalCode),
        legalCode.toString(),
        ClickOKHandle.RestartGame
      );
      return;
    }

    if (cmdData.hasOwnProperty('data')) {
      const dataJson: JSON = cmdData['data'];

      this.bottomBar.linkingJpMgr.ReceiveLinkingJpData(dataJson);

      if (
        dataJson.hasOwnProperty('jp_info') &&
        dataJson['jp_info'].length > 0
      ) {
        const jpInterval: number = dataJson['sent_time_gap'];
        //根據設定的間隔時間一直送
        this.scheduleOnce(() => {
          CustomCmdSender.instance.getLinkingJPData(
            PlatformData.gameName,
            this.ReceiveLinkingJpInfoData.bind(this)
          );
        }, jpInterval);
      }
    }
  }

  //接收跑馬燈資訊
  private ReceiveMarqueesData(result, data) {
    const cmdData = data.cmd_data;
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.VerifyDataCode(cmdData);
    if (legalCode !== 0) {
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(legalCode),
        legalCode.toString(),
        ClickOKHandle.RestartGame
      );
      return;
    }

    const dataJson: JSON = cmdData['data'];

    try {
      if (
        dataJson.hasOwnProperty('content') &&
        dataJson.hasOwnProperty('serial') &&
        dataJson.hasOwnProperty('stay') &&
        dataJson.hasOwnProperty('value')
      ) {
        const msg: string = String(dataJson['content']).replace(
          '%f',
          Functions.getValueByRatio(
            Number(dataJson['value']),
            PlatformData.currencyRatio
          ).toString()
        );

        this.bottomBar.marqueesUI.addMarquees(
          msg,
          dataJson['serial'],
          0,
          dataJson['stay']
        );
      }
    } catch (err) {
      console.error('error : ' + err);
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(ErrorCode.UNKNOWN),
        ErrorCode.UNKNOWN.toString(),
        ClickOKHandle.RestartGame
      );
      return;
    }

    if (dataJson) {
      const Interval: number = dataJson['update_frequency'];
      //根據設定的間隔時間一直送
      this.scheduleOnce(() => {
        CustomCmdSender.instance.getMarqueesData(
          this.ReceiveMarqueesData.bind(this)
        );
      }, Interval);
    }
  }

  //整個資料是空的(Token失效)
  private CommandDataIsNull(errorCode) {
    //關閉網路不穩的提示和Timeout
    if (this.showInternetUnstableTipID !== -1) {
      clearTimeout(this.showInternetUnstableTipID);
      this.showInternetUnstableTipID = -1;
      this.bottomBar.ShowInternetUnstableTip(false);
    }

    //統一Show網路異常並踢回大廳
    this.showPopupMessage(
      PlatformData.instance.errorCodeDic.getValue(errorCode),
      errorCode.toString(),
      ClickOKHandle.CloseWeb
    );
  }

  //封包Error
  private CommandError(errorCode) {
    //關閉網路不穩的提示和Timeout
    if (this.showInternetUnstableTipID !== -1) {
      clearTimeout(this.showInternetUnstableTipID);
      this.showInternetUnstableTipID = -1;
      this.bottomBar.ShowInternetUnstableTip(false);
    }

    //統一Show網路異常重整
    this.showPopupMessage(
      PlatformData.instance.errorCodeDic.getValue(errorCode),
      errorCode.toString(),
      ClickOKHandle.RestartGame
    );
  }

  /**
   * 阻擋活動輸入
   * @param isBlock
   */
  public BlockActivityInput(isBlock = true) {
    if (SlotGDK.instance.eventBlockActivityBtn.length > 0) {
      SlotGDK.instance.eventBlockActivityBtn.notify(isBlock);
    }

    PlatformGDK.instance.blockActivityInput.notify(isBlock);
  }

  private InitAutoSelectSetting(
    needShowContent = true,
    customContent = '',
    landScapePos: Vec3 = Vec3.ZERO,
    landScapeSize: Vec2 = new Vec2(900, 50),
    portraitPos: Vec3 = Vec3.ZERO,
    portraitSize: Vec2 = new Vec2(500, 100)
  ) {
    this.bottomBar.InitAutoSelectSetting(
      needShowContent,
      customContent,
      landScapePos,
      landScapeSize,
      portraitPos,
      portraitSize
    );
  }

  private StartAutoSelectTimer(
    countDownTime = 20,
    perSecCB: Function = null,
    endCB: Function = null
  ) {
    this.bottomBar.StartAutoSelectTimer(countDownTime, perSecCB, endCB);
  }

  private StopAutoSelectTimer() {
    this.bottomBar.StopAutoSelectTimer();
  }

  /**
   * 驗證資料正確性代碼
   */
  private VerifyDataCode(data): number {
    //連接開發Server時 回傳0 不做驗證判斷
    if (PlatformData.isDevServer || !PlatformData.instance.haveValidationData)
      return 0;

    let legalCode = -1;

    try {
      legalCode = data['status']['id'];
    } catch (err) {
      legalCode = null;
    }

    if (legalCode === null) {
      try {
        legalCode = data['result']['id'];
      } catch (err) {
        legalCode = null;
      }
    }
    if (legalCode === null) legalCode = -1;

    return legalCode;
  }

  //Joya破產補幣提示
  private ShowInSuffcientBalancePopUp(code: number) {
    if (code === ErrorCode.INSUFFICIENT_AMOUNT_STORE)
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(code),
        code.toString(),
        ClickOKHandle.None
      );
  }

  private get isJoya() {
    return PlatformData.logo === enumFromType.Joya;
  }
}
