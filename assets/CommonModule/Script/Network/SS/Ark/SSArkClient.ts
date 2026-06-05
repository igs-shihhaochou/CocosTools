import {Coder} from '../../ArkSDK/Utitlity/Coder';
import {LogoMode} from '../Network/SSConst';
import {HttpConnect} from './HttpConnect';

export class ArkClient {
  //properties
  protected gameUrl = '';
  protected autoID = '';
  protected inviteCode = '';
  protected arkID = '';
  protected arkToken = '';
  protected arkKey = '';

  public static sn = 0;
  public static nowSecond = 0;
  public static allowState: any;

  public get GameUrl(): string {
    return this.gameUrl;
  }
  public get ArkKey(): string {
    return this.arkKey;
  }
  public get ArkID(): string {
    return this.arkID;
  }
  public get ArkToken(): string {
    return this.arkToken;
  }

  public fromType = '';
  public fromID = '';
  public fromToken = '';

  constructor(_gameUrl: string) {
    this.gameUrl = _gameUrl;
  }

  clone(base_ark_client: ArkClient) {
    this.fromType = base_ark_client.fromType || '';
    this.fromID = base_ark_client.fromID || '';
    this.fromToken = base_ark_client.fromToken || '';
    this.autoID = base_ark_client.autoID || '';
    this.inviteCode = base_ark_client.inviteCode || '';
    this.arkID = base_ark_client.arkID || '';
    this.arkToken = base_ark_client.arkToken || '';
    this.arkKey = base_ark_client.arkKey || '';
  }

  public static get_sn() {
    ArkClient.sn += 1;
    const seconds: number = Math.floor(new Date().getTime() * 0.001);
    if (ArkClient.nowSecond !== seconds) {
      ArkClient.nowSecond = seconds;
      ArkClient.sn = 0;
    }
    return (ArkClient.nowSecond * 1000 + ArkClient.sn).toString();
  }

  public async encodeData(request: JSON, callback = null, cmdName = null) {
    callback = callback || function (_status, _ark_data) {};
    if (!this.arkKey) {
      const resp = await this._getKey(callback, cmdName);
      if (resp.result !== HttpConnect.HttpResult.OK) {
        return '';
      }
    }
    if (!this.arkKey) {
      console.error('encodeData need arkKey(' + this.arkKey + ')');
      callback(HttpConnect.HttpResult.Condition, '', cmdName);
      return '';
    }

    const form_data: string = JSON.stringify(request);
    const ark_data: string = Coder.base64Encode(form_data);
    const ark_sign: string = Coder.hmacSha1(this.arkKey, ark_data);
    const ark_form: any = {
      ark_sign: ark_sign,
      ark_data: ark_data,
    };
    const body: string = Coder.base64Encode(JSON.stringify(ark_form));
    return body;
  }

  public decodeData(response: string) {
    const decode = Coder.decode(response);
    if (decode === '') return null;
    else return JSON.parse(decode);
  }

  private async _getKey(callback, cmdName = null) {
    callback = callback || function (_status, _ark_data) {};
    let resp: any = null;
    try {
      resp = await HttpConnect.do_get(this.gameUrl);
      this.arkKey = resp.text;
    } catch (error) {
      resp = error;
      callback(resp.result, resp, cmdName);
    }
    return resp;
  }

  public async _login(
    from_type,
    fromID,
    from_token,
    callback,
    extra_data = null,
    sn = null
  ) {
    callback = callback || function (_status, _ark_data) {};
    sn = sn || ArkClient.get_sn();

    ///////////
    // Login //
    ///////////
    const login_obj: any = {
      from_type: from_type,
      from_id: fromID,
      from_token: from_token,
      ark_sn: sn,
    };
    if (extra_data) login_obj['extra_data'] = extra_data;

    let resp = null;
    const send_json = await this.encodeData(login_obj, callback);

    if (!send_json) {
      return null;
    }
    resp = null;
    console.log('send _login', this.gameUrl + '/login', login_obj);
    try {
      resp = await HttpConnect.do_post(this.gameUrl + '/login', send_json);
    } catch (error) {
      resp = error;
    }

    if (resp.result !== HttpConnect.HttpResult.OK) {
      callback(resp.result, resp);
      return null;
    }

    const resultData = this.decodeData(resp.text);
    console.log('recv _login', JSON.stringify(resultData));
    this.autoID = resultData['auto_id'] || '';
    this.inviteCode = resultData['invite_code'] || '';

    //判斷登入是否成功
    if (!this.autoID || !this.inviteCode) {
      callback(HttpConnect.HttpResult.Condition, resp);
      return null;
    }
    return resultData;
  }

