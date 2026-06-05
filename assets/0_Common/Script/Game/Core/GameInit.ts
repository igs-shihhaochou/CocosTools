/* eslint-disable camelcase */
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import BQLogger from '../../../../CommonModule/Script/Log/BQLog/BQLogger';
import {UrlTracker} from '../../../../CommonModule/Script/Log/TrackUrl/UrlTracker';
import BundleManager from '../../../../CommonModule/Script/Manager/BundleManager';
import DebugManager from '../../../../CommonModule/Script/Manager/DebugManager';
import EventManager from '../../../../CommonModule/Script/Manager/EventManager';
import GameGuideManager from '../../../../CommonModule/Script/Manager/GameGuideManager';
import InputManager from '../../../../CommonModule/Script/Manager/InputManager';
import ArkClient from '../../../../CommonModule/Script/Network/ArkSDK/ArkClient';
import MacrossClient, {
  Macross,
} from '../../../../CommonModule/Script/Network/Macross/MacrossClient';
import MacrossSocketClient from '../../../../CommonModule/Script/Network/Macross/MacrossSocketClient';
import {
  GAEventGameFlow,
  PlatformGDK,
} from '../../../../CommonModule/Script/Platform/PlatformGDK';
import {
  BundleConfigFormat,
  BundleSettingFormat,
  CurrencyConfigFormat,
  CurrencySettingFormat,
  UIModuleType,
  GameConfigFormat,
  GameInitReadyState,
  GameSettingFormat,
  OrientationDefine,
  UrlParameterFormat,
} from '../../../../CommonModule/Script/Type/CommonDefine';
import LoadingHandler, {
  LoadTaskInfo,
  LoadTaskInfoList,
} from '../../../../CommonModule/Script/UIComponent/LoadingHandler';
import Functions from '../../../../CommonModule/Script/Utility/Functions';
import GameClient, {
  enumFromType,
} from '../../../../CommonModule/Script/Network/GameClient';
import BundleVersionDownloader from '../Downloader/BundleVersionDownloader';
import PluginPathDownloader from '../Downloader/PluginPathDownloader';
import ClickLogManager from '../../../../CommonModule/Script/Manager/ClickLogManager';
import ItemManager from '../../../../CommonModule/Script/Manager/ItemManager';
import OrientationManager from '../../../../CommonModule/Script/Manager/OrientationManager';
import TopViewManager from '../Manager/TopViewManager';
import GameErrorCode from '../../../../CommonModule/Script/Core/GameErrorCode';
import MultiLangHandler from '../../../../CommonModule/Script/Core/MultiLangHandler';
import SoundManager from '../../../../CommonModule/Script/Manager/SoundManager';
import GameActivityManager from '../../../../CommonModule/Script/Manager/GameActivityManager';
import {getCurrencySymbol} from '../../../../CommonModule/Script/Core/CurrencySymbolTable';
import {
  _decorator,
  Component,
  director,
  sys,
  game,
  JsonAsset,
  Prefab,
  instantiate,
  Node,
  macro,
  Vec3,
  assetManager,
} from 'cc';
import {BUILD, DEBUG, DEV, EDITOR, PREVIEW} from 'cc/env';
import {
  initBundleConfig,
  initCurrencyConfig,
  initGameConfig,
} from './DefaultGameConfig';
import {addTouchListener} from '../../../../CommonModule/Script/Utility/ParentWindowEvent';
import JsonDownloader from '../Downloader/JsonDownloader';
import {SetLicenseSetting} from '../../../../CommonModule/Script/License/LicenseManager';
import GAHandler from 'db://assets/CommonModule/Script/Log/GA/GAHandler';
import ToolManager from '../Manager/ToolManager';
import {GameSetting} from '../../Editor/RemotePlugin';
import LogoSettingDownloader from '../Downloader/LogoSettingDownloader';
import {LogoSetting} from 'db://assets/CommonModule/Script/Type/LogoSettingDefine';
import {GameCommonEventLogID} from 'db://assets/CommonModule/Script/Log/BQLog/BQLogDefine';
macro.ENABLE_MULTI_TOUCH = false;
game.frameRate = 60;
assetManager.downloader.maxConcurrency = 12;
assetManager.downloader.maxRequestsPerFrame = 12;

const {ccclass, property, menu} = _decorator;

/** FullScreen插件 */
declare let FullscreenTools;
//#endregion 外部設定

/** 讀取頁面Prefab路徑 */
const LOADING_PAGE_PREFAB_FILE_PATH = 'Prefab/LoadingHandler';

/** 處理階段列舉 */
enum enumProcessingLevel {
  /** 內部模式除錯設定 */
  INTERNAL_MODE_DEBUG_SETTING,
  /** 確認環境 */
  CHECK_ENVIRONMENT,
  /** 取得網址參數 */
  GET_URL_PARAMETER,
  /** 站台回追 */
  TRACK_URL,
  /** 取得CommonSetting.json資訊 */
  GET_COMMON_SETTING,
  /** 初始化EventManager */
  INIT_EVENT_MANAGER,
  /** 專案設定 */
  GET_CONFIG,
  /** 取得外掛插件 */
  GET_PLUGIN,
  /** 取得Bundle版控內容 */
  GET_BUNDLE_VERSION,
  /** 遊戲設定 */
  GAME_SETTING,
  /** 合併BundleConfig至BundleVersion */
  MERGE_BUNDLE_CONFIG_TO_VERSION,
  /** 除錯模式設定 */
  DEBUG_MODE_SETTING,
  /** 共用遊戲資料設定 */
  COMMON_GAME_DATA,
  /** 平台資料設定 */
  COMMON_PLATFORM_DATA,
  /** 外掛插件設定 */
  SET_COMMON_LIB,
  /** 背景執行設定 */
  BACKGROUND_UPDATE_SETTING,
  /** 從BundleVersion取得BundleConfig */
  GET_BUNDLE_CONFIG_FROM_VERSION,
  /** BundleManager初始化 */
  INIT_BUNDLE_MANAGER,
  /** 載入 Root Bundle */
  LOAD_ROOT_BUNDLE,
  /** 設定 Root Bundle 內容 */
  SET_ROOT_BUNDLE_CONTENT,
  /** 載入動態UI並設置 */
  LOAD_AND_SET_DYNAMIC_UI,
  /** 初始化管理類別 */
  INIT_MANAGER,
  /** 載入讀取畫面Bundle並設置 */
  LOAD_AND_SET_LOADING_PAGE,
  /** 顯示讀取畫面 */
  SHOW_LOADING_PAGE,
  /** 初始化 GameClient */
  INIT_GAME_CLIENT,
  //TODO:新增新建clickLog 的ArkClient流程
  INIT_CLICK_LOG,
  //TODO:新增新建GameGuide 的ArkClient流程
  INIT_GAME_GUIDE,
  /** 初始話活動模組 */
  INIT_ACTIVITY_MODULE,
  /** 初始化 Item */
  INIT_ITEM,
  /** 載入遊戲場景、Bundle */
  LOAD_GAME_AND_BUNDLE,
}

@ccclass
@menu('0_Common/Game/Core/GameInit')
export default class GameInit extends Component {
  /** loading頁根節點 */
  @property(Node)
  private loadingPageRootNode: Node = null;
  @property(JsonAsset)
  private editorBundleVersion: JsonAsset = null;

  /** 讀取處理 */
  private loadingHandler: LoadingHandler = null;

  /** GameConfig */
  private gameConfig: GameConfigFormat = null;
  /** CurrencyConfig */
  private currencyConfig: CurrencyConfigFormat = null;
  /** BundleConfig (遊戲專案依賴的Bundle設定清單) */
  private bundleConfig: BundleConfigFormat = null;
  /** GameSetting */
  private gameSetting: GameSettingFormat = null;

  /** Bundle版控內容 */
  private bundleVersion: BundleConfigFormat = null;

  /** 載入任務清單 */
  private loadTaskInfoList: LoadTaskInfoList = null;

  /** 準備狀態 */
  private readyState: GameInitReadyState = GameInitReadyState.NONE;

