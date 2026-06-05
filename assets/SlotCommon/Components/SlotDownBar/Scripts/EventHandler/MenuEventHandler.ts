import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import Functions from '../../../../../CommonModule/Script/Utility/Functions';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {PlatformGDK} from '../../../../../CommonModule/Script/Platform/PlatformGDK';
import {WebViewCtrl} from '../Controllers/WebViewCtrl';
import {
  LangType,
  MultLang,
} from '../../../../../SlotModule/UIComponent/MultLang';
import {Component, _decorator, sys} from 'cc';
import PlatformEventNotifier from '../../../../../CommonModule/Script/Utility/PlatformEventNotifier';
import BQLogger from '../../../../../CommonModule/Script/Log/BQLog/BQLogger';
import {DEV} from 'cc/env';

const {ccclass} = _decorator;

@ccclass('MenuEventHandler')
export class MenuEventHandler extends Component {
  private zoomLogSent = false;
  private exitZoomLogSent = false;
  private onScreenZoomLogSent = false;
  private onScreenExitZoomLogSent = false;

  onLoad() {
    this.setEvents(true);
  }

  onDestroy() {
    this.setEvents(false);
  }

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.MuteClicked)[func](this.onMuteClicked, this);
    e(SlotUIBtnEvent.UnmuteClicked)[func](this.onUnmuteClicked, this);
    e(SlotUIBtnEvent.FullScreenClicked)[func](this.onClickZoom, this);
    e(SlotUIBtnEvent.ExitFullScreenClicked)[func](this.onClickExitZoom, this);
    e(SlotUIBtnEvent.OnScreenFullScreenClicked)[func](
      this.onClickOnScreenZoom,
      this
    );
    e(SlotUIBtnEvent.OnScreenExitFullScreenClicked)[func](
      this.onClickOnScreenExitZoom,
      this
    );
    e(SlotUIBtnEvent.HistoryClicked)[func](this.onHistoryClicked, this);
    e(SlotUIBtnEvent.InfoClicked)[func](this.onInfoClicked, this);
    SlotGDK.instance.eventShowTopBar[func](this.onShowTopBar, this);
  }

  private onMuteClicked() {
    //**BQ埋點 */
    const VOICE_MUTE = '0'; // 代表靜音
    BQLogger.sendClickVoice(VOICE_MUTE);
    SlotGDK.instance.setMuted(true);
    PlatformEventNotifier.setMute(true);
  }

  private onUnmuteClicked() {
    //**BQ埋點 */
    const VOICE_UNMUTE = '1'; // 代表開啟音效
    BQLogger.sendClickVoice(VOICE_UNMUTE);
    SlotGDK.instance.setMuted(false);
    PlatformEventNotifier.setMute(false);
  }

  private onWebviewClose() {
    if (PlatformData.instance.autospin) {
      return;
    }
    this.blockActivityInput(false);
  }

  private onClickZoom() {
    //**BQ埋點 */
    if (!this.zoomLogSent) {
      BQLogger.sendClickZoom();
      this.zoomLogSent = true;
    }
    this.setFullScreen();
  }

  private onClickExitZoom() {
    //**BQ埋點 */
    if (!this.exitZoomLogSent) {
      BQLogger.sendClickExitZoom();
      this.exitZoomLogSent = true;
    }
    this.exitFullScreen();
  }

  private onClickOnScreenZoom() {
    //**BQ埋點 */
    if (!this.onScreenZoomLogSent) {
      BQLogger.sendClickOnScreenZoom();
      this.onScreenZoomLogSent = true;
    }
    this.setFullScreen();
  }

  private onClickOnScreenExitZoom() {
    //**BQ埋點 */
    if (!this.onScreenExitZoomLogSent) {
      BQLogger.sendClickOnScreenExitZoom();
      this.onScreenExitZoomLogSent = true;
    }
    this.exitFullScreen();
  }

  private setFullScreen() {
    // 檢測是否在iframe中
    if (this.isInIframe()) {
      return; // 在iframe中不執行fullscreen
    }

    if (sys.os === sys.OS.IOS) {
      return;
    }

    try {
      // 使用更安全的fullscreen請求方式，處理不同瀏覽器的兼容性
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(error => {
          console.warn('Standard fullscreen request failed:', error);
        });
      } else if (element['webkitRequestFullscreen']) {
        element['webkitRequestFullscreen']();
      } else if (element['msRequestFullscreen']) {
        element['msRequestFullscreen']();
      } else if (element['mozRequestFullScreen']) {
        element['mozRequestFullScreen']();
      }
    } catch (error) {
      console.warn('Fullscreen request failed:', error);
    }
  }

  private exitFullScreen() {
    // 檢測是否在iframe中
    if (this.isInIframe()) {
      return; // 在iframe中不執行fullscreen
    }
    if (sys.os === sys.OS.IOS) {
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
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

  private blockActivityInput(isBlock: boolean) {
    SlotGDK.instance.eventBlockActivityBtn.notify(isBlock);
    PlatformGDK.instance.blockActivityInput.notify(isBlock);
    PlatformEventNotifier.blockActivity(isBlock);
  }

  private onHistoryClicked() {
    let url: string = (PlatformData.gameConfig.GameLog as string).replace(
      '%version',
      PlatformData.gameLogVersion
    );
    //**BQ埋點 */
    BQLogger.sendHistory();

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
    url += '&ShowCloseBtn=true';

    const eventListStr: string = PlatformData.event;
    const eventList = (eventListStr as string).split(',');
    if (eventList.length >= 3) {
      url += '&log=' + eventList[2];
      url += '&ApiUrl=' + eventList[2];
    }

    url += '&lang=' + PlatformData.lang;

    if (
      PlatformData.isMacrossEnv ||
      (PlatformData.certArea !== '' && PlatformData.certId !== '')
    ) {
      //TODO:改別的方式取網址3
      url +=
        '&MarcossLogServer=' + PlatformData.instance.lobbyArkClient.gameUrl;
      url += '&arkID=' + PlatformData.instance.lobbyArkClient.arkId;
      url += '&arkToken=' + PlatformData.instance.lobbyArkClient.arkToken;
      url += '&isMacrossEnv=true';
    }

    if (PlatformData.licenseSetting.logShowEndBalance) {
      url += `&showEndBalance=${PlatformData.licenseSetting.logShowEndBalance}`;
    }

    this.registerIFrameEvent();

    WebViewCtrl.instance.openWebView(url);
    this.blockActivityInput(true);
  }

  //點下Info頁面視窗按鈕
  private onInfoClicked() {
    let url = '';
    console.log(
      '[MenuEventHandler] onInfoClicked PlatformData.gameSetting.UseNextJSHtmlInfo',
      PlatformData.gameSetting.UseNextJSHtmlInfo
    );
    //**BQ埋點 */
    BQLogger.sendClickInfoForBQ();

    //北美API使用特規Info
    const useSocialApiInfo =
      PlatformData.licenseSetting.socialAPI &&
      Functions.getURLParameterByName('NormalInfo') !== 'true' && //Debug用,顯示一般Info
      (MultLang.nowLangString === LangType[LangType.en] ||
        MultLang.nowLangString === LangType[LangType.es]);

    const infoType = useSocialApiInfo
      ? `socialAPI_${MultLang.nowLangString}`
      : MultLang.nowLangString;

    if (PlatformData.gameSetting.UseNextJSHtmlInfo) {
      url = `${PlatformData.gameConfig.GameInfo}${PlatformData.gameFolderName}/index.html?lang=${infoType}`;

      console.log('[MenuEventHandler] registerIFrameEvent with timeout');
      this.registerIFrameEvent(true); // 啟用超時檢測
      if (DEV) {
        url = 'http://localhost:3000/';
      }
    } else {
      url =
        PlatformData.gameConfig.GameInfo +
        PlatformData.gameFolderName +
        '/' +
        infoType +
        '.html';
      url += '?lang=' + PlatformData.lang;
      url += '&currency=' + PlatformData.currency;
      url += '&ratio=' + PlatformData.currencyRatio;
      url += '&logo=' + PlatformData.logo;
      console.log('[MenuEventHandler] not registerIFrameEvent');
    }

    console.log('[MenuEventHandler] onInfoClicked', url);
    BQLogger.sendClickInfo();
    WebViewCtrl.instance.openWebView(
      url,
      !PlatformData.gameSetting.UseNextJSHtmlInfo
    );
    this.blockActivityInput(true);
  }

  private registerIFrameEvent(closeWhenNotTriggerGetLicenseSetting = false) {
    let timeoutId: number | null = null;

    // Enable timeout detection, set 20 seconds timer
    if (closeWhenNotTriggerGetLicenseSetting) {
      console.log('[registerIFrameEvent] Enable 20 seconds timeout detection');
      timeoutId = window.setTimeout(() => {
        console.log(
          '[registerIFrameEvent] GetLicenseSetting not received within 20 seconds, auto-close WebView'
        );
        WebViewCtrl.instance.closeWebView();
        this.onWebviewClose();
        window.removeEventListener('message', callback);
      }, 20000); // 20 seconds
    }

    const callback = event => {
      console.log('[registerIFrameEvent] callback', event.source, window);
      if (event.source !== window) {
        if (event.data === 'GetLicenseSetting') {
          // Received GetLicenseSetting, clear timeout timer
          if (timeoutId !== null) {
            console.log(
              '[registerIFrameEvent] Received GetLicenseSetting, clear timeout timer'
            );
            window.clearTimeout(timeoutId);
            timeoutId = null;
          }

          PlatformData.licenseSetting.currencySymbol =
            PlatformData.currencySymbol;
          event.source.postMessage(
            JSON.stringify({...PlatformData.licenseSetting, ...PlatformData}),
            '*'
          );
        }
        if (event.data === 'Close') {
          // Clear timer when manually closed
          if (timeoutId !== null) {
            window.clearTimeout(timeoutId);
            timeoutId = null;
          }

          WebViewCtrl.instance.closeWebView();
          this.onWebviewClose();
          window.removeEventListener('message', callback);
        }
      } else {
        console.log('[registerIFrameEvent] event.source == window');
      }
    };
    window.addEventListener('message', callback);
  }

  private onShowTopBar(option: boolean) {
    if (option && WebViewCtrl.instance.node.active) {
      WebViewCtrl.instance.closeWebView();
    }
  }
}
