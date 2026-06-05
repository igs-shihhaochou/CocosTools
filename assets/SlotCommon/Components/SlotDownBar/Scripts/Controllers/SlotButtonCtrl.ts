import {
  _decorator,
  Component,
  sys,
  KeyCode,
  type EventKeyboard,
  Input,
  input,
  Node,
} from 'cc';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIEvent} from '../Define/SlotUIEvent';
import {SlotUISwitch} from '../Define/SlotUISwitch';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {SlotUIBtnType} from '../Buttons/SlotUIBtnType';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import {SlotGameMediator} from '../../../../../SlotModule/Define/SlotGameMediator';
import Functions from 'db://assets/CommonModule/Script/Utility/Functions';
import type {UrlParameterFormat} from 'db://assets/CommonModule/Script/Type/CommonDefine';
const {ccclass, property} = _decorator;

enum ButtonState {
  waitSpinStatus,
  blockSpinStatus,
  waitStopStatus,
  blockStopStatus,
  waitTakeStatus,
  blockTakeStatus,
  waitStartStatus,
  blockStartStatus,
}

@ccclass('SlotButtonCtrl')
export class SlotButtonCtrl extends Component {
  @property(Node)
  private spinButton: Node = null;
  private isAutoSpinning = false;
  private isSpecialGame = false;
  private status = ButtonState.waitSpinStatus;
  private isOpeningAnim = false;
  private setEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    //#region 首要操作按鈕
    SlotGDK.event(SlotUIBtnEvent.SpinClicked)[func](this.blockSpinStatus, this);
    SlotGDK.event(SlotUIBtnEvent.StopClicked)[func](this.blockStopStatus, this);
    SlotGDK.event(SlotUIBtnEvent.TakeClicked)[func](this.blockTakeStatus, this);
    SlotGDK.event(SlotUIBtnEvent.StartClicked)[func](
      this.blockStartStatus,
      this
    );
    //#endregion
    //#region 額外操作按鈕
    SlotGDK.event(SlotUIBtnEvent.TurboClicked)[func](this.onTurboClicked, this);
    SlotGDK.event(SlotUIBtnEvent.StopTurboClicked)[func](
      this.onStopTurboClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.TurboPhase1Clicked)[func](
      this.onTurboPhase1Clicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.TurboPhase2Clicked)[func](
      this.onTurboPhase2Clicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.StopTurboPhaseClicked)[func](
      this.onStopTurboPhaseClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.BetBtnClicked)[func](this.showBlocker, this);
    SlotGDK.event(SlotUIBtnEvent.BetConfirmClicked)[func](
      this.hideBlocker,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.BetCancelClicked)[func](
      this.hideBlocker,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.AutoClicked)[func](this.showBlocker, this);
    SlotGDK.event(SlotUIBtnEvent.AutoSpinConfirmClicked)[func](
      this.hideBlocker,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.AutoSpinCancelClicked)[func](
      this.hideBlocker,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.ExtraBetClicked)[func](
      this.onExtrabetClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.StopExtraBetClicked)[func](
      this.onStopExtraBetClicked,
      this
    );
    SlotGDK.event(SlotUIEvent.PanelOpened)[func](
      this.unregisterKeyBoardEvent,
      this
    );
    SlotGDK.event(SlotUIEvent.PanelClosed)[func](
      this.registerKeyBoardEvent,
      this
    );
    //#endregion
    //#region 設定menu事件
    SlotGDK.event(SlotUIBtnEvent.CloseSettingClicked)[func](
      this.onCloseSettingClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.FullScreenClicked)[func](
      this.onFullScreenClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.ExitFullScreenClicked)[func](
      this.onExitFullScreenClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.OnScreenFullScreenClicked)[func](
      this.onFullScreenClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.OnScreenExitFullScreenClicked)[func](
      this.onExitFullScreenClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.MuteClicked)[func](this.onMuteClicked, this);

    SlotGDK.event(SlotUIBtnEvent.UnmuteClicked)[func](
      this.onUnmuteClicked,
      this
    );

