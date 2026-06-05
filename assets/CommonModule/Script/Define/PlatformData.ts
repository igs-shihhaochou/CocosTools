import {EventType} from '../Manager/EventManager';
import ArkClient from '../Network/ArkSDK/ArkClient';
import {
  GameInitReadyState,
  BundleConfigFormat,
  CurrencyConfigFormat,
  GameConfigFormat,
  GameSettingFormat,
  type CommonSettingFormat,
  UIModuleType,
} from '../Type/CommonDefine';
import type {
  LicenseSetting,
  LicenseClientModeSetting,
} from '../Type/LicenseSettingDefine';
import {LogoSetting} from '../Type/LogoSettingDefine';
import type {UserSetting} from '../Type/UserSettingDefine';
import {Dictionary} from '../Utility/Dictionary';

/** 遊戲事件 */
interface GameEventName {
  readonly ORIENTATION_CHANGE: string;
  readonly AFTER_ORIENTATION_CHANGE: string;
  readonly GAME_INIT_COMPLETE: string;
  readonly MESSAGE_BOX_SHOW: string;
  readonly ASSET_REFRESH: string;
  readonly BEFORE_CLOSE_GAME: string;
  readonly GAME_PLAYER_IDLE: string;
  readonly CHANGE_GAME_BET: string;
  readonly DYNAMIC_UI_LOADED: string;
  readonly FORCE_SET_BET: string;
  readonly ASSET_REFRESH_SCOREBOX: string;
  readonly INSUFFICIENT_AMOUNT_CONFIRMED: string;
}

export class PlatformData {
  public static get instance(): PlatformData {
    if (!window['platformData']) {
      window['platformData'] = new PlatformData();
    }
    return window['platformData'];
  }
  public arkClient: ArkClient | null = null;
  /**
   * @deprecated FS初版使用的ArkClient 改為新版後將移除
   */
  public lobbyArkClient: ArkClient = null;
  //開發時編輯器帶入的網址
  public static fromFakeLobby = false;
  public static editorUrl = 'mid=2&currency=THB&logo=acewin';

  //#region 外部設定
  //=======================================================
  /** GameConfig設定 */
  public static gameConfig: GameConfigFormat;
  /** CurrencyConfig設定 */
  public static currencyConfig: CurrencyConfigFormat;
  /** BundleConfig設定 */
  public static bundleConfig: BundleConfigFormat;
  /** 共用BundleConfig設定 */
  public static commonBundleConfig: BundleConfigFormat;
  /** GameSetting設定 */
  public static gameSetting: GameSettingFormat;
  /** CommonSetting設定 */
  public static commonSetting: CommonSettingFormat;
  //=======================================================
  //#endregion 外部設定

  //#region Launcher 模式
  //=======================================================
  /** 是否為共用啟動器模式（URL 帶有 ver 參數時為 true） */
  public static isLauncherMode = false;
  //=======================================================
  //#endregion Launcher 模式

  //#region 遊戲參數
  //=======================================================
  /** 遊戲代號 (URL) */
  public static gameID = '';
  /** 遊戲名稱 (URL) */
  public static gameName = '';
  /** 遊戲資料夾名稱 (URL) */
  public static gameFolderName = '';
  /** 遊戲名稱 for 送審版本 */
  public static displayName = '';
  /** ClickLogSite(from CommonSetting.json)*/
  public static clickLogSite = '';
  /** Site(from CommonSetting.json) */
  public static site = '';
  /** LobbyDomain */
  public static lobbyDomain = '';
  /** GameLogVersion(from CommonSetting.json) */
  public static gameLogVersion = '';
  /** event(from CommonSetting.json) */
  public static event = '';
  /** Server定義的遊戲名稱 (URL) */
  public static serverGameName = '';
  /** 遊戲產品序號 */
  public static themeID = '';
  /** 移植SS ArkSDK.ArkClient.allowState */
  public static allowState = '';
  /** 移植SS LogIn流程 */
  public static deviceID = '';
  /** 移植SS LogIn流程 */
  public static machineID = '';
  /** 移植SS LogIn流程 */
  public static logoMode: number = null;
  /** 遊戲版本 (URL) */
  public static version = '';
  /** 語言 (URL) */
  public static lang = '';
  /** 幣種 (URL) */
  public static currency = '';
  /** 幣種 symbol */
  public static currencySymbol = '';
  /** 真實幣種 (URL Currency / GlobalConfig) */
  public static realCurrency = '';
  /** 幣種名稱 (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static currencyName = '';
  /** 幣種符號 (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static dollarSign = '';
  /** 幣種比值 (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static currencyRatio = 1;
  /** 小數顯示位數 (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static decimalPlaces = 0;
  /** 幣種比值 (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static realCurrencyRatio = undefined;
  /** 小數顯示位數 (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static realDecimalPlaces = undefined;
  /** 分數顯示樣式 (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static decimalFormat = undefined;
  /** jp顯示'$' (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static jpIsMoneyFormat = false;
  /** jp ratio (URL對應遊戲設定值 GlobalConfig覆寫) */
  public static jpRatio = 0.01;
  //=======================================================
  //#endregion 遊戲參數

