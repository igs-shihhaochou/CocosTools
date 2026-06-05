/**
 * Slot 與 Bonus 系統的封包名稱、命令字串、CommandProtocol 介面與 Source 表。
 *
 * 抽自 RemoteServerController.ts(原為單檔含類別與命名空間,為符合 <500 行
 * 行數標準拆出)。SimpleServerController.ts 也同名宣告 Network/CommandSender,
 * TypeScript 命名空間合併會自動合在同一個 Network/CommandSender 上,行為等價。
 */

export namespace Network.CommonSystem {
  export const Name = 'CommonSystem';
  export const C2SCommand = {
    CleanFever: 'clean_fever',
  };
}

export namespace Network.SlotSystem {
  export const Name = 'SlotGame';
  export const C2SCommand = {
    StartGame: 'start_game',
    Spin: 'spin',
    NextFever: 'next_fever',
    DoubleGame: 'double_game',
    InGameJP: 'get_in_game_jp_info',
    CleanFever: 'clean_fever',
    Check: 'check_cmd',
  };
  export const C2SCommandNew = {
    StartGame: 'START_GAME',
    Spin: 'SPIN',
    NextFever: 'NEXT_FEVER',
    BonusNextFever: 'BONUS_NEXT_FEVER',
    DoubleGame: 'DOUBLE_GAME',
    InGameJP: 'GET_IN_GAME_JP_INFO',
    CleanFever: 'CLEAN_FEVER',
    Check: 'CHECK_CMD',
  };
}

export namespace Network.SlotBonus {
  export const Name = 'SlotGame';
  export const C2SCommand = {
    GetInfo: 'get_bonus_info',
    BonusSpin: 'bonus_spin',
  };
  export const C2SCommandNew = {
    GetInfo: 'GET_BONUS_INFO',
    BonusSpin: 'BONUS_SPIN',
  };
}

/** CommandSender 協定介面 */
export namespace CommandSender.Interface {
  export interface CommandProtocol {
    ClearFeature: ArkCommand;
    StartGame: ArkCommand;
    Spin: ArkCommand;
    NextFever: ArkCommand;
    BonusNextFever?: ArkCommand;
    DoubleGame: ArkCommand;
    InGameJP: ArkCommand;
    Check: ArkCommand;
  }

  export interface ArkCommand {
    ID: string;
    Name: string;
  }
}

/** CommandSender 協定來源 */
export namespace CommandSender.Source {
  export const Common: CommandSender.Interface.CommandProtocol = {
    ClearFeature: {
      ID: Network.SlotSystem.Name,
      Name: Network.CommonSystem.C2SCommand.CleanFever,
    },
    StartGame: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.StartGame,
    },
    Spin: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.Spin,
    },
    NextFever: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.NextFever,
    },
    DoubleGame: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.DoubleGame,
    },
    InGameJP: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.InGameJP,
    },
    Check: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.Check,
    },
  };

  export const CommonNew: CommandSender.Interface.CommandProtocol = {
    ClearFeature: {
      ID: Network.SlotSystem.Name,
      Name: Network.CommonSystem.C2SCommand.CleanFever,
    },
    StartGame: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommandNew.StartGame,
    },
    Spin: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommandNew.Spin,
    },
    NextFever: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommandNew.NextFever,
    },
    BonusNextFever: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommandNew.BonusNextFever,
    },
    DoubleGame: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommandNew.DoubleGame,
    },
    InGameJP: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.InGameJP,
    },
    Check: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.Check,
    },
  };
}
