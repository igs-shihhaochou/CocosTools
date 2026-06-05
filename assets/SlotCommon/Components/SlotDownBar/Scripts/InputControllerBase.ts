import {
  Component,
  _decorator,
  assetManager,
  director,
  type JsonAsset,
} from 'cc';
import {DEV} from 'cc/env';
import CustomCmdSender from '../../../../Common/Script/CustomCmdSender';
import {ClickOKHandle} from '../../../../Common/Script/MessagePopup';
import {
  Define,
  ErrorCode,
} from '../../../../CommonModule/Script/Define/GlobalSetting';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import {UserInfo} from '../../../../CommonModule/Script/Define/UserInfo';
import BQLogger from '../../../../CommonModule/Script/Log/BQLog/BQLogger';
import EventManager from '../../../../CommonModule/Script/Manager/EventManager';
import GameClient, {
  enumFromType,
} from '../../../../CommonModule/Script/Network/GameClient';
import MacrossClient from '../../../../CommonModule/Script/Network/Macross/MacrossClient';
import {
  PlatformGDK,
  EventGameFlow,
  SlotUIFunc,
  GAEventGameFlow,
} from '../../../../CommonModule/Script/Platform/PlatformGDK';
import Functions from '../../../../CommonModule/Script/Utility/Functions';
import {
  GamePlayMode,
  StartGameExArgs,
  SpecialSpinType,
  StopBtnClickedType,
} from '../../../../SlotModule/Define/SlotGameData';
import {SlotGameMediator} from '../../../../SlotModule/Define/SlotGameMediator';
import {SlotGDK} from '../../../../SlotModule/Define/SlotGDK';
import {GameStatus} from '../../../../SlotModule/Host/MainGameHost';
import {SlotUIBtnEvent} from './Buttons/SlotUIBtnEvent';
import {WebViewCtrl} from './Controllers/WebViewCtrl';
import {SlotUI} from './SlotUI';
import PlatformEventNotifier from '../../../../CommonModule/Script/Utility/PlatformEventNotifier';
import {ActivityFWToGame as ATG} from '../../../../CommonModule/Script/Define/GameEventType';
import GameErrorCode from 'db://assets/CommonModule/Script/Core/GameErrorCode';
import MultiLangHandler from 'db://assets/CommonModule/Script/Core/MultiLangHandler';
import GAHandler from 'db://assets/CommonModule/Script/Log/GA/GAHandler';
import {SlotUIEvent} from './Define/SlotUIEvent';
import GameActivityManager from '../../../../CommonModule/Script/Manager/GameActivityManager';

const {ccclass, property} = _decorator;

@ccclass('InputControllerBase')
export class InputControllerBase extends Component {
  @property(SlotUI)
  public bottomBar: SlotUI = null;

  protected resetWinNumberFunction: Function = null;
  protected stopBtnScheduler: Function = null;

  /** 是否為Spin前同步資產 */
  protected needSyncAssetBeforeSpin = false;
  // protected showInternetUnstableTipID = -1;
  // protected showInternetUnstableTipTime = 5; //網路不穩提示的顯示時間

  protected isJackpot = false;
  protected isClickedStop = false;
  private isShowingPopup = false;
  private isFirstPlay = true;
  private _originTick = null;
  /** 使用者選擇的 timeScale 倍速（TurboPhase 切換時記錄） */
  private _userTimeScaleSpeed = 1;

  protected onLoad(): void {
    this._originTick = director.tick.bind(director);
    this.setPlatformGDKEvent(true);
    this.setSlotGDKEvent(true);
    this.setPlatformGDKFunc(true);
    this.initBottomBar();
  }

