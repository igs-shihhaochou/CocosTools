/* eslint-disable camelcase */
import HostSetting from '../../Define/HostSetting';
import DataController from './DataController';
import RemoteServerController from './RemoteServerController';
import LocalFileController from './LocalFileController';
import HttpConnect, {
  HttpResult,
} from '../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import {Delegate} from '../../../CommonModule/Script/ExtraType';
import {
  Define,
  ErrorCode,
} from '../../../CommonModule/Script/Define/GlobalSetting';
import Functions from '../../../CommonModule/Script/Utility/Functions';
import {
  EventGameFlow,
  PlatformGDK,
} from '../../../CommonModule/Script/Platform/PlatformGDK';
import {PlatformData} from '../../../CommonModule/Script/Define/PlatformData';
import SimpleServerController from './SimpleServerController';
import BQLogger from '../../../CommonModule/Script/Log/BQLog/BQLogger';
import GDGameServerController from './GDGameServerController';
import {_decorator, CCBoolean, Component, warn} from 'cc';
import {DebugLogSetting} from '../../Define/DebugLogSetting';

const {ccclass, property} = _decorator;

@ccclass
export class CmdSender extends Component {
  @property(CCBoolean)
  private disableInGameJP = false;

  private retryTimes = 0; //重送的次數

  private retryDelayTime = 2; //重送的間格時間

  private maxRetryTimes = 3; //重送的最大次數

  public startGameDataHandler: Delegate = new Delegate();
  public inGameStartGameDataHandler: Delegate = new Delegate();
  public spinDataHandler: Delegate = new Delegate();
  public feverGameDataHandler: Delegate = new Delegate();
  public doubleGameDataHandler: Delegate = new Delegate();
  public inGameJpInfoDataHandler: Delegate = new Delegate();
  public clearFeatureDataHandler: Delegate = new Delegate();

  protected devMode = 0;
  protected dataController: DataController = null;

  protected beforeSGData = {};

  protected onLoad(): void {}

