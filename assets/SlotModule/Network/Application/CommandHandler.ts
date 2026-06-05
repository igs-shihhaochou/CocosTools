import GAHandler from 'db://assets/CommonModule/Script/Log/GA/GAHandler';
import {PlatformData} from '../../../CommonModule/Script/Define/PlatformData';
import ArkClient from '../../../CommonModule/Script/Network/ArkSDK/ArkClient';
import HttpConnect from '../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import {Dictionary} from '../../../CommonModule/Script/Utility/Dictionary';
import BQLogger from 'db://assets/CommonModule/Script/Log/BQLog/BQLogger';

export class CommandContent {
  public commandID = '';
  public commandName = '';
  public serialNumber = 0;
  public data: JSON = null;
  public callback: Function = null;
  public retryIntervalArray: number[] = [];
  public timeoutID = null;
  public checkIntervalArray: number[] = [];
  public checkCommandName = '';
  public cmdSn = '';
  public startTime = 0;

  public shift(): void {
    const nextInterval = this.retryIntervalArray.shift();

    for (let i = 0; i < this.retryIntervalArray.length; ++i) {
      // 方便使用者以總時間進行控制，所以需要扣除下次等的時間
      this.retryIntervalArray[i] -= nextInterval;
      // 防呆
      if (this.retryIntervalArray[i] < 0) {
        this.retryIntervalArray[i] = 0;
      }
    }
  }

  public shiftCheck(): void {
    const nextInterval = this.checkIntervalArray.shift();

    for (let i = 0; i < this.checkIntervalArray.length; ++i) {
      // 方便使用者以總時間進行控制，所以需要扣除下次等的時間
      this.checkIntervalArray[i] -= nextInterval;
      // 防呆
      if (this.checkIntervalArray[i] < 0) {
        this.checkIntervalArray[i] = 0;
      }
    }
  }

  public clearTimeout(): void {
    clearTimeout(this.timeoutID);
    this.timeoutID = null;
  }
}

export default class CommandHandler {
  public static get instance(): CommandHandler {
    if (!this._instance) {
      this._instance = new CommandHandler();
    }

    return this._instance;
  }
  private static _instance: CommandHandler = null;

  public commandContent: Dictionary<string, CommandContent> = new Dictionary<
    string,
    CommandContent
  >();

  public sendCommand(sendData: CommandContent): void {
    console.warn('[CommandHandler] Send', sendData);
    this.commandContent.add(sendData.commandName, sendData);
    const sn = ArkClient.getSn();
    sendData.startTime = Date.now();
    PlatformData.instance.arkClient.sendCmd(
      sendData.commandID,
      sendData.commandName,
      sendData.data,
      this.onReceive.bind(this, sendData.commandName),
      sn
    );

    sendData.cmdSn = sn;
    sendData.serialNumber = parseInt(sn);
    // if (sendData.checkCommandName !== '') {
    //   this.setCheckTimeOut(sendData);
    // } else {
    this.setTimeout(sendData);
    // }
  }

  private sendCheck(sendData: CommandContent) {
    console.warn('[CommandHandler] Check', sendData);
    sendData.clearTimeout();
    PlatformData.instance.arkClient.sendCmd(
      sendData.commandID,
      sendData.checkCommandName,
      sendData.data,
      this.onReceive.bind(this, sendData.commandName),
      sendData.cmdSn
    );
    this.setCheckTimeOut(sendData);
  }

  private onReceive(cmdName, result, retData): void {
    const sendData: CommandContent = this.commandContent.getValue(cmdName);
    console.warn('[CommandHandler]onReceive ' + cmdName, result, retData);
    GAHandler.sendCmdResponesTime(
      PlatformData.gameName,
      sendData?.commandID,
      sendData?.commandName,
      Date.now() - sendData?.startTime
    );

    //**BQ埋點 計算封包時間 */
    BQLogger.sendCmdRespTime(
      sendData?.commandID,
      sendData?.commandName,
      Date.now() - sendData?.startTime
    );

    if (!retData) {
      //如果 retData為空 則不做任何處理直接呼叫callback
      sendData.callback(result, retData);
    } else if (sendData && sendData.retryIntervalArray.length > 0) {
      if (PlatformData.isDevServer) {
        this.receive(sendData, result, retData);
      } else {
        const sn = retData.cmd_sn;
        if (sendData.serialNumber.toString() === sn) {
          this.receive(sendData, result, retData);
        }
      }
    }
  }

  private setTimeout(sendData: CommandContent): void {
    sendData.clearTimeout();
    if (sendData.retryIntervalArray.length <= 0) {
      this.timeout(sendData);
    } else if (sendData.retryIntervalArray.length === 1) {
      sendData.timeoutID = setTimeout(() => {
        this.timeout(sendData);
      }, sendData.retryIntervalArray[0] * 1000);
    } else {
      sendData.timeoutID = setTimeout(() => {
        this.resend(sendData);
      }, sendData.retryIntervalArray[0] * 1000);
      sendData.shift();
    }
  }

  private setCheckTimeOut(sendData: CommandContent): void {
    sendData.clearTimeout();
    if (sendData.checkIntervalArray.length <= 0) {
      this.timeout(sendData);
    } else if (sendData.checkIntervalArray.length === 1) {
      sendData.timeoutID = setTimeout(() => {
        this.timeout(sendData);
      }, sendData.checkIntervalArray[0] * 1000);
    } else {
      sendData.timeoutID = setTimeout(() => {
        this.sendCheck(sendData);
      }, sendData.checkIntervalArray[0] * 1000);
      sendData.shiftCheck();
    }
  }

  private timeout(sendData: CommandContent): void {
    console.warn('[CommandHandler] Timeout', sendData.commandName);
    this.clear(sendData);
    const data = {msg: 'Command Handler Timeout'};
    sendData.callback(HttpConnect.HttpResult.Timeout, data);
  }

  private resend(sendData: CommandContent): void {
    console.warn('[CommandHandler] Resend', sendData);

    sendData.clearTimeout();
    PlatformData.instance.arkClient.sendCmd(
      sendData.commandID,
      sendData.commandName,
      sendData.data,
      this.onReceive.bind(this, sendData.commandName),
      sendData.serialNumber.toString()
    );
    this.setTimeout(sendData);
  }

  private async receive(sendData: CommandContent, result, retData) {
    console.warn('[CommandHandler] Receive', result, retData);

    if (!PlatformData.isDevServer) {
      /** server回傳"需等待"，不顯示popupMsg、資料也不能拿去用 */
      if (
        (retData.cmd_data?.hasOwnProperty('run_status') &&
          retData.cmd_data['run_status'] === 'WAIT') ||
        retData.cmd_data?.Code === -200047
      )
        return;
      /** GD 舊 Server 等待封包 Protocol */
      if (
        retData.cmd_data?.hasOwnProperty('result') &&
        retData.cmd_data['result'] === 2
      )
        return;
    }
    this.clear(sendData);
    sendData.callback(result, retData);
  }

  private clear(sendData: CommandContent): void {
    sendData.clearTimeout();
    this.commandContent.remove(sendData.commandName);
  }

  public destroy(): void {
    this.commandContent.clear();
  }
}
