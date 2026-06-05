import {
  _decorator,
  Component,
  instantiate,
  lerp,
  Node,
  Prefab,
  tween,
  Tween,
} from 'cc';
import {BUILD} from 'cc/env';
import Functions from '../../../../CommonModule/Script/Utility/Functions';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import {PlatformGDK} from '../../../../CommonModule/Script/Platform/PlatformGDK';
import LoadingScreen from '../../../../CommonModule/Script/UIComponent/LoadingScreen';
import BackpackManager from '../../../../CommonModule/Script/Manager/BackpackManager';
import BundleManager from '../../../../CommonModule/Script/Manager/BundleManager';
import GameClient from '../../../../CommonModule/Script/Network/GameClient';
import BQLogger from '../../../../CommonModule/Script/Log/BQLog/BQLogger';
import GAHandler from '../../../../CommonModule/Script/Log/GA/GAHandler';
import SubViewBase from '../Component/SubViewBase';
import MessageBox, {MessageBoxType} from '../Component/MessageBox';
import WebViewHandler from '../Component/WebViewHandler';
import {UIModuleType} from 'db://assets/CommonModule/Script/Type/CommonDefine';

const {ccclass, property, menu} = _decorator;

/** 讀取頁面Prefab路徑 */
const loadingScreenPrefabFilePath = 'Prefab/LoadingScreen';
/** 彈跳視窗Prefab路徑 */
const messageBoxPrefabFilePath = 'Prefab/MessageBox';