  public init() {
    let mainLocation = '';
    let secondLocation = [];

    //URL取得Server位址列表
    const siteListStr: string = PlatformData.site;
    let siteList: Array<string> = null;
    if (siteListStr) siteList = siteListStr.split(',');
    //遊戲Server位址通訊協定調整 若遊戲Server位址為"site#" 則嘗試替換為列表對應的Server位址
    //尚未支援多server位址
    let gameUrlStr: string = PlatformData?.gameSetting?.GameServer?.toString();
    if (gameUrlStr) {
      const protocol: string = window.location.protocol;
      //檢查gameUrl是否為"site#"的格式 取代為指定位址
      if (/^site[\d]+$/.test(gameUrlStr)) {
        const siteNumber = Number(gameUrlStr.replace('site', ''));
        gameUrlStr = ''; //clear
        if (siteList) gameUrlStr = siteList[siteNumber];
        if (Functions.isNullOrEmpty(gameUrlStr))
          console.warn(
            `[GameClient] InitArkClient get site number ${siteNumber} fail, please check url parameters`
          );
      }
      //檢查gameUrl是否為http通訊協定起始的格式 若無則附加https
      if (gameUrlStr && !/^http[s]?:\/\//.test(gameUrlStr))
        gameUrlStr = 'https://' + gameUrlStr;
      //TODO: 全面採用SSL時移除此判斷 改強制https
      if (Functions.getURLParameterByName('isSSL') || protocol === 'https:')
        gameUrlStr.replace('http:', 'https:');
    }
    const {isConnectServer} = HostSetting.instance.connectSetting;

    const serverAddr = gameUrlStr;

    if (Define.DEBUG_LOG && DebugLogSetting.cmdSender) {
      console.log('[CmdSender]toServer is ' + isConnectServer);

      if (isConnectServer)
        console.log('[CmdSender]serverAddress is ' + serverAddr);
    }

    this._getSetting();

    //沒有連上server或是有Server但是沒有初始化過
    if (PlatformData.instance.arkClient === null && isConnectServer === true) {
      if (HostSetting.instance.connectSetting.server.isSimpleServer) {
        this.dataController = new SimpleServerController();
      } else {
        //如果有其他種server的話這邊添加
      }
      mainLocation = serverAddr;

      this.dataController.init(mainLocation, secondLocation);
      //若Ark Token與cookie相異且Ark資訊非空值 更新為最新資訊
      if (
        PlatformData.aToken !== Functions.getCookie('arkToken') &&
        PlatformData.aID !== null &&
        PlatformData.aID !== '' &&
        PlatformData.aToken !== null &&
        PlatformData.aToken !== ''
      ) {
        Functions.setCookie('arkID', PlatformData.aID, 30);
        Functions.setCookie('arkToken', PlatformData.aToken, 30);
      }
      //Cookie儲存的apiToken相同，並且欄位都有值就讀Cookie資訊
      if (
        PlatformData.token === Functions.getCookie('apiToken') &&
        Functions.getCookie('arkID') !== '' &&
        Functions.getCookie('arkToken') !== '' &&
        Functions.getCookie('arkKey') !== '' &&
        Functions.getCookie('serverAddress') === serverAddr &&
        HostSetting.instance.connectSetting.isConnectServer
      ) {
        //從Cookie取得資訊
        PlatformData.instance.arkClient.arkId = PlatformData.aID =
          Functions.getCookie('arkID');
        PlatformData.instance.arkClient.arkToken = PlatformData.aToken =
          Functions.getCookie('arkToken');
        PlatformData.instance.arkClient.arkKey = PlatformData.aKey =
          Functions.getCookie('arkKey');

        PlatformGDK.instance.sendEventLog.notify(EventGameFlow.LoginFinished);
        this.connectServerReady();
      } else {
        this.dataController.login(
          PlatformData.gameName,
          this.onLoginFinish.bind(this)
        );
      }
    }
    //使用假資料流程 2024/05/30 by kyy
    else if (isConnectServer === false) {
      this.dataController = new LocalFileController();
      PlatformData.instance.arkClient = null;
      mainLocation = HostSetting.instance.connectSetting.fakeDataPathStartGame;
      secondLocation = HostSetting.instance.connectSetting.fakeDataPathSpin;
      this.dataController.init(mainLocation, secondLocation);
      this.dataController.login(
        PlatformData.gameName,
        this.onLoginFinish.bind(this)
      );
    } else {
      if (HostSetting.instance.connectSetting.server?.isGDSlotGame) {
        // GD SlotGame Server
        this.dataController = new GDGameServerController();
      } else if (HostSetting.instance.connectSetting.server?.isGDSlotMachine) {
        // GD SlotMachine Server
      } else {
        this.dataController = new RemoteServerController();
        if (PlatformData.useApiServer) {
          (this.dataController as RemoteServerController).setNewCmdName();
        }
      }
      mainLocation = serverAddr;

      const retData = {cmd_data: {}};
      this.onLoginFinish(HttpConnect.HttpResult.OK, retData);
    }
  }

  private onLoginFinish(result, retData) {
    if (Define.DEBUG_LOG && DebugLogSetting.cmdSender) {
      if (PlatformData.instance.arkClient) {
        console.log(
          '[CmdSender]arkId : ' + PlatformData.instance.arkClient.arkId
        );
      }
    }

    if (retData === null) {
      PlatformGDK.instance.commandDataIsNull.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
        console.error('login Fail Data is null');
      return;
    }

    //Token重複使用
    if (result === HttpConnect.HttpResult.Condition) {
      PlatformGDK.instance.commandDataIsNull.notify(
        ErrorCode.LOGINFAILED_VERIFY_FAILED
      );
      if (Define.DEBUG_LOG)
        console.error(
          '[CmdSender]login Fail:(' + result + ')' + JSON.stringify(retData)
        );
      return;
    }

    //伺服器維護
    if (result !== HttpConnect.HttpResult.OK) {
      PlatformGDK.instance.commandDataIsNull.notify(ErrorCode.MAINTENANCE);

      if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
        console.error(
          '[CmdSender]login Fail:(' + result + ')' + JSON.stringify(retData)
        );
      return;
    }

    if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
      console.log(
        '[CmdSender]loginFinishDataReturn : ' + JSON.stringify(retData)
      );

    PlatformGDK.instance.sendEventLog.notify(EventGameFlow.LoginFinished);
    this.connectServerReady();
  }

  private connectServerReady() {
    if (PlatformGDK.instance.connectServerReady.length > 0) {
      PlatformGDK.instance.connectServerReady.notify();
    }

    this.sendStartGameCmd();
  }

  public sendStartGameCmd() {
    this.scheduleOnce(() => {
      this.dataController.getStartGameData(
        PlatformData.gameName,
        this.onStartGameDataReturn.bind(this)
      );
    }, 0);
  }

  private onStartGameDataReturn(result, retData) {
    if (this.dataController === null) return;

    if (retData === null) {
      BQLogger.sendStartGameError(retData, 'Data is null');
      PlatformGDK.instance.commandDataIsNull.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error('onStartGameDataReturn Fail Data is null');
      return;
    }

    if (result !== HttpConnect.HttpResult.OK || retData.cmd_data === null) {
      BQLogger.sendStartGameError(retData, 'Data is null');
      PlatformGDK.instance.commandErrorHandler.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error(
          '[CmdSender]onStartGameDataReturn Fail:(' +
            result +
            ')' +
            JSON.stringify(retData)
        );
      return;
    }

    if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
      console.log(
        '[CmdSender]onStartGameDataReturn : ' + JSON.stringify(retData.cmd_data)
      );
    try {
      this.startGameDataHandler.notify(retData.cmd_data);
    } catch (e) {
      console.error(e);
      const errStr = e instanceof Error ? e.message : String(e);
      BQLogger.sendStartGameError(retData, errStr);
    }
  }

  public sendInGameStartGameCmd() {
    this.scheduleOnce(() => {
      this.dataController.getStartGameData(
        PlatformData.gameName,
        this.onInGameStartGameDataReturn.bind(this)
      );
    }, 0);
  }

  private onInGameStartGameDataReturn(result, retData) {
    if (this.dataController === null) return;

    if (retData === null) {
      BQLogger.sendStartGameError(retData, 'Data is null');
      PlatformGDK.instance.commandDataIsNull.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error('onStartGameDataReturn Fail Data is null');
      return;
    }

    if (result !== HttpConnect.HttpResult.OK || retData.cmd_data === null) {
      BQLogger.sendStartGameError(retData, 'Data is null');
      PlatformGDK.instance.commandErrorHandler.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error(
          '[CmdSender]onStartGameDataReturn Fail:(' +
            result +
            ')' +
            JSON.stringify(retData)
        );
      return;
    }

    if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
      console.log(
        '[CmdSender]onStartGameDataReturn : ' + JSON.stringify(retData.cmd_data)
      );
    try {
      this.inGameStartGameDataHandler.notify(retData.cmd_data);
    } catch (e) {
      console.error(e);
      BQLogger.sendStartGameError(retData, `${e}`);
    }
  }

  public sendSpinCmd(spinData?) {
    this._getSetting();

    this.scheduleOnce(() => {
      if (spinData) {
        // 表示已取得停輪資料，不用發送spincmd
        this.onSpinDataReturn(HttpResult.OK, spinData);
      } else
        this.dataController.getSpinData(
          PlatformData.gameName,
          PlatformData.instance.originalLineBet,
          this.devMode,
          this.onSpinDataReturn.bind(this)
        );
    }, 0);
  }

  private async onSpinDataReturn(result, retData) {
    const onError = (e?) => {
      console.error(e);
      BQLogger.sendSpinError(retData, e);
    };

    try {
      if (this.dataController === null)
        throw new console.error('dataController is null');

      if (retData === null) {
        PlatformGDK.instance.commandDataIsNull.notify(ErrorCode.UNKNOWN);
        if (Define.DEBUG_LOG)
          console.error('onSpinDataReturn Fail Data is null');
        throw new console.error('retData is null');
      }

      if (result !== HttpConnect.HttpResult.OK || retData.cmd_data === null) {
        PlatformGDK.instance.commandErrorHandler.notify(ErrorCode.UNKNOWN);
        // if (Define.DEBUG_LOG)
        //   console.error(
        //     '[CmdSender]onSpinDataReturn Fail:(' +
        //       result +
        //       ')' +
        //       JSON.stringify(retData)
        //   );
        throw new console.error(
          'Data Error: result not OK or cmd_data is null'
        );
      }

      if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
        console.log(
          '[CmdSender]onSpinDataReturn : ' + JSON.stringify(retData.cmd_data)
        );

      //**解析封包資料 */
      await this.spinDataHandler.notify(retData.cmd_data);
    } catch (e) {
      onError(e);
    }
  }

  //callback by reel module
  public sendFeverCmd(sgId: number, data) {
    this._getSetting();

    this.scheduleOnce(() => {
      this.dataController.getFeverData(
        PlatformData.gameName,
        sgId,
        this.devMode,
        data,
        this.onFeverDataReturn.bind(this)
      );
      this.beforeSGData = {sgId: sgId, data: data};
    }, 0);
  }
  public sendBonusFeverCmd(sgId: number, data) {
    this._getSetting();

    this.scheduleOnce(() => {
      this.dataController.getBonusFeverData(
        PlatformData.gameName,
        sgId,
        this.devMode,
        PlatformData.instance.bonusType,
        data,
        this.onFeverDataReturn.bind(this)
      );
      this.beforeSGData = {sgId: sgId, data: data};
    }, 0);
  }

  private async onFeverDataReturn(result, retData) {
    const onError = (e?) => {
      console.error(e);
      BQLogger.sendNextFeverError(retData, e);
    };

    if (this.dataController === null) return;

    if (retData === null) {
      PlatformGDK.instance.commandDataIsNull.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error('onFeverDataReturn Fail Data is null');
      onError('Data is null');
      return;
    }

    if (result !== HttpConnect.HttpResult.OK || retData.cmd_data === null) {
      PlatformGDK.instance.commandErrorHandler.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error(
          '[CmdSender]onFeverDataReturn Fail:(' +
            result +
            ')' +
            JSON.stringify(retData)
        );
      onError('Data Error');
      return;
    }

    if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
      console.log(
        '[CmdSender]onFeverDataReturn : ' + JSON.stringify(retData.cmd_data)
      );
    try {
      await this.feverGameDataHandler.notify(retData.cmd_data);
    } catch (e) {
      onError(e);
    }
  }

  private doublegameData = null;
  public sendDoubleGameCmd(data) {
    this.doublegameData = data;
    this._getSetting();

    this.scheduleOnce(() => {
      this.dataController.getDoubleGameData(
        PlatformData.gameName,
        this.devMode,
        data,
        this.onDoubleGameDataReturn.bind(this)
      );
    }, 0);
  }

  private onDoubleGameDataReturn(result, retData) {
    if (this.dataController === null) return;

    //重送Cmd
    if (
      result === HttpConnect.HttpResult.Error &&
      this.retryTimes < this.maxRetryTimes
    ) {
      this.retryTimes++;
      this._getSetting();

      this.scheduleOnce(() => {
        this.dataController.getDoubleGameData(
          PlatformData.gameName,
          this.devMode,
          this.doublegameData,
          this.onDoubleGameDataReturn.bind(this)
        );
      }, this.retryDelayTime);

      if (Define.DEBUG_LOG) warn('[CmdSender]ResendCmd sendDoubleGameCmd');
      return;
    }
    this.retryTimes = 0;

    if (retData === null) {
      PlatformGDK.instance.commandDataIsNull.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error('onDoubleGameDataReturn Fail Data is null');
      return;
    }

    if (result !== HttpConnect.HttpResult.OK || retData.cmd_data === null) {
      PlatformGDK.instance.commandErrorHandler.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error(
          '[CmdSender]onDoubleGameDataReturn Fail:(' +
            result +
            ')' +
            JSON.stringify(retData)
        );
      return;
    }

    if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
      console.log(
        '[CmdSender]onDoubleGameDataReturn : ' +
          JSON.stringify(retData.cmd_data)
      );

    this.doubleGameDataHandler.notify(retData.cmd_data);
  }

  public sendInGameJPCmd() {
    if (!this.dataController || this.disableInGameJP) return;

    this.scheduleOnce(() => {
      this.dataController.getInGameJPData(
        PlatformData.gameName,
        this.onInGameJpDataReturn.bind(this)
      );
    }, 0);
  }

  private onInGameJpDataReturn(result, retData) {
    if (this.dataController === null) return;

    try {
      //重送Cmd
      if (
        retData === null ||
        result !== HttpConnect.HttpResult.OK ||
        retData.cmd_data === null
      ) {
        this.scheduleOnce(() => {
          this.dataController.getInGameJPData(
            PlatformData.gameName,
            this.onInGameJpDataReturn.bind(this)
          );
        }, this.retryDelayTime);

        if (Define.DEBUG_LOG) warn('[CmdSender]ResendCmd sendInGameJPCmd');
        return;
      }

      if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
        console.log(
          '[CmdSender]onInGameJpDataReturn : ' +
            JSON.stringify(retData.cmd_data)
        );
      this.inGameJpInfoDataHandler.notify(retData.cmd_data);
    } catch (e) {
      console.error(e);
      const errStr = e instanceof Error ? e.message : String(e);
      BQLogger.sendInGameJPError(retData, errStr);
    }
  }

  public sendClearFeatureCmd() {
    this.dataController.clearFeature(
      PlatformData.gameName,
      this.onClearFeatureDataReturn.bind(this)
    );
  }

  private onClearFeatureDataReturn(result, retData) {
    if (this.dataController === null) return;

    //重送Cmd
    if (
      result === HttpConnect.HttpResult.Error &&
      this.retryTimes < this.maxRetryTimes
    ) {
      this.retryTimes++;
      this.dataController.clearFeature(
        PlatformData.gameName,
        this.onClearFeatureDataReturn.bind(this)
      );
      if (Define.DEBUG_LOG)
        console.error(
          '[CmdSender]onClearFeatureDataReturn Fail:(' +
            result +
            ')' +
            JSON.stringify(retData)
        );
      return;
    }
    this.retryTimes = 0;

    if (retData === null) {
      PlatformGDK.instance.commandDataIsNull.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error('onClearFeatureDataReturn Fail Data is null');
      return;
    }

    if (result !== HttpConnect.HttpResult.OK || retData.cmd_data === null) {
      PlatformGDK.instance.commandErrorHandler.notify(ErrorCode.UNKNOWN);
      if (Define.DEBUG_LOG)
        console.error(
          '[CmdSender]onClearFeatureDataReturn Fail:(' +
            result +
            ')' +
            JSON.stringify(retData)
        );
      return;
    }

    if (Define.DEBUG_LOG && DebugLogSetting.cmdSender)
      console.log(
        '[CmdSender]onClearFeatureDataReturn : ' +
          JSON.stringify(retData.cmd_data)
      );

    this.clearFeatureDataHandler.notify(retData.cmd_data);
  }

  private _getSetting() {
    this.devMode =
      PlatformData.instance.devmode === ''
        ? 0
        : parseInt(PlatformData.instance.devmode);
  }
}
