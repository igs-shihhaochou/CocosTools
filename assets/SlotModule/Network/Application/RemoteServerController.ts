/* eslint-disable camelcase */
import DataController from './DataController';
import {CommandSender} from './NetworkProtocol';

import CommandHandler, {CommandContent} from './CommandHandler';
import ArkClient from '../../../CommonModule/Script/Network/ArkSDK/ArkClient';
import HttpConnect from '../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import {Define} from '../../../CommonModule/Script/Define/GlobalSetting';
import Functions from '../../../CommonModule/Script/Utility/Functions';
import {PlatformData} from '../../../CommonModule/Script/Define/PlatformData';
import {UserInfo} from '../../../CommonModule/Script/Define/UserInfo';
import HostSetting from '../../Define/HostSetting';
import {sys} from 'cc';

export default class RemoteServerController extends DataController {
  protected onLoginFinishReturn = null;
  protected gameId = '';
  /** 是否為合法第三方資訊 */
  private isLegalThirdPartyInfo = false;
  /** 是否為合法Ark資訊 */
  private isLegalArkInfo = false;
  /** 命令協定 */
  private commandProtocol: CommandSender.Interface.CommandProtocol =
    CommandSender.Source.Common;

  private useNewCmd = false;

  public setNewCmdName() {
    this.useNewCmd = true;
    this.commandProtocol = CommandSender.Source.CommonNew;
  }

  public init(mainLocation: string) {
    if (!PlatformData.instance.arkClient) {
      PlatformData.instance.arkClient = new ArkClient(mainLocation);
    }

    //第三方資訊合法條件
    this.isLegalThirdPartyInfo =
      PlatformData.uID !== null &&
      PlatformData.uID !== '' &&
      PlatformData.token !== null &&
      PlatformData.token !== '';
    //Ark資訊合法條件
    this.isLegalArkInfo =
      PlatformData.aID !== null &&
      PlatformData.aID !== '' &&
      PlatformData.aToken !== null &&
      PlatformData.aToken !== '';

    PlatformData.instance.commandData['theme_id'] = PlatformData.themeID;

    PlatformData.isDevServer = false;
  }

  public login(gameId: string, onLoginFinishReturn) {
    this.onLoginFinishReturn = onLoginFinishReturn;
    PlatformData.gameName = gameId;

    if (
      !PlatformData.instance.arkClient.arkId ||
      !PlatformData.instance.arkClient.arkToken
    ) {
      this._Login();
    }
  }

  public getStartGameData(gameId: string, onStartGameDataReturn) {
    const data: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );
    data['game_id'] = gameId;
    data['GameName'] = gameId;
    const content: CommandContent = new CommandContent();

    content.commandID = this.commandProtocol.StartGame.ID;
    content.commandName = this.commandProtocol.StartGame.Name;
    content.retryIntervalArray =
      HostSetting.instance.connectSetting.retryIntervalArray.slice(0);
    content.data = data;
    content.callback = onStartGameDataReturn;