@ccclass('TopViewManager')
@menu('0_Common/Game/Manager/TopViewManager')
export default class TopViewManager extends Component {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): TopViewManager {
    if (!window['topViewManager']) {
      window['topViewManager'] = new TopViewManager();
    }
    return window['topViewManager'];
  }
  public static set instance(instance: TopViewManager) {
    window['topViewManager'] = instance;
  }
  //=======================================================
  //#endregion Singleton

  /** UI掛載節點 */
  @property(Node)
  private uiRootNode: Node = null;
  /** 讀取畫面 */
  @property(LoadingScreen)
  private loadingScreen: LoadingScreen = null;
  /** 訊息視窗 */
  @property(MessageBox)
  private messageBox: MessageBox = null;
  /** WebView視窗 */
  @property(WebViewHandler)
  private webView: WebViewHandler = null;

  @property(BackpackManager)
  private backpackManager: BackpackManager = null;

  /** 遊戲轉跳專用，為了蓋住ErrorMsg(配合server硬改) */
  @property(Node)
  private gameRedirectLoadingNode: Node = null;
  @property(MessageBox)
  private gameRedirectMsgBox: MessageBox = null;

  /** 最後顯示的子畫面 */
  private lastView: SubViewBase = null;

  protected override onLoad() {
    // if (TopViewManager._instance) {
    //   this.node.destroy();
    //   return;
    // }
    TopViewManager.instance = this;
    PlatformGDK.instance.openLoadingPage.insert(this.showLoadingScreen, this);
    PlatformGDK.instance.closeLoadingPage.insert(this.hideLoadingScreen, this);
    PlatformGDK.instance.showPopUpMessage.insert(this.showMessageBox, this);
    PlatformGDK.instance.showRedirectLoading.insert(
      this.showGameRedirectLoading,
      this
    );
    PlatformGDK.instance.showRedirectMsgBox.insert(
      this.showRedirectMsgBox,
      this
    );
  }

  protected override onDestroy() {
    this.release();
  }

  /** 原先為固定在場景上UI，因平台客製化故改成動態加載 */
  public async setDynamicUI(onComplete: Function) {
    await Promise.all([this.setLoadingScreen(), this.setMessageBox()]);
    console.log('[TopViewManager] setDynamicUI Complete.');
    onComplete();
  }

  /** 載入讀取中視窗 */
  public async setLoadingScreen() {
    if (!this.loadingScreen) {
      let bundleName = '';
      let bundleLang = '';
      //是否為遊戲客製讀取中視窗
      let isGameLoadingScreen = false;
      //先嘗試載入遊戲客製讀取中視窗
      await new Promise((resolve: Function, reject: (err) => void) => {
        try {
          bundleName = PlatformData.commonBundleConfig.GameLoadingScreen.Name;
          bundleLang = PlatformData.commonBundleConfig.GameLoadingScreen
            .MultiLang
            ? PlatformData.lang
            : null;
        } catch (err) {
          reject(err);
          return;
        }
        BundleManager.instance.loadBundleAssets(
          bundleName,
          bundleLang,
          null,
          resolve,
          reject
        );
      })
        .then(() => {
          console.log('[TopViewManager] setLoadingScreen by game complete');
          isGameLoadingScreen = true;
        })
        .catch((err: Error) => {
          console.warn(
            '[TopViewManager] setLoadingScreen by game fail, try common ui.',
            err
          );
        });
      console.error(
        '[TopViewManager] setLoadingScreen isGameLoadingScreen  = ',
        isGameLoadingScreen
      );
      //若無遊戲讀取中視窗 則嘗試載入共用讀取中視窗
      await new Promise((resolve: Function, reject: (err) => void) => {
        if (isGameLoadingScreen) {
          resolve();
          return;
        }
        try {
          bundleName = PlatformData.commonBundleConfig.CommonLoadingScreen.Name;
          bundleLang = PlatformData.commonBundleConfig.CommonLoadingScreen
            .MultiLang
            ? PlatformData.lang
            : null;
        } catch (err) {
          reject(err);
          return;
        }
        BundleManager.instance.loadBundleAssets(
          bundleName,
          bundleLang,
          null,
          resolve,
          reject
        );
      })
        .then(() => {
          if (isGameLoadingScreen) return;

          console.log('[TopViewManager] setLoadingScreen by common complete');
        })
        .catch((err: Error) => {
          console.warn(
            '[TopViewManager] setLoadingScreen by common fail, something error.',
            err
          );
        });
      //生成讀取中視窗
      let loadingScreenPrefab: Prefab = BundleManager.instance.getAsset<Prefab>(
        bundleName,
        loadingScreenPrefabFilePath,
        Prefab,
        bundleLang
      );
      if (!loadingScreenPrefab) {
        console.error(
          '[TopViewManager] setLoadingScreen loadingScreenPrefab: is null.'
        );
        return;
      }
      let loadingScreenNode: Node = instantiate(loadingScreenPrefab);
      loadingScreenNode.name += '(TVM_LS)';
      this.uiRootNode.addChild(loadingScreenNode);
      //loadingScreenNode.setSiblingIndex(1);
      this.loadingScreen = loadingScreenNode.getComponent(LoadingScreen);
      //完成事件
      console.log(
        '[TopViewManager] setLoadingScreen Complete, bundle:',
        bundleName
      );

      loadingScreenPrefab = undefined;
      loadingScreenNode = undefined;
    }
  }

  /** 載入訊息框 */
  public async setMessageBox() {
    if (!this.messageBox) {
      let bundleName = '';
      let bundleLang = '';
      //是否為遊戲客製訊息框
      let isGameMessageBox = false;
      //先嘗試載入遊戲客製訊息框
      await new Promise((resolve: Function, reject: (err) => void) => {
        try {
          bundleName = PlatformData.commonBundleConfig.GameMessageBox.Name;
          bundleLang = PlatformData.commonBundleConfig.GameMessageBox.MultiLang
            ? PlatformData.lang
            : null;
        } catch (err) {
          reject(err);
          return;
        }
        BundleManager.instance.loadBundleAssets(
          bundleName,
          bundleLang,
          null,
          resolve,
          reject
        );
      })
        .then(() => {
          console.log('[TopViewManager] setMessageBox by game complete');
          isGameMessageBox = true;
        })
        .catch((err: Error) => {
          console.warn(
            '[TopViewManager] setMessageBox by game fail, try common ui.',
            err
          );
        });
      //若無遊戲訊息框 則嘗試載入共用訊息框
      await new Promise((resolve: Function, reject: (err) => void) => {
        if (isGameMessageBox) {
          resolve();
          return;
        }
        try {
          bundleName = PlatformData.commonBundleConfig.CommonMessageBox.Name;
          bundleLang = PlatformData.commonBundleConfig.CommonMessageBox
            .MultiLang
            ? PlatformData.lang
            : null;
        } catch (err) {
          reject(err);
          return;
        }
        BundleManager.instance.loadBundleAssets(
          bundleName,
          bundleLang,
          null,
          resolve,
          reject
        );
      })
        .then(() => {
          if (isGameMessageBox) return;

          console.log('[TopViewManager] setMessageBox by common complete');
        })
        .catch((err: Error) => {
          console.warn(
            '[TopViewManager] setMessageBox by common fail, something error.',
            err
          );
        });
      //生成訊息框
      let messageBoxPrefab: Prefab = BundleManager.instance.getAsset<Prefab>(
        bundleName,
        messageBoxPrefabFilePath,
        Prefab,
        bundleLang
      );
      if (!messageBoxPrefab) {
        console.error(
          '[TopViewManager] setMessageBox messageBoxPrefab: is null.'
        );
        return;
      }
      let messageBoxNode: Node = instantiate(messageBoxPrefab);
      messageBoxNode.name += '(TVM_MB)';
      this.uiRootNode.addChild(messageBoxNode);
      //messageBoxNode.setSiblingIndex(2);
      this.messageBox = messageBoxNode.getComponent(MessageBox);
      //跳轉專用訊息框
      let redirectMsgBoxNode: Node = instantiate(messageBoxPrefab);
      redirectMsgBoxNode.name += '(TVM_RMB)';
      this.uiRootNode.addChild(redirectMsgBoxNode);
      this.gameRedirectMsgBox = redirectMsgBoxNode.getComponent(MessageBox);
      //完成事件
      console.log(
        '[TopViewManager] setMessageBox Complete, bundle:',
        bundleName
      );

      messageBoxPrefab = undefined;
      messageBoxNode = undefined;
      redirectMsgBoxNode = undefined;
    }
  }

  /**
   * 初始化TopViewManager
   */
  public init() {
    if (this.messageBox) this.messageBox.init();
    if (this.webView) this.webView.init();
    if (this.backpackManager && PlatformData.instance.hasBackPackCmd)
      this.backpackManager.init();
    if (this.gameRedirectMsgBox) this.gameRedirectMsgBox.init();
    if (this.gameRedirectLoadingNode)
      this.gameRedirectLoadingNode.active = false;
  }

  public initBackPack() {
    if (this.backpackManager && PlatformData.instance.hasBackPackCmd)
      this.backpackManager.init();
  }

  /**
   * 釋放TopViewManager資源
   */
  public release() {
    this.lastView = null;

    TopViewManager.instance = null;

    PlatformGDK.instance.openLoadingPage.remove(this.showLoadingScreen, this);
    PlatformGDK.instance.closeLoadingPage.remove(this.hideLoadingScreen, this);
    PlatformGDK.instance.showPopUpMessage.remove(this.showMessageBox, this);
    PlatformGDK.instance.showRedirectLoading.remove(
      this.showGameRedirectLoading,
      this
    );
    PlatformGDK.instance.showRedirectMsgBox.remove(
      this.showRedirectMsgBox,
      this
    );
  }

  /**
   * 顯示遊戲轉跳讀取中
   * @param isShow
   */
  public showGameRedirectLoading(isShow: boolean) {
    if (!this.gameRedirectLoadingNode) return;
    // 移到最上層
    if (isShow) {
      this.gameRedirectLoadingNode.setSiblingIndex(
        this.uiRootNode.children.length - 1
      );
    }
    this.gameRedirectLoadingNode.active = isShow;
  }

  /**
   * 顯示遊戲轉跳訊息框
   * @param msg
   * @param subMsg
   * @param callback
   * @param messageId 這個訊息的流水號(不代表播出順序)，帶入此參數可以指定修改此編號訊息的內容，但若此流水號不存在則會改為新增訊息，並回傳新的messageId
   * @returns messageId(流水號)
   */
  public showRedirectMsgBox(
    msg: string,
    subMsg: string | number,
    callback?: Function,
    messageId?: number
  ): number {
    if (!subMsg) {
      subMsg = -999;
    }
    //假loading途中可能出錯,因此需隱藏splash by kyy
    this.showSplash(false);
    console.warn(
      '[TopViewManager] showRedirectMsgBox: %s (%s), callback:%O',
      msg,
      subMsg,
      callback
    );
    if (!this.gameRedirectMsgBox) return null;

    this.gameRedirectMsgBox.node.setSiblingIndex(
      this.uiRootNode.children.length - 1
    );
    this.gameRedirectMsgBox.node.active = true;

    return this.gameRedirectMsgBox.add(
      MessageBoxType.Ok,
      msg,
      subMsg,
      !callback
        ? () => {
            this.hideRedirectMsgBox();
          }
        : callback,
      null,
      null,
      messageId
    );
  }

  /**
   * 隱藏遊戲轉跳訊息框
   */
  private hideRedirectMsgBox() {
    if (!this.gameRedirectMsgBox) return;

    this.gameRedirectMsgBox.node.active = false;
  }

  /**
   * 顯示Splash頁面
   * @param isShow
   */
  public showSplash(isShow = true) {
    if (!BUILD) return;
    //發布版本才有前置畫面
    try {
      const cocos3dGameContainer: HTMLElement = window.document.getElementById(
        'Cocos3dGameContainer'
      );
      const splash: HTMLElement = window.document.getElementById('splash');
      cocos3dGameContainer.style.opacity = isShow ? '0' : '255';
      splash.style.display = isShow ? '' : 'none';

      console.log('[TopViewManager] showSplash', cocos3dGameContainer, splash);

      if (isShow) {
        this.showLoadingScreen(this, 0);
      } else {
        this.hideLoadingScreen(this, 0);
      }
    } catch (err) {
      console.error('[TopViewManager] showSplash fail.', err);
    }
  }

  /**
   * 顯示讀取畫面
   * 使用高優先權則無法由低優先權關閉
   * 優先權範圍 0 ~ 9 值越小越高
   * @param trigger
   * @param priority 0 ~ 9 null則為預設9
   * @param timeout null則為預設10秒 單位:秒數
   * @param timeoutCallback
   */
  public showLoadingScreen(
    trigger,
    priority = 9,
    timeout = 10,
    timeoutCallback?: Function
  ) {
    if (!this.loadingScreen) return;

    this.loadingScreen.show(trigger, priority, timeout, timeoutCallback);
  }

  /**
   * 隱藏讀取畫面
   * 低優先權無法關閉高優先權
   * 優先權範圍 0 ~ 9 值越小越高
   * 若無其他觸發來源則隱藏讀取畫面
   * @param trigger
   * @param priority
   */
  public hideLoadingScreen(trigger, priority = 9) {
    if (!this.loadingScreen) return;

    this.loadingScreen.hide(trigger, priority);
  }

  /**
   * 清除讀取畫面
   * 無視觸發來源 非必要請避免使用
   */
  public clearLoadingScreen() {
    if (!this.loadingScreen) return;

    this.loadingScreen.clearAll();
  }

  /**
   * 顯示彈出訊息
   * @param msg 玩家閱讀的彈窗內容
   * @param subMsg 右下角的其他資訊
   * @param callback 點擊確認按鈕後的 callback
   * @param messageId 這個訊息的流水號(不代表播出順序)，帶入此參數可以指定修改此編號訊息的內容，但若此流水號不存在則會改為新增訊息，並回傳新的messageId
   * @param enablePopupTracking 是否啟用彈窗埋點，預設true
   * @param popupTrackingSubMsg 埋點專用副訊息，未傳時預設使用subMsg
   * @returns messageId(流水號)
   */
  public showMessageBox(
    msg: string,
    subMsg: string | number,
    callback?: Function,
    messageId?: number,
    enablePopupTracking = true,
    popupTrackingSubMsg?: string | number
  ): number {
    if (!subMsg) {
      subMsg = -999;
    }
    //假loading途中可能出錯,因此需隱藏splash by kyy
    this.showSplash(false);
    console.warn(
      '[TopViewManager] showMessageBox: %s (%s), callback:%O',
      msg,
      subMsg,
      callback
    );
    const trackingSubMsg = popupTrackingSubMsg ?? subMsg;
    if (enablePopupTracking) {
      GAHandler.ErrorMsg(
        PlatformData.instance.gameName,
        msg,
        trackingSubMsg.toString()
      );
      BQLogger.sendPopupMessage(msg, trackingSubMsg.toString());
    }

    if (!this.messageBox) return null;
    this.switchView(this.messageBox);

    return this.messageBox.add(
      MessageBoxType.Ok,
      msg,
      subMsg,
      callback,
      null,
      null,
      messageId
    );
  }

  /**
   * 顯示彈出訊息(是否選項)
   * @param msg
   * @param subMsg
   * @param yesCallback
   * @param noCallback
   * @param messageId 這個訊息的流水號(不代表播出順序)，帶入此參數可以指定修改此編號訊息的內容，但若此流水號不存在則會改為新增訊息，並回傳新的messageId
   * @returns messageId(流水號)
   */
  public showYesNoMessageBox(
    msg: string,
    subMsg: string | number,
    yesCallback?: Function,
    noCallback?: Function,
    messageId?: number
  ): number {
    if (!this.messageBox) return null;

    this.switchView(this.messageBox);

    return this.messageBox.add(
      MessageBoxType.YesOrNo,
      msg,
      subMsg,
      null,
      yesCallback,
      noCallback,
      messageId
    );
  }

  /**
   * 顯示GameInfo
   */
  public showGameInfo() {
    if (!this.webView) return;
    BQLogger.sendClickInfo();
    this.switchView(this.webView);
    let url = '';
    if (PlatformData.gameSetting.UseNextJSHtmlInfo) {
      url =
        PlatformData.gameConfig.GameInfo +
        'index.html' +
        '?lang=' +
        (PlatformData.uiModuleType === 'socialcasino'
          ? `${PlatformData.lang}_b`
          : PlatformData.lang) +
        '&game=' +
        PlatformData.gameFolderName +
        '&path=' +
        PlatformData.gameConfig.GameInfo +
        '&uiModuleType=' +
        PlatformData.uiModuleType +
        '&resolution=' +
        (PlatformData.isLandscape ? 'landscape' : 'portrait') +
        '&logo=' +
        PlatformData.logo +
        '&enableForbiddenWordConvert=' +
        PlatformData.isEnableForbiddenWordConvert;
    } else {
      //北美API使用特規Info
      const infoType =
        PlatformData.uiModuleType === UIModuleType.SOCIAL_CASINO ||
        PlatformData.uiModuleType === UIModuleType.SWEEPSTAKES
          ? `socialAPI${PlatformData.lang === 'es-es' ? '_es' : ''}`
          : PlatformData.lang;

      url =
        PlatformData.gameConfig.GameInfo +
        PlatformData.gameFolderName +
        '/index_' +
        infoType +
        '.html';
    }
    this.webView.show(url);
  }

  /**
   * 顯示GameLog
   */
  public showGameLog() {
    if (!this.webView) return;

    this.switchView(this.webView);

    const parameter: Object = Functions.getURLParameter();
    let url: string = PlatformData.gameConfig.GameLog.replace(
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
    url += '&game=' + PlatformData.gameFolderName;

    //白牌換logo
    const logoName: string = Functions.getURLParameter()['ShowLogo'];
    if (!Functions.isNullOrEmpty(logoName)) url += '&ShowLogo=' + logoName;

    if (PlatformData.isMacrossEnv) {
      url += '&MarcossLogServer=' + GameClient.arkClient.gameUrl;
      url += '&arkID=' + GameClient.arkClient.arkId;
      url += '&arkToken=' + GameClient.arkClient.arkToken;
      url += '&isMacrossEnv=true';
    }
    const eventListStr: string = PlatformData.event;
    const eventList = (eventListStr as string).split(',');
    if (eventList.length >= 3) {
      url += '&log=' + eventList[2];
      url += '&ApiUrl=' + eventList[2];
    }

    url += '&lang=' + PlatformData.lang;

    //不存在通訊協定則依格式調整
    if (url.substring(0, 4) !== 'http') {
      //TODO: 全面採用SSL時移除此判斷
      let protocol: string =
        window.location.protocol === undefined
          ? 'https:'
          : window.location.protocol;
      //依設定調整是否強制使用https
      if (parameter['isSSL'] === 'true') protocol = 'https:';
      //非相對路徑
      if (url.substring(0, 1) !== '.') {
        url = protocol + '//' + url;
      } else {
        url =
          protocol +
          '//' +
          window.location.host +
          window.location.pathname.replace(
            window.location.pathname.split('/').pop(),
            ''
          ) +
          url;
      }
    }

    this.webView.show(url);
  }

  /**
   * 切換顯示的子畫面
   * 隱藏上一個子畫面
   * 紀錄準備切換的畫面
   * @param view
   */
  public switchView(view: SubViewBase) {
    if (this.lastView && this.lastView !== view) this.lastView.hide();

    this.lastView = view;
  }
  /**
   * 設定splash讀取進度 0~100
   * @param progress
   */
  public setSplashLoadingProgress(progress: number) {
    //設定splash讀取
    const currentProgress = Math.ceil(this.getSplashLoadingProgress());
    if (currentProgress > progress) {
      return;
    }
    const splash = document.getElementById('splash');
    const progressBar = splash?.querySelector('.progress-bar span');
    if (progressBar) {
      //@ts-expect-error style
      progressBar.style.width = progress.toFixed(2) + '%';
    }
  }
  /**
   * 取得當前splash loading進度
   */
  public getSplashLoadingProgress() {
    const splash = document.getElementById('splash');
    const progressBar = splash?.querySelector('.progress-bar span');
    if (progressBar) {
      //@ts-expect-error style
      return parseFloat(progressBar.style.width.replace('%', ''));
    }
    return 0;
  }

  /**
   * splash loading假跑動畫
   */
  public playSplashAnimation(option: boolean, max = 100, duration = 10) {
    const currentProgress = Math.ceil(this.getSplashLoadingProgress());
    const obj = {progress: currentProgress};
    if (option) {
      tween(obj)
        .to(
          duration,
          {progress: max},
          {
            progress: (
              start: number,
              end: number,
              current: number,
              t: number
            ) => {
              const progress = currentProgress + t * 100;
              if (progress < max)
                this.setSplashLoadingProgress(currentProgress + t * 100);
              return lerp(start, end, t);
            },
          }
        )
        .start();
    } else {
      Tween.stopAllByTarget(this.node);
    }
  }

  /**
   * splash loading真跑動畫
   */
  public playSplashProgress(finish: number, total: number, max = 100) {
    if (BUILD) {
      TopViewManager.instance.playSplashAnimation(false);
      const current = TopViewManager.instance.getSplashLoadingProgress();
      //設定splash進度
      TopViewManager.instance.setSplashLoadingProgress(
        current + (finish / total) * (max - current)
      );
    }
  }
}
