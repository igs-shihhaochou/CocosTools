export namespace BuyBonusDataInterface {
  //#region Client to Server
  //=======================================================

  /** 詢問BuyBonus列表 */
  export interface C2S_GetInfo {
    GameName?: string;
    BonusType?: string;
  }

  /** 使用BonusSpin */
  export interface C2S_BonusSpin {
    GameName?: string;
    BonusType?: string;
    Name?: string;
    SpecialGame?: string;
    ExtraBet?: boolean;
    Bet?: number;
  }

  //=======================================================
  //#endregion Client to Server

  //#region Server to Client
  //=======================================================

  export interface S2C_GetInfo {
    /** BuyBonus列表 */
    DataList?: Array<SubDataStruct.BuyBonusInfo>;
  }

  //=======================================================
  //#endregion Server to Client

  /** 子資料結構 */
  export namespace SubDataStruct {
    /** 遊戲資訊 */
    export interface BuyBonusInfo {
      Name?: string;
      GameName?: string;
      SpecialGame?: string;
      SpecialGameType?: string;
      BetMode?: boolean[];
      BetList?: BuyBonusBetData[];
      BetLines?: number;
      CountdownTs: number;
    }

    export interface BuyBonusBetData {
      LineBet?: number;
      CostMulti?: number;
      ExtraCostMulti?: number;
    }
  }
}
