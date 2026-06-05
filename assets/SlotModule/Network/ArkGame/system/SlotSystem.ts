import HttpConnect from '../../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import BaseSystem from '../common/BaseSystem';

const Cmd = {
  START_GAME: '0',
  SPIN: '1',
  NEXT_FEVER: '2',
};

export default class SlotSystem extends BaseSystem {
  public startGamerEvent: (data: JSON) => void = null;
  public spinEvent: (data: JSON) => void = null;
  public nextFeverEvent: (sg_state: number, data: JSON) => void = null;

  constructor(arkClient) {
    super(arkClient, 'slot');

    this.registerCmdCallback(Cmd.START_GAME, this.onStartGame.bind(this));
    this.registerCmdCallback(Cmd.SPIN, this.onSpin.bind(this));
    this.registerCmdCallback(Cmd.NEXT_FEVER, this.onNextFever.bind(this));
  }

  sendStartGame(game_id = '5DragonLegend', select_bet_id = 1) {
    this.sendCmd(Cmd.START_GAME, {
      game_id: game_id,
      select_bet_id: select_bet_id,
    });
  }

  sendSpin(game_id = '5DragonLegend', bet_id = '1') {
    this.sendCmd(Cmd.SPIN, {game_id: game_id, bet_id: bet_id});
  }

  sendNextFever(_game_id = '5DragonLegend', _sg_id = 0) {
    this.sendCmd(Cmd.NEXT_FEVER, {
      game_id: '5DragonLegend',
      sg_id: 0,
      data: {'0': 4},
      dev_mode: 0,
    });
  }

  onStartGame(result: number, rawData: JSON) {
    //console.log("[onStartGame]data: " + JSON.stringify(rawData))

    // 判斷網路狀態
    if (result !== HttpConnect.HttpResult.OK) {
      console.error(
        'onStartGameError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }

    // 判斷cmd_data狀態
    if (rawData === null) {
      console.error(
        'onStartGameError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }

    const _cmd_sn = rawData['cmd_sn'];
    const cmd_data = rawData['cmd_data'];
    if (cmd_data.hasOwnProperty('result') && cmd_data.hasOwnProperty('data')) {
      const _cmd_result = cmd_data['result'];
      const data = cmd_data['data'];

      // 將資料傳給遊戲邏輯做演出
      if (this.startGamerEvent !== null) {
        this.startGamerEvent(data);
      }
    } else {
      console.error(
        'onStartGameError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }
  }

  onSpin(result: number, rawData: JSON) {
    //console.error("[onSpin]data: " + JSON.stringify(rawData))

    // 判斷網路狀態
    if (result !== HttpConnect.HttpResult.OK) {
      console.error(
        'onSpinError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }

    // 判斷cmd_data狀態
    if (rawData === null) {
      console.error(
        'onSpinError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }

    const cmd_data = rawData['cmd_data'];
    if (cmd_data.hasOwnProperty('result') && cmd_data.hasOwnProperty('data')) {
      const _cmd_result = cmd_data['result'];
      const data = cmd_data['data'];

      // 將資料傳給遊戲邏輯做演出
      if (this.spinEvent !== null) {
        this.spinEvent(data);
      }
    } else {
      console.error(
        'onSpinError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }
  }

  onNextFever(result: number, rawData: JSON) {
    //console.error("[onNextFever]data: " + JSON.stringify(rawData))

    // 判斷網路狀態
    if (result !== HttpConnect.HttpResult.OK) {
      console.error(
        'onFeverError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }

    // 判斷cmd_data狀態
    if (rawData === null) {
      console.error(
        'onFeverError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }

    const _cmd_sn = rawData['cmd_sn'];
    const cmd_data = rawData['cmd_data'];
    if (cmd_data.hasOwnProperty('result') && cmd_data.hasOwnProperty('data')) {
      const _cmd_result = cmd_data['result'];
      const data = cmd_data['data'];

      // 將資料傳給遊戲邏輯做演出
      if (this.nextFeverEvent !== null) {
        const sg_id: number = data['sg_id'];
        this.nextFeverEvent(sg_id, data);
      }
    } else {
      console.error(
        'onFeverError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rawData)
      );
      return;
    }
  }
}