  //#region 遊戲設定
  //=======================================================
  /** 是否為靜音 */
  public static isMute = false;
  /** 現在是否為全螢幕 (共用未串接) */
  public static isFullscreen = Boolean(document.fullscreenElement);
  /** 是否為行動裝置 */
  public static isMobile = false;
  /** 是否背景更新 (遊戲在背景時仍進行更新) */
  public static isBackgroundUpdate = false;
  /** 是否為橫版畫面 (現在是否為橫的，true代表為橫，false代表為直，null代表不支援直橫轉換) */
  public static isLandscape = false;
  /** 是否為Macross平台 */
  public static isMacrossEnv = false;
  /** Macross資產最後更新時間 */
  public static lastMacrossUpdateBalanceTs = 0;
  /** 介面模組 */
  public static uiModuleType: UIModuleType = UIModuleType.NONE;

  /** 是否開啟GameInfo 禁字轉換 */
  public static isEnableForbiddenWordConvert = false;

  /** 是否使用開分、得分兩種資產欄位 */
  public static isUseScoreBox = false;
  /** 是否有preview功能 */
  public static prizeViewerMode = false;
  /** preview功能倒數*/
  public static prizeViewerSec = 0;
  /** showDonate */
  public static isShowDonate = false;
  /** 是否為ShowPurchase */
  public static isShowPurchase = false;
  /** 是否顯示GameWin欄位 */
  public static isShowGameWin = true;
  /** 是否為Dara平台 */
  public static isDaraEnv = false;
  /** 是否為SS平台 */
  public static isSSEnv = false;
  /**送審地區 */
  public static certArea: string = null;
  /**送審實驗室ID */
  public static certId: string = null;
  /**Client Mode */
  public static clientMode: string = null;
  /**使用送審流程*/
  public static get useCert(): boolean {
    return Boolean(PlatformData.certArea && PlatformData.certId);
  }
  public static useApiServer = false;

  public static useProgressJp = true;
  /**送審帳號 */
  public static certAccount: string = null;
  //=======================================================
  //#endregion 遊戲設定

  //#region 玩家參數
  //=======================================================
  /** 玩家暱稱 (前端) */
  public static nickName = '';
  /** 玩家登入名稱 (後端) */
  public static loginName = '';
  /** 玩家資產 */
  public static balance = 0;
  /** 玩家資產 (雙幣winnings) */
  public static winnings = 0;
  /** 是否需要強制改密碼 */
  public static needUpdatePassword = false;
  /** KioskID */
  public static kioskId = '';
  /** LineCode */
  public static lineCode = '';
  //=======================================================
  //#endregion 玩家參數