  public async _auth(
    autoID,
    inviteCode,
    callback,
    extra_data = null,
    sn = null
  ) {
    callback = callback || function (_status, _ark_data) {};
    sn = sn || ArkClient.get_sn();
    //////////
    // Auth //
    //////////
    const auth_obj: any = {
      auto_id: autoID,
      invite_code: inviteCode,
      ark_sn: sn,
    };
    if (extra_data) auth_obj['extra_data'] = extra_data;

    const send_json = await this.encodeData(auth_obj, callback);
    if (!send_json) {
      return null;
    }
    console.log('send _auth', this.gameUrl + '/auth', JSON.stringify(auth_obj));
    let resp = null;
    try {
      resp = await HttpConnect.do_post(this.gameUrl + '/auth', send_json);
    } catch (error) {
      resp = error;
    }

    if (resp.result !== HttpConnect.HttpResult.OK) {
      callback(resp.result, null);
      return null;
    }

    const resultData = this.decodeData(resp.text);
    //console.log("[Auth]resultData: " + JSON.stringify(resultData))
    console.log('recv _auth', JSON.stringify(resultData));
    this.arkID = resultData['ark_id'] || '';
    this.arkToken = resultData['ark_token'] || '';

    //判斷驗證是否成功
    if (!this.arkID || !this.arkToken) {
      callback(HttpConnect.HttpResult.Condition, resp);
      return null;
    }

    callback(HttpConnect.HttpResult.OK, resultData);
    return resultData;
  }

  public async send_cmd(
    cmd_id: string,
    cmd_name: string,
    cmd_data?: JSON,
    callback?,
    timeout = 15000,
    sn?: string,
    extra_data?: JSON
  ) {
    cmd_data = cmd_data || <JSON>{};
    callback =
      callback ||
      function (_status: number, _ark_data: JSON, _process_time_ms: number) {};
    sn = sn || ArkClient.get_sn();

    const start_time: number = new Date().getTime();

    cmd_data['device'] = 1;

    if (ArkClient.allowState) cmd_data['allow_state'] = ArkClient.allowState;

    try {
      //@ts-ignore
      cmd_data['mode'] = LogoMode;
    } catch (e) {
      callback(HttpConnect.HttpResult.Condition, '', cmd_name);
      return null;
    }

    const json_obj: any = {
      ark_id: this.arkID,
      ark_token: this.arkToken,
      cmd_id: cmd_id,
      cmd_name: cmd_name,
      cmd_data: cmd_data,
      cmd_sn: sn,
    };
    if (extra_data) {
      json_obj['extra'] = extra_data;
    }
    console.warn(JSON.stringify(json_obj));

    const send_json = await this.encodeData(json_obj, callback);
    if (!send_json) {
      console.error('send_json error : ' + send_json);
      return null;
    }

    let resp = null;
    try {
      resp = await HttpConnect.do_post(
        this.gameUrl + '/command',
        send_json,
        timeout
      );
    } catch (error) {
      resp = error;
    }

    const process_time_ms = new Date().getTime() - start_time;

    if (resp.result !== HttpConnect.HttpResult.OK) {
      callback(resp.result, resp, cmd_name, process_time_ms);
      return null;
    }

    const resultData = this.decodeData(resp.text);
    callback(HttpConnect.HttpResult.OK, resultData, cmd_name, process_time_ms);
    return resultData;
  }