  /** 原始Console功能 */
  private consoleFn = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    debug: console.debug,
  };

  protected override onLoad() {
    sys.localStorage.setItem('gameStartTime', Date.now());
    this.SetLoginExtraData();
    this.Init();
    director.addPersistRootNode(this.node);
    addTouchListener();
  }

  private SetLoginExtraData() {
    const extra_data = {};
    //TODO: Slot才有的資料 待優化流程
    if (typeof gUserAgent !== 'undefined' && gUserAgent.getResult()) {
      extra_data['browser'] = gUserAgent.getResult()['browser']['name'];
      extra_data['browser_version'] =
        gUserAgent.getResult()['browser']['version'];
      extra_data['os'] = gUserAgent.getResult()['os']['name'];
      extra_data['os_version'] = gUserAgent.getResult()['os']['version'];
    }

    PlatformData.instance.loginExtraData = extra_data;
  }

  protected override start() {
    TopViewManager.instance.showSplash();
  }

  protected override onDestroy() {
    this.Release();
  }

  /**
   * 開始遊戲
   * @param readyState 準備狀態
   */
  protected StartGame(readyState: GameInitReadyState) {
    PlatformData.gameInitReadyState = this.readyState =
      this.readyState | readyState;

    console.log(
      '[GameInit] startGame current readyState:',
      this.readyState
        .toString(2)
        ?.padStart(Object.keys(GameInitReadyState).length * 0.5 - 2, '0')
    );

    if (this.readyState !== GameInitReadyState.ALL_READY) return;

    EventManager.instance.dispatchEvent(
      PlatformData.gameEventName.GAME_INIT_COMPLETE
    );
  }

  /**
   * 初始化
   */
  private async Init() {
    // Launcher 模式：等待 CommonLib 並行載入完成（通常引擎啟動前就完成了）
    // 直接檢查 window.__commonLibReady 是否存在，不依賴 isLauncherMode（此時可能尚未設定）
    if (window['__commonLibReady']) {
      await Promise.resolve(window['__commonLibReady']).catch(e => {
        console.error('[GameInit] CommonLib parallel load failed:', e);
      });
    }
    //初始化BQLog
    PlatformGDK.instance.startBQLog.notify();
    //**BQ埋點 */
    const splitPath = location.pathname.split('/');
    const version = splitPath[splitPath.length - 3];
    BQLogger.setGameVersion(version);
    BQLogger.sendLoadEngine();

    localStorage.setItem('gameLoadingTime', Date.now().toString());
    //顯示讀取畫面
    TopViewManager.instance.showLoadingScreen(this);

    //因未載入設定前DebugMode設定未知 故預設為false 若需測試則使用URL參數 InternalMode(內部模式)
    this.ProcessingLevel(
      enumProcessingLevel.INTERNAL_MODE_DEBUG_SETTING,
      () => {
        const internalMode: string = (
          Functions.getURLParameter() as UrlParameterFormat
        ).InternalMode;
        this.SetDebugModeSetting(/^(1|true)$/.test(internalMode));
      },
      false
    );

    //確認環境
    this.ProcessingLevel(
      enumProcessingLevel.CHECK_ENVIRONMENT,
      this.CheckEnvironment.bind(this),
      false
    );

    //取得代理資訊 (不阻塞後續流程，與設定下載並行執行)
    let agentInfoPromise: Promise<void> | null = null;
    if (PlatformData.isMacrossEnv) {
      agentInfoPromise = this.GetAgentInfo();
    }

    //取得網址列參數
    this.ProcessingLevel(
      enumProcessingLevel.GET_URL_PARAMETER,
      this.GetUrlInfo.bind(this),
      false
    );

    // Launcher 模式：替換 resources bundle 為遊戲的 resources
    if (
      PlatformData.isLauncherMode &&
      PlatformData.gameName &&
      PlatformData.version
    ) {
      // 先移除 Launcher 的 resources bundle，否則 loadBundle 會直接返回已存在的同名 bundle
      const launcherRes = assetManager.getBundle('resources');
      if (launcherRes) {
        assetManager.removeBundle(launcherRes);
      }
      const gameResourcesUrl = `../../../${PlatformData.gameName}/${PlatformData.version}/${PlatformData.gameName}/assets/resources`;
      await new Promise<void>(resolve => {
        assetManager.loadBundle(gameResourcesUrl, (err, _bundle) => {
          if (err) {
            console.error(
              '[GameInit] Launcher: load game resources failed:',
              err
            );
          } else {
            console.log(
              '[GameInit] Launcher: game resources loaded from',
              gameResourcesUrl
            );
          }
          resolve();
        });
      });
    }

    //初始化事件管理類別
    this.ProcessingLevel(
      enumProcessingLevel.INIT_EVENT_MANAGER,
      () => {
        //EventManager在起始時初始化SetToPlatformData
        //因事件須在一開始建立 以便提供給各類別使用
        EventManager.instance.init();
        EventManager.instance.registerEvents(PlatformData.gameEventName);
      },
      false
    );

    //TODO: 改為外部載入的流程 (共用設定)
    this.ProcessingLevel(
      enumProcessingLevel.GET_CONFIG,
      () => {
        if (typeof GlobalConfig !== 'undefined') {
          this.gameConfig = GlobalConfig.GameConfig.config;
        } else if (!EDITOR) {
          this.gameConfig = initGameConfig();
        } else {
          this.gameConfig = PlatformData.gameConfig;
        }
        this.currencyConfig = initCurrencyConfig();
        this.bundleConfig = {};
        const bundle = initBundleConfig();
        if (!PlatformData.commonBundleConfig) {
          PlatformData.commonBundleConfig = {};
        }
        Object.keys(bundle).forEach(key => {
          PlatformData.commonBundleConfig[key] = bundle[key];
        });
        if (!EDITOR) this.DownloadLogoSetting();
      },
      false
    );

    const settingsPromises = [];
    //取得代理資訊 (與設定下載並行)
    if (agentInfoPromise) {
      settingsPromises.push(agentInfoPromise);
    }
    //取得CommonSetting.json(網址參數優化)
    if (!DEV && !PlatformData.isMacrossEnv) {
      settingsPromises.push(
        await this.ProcessingLevel(
          enumProcessingLevel.GET_COMMON_SETTING,
          this.GetCommonSetting.bind(this)
        )
      );
    }

    //splash loading假跑 by kyy
    TopViewManager.instance.playSplashAnimation(true, 95);

    //因Bundle架構不支援遊戲專案的JS Load as Plugin設定 故統一將各專案的Js改至外部遠端資源載入
    if (!EDITOR)
      settingsPromises.push(
        this.ProcessingLevel(
          enumProcessingLevel.GET_PLUGIN,
          this.DownloadRemotePlugin.bind(this)
        )
      );

    // //取得Bundle版控內容
    settingsPromises.push(
      this.ProcessingLevel(
        enumProcessingLevel.GET_BUNDLE_VERSION,
        this.DownloadBundleVersion.bind(this)
      )
    );
    settingsPromises.push(this.createGA());
    //外部遊戲設定導入
    settingsPromises.push(
      this.ProcessingLevel(enumProcessingLevel.GAME_SETTING, onComplete => {
        if (!EDITOR) {
          const promises = [
            this.DownloadSetting('GameBundleSetting').then(setting => {
              Object.keys(setting).forEach(key => {
                this.bundleConfig[key] = setting[key];
              });
            }),
            this.DownloadSetting('GameCommonBundleSetting').then(setting => {
              let hasCustomMessageBox = false;
              let hasCustomLoadingScreen = false;
              Object.keys(setting).forEach(key => {
                PlatformData.commonBundleConfig[key] = setting[key];
                if (key.includes('MessageBox')) {
                  delete PlatformData.commonBundleConfig['CommonMessageBox'];
                  hasCustomMessageBox = true;
                }
                if (key.includes('LoadingScreen')) {
                  delete PlatformData.commonBundleConfig['CommonLoadingScreen'];
                  hasCustomLoadingScreen = true;
                }
              });
              if (hasCustomMessageBox && hasCustomLoadingScreen) {
                delete PlatformData.commonBundleConfig['CommonDynamicUI'];
              }
            }),
            this.DownloadSetting('GameSetting').then(setting => {
              this.gameSetting = setting as unknown as GameSettingFormat;
            }),
          ];
          Promise.all(promises)
            .then(() => {
              onComplete();
            })
            .catch((err: Error) => {
              console.error('[GameInit] DownloadSetting error.', err);
            });
        } else {
          console.log(
            '[GameInit] GameSetting From Remote Plugin:',
            PlatformData.gameSetting
          );
          this.gameSetting = PlatformData.gameSetting;
          onComplete();
        }
      })
    );

    // Editor或Preview環境下，如果要連API Server，需要先SSO登入
    if (EDITOR || PREVIEW) {
      if (GameSetting.isNeedSingleLogin) {
        settingsPromises.push(GameSetting.singleLogin());
      }
    }

    await Promise.all(settingsPromises);

    GAHandler.SendEvent(
      'loading',
      GAEventGameFlow.getPluginAndGetBundleVersion,
      PlatformData.gameName,
      GAHandler.getGameLoadingTime()
    );

    //站台回追
    this.ProcessingLevel(
      enumProcessingLevel.TRACK_URL,
      this.TrackUrlInfo.bind(this),
      false
    );

    //**BQ埋點 */
    BQLogger.sendGetPluginBundleVersion();

    //合併BundleConfig至BundleVersion (因外部設定開放遊戲專案動態調整其對應Bundle的客製內容)
    if (!EDITOR)
      this.ProcessingLevel(
        enumProcessingLevel.MERGE_BUNDLE_CONFIG_TO_VERSION,
        this.MergeBundleConfigToVersion.bind(this),
        false
      );

    //除錯模式設定
    this.ProcessingLevel(
      enumProcessingLevel.DEBUG_MODE_SETTING,
      this.SetDebugModeSetting.bind(this, this.gameSetting.DebugMode),
      false
    );

    //共用遊戲資料設定
    this.ProcessingLevel(
      enumProcessingLevel.COMMON_GAME_DATA,
      this.SetPlatformData.bind(this),
      false
    );

    //共用遊戲資料設定
    this.ProcessingLevel(
      enumProcessingLevel.COMMON_PLATFORM_DATA,
      this.SetToPlatformData.bind(this),
      false
    );

    /** 外掛插件設定 */
    if (BUILD) {
      this.ProcessingLevel(
        enumProcessingLevel.SET_COMMON_LIB,
        this.SetFullScreenLib.bind(this),
        false
      );
    }

    //背景執行設定 預設由PlatformData.isBackgroundUpdate決定 可由GameSetting控制
    this.ProcessingLevel(
      enumProcessingLevel.BACKGROUND_UPDATE_SETTING,
      this.SetBackgroundUpdateSetting.bind(this),
      false
    );

    //從BundleVersion取得BundleConfig (只擷取需要的Bundle資訊)
    this.ProcessingLevel(
      enumProcessingLevel.GET_BUNDLE_CONFIG_FROM_VERSION,
      this.GetBundleConfigFromVersion.bind(this),
      false
    );

    //初始化管理類別
    this.ProcessingLevel(
      enumProcessingLevel.INIT_MANAGER,
      () => {
        //部分Manager由此開始初始化
        //因使用內容載入順序的需求 (如物件需用到的變數未設定等)
        if (PlatformData?.gameSetting?.DebugMode) DebugManager.instance.init();
        TopViewManager.instance.init();
        InputManager.instance.init();
        SoundManager.instance.setGameMute(PlatformData.isMute);
        OrientationManager.instance.init();
        //3D遊戲特效類別庫初始化
        if (this.gameSetting.EfkVer) {
          // efk_core.init(PlatformData.gameSetting.EfkVer);
        }
      },
      false
    );

    // 優先初始化BundleManager;
    await this.ProcessingLevel(
      enumProcessingLevel.INIT_BUNDLE_MANAGER,
      (onComplete?: Function) => {
        BundleManager.instance.init(this.bundleConfig, onComplete);
      }
    );

    GAHandler.SendEvent(
      'loading',
      GAEventGameFlow.initBundleManager,
      PlatformData.gameName,
      GAHandler.getGameLoadingTime()
    );

    //**BQ埋點 */
    BQLogger.sendInitBundleManager();

    //載入讀取畫面Bundle並設置
    await this.ProcessingLevel(
      enumProcessingLevel.LOAD_AND_SET_LOADING_PAGE,
      this.SetLoadingPage.bind(this)
    );

    GAHandler.SendEvent(
      'loading',
      GAEventGameFlow.loadAndSetLoadingPage,
      PlatformData.gameName,
      GAHandler.getGameLoadingTime()
    );

    //**BQ埋點 */
    BQLogger.sendLoadSetLoadingPage();

    //預先進入遊戲共用場景
    director.loadScene(this.gameSetting.InitGameScene, () => {
      TopViewManager.instance.showSplash(false);
    });

    //顯示讀取畫面
    this.ProcessingLevel(
      enumProcessingLevel.SHOW_LOADING_PAGE,
      () => {
        if (!PlatformData.gameSetting.ShowLoadingOnce)
          setTimeout(() => {
            TopViewManager.instance.showSplash(false);
          }, 1000);
        //顯示進度條
        this.loadingHandler.showProgress();
        //設置讀取提示
        this.loadingHandler.setLoadingTip(PlatformData.lang);
        //設置載入完成事件
        this.loadingHandler.setCompleteEvent(
          this.OnGameInitComplete.bind(this)
        );
      },
      false
    );

    //須優先載入RootBundle多語系內容 避免初始多語系遊戲文字使用錯誤
    await this.ProcessingLevel(
      enumProcessingLevel.LOAD_ROOT_BUNDLE,
      (onComplete?: Function, onError?: (err: Error) => void) => {
        BundleManager.instance.loadBundleAssets(
          this.gameConfig.RootBundle,
          PlatformData.lang,
          null,
          onComplete,
          onError
        );
      }
    );

    GAHandler.SendEvent(
      'loading',
      GAEventGameFlow.loadRootBundle,
      PlatformData.gameName,
      GAHandler.getGameLoadingTime()
    );

    //**BQ埋點 */
    BQLogger.sendLoadRootBundle();

    //優先處理RootBundle內容
    this.ProcessingLevel(
      enumProcessingLevel.SET_ROOT_BUNDLE_CONTENT,
      this.RootBundleHandler.bind(this),
      false
    );

    //載入UI Bundle並設置
    await this.ProcessingLevel(
      enumProcessingLevel.LOAD_AND_SET_DYNAMIC_UI,
      TopViewManager.instance.setDynamicUI.bind(TopViewManager.instance)
    );

    EventManager.instance.dispatchEvent(
      PlatformData.gameEventName.DYNAMIC_UI_LOADED
    );

    GAHandler.SendEvent(
      'loading',
      GAEventGameFlow.loadAndSetDynamicUI,
      PlatformData.gameName,
      GAHandler.getGameLoadingTime()
    );

    //**BQ埋點 */
    BQLogger.sendLoadSetDynamicUI();

    TopViewManager.instance.hideLoadingScreen(this);

    if (!EDITOR) {
      //下載遊戲名稱多國
      Promise.all(
        new Array<Promise<JSON>>(
          //下載MultiGameNameList 已存在則略過
          new Promise(
            (resolve: (json: JSON) => void, reject: (err: Error) => void) => {
              if (MultiLangHandler.MultiGameNameList) {
                resolve(MultiLangHandler.MultiGameNameList as unknown as JSON);
              } else {
                MultiLangHandler.DownloadMultiGameNameList(resolve, reject);
              }
            }
          )
        )
      )
        .then(() => {
          console.log(
            '[GameInit] Init get setting MultiGameNameList: %o',
            MultiLangHandler.MultiGameNameList
          );
        })
        .catch((err: Error) => {
          console.error('[GameInit] Init get setting error.', err);
        });
    }

    //初始化GameClient
    this.ProcessingLevel(
      enumProcessingLevel.INIT_GAME_CLIENT,
      this.InitGameClient.bind(this),
      true
    ).then(() => {
      this.StartGame(GameInitReadyState.GAME_CLIENT_READY);

      if (!EDITOR) {
        //初始化ClickLog
        this.ProcessingLevel(
          enumProcessingLevel.INIT_CLICK_LOG,
          this.InitClickLog.bind(this),
          false
        );
      }

      if (PlatformData.gameSetting.WaitAfterGameReady) {
        PlatformGDK.instance.afterGameReady.insert(
          this.AfterGameClientInit,
          this
        );
      } else {
        this.AfterGameClientInit();
      }
      PlatformGDK.instance.onGameClientInitCompleted.notify();
    });

    //載入遊戲場景及Bundle
    this.ProcessingLevel(
      enumProcessingLevel.LOAD_GAME_AND_BUNDLE,
      () => {
        //設置載入任務權重 切分各項載入任務所佔的進度條百分比
        this.SetLoadTaskInfo();

        //開始載入Bundle資源log訊息
        if (Object.keys(this.loadTaskInfoList).length - 1 > 0)
          console.log('[GameInit] LoadBundleAssets Beginning');
        //載入多語系Bundle資源內容
        this.LoadBundleAssets(PlatformData.lang);
        //載入Bundle資源內容
        this.LoadBundleAssets();
      },
      false
    );
  }

  private AfterGameClientInit() {
    PlatformGDK.instance.afterGameReady.remove(this.AfterGameClientInit, this);

    // 初始化GameGuide;
    this.ProcessingLevel(
      enumProcessingLevel.INIT_GAME_GUIDE,
      this.InitGameGuide.bind(this),
      false
    );

    //初始化活動模組
    this.ProcessingLevel(
      enumProcessingLevel.INIT_ACTIVITY_MODULE,
      this.InitActivityModule.bind(this),
      false
    );

    //初始化Item
    this.ProcessingLevel(
      enumProcessingLevel.INIT_ITEM,
      this.InitItem.bind(this),
      false
    );

    if (PlatformData.instance.hasBackPackCmd)
      TopViewManager.instance.initBackPack();
  }

  /**
   * 釋放GameInit資源
   */
  private Release() {
    this.gameConfig = null;
    this.currencyConfig = null;
    this.bundleConfig = null;
    this.gameSetting = null;

    this.bundleVersion = null;

    this.loadTaskInfoList = null;

    this.loadingHandler = null;

    this.readyState = null;

    this.consoleFn = null;
  }

  /**
   * 處理階段
   * @param level
   * @param handler
   * @param async
   * @returns
   */
  private async ProcessingLevel(
    level: enumProcessingLevel,
    handler: (onComplete?: Function, onError?: (err: Error) => void) => void,
    async = true
  ): Promise<unknown> {
    return new Promise((resolve: Function) => {
      if (DEBUG || PREVIEW)
        console.log(
          '%c[GameInit] ProcessingLevel: %s',
          'background:black;color:red',
          enumProcessingLevel[level]
        );
      let _err: Error = null;
      try {
        handler(resolve, (err: Error) => {
          console.error(
            '%c[GameInit] ProcessingLevel: %s Error.',
            'background:black;color:red',
            enumProcessingLevel[level],
            err
          );
        });
      } catch (err) {
        console.error(
          '%c[GameInit] ProcessingLevel: %s Try Error.',
          'background:black;color:red',
          enumProcessingLevel[level],
          err
        );
        _err = err as Error;
      }
      if (!async && !_err) resolve();
    });
  }

  private DownloadLogoSetting() {
    const downloader: LogoSettingDownloader = new LogoSettingDownloader();

    const internalMode: boolean = /^(1|true)$/.test(
      (Functions.getURLParameter() as UrlParameterFormat).InternalMode
    );
    const cdn_url = `${this.gameConfig.RemoteResources}./Logo/${PlatformData.logo}/${internalMode ? 'internal/' : ''}`;
    downloader.Start(
      cdn_url,
      jsonData => {
        PlatformData.LogoSetting = jsonData as LogoSetting;
      },
      error => {
        console.warn('[GameInit] DownloadLogoSetting error: ', error);
      }
    );
  }

  /**
   * 取得遊戲專案使用到的外掛Js、Json (遠端資源)
   * @param onComplete
   * @param onError
   */
  private DownloadRemotePlugin(
    onComplete: Function,
    onError: (err: Error) => void
  ) {
    const gameName: string = PlatformData.gameFolderName;
    const version: string = PlatformData.version;
    const remoteResources: string = this.gameConfig.RemoteResources as string;
    let jsPathList: Array<string> = null;

    if (!gameName || gameName === '') {
      console.error(
        '[GameInit] DownloadRemotePlugin error, game name is null.'
      );
      return;
    }

    const filePath = `${remoteResources}./Game/${gameName}/Plugin/${BUILD ? version + '/' : ''}`;
    const downloader: PluginPathDownloader = new PluginPathDownloader();
    //下載設定檔 取得Plugin下載路徑
    downloader.Start(
      filePath,
      (jsonData: JSON) => {
        jsPathList = (jsonData as PluginPathListFormat).Path;
        console.log(
          '[GameInit] DownloadRemotePlugin onLoad, path: %s{pluginPathListName} %o',
          filePath,
          jsPathList
        );
        //下載各Plugin 檔名: PluginName.js | PluginName.js@version
        if (jsPathList.length === 0) {
          onComplete();
        } else {
          //遞迴下載插件
          RecursiveDownloadPlugin();
        }
      },
      err => {
        console.error(
          '[GameInit] DownloadRemotePlugin pluginListFilePath(%s) error.',
          filePath,
          err
        );
        onError(err);
      }
    );

    function RecursiveDownloadPlugin(index = 0) {
      console.log(
        'RecursiveDownloadPlugin',
        index,
        jsPathList[index],
        jsPathList
      );
      let pluginUrl: string = jsPathList[index];
      //若非http路徑 發佈版中有版號 上層相對路徑須再返回一層(版號層)
      if (!/^http[s]?:\/\//.test(pluginUrl))
        pluginUrl = `${filePath}${BUILD && /^\.\.\//.test(pluginUrl) ? '../' : ''}${pluginUrl}`;
      //檔案版本解析
      const regExpMatch: RegExpMatchArray =
        pluginUrl.match(/^([^@]+)@*([^@]+)?.*/);
      const pluginVersion: string = regExpMatch[2];
      //存在版號的檔名則解析為 version/PluginName.js
      pluginUrl = pluginUrl.replace(
        regExpMatch[0],
        (pluginVersion ? pluginVersion + '/' : '') + regExpMatch[1]
      );
      downloader.StartGetScript(
        pluginUrl,
        () => {
          //遞增
          index++;
          //若與總數相等則為完成
          if (index === jsPathList.length) {
            console.log('[GameInit] DownloadRemotePlugin onComplete');
            onComplete();
          } else {
            //遞迴
            RecursiveDownloadPlugin(index);
          }
        },
        (err: Error) => {
          console.error(
            '[GameInit] DownloadRemotePlugin GetScript: %s error.',
            pluginUrl,
            err
          );
          onError(err);
        }
      );
    }
  }

  /**
   * 取得遊戲設定 (遠端資源)
   * @param onComplete
   * @param onError
   */
  private DownloadSetting(fileName: string) {
    return new Promise<JSON>((resolve, reject) => {
      const remoteResources: string = this.gameConfig.RemoteResources;
      const filePath = `${remoteResources}./Game/${PlatformData.gameFolderName}/Plugin/${BUILD ? PlatformData.version + '/' : ''}${fileName}.json`;
      const addDateParam = DEBUG ? true : false;
      const jsonDowloader = new JsonDownloader();
      //下載GameSetting設定檔
      jsonDowloader.getContent(
        filePath,
        (jsonData: JSON) => {
          console.log(
            '[GameInit] DownloadGameSetting onLoad, path: %s{bundleVersionName} %o',
            filePath,
            jsonData
          );
          resolve(jsonData);
        },
        err => {
          console.error(
            '[GameInit] DownloadGameSetting bundleVersionFilePath(%s) error.',
            filePath,
            err
          );
          reject(err);
        },
        addDateParam
      );
    });
  }

  /**
   * 取得Bundle版控內容 (遠端資源)
   * @param onComplete
   * @param onError
   */
  private DownloadBundleVersion(
    onComplete: Function,
    onError: (err: Error) => void
  ) {
    if (EDITOR) {
      this.bundleVersion = this.editorBundleVersion
        .json as unknown as BundleConfigFormat;
      onComplete();
      return;
    }
    const remoteResources: string = this.gameConfig.RemoteResources as string;
    let bundleVersionFilePath = `${remoteResources}./Bundle/`;
    const url = sessionStorage.getItem('url');
    if (url) bundleVersionFilePath = url + './_RemoteResources/Bundle/';
    const bundleVersionDownloader: BundleVersionDownloader =
      new BundleVersionDownloader();
    //下載Bundle設定檔
    bundleVersionDownloader.start(
      bundleVersionFilePath,
      (jsonData: JSON) => {
        console.log(
          '[GameInit] DownloadRemoteBundleVersion onLoad, path: %s{bundleVersionName} %o',
          bundleVersionFilePath,
          jsonData
        );
        this.bundleVersion = jsonData as unknown as BundleConfigFormat;
        onComplete();
      },
      err => {
        console.error(
          '[GameInit] DownloadRemoteBundleVersion bundleVersionFilePath(%s) error.',
          bundleVersionFilePath,
          err
        );
        onError(err);
      }
    );
  }

  /**
   * 初始化GameClient
   * 非手動模式時 進行網路連接並登入
   * @param onCompleteCallback
   */
  private async InitGameClient(onCompleteCallback: Function) {
    // domain優化入口點 (跟平台要domain)
    if (!PlatformData.site?.trim() && !this.gameSetting.IsManualLogin) {
      try {
        const serviceList: string[] =
          this.gameSetting.GameServer.split(/[\s,]+/);
        let serviceDomains: string[] = [];
        if (EDITOR) {
          serviceDomains = await GameClient.instance.getServiceDomains(
            serviceList,
            GameSetting.domainPlatform
          );
        } else {
          serviceDomains =
            await GameClient.instance.getServiceDomains(serviceList);
        }

        PlatformData.lobbyDomain = serviceDomains[0];
        console.log(
          '[InitGameClient] 成功取得平台 domain 清單',
          serviceDomains
        );
      } catch (e) {
        console.error('[InitGameClient] 取得平台 domain 失敗', e);
      }
    }
    //**BQ埋點 */
    BQLogger.sendGetGameDomain();

    // 設定送審設定開關
    if (PlatformData.useCert) {
      //如果不是Macross環境則設定送審開關，不需等登入後取ClientMode的值，使用預設值
      SetLicenseSetting([]);
      if (!PlatformData.isMacrossEnv) {
        GameClient.instance.setThirdPartyFromType(enumFromType.Api);
        PlatformData.token = 'demo';
      }
    }

    if (this.gameSetting.UseApiServer) {
      PlatformData.useApiServer = true;
      // GameClient.instance.setThirdPartyFromType(enumFromType.Api);
      //GameClient.instance.setThirdPartyFromType(enumFromType.Macross);
    }
    PlatformData.useProgressJp = this.gameSetting.UseProgressJp;

    //若為Macross平台環境 進行SSOLogin
    if (PlatformData.isMacrossEnv) {
      MacrossClient.parsingUrl();

      let loginResult = await this.ExecuteSSOLogin();

      if (!loginResult.success) {
        let getNewSSOKeySuccess = false;
        if (PlatformData.LogoSetting.GetSSOKeyInfo.Enable) {
          console.warn('[GameInit] SSOLogin failed, attempting TryReLogin...');
          getNewSSOKeySuccess = await this.getSSOKeyWithRetry(
            PlatformData.LogoSetting.GetSSOKeyInfo.RetryTimes,
            PlatformData.LogoSetting.GetSSOKeyInfo.RetryDelay
          );

          if (getNewSSOKeySuccess) {
            // 重新執行 SSOLogin
            loginResult = await this.ExecuteSSOLogin();
          }
        }

        if (!loginResult.success) {
          TopViewManager.instance.showMessageBox(
            GameErrorCode.GetMessage(GameErrorCode.SSOLOGIN_DATA_ERROR),
            `${loginResult.errorCode}(MF)`,
            () => {
              //嘗試重新登入失敗，錯誤訊息強制關閉遊戲，不再重整
              Functions.closeGame(PlatformData.isMute, true);
            }
          );
          console.error(
            '[GameInit] InitGameClient MacrossClient SSOLogin fail.'
          );

          BQLogger.SendEventLogById(
            GameCommonEventLogID.REFRESH_LOGIN_FAILED,
            BQLogger.getGameLoadingTime(),
            BQLogger.getGameLoadingTimeForStart()
          );
          return;
        }
        BQLogger.SendEventLogById(
          GameCommonEventLogID.REFRESH_LOGIN_SUCCESS,
          BQLogger.getGameLoadingTime(),
          BQLogger.getGameLoadingTimeForStart()
        );
      }
    }

    //手動模式
    if (this.gameSetting.IsManualLogin) {
      console.log('[GameInit] InitGameClient IsManualLogin: active');
    } else {
      console.log('[GameInit] InitGameClient');

      //初始化GameClient
      await new Promise((resolve: Function) => {
        GameClient.instance.init(
          resolve,
          this.gameSetting.IsManualLogin as boolean,
          this.gameSetting.DebugMode as boolean
        );
      });
      //初始化ArkClient
      await new Promise((resolve: Function) => {
        GameClient.instance.initArkClient(this.gameSetting.GameServer, resolve);
      });
    }

    /**BQ埋點設定 */
    BQLogger.setArkID(PlatformData.aID);
    BQLogger.setArkToken(PlatformData.aToken);

    //GameClient準備狀態
    this.readyState |= GameInitReadyState.GAME_CLIENT_READY;

    if (PlatformData.isMacrossEnv) {
      const url =
        MacrossClient.platformDomainWs !== ''
          ? MacrossClient.platformDomainWs
          : MacrossClient.platformDomain;
      const macross_socket_client = new MacrossSocketClient(
        url,
        MacrossClient.aid,
        MacrossClient.gameId,
        MacrossClient.token,
        MacrossClient.apiId
      );

      if (MacrossClient.profile?.ConnectPlatformSocket) {
        macross_socket_client.connect();
      }
    }
    //玩家登入完成
    if (onCompleteCallback) onCompleteCallback();
  }

  private async ExecuteSSOLogin(): Promise<{
    success: boolean;
    errorCode?: number;
  }> {
    return new Promise(resolve => {
      MacrossClient.ssoLogin(async (result: number, data) => {
        console.log(
          `[GameInit] ExecuteSSOLogin  result: ${result}, data:`,
          data
        );

        if (result === 0 && data.response.error === 0) {
          //**BQ埋點 */
          BQLogger.sendSsoLoginComplete();

          if (data.gameVersion) {
            this.checkGameVersion(data.gameVersion);
          }

          PlatformData.gameLogVersion = data.gameLogVersion;

          //以下資料暫時帶入
          PlatformData.mID = MacrossClient.siteId.toString();
          PlatformData.currency = MacrossClient.currencyName;
          PlatformData.currencySymbol = getCurrencySymbol(
            MacrossClient.currencyName
          );

          //profile資料帶入
          PlatformData.uID = Functions.isNullOrEmpty(MacrossClient.platformId)
            ? MacrossClient.aid.toString()
            : MacrossClient.platformId;
          PlatformData.licenseSetting.socialAPI =
            data.profile &&
            data.profile.clientTheme === UIModuleType.SOCIAL_CASINO;
          PlatformData.uiModuleType =
            data.profile?.clientTheme || UIModuleType.I_GAMING;
          PlatformData.closeSystemMenu =
            MacrossClient.closeSystemMenu ?? PlatformData.closeSystemMenu;
          PlatformData.idleMinute =
            MacrossClient.idleMinute ?? PlatformData.idleMinute;
          PlatformData.skipTutorial =
            MacrossClient.skipTutorial ?? PlatformData.skipTutorial;

          /**BQ埋點設定 */
          // MacrossClient.aid不是ArkID  這裡的埋點看起來是錯的 Ark登入的InitGameClient完成後設定
          // BQLogger.setArkID(MacrossClient.aid.toString());
          // BQLogger.setArkToken(MacrossClient.token);

          console.log('[InitGameClient]', MacrossClient.token);
          PlatformData.token = MacrossClient.token;
          if (PlatformData.isDaraEnv) {
            GameClient.instance.setThirdPartyFromType(enumFromType.Joya);
          } else {
            GameClient.instance.setThirdPartyFromType(enumFromType.Macross);
          }
          //全域設定
          try {
            if (typeof GlobalConfig !== 'undefined') {
              const currencySetting = GlobalConfig.CurrencySetting.GetContent(
                PlatformData.currency,
                PlatformData.mID,
                PlatformData.gameID
              );
              if (currencySetting) {
                PlatformData.realCurrency =
                  currencySetting.Real === ''
                    ? PlatformData.realCurrency
                    : currencySetting.Real; //防呆如果Real為空字串走預設
                PlatformData.currencyName = currencySetting.Name;
                PlatformData.dollarSign = currencySetting.Sign;
                PlatformData.currencyRatio = currencySetting.Ratio;
                PlatformData.decimalPlaces = currencySetting.Decimal;
              }
            } else {
              const currency = PlatformData.currency;
              if (DEV && PlatformData.isDaraEnv) {
                switch (currency) {
                  case 'USD':
                  case 'SC':
                    PlatformData.realCurrency = currency;
                    PlatformData.currencyName = currency;
                    PlatformData.dollarSign = '$';
                    PlatformData.currencyRatio = 0.0001;
                    PlatformData.decimalPlaces = 2;
                    break;
                  case 'Silver':
                  case 'GC':
                    PlatformData.realCurrency = currency;
                    PlatformData.currencyName = currency;
                    PlatformData.dollarSign = '$';
                    PlatformData.currencyRatio = 1;
                    PlatformData.decimalPlaces = 0;
                    break;
                }
              }
            }
          } catch (err) {
            console.error(
              '[GameInit] ExecuteSSOLogin set GlobalConfig error.',
              err
            );
          }

          this.setCustomPlatformDataAfterGameClient();

          const nullCheck = value => {
            return value !== undefined && value !== null;
          };

          if (nullCheck(data.userSetting)) {
            PlatformData.userSetting = data.userSetting;
            // api 串接資訊
            //是否顯示donate
            if (nullCheck(PlatformData.userSetting.isShowDonate)) {
              PlatformData.isShowDonate = PlatformData.userSetting.isShowDonate;
              PlatformData.isShowPurchase = !PlatformData.isShowDonate;
            }
            //是否使用scorebox(雙幣)
            if (nullCheck(PlatformData.userSetting.isUseScoreBox)) {
              PlatformData.isUseScoreBox =
                PlatformData.userSetting.isUseScoreBox;
            }
            if (nullCheck(PlatformData.userSetting.kiosk_id)) {
              PlatformData.kioskId = PlatformData.userSetting.kiosk_id;
            }
            //是否開啟prizeViewer
            if (nullCheck(PlatformData.userSetting.prizeViewerMode)) {
              PlatformData.prizeViewerMode = Boolean(
                PlatformData.userSetting.prizeViewerMode
              );
            }
            //設定自動關閉prizeViewer的秒數
            if (nullCheck(PlatformData.userSetting.prizeViewerSec)) {
              PlatformData.prizeViewerSec =
                PlatformData.userSetting.prizeViewerSec;
            }
            //設定主題
            if (nullCheck(PlatformData.userSetting.theme_id)) {
              PlatformData.themeID = PlatformData.userSetting.theme_id;
            }
            //設定小數格式
            if (nullCheck(PlatformData.userSetting.decimalFormat)) {
              PlatformData.decimalFormat =
                PlatformData.userSetting.decimalFormat;
            }
            //設定jp的金額格式(ss規格)
            if (nullCheck(PlatformData.userSetting.jpIsMoneyFormat)) {
              PlatformData.jpIsMoneyFormat =
                PlatformData.userSetting.jpIsMoneyFormat;
            }
            //設定ss的jp顯示ratio
            if (nullCheck(PlatformData.userSetting.jpRatio)) {
              PlatformData.realCurrencyRatio = PlatformData.userSetting.jpRatio;
            }
            //設定ss的jp顯示ratio
            if (nullCheck(PlatformData.userSetting.jpRatio)) {
              PlatformData.jpRatio = PlatformData.userSetting.jpRatio;
            }
            //設定ss的jp顯示小數位數
            if (nullCheck(PlatformData.userSetting.realDecimalPlaces)) {
              PlatformData.realDecimalPlaces =
                PlatformData.userSetting.realDecimalPlaces;
            }
            //設定ss的jp押注
            if (nullCheck(data.userSetting.jpBet)) {
              PlatformData.instance.linkingJpBet = data.userSetting.jpBet;
            }
            //串接送審開關
            if (
              nullCheck(data.userSetting.CertArea) &&
              nullCheck(data.userSetting.CertId)
            ) {
              PlatformData.certArea = data.userSetting.CertArea.toString();
              PlatformData.certId = data.userSetting.CertId.toString();
              if (PlatformData.useCert) {
                SetLicenseSetting(data.profile.switchOffs || []);
              }
            }
            //串接貨幣符號
            if (nullCheck(data.userSetting.ShowCurrency)) {
              PlatformData.currencySymbol =
                PlatformData.userSetting.ShowCurrency;
              PlatformData.dollarSign = PlatformData.userSetting.ShowCurrency;
            }
            //串接usersetting小數點位數
            if (nullCheck(PlatformData.userSetting.ShowFloatPrecision)) {
              PlatformData.decimalPlaces =
                PlatformData.userSetting.ShowFloatPrecision;
            }
            //串接info bet資訊開關
            if (nullCheck(PlatformData.userSetting.ShowBetInfo)) {
              PlatformData.gameSetting.IsShowInfoPageBetInfo =
                PlatformData.userSetting.ShowBetInfo;
              PlatformData.licenseSetting.showBetInfo =
                PlatformData.userSetting.ShowBetInfo;
            }
            //串接info按鈕說明開關
            if (nullCheck(PlatformData.userSetting.ShowBtnInfo)) {
              PlatformData.gameSetting.IsShowInfoPageBtn =
                PlatformData.userSetting.ShowBtnInfo;
              PlatformData.licenseSetting.showBtnInfo =
                PlatformData.userSetting.ShowBtnInfo;
            }
            //串接分享推廣ID（非空代表從分享進入）
            if (nullCheck(data.userSetting.PromoteId)) {
              PlatformData.userSetting.PromoteId = data.userSetting.PromoteId;
            }
          }

          console.log(
            `[GameInit] ExecuteSSOLogin thirdPartyId: ${PlatformData.uID}, thirdPartyToken: ${PlatformData.token}`
          );

          resolve({success: true});
        } else {
          resolve({success: false, errorCode: data.response.error});
        }
      });
    });
  }

  private async getSSOKeyWithRetry(
    maxRetries = 3,
    retryDelay = 3
  ): Promise<boolean> {
    let attempt = 1;

    if (!PlatformData.lobbyDomain) {
      GameClient.instance.handleGameUrl(this.gameSetting.GameServer);
    }
    const lobbyURL = PlatformData.lobbyDomain;
    const arkClient: ArkClient = new ArkClient(lobbyURL);

    while (attempt <= maxRetries) {
      console.log(`[PlatformBridge] Try GET_SSOKEY attempt ${attempt}`);

      const authResult = await new Promise<boolean>(resolve => {
        arkClient.auth_without_login(result => {
          resolve(result === 0);
        });
      });

      if (!authResult) {
        console.error('[PlatformBridge] auth_without_login failed');
        return false;
      }

      const getKeyResult = await new Promise<{
        retry: boolean;
        success: boolean;
      }>(resolve => {
        const cmdData = {GameName: PlatformData.gameName};

        BQLogger.SendEventLogById(
          GameCommonEventLogID.REFRESH_LOGIN_GET_SSOKEY,
          BQLogger.getGameLoadingTime(),
          BQLogger.getGameLoadingTimeForStart(),
          attempt.toString()
        );
        arkClient.sendCmd(
          'PlatformBridge',
          'GET_SSOKEY',
          cmdData,
          (result, data) => {
            if (result === 0 && data.cmd_data?.Code >= 0) {
              if (data.cmd_data.Code === 40) {
                // 錢包鎖尚未解鎖，需要重試
                resolve({retry: true, success: false});
              } else {
                // 成功取得 Key
                console.log('SSOKey 已更新: ' + data.cmd_data.Key);
                MacrossClient.SetSSOKey(data.cmd_data.Key);
                resolve({retry: false, success: true});
              }
            } else {
              console.log(
                'SSOKey 更新失敗: ' + (data.cmd_data?.Message || '未知錯誤')
              );
              resolve({retry: false, success: false});
            }
          }
        );
      });

      if (getKeyResult.success) {
        return true;
      }

      if (!getKeyResult.retry) {
        // 不需要再重試（發生非40錯誤）
        return false;
      }

      // 需要重試，但還沒到達 maxRetries
      console.log(
        `[PlatformBridge] Wallet locked, will retry after ${retryDelay}s...`
      );
      await new Promise(res => setTimeout(res, retryDelay * 1000));
      attempt++;
    }

    console.error('[PlatformBridge] Wallet locked after max retries.');
    return false;
  }

  /**
   * 強制修改PlatformData相關設定
   */
  private setCustomPlatformDataAfterGameClient() {
    if (PlatformData.isDaraEnv) {
      // Dara SC 特規，顯示小數點至指定為數 2025/07/10
      if (this.gameSetting.DaraSCDecimalPlaces) {
        switch (PlatformData.currency) {
          case 'SC':
            PlatformData.decimalPlaces = this.gameSetting.DaraSCDecimalPlaces;
            console.log(
              '[GameInit] Force apply Dara SC DecimalPlaces:',
              PlatformData.decimalPlaces
            );
            break;
        }
      }
    }

    let platformDataInfo = '\n';
    Object.keys(PlatformData).forEach((key: string) => {
      if (typeof PlatformData[key] === 'object') {
        console.log(
          `[GameInit] setCustomPlatformDataAfterGameClient - PlatformData.${key}:`,
          PlatformData[key]
        );
      } else {
        platformDataInfo += `${key}: ${PlatformData[key]}\n`;
      }
    });
    console.log(
      '[GameInit] setCustomPlatformDataAfterGameClient - PlatformData:',
      platformDataInfo
    );
  }

  /**
   * 初始化GameClient
   * 非手動模式時 進行網路連接並登入
   * @param onCompleteCallback
   */
  private async InitClickLog(onCompleteCallback: Function) {
    //手動模式
    if (PlatformData.gameSetting.IsManualLogin) {
      console.log('[GameInit] InitClickLog IsManualLogin: active');
    } else {
      console.log('[GameInit] InitClickLog');

      //初始化ClickLog
      await new Promise((resolve: Function) => {
        const clickLogUrl: string = ClickLogManager.instance.getServerURL();
        GameClient.instance.addArkClient(clickLogUrl);
        const arkClient: ArkClient =
          GameClient.instance.getArkClientByUrl(clickLogUrl);
        ClickLogManager.instance.init(resolve, arkClient);
      });
    }

    if (onCompleteCallback) onCompleteCallback();
  }

  private async InitGameGuide(onCompleteCallback: Function) {
    //手動模式
    if (PlatformData.gameSetting.IsManualLogin) {
      console.log('[GameInit] InitGameGuide IsManualLogin: active');
    } else {
      console.log('[GameInit] InitGameGuide');

      //初始化GameGuide
      await new Promise((resolve: Function) => {
        const arkClient: ArkClient = GameClient.arkClient;
        GameGuideManager.instance.init(resolve, arkClient);
      });
    }

    if (onCompleteCallback) onCompleteCallback();
  }

  private async InitActivityModule(onCompleteCallback: Function) {
    //大廳(GameID 12001) 會處理大廳的特規活動模組，此處無需處理
    if (PlatformData.gameID !== '12001') {
      GameActivityManager.instance.SetupActivityModule();
    }

    if (onCompleteCallback) onCompleteCallback();
  }

  private async InitItem(onCompleteCallback: Function) {
    console.log('[GameInit] InitItem');

    //初始化Item
    await new Promise((resolve: Function) => {
      const arkClient: ArkClient = GameClient.arkClient;
      ItemManager.instance.init(resolve, arkClient);
    });

    if (onCompleteCallback) onCompleteCallback();
  }

  /**
   * 遊戲初始化完成
   */
  private async OnGameInitComplete() {
    console.log('[GameInit] OnGameInitComplete');
    //設置多語系文字查詢內容
    this.SetMultiLangDictionary();

    //完成遊戲初始化事件的EventLog
    try {
      //@ts-expect-error Event log 執行階段才會載入
      EventLog.SendGameFlow(EventLog.GameFlow.GameInit);
    } catch {
      console.error('[GameInit] OnGameInitComplete EventLog error.');
    }

    //開始遊戲
    this.StartGame(GameInitReadyState.GAME_INIT_READY);

    BQLogger.sendLoadGameComplete();
  }

  /**
   * 統一的 Console Log 樣式函數
   * @param message 要印製的訊息
   * @param fontSize 字體大小，預設 20px
   * @param color 文字顏色，預設 #00ff00 (綠色)
   * @param padding 內邊距，預設 10px
   */
  private logWithStyle(
    message: string,
    fontSize = 20,
    color = '#00ff00',
    padding = 10
  ): void {
    const style = `font-size: ${fontSize}px; font-weight: bold; color: ${color}; background: #1a1a1a; padding: ${padding}px; border: 2px solid ${color};`;
    console.log('%c' + message, style);
  }

  private async callPlayerAuthAPI(
    token: string,
    domainPlatform: string
  ): Promise<any> {
    try {
      // 移除末尾的斜線（如果有的話）
      const apiUrl = domainPlatform.endsWith('/')
        ? domainPlatform.slice(0, -1)
        : domainPlatform;

      // 構建完整的 API URL，將 token 作為 query parameter
      const fullApiUrl = `${apiUrl}/api/v1/auth/player?token=${token}`;

      this.logWithStyle('呼叫 API: ' + fullApiUrl, 18, '#00aaff', 10);

      // 呼叫 API
      const response = await fetch(fullApiUrl, {
        method: 'GET',
        headers: {
          Accept: '*/*',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logWithStyle(
          `API 呼叫失敗 (${response.status}): ${errorText}`,
          18,
          '#ff0000',
          10
        );
        return null;
      }

      const data = await response.json();

      // 印製回傳資料
      this.logWithStyle('API 回傳資料:', 20, '#00ff00', 10);
      console.log(
        '%c' + JSON.stringify(data, null, 2),
        'font-size: 16px; color: #00ff00; background: #1a1a1a; padding: 10px; font-family: monospace;'
      );

      return data;
    } catch (error) {
      this.logWithStyle(
        'API 呼叫錯誤: ' +
          (error instanceof Error ? error.message : String(error)),
        18,
        '#ff0000',
        10
      );
      console.error('[GetAgentInfo] API 呼叫失敗:', error);
      return null;
    }
  }

  /**
   * 取得代理資訊
   */
  private async GetAgentInfo(): Promise<void> {
    // 取得代理資訊的邏輯

    // 讀取並印製網址
    if (typeof window !== 'undefined' && window.location) {
      const url = window.location.href;
      this.logWithStyle('當前網址: ' + url, 24, '#00ff00', 15);
    }

    // 取得 URL 參數
    const urlObj: UrlParameterFormat = Functions.getURLParameter(
      EDITOR ? PlatformData.editorUrl : null
    );

    // 從 URL 中取得 token 和 domain_platform 參數
    const token = urlObj.token ?? '';
    let domainPlatform = '';

    // 直接從 URL 查詢參數中取得 domain_platform
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const rawDomainPlatform = urlParams.get('domain_platform') ?? '';

      // 字串翻轉以取得真正的 domain_platform 值
      domainPlatform = rawDomainPlatform
        ? rawDomainPlatform.split('').reverse().join('')
        : '';
    }

    // 印製 token 和 domain_platform
    if (token) {
      this.logWithStyle('token: ' + token, 20, '#00ff00', 10);
    } else {
      this.logWithStyle('token: (未提供)', 20, '#ff9900', 10);
    }

    if (domainPlatform) {
      this.logWithStyle(
        'domain_platform: ' + domainPlatform,
        20,
        '#00ff00',
        10
      );
    } else {
      this.logWithStyle('domain_platform: (未提供)', 20, '#ff9900', 10);
    }

    // 如果有 token 和 domain_platform，呼叫平台 API
    let agentData = null;
    if (token && domainPlatform) {
      agentData = await this.callPlayerAuthAPI(token, domainPlatform);
    } else {
      this.logWithStyle(
        '無法呼叫 API：缺少 token 或 domain_platform',
        18,
        '#ff9900',
        10
      );
    }

    // 處理取得的代理資訊
    if (agentData) {
      //TODO: 處理 agentData，例如：apiId, gameId, siteName, currency 等
      console.log('[GameInit] Agent Data:', agentData);

      PlatformData.gameName = agentData.gameName;
      PlatformData.gameID = agentData.gameId;
      PlatformData.apiId = agentData.apiId;
      PlatformData.siteName = agentData.siteName;
      PlatformData.uID = agentData.userId;
      PlatformData.realCurrency = PlatformData.currency = agentData.currency;

      localStorage.setItem('GameId', PlatformData.gameID);
      localStorage.setItem('ApiId', PlatformData.apiId);
      localStorage.setItem('MerchantName', PlatformData.siteName);
      localStorage.setItem('UserId', PlatformData.uID);
      localStorage.setItem('CreditType', PlatformData.currency);
    }
  }

  /**
   * 確認環境
   */
  private CheckEnvironment() {
    const urlObj: UrlParameterFormat = Functions.getURLParameter(
      EDITOR ? PlatformData.editorUrl : null
    );
    //Logo
    PlatformData.logo = urlObj.logo ?? 'acewin';

    //是否為Macross平台
    const ssoKey: string = urlObj.ssoKey;
    PlatformData.isMacrossEnv = Functions.isNullOrEmpty(ssoKey) ? false : true;

    //是否為SS平台
    PlatformData.isSSEnv = PlatformData.logo === 'playgd';

    //是否為Dara平台
    PlatformData.isDaraEnv =
      PlatformData.logo === 'dara' || PlatformData.logo === 'Joya';
  }

  /**
   * 取得網址資訊至共用遊戲資料
   */
  private GetUrlInfo(onComplete: Function) {
    const urlObj: UrlParameterFormat = Functions.getURLParameter(
      EDITOR ? PlatformData.editorUrl : null
    );

    // Launcher 模式：URL 帶有 ver 參數時，從參數取得版號（game 參數原本就有）
    const launcherVer = urlObj.ver ?? '';
    if (launcherVer) {
      PlatformData.isLauncherMode = true;
      console.log(
        `[GameInit] Launcher mode enabled. game=${urlObj.game}, ver=${launcherVer}`
      );
    }

    //遊戲名稱
    if (!PlatformData.gameName) {
      PlatformData.gameName = urlObj.game ?? '';
    }
    //資料夾名稱
    PlatformData.gameFolderName = urlObj.gameFolder ?? PlatformData.gameName;
    //Server定義的遊戲名稱
    PlatformData.serverGameName = urlObj.serverGameName ?? '';

    PlatformData.themeID = urlObj.theme_id ?? '';
    PlatformData.allowState = urlObj.allow_state ?? '';
    PlatformData.deviceID = urlObj.device_id ?? '';
    PlatformData.kioskId = urlObj.kiosk_id ?? '';
    PlatformData.machineID = urlObj.machine_id ?? '';
    PlatformData.logoMode = urlObj.logo_mode ? Number(urlObj.logo_mode) : null;

    PlatformData.realCurrencyRatio = urlObj.realCurrencyRatio
      ? Number(urlObj.realCurrencyRatio)
      : PlatformData.realCurrencyRatio;
    PlatformData.realDecimalPlaces = urlObj.realDecimalPlaces
      ? Number(urlObj.realDecimalPlaces)
      : PlatformData.realDecimalPlaces;

    PlatformData.decimalFormat = urlObj.decimalFormat ?? '';
    PlatformData.jpIsMoneyFormat = urlObj.jpIsMoneyFormat === 'true';
    PlatformData.jpRatio = urlObj.jpRatio
      ? Number(urlObj.jpRatio)
      : PlatformData.jpRatio;

    //遊戲版號
    if (launcherVer) {
      // Launcher 模式：版號從 URL 參數取得
      PlatformData.version = launcherVer;
    } else {
      // 原始模式：從 URL 路徑推算（倒數第 3 段）
      try {
        const splitPath: Array<string> = window.location.pathname.split('/');
        const version: string = splitPath[splitPath.length - 3];
        if (!Functions.isNullOrEmpty(version)) PlatformData.version = version;
      } catch (err) {
        console.error('[GameInit] Version parse fail.', err);
        PlatformData.version = '';
      }
    }

    //語系
    PlatformData.lang = urlObj.lang ?? '';
    //幣種 (long-URL platforms; short-URL platform overrides via agentData)
    if (urlObj.currency) {
      PlatformData.realCurrency = PlatformData.currency = urlObj.currency;
    }
    //真金幣種比值
    PlatformData.realCurrencyRatio = urlObj.realCurrencyRatio ?? undefined;
    //真金小數顯示位數
    PlatformData.realDecimalPlaces = urlObj.realDecimalPlaces ?? undefined;

    //商戶編號
    PlatformData.mID = urlObj.mid ?? '';
    //時區
    PlatformData.zone = urlObj.zone ?? '';
    if (!EDITOR) {
      //使用者代號
      PlatformData.uID = urlObj.uid ?? '';
      //使用者Token
      PlatformData.token = urlObj.token ?? '';
    }
    //ArkID
    PlatformData.aID = urlObj.aid ?? '';
    //ArkToken
    PlatformData.aToken = urlObj.atoken ?? '';
    //隱藏首頁按鈕
    PlatformData.hideHomeBtn = urlObj.homeBtn === 'disable';

    //是否支援全螢幕
    const fullscreen: string = urlObj.fsBtn;
    PlatformData.supportFullscreen =
      fullscreen === 'false' || fullscreen === '0' ? false : true;
    //是否靜音
    const isMute: string = urlObj.isMute;
    PlatformData.isMute = isMute === 'true' || isMute === '1' ? true : false;

    //是否為雙資產
    const isUseScoreBox: string = urlObj.isUseScoreBox ?? 'false';
    PlatformData.isUseScoreBox =
      isUseScoreBox === 'true' || isUseScoreBox === '1' ? true : false;
    PlatformData.prizeViewerMode =
      urlObj.prizeViewerMode === 'true' ? true : false;
    PlatformData.prizeViewerSec = urlObj.prizeViewerSec
      ? parseFloat(urlObj.prizeViewerSec)
      : 0;
    PlatformData.isShowDonate = urlObj.isShowDonate === 'true' ? true : false;

    let PlatformDataInfo = '\n';
    Object.keys(PlatformData).forEach((key: string) => {
      PlatformDataInfo += `${key}: ${PlatformData[key]}\n`;
    });

    PlatformData.site = urlObj.site ?? '';
    PlatformData.event = urlObj.event ?? '';
    PlatformData.clickLogSite = urlObj.clickLogSite ?? '';
    PlatformData.gameLogVersion = urlObj.GameLog ?? '';

    PlatformData.certArea = urlObj.certArea ?? '';
    PlatformData.certId = urlObj.certId ?? '';

    PlatformData.showLogo = urlObj.ShowLogo ?? '';
    PlatformData.cdnUrl = urlObj.p_cdn ?? '';

    console.log('[GameInit] GetUrlInfo - PlatformData:', PlatformDataInfo);
    onComplete();
  }

  /**
   * 站台回追
   */
  private TrackUrlInfo(onComplete: Function) {
    // 取得進入此網址的前一個網址，如果沒有 referrer 則使用當前網址
    let previousUrl = document.referrer || window.location.href;

    previousUrl = previousUrl.split('?')[0];

    UrlTracker.sendTrackUrl(previousUrl);
    onComplete();
  }
  /**
   * 取得GetCommonSetting
   */
  private GetCommonSetting(
    onComplete: Function,
    onError: (err: Error) => void
  ) {
    let logoPostFix = '';
    if (PlatformData.logo !== 'acewin') {
      logoPostFix = `_${PlatformData.logo}`;
    }
    const jsonPath = this.gameConfig.CommonSettingJson;
    if (!jsonPath) {
      onComplete();
      return;
    }
    const dateParam = DEBUG ? `?${Date.now()}` : '';
    const url = `${jsonPath.replace('%', logoPostFix)}${dateParam}`;
    assetManager.loadRemote(url, {ext: '.json'}, (err, data: JsonAsset) => {
      if (err) {
        console.error('[GameInit] GetCommonSetting error.', err);
        TopViewManager.instance.showMessageBox(
          GameErrorCode.GetMessage(GameErrorCode.HTML5_GAME_ERROR),
          GameErrorCode.HTML5_GAME_ERROR,
          Functions.closeGame
        );
        onError(err);
      } else {
        console.log('[GameInit] GetCommonSetting - versionJson:', data.json);
        const {ClickLogSite, DomainList, Version, EventList} = data.json;
        //Another domain site
        if (DomainList) {
          PlatformData.site = '';
          for (let i = 1; i < DomainList.length; i++) {
            PlatformData.site += DomainList[i];
            if (i !== DomainList.length - 1) {
              PlatformData.site += ',';
            }
          }
        }
        //Event log list
        if (PlatformData.event === '' && EventList) {
          for (let i = 0; i < EventList.length; i++) {
            PlatformData.event += EventList[i];
            if (i !== EventList.length - 1) {
              PlatformData.event += ',';
            }
          }
        }
        //ClickLogSite
        if (PlatformData.clickLogSite === '' && ClickLogSite) {
          if (ClickLogSite !== undefined) {
            for (let i = 0; i < ClickLogSite.length; i++) {
              PlatformData.clickLogSite += ClickLogSite[i];
              if (i !== ClickLogSite.length - 1) {
                PlatformData.clickLogSite += ',';
              }
            }
          }
        }

        if (PlatformData.gameLogVersion === '' && Version['GameLog']) {
          PlatformData.gameLogVersion = Version['GameLog'];
        }
        onComplete();
      }
    });
  }
  /**
   * 除錯模式設定
   * @param isDebug
   */
  private SetDebugModeSetting(isDebug = false) {
    if (isDebug) {
      for (const key in this.consoleFn) {
        console[key] = this.consoleFn[key];
      }
    } else {
      for (const key in this.consoleFn) {
        console[key] = function () {};
      }
    }
  }

  /**
   * 設定共用遊戲資料
   */
  private SetPlatformData() {
    //外部設定
    console.log(
      'set PlatformData from currencyConfig',
      this.currencyConfig,
      PlatformData.currency,
      typeof GlobalConfig,
      typeof GlobalConfig !== 'undefined'
    );

    PlatformData.gameConfig = this.gameConfig;
    PlatformData.currencyConfig = this.currencyConfig;
    PlatformData.bundleConfig = this.bundleConfig;
    PlatformData.gameSetting = this.gameSetting;
    //未取得設定的預設值
    if (PlatformData.gameID === '')
      PlatformData.gameID = this.gameSetting.GameID.toString();
    if (PlatformData.gameName === '')
      PlatformData.gameName = this.gameSetting.GameName.toString();
    if (PlatformData.displayName === '')
      PlatformData.displayName = this.gameSetting.DisplayName?.toString();
    if (PlatformData.lang === '')
      PlatformData.lang = this.gameSetting.DefaultLang;
    // 將語系統一轉換為小寫，並 trim 防止外部來源殘留空白
    else PlatformData.lang = PlatformData.lang.trim().toLowerCase();

    if (
      !this.currencyConfig[PlatformData.currency] &&
      PlatformData.currency !== this.currencyConfig.Default
    ) {
      PlatformData.realCurrency = PlatformData.currency =
        this.currencyConfig.Default;
    }
    PlatformData.currencySymbol = getCurrencySymbol(PlatformData.currency);

    //幣種設定
    try {
      const currencySetting: CurrencySettingFormat =
        this.currencyConfig[PlatformData.currency];
      //幣種名稱
      PlatformData.currencyName = currencySetting.Name;
      //幣種符號
      PlatformData.dollarSign = currencySetting.Sign;
      //幣種比值
      PlatformData.currencyRatio = currencySetting.Ratio;
      //小數顯示位數
      PlatformData.decimalPlaces = Number(currencySetting.Decimal);
    } catch (err) {
      console.error(
        '[GameInit] SetPlatformData set currencySetting fail.',
        err
      );
      PlatformData.currencyName = '';
      PlatformData.dollarSign = '';
      PlatformData.currencyRatio = 1;
      PlatformData.decimalPlaces = 0;
    }

    //全域設定
    try {
      if (typeof GlobalConfig !== 'undefined') {
        const currencySetting = GlobalConfig.CurrencySetting.GetContent();
        console.log('set PlatformData from GlobalConfig', currencySetting);
        if (currencySetting) {
          PlatformData.realCurrency = currencySetting.Real;
          PlatformData.currencyName = currencySetting.Name;
          PlatformData.dollarSign = currencySetting.Sign;
          PlatformData.currencyRatio = currencySetting.Ratio;
          PlatformData.decimalPlaces = currencySetting.Decimal;
        }
      }
    } catch (err) {
      console.error('[GameInit] SetPlatformData GlobalConfig error.', err);
    }

    //行動裝置判斷
    if (
      sys.isMobile ||
      sys.os === sys.OS.IOS ||
      sys.os === sys.OS.ANDROID ||
      sys.browserType === 'ucbrowser'
    ) {
      PlatformData.isMobile = true;
    }

    // themeID設定
    PlatformData.instance.commandData['theme_id'] = PlatformData.themeID;
    PlatformData.instance.commandData['allow_state'] = PlatformData.allowState;
    PlatformData.instance.commandData['device_id'] = PlatformData.deviceID;
    PlatformData.instance.commandData['kiosk_id'] = PlatformData.kioskId;
    PlatformData.instance.commandData['machine_id'] = PlatformData.machineID;
    PlatformData.instance.commandData['mode'] = PlatformData.logoMode;
    // 是否背景執行
    PlatformData.isBackgroundUpdate =
      this.gameSetting.IsBackgroundUpdate ?? false;

    let platformDataInfo = '\n';
    Object.keys(PlatformData).forEach((key: string) => {
      if (typeof PlatformData[key] === 'object') {
        console.log(
          `[GameInit] SetPlatformData - PlatformData.${key}:`,
          PlatformData[key]
        );
      } else {
        platformDataInfo += `${key}: ${PlatformData[key]}\n`;
      }
    });
    console.log('[GameInit] SetPlatformData - PlatformData:', platformDataInfo);
  }

  private SetToPlatformData() {
    PlatformData.isMacrossEnv = Boolean(
      Functions.getURLParameterByName('ssoKey')
    );

    PlatformData.instance.gameLogVersion =
      Functions.getURLParameterByName('GameLog');
    PlatformData.instance.isDebugMode = PlatformData.gameSetting.DebugMode;

    this.SetCustomPlatformSetting();
  }

  private SetFullScreenLib() {
    //全域設定
    try {
      let orientationType: OrientationDefine.OrientationType =
        OrientationDefine.OrientationType.LANDSCAPE;

      if (
        (PlatformData.gameSetting.IsSupportLandscape as boolean) &&
        (PlatformData.gameSetting.IsSupportPortrait as boolean)
      ) {
        orientationType = OrientationDefine.OrientationType.AUTO;
      } else if (PlatformData.gameSetting.IsSupportLandscape as boolean) {
        orientationType = OrientationDefine.OrientationType.LANDSCAPE;
      } else if (PlatformData.gameSetting.IsSupportPortrait as boolean) {
        orientationType = OrientationDefine.OrientationType.PORTRAIT;
      }

      if (typeof FullscreenTools !== 'undefined') {
        //全螢幕工具直橫設定
        FullscreenTools.TargetOrientation = orientationType;
      }

      //若為iframe 發送訊息至父視窗
      if (window.parent !== window.self) {
        const messageContent: Object = {
          OrientationType: orientationType,
        };

        console.log(
          '** OrientationType ** - post message: %s',
          JSON.stringify(messageContent)
        );
        window.parent.postMessage(JSON.stringify(messageContent), '*');
      }
    } catch (err) {
      console.error('[GameInit] SetFullScreenLib FullscreenTools error.', err);
    }
  }

  /**
   * 背景執行設定
   */
  private SetBackgroundUpdateSetting() {
    console.log(
      '[GameInit] backgroundUpdateSetting Active:',
      PlatformData.isBackgroundUpdate
    );
    if (!PlatformData.isBackgroundUpdate) return;

    const updateKey = 'GameBackgroundUpdate';
    const handler = ToolManager.Instance.AddBackgroundUpdateHandler(updateKey);
    window.document.addEventListener('visibilitychange', handler);
  }

  /**
   * 合併BundleConfig至BundleVersion
   */
  private MergeBundleConfigToVersion() {
    let gameBundleInfo: BundleSettingFormat =
      this.bundleVersion[PlatformData.gameFolderName];
    //若未存在遊戲專案依賴內容則建立
    if (!gameBundleInfo) {
      gameBundleInfo = this.bundleVersion[PlatformData.gameFolderName] = {
        Name: PlatformData.gameFolderName,
        Weight: 1,
        Dependency: [],
      };
    }
    //BundleConfig的內容複製到BundleVersion
    for (const key in this.bundleConfig) {
      //衝突訊息
      if (this.bundleVersion[key])
        console.warn(
          '[GameInit] MergeBundleConfigToVersion key %s from BundleConfig already exists in BundleVersion, if this is necessary, ignore this message',
          key
        );
      //複寫至BundleVersion
      this.bundleVersion[key] = JSON.parse(
        JSON.stringify(this.bundleConfig[key])
      );
      //記錄至遊戲專案依賴列表
      if (!gameBundleInfo.Dependency)
        gameBundleInfo.Dependency = new Array<string>();
      if (!gameBundleInfo.Dependency.includes(key))
        gameBundleInfo.Dependency.push(key);
    }
    console.log(
      '[GameInit] MergeBundleConfigToVersion BundleConfig: %o, BundleVersion: %o',
      this.bundleConfig,
      this.bundleVersion
    );
  }

  /**
   * 從BundleVersion取得BundleConfig
   */
  private GetBundleConfigFromVersion() {
    //遊戲專案依賴Bundle列表
    const gameDependentBundleList: Array<string> =
      BundleManager.instance.getBundleDependencyList(
        PlatformData.gameFolderName,
        this.bundleVersion
      );
    let bundleKey = '';
    let bundleInfo: BundleSettingFormat = null;
    for (let i = 0; i < gameDependentBundleList.length; i++) {
      bundleKey = gameDependentBundleList[i];
      bundleInfo = this.bundleVersion[bundleKey];
      //不存在Bundle資訊的錯誤訊息
      if (!bundleInfo) {
        BQLogger.sendLoadResFailed(bundleKey);
        console.error(
          '[GameInit] GetBundleConfigFromVersion bundleVersion[%s] is null',
          bundleKey
        );
        continue;
      }
      //複寫至BundleConfig
      this.bundleConfig[bundleKey] = JSON.parse(JSON.stringify(bundleInfo));
    }
    console.log(
      '[GameInit] GetBundleConfigFromVersion BundleConfig: %o, BundleVersion: %o',
      this.bundleConfig,
      this.bundleVersion
    );
  }

  /**
   * 優先處理RootBundle內容
   */
  private RootBundleHandler() {
    try {
      //取得ErrorCode資源
      const errorCode: JsonAsset = BundleManager.instance.getAsset<JsonAsset>(
        this.gameConfig.RootBundle as string,
        'ErrorCode',
        JsonAsset,
        PlatformData.lang
      );
      //設置ErrorCode內容
      if (errorCode) GameErrorCode.SetErrorCode(errorCode.json as JSON);

      //取得遊戲文字資源
      const gameTextDict: JsonAsset =
        BundleManager.instance.getAsset<JsonAsset>(
          this.gameConfig.RootBundle,
          MultiLangHandler.ASSET_NAME,
          JsonAsset,
          PlatformData.lang
        );
      //新增多語系遊戲文字
      if (gameTextDict)
        MultiLangHandler.addGameTextDict(gameTextDict.json as JSON);

      console.log('[GameInit] RootBundleHandler Complete');
    } catch (err) {
      console.error('[GameInit] RootBundleHandler Error', err);
    }
  }

  /**
   * 設置讀取畫面
   * @param onComplete
   * @param onError
   */
  private async SetLoadingPage(
    onComplete: Function,
    onError: (err: Error) => void
  ) {
    console.log('[GameInit] SetLoadingPage');
    let bundleName = '';
    let bundleLang = '';
    let secondBundleName = '';
    let secondBundleLang = '';
    //是否為遊戲客製讀取畫面
    let isGameLoadingPage = false;
    //載入失敗錯誤
    let loadError: Error = null;
    //先嘗試載入遊戲客製讀取畫面
    await new Promise((resolve: Function, reject: (err: Error) => void) => {
      try {
        console.log(
          '[GameInit] SetLoadingPage GameLoadingBundleSetting',
          PlatformData.commonBundleConfig
        );
        bundleName = PlatformData.commonBundleConfig.GameLoadingPage.Name;
        bundleLang = PlatformData.commonBundleConfig.GameLoadingPage.MultiLang
          ? PlatformData.lang
          : null;
      } catch (err) {
        reject(err as Error);
        return;
      }
      const OnLoadLoadingPage = (finish, total) => {
        TopViewManager.instance.playSplashProgress(finish, total, 70);
      };
      BundleManager.instance.loadBundleAssets(
        bundleName,
        bundleLang,
        OnLoadLoadingPage,
        resolve,
        reject
      );
    })
      .then(async () => {
        //載入多語系bundle
        return new Promise(
          (resolve: Function, reject: (err: Error) => void) => {
            try {
              secondBundleName =
                PlatformData.commonBundleConfig.GameLoadingPageMultiLang.Name;
              secondBundleLang = PlatformData.commonBundleConfig
                .GameLoadingPageMultiLang.MultiLang
                ? PlatformData.lang
                : null;
            } catch (err) {
              console.warn(
                '[GameInit] gameLoadingPageMultiLang load bundle error. ',
                err
              );
              resolve();
              return;
            }
            BundleManager.instance.loadBundleAssets(
              secondBundleName,
              secondBundleLang,
              null,
              resolve,
              reject
            );
          }
        );
      })
      .then(() => {
        console.log('[GameInit] SetLoadingPage load by game complete');
        isGameLoadingPage = true;
      })
      .then(() => {
        //取得遊戲文字資源
        const gameLoadingTextDict: JsonAsset =
          BundleManager.instance.getAsset<JsonAsset>(
            secondBundleName,
            'GameLoadingTextDictionary',
            JsonAsset,
            secondBundleLang
          );
        //新增多語系遊戲文字
        if (gameLoadingTextDict !== null)
          MultiLangHandler.addGameTextDict(gameLoadingTextDict.json as JSON);
      })
      .catch((err: Error) => {
        console.warn(
          '[GameInit] SetLoadingPage by game fail, try common loading page.',
          err
        );
      });
    //若無遊戲讀取畫面 則嘗試載入共用讀取畫面
    await new Promise((resolve: Function, reject: (err: Error) => void) => {
      if (isGameLoadingPage) {
        resolve();
        return;
      }
      try {
        bundleName = PlatformData.commonBundleConfig.CommonLoadingPage.Name;
        bundleLang = PlatformData.commonBundleConfig.CommonLoadingPage.MultiLang
          ? PlatformData.lang
          : null;
      } catch (err) {
        reject(err as Error);
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
        if (isGameLoadingPage) return;

        console.log('[GameInit] SetLoadingPage load by common complete');
      })
      .catch((err: Error) => {
        console.warn(
          '[GameInit] SetLoadingPage by common fail, something error.',
          err
        );
        loadError = err;
      });
    //錯誤事件
    if (loadError) {
      console.error('[GameInit] SetLoadingPage error.', loadError);
      onError(loadError);
      return;
    }
    //生成讀取畫面
    let loadingHandlerPrefab: Prefab = BundleManager.instance.getAsset<Prefab>(
      bundleName,
      LOADING_PAGE_PREFAB_FILE_PATH,
      Prefab,
      bundleLang
    );
    if (!loadingHandlerPrefab) {
      console.error('[GameInit] SetLoadingPage loadingHandlerPrefab is null.');
      return;
    }
    let loadingHandlerNode: Node = instantiate(loadingHandlerPrefab);
    loadingHandlerNode.setPosition(new Vec3(0, 0, 0));
    this.loadingPageRootNode.addChild(loadingHandlerNode);
    loadingHandlerNode.setSiblingIndex(0);
    this.loadingHandler = loadingHandlerNode.getComponent(LoadingHandler);
    //完成事件
    console.log('[GameInit] SetLoadingPage Complete, bundle:', bundleName);
    onComplete();

    loadingHandlerPrefab = undefined;
    loadingHandlerNode = undefined;
  }

  /**
   * 設置載入任務
   */
  private SetLoadTaskInfo() {
    //初始化載入任務清單 (遊戲客製的場景名稱固定導入至MainGame)
    this.loadTaskInfoList = {
      // MainGame: {
      //   Name: this.gameSetting.InitGameScene as string,
      //   Weight: 1,
      // },
    };
    //複製Bundle設定內容
    let config: BundleConfigFormat = JSON.parse(
      JSON.stringify(this.bundleConfig)
    );
    //檢查Bundle設定內容是否符合載入任務資訊 符合則加入載入任務清單 排除允許延後下載的Bundle
    let bundleSetting: BundleSettingFormat = null;
    let loadTaskInfo: LoadTaskInfo = null;
    for (const key in config) {
      bundleSetting = config[key];
      loadTaskInfo = bundleSetting as LoadTaskInfo;
      if (
        !!bundleSetting.Name &&
        !!bundleSetting.Weight &&
        !bundleSetting.AllowDelay
      )
        this.loadTaskInfoList[key] = JSON.parse(JSON.stringify(loadTaskInfo));
    }
    //增加載入任務
    let loadTask: LoadTaskInfo = null;
    for (const key in this.loadTaskInfoList) {
      loadTask = this.loadTaskInfoList[key];
      this.loadingHandler.addLoadTask(loadTask.Name, loadTask.Weight);
    }
    loadTask = null;
    config = null;

    console.warn('[GameInit] SetLoadTask:', this.loadTaskInfoList);
  }

  /**
   * 載入Bundle資源
   * @param lang
   */
  private LoadBundleAssets(lang?: string) {
    let bundleSetting: BundleSettingFormat = null;
    let bundleLength = 0;
    let bundleCount = 0;

    for (const key in this.loadTaskInfoList) {
      bundleSetting = this.bundleConfig[key];
      //主遊戲非Bundle 略過
      if (key === 'MainGame') continue;
      //查詢BundleConfig 檢查是否支援多語系 多語系參數不符則略過
      if (Functions.isNullOrEmpty(lang) === !!bundleSetting.MultiLang) continue;
      //載入Bundle總數
      bundleLength++;
      //載入Bundle資源
      const bundleName: string = bundleSetting.Name;
      BundleManager.instance.loadBundleAssets(
        bundleName,
        lang,
        (progress: number) => {
          //載入進度
          this.loadingHandler.setProgress(progress, bundleName);
        },
        () => {
          //載入進度完成
          console.log(
            `[GameInit] LoadBundleAssets(${lang ? lang : 'normal'}) Complete ${++bundleCount}/${bundleLength}\n${key}`
          );
        }
      );
    }
  }

  /**
   * 設置多語系遊戲文字
   */
  private SetMultiLangDictionary() {
    //嘗試取得多語系遊戲文字資源並新增至共用Dictionary
    let bundleSetting: BundleSettingFormat = null;
    let gameTextDict: JsonAsset = null;
    let gameAssetDict: JsonAsset = null;
    console.log(
      '[GameInit] SetMultiLangDictionary - loadTaskInfoList:',
      this.loadTaskInfoList
    );
    for (const key in this.loadTaskInfoList) {
      try {
        bundleSetting = this.bundleConfig[key];
        //主遊戲非Bundle 略過
        if (key === 'MainGame') continue;
        //非多語系Bundle則略過
        if (!bundleSetting.MultiLang) continue;

        const bundleName: string = bundleSetting.Name;

        //取得遊戲文字資源
        gameTextDict = BundleManager.instance.getAsset<JsonAsset>(
          bundleName,
          MultiLangHandler.ASSET_NAME,
          JsonAsset,
          PlatformData.lang
        );
        //新增多語系遊戲文字
        if (gameTextDict)
          MultiLangHandler.addGameTextDict(gameTextDict.json as JSON);

        //取得遊戲資源路徑對應表
        gameAssetDict = BundleManager.instance.getAsset<JsonAsset>(
          bundleName,
          MultiLangHandler.ASSET_DICT_TABLE_NAME,
          JsonAsset,
          PlatformData.lang
        );
        //新增遊戲資源路徑對應表
        if (gameAssetDict)
          MultiLangHandler.AddGameAssetDict(
            bundleName,
            gameAssetDict.json as JSON
          );
      } catch (err) {
        console.error('[GameInit] SetMultiLangDictionary.', err);
        continue;
      }
    }
  }

  /**
   * 根據logo設定是否讀取ClientInfo與Uuid
   */
  private SetCustomPlatformSetting() {
    //暫時hotfix mc 非api遊戲支援
    if (
      PlatformData.logo === 'magiccity' &&
      PlatformData.gameSetting.UseApiServer !== true
    ) {
      PlatformData.isSSEnv = true;
    }

    if (PlatformData.isSSEnv) {
      PlatformData.instance.haveGetUserInfoCmd = false;
      PlatformData.instance.haveGetUuidCmd = false;
      PlatformData.instance.haveLinkingJpCmd = false;
      PlatformData.instance.haveMarqueeCmd = false;
      PlatformData.instance.haveValidationData = false;
      PlatformData.instance.usePasswordLogin = false;
      PlatformData.instance.useDeviceLogin = false;
      PlatformData.instance.showThousandPlaces = true;
      PlatformData.instance.discardExtraZeros = false;
      PlatformData.instance.autoStartRecovery = true;
      PlatformData.instance.enableBQLog = false;
      PlatformData.instance.hasGetAssetCmd = false;
      PlatformData.instance.commandData['device'] =
        window.parent['gdDevice'] ?? 1;
      PlatformData.instance.hasBackPackCmd = false;
      PlatformData.currencySymbol = '$';
      if (
        PlatformData.logo === 'magiccity' &&
        PlatformData.jpIsMoneyFormat === false &&
        PlatformData.gameSetting.UseApiServer !== true
      ) {
        PlatformData.instance.showThousandPlaces = false;
      }
      //若非api環境則將幣種格式寫死
      if (PlatformData.gameSetting.UseApiServer !== true) {
        PlatformData.currencyRatio = 1;
        PlatformData.decimalPlaces = 0;
      }
    } else if (PlatformData.isDaraEnv) {
      PlatformData.instance.haveGetUserInfoCmd = false;
      PlatformData.instance.haveGetUuidCmd = false;
      PlatformData.instance.haveLinkingJpCmd = false;
      PlatformData.instance.haveMarqueeCmd = false;
      PlatformData.instance.haveValidationData = false;
      PlatformData.instance.usePasswordLogin = false;
      PlatformData.instance.useDeviceLogin = false;
      PlatformData.instance.showThousandPlaces = true;
      PlatformData.instance.discardExtraZeros = false;
      PlatformData.instance.autoStartRecovery = true;
      Macross.api.ssoLogin = 'sso-login.api';
      PlatformData.instance.enableBQLog = true;
      PlatformData.instance.hasGetAssetCmd = false;
      PlatformData.instance.hasBackPackCmd = false;
    } else {
      PlatformData.instance.haveGetUserInfoCmd = true;
      PlatformData.instance.haveGetUuidCmd = true;
      PlatformData.instance.haveLinkingJpCmd = true;
      PlatformData.instance.haveMarqueeCmd = true;
      PlatformData.instance.haveValidationData = true;
      PlatformData.instance.usePasswordLogin = true;
      PlatformData.instance.useDeviceLogin = true;
      PlatformData.instance.showThousandPlaces = true;
      switch (PlatformData.decimalFormat) {
        case '1000.00':
          PlatformData.instance.showThousandPlaces = false;
          break;
        default:
          PlatformData.instance.showThousandPlaces = true;
      }
      PlatformData.instance.discardExtraZeros = true;
      PlatformData.instance.autoStartRecovery = true;
      PlatformData.instance.enableBQLog = true;
      PlatformData.instance.hasGetAssetCmd = true;
      PlatformData.instance.hasBackPackCmd = true;
    }
  }

  private async createGA() {
    if (
      PlatformData.isMacrossEnv &&
      PlatformData.logo === 'acewin' &&
      Functions.getURLParameterByName('GALog') !== 'false'
    ) {
      PlatformData.instance.GAID = 'G-CG0W9LPTNE';

      await ClickLogManager.instance.createGA();
      GAHandler.SendEvent(
        'loading',
        GAEventGameFlow.engineLoaded,
        PlatformData.gameName,
        0
      );
    }
  }

  private checkGameVersion(latestVersion: string) {
    const hostname = window.location.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    ) {
      //本機測試環境，不進行版本檢查
      return;
    }

    if (PlatformData.version !== latestVersion) {
      TopViewManager.instance.showMessageBox(
        'New Version Available\nSwitching to the new version!',
        '',
        () => {
          // 獲取當前完整 URL
          const currentUrl = new URL(window.location.href);
          const currentPath = currentUrl.pathname;
          const pathParts = currentPath.split('/').filter(part => part !== '');

          // 版本在倒數第三個位置（根據代碼邏輯：/gameName/version/lang/...）
          if (pathParts.length >= 3) {
            const versionIndex = pathParts.length - 3;

            // 設定新版本號
            const newVersion = latestVersion;

            // 替換版本號
            pathParts[versionIndex] = newVersion;

            // 構建新路徑
            const newPath = '/' + pathParts.join('/');

            // 構建新 URL，保留所有查詢參數和錨點
            const newUrl = `${currentUrl.origin}${newPath}${currentUrl.search}${currentUrl.hash}`;

            // 重定向到新版本 URL
            window.location.replace(newUrl);
          } else {
            // 如果路徑結構不符合預期，則使用原來的關閉遊戲邏輯
            Functions.closeGame(PlatformData.isMute, true);
          }
        }
      );
    }
  }
}

/** 插件路徑列表格式 */
interface PluginPathListFormat {
  /** 檔案列表 (絕對路徑 / 相對路徑 / 檔名 / 檔名@版號) */
  Path?: Array<string>;
}
