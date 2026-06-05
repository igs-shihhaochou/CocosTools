import {_decorator} from 'cc';
import {Define} from '../../../CommonModule/Script/Define/GlobalSetting';
import {PlatformData} from '../../../CommonModule/Script/Define/PlatformData';
import {UserInfo} from '../../../CommonModule/Script/Define/UserInfo';
import HttpConnect from '../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import HostSetting from '../../Define/HostSetting';
import CommandHandler, {CommandContent} from './CommandHandler';
import DataController from './DataController';
import SimpleArkClient from './SimpleArkClient';

const {ccclass} = _decorator;

@ccclass
export default class SimpleServerController extends DataController {
  private mainGameDatas: string[] = [];
  private mainGameDataIdx = 0;
  private commandProtocol: CommandSender.Interface.CommandProtocol =
    CommandSender.Source.Common;

  public init(mainLocation: string, _secondLocation: string[]) {
    if (!PlatformData.instance.arkClient) {
      PlatformData.instance.arkClient = new SimpleArkClient(mainLocation);
      PlatformData.instance.arkClient.arkId =
        HostSetting.instance.connectSetting.server.userId;
    }

    PlatformData.isDevServer = true;
  }

  public login(gameId: string, onLoginFinish) {
    const retData = {cmd_data: {}};
    onLoginFinish(HttpConnect.HttpResult.OK, retData);
  }

  public getStartGameData(gameId: string, onStartGameDataReturn) {
    //TODO:START GAME DATA

    const data: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );
    data['game_id'] = gameId;
    const content: CommandContent = new CommandContent();

    content.commandID = this.commandProtocol.StartGame.ID;
    content.commandName = this.commandProtocol.StartGame.Name;
    content['cmd'] = this.commandProtocol.StartGame.Name;
    content.retryIntervalArray =
      HostSetting.instance.connectSetting.retryIntervalArray.slice(0);
    content.data = data;
    content.callback = onStartGameDataReturn;

    CommandHandler.instance.sendCommand(content);
    if (Define.DEBUG_LOG) {
      console.log('[command]Send getStartGameData Data : ', content);
    }

