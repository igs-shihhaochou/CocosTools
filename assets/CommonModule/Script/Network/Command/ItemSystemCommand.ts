import {ItemSystemDataInterface} from '../DataInterface/ItemSystemDataInterface';

export namespace ItemSystemCommand {
  /** System Name */
  export const SystemName = 'Item';

  /** Command Name */
  export const Command = {
    CMD_BAG_SETTING: 'BAG_SETTING',
    CMD_GET_BAG: 'GET_BAG',
    CMD_GET_HISTORY: 'GET_HISTORY',
    CMD_USE_ITEM: 'USE_ITEM',
    CMD_GET_ITEM_INFO: 'GET_ITEM_INFO',
    CMD_GET_ITEM: 'GET_ITEM',
  };

  export namespace DataInterface {
    export type C2S_BagSetting = ItemSystemDataInterface.C2S_BagSetting;
    export type C2S_GetBag = ItemSystemDataInterface.C2S_GetBag;
    export type C2S_GetHistory = ItemSystemDataInterface.C2S_GetHistory;
    export type C2S_UseItem = ItemSystemDataInterface.C2S_UseItem;
    export type C2S_GetItemInfo = ItemSystemDataInterface.C2S_GetItemInfo;
    export type C2S_GetItem = ItemSystemDataInterface.C2S_GetItem;

    export type S2C_BagSetting = ItemSystemDataInterface.S2C_BagSetting;
    export type S2C_GetBag = ItemSystemDataInterface.S2C_GetBag;
    export type S2C_GetHistory = ItemSystemDataInterface.S2C_GetHistory;
    export type S2C_UseItem = ItemSystemDataInterface.S2C_UseItem;
    export type S2C_GetItemInfo = ItemSystemDataInterface.S2C_GetItemInfo;
    export type S2C_GetItem = ItemSystemDataInterface.S2C_GetItem;
  }
}
