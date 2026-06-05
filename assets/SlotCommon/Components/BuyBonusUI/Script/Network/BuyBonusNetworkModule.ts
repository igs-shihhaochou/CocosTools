import {EventNameList} from '../../../../../CommonModule/Script/Manager/EventManager';

export namespace BuyBonusNetwork {
  export namespace BuyBonusSystem {
    /** 事件名稱列表 */
    export const BuyBonusEvent: BuyBonusEvent = {
      NETWORK_ERROR: 'BuyBonusNetworkError',
      ENTRY_OPEN: 'BuyBonusEntryOpen',
      ENTRY_CLOSE: 'BuyBonusEntryClose',
      OPEN_PAGE: 'BuyBonusOpenPage',
    };

    /** 事件 */
    interface BuyBonusEvent extends EventNameList {
      NETWORK_ERROR: string;
      ENTRY_OPEN: string;
      ENTRY_CLOSE: string;
      OPEN_PAGE: string;
    }
  }
}
