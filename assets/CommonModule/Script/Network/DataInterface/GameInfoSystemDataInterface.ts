export namespace GameInfoSystemDataInterface {
  //#region Client to Server
  //=======================================================
  /** 取得遊戲清單請求 */
  export interface C2S_GetGameList {
    /** 語言設定 */
    Lang?: string;
    /** 當前遊戲ID */
    CurrGame?: number;
  }
  //=======================================================
  //#endregion Client to Server

  //#region Server to Client
  //=======================================================
  /** 取得遊戲清單回應 */
  export interface S2C_GetGameListResponse {
    /** 回應代碼 (0=成功，負數=錯誤代碼) */
    Code: number;
    /** 成功或錯誤訊息 */
    Message: string;
    /** 遊戲排序 */
    GameList?: Array<string>;
    /** 遊戲詳細資訊 */
    GameDetailsList?: {
      /** 遊戲名稱 */
      [GameName: string]: {
        /** 遊戲ID */
        GameID?: number;
        /** 顯示名稱 */
        GameShowName?: string;
        /** 遊戲類型 */
        GameType?: string;
        /** 是否為熱門遊戲 */
        Hot?: boolean;
        /** 是否為新遊戲 */
        New?: boolean;
        /** 是否有ExtraBet */
        ExtraBet?: boolean;
        /** 刺激度(0~5) */
        Excitement?: number;
        /** 額外資訊 */
        ExtraData?: {
          /** 遊戲平台(H5、APP) */
          Platform?: string;
        };
      };
    };
  }
  //=======================================================
  //#endregion Server to Client
}
