import {Canvas} from 'cc';
import {getCanvas} from '../../Utility/NodeProperty';
import Signal from '../../Utility/Signal';
import ArkClient from '../ArkSDK/ArkClient';
import ArkSocketClient from '../ArkSDK/ArkSocketClient';
import BaseHttpSystem from '../ArkSDK/Common/BaseHttpSystem';
import BaseSocketSystem from '../ArkSDK/Common/BaseSocketSystem';
import HttpConnect from '../ArkSDK/Utitlity/HttpConnect';
/**
 * 提供System以Http或Socket方式進行網路溝通
 */
export default abstract class BaseArkSystem {
  protected arkClient: ArkClient = null;
  protected arkSocketClient: ArkSocketClient = null;
  protected baseHttpSystem: BaseHttpSystem = null;
  protected baseSocketSystem: BaseSocketSystem = null;
  protected systemName = '';

  /** 各事件集合 */
  protected signalList: {[signalName: string]: Signal} = null;

  /** 重送命令集合 */
  protected retryCmdDict: {[retryCommandSN: string]: RetryCommandContent} =
    null;
  /** 重送延遲時間 */
  protected retryDelayTime = 2;
  /** 最大重送次數 */
  protected maxRetryTimes = 3;

  constructor(systemName: string) {
    this.systemName = systemName;

    this.signalList = {};
    this.retryCmdDict = {};
  }

  /**
   * 釋放此BaseArkSystem的資源
   */
  public release() {
    this.arkClient = null;
    this.arkSocketClient = null;
    if (this.baseHttpSystem !== null) this.baseHttpSystem.release();
    this.baseHttpSystem = null;
    if (this.baseSocketSystem !== null) this.baseSocketSystem.release();
    this.baseSocketSystem = null;

    if (this.signalList !== null) {
      for (const key in this.signalList) {
        if (this.signalList[key] !== null) this.signalList[key].dispose();
        this.signalList[key] = null;
      }
    }
    this.signalList = null;

    this.retryCmdDict = null;
  }

  /**
   * 創建System並設置此System的HttpClient
   * @param arkClient
   */
  public setupHttpClient(arkClient: ArkClient) {
    this.arkClient = arkClient;

    this.baseHttpSystem = new BaseHttpSystem(this.arkClient, this.systemName);

    this.registerNetworkCommand();
  }

  /**
   * 創建SocketSystem並設置此SocketSystem的SocketClient
   * @param arkSocketClient
   */
  public setupSocketClient(arkSocketClient: ArkSocketClient) {
    this.arkSocketClient = arkSocketClient;

    this.baseSocketSystem = new BaseSocketSystem(
      this.arkSocketClient,
      this.systemName
    );

    this.registerSocketNetworkCommand();
  }

  /**
   * 增加事件監聽者
   * @param evt
   * @param listener
   * @param context
   */
  public addEventListener(evt: string, listener: Function, context?: Object) {
    if (!this.signalList[evt]) {
      this.signalList[evt] = new Signal();
    }

    const signal: Signal = this.signalList[evt];
    if (signal?.has(listener, context)) return;

    signal.add(listener, context);
  }

  /**
   * 增加Socket事件監聽者
   * @param evt
   * @param listener
   * @param context
   */
  public addSocketEventListener(
    evt: string,
    listener: Function,
    context?: Object
  ) {
    this.addEventListener(evt + '_socket', listener, context);
  }

