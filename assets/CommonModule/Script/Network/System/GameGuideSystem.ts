import HttpConnect from '../ArkSDK/Utitlity/HttpConnect';
import {GameGuideSystemCommand} from '../Command/GameGuideSystemCommand';
import BaseArkSystem, {ReturnCommandData} from './BaseArkSystem';

import DataInterface = GameGuideSystemCommand.DataInterface;
import {PlatformGDK} from '../../Platform/PlatformGDK';
import Functions from '../../Utility/Functions';

export default class GameGuideSystem extends BaseArkSystem {
  constructor() {
    super(GameGuideSystemCommand.SystemName);
  }

  protected registerNetworkCommand() {
    this.registerCmdCallback(
      GameGuideSystemCommand.Command.CMD_GET_LIST,
      this.receiveGetList.bind(this)
    );
    this.registerCmdCallback(
      GameGuideSystemCommand.Command.CMD_REDIRECT,
      this.receiveRedirect.bind(this)
    );
    this.registerCmdCallback(
      GameGuideSystemCommand.Command.CMD_GET_GAME_LIST,
      this.receiveGetGameList.bind(this)
    );
  }

  protected registerSocketNetworkCommand() {}

  //#region Client to Server
  //=======================================================
  /**
   * 發送ClientLog
   * @param cmdData
   */
  public sendGetList(cmdData: DataInterface.C2S_GetList) {
    this.sendCmd(GameGuideSystemCommand.Command.CMD_GET_LIST, cmdData as JSON);
  }

  /**
   * 發送ClientLog
   * @param cmdData
   */
  public sendRedirect(cmdData: DataInterface.C2S_Redirect) {
    this.sendCmd(GameGuideSystemCommand.Command.CMD_REDIRECT, cmdData as JSON);
  }

  /**
   * 發送GetGameList
   * @param cmdData
   */
  public sendGetGameList(cmdData: DataInterface.C2S_GetList) {
    this.sendCmd(
      GameGuideSystemCommand.Command.CMD_GET_GAME_LIST,
      cmdData as JSON
    );
  }
  //=======================================================

  //#region Server to Client
  //=======================================================
  /**
   * 接收GetList命令
   * @param result
   * @param cmd_data
   * @param process_time_ms
   */
  private receiveGetList(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        GameGuideSystemCommand.Command.CMD_GET_LIST,
        result,
        cmdData
      )
    )
      return;

    if (result !== HttpConnect.HttpResult.OK) {
      console.error(
        '[GameGuideSystem] ReceiveClientLog http error',
        result,
        cmdData,
        processTimeMs
      );
      return;
    }

    this.dispatchEvent(
      GameGuideSystemCommand.Command.CMD_GET_LIST,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 接收Redirect命令
   * @param result
   * @param cmd_data
   * @param process_time_ms
   */
  private receiveRedirect(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        GameGuideSystemCommand.Command.CMD_REDIRECT,
        result,
        cmdData
      )
    )
      return;

    if (result !== HttpConnect.HttpResult.OK) {
      console.error(
        '[GameGuideSystem] ReceiveGetSetting http error',
        result,
        cmdData,
        processTimeMs
      );
      PlatformGDK.instance.showRedirectMsgBox.notify(
        'Change Game Http Error',
        result,
        Functions.closeGame
      );
      return;
    }

    this.dispatchEvent(
      GameGuideSystemCommand.Command.CMD_REDIRECT,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 接收GetGameList命令
   * @param result
   * @param cmd_data
   * @param process_time_ms
   */
  private receiveGetGameList(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        GameGuideSystemCommand.Command.CMD_GET_GAME_LIST,
        result,
        cmdData
      )
    )
      return;

    if (result !== HttpConnect.HttpResult.OK) {
      console.error(
        '[GameGuideSystem] ReceiveGetGameList http error',
        result,
        cmdData,
        processTimeMs
      );
      return;
    }

    this.dispatchEvent(
      GameGuideSystemCommand.Command.CMD_GET_GAME_LIST,
      result,
      cmdData,
      processTimeMs
    );
  }
  //=======================================================
  //#endregion Server to Client
}
