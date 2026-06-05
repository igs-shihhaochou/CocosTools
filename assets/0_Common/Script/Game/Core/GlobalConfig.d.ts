/**
 * 全域配置
 */
declare namespace GlobalConfig {
  /**
   * 幣種設定
   */
  export class CurrencySetting {
    /** 顯示名稱 */
    static get Name(): string;
    /** 幣種符號 */
    static get Sign(): string;
    /** 幣種比值 */
    static get Ratio(): number;
    /** 小數位數 */
    static get Decimal(): number;
    /** 幣種設定內容 */
    private static Content;
    /**
     * 取得幣種設定內容 (外部資料設定優先 若無則為Server設定)
     * @param currency 幣種 (若無帶入則抓取URL參數)
     * @param mid 商戶 (若無帶入則抓取URL參數)
     * @param gameID 遊戲ID (若無帶入則抓取URL參數)
     */
    static GetContent(
      currency?: string,
      mid?: string,
      gameID?: string
    ): CurrencySettingIF;
    /**
     * 取得遠端CurrencyInfo
     * @param site
     * @param currency
     * @param mid
     */
    private static GetRemoteCurrencySetting;
  }
  /**
   * GameLog設定
   */
  export class GameLogSetting {
    /** 顯示名稱 */
    static get IsShowBalance(): boolean;
    /** GameLog設定內容 */
    private static Content;
    /**
     * 取得GameLog設定內容
     * @param currency 幣種 (若無帶入則抓取URL參數)
     * @param mid 商戶 (若無帶入則抓取URL參數)
     * @param gameID 遊戲ID (若無帶入則抓取URL參數)
     */
    static GetContent(
      currency?: string,
      mid?: string,
      gameID?: string
    ): GameLogSettingIF;
  }
  /**
   * WhiteLogo設定
   */
  export class WhiteLogoSetting {
    /**
     * 取得cocos引擊載入前的白牌logo圖片url
     * @param logo 白牌廠商的logo名稱
     */
    static GetLoadingLogo(logo: string): string;
    /**
     * 取得Game中的白牌logo圖片url
     * @param logo 白牌廠商的logo名稱
     */
    static GetGameLogo(logo: string): string;
    /**
     * 取得是否關閉開發商字樣
     * @param logo 白牌廠商的logo名稱
     */
    static IsClosePoweredBy(logo: string): boolean;
  }
  /**
   * GameConfig
   */
  export class GameConfig {
    static get config(): GameConfigFormatIF;
  }
  /** 幣種設定格式 */
  interface CurrencySettingIF {
    /** 真實幣種 */
    Real: string;
    /** 顯示名稱 */
    Name: string;
    /** 幣種符號 */
    Sign: string;
    /** 幣種比值 */
    Ratio: number;
    /** 小數位數 */
    Decimal: number;
  }
  /** GameLog設定格式 */
  interface GameLogSettingIF {
    /** 是否顯示餘額 */
    IsShowBalance: boolean;
  }
  /**GameConfig格式設定 */
  interface GameConfigFormatIF {
    /** RootBundle名稱 */
    RootBundle?: string;
    /** GameInfo目錄路徑 */
    GameInfo?: string;
    /** GameLog目錄路徑 */
    GameLog?: string;
    /** RemoteResources目錄路徑 */
    RemoteResources?: string;
    /** 客製化參數 */
    [KeyName: string]: string | number | [] | {};
  }
  export {};
  /** WhiteLogo設定格式 */
  interface WhiteLogoSettingIF {
    /** 載入cocos前的logo圖片url */
    LoadingLogo: {[key: string]: string};
    /** 遊戲內的logo圖片url */
    GameLogo: {[key: string]: string};
    /** 關閉開發商字樣的商戶設定 */
    ClosePoweredby: string[];
  }
}
