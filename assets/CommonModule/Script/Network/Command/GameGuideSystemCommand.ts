import {GameGuideSystemDataInterface} from '../DataInterface/GameGuideSystemDataInterface';

export namespace GameGuideSystemCommand {
  /** System Name */
  export const SystemName = 'GameGuide';

  /** Command Name */
  export const Command = {
    CMD_GET_LIST: 'GET_LIST',
    CMD_REDIRECT: 'REDIRECT',
    CMD_GET_GAME_LIST: 'GET_GAME_LIST',
  };

  export namespace DataInterface {
    export type C2S_GetList = GameGuideSystemDataInterface.C2S_GetList;
    export type C2S_Redirect = GameGuideSystemDataInterface.C2S_Redirect;

    export type S2C_GetListResponse =
      GameGuideSystemDataInterface.S2C_GetListResponse;
    export type S2C_RedirectResponse =
      GameGuideSystemDataInterface.S2C_RedirectResponse;
  }
}
