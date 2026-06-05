import HttpConnect from '../../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import BaseSystem from '../common/BaseSystem';

const Cmd = {
  GET_PLAYER_DATA: '0',
};

export default class PlayerSystem extends BaseSystem {
  public playerDataEvent: (result: number, coin: number, gem: number) => void =
    null;

  constructor(arkClient) {
    super(arkClient, 'player');

    this.registerCmdCallback(
      Cmd.GET_PLAYER_DATA,
      this.onGetPlayerData.bind(this)
    );
  }

  getPlayerData() {
    this.sendCmd(Cmd.GET_PLAYER_DATA);
  }

  onGetPlayerData(result: number, rawData: JSON) {
    //console.error("[onGetPlayerData]data: " + JSON.stringify(row_data))

    if (result === HttpConnect.HttpResult.OK) {
      if (rawData !== null) {
        const cmdData = rawData['cmd_data'];
        if (
          cmdData.hasOwnProperty('result') &&
          cmdData.hasOwnProperty('data')
        ) {
          const cmdResult = cmdData['result'];
          const data = cmdData['data'];

          // 將資料傳給遊戲邏輯做演出
          if (this.playerDataEvent !== null) {
            const coin = data['coin'];
            const gem = data['gem'];

            this.playerDataEvent(cmdResult, coin, gem);
            return;
          }
        }
      }
    }

    console.error(
      'onGetPlayerDataError \n result: ' +
        result +
        ' cmd_data: ' +
        JSON.stringify(rawData)
    );
  }
}