  public async send_drt_cmd(
    cmd_id: string,
    cmd_name: string,
    cmd_data?: JSON,
    callback?,
    sn?: string,
    extra_data?: JSON
  ) {
    cmd_data = cmd_data || <JSON>{};
    callback = callback || function (_status, _ark_data) {};
    sn = sn || ArkClient.get_sn();

    const json_obj: any = {
      cmd_id: cmd_id,
      cmd_name: cmd_name,
      cmd_data: cmd_data,
      cmd_sn: sn,
    };

    if (extra_data) {
      json_obj['extra'] = extra_data;
    }
    console.warn(JSON.stringify(json_obj));
    const send_json = await this.encodeData(json_obj, callback);
    if (!send_json) {
      return null;
    }

    let resp: any = null;
    try {
      resp = await HttpConnect.do_post(this.gameUrl + '/drtcmd', send_json);
    } catch (error) {
      resp = error;
    }

    if (resp.result !== HttpConnect.HttpResult.OK) {
      callback(resp.result, resp);
      return null;
    }

    const resultData = this.decodeData(resp.text);
    callback(HttpConnect.HttpResult.OK, resultData);
    return resultData;
  }

  //////////裝置登入
  public DeviceLogin(
    from_type: string,
    callback: (result, data) => void | null,
    login_extra_data = null,
    auth_extra_data = null
  ) {
    let uuid: string = localStorage.getItem('uuid');
    if (uuid == null || uuid.length === 0) {
      this.get_uuid((result, data) => {
        if (result === HttpConnect.HttpResult.OK) {
          console.log('uuid: ' + data);
          localStorage.setItem('uuid', data);
          uuid = data;
        } else
          console.error(
            'Get uuid fail:(' + result + ')' + JSON.stringify(data)
          );
      });
    }

    if (uuid != null && uuid.length > 0) {
      this.device_login(
        from_type,
        uuid,
        callback,
        login_extra_data,
        auth_extra_data
      );
    }
  }

  public async get_uuid(callback = null) {
    return await this.send_drt_cmd('uuid', 'getid', <JSON>{}, callback);
  }

  public async device_login(
    from_type,
    fromID,
    callback = null,
    login_extra_data = null,
    auth_extra_data = null,
    sn = null
  ) {
    callback = callback || function (_status, _ark_data) {};
    const from_token = await this._device_token(fromID, callback);
    if (!from_token) {
      return {};
    }

    let resultData = await this._login(
      from_type,
      fromID,
      from_token,
      callback,
      login_extra_data,
      sn
    );
    if (!resultData) {
      return resultData;
    }

    resultData = await this._auth(
      resultData['auto_id'],
      resultData['invite_code'],
      callback,
      auth_extra_data,
      sn
    );

    return resultData;
  }

  private async _device_token(from_id, callback = null) {
    callback = callback || function (_status, _ark_data) {};
    if (!this.arkKey) {
      const resp = await this._getKey(callback);
      if (resp.result !== HttpConnect.HttpResult.OK) {
        return '';
      }
    }
    if (!this.arkKey) {
      console.error('_device_token need arkKey(' + this.arkKey + ')');
      callback(HttpConnect.HttpResult.Condition, '');
      return '';
    }
    return Coder.hmacSha1(this.arkKey, Coder.base64Encode(from_id));
  }

  //////////自定義登入
  public async custom_login(
    from_type: string,
    from_id: string,
    from_token: string,
    callback: (result, data) => void | null,
    login_extra_data = null,
    auth_extra_data = null,
    sn = null
  ) {
    callback = callback || function (_status, _ark_data) {};
    if (!from_token) {
      return {};
    }

    let resultData = await this._login(
      from_type,
      from_id,
      from_token,
      callback,
      login_extra_data,
      sn
    );
    if (!resultData) {
      return resultData;
    }

    resultData = await this._auth(
      resultData['auto_id'],
      resultData['invite_code'],
      callback,
      auth_extra_data,
      sn
    );

    return resultData;
  }
}