  /**
   * 移除事件監聽者
   * @param evt
   * @param listener
   * @param context
   */
  public removeEventListener(
    evt: string,
    listener: Function,
    context?: Object
  ) {
    const signal: Signal = this.signalList[evt];
    if (!signal) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] removeEventListener: ${evt} is null`
      );
      return;
    }

    if (signal.has(listener, context)) signal.remove(listener, context);
  }

  /**
   * 移除Socket事件監聽者
   * @param evt
   * @param listener
   * @param context
   */
  public removeSocketEventListener(
    evt: string,
    listener: Function,
    context?: Object
  ) {
    this.removeEventListener(evt + '_socket', listener, context);
  }

  /**
   * 註冊網路命令
   */
  protected abstract registerNetworkCommand();

  /**
   * 註冊Socket網路命令
   */
  protected abstract registerSocketNetworkCommand();

  /**
   * 傳送命令和命令內容 以及是否有對應命令的Callback
   * @param cmdName
   * @param cmdData
   * @param isRetry 是否啟用重送機制, 預設: false (須與checkRetry配合使用)
   */
  protected sendCmd(cmdName: string, cmdData?: JSON, isRetry = false) {
    if (!this.arkClient) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] sendCmd ${cmdName}: arkClient is null`
      );
      return;
    }
    console.log(
      `%c[BaseArkSystem]%c[${this.systemName}]%c sendCmd %c${cmdName}`,
      'background:darkblue',
      'color:orange',
      'color:cyan',
      'color:orange',
      cmdData
    );

    const callback: Function = this.baseHttpSystem.cmdDict[cmdName];
    //紀錄重送內容
    if (isRetry) this.recordRetryCommand(cmdName, cmdData);
    //發送命令
    this.arkClient.sendCmd(this.systemName, cmdName, cmdData, callback);
  }

  /**
   * 傳送命令和命令內容 以及是否有對應命令的Callback
   * @param cmdName
   * @param cmdData
   * @param isReturn 是否有回應封包
   */
  protected sendSocketCmd(cmdName: string, cmdData?: JSON, isReturn?: Boolean) {
    if (!this.arkSocketClient) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] sendSocketCmd ${cmdName}: arkSocketClient is null`
      );
      return;
    }
    console.log(
      `%c[BaseArkSystem]%c[${this.systemName}]%c sendSocketCmd %c${cmdName}`,
      'background:darkblue',
      'color:orange',
      'color:cyan',
      'color:orange',
      cmdData
    );

    let callback = null;
    if (isReturn) callback = this.baseSocketSystem.cmdDict[cmdName];
    this.arkSocketClient.sendCmd(this.systemName, cmdName, cmdData, callback);
  }

  /**
   * 傳送命令和命令內容 以及是否有對應命令的Callback
   * @param cmdName
   * @param cmdData
   * @param isRetry 是否啟用重送機制, 預設: false (須與checkRetry配合使用)
   */
  protected sendDrtCmd(cmdName: string, cmdData?: JSON) {
    if (!this.arkClient) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] sendCmd ${cmdName}: arkClient is null`
      );
      return;
    }
    console.log(
      `%c[BaseArkSystem]%c[${this.systemName}]%c sendCmd %c${cmdName}`,
      'background:darkblue',
      'color:orange',
      'color:cyan',
      'color:orange',
      cmdData
    );

    const callback: Function = this.baseHttpSystem.cmdDict[cmdName];
    // //紀錄重送內容
    // if (isRetry)
    //     this.recordRetryCommand(cmdName, cmdData);
    //發送命令
    this.arkClient.sendDrtCmd(this.systemName, cmdName, cmdData, callback);
  }

  /**
   * 註冊命令的Callback
   * @param cmdName
   * @param callback 回傳參數為http或socket內容
   */
  protected registerCmdCallback(
    cmdName: string,
    callback: (
      result: number,
      cmdData: ReturnCommandData,
      processTimeMs?: number
    ) => void
  ) {
    if (!this.baseHttpSystem) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] registerCmdCallback ${cmdName}: baseHttpSystem is null`
      );
      return;
    }

    this.baseHttpSystem.cmdDict[cmdName] = callback.bind(this);
  }

  /**
   * 註冊Socket命令的Callback
   * @param cmdName
   * @param callback 回傳參數為http或socket內容
   */
  protected registerSocketCmdCallback(
    cmdName: string,
    callback: (
      result: number,
      data: JSON,
      ret: string,
      sn: number,
      sys: string,
      cmd: string,
      processTimeMs?: number
    ) => void
  ) {
    if (!this.baseSocketSystem) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] registerSocketCmdCallback ${cmdName}: baseSocketSystem is null`
      );
      return;
    }

    this.baseSocketSystem.cmdDict[cmdName] = callback.bind(this);
  }

  /**
   * 觸發事件 (提供Http命令Callback的對外接口)
   * @param evt
   * @param params
   */
  protected dispatchEvent(evt: string, ...params) {
    const signal: Signal = this.signalList[evt];
    if (!signal) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] dispatchEvent: ${evt} is null. Please check add event listener before Receive Cmd.`
      );
      return;
    }

    signal.dispatch(...params);
  }

  /**
   * 觸發事件 (提供Socket命令Callback的對外接口)
   * @param evt
   * @param params
   */
  protected dispatchSocketEvent(evt: string, ...params: Array<any>) {
    this.dispatchEvent(evt + '_socket', ...params);
  }

  /**
   * Http重送機制確認
   * 驗證內容是否須進行重送流程
   * 須與sendCmd配合使用
   * 回傳值若為true則為已進入重送流程
   * @param cmdName
   * @param result
   * @param cmdData
   */
  protected checkRetry(
    cmdName: string,
    result,
    cmdData: ReturnCommandData
  ): boolean {
    if (!this.baseHttpSystem) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] checkRetry: baseHttpSystem is null`
      );
      return false;
    }
    if (!this.baseHttpSystem.cmdDict[cmdName]) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] checkRetry: baseHttpSystem.cmdDict[${cmdName}] is null`
      );
      return false;
    }
    if (!cmdData) {
      console.warn(
        `[BaseArkSystem][${this.systemName}] checkRetry(${cmdName}): return cmdData is null`
      );
      return false;
    }
    //封包重送
    if (result === HttpConnect.HttpResult.Error) {
      const retryCmdContent: RetryCommandContent =
        this.retryCmdDict[cmdData.cmd_sn];
      if (retryCmdContent !== null && retryCmdContent !== undefined) {
        if (retryCmdContent.RetryTimes < this.maxRetryTimes) {
          //延遲秒數重送
          getCanvas()
            .getComponent(Canvas)
            .scheduleOnce(() => {
              this.resendCommand(cmdData.cmd_sn);
            }, this.retryDelayTime);
          return true;
        } else {
          console.log(
            `[BaseArkSystem][${this.systemName}] checkRetry: MaxRetry(${cmdName})(${this.maxRetryTimes})`
          );
          return false;
        }
      }
    }
    return false;
  }

  /**
   * 記錄重送命令內容
   * 於需要進行重送的命令進行首次記錄
   * 回傳值: 記錄當下預先取得的CommandSN
   * @param cmdName
   * @param cmdData
   */
  private recordRetryCommand(cmdName: string, cmdData: JSON): string {
    const cmdKey: string = this.CommandSN;
    //已存在則忽略
    if (this.retryCmdDict[cmdKey] !== null) return '';
    //記錄重送命令名稱、內容、次數
    this.retryCmdDict[cmdKey] = {
      CommandName: cmdName,
      CommandData: cmdData,
      RetryTimes: 0,
    };

    return cmdKey;
  }

  /**
   * 更新重送命令內容的重送計數器
   * 命令須重送時, 更新命令紀錄至預先取得的sn, 並增加重送次數
   * 回傳值: 更新當下預先取得的CommandSN
   * @param commandSN
   */
  private updateRetryCommandCounter(commandSN: string): string {
    const oldCmdKey: string = commandSN;
    const cmdKey: string = this.CommandSN;
    //已存在則忽略
    if (this.retryCmdDict[cmdKey] !== null) return '';
    //紀錄轉移、記錄重送次數
    const oldRetryCmdContent: RetryCommandContent =
      this.retryCmdDict[oldCmdKey];
    this.retryCmdDict[cmdKey] = {
      CommandName: oldRetryCmdContent.CommandName,
      CommandData: oldRetryCmdContent.CommandData,
      RetryTimes: oldRetryCmdContent.RetryTimes + 1,
    };
    //清除舊紀錄
    this.retryCmdDict[oldCmdKey] = null;
    delete this.retryCmdDict[oldCmdKey];

    return cmdKey;
  }

  /**
   * 重送命令
   * @param commandSN
   */
  protected resendCommand(commandSN: string) {
    if (!this.retryCmdDict[commandSN]) return;

    //更新紀錄
    const newCmdSN: string = this.updateRetryCommandCounter(commandSN);
    const retryCmdContent: RetryCommandContent = this.retryCmdDict[newCmdSN];

    console.log(
      `[BaseArkSystem][${this.systemName}] resendCommand ${retryCmdContent.CommandName}(${newCmdSN}): ${JSON.stringify(retryCmdContent.CommandData)}`
    );

    this.sendCmd(
      retryCmdContent.CommandName,
      retryCmdContent.CommandData,
      true
    );
  }

  /**
   * 取得CommandSN
   * - RetryCommand須預先取得sn作為下次Command發送後的sn進行比對使用
   * - 因仿ArkClient的get_sn預先取得下一筆sn
   * - 故須在send_cmd及send_drt_cmd前使用
   */
  private get CommandSN() {
    let sn: number = ArkClient.sn + 1;
    let nowSec: number = ArkClient.nowSecond;
    const sec: number = Math.floor(new Date().getTime() * 0.001);
    if (nowSec !== sec) {
      nowSec = sec;
      sn = 0;
    }
    return (nowSec * 1000 + sn).toString();
  }
}

/** Http Command 回傳資料格式 */
export interface ReturnCommandData {
  cmd_sn?: string;
  cmd_data?: {
    Code?: number;
    status?: {
      //API
      id?: number;
      msg?: string;
    };
    data?: JSON;
    Data?: JSON | any;
    ts?: number; //Macross
  };
}

/** 重送命令記錄內容 */
export interface RetryCommandContent {
  CommandName: string;
  CommandData: JSON;
  RetryTimes: number;
}