    //#region iOS Chrome FullScreen
    const isChromeInIos = navigator.userAgent.indexOf('CriOS') >= 0;
    const {enableFullScreenInIosChrome} = SlotUISwitch;
    if (
      sys.os === sys.OS.IOS &&
      ((isChromeInIos && enableFullScreenInIosChrome) || !isChromeInIos)
    ) {
      SlotGDK.event(SlotUIEvent.IOSExitFullScreen)[func](
        this.onExitFullScreenClicked,
        this
      );
      SlotGDK.event(SlotUIEvent.IOSSetFullScreen)[func](
        this.onIosSetToFullScreen,
        this
      );
    }
    this.registerWindowFullScreenEvent(option);
    //#endregion
    //#region SlotGDK事件
    SlotGDK.instance.eventWaitForWheelStop[func](this.onWaitForWheelStop, this);
    SlotGDK.instance.eventWheelStop[func](this.onWheelAllStop, this);
    SlotGDK.instance.eventReadyToSpin[func](this.waitSpinStatus, this);
    SlotGDK.instance.eventActiveTakeBtn[func](this.activeTakeBtn, this);
    SlotGDK.instance.eventShowEnterSpecialGameBtn[func](
      this.waitStartStatus,
      this
    );
    SlotGDK.instance.eventSpecialGameStarted[func](
      this.startSpecialGameStatus,
      this
    );
    SlotGDK.instance.eventSpecialGameEnded[func](this.onSpecialGameEnded, this);
    SlotGDK.instance.eventIsRecoveryStatus[func](this.blockStartStatus, this);
    SlotGDK.instance.eventActiveAutoSpin[func](this.autoSpinStatus, this);
    SlotGDK.instance.eventStopAutoSpin[func](this.stopAutoSpinStatus, this);
    SlotGDK.instance.eventShowStopBtn[func](this.waitStopStatus, this);
    SlotGDK.instance.receiveSpinData[func](this.onSpinDataReturn, this);
    SlotGDK.instance.eventSceneIsReady[func](this.registerKeyBoardEvent, this);
    SlotGDK.instance.eventBlockSpinBtn[func](this.blockSpinStatus, this);
    SlotGDK.instance.eventOnOpeningFinished[func](this.onOpeningFinished, this);
    SlotGDK.instance.eventOnOpeningStart[func](this.onOpeningStart, this);
    SlotGDK.instance.eventTriggerSpecialSpin[func](this.blockSpinStatus, this);
    //#endregion
  }

  private onOpeningStart() {
    this.isOpeningAnim = true;
  }

  private onOpeningFinished() {
    this.isOpeningAnim = false;
  }
  private registerKeyBoardEvent() {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  private unregisterKeyBoardEvent() {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  private exposeButton() {
    SlotGDK.instance.bottomBarSpinBtnNode = this.spinButton;
  }

  public async init() {
    this.setEvent(true);
    const {showAuto, showBackPack, showProfile, showHistory} = SlotUISwitch;
    const {isMute, prizeViewerMode} = PlatformData;

    this.setBtnActive(SlotUIBtnType.Auto, showAuto);
    this.setBtnActive(SlotUIBtnType.Purchase, PlatformData.isUseScoreBox);
    this.setBtnActive(SlotUIBtnType.PrizePreview, prizeViewerMode);
    this.setBtnActive(SlotUIBtnType.Mute, !isMute);
    this.setBtnActive(SlotUIBtnType.Unmute, isMute);
    this.setBtnActive(
      SlotUIBtnType.Backpack,
      PlatformData.userSetting.showBackpack ?? showBackPack
    );
    this.setBtnActive(
      SlotUIBtnType.Profile,
      PlatformData.userSetting.showProfile ?? showProfile
    );
    this.setBtnActive(
      SlotUIBtnType.History,
      PlatformData.userSetting.showGameLog ?? showHistory
    );
    this.initInGameShareBtn();
    this.setHome();
    this.setFullScreen();
    this.exposeButton();
  }

  private async initInGameShareBtn() {
    const showInGameShare = PlatformData.userSetting.ShowInGameShare;
    const shareUrl = PlatformData.userSetting.ShareUrl;
    console.log(
      '[SlotButtonCtrl] InGameShare config:',
      'ShowInGameShare=',
      showInGameShare,
      'ShareUrl=',
      shareUrl
    );

    if (!showInGameShare || !shareUrl) {
      console.log('[SlotButtonCtrl] InGameShare disabled by config');
      this.setBtnActive(SlotUIBtnType.InGameShare, false);
      return;
    }

    // 有 Web Share API 直接顯示
    if (navigator.canShare) {
      console.log('[SlotButtonCtrl] InGameShare using navigator.canShare');
      this.setBtnActive(SlotUIBtnType.InGameShare, true);
      return;
    }

    console.log(
      '[SlotButtonCtrl] navigator.canShare not available, waiting for flutter_inappwebview...'
    );

    // 等待 flutter_inappwebview 注入（最多 30 秒）
    const hasFlutterBridge = await new Promise<boolean>(resolve => {
      if (window.flutter_inappwebview) {
        resolve(true);
        return;
      }
      const interval = 200;
      let elapsed = 0;
      const timer = setInterval(() => {
        elapsed += interval;
        if (window.flutter_inappwebview) {
          clearInterval(timer);
          console.log(
            `[SlotButtonCtrl] flutter_inappwebview detected after ${elapsed}ms`
          );
          resolve(true);
        } else if (elapsed >= 30000) {
          clearInterval(timer);
          console.log(
            '[SlotButtonCtrl] flutter_inappwebview not detected after 30000ms'
          );
          resolve(false);
        }
      }, interval);
    });

    console.log(
      '[SlotButtonCtrl] InGameShare button visible:',
      hasFlutterBridge
    );
    this.setBtnActive(SlotUIBtnType.InGameShare, hasFlutterBridge);
  }

  private setHome() {
    const urlObj = Functions.getURLParameter() as UrlParameterFormat;
    const isDisable = urlObj.homeBtn === 'disable';
    const {showHome} = SlotUISwitch;
    this.setBtnActive(SlotUIBtnType.Home, showHome && !isDisable);
  }

  private setFullScreen() {
    const {isFullscreen} = PlatformData;
    const {showFullScreen, enableFullScreenInIosChrome} = SlotUISwitch;

    // 檢測是否在iframe中
    const isInIframe = this.isInIframe();

    // 檢測是否為iOS Chrome
    const isChromeInIos = navigator.userAgent.indexOf('CriOS') >= 0;

    // 如果是在iframe中，不顯示fullscreen按鈕
    const canShowFullScreen =
      !isInIframe &&
      showFullScreen &&
      (!isChromeInIos || enableFullScreenInIosChrome);

    this.setBtnActive(
      SlotUIBtnType.FullScreen,
      PlatformData.userSetting.showFullScreen ??
        (!isFullscreen && canShowFullScreen)
    );
    this.setBtnActive(
      SlotUIBtnType.OnScreenFullScreen,
      !isFullscreen && canShowFullScreen
    );
    this.setBtnActive(
      SlotUIBtnType.ExitFullScreen,
      PlatformData.userSetting.showFullScreen ??
        (isFullscreen && canShowFullScreen)
    );

    this.setBtnActive(
      SlotUIBtnType.OnScreenExitFullScreen,
      isFullscreen && canShowFullScreen
    );
  }

  /**
   * 檢測當前頁面是否在iframe中
   * @returns {boolean} 是否在iframe中
   */
  private isInIframe(): boolean {
    try {
      // 檢測是否在iframe中
      return window !== window.top;
    } catch (e) {
      // 如果無法訪問window.top（跨域限制），則認為是在iframe中
      return true;
    }
  }

  //#region 新UI按鈕狀態
  private resetAllBtn() {
    this.setBtnEnabled(SlotUIBtnType.Spin, false);
    this.setBtnEnabled(SlotUIBtnType.Stop, false);
    this.setBtnEnabled(SlotUIBtnType.Take, false);
    this.setBtnInteractable(SlotUIBtnType.Auto, false);
    this.setBtnEnabled(SlotUIBtnType.StopAuto, false);
  }

  private activeTakeBtn(option: boolean) {
    if (option) {
      this.waitTakeStatus();
    } else {
      this.blockTakeStatus();
    }
  }

  private setOtherBtnInteractable(option: boolean) {
    const {canChangeBet} = PlatformData.instance;
    const {isFreeSpin} = SlotGDK.instance;
    this.setBtnInteractable(SlotUIBtnType.Backpack, option && !isFreeSpin);
    this.setBtnInteractable(SlotUIBtnType.Bet, option && canChangeBet);
    this.setBtnEnabled(
      SlotUIBtnType.PrizePreview,
      option && PlatformData.prizeViewerMode
    );
    this.setBtnInteractable(SlotUIBtnType.Purchase, option);
    this.setBtnInteractable(SlotUIBtnType.ExtraBet, option && canChangeBet);
    this.setBtnInteractable(SlotUIBtnType.StopExtraBet, option);
    this.setBtnInteractable(SlotUIBtnType.History, option);
  }

  protected onKeyDown(event: EventKeyboard) {
    if (event.keyCode === KeyCode.SPACE) {
      if (
        PlatformData.instance.autospin ||
        PlatformData.licenseSetting.noQuickSpin ||
        SlotGDK.instance.isFreeSpin ||
        this.isOpeningAnim
      ) {
        return;
      }
      switch (this.status) {
        case ButtonState.waitSpinStatus:
          SlotGDK.event(SlotUIBtnEvent.SpinClicked).notify();
          break;
        case ButtonState.waitStopStatus:
          SlotGDK.event(SlotUIBtnEvent.StopClicked).notify();
          break;
        case ButtonState.waitTakeStatus:
          SlotGDK.event(SlotUIBtnEvent.TakeClicked).notify();
          break;
        case ButtonState.waitStartStatus:
          SlotGDK.event(SlotUIBtnEvent.StartClicked).notify();
          break;
      }
    }
  }

  public waitSpinStatus() {
    console.warn('[SlotButtonCtrl]:waitSpinStatus');
    this.status = ButtonState.waitSpinStatus;
    this.setBtnEnabled(SlotUIBtnType.Stop, false);
    this.setBtnEnabled(SlotUIBtnType.Take, false);
    this.setBtnEnabled(SlotUIBtnType.Start, false);
    this.setBtnEnabled(SlotUIBtnType.Spin, !this.isAutoSpinning);
    this.setBtnEnabled(SlotUIBtnType.StopAuto, this.isAutoSpinning);
    if (!PlatformData.licenseSetting.autoPlay) {
      this.setBtnEnabled(SlotUIBtnType.Auto, !this.isAutoSpinning);
    }
    this.setOtherBtnInteractable(!this.isAutoSpinning);
  }

  public blockSpinStatus() {
    console.warn('[SlotButtonCtrl]:blockSpinStatus');
    this.status = ButtonState.blockSpinStatus;
    this.setBtnEnabled(SlotUIBtnType.Stop, false);
    this.setBtnEnabled(SlotUIBtnType.Take, false);
    this.setBtnEnabled(SlotUIBtnType.Start, false);
    this.setBtnActive(SlotUIBtnType.Spin, !this.isAutoSpinning);
    this.setBtnInteractable(SlotUIBtnType.Spin, false);
    this.setBtnEnabled(SlotUIBtnType.StopAuto, this.isAutoSpinning);
    if (!PlatformData.licenseSetting.autoPlay) {
      this.setBtnActive(SlotUIBtnType.Auto, !this.isAutoSpinning);
      this.setBtnInteractable(SlotUIBtnType.Auto, false);
    }
    this.setOtherBtnInteractable(false);
  }

  public waitStopStatus() {
    if (SlotGDK.instance.fastSpin) {
      return;
    }
    console.log('[SlotButtonCtrl]:waitStopStatus');
    this.setBtnEnabled(
      SlotUIBtnType.Stop,
      !this.isAutoSpinning || this.isSpecialGame
    );
    if (PlatformData.licenseSetting.closeSpeedUp) {
      this.setBtnInteractable(SlotUIBtnType.Stop, false);
    }
    this.status = ButtonState.waitStopStatus;
    this.setBtnEnabled(SlotUIBtnType.Take, false);
    this.setBtnEnabled(SlotUIBtnType.Start, false);
    this.setBtnEnabled(SlotUIBtnType.Spin, false);
    this.setBtnEnabled(SlotUIBtnType.StopAuto, this.isAutoSpinning);
    if (!PlatformData.licenseSetting.autoPlay) {
      this.setBtnActive(SlotUIBtnType.Auto, !this.isAutoSpinning);
      this.setBtnInteractable(SlotUIBtnType.Auto, false);
    }
    this.setOtherBtnInteractable(false);
  }

  public blockStopStatus() {
    if (SlotGDK.instance.fastSpin) {
      return;
    }
    this.status = ButtonState.blockStopStatus;
    console.log('[SlotButtonCtrl]:blockStopStatus');
    this.setBtnActive(
      SlotUIBtnType.Stop,
      !this.isAutoSpinning || this.isSpecialGame
    );
    this.setBtnInteractable(SlotUIBtnType.Stop, false);
    this.setBtnEnabled(SlotUIBtnType.Take, false);
    this.setBtnEnabled(SlotUIBtnType.Start, false);
    this.setBtnEnabled(SlotUIBtnType.Spin, false);
    this.setBtnEnabled(SlotUIBtnType.StopAuto, this.isAutoSpinning);
    if (!PlatformData.licenseSetting.autoPlay) {
      this.setBtnActive(SlotUIBtnType.Auto, !this.isAutoSpinning);
      this.setBtnInteractable(SlotUIBtnType.Auto, false);
    }
    this.setOtherBtnInteractable(false);
  }

  public waitTakeStatus() {
    console.log('[SlotButtonCtrl]:waitTakeStatus');
    this.status = ButtonState.waitTakeStatus;
    this.setBtnEnabled(SlotUIBtnType.Take, true);
    this.setBtnEnabled(SlotUIBtnType.Start, false);
    this.setBtnEnabled(SlotUIBtnType.Spin, false);
    this.setBtnEnabled(SlotUIBtnType.Stop, false);
    this.setBtnEnabled(SlotUIBtnType.StopAuto, false);
    if (!PlatformData.licenseSetting.autoPlay) {
      this.setBtnActive(SlotUIBtnType.Auto, !this.isAutoSpinning);
      this.setBtnInteractable(SlotUIBtnType.Auto, false);
    }
    this.setOtherBtnInteractable(false);
  }

  public blockTakeStatus() {
    console.log('[SlotButtonCtrl]:blockTakeStatus');
    this.status = ButtonState.blockTakeStatus;
    this.blockSpinStatus();
  }

  public waitStartStatus() {
    console.log('[SlotButtonCtrl]:waitStartStatus');
    this.status = ButtonState.waitStartStatus;
    this.setBtnEnabled(SlotUIBtnType.Spin, false);
    this.setBtnEnabled(SlotUIBtnType.Stop, false);
    this.setBtnEnabled(SlotUIBtnType.Take, false);
    this.setBtnEnabled(SlotUIBtnType.Start, true);
    if (!PlatformData.licenseSetting.autoPlay) {
      this.setBtnActive(SlotUIBtnType.Auto, !this.isAutoSpinning);
      this.setBtnInteractable(SlotUIBtnType.Auto, false);
    }
    this.setOtherBtnInteractable(false);
  }

  public blockStartStatus() {
    console.log('[SlotButtonCtrl]:blockStartStatus');
    this.status = ButtonState.blockStartStatus;
    this.setBtnEnabled(SlotUIBtnType.Spin, false);
    this.setBtnEnabled(SlotUIBtnType.Stop, false);
    this.setBtnEnabled(SlotUIBtnType.Take, false);
    this.setBtnActive(SlotUIBtnType.Start, true);
    this.setBtnInteractable(SlotUIBtnType.Start, false);

    if (!PlatformData.licenseSetting.autoPlay) {
      this.setBtnActive(SlotUIBtnType.Auto, !this.isAutoSpinning);
      this.setBtnInteractable(SlotUIBtnType.Auto, false);
    }
    this.setOtherBtnInteractable(false);
  }

  public startSpecialGameStatus() {
    this.blockSpinStatus();
  }

  public autoSpinStatus() {
    console.log('[SlotButtonCtrl]:autoSpinStatus');
    this.setBtnEnabled(SlotUIBtnType.Spin, false);
    this.setBtnEnabled(SlotUIBtnType.Stop, false);
    this.setBtnEnabled(SlotUIBtnType.Take, false);
    this.setBtnEnabled(SlotUIBtnType.Start, false);
    this.setBtnEnabled(SlotUIBtnType.Auto, false);
    this.setBtnEnabled(SlotUIBtnType.StopAuto, true);
    this.setOtherBtnInteractable(false);
    this.isAutoSpinning = true;
  }

  public stopAutoSpinStatus() {
    console.log(
      '[SlotButtonCtrl]:stopAutoSpinStatus',
      'prevStatus:',
      ButtonState[this.status]
    );
    this.isAutoSpinning = false;
    switch (this.status) {
      case ButtonState.waitSpinStatus:
      case ButtonState.blockSpinStatus:
        this.blockSpinStatus();
        break;
      case ButtonState.waitStopStatus:
        this.waitStopStatus();
        break;
      case ButtonState.blockStopStatus:
        this.blockStopStatus();
        break;
      case ButtonState.waitTakeStatus:
        this.waitTakeStatus();
        break;
      case ButtonState.blockTakeStatus:
        this.blockTakeStatus();
        break;
    }
  }

  private onTurboPhase1Clicked() {
    this.setBtnEnabled(SlotUIBtnType.StopTurboPhase, false);
    this.setBtnEnabled(SlotUIBtnType.TurboPhase1, false);
    this.setBtnEnabled(SlotUIBtnType.TurboPhase2, true);
  }

  private onTurboPhase2Clicked() {
    this.setBtnEnabled(SlotUIBtnType.StopTurboPhase, false);
    this.setBtnEnabled(SlotUIBtnType.TurboPhase2, false);
    this.setBtnEnabled(SlotUIBtnType.StopTurboPhase, true);
  }

  private onStopTurboPhaseClicked() {
    this.setBtnEnabled(SlotUIBtnType.StopTurboPhase, false);
    this.setBtnEnabled(SlotUIBtnType.TurboPhase1, true);
    this.setBtnEnabled(SlotUIBtnType.TurboPhase2, false);
  }

  private onTurboClicked() {
    this.setBtnEnabled(SlotUIBtnType.Turbo, false);
    this.setBtnEnabled(SlotUIBtnType.StopTurbo, true);
  }

  private onStopTurboClicked() {
    this.setBtnEnabled(SlotUIBtnType.Turbo, true);
    this.setBtnEnabled(SlotUIBtnType.StopTurbo, false);
  }

  public showBlocker() {
    this.setBtnActive(SlotUIBtnType.Blocker, true);
  }

  public hideBlocker() {
    this.setBtnActive(SlotUIBtnType.Blocker, false);
  }

  private onFullScreenClicked() {
    if (sys.os === sys.OS.IOS) {
      return;
    }
    this.setBtnActive(SlotUIBtnType.FullScreen, false);
    this.setBtnActive(SlotUIBtnType.ExitFullScreen, true);
    this.setBtnActive(SlotUIBtnType.OnScreenFullScreen, false);
    this.setBtnActive(SlotUIBtnType.OnScreenExitFullScreen, true);
  }

  private onExitFullScreenClicked() {
    this.setBtnActive(SlotUIBtnType.FullScreen, true);
    this.setBtnActive(SlotUIBtnType.ExitFullScreen, false);
    this.setBtnActive(SlotUIBtnType.OnScreenFullScreen, true);
    this.setBtnActive(SlotUIBtnType.OnScreenExitFullScreen, false);
  }

  private onIosSetToFullScreen() {
    this.setBtnActive(SlotUIBtnType.FullScreen, false);
    this.setBtnActive(SlotUIBtnType.ExitFullScreen, true);
    this.setBtnActive(SlotUIBtnType.OnScreenFullScreen, false);
    this.setBtnActive(SlotUIBtnType.OnScreenExitFullScreen, true);
  }

  private onMuteClicked() {
    this.setBtnActive(SlotUIBtnType.Mute, false);
    this.setBtnActive(SlotUIBtnType.Unmute, true);
  }

  private onUnmuteClicked() {
    this.setBtnActive(SlotUIBtnType.Mute, true);
    this.setBtnActive(SlotUIBtnType.Unmute, false);
  }

  private onExtrabetClicked() {
    this.setBtnEnabled(SlotUIBtnType.ExtraBet, false);
    this.setBtnEnabled(SlotUIBtnType.StopExtraBet, true);
    this.setBtnInteractable(
      SlotUIBtnType.StopExtraBet,
      PlatformData.instance.canChangeBet
    );
  }

  private onStopExtraBetClicked() {
    this.setBtnEnabled(SlotUIBtnType.ExtraBet, true);
    this.setBtnEnabled(SlotUIBtnType.StopExtraBet, false);
    this.setBtnInteractable(
      SlotUIBtnType.ExtraBet,
      PlatformData.instance.canChangeBet
    );
  }

  private setBtnActive(type: SlotUIBtnType, option: boolean) {
    SlotGDK.event(SlotUIEvent.SetBtnActive).notify(type, option);
  }
  private setBtnInteractable(type: SlotUIBtnType, option: boolean) {
    SlotGDK.event(SlotUIEvent.SetBtnInteractable).notify(type, option);
  }

  public onSettingClicked() {
    this.setBtnActive(SlotUIBtnType.Setting, false);
    this.setBtnActive(SlotUIBtnType.CloseSetting, true);
    this.unregisterKeyBoardEvent();
  }

  public onCloseSettingClicked() {
    this.setBtnActive(SlotUIBtnType.Setting, true);
    this.setBtnActive(SlotUIBtnType.CloseSetting, false);
    this.registerKeyBoardEvent();
  }

  private setBtnEnabled(type: SlotUIBtnType, option: boolean) {
    this.setBtnActive(type, option);
    this.setBtnInteractable(type, option);
  }

  private registerWindowFullScreenEvent(option: boolean) {
    const func = option ? 'addEventListener' : 'removeEventListener';
    const onFullScreenChange = () => {
      if (document.fullscreenElement) {
        this.onFullScreenClicked();
      } else {
        this.onExitFullScreenClicked();
      }
    };
    document[func]('fullscreenchange', onFullScreenChange);
    document[func]('webkitfullscreenchange', onFullScreenChange);
    document[func]('MSFullscreenChange', onFullScreenChange);
    document[func]('mozfullscreenchange', onFullScreenChange);
  }
  //#endregion
  //#region slotGDK呼叫按鈕狀態
  public setExtraBetButton(enabled: boolean, status: boolean) {
    if (!enabled) {
      this.setBtnActive(SlotUIBtnType.ExtraBet, false);
      this.setBtnActive(SlotUIBtnType.StopExtraBet, false);
      return;
    }

    if (status) {
      this.onExtrabetClicked();
    } else {
      this.onStopExtraBetClicked();
    }
  }

  private onWheelAllStop() {
    if (PlatformData.instance.autospin) {
      return;
    }
    console.log('[SlotButtonCtrl]:onWheelAllStop');
    if (this.isSpecialGame) {
      this.blockStartStatus();
    } else {
      this.blockStopStatus();
    }
  }

  private onWaitForWheelStop() {
    this.waitStopStatus();
  }

  private onReadyToSpin() {}

  private onSpecialGameEnded() {
    this.blockSpinStatus();
    this.isSpecialGame = false;
  }

  private onSpinDataReturn() {
    this.isSpecialGame =
      SlotGameMediator.instance.mainGameHost.isReadyToEnterSG();
  }
  //#endregion
  protected onDestroy(): void {
    this.setEvent(false);
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }
}
