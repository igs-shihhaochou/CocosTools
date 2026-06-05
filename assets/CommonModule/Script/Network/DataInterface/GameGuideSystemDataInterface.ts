export namespace GameGuideSystemDataInterface {
  //#region Client to Server
  //=======================================================
  /** 寄送設定請求 */
  export interface C2S_GetList {
    Lang?: string;
    CurrGame?: number;
  }

  export interface C2S_Redirect {
    Lang?: string;
    CurrGame?: number;
    GameName?: string;
    FullScreen?: boolean;
  }

  //=======================================================
  //#endregion Client to Server

  //#region Server to Client
  //=======================================================
  /** Server回傳的資訊 */
  export interface S2C_GetListResponse {
    GameList?: Array<SubDataStruct.S2C_RedirectInfoData>;
  }
  /** Server回傳的資訊 */
  export interface S2C_RedirectResponse {
    Url?: string;
  }
  //=======================================================
  //#endregion Server to Client

  /** 子資料結構 */
  export namespace SubDataStruct {
    /** 遊戲資訊 */
    export interface S2C_RedirectInfoData {
      /** 遊戲名稱 */
      GameName?: string;
      /** 遊戲ID */
      GameId?: number;
      /** 圖示名稱(目前未使用) */
      Icon?: string;
    }
  }
}
