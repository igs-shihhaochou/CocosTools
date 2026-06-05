import {ItemSystemCommand} from '../Command/ItemSystemCommand';
import BaseArkSystem, {ReturnCommandData} from './BaseArkSystem';
import DataInterface = ItemSystemCommand.DataInterface;

export default class ItemSystem extends BaseArkSystem {
  constructor() {
    super(ItemSystemCommand.SystemName);
  }

  protected registerNetworkCommand() {
    this.registerCmdCallback(
      ItemSystemCommand.Command.CMD_BAG_SETTING,
      this.receiveBagSetting.bind(this)
    );
    this.registerCmdCallback(
      ItemSystemCommand.Command.CMD_GET_BAG,
      this.receiveGetBag.bind(this)
    );
    this.registerCmdCallback(
      ItemSystemCommand.Command.CMD_GET_HISTORY,
      this.receiveGetHistory.bind(this)
    );
    this.registerCmdCallback(
      ItemSystemCommand.Command.CMD_USE_ITEM,
      this.receiveUseItem.bind(this)
    );
    this.registerCmdCallback(
      ItemSystemCommand.Command.CMD_GET_ITEM_INFO,
      this.receiveGetItemInfo.bind(this)
    );
    this.registerCmdCallback(
      ItemSystemCommand.Command.CMD_GET_ITEM,
      this.receiveGetItem.bind(this)
    );
  }

  protected registerSocketNetworkCommand() {}

  //#region Client to Server
  //=======================================================
  /**
   * 發送BagSetting
   * @param cmdData
   */
  public sendBagSetting(cmdData: DataInterface.C2S_BagSetting) {
    this.sendCmd(ItemSystemCommand.Command.CMD_BAG_SETTING, cmdData as JSON);
  }

  /**
   * 發送GetBag
   * @param cmdData
   */
  public sendGetBag(cmdData: DataInterface.C2S_GetBag) {
    this.sendCmd(ItemSystemCommand.Command.CMD_GET_BAG, cmdData as JSON);
  }

  /**
   * 發送GetHistory
   * @param cmdData
   */
  public sendGetHistory(cmdData: DataInterface.C2S_GetHistory) {
    this.sendCmd(ItemSystemCommand.Command.CMD_GET_HISTORY, cmdData as JSON);
  }

  /**
   * 發送UseItem
   * @param cmdData
   */
  public sendUseItem(cmdData: DataInterface.C2S_UseItem) {
    this.sendCmd(ItemSystemCommand.Command.CMD_USE_ITEM, cmdData as JSON);
  }

  /**
   * 發送詢問ItemInfo
   * @param cmdData
   */
  public sendGetItemInfo(cmdData: DataInterface.C2S_GetItemInfo) {
    this.sendCmd(ItemSystemCommand.Command.CMD_GET_ITEM_INFO, cmdData as JSON);
  }

  /**
   * 發送詢問Item(活動幣)
   * @param cmdData
   */
  public sendGetItem(cmdData: DataInterface.C2S_GetItem) {
    this.sendCmd(ItemSystemCommand.Command.CMD_GET_ITEM, cmdData as JSON);
  }
  //=======================================================

  //#region Server to Client
  //=======================================================
  /**
   * 接收BagSetting命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  private receiveBagSetting(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        ItemSystemCommand.Command.CMD_BAG_SETTING,
        result,
        cmdData
      )
    )
      return;

    // if (result != HttpConnect.HttpResult.OK) {
    //     console.error("[ItemSystem] receiveBagSetting http error", arguments);
    //     return;
    // }

    this.dispatchEvent(
      ItemSystemCommand.Command.CMD_BAG_SETTING,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 接收GetBag命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  private receiveGetBag(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (this.checkRetry(ItemSystemCommand.Command.CMD_GET_BAG, result, cmdData))
      return;

    // if (result != HttpConnect.HttpResult.OK) {
    //     console.error("[ItemSystem] receiveGetBag http error", arguments);
    //     return;
    // }

    this.dispatchEvent(
      ItemSystemCommand.Command.CMD_GET_BAG,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 接收GetHistory命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  private receiveGetHistory(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        ItemSystemCommand.Command.CMD_GET_HISTORY,
        result,
        cmdData
      )
    )
      return;

    // if (result != HttpConnect.HttpResult.OK) {
    //     console.error("[ItemSystem] receiveGetHistory http error", arguments);
    //     return;
    // }

    this.dispatchEvent(
      ItemSystemCommand.Command.CMD_GET_HISTORY,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 接收UseItem命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  private receiveUseItem(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(ItemSystemCommand.Command.CMD_USE_ITEM, result, cmdData)
    )
      return;

    // if (result != HttpConnect.HttpResult.OK) {
    //     console.error("[ItemSystem] receiveUseItem http error", arguments);
    //     return;
    // }

    this.dispatchEvent(
      ItemSystemCommand.Command.CMD_USE_ITEM,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 接收GetItemInfo命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  private receiveGetItemInfo(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        ItemSystemCommand.Command.CMD_GET_ITEM_INFO,
        result,
        cmdData
      )
    )
      return;

    // if (result != HttpConnect.HttpResult.OK) {
    //     console.error("[ItemSystem] receiveUseItem http error", arguments);
    //     return;
    // }

    this.dispatchEvent(
      ItemSystemCommand.Command.CMD_GET_ITEM_INFO,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 接收GetItemInfo命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  private receiveGetItem(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(ItemSystemCommand.Command.CMD_GET_ITEM, result, cmdData)
    )
      return;

    // if (result != HttpConnect.HttpResult.OK) {
    //     console.error("[ItemSystem] receiveUseItem http error", arguments);
    //     return;
    // }

    this.dispatchEvent(
      ItemSystemCommand.Command.CMD_GET_ITEM,
      result,
      cmdData,
      processTimeMs
    );
  }
  //=======================================================
  //#endregion Server to Client
}
