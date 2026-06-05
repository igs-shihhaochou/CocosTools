/* eslint-disable camelcase */

import {GameCommonEventLogID} from '../../Log/BQLog/BQLogDefine';
import BQLogger from '../../Log/BQLog/BQLogger';
import {Coder} from './Utitlity/Coder';
import httpConnect from './Utitlity/HttpConnect';

export default class ArkClient {
  //#region public
  public static sn = 0;
  public static nowSecond = 0;

  public set arkKey(key: string) {
    this._arkKey = key;
  }
  public get arkKey(): string {
    return this._arkKey;
  }
  public set arkId(id: string) {
    this._arkId = id;
  }
  public get arkId(): string {
    return this._arkId;
  }
  public set arkToken(token: string) {
    this._arkToken = token;
  }
  public get arkToken(): string {
    return this._arkToken;
  }
  public get gameUrl(): string {
    return this._gameUrl;
  }

  //#endregion public

  //properties
  protected _gameUrl = '';
  protected _fromType = '';
  protected _fromId = '';
  protected _fromToken = '';
  protected _autoId = '';
  protected _inviteCode = '';
  protected _arkId = '';
  protected _arkToken = '';
  protected _arkKey = '';
  protected _cmdTimeout = 0;

  constructor(gameUrl: string, cmdTimeout = 15) {
    this._gameUrl = gameUrl;
    this._cmdTimeout = cmdTimeout * 1000;
  }

  public clone(baseArkClient: ArkClient, data?) {
    this._fromType = baseArkClient._fromType || data?.from_type;
    this._fromId = baseArkClient._fromId || data?.from_id;
    this._fromToken = baseArkClient._fromToken || data?.from_token;
    this._autoId = baseArkClient._autoId || data?.auto_id;
    this._inviteCode = baseArkClient._inviteCode || data?.invite_code;
    this._arkId = baseArkClient._arkId || data?.ark_id;
    this._arkToken = baseArkClient._arkToken || data?.ark_token;
    this._arkKey = baseArkClient._arkKey || data?.ark_key;
  }

  public static getSn() {
    ArkClient.sn += 1;
    const seconds: number = Math.floor(new Date().getTime() * 0.001);
    if (ArkClient.nowSecond !== seconds) {
      ArkClient.nowSecond = seconds;
      ArkClient.sn = 0;
    }
    return (ArkClient.nowSecond * 1000 + ArkClient.sn).toString();
  }

  public async encodeData(request, callback = null) {
    callback = callback || function () {};
    if (!this._arkKey) {
      const resp = await this._getKey(callback);
      if (resp.result !== httpConnect.HttpResult.OK) {
        return '';
      }
    }
    if (!this._arkKey) {
      console.error('encodeData need arkKey(' + this._arkKey + ')');
      callback(httpConnect.HttpResult.Condition, '');
      return '';
    }

    const formData: string = JSON.stringify(request);
    const arkData: string = Coder.base64Encode(formData);
    const arkSign: string = Coder.hmacSha1(this._arkKey, arkData);
    const arkForm = {
      ark_sign: arkSign,
      ark_data: arkData,
    };
    const body: string = Coder.base64Encode(JSON.stringify(arkForm));
    return body;
  }

  public decodeData(response: string) {
    if (response === null || response.length === 0) return null;
    return JSON.parse(Coder.decode(response));
  }

  public async sendCmd(
    cmdId: string,
    cmdName: string,
    cmdData?: Object,
    callback?,
    sn?: string,
    extraData?: Object,
    cmdTimeout?: number
  ) {
    cmdData = cmdData || <JSON>{};
    callback = callback || function () {};
    sn = sn || ArkClient.getSn();

    const startTime: number = new Date().getTime();
    //@ts-expect-error // window.platform 是外部js套件
    cmdData['device'] = cmdData['device'] ?? window.platform?.os?.family;
    const jsonObj = {
      ark_id: this._arkId,
      ark_token: this._arkToken,
      cmd_id: cmdId,
      cmd_name: cmdName,
      cmd_data: cmdData,
      cmd_sn: sn,
    };
    if (extraData) {
      jsonObj['extra'] = extraData;
    }

    const sendJson = await this.encodeData(jsonObj, callback);
    if (!sendJson) {
      return null;
    }

    let resp = null;
    try {
      const timeout: number = !cmdTimeout
        ? this._cmdTimeout
        : cmdTimeout * 1000;
      resp = await httpConnect.doPost(
        this._gameUrl + '/command',
        sendJson,
        null,
        timeout
      );
    } catch (error) {
      resp = error;
    }

    const processTimeMs = new Date().getTime() - startTime;

    if (resp.result !== httpConnect.HttpResult.OK) {
      callback(resp.result, resp, processTimeMs);
      return null;
    }

    const resultData = this.decodeData(resp.text);
    console.log(
      `%c[ArkClient]%c[${cmdId}]%c receive_cmd %c${cmdName}`,
      'background:darkgreen',
      'color:orange',
      'color:cyan',
      'color:orange',
      resultData
    );
    if (!resultData)
      callback(httpConnect.HttpResult.Error, resultData, processTimeMs);
    else callback(httpConnect.HttpResult.OK, resultData, processTimeMs);
    return resultData;
  }

