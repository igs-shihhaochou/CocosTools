/* eslint-disable @typescript-eslint/no-unused-vars */
import ArkClient from '../Network/ArkSDK/ArkClient';
import {CommonNetwork} from '../Network/CommonNetworkModule';
import GameClient from '../Network/GameClient';
import ClickLogSystemDataInterface = CommonNetwork.ClickLogSystem.DataInterface;
import {PlatformData} from '../Define/PlatformData';
import ClickLogSystem from '../Network/System/ClickLogSystem';
import GAHandler from '../Log/GA/GAHandler';

export default class ClickLogManager {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): ClickLogManager {
    if (!window['clickLogManager']) {
      window['clickLogManager'] = new ClickLogManager();
    }
    return window['clickLogManager'];
  }
  public static set instance(instance: ClickLogManager) {
    window['clickLogManager'] = instance;
  }

  //=======================================================
  //#endregion Singleton

  //設定檔
  public serverUrl = '';

  public get clickLogSystem(): ClickLogSystem {
    return this._clickLogSystem;
  }
  protected _clickLogSystem: ClickLogSystem = null;

  protected DataQueue: DataQueueCollection = {};
  protected settingIntervalTimer = -1;
  protected refreshSettingTime: number = 60 * 30 * 1000;

  constructor() {
    ClickLogManager.instance = this;
  }

  onDestroy() {
    this.release();
  }

  public async createGA() {
    await GAHandler.Create(PlatformData.instance.GAID);
  }

  public init(onInitCompleteCallback: Function, arkClient: ArkClient) {
    this.initSystem(arkClient);
    onInitCompleteCallback();
  }

  public release() {
    this.unregisterSystemEvent();

    this.releaseData();

    ClickLogManager.instance = null;
    if (this._clickLogSystem) this._clickLogSystem.release();
  }

  /**
   * 清空成員變數
   */
  protected releaseData() {
    Object.values(this.DataQueue).forEach((data: DataQueueInfo) => {
      if (data.LogIntervalTimer) clearInterval(data.LogIntervalTimer);
    });
    this.DataQueue = {};
  }

  protected initSystem(arkClient: ArkClient) {
    if (!arkClient) {
      console.warn(
        "[ClickLogManager] initSystem arkClient doesn't exist. Disable clickLog"
      );
      return;
    }

    this._clickLogSystem = new ClickLogSystem();

    //針對對應的GameClient設定好System
    this._clickLogSystem.setupHttpClient(arkClient);

    //註冊封包事件
    this.registerSystemEvent();

    //@新增一個重取設定值的時間~
    ClickLogManager.instance.sendGetSetting();
    clearInterval(this.settingIntervalTimer);
    this.settingIntervalTimer = setInterval(
      ClickLogManager.instance.sendGetSetting.bind(this),
      this.refreshSettingTime
    );
  }

  protected registerSystemEvent() {
    if (this._clickLogSystem) {
      this._clickLogSystem.addEventListener(
        CommonNetwork.ClickLogSystem.Command.CLICK_LOG,
        this.onGetLogCmd,
        this
      );
      this._clickLogSystem.addEventListener(
        CommonNetwork.ClickLogSystem.Command.GET_SETTING,
        this.onGetSettingCmd,
        this
      );
    }
  }

  protected unregisterSystemEvent() {
    if (this._clickLogSystem) {
      this._clickLogSystem.removeEventListener(
        CommonNetwork.ClickLogSystem.Command.CLICK_LOG,
        this.onGetLogCmd,
        this
      );
      this._clickLogSystem.removeEventListener(
        CommonNetwork.ClickLogSystem.Command.GET_SETTING,
        this.onGetSettingCmd,
        this
      );
    }
  }

  /** 從URL取得連線位址 */
  public getServerURL(): string {
    this.serverUrl = PlatformData.clickLogSite;
    console.log('[ClickLogManager] serverURL:', this.serverUrl);
    return this.serverUrl;
  }

  /**
   * 取得封包傳給Server的刷新時間
   * @param logName ClickLog名稱
   * @returns 刷新時間(s)
   */
  public getRefreshSec(logName: string): number {
    if (this.DataQueue[logName])
      return Number(this.DataQueue[logName].RefreshSec);
    else return -1;
  }

  /**
   * 遊戲呼叫API 新增一筆資料到佇列,資料僅帶入遊戲自定義內容,共用內容由ClickLogManager載入
   * @param logName ClickLog名稱
   * @param game 遊戲名稱(ZombieAwaken、FaFaFa...etc)
   * @param stage 廳館名稱(ZombieAwakeniDragonRegal、FaFaFa...etc)
   * @param scene 腳本名稱(Main_01、MainGame、BonusGame...etc)
   * @param count 次數(押注次數、Spin手數...etc)
   * @param data 遊戲自身定義的ClickLog資料
   */
  public addClickLog(
    logName: string,
    game: string,
    stage: string,
    scene: string,
    count: number,
    data: ClickLogData
  ) {
    //IG
    data.Logo = PlatformData.logo;
    data.Kiosk = PlatformData.kioskId;
    //AW
    data.Currency = PlatformData.realCurrency;
    data.Merchant = PlatformData.mID;
    data.LineCode = PlatformData.lineCode;
    //Common
    data.Stage = stage;
    data.Game = game;
    data.Scene = scene;
    data.Count = count;

    this.addLog(logName, data);
  }

  /**
   * 遊戲呼叫API 新增自定義的資料到佇列
   * @param logName ClickLog名稱
   * @param data ClickLog資料
   */
  public addCustomClickLog(logName: string, data: ClickLogData) {
    this.addLog(logName, data);
  }

  /** 將ClickLogManager Queue中對應的log資料傳送給server */
  public sendClickLog(logName: string) {
    const logList: Array<ClickLogData> = this.DataQueue[logName].LogList;
    if (logList.length <= 0) return;

    //準備封包內容
    const cmd: ClickLogSystemDataInterface.C2SClientLog = {
      Name: logName,
      // eslint-disable-next-line camelcase
      ark_id: GameClient.arkClient.arkId,
      LogList: logList,
    };

    //傳送後清空資料
    if (this._clickLogSystem) {
      this._clickLogSystem.sendClientLog(cmd);
      this.DataQueue[logName].LogList = [];
    }
  }

  /** 提供給使用者自定義的傳送介面,直接傳送ClickLog,cmdName:CLICK_LOG */
  public sendCustomClickLog(data: ClickLogSystemDataInterface.C2SClientLog) {
    if (this._clickLogSystem) this._clickLogSystem.sendClientLog(data);
  }

  /** 取得ClickLog設定檔 */
  protected sendGetSetting() {
    if (this._clickLogSystem) this._clickLogSystem.sendGetSetting(null);
  }

  /** 將資料放到佇列 */
  protected addLog(logName: string, data: ClickLogData) {
    console.log(
      '[ClickLogManager] AddLog: [',
      logName,
      '] data:',
      data,
      this.DataQueue[logName],
      this.DataQueue
    );
    //確認此logName是否已經建立完成,已存在就直接放進去
    if (this.DataQueue[logName]) {
      this.DataQueue[logName].LogList.push(data);
    } else {
      //沒有設定時,就不用紀錄
      console.log(
        '[ClickLogManager] AddLog failed logName:',
        logName,
        'data:',
        data
      );
    }
  }

  /** 收到Log後的回傳 */
  protected onGetLogCmd(
    result: number,
    data: ClickLogSystemDataInterface.S2CLogResponse
  ) {}

  /** 收到設定檔回傳 */
  protected onGetSettingCmd(
    result: number,
    data: ClickLogSystemDataInterface.S2CGetSettingResponse
  ) {
    const protocol: ClickLogSystemDataInterface.SubDataStruct.C2SSetting =
      data.LogType;

    Object.keys(protocol).forEach(logName => {
      const intervalTime: number = Number(protocol[logName].RefreshSec) * 1000;

      if (this.DataQueue[logName]) {
        //不一樣再更新
        if (
          this.DataQueue[logName].RefreshSec !== protocol[logName].RefreshSec
        ) {
          if (this.DataQueue[logName].LogIntervalTimer)
            clearInterval(this.DataQueue[logName].LogIntervalTimer);
          this.DataQueue[logName].LogIntervalTimer = setInterval(() => {
            this.sendClickLog(logName);
          }, intervalTime);
          this.DataQueue[logName].RefreshSec = protocol[logName].RefreshSec;
        }
      } else {
        const queueInfo: DataQueueInfo = {
          LogList: new Array<ClickLogData>(),
          RefreshSec: protocol[logName].RefreshSec,
          LogIntervalTimer: setInterval(() => {
            this.sendClickLog(logName);
          }, intervalTime),
        };
        this.DataQueue[logName] = queueInfo;
      }
    });
  }
}

/** 提供給使用者的擴充結構 */
export type ClickLogData = ClickLogSystemDataInterface.SubDataStruct.C2SLog;

//-----------------------------------------------------------------------------------------
/** ClickLogManager使用的管理結構 */
interface DataQueueCollection {
  [logName: string]: DataQueueInfo;
}

interface DataQueueInfo {
  LogIntervalTimer: number;
  RefreshSec?: Number;
  LogList: Array<ClickLogData>;
}

//-----------------------------------------------------------------------------------------
