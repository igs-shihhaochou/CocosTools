import {Queue} from '../ExtraType';
import EventManager, {EventNameList} from './EventManager';
import ArkClient from '../Network/ArkSDK/ArkClient';
import {ReturnCommandData} from '../Network/System/BaseArkSystem';
import {ItemSystemCommand} from '../Network/Command/ItemSystemCommand';
import {ItemSystemDataInterface} from '../Network/DataInterface/ItemSystemDataInterface';
import ItemSystem from '../Network/System/ItemSystem';
import {PlatformGDK} from '../Platform/PlatformGDK';

interface ItemEvent extends EventNameList {
  readonly FreeGameCardFinish: string;
  /** 取得道具 參數： ( itemId: Array<string>, session: string, extraData: boolean = false ) */
  readonly SendGetItem: string;
  readonly ReceiveGetItem: string;
}

export default class ItemManager {
  public static itemEvent: ItemEvent = {
    FreeGameCardFinish: 'free_game_card_finish',
    /** 取得道具 參數： ( itemId: Array<string>, session: string, extraData: boolean = false ) */
    SendGetItem: 'send_get_item',
    ReceiveGetItem: 'receive_get_item',
  };
  //#region Singleton
  //==================================================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): ItemManager {
    if (!window['ItemManager']) {
      window['ItemManager'] = new ItemManager();
    }
    return window['ItemManager'];
  }
  /** instance 實體 */
  private static _instance: ItemManager = null;
  //==================================================================================
  //#endregion Singleton
  public get itemSystem(): ItemSystem {
    return this._itemSystem;
  }
  private _itemSystem: ItemSystem = null;

  private get bagSettingCallback(): Function {
    return this._bagSettingCallback;
  }
  private set bagSettingCallback(value: Function) {
    this._bagSettingCallback = value;
  }
  private _bagSettingCallback: Function = null;

  private get getBagCallback(): Function {
    return this._getBagCallback;
  }
  private set getBagCallback(value: Function) {
    this._getBagCallback = value;
  }
  private _getBagCallback: Function = null;

  private get getHistoryCallback(): Function {
    return this._getHistoryCallback;
  }
  private set getHistoryCallback(value: Function) {
    this._getHistoryCallback = value;
  }
  private _getHistoryCallback: Function = null;

  private get getItemInfoCallback(): Function {
    return this._getItemInfoCallback;
  }
  private set getItemInfoCallback(value: Function) {
    this._getItemInfoCallback = value;
  }
  private _getItemInfoCallback: Function = null;

  private get useItemCallback(): Function {
    return this._useItemCallback;
  }
  private set useItemCallback(value: Function) {
    this._useItemCallback = value;
  }
  private _useItemCallback: Function = null;

  private get arkClient(): ArkClient {
    return this._arkClient;
  }
  private set arkClient(value: ArkClient) {
    this._arkClient = value;
  }
  private _arkClient: ArkClient = null;

  private get itemInfoMap(): Map<string, ReturnCommandData> {
    return this._itemInfoMap;
  }
  private set itemInfoMap(value: Map<string, ReturnCommandData>) {
    this._itemInfoMap = value;
  }
  private _itemInfoMap: Map<string, ReturnCommandData> = new Map<
    string,
    ReturnCommandData
  >();

  onDestroy() {
    this.release();
  }

  public init(onInitCompleteCallback: Function, arkClient: ArkClient) {
    if (this._itemSystem) {
      onInitCompleteCallback();
      return;
    }
    EventManager.instance.registerEvents(ItemManager.itemEvent);
    EventManager.instance.addEventListener(
      ItemManager.itemEvent.SendGetItem,
      this.sendGetItem,
      this
    );
    this.initSystem(arkClient);
    onInitCompleteCallback();
  }

  public release() {
    this.unregisterSystemEvent();
    if (this._itemSystem) this._itemSystem.release();
  }

  public initSystem(arkClient: ArkClient) {
    if (this._itemSystem) return;
    if (!arkClient) {
      console.warn("[ItemManager] InitSystem arkClient doesn't exist.");
      return;
    }
    this._arkClient = arkClient;
    this._itemSystem = new ItemSystem();
    //針對對應的GameClient設定好System
    this._itemSystem.setupHttpClient(arkClient);
    //註冊封包事件
    this.registerSystemEvent();
  }

  private registerSystemEvent() {
    if (this._itemSystem) {
      this._itemSystem.addEventListener(
        ItemSystemCommand.Command.CMD_GET_BAG,
        this.receiveGetBag,
        this
      );
      this._itemSystem.addEventListener(
        ItemSystemCommand.Command.CMD_GET_HISTORY,
        this.receiveGetHistory,
        this
      );
      this._itemSystem.addEventListener(
        ItemSystemCommand.Command.CMD_BAG_SETTING,
        this.receiveBagSetting,
        this
      );
      this._itemSystem.addEventListener(
        ItemSystemCommand.Command.CMD_USE_ITEM,
        this.receiveUseItem,
        this
      );
      this._itemSystem.addEventListener(
        ItemSystemCommand.Command.CMD_GET_ITEM_INFO,
        this.receiveGetItemInfo,
        this
      );
      this.itemSystem.addEventListener(
        ItemSystemCommand.Command.CMD_GET_ITEM,
        this.receiveGetItem,
        this
      );
    }
  }

  private unregisterSystemEvent() {
    if (this._itemSystem) {
      this._itemSystem.removeEventListener(
        ItemSystemCommand.Command.CMD_GET_BAG,
        this.receiveGetBag,
        this
      );
      this._itemSystem.removeEventListener(
        ItemSystemCommand.Command.CMD_GET_HISTORY,
        this.receiveGetHistory,
        this
      );
      this._itemSystem.removeEventListener(
        ItemSystemCommand.Command.CMD_BAG_SETTING,
        this.receiveBagSetting,
        this
      );
      this._itemSystem.removeEventListener(
        ItemSystemCommand.Command.CMD_USE_ITEM,
        this.receiveUseItem,
        this
      );
      this._itemSystem.removeEventListener(
        ItemSystemCommand.Command.CMD_GET_ITEM_INFO,
        this.receiveGetItemInfo,
        this
      );
      this.itemSystem.removeEventListener(
        ItemSystemCommand.Command.CMD_GET_ITEM,
        this.receiveGetItem,
        this
      );
    }
  }

  public sendBagSetting(callBack: Function) {
    this.initSystem(this._arkClient);
    console.log('[ItemManager] SendBagSetting()');
    const cmdData: ItemSystemDataInterface.C2S_BagSetting = {};
    cmdData.ArkID = this._arkClient.arkId;
    this._bagSettingCallback = callBack;
    this._itemSystem.sendBagSetting(cmdData);
  }

  private receiveBagSetting(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    const data: ItemSystemDataInterface.S2C_BagSetting =
      retCmdData.cmd_data as ItemSystemDataInterface.S2C_BagSetting;
    if (result !== 0) {
      console.error(
        '[ItemManager]Get Bag Setting Network Error, Result = ',
        result
      );
    } else if (retCmdData.cmd_data.Code !== 0) {
      console.error(
        '[ItemManager]Get Bag Setting Error, Code = ',
        retCmdData.cmd_data.Code
      );
    }
    if (this._bagSettingCallback) {
      this._bagSettingCallback(result, data);
      this._bagSettingCallback = null;
    }
  }

  public sendGetBag(callBack: Function) {
    this.initSystem(this._arkClient);
    console.log('[ItemManager] SendGetBag()');
    const cmdData: ItemSystemDataInterface.C2S_GetBag = {};
    cmdData.ArkID = this._arkClient.arkId;
    this._getBagCallback = callBack;
    this._itemSystem.sendGetBag(cmdData);
  }

  private receiveGetBag(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    // if (result !== 0) {
    //   console.error('[ItemManager]Get Bag Network Error, Result = ', result);
    // } else if (retCmdData.cmd_data.Code !== 0) {
    //   console.error(
    //     '[ItemManager]Get Bag Error, Code = ',
    //     retCmdData.cmd_data.Code
    //   );
    // }
    const data: ItemSystemDataInterface.S2C_GetBag =
      retCmdData.cmd_data as ItemSystemDataInterface.S2C_GetBag;
    if (this._getBagCallback) {
      this._getBagCallback(result, data);
      this._getBagCallback = null;
    }
  }

  public sendGetHistory(callBack: Function, from: number, count: number) {
    this.initSystem(this._arkClient);
    console.log('[ItemManager] SendGetHistory()');
    const cmdData: ItemSystemDataInterface.C2S_GetHistory = {};
    cmdData.ArkID = this._arkClient.arkId;
    cmdData.From = from;
    cmdData.Count = count;
    this._getHistoryCallback = callBack;
    this._itemSystem.sendGetHistory(cmdData);
  }

  private receiveGetHistory(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    const data: ItemSystemDataInterface.S2C_GetHistory =
      retCmdData.cmd_data as ItemSystemDataInterface.S2C_GetHistory;
    // if (result !== 0) {
    //   console.error(
    //     '[ItemManager]Get History Network Error, Result = ',
    //     result
    //   );
    // } else if (retCmdData.cmd_data.Code !== 0) {
    //   console.error(
    //     '[ItemManager]Get History Error, Code = ',
    //     retCmdData.cmd_data.Code
    //   );
    // }
    if (this._getHistoryCallback) {
      this._getHistoryCallback(result, data);
      this._getHistoryCallback = null;
    }
  }

  public sendUseItem(callBack: Function, itemID: string, amt: number) {
    PlatformGDK.instance.openLoadingPage.notify(this);
    this.initSystem(this._arkClient);
    console.log('[ItemManager] SendUseItem()');
    const cmdData: ItemSystemDataInterface.C2S_UseItem = {};
    cmdData.ArkID = this._arkClient.arkId;
    cmdData.ItemId = itemID;
    cmdData.Amount = amt;
    this._useItemCallback = callBack;
    this._itemSystem.sendUseItem(cmdData);
  }

  private receiveUseItem(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    PlatformGDK.instance.closeLoadingPage.notify(this);
    if (result !== 0) {
      this.getDataErrorHandler('Use Item Network Error', result);
      return;
    } else if (retCmdData.cmd_data.Code !== 0) {
      this.getDataErrorHandler('Use Item Error', retCmdData.cmd_data.Code);
      return;
    }
    const data: ItemSystemDataInterface.S2C_UseItem =
      retCmdData.cmd_data as ItemSystemDataInterface.S2C_UseItem;
    //做成跟spin一樣封包內容
    data.data = data.ExtraData;
    data.ExtraData = null;
    const spinData: ItemSystemDataInterface.UseItemSpinData = {
      cmd_data: undefined,
    };
    spinData.cmd_data = JSON.parse(JSON.stringify(data));
    if (this._useItemCallback) {
      this._useItemCallback(result, spinData);
      this._useItemCallback = null;
    }
  }

  private getItemInfoQueue: Queue<[string, Function]> = new Queue<
    [string, Function]
  >();

  private waitingForGetItemInfo = false;

  public sendGetItemInfo(callBack: Function, itemID: string) {
    if (this.waitingForGetItemInfo) {
      this.getItemInfoQueue.enqueue([itemID, callBack]);
    } else {
      this.waitingForGetItemInfo = true;
      this.checkGetItemInfo(callBack, itemID);
    }
  }

  private checkGetItemInfo(callBack: Function, itemID: string) {
    // 先確認是不是已經查過的道具
    if (this._itemInfoMap.has(itemID)) {
      if (callBack) {
        const retCmdData: ReturnCommandData = this._itemInfoMap.get(itemID);
        const data: ItemSystemDataInterface.S2C_GetItemInfo =
          retCmdData.cmd_data as ItemSystemDataInterface.S2C_GetItemInfo;
        callBack(0, data);
      }
      this.checkGetInfoQueue();
    } else {
      this.initSystem(this._arkClient);
      console.log('[ItemManager] SendGetItemInfo()');
      const cmdData: ItemSystemDataInterface.C2S_GetItemInfo = {};
      cmdData.ArkID = this._arkClient.arkId;
      cmdData.ItemId = itemID;
      this._getItemInfoCallback = callBack;
      this._itemSystem.sendGetItemInfo(cmdData);
      PlatformGDK.instance.openLoadingPage.notify(this);
    }
  }

  private receiveGetItemInfo(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    PlatformGDK.instance.closeLoadingPage.notify(this);
    if (result !== 0) {
      this.getDataErrorHandler('Use Item Network Error', result);
      this.checkGetInfoQueue();
      return;
    } else if (retCmdData.cmd_data.Code !== 0) {
      this.getDataErrorHandler('Use Item Error', retCmdData.cmd_data.Code);
      this.checkGetInfoQueue();
      return;
    }
    const data: ItemSystemDataInterface.S2C_GetItemInfo =
      retCmdData.cmd_data as ItemSystemDataInterface.S2C_GetItemInfo;
    // 更新道具資訊Map
    this._itemInfoMap.set(data.ItemInfo.ItemId, retCmdData);
    console.log('[ItemManager] itemInfoMap set = ');
    console.log(this._itemInfoMap);
    if (this._getItemInfoCallback) {
      this._getItemInfoCallback(result, data);
      this._getItemInfoCallback = null;
    }
    this.checkGetInfoQueue();
  }

  private checkGetInfoQueue() {
    if (this.getItemInfoQueue.count > 0) {
      const data = this.getItemInfoQueue.dequeue();
      this.checkGetItemInfo(data[1], data[0]);
    } else {
      this.waitingForGetItemInfo = false;
    }
  }

  private getDataErrorHandler(errorStr: string, code: number) {
    PlatformGDK.instance.showPopUpMessage.notify(errorStr, code.toString());
  }

  public sendGetItem(
    itemId: Array<string>,
    session: string,
    extraData = false
  ) {
    const cmdData: ItemSystemDataInterface.C2S_GetItem = {
      ArkID: this.arkClient.arkId,
      ItemId: itemId,
      Session: session,
      ExtraData: extraData,
    };
    this.itemSystem.sendGetItem(cmdData);
  }

  private receiveGetItem(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    if (result !== 0) {
      this.getDataErrorHandler('Use Item Network Error', result);
      this.checkGetInfoQueue();
      return;
    } else if (retCmdData.cmd_data.Code !== 0) {
      this.getDataErrorHandler('Use Item Error', retCmdData.cmd_data.Code);
      this.checkGetInfoQueue();
      return;
    }

    const data: ItemSystemDataInterface.S2C_GetItem =
      retCmdData.cmd_data as ItemSystemDataInterface.S2C_GetItem;

    // 只拋出Asset欄位
    EventManager.instance.dispatchEvent(
      ItemManager.itemEvent.ReceiveGetItem,
      data
    );
  }
}