  //#region 第三方參數
  //=======================================================
  /** Logo (URL) */
  public static logo = '';
  /** 總代編號 */
  public static apiId = '';
  /** 商務編號 (URL) */
  public static mID = '';
  /** 商務名稱 */
  public static siteName = '';
  /** 時區 (URL) */
  public static zone = '';
  /** 使用者ID (URL) */
  public static uID = '';
  /** 使用者Token (URL) */
  public static token = '';
  /** ArkID (URL) */
  public static aID = '';
  /** ArkToken (URL) */
  public static aToken = '';
  /** ArkKey */
  public static aKey = '';
  /** 是否支援全螢幕 (URL) */
  public static supportFullscreen = true;
  /** 左側功能列顯示開關 True隱藏 false顯示 沒帶預設顯示*/
  public static closeSystemMenu = false;
  /** 閒置踢人功能開關 正值：分鐘 負值or“0”不踢人 沒帶預設五分鐘 */
  public static idleMinute = 5;
  /** 跳過新手教學 True: 跳過, False(or沒帶): 依原本廳館設定*/
  public static skipTutorial = false;
  /** 隱藏首頁按鈕 */
  public static hideHomeBtn = false;
  /** 廠商logo */
  public static showLogo = '';
  /** 平台CDN網址 (URL) */
  public static cdnUrl = '';
  //=======================================================
  //#endregion 第三方參數

  public static gameInitReadyState: GameInitReadyState =
    GameInitReadyState.NONE;

  //#region 遊戲資源&參數(Slot)
  /** Client版本號_Server機率版本號 */
  public version = '';
  /** StartGame會取得的序號 */
  public startGameInfoSN = '';
  /** GameLog的版本號 */
  public gameLogVersion = '';
  /** Client的位置 */
  public clientIP = '';
  public loginExtraData = {};
  /** 自動旋轉次數 */
  public autospinTimes = 0;
  /** 自動旋轉上限 */
  public autospinMaxTimes = 0;
  /** 自動旋轉 */
  public autospin = false;
  /** 快速旋轉 */
  public fastspin = false;
  /** 免費遊戲結束自動旋轉 */
  public stopAutoInSpecialGame = false;
  public betList: object[] = [];
  public currentTotalBet = 0;
  public currentLineBet = 0;
  public linkingJpBet = 0;
  public maxTotalBet = 0;
  public maxLineBet = 0;
  public maxBalance = 0; //資產上限(SS)
  /** 暫停資產更新 */
  public static pauseRefreshBalance = false;
  public errorCodeDic: Dictionary<number, string> = new Dictionary<
    number,
    string
  >();
  public devmode = ''; ////TriggerKey
  //forTest
  public isDebugMode = false;
  /** 版本號 */
  public debugVersion = '';
  //  多幣種
  // 可否切換押注
  public canChangeBet = true;
  /** 顯示幾位小數位數 */
  public get displayDigit() {
    return PlatformData.decimalPlaces;
  }
  /** 顯示數值縮放 */
  public get displayRatio() {
    return PlatformData.currencyRatio;
  }
  public get displayRealDigit() {
    return PlatformData.realDecimalPlaces;
  }
  public get displayRealRatio() {
    return PlatformData.realCurrencyRatio;
  }
  public get gameName() {
    return PlatformData.gameName;
  }
  public get balance() {
    return PlatformData.balance;
  }
  public get lang() {
    return PlatformData.lang;
  }
  public get nickName() {
    return PlatformData.nickName;
  }
  public get currencyRatio() {
    return PlatformData.currencyRatio;
  }
  public get isLandscape() {
    return PlatformData.isLandscape;
  }

  //ExtraBet
  public isExtraBet = false;
  public extraBetRatio = 1;
  /** 乘上ExtraBet倍數前的TotalBet */
  public originalTotalBet = 0;
  /** 乘上ExtraBet倍數前的LineBet */
  public originalLineBet = 0;
  //#endregion 遊戲資源&參數(Slot)

  public isBonusPlay = false;
  public bonusType = '';

  public static isDevServer = false;

  //第三方登入資訊
  public thirdPartyFromType = ''; ////第三方登入類型

  /** 道具卡 Session ID */
  public itemSessionId = '';
  //道具卡id
  public itemId = '';
  public GAID = '';

  /** 是否背景更新 (遊戲在背景時仍進行更新) */
  public isBackgroundUpdate = false;

  /** 開遊戲到現在 是否已經遊玩過 */
  public hasPlayed = false;

  public commandData: JSON = JSON.parse('{}');