    CommandHandler.instance.sendCommand(content);
    if (Define.DEBUG_LOG) {
      console.log('[command]Send getStartGameData Data : ', content);
    }
  }

  public getSpinData(
    gameId: string,
    lineBet: number,
    devMode: number,
    onSpinDataReturn
  ) {
    const behaviorType: number = this.GetBehaviorType();
    const data: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );
    data['game_id'] = gameId;
    data['GameName'] = gameId;
    data['line_bet'] = lineBet;
    data['BetLines'] = Math.floor(lineBet / lineBet);
    data['bet_value'] = lineBet;
    data['BetValue'] = lineBet;
    data['dev_mode'] = devMode;
    data['behavior_type'] = behaviorType;
    data['balance'] = UserInfo.instance.balance;
    data['start_game_info_sn'] = PlatformData.instance.startGameInfoSN;
    data['ExtraBet'] = PlatformData.instance.isExtraBet;
    data['CheckCmd'] = this.commandProtocol.Spin.Name;
    const content: CommandContent = new CommandContent();
    content.commandID = this.commandProtocol.Spin.ID;
    content.commandName = this.commandProtocol.Spin.Name;
    content.retryIntervalArray =
      HostSetting.instance.connectSetting.retryIntervalArray.slice(0);
    content.data = data;
    content.callback = onSpinDataReturn;
    if (content.retryIntervalArray.length === 1) {
      content.checkIntervalArray = [2, 6, 14, 40, 72];
      content.checkCommandName = this.commandProtocol.Check.Name;
    }
    CommandHandler.instance.sendCommand(content);

    if (Define.DEBUG_LOG) {
      console.log('[command]Send getSpinData Data : ', content);
    }
  }

  public getFeverData(
    gameId: string,
    sgId: number,
    devMode: number,
    feverdata,
    onFeverDataReturn
  ) {
    const data: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );
    data['game_id'] = gameId;
    data['GameName'] = gameId;
    data['sg_id'] = sgId;
    data['data'] = feverdata;
    data['dev_mode'] = devMode;
    data['start_game_info_sn'] = PlatformData.instance.startGameInfoSN;
    data['CheckCmd'] = this.commandProtocol.NextFever.Name;

    const content: CommandContent = new CommandContent();
    content.commandID = this.commandProtocol.NextFever.ID;
    content.commandName = this.commandProtocol.NextFever.Name;
    content.retryIntervalArray =
      HostSetting.instance.connectSetting.retryIntervalArray.slice(0);
    content.data = data;
    content.callback = onFeverDataReturn;
    if (content.retryIntervalArray.length === 1) {
      content.checkIntervalArray = [2, 6, 14, 40, 72];
      content.checkCommandName = this.commandProtocol.Check.Name;
    }
    CommandHandler.instance.sendCommand(content);
    if (Define.DEBUG_LOG) {
      console.log('[command]Send getFeverData Data : ' + JSON.stringify(data));
    }
  }
  public getBonusFeverData(
    gameId: string,
    sgId: number,
    devMode: number,
    bonusType: string,
    feverdata,
    onFeverDataReturn
  ) {
    const data: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );
    data['game_id'] = gameId;
    data['GameName'] = gameId;
    data['sg_id'] = sgId;
    data['data'] = feverdata;
    data['dev_mode'] = devMode;
    data['start_game_info_sn'] = PlatformData.instance.startGameInfoSN;
    data['BonusType'] = bonusType;
    data['CheckCmd'] = this.commandProtocol.BonusNextFever.Name;

    const content: CommandContent = new CommandContent();
    content.commandID = this.commandProtocol.BonusNextFever.ID;
    content.commandName = this.commandProtocol.BonusNextFever.Name;
    content.retryIntervalArray =
      HostSetting.instance.connectSetting.retryIntervalArray.slice(0);
    content.data = data;
    content.callback = onFeverDataReturn;
    if (content.retryIntervalArray.length === 1) {
      content.checkIntervalArray = [2, 6, 14, 40, 72];
      content.checkCommandName = this.commandProtocol.Check.Name;
    }
    CommandHandler.instance.sendCommand(content);
    if (Define.DEBUG_LOG) {
      console.log(
        '[command]Send getBonusFeverData Data : ' + JSON.stringify(data)
      );
    }
  }

  public getDoubleGameData(
    gameId: string,
    devMode: number,
    doubleGamedata,
    onDoubleGameDataReturn
  ) {
    const data = {
      game_id: gameId,
      dev_mode: devMode,
      balance: UserInfo.instance.balance,
      data: doubleGamedata,
      start_game_info_sn: PlatformData.instance.startGameInfoSN,
    };
    PlatformData.instance.arkClient.sendCmd(
      this.commandProtocol.DoubleGame.ID,
      this.commandProtocol.DoubleGame.Name,
      data,
      onDoubleGameDataReturn
    );

    if (Define.DEBUG_LOG) {
      console.log(
        '[command]Send getDoubleGameData Data : ' + JSON.stringify(data)
      );
    }
  }

  public getInGameJPData(gameId: string, onJPDataReturn) {
    const data = {game_id: gameId};
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
  }

  public clearFeature(gameId: string, onClearFeatureFinish) {
    const data = {game_id: gameId};
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

  private _Login() {
    //未有第三方或Ark登入資訊 且為除錯模式 改用裝置登入流程
    if (
      !this.isLegalThirdPartyInfo &&
      !this.isLegalArkInfo &&
      Define.DEBUG_MODE
    ) {
      //取得uuid
      const uuid: string = sys.localStorage.getItem('uuid');
      if (!uuid || uuid.length === 0) {
        //若無uuid則從ark取得 正常取得則重新導回此流程 異常則視為登入失敗
        PlatformData.instance.arkClient.getUuid(this._onGetUUID.bind(this));
      } else {
        //裝置登入
        if (Define.DEBUG_LOG) {
          console.log('device_login', uuid);
        }
        PlatformData.instance.arkClient.deviceLoginInternal(
          this._getOsType(),
          uuid,
          this._onLoginCallback.bind(this),
          this._getLoginExtraData(),
          this._getLoginExtraData()
        );
        return;
      }
    }
    if (this.isLegalArkInfo) {
      //若有Ark資訊 視為已登入
      if (Define.DEBUG_LOG) {
        console.log(
          'ark_login id: %s, token: %s',
          PlatformData.aID,
          PlatformData.aToken
        );
      }
      PlatformData.instance.arkClient.arkPass(
        PlatformData.aID,
        PlatformData.aToken,
        this._onLoginCallback.bind(this)
      );
    } else if (this.isLegalThirdPartyInfo) {
      //第三方登入流程
      if (Define.DEBUG_LOG) {
        console.log('bcompany_login');
      }
      PlatformData.instance.arkClient.customLogin(
        PlatformData.instance.thirdPartyFromType,
        PlatformData.uID,
        PlatformData.token,
        this._onLoginCallback.bind(this),
        this._getLoginExtraData(),
        this._getLoginExtraData()
      );
    }
  }

  private _getOsType() {
    if (sys.isBrowser) return 'webgl';
    else return sys.os.toLowerCase();
  }

  private _getLoginExtraData() {
    const extraData = PlatformData.instance.loginExtraData;
    extraData['game_id'] = PlatformData.gameID;
    extraData['currency'] = PlatformData.currency;
    extraData['trid'] = PlatformData.mID;

    return extraData;
  }

  private _onGetUUID(result, data) {
    if (result === HttpConnect.HttpResult.OK) {
      sys.localStorage.setItem('uuid', data);
      this._Login();
    } else {
      //當作login失敗處理
      this._onLoginCallback(result, data);
    }
  }

  private _onLoginCallback(result, data) {
    PlatformData.aID = PlatformData.instance.arkClient.arkId;
    PlatformData.aToken = PlatformData.instance.arkClient.arkToken;
    PlatformData.aKey = PlatformData.instance.arkClient.arkKey;

    //登入資訊存進cookie
    Functions.setCookie('apiToken', PlatformData.token, 30);
    Functions.setCookie(
      'arkToken',
      PlatformData.instance.arkClient.arkToken,
      30
    );
    Functions.setCookie('arkID', PlatformData.instance.arkClient.arkId, 30);
    Functions.setCookie('arkKey', PlatformData.instance.arkClient.arkKey, 30);
    Functions.setCookie(
      'serverAddress',
      PlatformData.instance.arkClient.gameUrl,
      30
    );

    this.onLoginFinishReturn(result, data);
    this.onLoginFinishReturn = null;
  }

  //把UserAgent的Family參數轉乘Server要的ID
  private _UserAgentFamilyToServerID(family: string): number {
    family = family.toLowerCase();
    let ret = 0;
    switch (family) {
      case 'android':
        ret = 12;
        break;
      case 'windows':
        ret = 1;
        break;
      case 'ios':
        ret = 11;
        break;
      case 'linux':
        ret = 3;
        break;
      case 'mac os x':
        ret = 2;
        break;
      case 'macos':
        ret = 2;
        break;
      case 'symbian':
        break;
      case 'blackberry os':
        break;
      case 'windows phone':
        ret = 1;
        break;
    }
    return ret;
  }

  //取得behaviorType(個位數:IsTurbo、十位數：IsAutoSpin、百位數：IsSGFinishToStopAutospin)
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

    return behaviorType;
  }
}

// Network / CommandSender 命名空間已搬至 ./NetworkProtocol.ts
// SimpleServerController.ts 仍宣告同名 namespace,TS namespace merge 會自動合併。
export * from './NetworkProtocol';