  private loadJsonConfig(url: string) {
    return new Promise<JsonAsset>((resolve, reject) => {
      console.log('[Inputcontrollerbase]loadJsonConfig');
      assetManager.loadRemote<JsonAsset>(`${url}`, (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log('[Inputcontrollerbase]loadJsonConfig', data);
          resolve(data);
        }
      });
    });
  }
  private async loadAutoSpinConfig() {
    const url = `${PlatformData.gameConfig.RemoteResources}Common/SlotDownBar/AutoSpinConfig.json?Date=${Date.now()}`;
    this.bottomBar.initAutoSpinPicker(await this.loadJsonConfig(url));
  }

  private async loadUISwitchConfig() {
    //北美API使用不同設定
    const suffix = PlatformData.licenseSetting.socialAPI ? '_socialAPI' : '';
    const url = `${PlatformData.gameConfig.RemoteResources}Common/SlotDownBar/SlotUISwitchConfig${suffix}.json?Date=${Date.now()}`;
    this.bottomBar.initSlotUISwitch(await this.loadJsonConfig(url));
  }

  protected setPlatformGDKEvent(option: boolean): void {
    const func = option ? 'insert' : 'remove';
    const p = PlatformGDK.instance;
    p.receiveOriginalStartGameData[func](this.receiveStartGameData, this);
    p.connectServerReady[func](this.connectServerReady, this);
    p.commandDataIsNull[func](this.commandDataIsNull, this);
    p.commandErrorHandler[func](this.commandError, this);
    p.blockActivityInput[func](this.onBlockActivityInput, this);
    p.showPopUpMessageByErrorCode[func](this.showPopupMessageByErrorCode, this);
    p.receiveInGameStartGameData[func](this.receiveInGameStartGameData, this);
  }

  protected setPlatformGDKFunc(option: boolean): void {
    if (option) {
      PlatformGDK.instance.registerFunction(
        SlotUIFunc.GetDownBarGameWin,
        this.getGameWin.bind(this)
      );
    } else {
      PlatformGDK.instance.unregisterFunction(SlotUIFunc.GetDownBarGameWin);
    }
  }

  protected setSlotGDKEvent(option: boolean): void {
    const func = option ? 'insert' : 'remove';
    const s = SlotGDK.instance;
    s.receiveStartGame[func](this.fakeOpeningAnim, this);
    s.receiveSpinData[func](this.receiveSpinData, this);
    s.receiveFeverData[func](this.receiveFeverGameData, this);
    s.receiveDoubleGameData[func](this.ReceiveDoubleGameData, this);
    s.eventIsRecoveryStatus[func](this.onRecoverStatus, this);
    s.eventReadyToSpin[func](this.onReadyToSpin, this);
    s.eventShowAwardFinished[func](this.onShowAwardFinished, this);
    s.eventShowEnterSpecialGameBtn[func](this.showEnterSpecialGameBtn, this);
    s.eventSpecialGameEnded[func](this.onSpecialGameEnded, this);
    s.eventSpecialGameStarted[func](this.onSpecialGameStarted, this);
    s.eventShowTopBar[func](this.showTopBar, this);
    s.eventGameStateChanged[func](BQLogger.setStatus, BQLogger);
    s.eventTriggerSpecialSpin[func](this.startSpecialSpin, this);
    s.eventClickChangeBet[func](this.onBetChanged, this);
    s.eventBeforeLoadingClose[func](this.onBeforeLoadingClose, this);
    s.eventSpin[func](this.onSpin, this);
    s.eventCheckMaxWin[func](this.onCheckMaxWin, this);
    s.eventOnOpeningFinished[func](this.onOpeningAnimFinished, this);
  }

  protected setSlotUIEvent(option: boolean): void {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.SpinClicked)[func](this.onClickSpinButton, this);
    e(SlotUIBtnEvent.StartClicked)[func](this.onClickStartButton, this);
    e(SlotUIBtnEvent.StopClicked)[func](this.onClickStopButton, this);
    e(SlotUIBtnEvent.TakeClicked)[func](this.onClickTakeButton, this);
    e(SlotUIBtnEvent.ExtraBetClicked)[func](this.onClickExtraBetButton, this);
    e(SlotUIBtnEvent.StopExtraBetClicked)[func](
      this.onClickStopExtraBetButton,
      this
    );
    e(SlotUIBtnEvent.TurboClicked)[func](this.onClickTurboButton, this);
    e(SlotUIBtnEvent.StopTurboClicked)[func](this.onClickStopTurboButton, this);
    e(SlotUIBtnEvent.TurboPhase1Clicked)[func](
      this.onClickTurboPhase1Button,
      this
    );
    e(SlotUIBtnEvent.TurboPhase2Clicked)[func](
      this.onClickTurboPhase2Button,
      this
    );
    e(SlotUIBtnEvent.StopTurboPhaseClicked)[func](
      this.onClickStopTurboPhaseButton,
      this
    );
    e(SlotUIBtnEvent.PurchaseClicked)[func](this.onPurchaseClicked, this);
    e(SlotUIEvent.PanelOpened)[func](this.onPanelOpened, this);
    e(SlotUIEvent.PanelClosed)[func](this.onPanelClosed, this);
  }

  protected onDestroy(): void {
    this.setPlatformGDKEvent(false);
    this.setSlotGDKEvent(false);
    this.setPlatformGDKFunc(false);
    this.setIntermissionEvent(false);

    if (this.bottomBar !== null) {
      this.setSlotUIEvent(false);
    }

    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.ASSET_REFRESH,
      this.refreshAsset,
      this
    );
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.ASSET_REFRESH_SCOREBOX,
      this.refreshAssetScorebox,
      this
    );
    this.setPlatformListener(false);
  }

  private async initBottomBar() {
    this.bottomBar.autoSpinCtrl.registerSpinCallback(this.startSpin, this);
    if (!DEV) {
      try {
        await Promise.all([
          this.loadAutoSpinConfig(),
          this.loadUISwitchConfig(),
        ]);
      } catch (err) {
        this.showPopupMessageByErrorCode(ErrorCode.UNKNOWN);
        console.error(err);
      }
    }
  }

  //開關TopBar
  protected showTopBar(option: boolean): void {
    PlatformEventNotifier.showAllUI(option);
  }

  protected DelayToResetWinNum(fDelay: number): void {
    this.resetWinNumberFunction = this.resetWinNum;
    this.scheduleOnce(this.resetWinNum, fDelay);
  }

  protected onClickTurboButton(sendlog = true) {
    //**BQ 埋點 */
    if (sendlog) {
      BQLogger.sendClickTurbo();
    }
    PlatformData.instance.fastspin = true;
    SlotGDK.instance.fastSpin = true;
    this.stopBtnScheduler = () => {
      this.onClickStopButton(StopBtnClickedType.TURBO_AUTO);
    };
    this.schedule(this.stopBtnScheduler, 0.1);
  }

  protected onClickTurboPhase1Button(sendlog = true) {
    //**BQ 埋點 */
    if (sendlog) {
      BQLogger.sendClickTurboPhase1(SlotGDK.instance.isSpecialGame);
    }
    this.onClickTurboButton(false);
    this.setTimeScale(1);
    SlotGameMediator.instance.audioManager.disablePlaySound(false);
    SlotGameMediator.instance.audioManager.setGameSoundMute(false);
  }

  protected onClickTurboPhase2Button(sendlog = true) {
    //**BQ 埋點 */
    if (sendlog) {
      BQLogger.sendClickTurboPhase2(SlotGDK.instance.isSpecialGame);
    }
    this.onClickTurboButton(false);
    this.setTimeScale(3);
    SlotGameMediator.instance.audioManager.disablePlaySound(true);
    SlotGameMediator.instance.audioManager.setGameSoundMute(true);
  }

  protected onClickStopTurboPhaseButton(sendlog = true) {
    //**BQ 埋點 */
    if (sendlog) {
      BQLogger.sendClickStopTurboPhase(SlotGDK.instance.isSpecialGame);
    }
    SlotGameMediator.instance.audioManager.disablePlaySound(false);
    SlotGameMediator.instance.audioManager.setGameSoundMute(false);
    this.onClickStopTurboButton();
    this.setTimeScale(1);
  }

  protected setTimeScale(speed: number) {
    this._userTimeScaleSpeed = speed;
    this.applyTimeScale(speed);
  }

  private applyTimeScale(speed: number) {
    const _originTick = this._originTick;
    const nowSpeed = speed;
    director.tick = function (dt) {
      dt *= nowSpeed;
      _originTick(dt);
    };
  }

  private setIntermissionEvent(option: boolean) {
    if (typeof ActivityModule === 'undefined' || ActivityModule === null) {
      return;
    }
    const f =
      EventManager.instance[
        option ? 'addEventListener' : 'removeEventListener'
      ];
    const actEvent = ActivityModule.ActivityEventName;
    f(actEvent.INTERMISSION_EVENT_BEGIN, this.onIntermissionBegin, this);
    f(actEvent.INTERMISSION_EVENT_ALL_END, this.onIntermissionAllEnd, this);
  }

  private onIntermissionBegin() {
    if (this._userTimeScaleSpeed > 1) {
      this.applyTimeScale(1);
    }
  }

  private onIntermissionAllEnd() {
    if (this._userTimeScaleSpeed > 1) {
      this.applyTimeScale(this._userTimeScaleSpeed);
    }
  }

  protected onClickStopTurboButton() {
    PlatformData.instance.fastspin = false;
    SlotGDK.instance.fastSpin = false;
    this.unschedule(this.stopBtnScheduler);
  }

  protected onPurchaseClicked() {
    if (this.checkTooMuchCoin()) return;
    PlatformEventNotifier.purchase();
  }

  protected onPanelOpened() {
    this.blockActivityInput(true);
  }

  protected onPanelClosed() {
    this.blockActivityInput(false);
  }

  //點下ExtraBet按鈕
  protected onClickExtraBetButton() {
    PlatformData.instance.isExtraBet = true;
    if (SlotGDK.instance.eventClickExtraBet.length > 0) {
      SlotGDK.instance.eventClickExtraBet.notify(true);
    }
  }

  protected onClickStopExtraBetButton() {
    PlatformData.instance.isExtraBet = false;
    if (SlotGDK.instance.eventClickExtraBet.length > 0) {
      SlotGDK.instance.eventClickExtraBet.notify(false);
    }
  }

  //顯示Popup訊息
  public showPopupMessage(
    text: string,
    subText: string,
    clickOkBtnHandle: ClickOKHandle,
    callback = () => {}
  ) {
    WebViewCtrl.instance.closeWebView();

    //   2023/07/12 因應Macross，調整為一律關閉遊戲不做刷新
    if (
      clickOkBtnHandle === ClickOKHandle.RestartGame ||
      clickOkBtnHandle === ClickOKHandle.CloseWeb
    ) {
      PlatformGDK.instance.showPopUpMessage.notify(text, subText, () => {
        Functions.closeGame(PlatformData.isMute);
      });
    } else {
      PlatformGDK.instance.showPopUpMessage.notify(text, subText, callback);
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

  protected showPopupMessageByErrorCode(legalCode: number) {
    let handler: ClickOKHandle = ClickOKHandle.RestartGame;
    let errorMessage = null;
    switch (legalCode) {
      case 3:
        errorMessage = GameErrorCode.GetMessage(GameErrorCode.BET_DATA_ERROR);
        break;
      case 18:
        errorMessage = GameErrorCode.GetMessage(GameErrorCode.GAME_CLOSED);
        break;
      case 17:
        errorMessage = GameErrorCode.GetMessage(GameErrorCode.AGENT_CLOSED);
        break;
      case 112:
        errorMessage = GameErrorCode.GetMessage(GameErrorCode.PLAYER_NOT_FOUND);
        break;
      case 107:
        errorMessage = GameErrorCode.GetMessage(
          GameErrorCode.USERAPI_NOT_FOUND
        );
        break;
      case 103:
        errorMessage = GameErrorCode.GetMessage(
          GameErrorCode.BET_NUMBER_DUPLICATE
        );
        break;
      case 104:
        errorMessage = GameErrorCode.GetMessage(GameErrorCode.BET_AMOUNT_ERROR);
        break;
      case 2:
      case 105:
        errorMessage = GameErrorCode.GetMessage(
          GameErrorCode.BET_BALANCE_INSUFFICIENT
        );
        break;
      case 13:
        errorMessage = GameErrorCode.GetMessage(GameErrorCode.BET_OTHER_ERROR);
        break;
      case 9:
        errorMessage = GameErrorCode.GetMessage(
          GameErrorCode.WALLET_TYPE_ERROR
        );
        break;
      case 6:
        errorMessage = GameErrorCode.GetMessage(
          GameErrorCode.UPDATE_BALANCE_FAILED
        );
        break;
    }
    switch (legalCode) {
      case ErrorCode.INSUFFICIENT_AMOUNT:
      case ErrorCode.MAINTENANCE:
      case ErrorCode.LOGINFAILED_VERIFY_FAILED:
      case ErrorCode.UNKNOWN:
      case ErrorCode.HTML5_WEBGL_NOT_SUPPORT:
        handler = ClickOKHandle.CloseWeb;
        break;
    }

    // 如果找不到對應的錯誤訊息，顯示網路不穩
    if (!errorMessage) {
      errorMessage = PlatformData.instance.errorCodeDic.getValue(
        ErrorCode.UNKNOWN
      );
    }

    this.showPopupMessage(errorMessage, legalCode.toString(), handler);
  }

  protected receiveInGameStartGameData(data) {
    //設定ExtraBet狀態
    if (data.data['ExtraBet']) {
      const {Enable, Status} = data.data['ExtraBet'];
      PlatformData.instance.isExtraBet = Enable && Status;
      SlotGDK.instance.eventClickExtraBet.notify(Enable && Status);
    } else {
      PlatformData.instance.isExtraBet = false;
      SlotGDK.instance.eventClickExtraBet.notify(false);
    }
  }

  protected resetWinNum(): void {
    this.resetWinNumberFunction = null;
  }

  protected onClickSpinButton(): void {
    if (SlotGDK.instance.isFreeSpin) return;
    this.startSpin();
  }

  protected onClickStopButton(
    triggerType: StopBtnClickedType = StopBtnClickedType.Manual
  ): void {
    if (SlotGDK.instance.eventClickStop.length > 0) {
      SlotGDK.instance.eventClickStop.notify(triggerType);
    }
  }

  protected onClickStartButton(): void {
    if (Define.DEBUG_LOG) {
      console.log('%cOnClickStartButton()', 'color:red');
    }
    this.unschedule(this.fakeClickStart);
    if (SlotGDK.instance.eventClickSpGameStartBtn.length > 0)
      SlotGDK.instance.eventClickSpGameStartBtn.notify();
  }

  protected onClickTakeButton(): void {
    if (SlotGDK.instance.eventClickSkipButton.length > 0)
      SlotGDK.instance.eventClickSkipButton.notify();
  }

  /// <summary>
  /// 開關特殊遊戲開始鈕
  /// </summary>
  protected showEnterSpecialGameBtn(): void {
    if (PlatformData.instance.autoStartRecovery) {
      this.scheduleOnce(this.fakeClickStart, 1);
    }
  }

  protected fakeClickStart() {
    SlotGDK.event(SlotUIBtnEvent.StartClicked).notify();
  }

  protected onBetChanged(
    currentLineBet: number,
    currentTotalBet: number,
    originalLineBet: number,
    originalTotalBet: number
  ): void {
    PlatformData.instance.currentLineBet = currentLineBet;
    PlatformData.instance.currentTotalBet = currentTotalBet;
    PlatformData.instance.originalLineBet = originalLineBet;
    PlatformData.instance.originalTotalBet = originalTotalBet;
    PlatformEventNotifier.changeBet(
      currentLineBet,
      currentTotalBet,
      originalLineBet,
      originalTotalBet
    );
  }

  protected onBeforeLoadingClose() {
    PlatformEventNotifier.closeLoading();
    // PlatformEventNotifier.showAllUI(true);
    this.setPlatformListener(true);
    GameActivityManager.instance.AddActivityInitListener(
      this.setIntermissionEvent,
      this,
      true
    );
  }

  protected onSpin() {
    const {currentTotalBet, isExtraBet} = PlatformData.instance;
    PlatformEventNotifier.spin({
      TotalBet: currentTotalBet,
      ExtraBet: isExtraBet,
    });
  }

  protected get noCoin(): boolean {
    const asset = PlatformData.isUseScoreBox
      ? UserInfo.instance.entries
      : UserInfo.instance.balance;
    return (
      PlatformData.instance.currentTotalBet +
        PlatformData.instance.linkingJpBet >
      asset
    );
  }

  protected get tooMuchCoin(): boolean {
    const asset = PlatformData.isUseScoreBox
      ? UserInfo.instance.entries + UserInfo.instance.winnings
      : UserInfo.instance.balance;
    return (
      PlatformData.instance.maxBalance < asset &&
      PlatformData.instance.maxBalance > 0
    );
  }

  protected checkTooMuchCoin() {
    if (this.tooMuchCoin) {
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(ErrorCode.TOO_MUCH_BALANCE),
        ErrorCode.TOO_MUCH_BALANCE.toString(),
        ClickOKHandle.None,
        () => {
          SlotGDK.event(SlotUIBtnEvent.StopAutoClicked).notify();
          this.bottomBar.slotButtonCtrl.waitSpinStatus();
        }
      );
      return true;
    }
    return false;
  }

  /**
   * 開始Spin
   */
  protected startSpin(spinData = null): void {
    if (this.isShowingPopup) return;
    PlatformGDK.instance.sendEventLog.notify(EventGameFlow.firstPlay);
    if (this.isFirstPlay) {
      GAHandler.SendEvent(
        'loading',
        GAEventGameFlow.firstPlay,
        PlatformData.gameName,
        GAHandler.getGameLoadingTime()
      );

      //**BQ埋點 */
      BQLogger.sendFirstPlay();
      this.isFirstPlay = false;
      PlatformData.instance.hasPlayed = true;
    }
    if (Define.DEBUG_LOG) {
      if (!this.needSyncAssetBeforeSpin) {
        console.log('----------開始Spin');
      } else {
        console.log('----------sync asset finished, StartSpin again');
      }
    }

    if (this.checkTooMuchCoin()) return;

    // 餘額不足的處理流程
    if (this.noCoin) {
      if (
        !this.needSyncAssetBeforeSpin &&
        PlatformData.instance.hasGetAssetCmd &&
        !PlatformData.isUseScoreBox
      ) {
        //同步資產流程
        //未同步資產 啟用同步資產流程
        this.needSyncAssetBeforeSpin = true;
        //取得玩家資產
        CustomCmdSender.instance.getAssetData(
          this.receiveGetAssetData.bind(this)
        );
      } else {
        //根據設定顯示餘額不足訊息
        let message = ErrorCode.INSUFFICIENT_AMOUNT;
        if (PlatformData.isDaraEnv) {
          message = ErrorCode.INSUFFICIENT_AMOUNT_STORE;
        }
        if (PlatformData.isUseScoreBox) {
          if (PlatformData.isShowDonate) {
            message = ErrorCode.INSUFFICIENT_AMOUNT_DONATE;
          } else {
            message = ErrorCode.INSUFFICIENT_AMOUNT_PURCHASE;
          }
        }

        this.isShowingPopup = true;
        this.showPopupMessage(
          PlatformData.instance.errorCodeDic.getValue(message),
          ErrorCode.INSUFFICIENT_AMOUNT.toString(),
          ClickOKHandle.None,
          () => {
            SlotGDK.event(SlotUIBtnEvent.StopAutoClicked).notify();
            this.bottomBar.slotButtonCtrl.waitSpinStatus();
            this.blockActivityInput(false);
            this.isShowingPopup = false;
            PlatformEventNotifier.insufficientAmount();
          }
        );
        this.needSyncAssetBeforeSpin = false;
        return;
      }
    } else {
      //資產足夠 確保關閉同步資產流程
      this.needSyncAssetBeforeSpin = false;
      //遊戲Spin中，使活動模組裡的活動無法點擊
      this.blockActivityInput(true);
    }

    SlotGDK.instance.fastSpin = PlatformData.instance.fastspin;

    //啟用同步資產流程則略過第二段
    if (this.needSyncAssetBeforeSpin) return;

    //Spin流程 第二段 (AutoSpin次數減少、快速跳到最後贏分、設定停輪時間、餘額假扣、Spin事件觸發、網路不穩計時、發送Spin封包)
    // InputCtr事件
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
    if (!spinData) {
      this.bottomBar.assetDisplayCtrl.onSpinStart();
    } else {
      // PlatformGDK.instance.updatePlayerBalance.notify(
      //   UserInfo.instance.balance -
      //     Functions.getValueByRatio(
      //       this.bottomBar.itemCtrl.betAmt,
      //       PlatformData.currencyRatio
      //     )
      // );
    }

    // this.showInternetUnstableTipID = setTimeout(() => {
    //   this.bottomBar.showInternetUnstableTip(true);
    // }, this.showInternetUnstableTipTime * 1000);

    //Send Cmd
    if (SlotGDK.instance.eventSpin.length > 0) {
      SlotGDK.instance.eventSpin.notify(spinData);
    }
  }

  /**
   * 開始SpecialSpin
   */
  protected startSpecialSpin(
    specialSpinType: SpecialSpinType = null,
    spinData = null
  ): void {
    if (Define.DEBUG_LOG) {
      console.log('----------開始SpecialSpin');
    }

    //資產足夠 確保關閉同步資產流程
    this.needSyncAssetBeforeSpin = false;
    //遊戲Spin中，使活動模組裡的活動無法點擊
    this.blockActivityInput(true);

    //Client 先根據特殊Spin類型假扣
    switch (specialSpinType) {
      case SpecialSpinType.BUYBONUS:
        // BuyBonus模組內部處理
        break;
      case SpecialSpinType.ITEM:
        // PlatformGDK.instance.updatePlayerBalance.notify(
        //   UserInfo.instance.balance -
        //     Functions.getValueByRatio(
        //       this.bottomBar.itemCtrl.betAmt,
        //       PlatformData.currencyRatio
        //     )
        // );
        break;
      default:
        if (!SlotGDK.instance.isFreeSpin) {
          this.bottomBar.assetDisplayCtrl.onSpinStart();
        }
        break;
    }

    if (SlotGDK.instance.eventSpin.length > 0) {
      SlotGDK.instance.eventSpin.notify(spinData);
    }
  }

  /// <summary>
  /// Game告訴平台現在目前為ReadyToSpin狀態
  /// </summary>
  protected onReadyToSpin(): void {
    if (Define.DEBUG_LOG) {
      console.log('[MachineHostEx] OnReadyToSpin()');
    }
    //Check Auto Spin
    PlatformEventNotifier.betWait(); //須關閉autoSpin
    if (!PlatformData.instance.autospin) {
      if (Define.DEBUG_LOG) {
        console.log('[MachineHostEx] m_bIsAutoSpin = false');
      }
      this.blockActivityInput(false);
    } else {
      if (Define.DEBUG_LOG) {
        console.log('[MachineHostEx] m_bIsAutoSpin = true');
      }
    }
  }

  //進入免費遊戲
  protected onSpecialGameStarted() {
    SlotGDK.instance.isSpecialGame = true;
    PlatformEventNotifier.specialGame();
    GameActivityManager.instance?.SetActivityHudDisplay(false, this);
  }

  //免費遊戲結束
  protected onSpecialGameEnded(): void {
    SlotGDK.instance.isSpecialGame = false;
    PlatformGDK.instance.updatePlayerBalance.notify();
    GameActivityManager.instance?.SetActivityHudDisplay(true, this);
  }

  //接收Spin資料
  protected receiveSpinData(data) {
    //關閉網路不穩的提示和Timeout
    // if (this.showInternetUnstableTipID !== -1) {
    //   clearTimeout(this.showInternetUnstableTipID);
    //   this.showInternetUnstableTipID = -1;
    //   this.bottomBar.showInternetUnstableTip(false);
    // }

    if (data.hasOwnProperty('data')) {
      const dataJson: JSON = data['data'];

      if (PlatformData.isMacrossEnv || PlatformData.useCert) {
        PlatformData.instance.lastMacrossUpdateBalanceTs = data['ts'] * 1000;
      }
      this.updatePlayerAsset(data);
      //Linking Jackpot
      if (dataJson.hasOwnProperty('jackpot_win')) {
        this.isJackpot = true;
        // this.bottomBar.linkingJpMgr.SetJackpotWinInfo(dataJson['jackpot_win']);
      } else {
        this.isJackpot = false;
      }
      PlatformEventNotifier.sendAchieveMarquee(data);
    }
  }

  //**Todo default需要增加收到的雙幣資料 */
  protected updatePlayerAsset(data: JSON) {
    try {
      switch (PlatformData.logo) {
        case 'Joya':
          if (
            data['data'].hasOwnProperty('balance') &&
            data['data']['balance'].hasOwnProperty('Coin')
          )
            UserInfo.instance.balance = data['data']['balance']['Coin'];
          break;
        case 'playgd':
        case 'magiccity':
          if (data['playerInfo'].hasOwnProperty('playerEntries'))
            UserInfo.instance.entries = data['playerInfo']['playerEntries'];
          if (data['playerInfo'].hasOwnProperty('playerTotalWin'))
            UserInfo.instance.winnings = data['playerInfo']['playerTotalWin'];
          if (data['playerInfo'].hasOwnProperty('playerEntries'))
            UserInfo.instance.balance = data['playerInfo']['playerEntries'];
          break;
        default: {
          // 雙幣格式
          this.updateUserAssetFromData(data['data']);
          // 單幣格式(舊版)
          if (data['data'].hasOwnProperty('balance'))
            UserInfo.instance.balance = data['data']['balance'];
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  protected onRecoverStatus(): void {
    if (Define.DEBUG_LOG) {
      console.log('[MachineHostEx] OnRecoverStatus()');
    }

    this.blockActivityInput(true);
  }

  /// <summary>
  /// 報獎結束
  /// </summary>
  protected onShowAwardFinished() {
    if (SlotGDK.instance.getPlayMode() === GamePlayMode.Normal) {
      PlatformGDK.instance.updatePlayerBalance.notify();
    }
  }

  protected connectServerReady() {
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

  protected setJoyaUserInfoData() {
    UserInfo.instance.nickName = MacrossClient.aid.toString();
    this.bottomBar.labelCtrl.setUserName(UserInfo.instance.nickName);
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.ASSET_REFRESH,
      this.refreshAsset,
      this
    );
    GameClient.instance.joyaSendGetAsset();
    PlatformGDK.instance.updatePlayerBalance.notify(UserInfo.instance.balance);
  }

  //接收UserInfo資料
  protected receiveUserInfoData(result, data) {
    const cmdData = data['cmd_data'];

    console.log(
      '[command]onReceiveUserInfoData' + JSON.stringify(cmdData),
      cmdData
    );
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.verifyDataCode(cmdData);
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
      const raw = cmdData['data'];

      // 單幣格式
      balance = cmdData['data']['Balance'];
      // 雙幣格式處理
      this.updateUserAssetFromData(raw);
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

      // window.eventLogNickName = UserInfo.instance.nickName;

      this.bottomBar.labelCtrl.setUserName(UserInfo.instance.nickName);

      if (!PlatformData.isUseScoreBox) {
        PlatformGDK.instance.updatePlayerBalance.notify(
          UserInfo.instance.balance
        );

        EventManager.instance.addEventListener(
          PlatformData.gameEventName.ASSET_REFRESH,
          this.refreshAsset,
          this
        );
      } else {
        PlatformGDK.instance.updatePlayerBalance.notify();

        EventManager.instance.addEventListener(
          PlatformData.gameEventName.ASSET_REFRESH_SCOREBOX,
          this.refreshAssetScorebox,
          this
        );
      }
    }
  }

  /**
   * 定時同步資產的處理
   * @param asset
   */
  protected refreshAsset(asset: number, ts: number) {
    if (SlotGameMediator.instance !== null) {
      if (
        SlotGameMediator.instance.mainGameHost.getNowGameStatus ===
        GameStatus.ReadyToSpin
      ) {
        if (PlatformData.isMacrossEnv || PlatformData.useCert) {
          PlatformData.instance.lastMacrossUpdateBalanceTs = ts;
        }
        UserInfo.instance.balance = asset;
        PlatformGDK.instance.updatePlayerBalance.notify(asset);
      } else if (
        SlotGameMediator.instance.mainGameHost.getNowGameStatus ===
          GameStatus.ProcessStart &&
        PlatformData.isDaraEnv
      ) {
        UserInfo.instance.balance = asset;
        PlatformGDK.instance.updatePlayerBalance.notify(asset);
      }
    }
  }

  /**
   * 定時同步雙幣Scorebox資產
   * @param data
   */
  protected refreshAssetScorebox(data) {
    this.receiveGetAssetData(null, data);
  }

  /**
   * 接收到GetAsset資料
   * data:{
      "Code":0,
      "Coin":null  # 抓"Credit"的Coin, 兼容舊流程，抓不到為0
      "Asset":[{"Coin":516156, "Type":"Entries"},{"Coin":516156, "Type":"Winnings"}] #雙幣玩家
      "Asset":[{"Coin":516156, "Type":"Credit"}]  #單幣玩家
    }
   * @param data
   */
  protected receiveGetAssetData(result, data) {
    const cmdData = data.cmd_data;

    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.verifyDataCode(cmdData);
    if (legalCode !== 0) {
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(ErrorCode.UNKNOWN),
        legalCode.toString(),
        ClickOKHandle.RestartGame
      );
      return;
    }
    //更新資產
    try {
      if (PlatformData.isMacrossEnv || PlatformData.useCert) {
        const ts: number = data.cmd_data['ts'];
        if (ts <= PlatformData.instance.lastMacrossUpdateBalanceTs) {
          if (this.needSyncAssetBeforeSpin) {
            this.startSpin();
          }
          return;
        }
        PlatformData.instance.lastMacrossUpdateBalanceTs = ts;
      }

      // 雙幣格式處理（直接爆錯不防呆）
      if (Array.isArray(cmdData['asset']) && PlatformData.isUseScoreBox) {
        this.updateUserAssetFromData(cmdData);
        PlatformGDK.instance.updatePlayerBalance.notify(
          UserInfo.instance.entries
        );
      } else {
        // 舊封包格式（單幣）
        UserInfo.instance.balance = cmdData['Asset'] ?? cmdData['Coin'];
        PlatformGDK.instance.updatePlayerBalance.notify(
          UserInfo.instance.balance
        );
      }
    } catch (err) {
      console.error(err);
    }

    if (this.needSyncAssetBeforeSpin) {
      this.startSpin();
    }
  }

  //接收StartGame資料
  protected receiveStartGameData(data) {
    console.log('[InputControllerBase] receiveStartGameData', data);
    if (data.hasOwnProperty('data')) {
      //初始化BottomBar
      const dataJson: JSON = data['data'];
      this.setSlotUIEvent(true);
      PlatformData.licenseSetting.oddsInfo = dataJson['odds'];
      PlatformData.licenseSetting.infoMaxWinOdds = dataJson['MaxOdds'];
      const betlist = dataJson['bet_list'];
      PlatformData.licenseSetting.infoMaxPayout =
        dataJson['MaxOdds'] *
        betlist[0]['total_bet'] *
        PlatformData.currencyRatio;
      PlatformData.licenseSetting.infoMinBet =
        betlist[betlist.length - 1]['total_bet'] * PlatformData.currencyRatio;
      PlatformData.licenseSetting.infoMaxBet =
        betlist[0]['total_bet'] * PlatformData.currencyRatio;
      PlatformData.licenseSetting.extraInfo = dataJson['extra_info'];
      if (dataJson['Rtp'] !== undefined) {
        PlatformData.licenseSetting.rtp = dataJson['Rtp'];
      }
      if (dataJson['ExtraRtp'] !== undefined) {
        PlatformData.licenseSetting.extraBetRtp = dataJson['ExtraRtp'];
      }
      if (dataJson['ProbId'] !== undefined) {
        PlatformData.licenseSetting.probId = dataJson['ProbId'];
      }
      if (dataJson['jp_bet']) {
        PlatformData.instance.linkingJpBet = dataJson['jp_bet'] ?? 0;
      }
      PlatformData.instance.maxBalance = dataJson['max_balance'] ?? 0;
      PlatformData.licenseSetting.showBtnInfo =
        PlatformData.gameSetting.IsShowInfoPageBtn ?? true;
      PlatformData.licenseSetting.showBetInfo =
        PlatformData.gameSetting.IsShowInfoPageBetInfo ?? true;
      PlatformData.licenseSetting.infoMaxLines = dataJson['max_lines'];
      console.log(
        '[receiveStartGameData] PlatformData.gameSetting',
        PlatformData.gameSetting
      );
      const Args: StartGameExArgs = new StartGameExArgs().parse(data['data']);
      this.bottomBar.init(Args);

      //2021-10-25 新增:加入ExtraBet功能
      if (Args.extraBetInfo) {
        //如果"Enable"參數為true，就顯示ExtraBet按鈕
        if (Args.extraBetInfo.enabled) {
          PlatformData.instance.isExtraBet = Args.extraBetInfo.status;
        }
      }

      //Recovery顯示金錢
      if (dataJson.hasOwnProperty('total_win_amount')) {
        if (dataJson['total_win_amount'] > 0)
          PlatformGDK.instance.rollGameWin.notify(
            dataJson['total_win_amount'],
            0
          );
      }
      this.updatePlayerAsset(data);
      this.bottomBar.assetDisplayCtrl.updatePlayerBalance();
    }
  }

  //接收FeverGame資料
  protected receiveFeverGameData(data) {
    if (data.hasOwnProperty('data')) {
      if (PlatformData.isMacrossEnv || PlatformData.useCert) {
        PlatformData.instance.lastMacrossUpdateBalanceTs = data['ts'] * 1000;
      }
      this.updatePlayerAsset(data);
      PlatformEventNotifier.sendAchieveMarquee(data);
    }
  }

  //接收比倍遊戲資料
  protected ReceiveDoubleGameData(data) {
    if (data.hasOwnProperty('data')) {
      const dataJson: JSON = data['data'];

      if (dataJson.hasOwnProperty('balance')) {
        if (PlatformData.isMacrossEnv || PlatformData.useCert) {
          PlatformData.instance.lastMacrossUpdateBalanceTs = data['ts'] * 1000;
        }
        this.updatePlayerAsset(data);
      }
    }
  }

  //整個資料是空的(Token失效)
  protected commandDataIsNull(errorCode) {
    //關閉網路不穩的提示和Timeout
    // if (this.showInternetUnstableTipID !== -1) {
    //   clearTimeout(this.showInternetUnstableTipID);
    //   this.showInternetUnstableTipID = -1;
    //   this.bottomBar.showInternetUnstableTip(false);
    // }

    //統一Show網路異常並踢回大廳
    this.showPopupMessage(
      PlatformData.instance.errorCodeDic.getValue(errorCode),
      errorCode.toString(),
      ClickOKHandle.CloseWeb
    );
  }

  //封包Error
  protected commandError(errorCode) {
    //關閉網路不穩的提示和Timeout
    // if (this.showInternetUnstableTipID !== -1) {
    //   clearTimeout(this.showInternetUnstableTipID);
    //   this.showInternetUnstableTipID = -1;
    //   this.bottomBar.showInternetUnstableTip(false);
    // }

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
  public blockActivityInput(isBlock = true) {
    SlotGDK.instance.eventBlockActivityBtn.notify(isBlock);
    PlatformGDK.instance.blockActivityInput.notify(isBlock);
  }

  protected onBlockActivityInput(isBlock: boolean) {
    PlatformEventNotifier.blockActivity(isBlock);
  }

  /**
   * 驗證資料正確性代碼
   */
  protected verifyDataCode(data): number {
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
        legalCode = data['Code'];
      } catch (err) {
        legalCode = null;
      }
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
  protected showInSuffcientBalancePopUp(code: number) {
    if (code === ErrorCode.INSUFFICIENT_AMOUNT_STORE)
      this.showPopupMessage(
        PlatformData.instance.errorCodeDic.getValue(code),
        code.toString(),
        ClickOKHandle.None
      );
  }

  private setPlatformListener(option) {
    const func = option ? 'addEventListener' : 'removeEventListener';
    window[func]('message', event => {
      this.platformEventHandler(event as MessageEvent);
    });
  }

  private platformEventHandler(event: MessageEvent) {
    if (!event.data.type) {
      return;
    }
    // 同window下可能收到遊戲送出的訊息，需排除
    if (event.data.from && event.data.from === 'game') {
      return;
    }
    if (event.data.type.includes('act-fw')) {
      switch (event.data.name) {
        case ATG.Balance.UpdateAsset:
        case ATG.Balance.UpdateBalance:
        case ATG.Balance.UpdateEntries:
        case ATG.Balance.UpdateWinnings:
          this.updatePlayerAssetFromPlatform(event.data);
          break;
        case ATG.Interrupt.Leave:
        case ATG.Interrupt.Play:
        case ATG.Interrupt.Refresh:
          this.recieveInterruptSignal();
          break;
      }
    }
  }

  private updatePlayerAssetFromPlatform(data: {
    entries?: number;
    winnings?: number;
    balance?: number;
  }) {
    try {
      switch (PlatformData.logo) {
        case 'Joya':
          if (data.entries !== undefined) {
            UserInfo.instance.entries = data.entries;
          }
          if (data.winnings !== undefined) {
            UserInfo.instance.winnings = data.winnings;
          }
          if (data.balance !== undefined) {
            UserInfo.instance.balance = data.balance;
          }
          break;
        case 'playgd':
        case 'magiccity':
          if (data.entries !== undefined) {
            UserInfo.instance.entries = data.entries;
          }
          if (data.winnings !== undefined) {
            UserInfo.instance.winnings = data.winnings;
          }
          if (data.entries !== undefined) {
            UserInfo.instance.balance = data.entries;
          }
          break;
        default:
          if (data.entries !== undefined) {
            UserInfo.instance.entries = data.entries;
          }
          if (data.winnings !== undefined) {
            UserInfo.instance.winnings = data.winnings;
          }
          if (data.balance !== undefined) {
            UserInfo.instance.balance = data.balance;
          }
          break;
      }
    } catch (err) {
      console.error(err);
    }
    PlatformGDK.instance.updatePlayerBalance.notify();
  }

  private recieveInterruptSignal() {
    if (PlatformData.instance.autospin) {
      SlotGDK.event(SlotUIBtnEvent.StopAutoClicked).notify();
    }
  }

  protected onCheckMaxWin(
    data,
    callback?: Function,
    showCustomMaxwin = false,
    onShowCustomMaxWinFunc?: Function
  ) {
    if (
      data?.hasOwnProperty('hit_max_win') &&
      (data['hit_max_win'] as boolean)
    ) {
      let str = MultiLangHandler.getGameText('SlotUIMsg_MaxWin');
      const maxOdds = PlatformData.licenseSetting.infoMaxWinOdds
        ? PlatformData.licenseSetting.infoMaxWinOdds
        : 0;
      str = str.replace('{0}', maxOdds.toString());
      if (showCustomMaxwin) {
        SlotGDK.instance.eventShowCustomMaxWin.notify(maxOdds, callback);
        onShowCustomMaxWinFunc?.();
      } else {
        PlatformGDK.instance.showPopUpMessage.notify(str, 'Max', callback);
      }
    } else {
      callback?.();
    }
  }

  private getGameWin(): number {
    return this.bottomBar.gameWinCtrl.getGameWin();
  }

  private onOpeningAnimFinished() {
    SlotGDK.instance.openingAnimFinished = true;
  }

  private updateUserAssetFromData(data: {
    asset: {Type: string; Coin: string}[];
  }): void {
    if (!data.asset || !PlatformData.isUseScoreBox) {
      return;
    }

    const assetArray = data.asset;

    const entriesObj = assetArray.find(a => a.Type === 'entries');
    const winningsObj = assetArray.find(a => a.Type === 'winnings');

    const entries = Number(entriesObj.Coin);
    const winnings = Number(winningsObj.Coin);

    UserInfo.instance.entries = entries;
    UserInfo.instance.winnings = winnings;
  }

  private fakeOpeningAnim() {
    if (PlatformData.gameSetting.NoOpeningAnim) {
      SlotGDK.instance.eventOnOpeningFinished.notify();
    }
  }
}
