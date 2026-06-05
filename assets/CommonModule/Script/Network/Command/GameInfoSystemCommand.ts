import {GameInfoSystemDataInterface} from '../DataInterface/GameInfoSystemDataInterface';

export namespace GameInfoSystemCommand {
  /** System Name - 符合 Protocol 規格 */
  export const SystemName = 'GameInfo';

  /** Command Name */
  export const Command = {
    CMD_GET_GAME_LIST: 'GET_GAME_LIST',
  };

  export namespace DataInterface {
    // Client to Server
    export type C2S_GetGameList = GameInfoSystemDataInterface.C2S_GetGameList;

    // Server to Client
    export type S2C_GetGameListResponse =
      GameInfoSystemDataInterface.S2C_GetGameListResponse;
  }
}
