export namespace OrientationDefine {
  /** 螢幕方向列舉 */
  export enum OrientationType {
    LANDSCAPE = 'landscape', // 橫向
    PORTRAIT = 'portrait', // 直向
    AUTO = 'any',
  }
}

/** 邊界覆蓋類型列舉 */
export enum enumBorderCoverType {
  /** 四邊覆蓋 */
  ALL_SIDES = 'AllSides',
  /** 上下覆蓋 */
  TOP_BOTTOM = 'TopBottom',
  /** 左右覆蓋 */
  LEFT_RIGHT = 'LeftRight',
}

/** UI模組類型列舉 */
export enum UIModuleType {
  NONE = '',
  I_GAMING = 'igaming',
  SOCIAL_CASINO = 'socialcasino',
  SWEEPSTAKES = 'sweepstakes',
}

/** 遊戲初始準備狀態 */
export enum GameInitReadyState {
  NONE = 0,
  GAME_INIT_READY = 1 << 0,
  GAME_CLIENT_READY = 1 << 1,
  ALL_READY = GAME_INIT_READY | GAME_CLIENT_READY,
}

/** 網址參數格式 */
export interface UrlParameterFormat {
  /** 遊戲ID */
  gameID?: string;
  /** Launcher 模式：遊戲版號 */
  ver?: string;
  /** 遊戲名稱 */
  game?: string;
  /** 遊戲資料夾名稱 */
  gameFolder?: string;
  /** Server定義的遊戲名稱 */
  serverGameName?: string;
  /** 遊戲產品序號 */
  theme_id?: string;

  allow_state?: string;
  device_id?: string;
  kiosk_id?: string;
  machine_id?: string;
  logo_mode?: string;
  /** 語系 (IETF language tag: ISO 639-1、ISO 3166‑1, lower) */
  lang?: string;
  /** 幣種 (ISO 4217) */
  currency?: string;
  /** 真金幣種比值 */
  realCurrencyRatio?: number;
  /** 真金小數位數 */
  realDecimalPlaces?: number;
  /** Logo */
  logo?: string;
  /** 商戶 */
  mid?: string;
  /** 時區 */
  zone?: string;
  /** 使用者代號 / API ID */
  uid?: string;
  /** 使用者Token / API Token */
  token?: string;
  /** Ark ID */
  aid?: string;
  /** Ark Token */
  atoken?: string;
  /** 是否啟用全螢幕功能 */
  fullscreen?: string;
  /** 是否啟用全螢幕按鈕 */
  fsBtn?: string;
  /** 是否為靜音模式 */
  isMute?: string;
  /** GameServer連線位址列表 */
  site?: string;
  /** 外部API連線位址列表 */
  event?: string;
  /** 大廳位址 (目前為共用類別庫目錄) */
  lobbySite?: string;
  /** GameLog 版號 */
  GameLog?: string;
  /** 開啟來源: APP (Unity) */
  unity?: string;
  /** Unity關閉模式 (href) */
  unityCloseMode?: string;
  /** 關閉模式 (close、refresh) */
  closeMode?: string;
  /** 邀請碼 */
  promoter?: string;
  /** 大廳要求NativeApp */
  RequireNativeApp?: string;
  /** NativeApp模式 */
  NativeApp?: string;
  /** 內部模式 */
  InternalMode?: string;
  /** 開發帳號 */
  devAccount?: string;
  /** 是否強制Protocol使用SSL */
  isSSL?: string;
  /** 遊戲入口 / 遊戲資源根目錄 */
  entrance?: string;
  /** GT轉拋 */
  gtTransfer?: string;
  /** GT的WebSocketSecure參數控制開關 */
  gtSSL?: string;
  /** 行動版Console */
  eruda?: string;
  /** clickLog site */
  clickLogSite?: string;
  /** 廠商自動登入驗證用Auto Login Token (一次性) */
  altoken?: string;
  /** Macross SSOKey */
  ssoKey?: string;
  /** 是否使用開分、得分兩種資產欄位 */
  isUseScoreBox?: string;
  /** 是否有使用prize viewer */
  prizeViewerMode?: string;
  /** preivewMode倒數 */
  prizeViewerSec?: string;
  /** 是否顯示donate */
  isShowDonate?: string;
  /** home鍵無效 */
  homeBtn?: string;
  /** 分數顯示樣式*/
  decimalFormat?: string;
  /** jp顯示'$' */
  jpIsMoneyFormat?: string;
  /** jp ratio*/
  jpRatio?: number;
  /**送審實驗室ID*/
  certId?: string;
  /** 送審地域*/
  certArea?: string;
  s3Host?: string;
  srcLogo?: string;
  ShowLogo?: string;
  /** 平台CDN網址 */
  p_cdn?: string;
}

/** GameConfig 參數格式 */
export interface GameConfigFormat {
  /** RootBundle名稱 */
  RootBundle?: string;
  /** GameInfo目錄路徑 */
  GameInfo?: string;
  /** GameLog目錄路徑 */
  GameLog?: string;
  /** RemoteResources目錄路徑 */
  RemoteResources?: string;
  /**Error code路徑 */
  ErrorCodeXmlName?: string;
  /**site/event等位置設定檔路徑 */
  CommonSettingJson?: string;
  /** 是否顯示斷線訊息 */
  ShowDisconnectedMsg?: boolean;
  // --- 為了避免客製化內容導致維護困難 若有客製需求請繼承處理 ---
  /** 客製化參數 */
  //[KeyName: string]: string | number | [] | {};
}