    // this.mainGameDataIdx = 0;
    // let retData = { cmd_data: {} };
    // console.log("START:", this.startGameData);
    // retData.cmd_data = JSON.parse(this.startGameData);
    // onStartGameDataReturn(HttpConnect.HttpResult.OK, retData);
  }

  public getSpinData(
    gameId: string,
    lineBet: number,
    devMode: number,
    onSpinDataReturn
  ) {
    //TODO:SPIN DATA

    const behavior_type: number = this.GetBehaviorType();
    const data: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );
    data['game_id'] = gameId;
    data['line_bet'] = lineBet;
    data['bet_value'] = lineBet;
    data['dev_mode'] = devMode;
    data['behavior_type'] = behavior_type;
    data['balance'] = UserInfo.instance.balance;
    data['start_game_info_sn'] = PlatformData.instance.startGameInfoSN;
    data['ExtraBet'] = PlatformData.instance.isExtraBet;

    const content: CommandContent = new CommandContent();
    content.commandID = this.commandProtocol.Spin.ID;
    content.commandName = this.commandProtocol.Spin.Name;
    content['cmd'] = this.commandProtocol.Spin.Name;
    content.retryIntervalArray =
      HostSetting.instance.connectSetting.retryIntervalArray.slice(0);
    content.data = data;
    content.callback = onSpinDataReturn;
    CommandHandler.instance.sendCommand(content);

    if (Define.DEBUG_LOG) {
      console.log('[command]Send getSpinData Data : ', content);
    }

    // let retData = { cmd_data: {} };
    // retData.cmd_data = JSON.parse(this.mainGameDatas[this.mainGameDataIdx]);
    // this.mainGameDataIdx = (this.mainGameDataIdx += 1) % this.mainGameDatas.length;

    // onSpinDataReturn(HttpConnect.HttpResult.OK, retData);
  }

  public getFeverData(
    gameId: string,
    sgId: number,
    devMode: number,
    feverdata,
    onFeverDataReturn
  ) {
    //TODO:FEVER DATA

    const data: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );
    data['game_id'] = gameId;
    data['sg_id'] = sgId;
    data['data'] = feverdata;
    data['dev_mode'] = devMode;
    data['start_game_info_sn'] = PlatformData.instance.startGameInfoSN;

    const content: CommandContent = new CommandContent();
    content.commandID = this.commandProtocol.NextFever.ID;
    content.commandName = this.commandProtocol.NextFever.Name;
    content['cmd'] = this.commandProtocol.NextFever.Name;
    content.retryIntervalArray =
      HostSetting.instance.connectSetting.retryIntervalArray.slice(0);
    content.data = data;
    content.callback = onFeverDataReturn;
    CommandHandler.instance.sendCommand(content);
    if (Define.DEBUG_LOG) {
      console.log('[command]Send getFeverData Data : ' + JSON.stringify(data));
    }

    // let retData = { cmd_data: {} };
    // retData.cmd_data = JSON.parse(this.mainGameDatas[this.mainGameDataIdx]);
    // this.mainGameDataIdx = (this.mainGameDataIdx += 1) % this.mainGameDatas.length;
    // onFeverDataReturn(HttpConnect.HttpResult.OK, retData);
  }
  public getBonusFeverData(
    gameId: string,
    sgId: number,
    devMode: number,
    bonusType: string,
    feverdata,
    onFeverDataReturn
  ) {
    //TODO:FEVER DATA

    const data: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );
    data['game_id'] = gameId;
    data['sg_id'] = sgId;
    data['data'] = feverdata;
    data['dev_mode'] = devMode;
    data['BonusType'] = bonusType;
    data['start_game_info_sn'] = PlatformData.instance.startGameInfoSN;

    const content: CommandContent = new CommandContent();
    content.commandID = this.commandProtocol.BonusNextFever.ID;
    content.commandName = this.commandProtocol.BonusNextFever.Name;
    content['cmd'] = this.commandProtocol.BonusNextFever.Name;
    content.retryIntervalArray =
      HostSetting.instance.connectSetting.retryIntervalArray.slice(0);
    content.data = data;
    content.callback = onFeverDataReturn;
    CommandHandler.instance.sendCommand(content);
    if (Define.DEBUG_LOG) {
      console.log('[command]Send getFeverData Data : ' + JSON.stringify(data));
    }

    // let retData = { cmd_data: {} };
    // retData.cmd_data = JSON.parse(this.mainGameDatas[this.mainGameDataIdx]);
    // this.mainGameDataIdx = (this.mainGameDataIdx += 1) % this.mainGameDatas.length;
    // onFeverDataReturn(HttpConnect.HttpResult.OK, retData);
  }

  public getDoubleGameData(
    _gameId: string,
    _devMode: number,
    _data,
    _onDoubleGameDataReturn
  ) {}

  public getInGameJPData(gameId: string, onJPDataReturn) {
    const data: JSON = {game_id: gameId} as any;
    PlatformData.instance.arkClient.sendCmd(
      this.commandProtocol.InGameJP.ID,
      this.commandProtocol.InGameJP.Name,
      data,
      onJPDataReturn
    );

    if (Define.DEBUG_LOG) {
      console.log(
        '[command]Send getInGameJPData Data : ' + JSON.stringify(data)
      );
    }
    // if (this.startTime == 0)
    //     this.startTime = Date.now();
    // let jpData: JSON = JSON.parse("{\"status\":{\"msg\":\"OK\",\"id\":0},\"data\":{\"0\":\"0\",\"1\":\"0\",\"2\":\"0\",\"3\":\"0\",\"4\":\"0\",\"jp_winners\":[{\"game_id\": \"GoldenTiger\",\"jp_coin\": 999999.99,\"jp_type\": \"grand\",\"user_id\": \"100000001\",\"nickname\": \"Chris\"},{\"game_id\": \"GoldenTiger\",\"jp_coin\": 99.99,\"jp_type\": \"minor\",\"user_id\": \"100000002\",\"nickname\": \"BBB\"}]}}");

    // for (let i = 0; i < 5; i++) {
    //     jpData["data"][(5 - i).toString()] = (100 * (i + 1)) + ((i + 1) * (Date.now() - this.startTime));
    // }

    // let retData = { cmd_data: {} };
    // retData.cmd_data = jpData;
    // onJPDataReturn(HttpConnect.HttpResult.OK, retData);
  }

  public clearFeature(gameId: string, onClearFeatureFinish) {
    //TODO:CLEAR FEATURE

    const data: JSON = {game_id: gameId} as any;
    PlatformData.instance.arkClient.sendCmd(
      this.commandProtocol.ClearFeature.ID,
      this.commandProtocol.ClearFeature.Name,
      data,
      onClearFeatureFinish
    );

    if (Define.DEBUG_LOG) {
      console.log('[command]Send clearFeature Data : ' + JSON.stringify(data));
    }
  }

  //取得behavior_type(個位數:IsTurbo、十位數：IsAutoSpin、百位數：IsSGFinishToStopAutospin)
  private GetBehaviorType(): number {
    const IsTurbo = Number(PlatformData.instance.fastspin);
    const IsAutoSpin: number =
      (PlatformData.instance.autospinTimes > 0 || PlatformData.instance.autospin
        ? 1
        : 0) * 10;
    const IsSGFinishToStopAutospin: number =
      Number(PlatformData.instance.stopAutoInSpecialGame) * 100;

    const behaviorType: number =
      IsTurbo + IsAutoSpin + IsSGFinishToStopAutospin;

    // if (gGameConfig.debug_log) {

    //     console.log("behavior_type : " + behavior_type);
    // }

    return behaviorType;
  }
}

export namespace Network.CommonSystem {
  export const Name = 'CommonSystem';
  export const C2SCommand = {
    CleanFever: 'clean_fever',
  };
}

export namespace Network.SlotSystem {
  export const Name = 'SlotGame';
  export const C2SCommand = {
    StartGame: 'start_game',
    Spin: 'spin',
    NextFever: 'next_fever',
    BonusNextFever: 'bonus_next_fever',
    DoubleGame: 'double_game',
    InGameJP: 'get_in_game_jp_info',
  };
}

export namespace Network.SlotBonus {
  export const Name = 'SlotGame';
  export const C2SCommand = {
    GetInfo: 'get_bonus_info',
    BonusSpin: 'bonus_spin',
  };
}

/** CommandSender 協定介面 */
export namespace CommandSender.Interface {
  export interface CommandProtocol {
    ClearFeature: ArkCommand;
    StartGame: ArkCommand;
    Spin: ArkCommand;
    NextFever: ArkCommand;
    BonusNextFever: ArkCommand;
    DoubleGame: ArkCommand;
    InGameJP: ArkCommand;
  }

  export interface ArkCommand {
    ID: string;
    Name: string;
  }
}

/** CommandSender 協定來源 */
export namespace CommandSender.Source {
  export const Common: CommandSender.Interface.CommandProtocol = {
    ClearFeature: {
      ID: Network.SlotSystem.Name,
      Name: Network.CommonSystem.C2SCommand.CleanFever,
    },
    StartGame: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.StartGame,
    },
    Spin: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.Spin,
    },
    NextFever: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.NextFever,
    },
    BonusNextFever: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.BonusNextFever,
    },
    DoubleGame: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.DoubleGame,
    },
    InGameJP: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.InGameJP,
    },
  };
}
