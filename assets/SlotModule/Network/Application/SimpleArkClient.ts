import ArkClient from '../../../CommonModule/Script/Network/ArkSDK/ArkClient';
import HttpConnect from '../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';

export default class SimpleArkClient extends ArkClient {
  public async sendCmd(
    cmdId: string,
    cmdName: string,
    cmdData?: JSON,
    callback?,
    sn?: string,
    extraData?: JSON,
    cmdTimeout?: number
  ) {
    cmdData = cmdData || <JSON>{};
    callback =
      callback ||
      function (_status: number, _ark_data: JSON, _process_time_ms: number) {};
    sn = sn || ArkClient.getSn();

    const startTime: number = new Date().getTime();

    const jsonObj = {
      ark_id: this.arkId,
      ark_token: this.arkToken,
      cmd_id: cmdId,
      cmd_name: cmdName,
      cmd_data: cmdData,
      cmd_sn: sn,
    };
    if (extraData) {
      jsonObj['extra'] = extraData;
    }

    //SimpleServer不做加密處理
    const sendJson = JSON.stringify(jsonObj);
    if (!sendJson) {
      return null;
    }

    let resp = null;
    try {
      const _timeout: number = !cmdTimeout
        ? this._cmdTimeout
        : cmdTimeout * 1000;
      resp = await HttpConnect.doPost(
        this.gameUrl + '/command',
        sendJson,
        null,
        _timeout
      );
    } catch (error) {
      resp = error;
    }

    const timeElapsed = new Date().getTime() - startTime;

    if (resp.result !== HttpConnect.HttpResult.OK) {
      callback(resp.result, resp, timeElapsed);
      return null;
    }

    //SimpleServer不做解密處理
    const resultData = JSON.parse(resp.text);
    console.log(
      `%c[ArkClient]%c[${cmdId}]%c receive_cmd %c${cmdName}`,
      'background:darkgreen',
      'color:orange',
      'color:cyan',
      'color:orange',
      resultData
    );
    if (!resultData)
      callback(HttpConnect.HttpResult.Error, resultData, timeElapsed);
    else callback(HttpConnect.HttpResult.OK, resultData, timeElapsed);
    return resultData;
  }

  public async send_drt_cmd(
    cmdId: string,
    cmdName: string,
    cmdData?: JSON,
    callback?,
    sn?: string,
    extraData?: JSON,
    cmdTimeout?: number
  ) {
    cmdData = cmdData || <JSON>{};
    callback = callback || function (_status, _ark_data) {};
    sn = sn || ArkClient.getSn();

    const jsonObj = {
      cmd_id: cmdId,
      cmd_name: cmdName,
      cmd_data: cmdData,
      cmd_sn: sn,
    };

    if (extraData) {
      jsonObj['extra'] = extraData;
    }

    //SimpleServer不做加密處理
    const sendJson = JSON.stringify(jsonObj);
    if (!sendJson) {
      return null;
    }

    let resp: any = null;
    try {
      const _timeout: number = !cmdTimeout
        ? this._cmdTimeout
        : cmdTimeout * 1000;
      resp = await HttpConnect.doPost(
        this.gameUrl + '/drtcmd',
        sendJson,
        null,
        _timeout
      );
    } catch (error) {
      resp = error;
    }

    if (resp.result !== HttpConnect.HttpResult.OK) {
      callback(resp.result, resp);
      return null;
    }

    //SimpleServer不做解密處理
    const resultData = JSON.parse(resp.text);
    console.log(`[ArkClient][${cmdId}] receive_drt_cmd ${cmdName}`, resultData);
    if (!resultData) callback(HttpConnect.HttpResult.Error, resultData);
    else callback(HttpConnect.HttpResult.OK, resultData);
    return resultData;
  }
}