/** CurrencyConfig 參數格式 */
export interface CurrencyConfigFormat {
  /** 預設幣種 */
  Default?: string;
  CNY: CurrencySettingFormat;
  MYR: CurrencySettingFormat;
  THB: CurrencySettingFormat;
  KVND: CurrencySettingFormat;
  KIDR: CurrencySettingFormat;
  MMK: CurrencySettingFormat;
  USD: CurrencySettingFormat;
  Q: CurrencySettingFormat;
  Coin: CurrencySettingFormat;
  EUR: CurrencySettingFormat;
}

/** BundleConfig 參數格式 */
export interface BundleConfigFormat {
  /** Bundle鍵值 */
  [BundleKey: string]: BundleSettingFormat;
}

/** GameSetting 參數格式 */
export interface GameSettingFormat {
  /** 初始後遊戲場景 */
  InitGameScene?: string;
  /** 初始後遊戲場景(待移除) */
  GameScene?: string;
  /** 遊戲ID */
  GameID?: number;
  /** 遊戲名稱 */
  GameName?: string;
  /** 遊戲顯示名稱 */
  DisplayName?: string;
  /** 遊戲連線位址 */
  GameServer?: string;
  /** 3D特效插件版號 */
  EfkVer?: string;
  /** 是否為遊戲專案客製登入流程 */
  IsManualLogin?: boolean;
  /** 是否啟用背景更新 */
  IsBackgroundUpdate?: boolean;
  /** 是否為除錯模式 */
  DebugMode?: boolean;
  /** 是否支援橫版 */
  IsSupportLandscape?: boolean;
  /** 是否支援直版 */
  IsSupportPortrait?: boolean;
  /** 初始載入合併 */
  InitLoadingMerge?: number;
  /** 邊界覆蓋類型 */
  BorderCoverType?: enumBorderCoverType;
  /** 是否支援BuyBonus */
  IsSupportBuyBonus?: boolean;
  /** 是否支援BuyBonus */
  BuyBonusClickLogDuration?: number;

  /** Dara SC小數點位數 */
  DaraSCDecimalPlaces?: number;

  /** 客製化解析度高 */
  MaxHorizontalHeight?: number;
  /** 客製化解析度寬 */
  MaxHorizontalWidth?: number;
  /** 客製化解析度高 */
  MaxPortraitHeight?: number;
  /** 客製化解析度寬 */
  MaxPortraitWidth?: number;
  /** 顯示Info頁按鈕資訊 */
  IsShowInfoPageBtn?: boolean;
  /** 顯示Info頁bet資訊 */
  IsShowInfoPageBetInfo?: boolean;
  /** loading結束卡按鈕流程 */
  ShowOkBtnWhenLoadingEnd?: boolean;
  /** 單條loading顯示 */
  ShowLoadingOnce?: boolean;
  /**是否使用api server */
  UseApiServer?: boolean;
  /**是否使用累積jp */
  UseProgressJp?: boolean;
  /**是否使用joya server */
  UseJoyaServer?: boolean;
  /**是否使用UseNextJSHtmlInfo*/
  UseNextJSHtmlInfo?: boolean;
  /**是否LoadingPage後直接顯示活動模組*/
  NotShowActivityModuleAfterLoadingPage?: boolean;
  /** 使用新版html info頁 */
  UseHtmlInfoPage?: boolean;

  /** 預設語系 */
  DefaultLang?: string;
  /** 支援語系 */
  SupportLang?: {
    'en-us'?: boolean;
    'zh-cn'?: boolean;
    'ms-my'?: boolean;
    'th-th'?: boolean;
    'vi-vn'?: boolean;
    'id-id'?: boolean;
    'my-mm'?: boolean;
    'es-es'?: boolean;
    'pt-br'?: boolean;
    'it-it'?: boolean;
    'sv-se'?: boolean;
    'ro-ro'?: boolean;
    'gr-gr'?: boolean;
    'fr-fr'?: boolean;
  };
  /** 是否使用Bundle載入 */
  UseBundleLoad?: boolean;
  /** 自動選擇等待時間 */
  BonusGameAutoSelectWaitTime?: number;
  /** 是否支援平台WebSocket控制 */
  PlatformWSCtrl?: boolean;
  /** 是否等待Game讀取完成後再執行 */
  WaitAfterGameReady?: boolean;
  /** 是否沒有開場動畫 */
  NoOpeningAnim?: boolean;

  // --- 為了避免客製化內容導致維護困難 若有客製需求請繼承處理 ---
  /** 客製化參數 */
  //[KeyName: string]: string | number | boolean | [] | {};
}

/** CurrencySetting 參數格式 */
export interface CurrencySettingFormat {
  /** 幣種名稱 */
  Name?: string;
  /** 幣種符號 */
  Sign?: string;
  /** 幣種比值 */
  Ratio?: number;
  /** 幣種小數位數 */
  Decimal?: number;
  /** 真金幣種比值 */
  RealRatio?: number;
  /** 真金幣種小數位數 */
  RealDecimal?: number;
}

/** BundleSetting 參數格式 */
export interface BundleSettingFormat {
  /** 名稱 */
  Name?: string;
  /** 版本 */
  Version?: string;
  /** 資料夾路徑 */
  Path?: string;
  /** 載入進度權重 */
  Weight?: number;
  /** 多語系路徑切分模式 */
  MultiLang?: boolean;
  /** 允許延後下載 */
  AllowDelay?: boolean;
  /** 依賴 Bundle 列表 (Bundle鍵值) */
  Dependency?: Array<string>;
  /** 使用的Prefab路徑 */
  PrefabPath?: string;
}

/** CommonSetting參數格式 */
export interface CommonSettingFormat {
  DomainList?: string[];
  EventList?: string[];
  LobbySite?: string[];
  ClickLogSite?: string[];
  S3Url?: string;
}
