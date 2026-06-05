import HttpConnect from '../ArkSDK/Utitlity/HttpConnect';
import {GameInfoSystemCommand} from '../Command/GameInfoSystemCommand';
import BaseArkSystem, {ReturnCommandData} from './BaseArkSystem';

import DataInterface = GameInfoSystemCommand.DataInterface;

export default class GameInfoSystem extends BaseArkSystem {
  constructor() {
    super(GameInfoSystemCommand.SystemName);
  }

  protected registerNetworkCommand() {
    this.registerCmdCallback(
      GameInfoSystemCommand.Command.CMD_GET_GAME_LIST,
      this.receiveGetGameList.bind(this)
    );
  }

  protected registerSocketNetworkCommand() {}

  //#region Client to Server
  //=======================================================
  /**
   * 發送GetGameList
   * @param cmdData
   */
  public sendGetGameList(cmdData: DataInterface.C2S_GetGameList) {
    this.sendCmd(
      GameInfoSystemCommand.Command.CMD_GET_GAME_LIST,
      cmdData as JSON
    );
  }
  //=======================================================
  //#endregion Client to Server

  //#region Server to Client
  //=======================================================
  /**
   * 接收GetGameList命令
   * @param result
   * @param cmdData
   * @param processTimeMs
   */
  private receiveGetGameList(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (
      this.checkRetry(
        GameInfoSystemCommand.Command.CMD_GET_GAME_LIST,
        result,
        cmdData
      )
    )
      return;

    if (result !== HttpConnect.HttpResult.OK) {
      console.error(
        '[GameInfoSystem] ReceiveGetGameList http error',
        result,
        cmdData,
        processTimeMs
      );
      return;
    }

    this.dispatchEvent(
      GameInfoSystemCommand.Command.CMD_GET_GAME_LIST,
      result,
      cmdData,
      processTimeMs
    );
  }
  //=======================================================
  //#endregion Server to Client
}