  public async sendDrtCmd(
    cmdId: string,
    cmdName: string,
    cmdData?: JSON,
    callback?,
    sn?: string,
    extraData?: JSON,
    cmdTimeout?: number
  ) {
    cmdData = cmdData || <JSON>{};
    callback = callback || function () {};
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

    const sendJson = await this.encodeData(jsonObj, callback);
    if (!sendJson) {
      return null;
    }

    let resp = null;
    try {
      const timeout: number = !cmdTimeout
        ? this._cmdTimeout
        : cmdTimeout * 1000;
      resp = await httpConnect.doPost(
        this._gameUrl + '/drtcmd',
        sendJson,
        null,
        timeout
      );
    } catch (error) {
      resp = error;
    }

    if (resp.result !== httpConnect.HttpResult.OK) {
      callback(resp.result, resp);
      return null;
    }

    const resultData = this.decodeData(resp.text);
    console.log(`[ArkClient][${cmdId}] receive_drt_cmd ${cmdName}`, resultData);
    if (!resultData) callback(httpConnect.HttpResult.Error, resultData);
    else callback(httpConnect.HttpResult.OK, resultData);
    return resultData;
  }

  /**
   *  裝置登入
   */
  public async deviceLogin(
    fromType: string,
    callback: (result, data) => void | null,
    loginExtraData = null,
    authExtraData = null
  ) {
    let uuid: string = localStorage.getItem('uuid');
    if (uuid === null || uuid.length === 0) {
      await this.getUuid((result, data) => {
        if (result === httpConnect.HttpResult.OK) {
          console.log('[ArkClient] DeviceLogin uuid:', data);
          localStorage.setItem('uuid', data);
          uuid = data;
        } else
          console.error(
            '[ArkClient] DeviceLogin Get uuid fail:(' +
              result +
              ')' +
              JSON.stringify(data)
          );
      });
    }

    if (uuid !== null && uuid.length > 0) {
      this.deviceLoginInternal(
        fromType,
        uuid,
        callback,
        loginExtraData,
        authExtraData
      );
    }
  }

  public async getUuid(callback = null) {
    return await this.sendDrtCmd('uuid', 'getid', <JSON>{}, callback);
  }

  public async deviceLoginInternal(
    fromType,
    fromId,
    callback = null,
    loginExtraData = null,
    authExtraData = null,
    sn = null
  ) {
    callback = callback || function () {};
    const fromToken = await this._deviceToken(fromId, callback);
    if (!fromToken) {
      return {};
    }

    let resultData = await this._login(
      fromType,
      fromId,
      fromToken,
      callback,
      loginExtraData,
      sn
    );
    BQLogger.SendEventLogById(GameCommonEventLogID.ARK_LOGIN);
    if (!resultData) {
      return resultData;
    }

    resultData = await this._auth(
      resultData['auto_id'],
      resultData['invite_code'],
      callback,
      authExtraData,
      sn
    );

    BQLogger.SendEventLogById(GameCommonEventLogID.LOGIN_AUTH);
    return resultData;
  }

  /**
   * Ark連接
   * @param fromId
   * @param fromToken
   * @param callback
   */
  public async arkPass(
    fromId: string,
    fromToken: string,
    callback: (result, data) => void | null
  ) {
    this._arkId = fromId;
    this._arkToken = fromToken;

    const resp = await this._getKey(callback);
    if (resp.result !== httpConnect.HttpResult.OK) {
      return '';
    }

    callback(resp.result, '');
    return '';
  }

  /**
   *  自定義登入
   */
  public async customLogin(
    fromType: string,
    fromId: string,
    fromToken: string,
    callback: (result, data) => void | null,
    loginExtraData = null,
    authExtraData = null,
    sn = null
  ) {
    callback = callback || function () {};
    if (!fromToken) {
      return {};
    }

    let resultData = await this._login(
      fromType,
      fromId,
      fromToken,
      callback,
      loginExtraData,
      sn
    );
    BQLogger.SendEventLogById(GameCommonEventLogID.ARK_LOGIN);
    if (!resultData) {
      return resultData;
    }

    resultData = await this._auth(
      this._autoId,
      this._inviteCode,
      callback,
      authExtraData,
      sn
    );

    BQLogger.SendEventLogById(GameCommonEventLogID.LOGIN_AUTH);
    if (resultData) {
      sessionStorage.setItem('auth_auto_id', this._autoId);
      sessionStorage.setItem('auth_invite_code', this._inviteCode);
    }

    return resultData;
  }

