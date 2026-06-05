import BaseArkSystem, {ReturnCommandData} from './BaseArkSystem';
import HttpConnect from '../ArkSDK/Utitlity/HttpConnect';
import {CommonNetwork} from '../CommonNetworkModule';
import DataInterface = CommonNetwork.ClickLogSystem.DataInterface;

export default class ClickLogSystem extends BaseArkSystem {
  constructor() {
    super(CommonNetwork.ClickLogSystem.SystemName);
  }
  protected registerNetworkCommand() {
    this.registerCmdCallback(
      CommonNetwork.ClickLogSystem.Command.CLICK_LOG,
      this.receiveClientLog.bind(this)
    );
    this.registerCmdCallback(
      CommonNetwork.ClickLogSystem.Command.GET_SETTING,
      this.receiveGetSetting.bind(this)
    );
  }
  protected registerSocketNetworkCommand() {}

  //#region Client to Server
  //=======================================================
  /**
   * 發送ClientLog
   * @param cmdData
   */
  public sendClientLog(cmdData: DataInterface.C2SClientLog) {
    this.sendDrtCmd(
      CommonNetwork.ClickLogSystem.Command.CLICK_LOG,
      cmdData as JSON
    );
  }

  /**
   * 發送ClientLog
   * @param cmdData
   */
  public sendGetSetting(cmdData: DataInterface.C2SGetSetting) {
    this.sendDrtCmd(
      CommonNetwork.ClickLogSystem.Command.GET_SETTING,
      cmdData as JSON
    );
  }
  //=======================================================
  //#endregion Client to Server

  //#region Server to Client
  //=======================================================
  /**
   * 接收ClientLog命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  protected receiveClientLog(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        CommonNetwork.ClickLogSystem.Command.CLICK_LOG,
        result,
        cmdData
      )
    )
      return;

    if (result !== HttpConnect.HttpResult.OK) {
      // eslint-disable-next-line prefer-rest-params
      console.error('[ClickLogSystem] receiveClientLog http error', arguments);
      return;
    }

    this.dispatchEvent(
      CommonNetwork.ClickLogSystem.Command.CLICK_LOG,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 接收GetSetting命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  protected receiveGetSetting(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        CommonNetwork.ClickLogSystem.Command.GET_SETTING,
        result,
        cmdData
      )
    )
      return;

    if (result !== HttpConnect.HttpResult.OK) {
      // eslint-disable-next-line prefer-rest-params
      console.error('[ClickLogSystem] receiveGetSetting http error', arguments);
      return;
    }

    this.dispatchEvent(
      CommonNetwork.ClickLogSystem.Command.GET_SETTING,
      result,
      cmdData,
      processTimeMs
    );
  }
  //=======================================================
  //#endregion Server to Client
}
