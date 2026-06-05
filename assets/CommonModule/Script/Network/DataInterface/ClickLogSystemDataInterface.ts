export namespace ClickLogSystemDataInterface {
  //#region Client to Server
  //=======================================================
  /** 寄送設定請求 */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface C2SGetSetting {}
  /** ClickLog封包內容 */
  export interface C2SClientLog {
    /** Log名稱,可從cmd GETSETTING取得 */
    Name?: string;
    /** 玩家的ark id */
    ark_id?: string;
    /** ClickLog內容 */
    LogList?: Array<SubDataStruct.C2SLog>;
  }
  //=======================================================
  //#endregion Client to Server

  //#region Server to Client
  //=======================================================
  /** Server回傳的資訊 */
  export interface S2CGetSettingResponse {
    /** 錯誤代碼 -1:系統未開啟 -2:name wrong -3:arkid wrong  */
    Code?: number;
    /** 紀錄失敗數量 */
    LogType?: SubDataStruct.C2SSetting;
  }
  /** Server回傳的資訊 */
  export interface S2CLogResponse {
    /** 錯誤代碼 -1:系統未開啟 -2:name wrong -3:arkid wrong  */
    Code?: number;
    /** 紀錄失敗數量 */
    FailCnt?: number;
  }
  //=======================================================
  //#endregion Server to Client

  /** 子資料結構 */
  export namespace SubDataStruct {
    /** ClickLog */
    export interface C2SCommonClickLogData {
      /** logo:ig使用 */
      Logo?: string;
      /** KioskId:ig使用 */
      Kiosk?: string;
      /** 幣種名稱:aw使用 */
      Currency?: string;
      /** 商戶名稱:aw使用 */
      Merchant?: string;
      /** LineCode名稱:aw使用 */
      LineCode?: string;
      /** FISH:廳館名稱;SLOT:遊戲名稱 */
      Stage?: string;
      /** 遊戲名稱 */
      Game?: string;
      /** 各log自行定義,場景名稱或特殊遊戲名稱 */
      Scene?: string;
      /** 各log自行定義 */
      Count?: number;
      /** 登入PinID:ss使用 */
      PinID?: string;
    }

    /** ClickLog格式,提供給使用者的擴充結構 */
    export type C2SLog = C2SCommonClickLogData;

    export interface C2SSetting {
      [Name: string]: {
        RefreshSec?: Number;
      };
    }
  }
}
