export namespace ItemSystemDataInterface {
  //#region Client to Server
  //=======================================================
  /** 寄送設定請求 */
  export interface C2S_BagSetting {
    ArkID?: string;
  }

  export interface C2S_GetBag {
    ArkID?: string;
  }

  export interface C2S_GetHistory {
    ArkID?: string;
    From?: number;
    Count?: number;
  }

  export interface C2S_UseItem {
    ArkID?: string;
    ItemId?: string;
    Amount?: number;
  }

  export interface C2S_GetItemInfo {
    ArkID?: string;
    ItemId?: string;
  }

  export interface C2S_GetItem {
    ArkID?: string;
    ItemId?: Array<string>;
    Session?: string;
    ExtraData?: boolean;
  }
  //=======================================================
  //#endregion Client to Server

  //#region Server to Client
  //=======================================================
  /** Server回傳的資訊 */

  export interface S2C_BagSetting {
    Code?: number;
    TypeList?: Array<string>;
    New?: boolean;
    Ts?: string;
    CoolDown?: number;
  }

  export interface S2C_GetBag {
    Code?: number;
    TypeList?: Array<string>;
    ItemList?: Array<SubDataStruct.S2C_ItemInfo>;
  }

  export interface S2C_GetHistory {
    From?: number;
    Count?: number;
  }

  export interface S2C_UseItem {
    Code?: number;
    ExtraData?: JSON;
    Ts?: number;
    data: JSON;
  }

  export interface UseItemSpinData {
    cmd_data: JSON;
  }

  export interface S2C_GetItemInfo {
    Code: number;
    ItemInfo: SubDataStruct.S2C_ItemInfo;
  }

  export interface S2C_GetItem {
    Code?: number;
    Asset?: {
      [ItemId: string]: number;
    };
    ExtraData?: {
      [ItemId: string]: SubDataStruct.S2C_ExtraData;
    };
  }
  //=======================================================
  //#endregion Server to Client

  /** 子資料結構 */
  export namespace SubDataStruct {
    export interface S2C_ExtraData {
      ExchangeRate?: {
        Coin?: number;
      };
    }

    export interface S2C_ItemInfo {
      New: boolean;
      Amount: number;
      ItemId: string;
      Rare: number;
      Name: string;
      ExtraData: {
        Cost?: number;
        Level?: number;
        GameName?: string;
        Bet?: number;
        ExtraBet?: boolean;
      };
      SubType: string;
      Type: string;
      SinceTs: number;
      UntilTs: number;
    }
  }
}