  public haveGetUserInfoCmd = true;
  public haveGetUuidCmd = true;
  public haveLinkingJpCmd = true;
  public haveMarqueeCmd = true;
  public haveValidationData = true;
  public usePasswordLogin = true;
  public useDeviceLogin = true;
  public showThousandPlaces = false;
  public discardExtraZeros = true;
  public autoStartRecovery = true;
  public enableBQLog = false;
  public hasGetAssetCmd = true;
  public hasBackPackCmd = true;

  public currentNetWorth = 0;

  /** 遊戲事件名稱清單 */
  public static gameEventName: EventType<GameEventName> = {
    ORIENTATION_CHANGE: 'GameOrientationChange',
    AFTER_ORIENTATION_CHANGE: 'AfterGameOrientationChange',
    GAME_INIT_COMPLETE: 'GameInitComplete',
    MESSAGE_BOX_SHOW: 'MessageBoxShow',
    ASSET_REFRESH: 'AssetRefresh',
    BEFORE_CLOSE_GAME: 'BeforeCloseGame',
    GAME_PLAYER_IDLE: 'GamePlayerIdle',
    CHANGE_GAME_BET: 'ChangeGameBet',
    DYNAMIC_UI_LOADED: 'DynamicUILoaded',
    FORCE_SET_BET: 'ForceSetBet',
    ASSET_REFRESH_SCOREBOX: 'AssetRefreshScorebox',
    INSUFFICIENT_AMOUNT_CONFIRMED: 'InsufficientAmountConfirmed',
  };

  /** Macross 相關變數 */
  public lastMacrossUpdateBalanceTs = 0;
  /** 送審設定 */
  public static licenseSetting: LicenseSetting = {
    showGameName: false,
    showTime: false,
    showPlayTime: false,
    showNetWin: false,
    showFullScreenBtn: true,
    showHomeBtn: true,
    infoOnView: false,
    closeWinTxtWithZero: false,
    showMaxBet: true,
    showCurrencySymbol: false,
    showCurrencySymbolBet: false,
    showCurrencySymbolWin: false,
    enablePlatformJP: true,
    infoMaxPayout: 0,
    infoMaxWinOdds: 0,
    infoMinBet: 0,
    infoMaxBet: 0,
    currencySymbol: '',
    showTurboBtn: true,
    showAutoBtn: true,
    oddsInfo: [],
    logShowEndBalance: false,
    showAutoSetting: false,
    noQuickSpin: false,
    showPlateformVer: false,
    blockLobbyOff: false,
    noRedSpot: false,
    closeVip: false,
    closeBuyBonusInfo: false,
    closeSettingInfo: false,
    useKilo: false,
    clickAutoSetting: false,
    closeBuyBonusAdd: false,
    removeDecimal: false,
    showBuyBonusBetInfo: false,
    closeSideFeatures: false,
    realityCheck: false,
    closeJPList: false,
    disableSettingInfo: false,
    closeManual: false,
    closeHotChilli: false,
    closeFreeSpin: false,
    closeTiggerRank: false,
    openTurbo: false,
    closeAutoShowEventWebView: false,
    showBtnInfo: true,
    showBetInfo: true,
    autoShowPayTable: false,
    noSoundUnder1: false,
    isDelay: false,
    autoPlay: false,
    closeSpeedUp: false,
    socialAPI: false,
  };

  public static licenseClientModeSetting: LicenseClientModeSetting = {
    maxRound: [],
    delayTime: [],
    roundBtn: [],
    realityCheckInterval: [],
    idleTime: [],
  };

  public static userSetting: UserSetting = {
    ShowCurrency: '',
    ShowFloatPrecision: 0,
    FuncSwitch: [],
    FuncMode: [],
    clientTheme: '',
    CertArea: '',
    CertId: '',
  };

  public static LogoSetting: LogoSetting = {
    GetSSOKeyInfo: {
      Enable: true, // 是否啟用SSOKeyInfo 預設開啟
      RetryTimes: 3, // 重試次數
      RetryDelay: 3, // 重試延遲 (秒)
    },
    EnableTryReload: false, // 關閉遊戲時是否嘗試重整頁面
  };
}