  public async auth_without_login(
    callback: (result, data) => void | null,
    auth_extra_data = null,
    sn = null
  ) {
    const autoId = sessionStorage.getItem('auth_auto_id');
    const inviteCode = sessionStorage.getItem('auth_invite_code');

    if (!autoId || !inviteCode) {
      if (callback) callback(-1, null);
      return {};
    }

    const resultData = await this._auth(
      autoId,
      inviteCode,
      callback,
      auth_extra_data,
      sn
    );
    BQLogger.SendEventLogById(GameCommonEventLogID.REFRESH_LOGIN_AUTH);
    return resultData;
  }

  private async _getKey(callback) {
    callback = callback || function () {};
    let resp = null;
    try {
      resp = await httpConnect.doGet(
        this._gameUrl,
        null,
        null,
        this._cmdTimeout
      );
      this._arkKey = resp.text;
    } catch (error) {
      resp = error;
      callback(resp.result, resp);
    }
    return resp;
  }

  private async _login(
    fromType,
    fromId,
    fromToken,
    callback,
    extraData = null,
    sn = null
  ) {
    callback = callback || function () {};
    sn = sn || ArkClient.getSn();
    ///////////
    // Login //
    ///////////
    const loginObj = {
      from_type: fromType,
      from_id: fromId,
      from_token: fromToken,
      ark_sn: sn,
    };
    if (extraData) loginObj['extra_data'] = extraData;

    let resp = null;
    const sendJson = await this.encodeData(loginObj, callback);

    if (!sendJson) {
      return null;
    }
    resp = null;
    try {
      resp = await httpConnect.doPost(
        this._gameUrl + '/login',
        sendJson,
        null,
        this._cmdTimeout
      );
    } catch (error) {
      resp = error;
    }

    if (resp.result !== httpConnect.HttpResult.OK) {
      callback(resp.result, resp);
      return null;
    }

    const resultData = this.decodeData(resp.text);

    this._autoId = resultData['auto_id'] || '';
    this._inviteCode = resultData['invite_code'] || '';
    this._fromType = fromType;
    this._fromId = fromId;
    this._fromToken = fromToken;

    //判斷登入是否成功
    if (!resultData || !this._autoId || !this._inviteCode) {
      callback(httpConnect.HttpResult.Condition, resp);
      return null;
    }
    return resultData;
  }

  private async _auth(
    autoId,
    inviteCode,
    callback,
    extraData = null,
    sn = null
  ) {
    callback = callback || function () {};
    sn = sn || ArkClient.getSn();
    //////////
    // Auth //
    //////////
    const authObj = {
      auto_id: autoId,
      invite_code: inviteCode,
      ark_sn: sn,
    };
    if (extraData) authObj['extra_data'] = extraData;

    const sendJson = await this.encodeData(authObj, callback);
    if (!sendJson) {
      return null;
    }

    let resp = null;
    try {
      resp = await httpConnect.doPost(
        this._gameUrl + '/auth',
        sendJson,
        null,
        this._cmdTimeout
      );
    } catch (error) {
      resp = error;
    }

    if (resp.result !== httpConnect.HttpResult.OK) {
      callback(resp.result, null);
      return null;
    }

    const resultData = this.decodeData(resp.text);
    //console.log("[Auth]resultData: " + JSON.stringify(resultData));

    this._arkId = resultData['ark_id'] || '';
    this._arkToken = resultData['ark_token'] || '';

    //判斷驗證是否成功
    if (!resultData || !this._arkId || !this._arkToken) {
      callback(httpConnect.HttpResult.Condition, resp);
      return null;
    }

    callback(httpConnect.HttpResult.OK, resultData);
    return resultData;
  }

  private async _deviceToken(fromId, callback = null) {
    callback = callback || function () {};
    if (!this._arkKey) {
      const resp = await this._getKey(callback);
      if (resp.result !== httpConnect.HttpResult.OK) {
        return '';
      }
    }
    if (!this._arkKey) {
      console.error(
        '[ArkClient] _deviceToken need arkKey(' + this._arkKey + ')'
      );
      callback(httpConnect.HttpResult.Condition, '');
      return '';
    }
    return Coder.hmacSha1(this._arkKey, Coder.base64Encode(fromId));
  }
}
