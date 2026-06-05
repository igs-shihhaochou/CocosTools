import JSEncrypt from 'jsencrypt';
import {ArkClient} from '../Ark/SSArkClient';
import {ArkSocketClient, SocketResult} from '../Ark/SSArkSocketClient';
import {StateMachine} from './Common/StateMachine';
import {LogoMode} from './SSConst';
import {HttpResult} from '../Ark/HttpConnect';

export class LoginModel {
  private readonly ENCRYPT_KEY: string =
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC0l1BzizlBXTIs3X235yn5EfcNhbt3cgBZ + /peA2WBGh8HUKC2cWGOS3xtRtoPrco/NxNUJD1bhjIeWe0PCRQNYRW76DHhWylspBmgv45wFkTaTGLLZoXeK7BvajEXIrvs03RgGCboXI2CNB3aaOJXqpSPBJ6nbfF9QJYaYLiKkQIDAQAB';

  /**LoginModel的狀態機*/
  private m_state: StateMachine<enumState> = null;

  private m_pinClient: ArkClient = null;
  private m_pinResult: any = null;

  private m_kioskClient: ArkClient = null;
  private m_socketClient: ArkSocketClient = null;

  private m_tryAuthFailTimes = 0;

  private m_logoutSkillGameResult = 0;

  private static m_fBeginTime: number = Date.now();
  /**登入模組的Callback*/
  private m_callback = {
    login: {
      /**成功回傳(kioskClient: ArkClient, pinClient: ArkClient, socketClient: ArkSocketClient) => void*/
      success: null,
      /**失敗回傳(status: number, data: any,cmdName:string)*/
      fail: null,
    },
    logout: {
      /**成功回傳() => void*/
      success: null,
      /**失敗回傳(status: number, data: any,cmdName:string)*/
      fail: null,
    },

    /**當socket斷線時，回傳() => void*/
    onSokcetClose: null,
  };

  /**登入資訊*/
  public static LoginInfo = {
    user_id: null,
    login_version: null,
    user_pw_encrypt: null,
    device_id: null,
    kiosk_id: null,
    pin_id: null,
    machine_id: null,
    purchase_serial_id: 0,
    shutter_skill_fail_serial_id: 0,
    pin_ark_id: null,
    pin_ark_token: null,
    kiosk_ark_id: null,
    kiosk_ark_token: null,
    m_isDefaultPassword: false,
    device_uuid: null,
    code: null,
    logo: null,
    BrowserInfo: null,
    BrowserVersion: null,
    DeviceInfo: null,
    DeviceVersion: null,
    DeviceType: null,
    connect_network: null,
    Machine: null,
    OS: null,
    OSVersion: null,
    CPU: null,
    Mem: 0,
    Height: 0,
    Width: 0,
  };

  constructor(server_url: string) {
    //Create ark client
    this.m_kioskClient = new ArkClient(server_url);
    this.m_pinClient = new ArkClient(server_url);
    this.m_tryAuthFailTimes = 0;
    //listerner beforeunload
    window.addEventListener('beforeunload', this.CloseSocket.bind(this));

    //Setup state machine
    this.m_state = new StateMachine<enumState>();
    this.m_state.OnEntryAction.add(this.OnStateEntry, this);
  }

  public Clear() {
    window.removeEventListener('beforeunload', this.CloseSocket.bind(this));
  }

  private CloseSocket() {
    try {
      if (this.m_socketClient && this.m_socketClient.isConnect)
        this.m_socketClient.Close();
    } catch (ex) {
      console.warn(ex);
    }
  }
  /**
   * 執行登入動作
   * @param user_id 登入資訊 帳號
   * @param user_pw 登入資訊 密碼
   * @param successCallback 登入成功的Callback
   * @param failCallback 登入失敗的Callback
   */
  public DoLogin(
    user_id: string,
    user_pw: string,
    successCallback?: (
      kioskClient: ArkClient,
      pinClient: ArkClient,
      socketClient: ArkSocketClient
    ) => void,
    failCallback?: (status: number, data: any, cmdName) => void,
    onSocketClose?: () => void,
    deviceInfo: any = null,
    login_version = '',
    connectType = ''
  ) {
    LoginModel.LoginInfo.user_id = user_id;
    LoginModel.LoginInfo.login_version = login_version;
    LoginModel.LoginInfo.connect_network = connectType;

    // device info
    if (deviceInfo) {
      let men = '';
      //@ts-ignored
      men = navigator.deviceMemory;

      LoginModel.LoginInfo.BrowserInfo = deviceInfo.browser.name;
      LoginModel.LoginInfo.BrowserVersion = deviceInfo.browser.version;
      LoginModel.LoginInfo.DeviceInfo = deviceInfo.os.name;
      LoginModel.LoginInfo.DeviceVersion = deviceInfo.os.version;

      LoginModel.LoginInfo.Machine = deviceInfo.device.device;
      LoginModel.LoginInfo.OS = deviceInfo.os.name;
      LoginModel.LoginInfo.OSVersion = deviceInfo.os.version;
      LoginModel.LoginInfo.CPU = deviceInfo.cpu.architecture;
      LoginModel.LoginInfo.Mem = +men * 1024;
      LoginModel.LoginInfo.Height = screen.height;
      LoginModel.LoginInfo.Width = screen.width;

      if (
        deviceInfo.device.type === undefined ||
        deviceInfo.device.vendor === undefined ||
        deviceInfo.device.model === undefined
      ) {
        LoginModel.LoginInfo.DeviceType = deviceInfo.os.name;
      } else {
        LoginModel.LoginInfo.DeviceType =
          deviceInfo.device.type +
          '_' +
          deviceInfo.device.vendor +
          '_' +
          deviceInfo.device.model;
      }
    }

    const crypt = new JSEncrypt();
    crypt.setKey(this.ENCRYPT_KEY);
    LoginModel.LoginInfo.user_pw_encrypt = crypt.encrypt(user_pw);

    this.m_callback.login.success = successCallback;
    this.m_callback.login.fail = failCallback;
    this.m_callback.onSokcetClose = onSocketClose;

    const prefix = user_id.substr(0, 2);

    if (prefix === 'M-' || prefix === 'm-') {
      this.m_state.Transition(enumState.VerifyMobileByArkID);
    } else this.m_state.Transition(enumState.VerifyMobile);
  }

  /**
   * 未登入平台前之計時log
   */
  public sndCountBeforeLoadingTime() {
    const kiosk_id: string = LoginModel.LoginInfo.kiosk_id;

    const cmd_data: any = {
      begin_time: LoginModel.m_fBeginTime,
      machine: 'H5',
      kiosk_id: kiosk_id,
      machine_id: LoginModel.LoginInfo.machine_id,
      state: 1, //loading to login
      count_time: Date.now() - LoginModel.m_fBeginTime,
      kiosk_name: kiosk_id.toString(),
    };

    this.m_kioskClient.send_drt_cmd(
      'lobby',
      'countBeforeLoadingTime',
      cmd_data,
      this.rcvCountBeforeLoadingTimeAck.bind(this)
    );
  }

  public rcvCountBeforeLoadingTimeAck(result: number) {
    console.log('LoginModel.rcvCountBeforeLoadingTimeAck, result = ' + result);
  }

  /**
   * 執行 GUEST 登入動作
   * @param device_uuid aka guest id
   * @param code url code
   * @param logo logo (0,1,2)
   * @param successCallback 登入成功的Callback
   * @param failCallback 登入失敗的Callback
   */
  public DoGuestLogin(
    device_uuid: string,
    code: string,
    logo: number,
    successCallback?: (
      kioskClient: ArkClient,
      pinClient: ArkClient,
      socketClient: ArkSocketClient
    ) => void,
    failCallback?: (status: number, data: any, cmdName) => void,
    onSocketClose?: () => void,
    deviceInfo: any = null,
    login_version = '',
    connectType = ''
  ) {
    const crypt = new JSEncrypt();
    crypt.setKey(this.ENCRYPT_KEY);

    this.m_callback.login.success = successCallback;
    this.m_callback.login.fail = failCallback;
    this.m_callback.onSokcetClose = onSocketClose;

    LoginModel.LoginInfo.device_uuid = device_uuid;
    LoginModel.LoginInfo.code = code;
    LoginModel.LoginInfo.logo = logo;
    LoginModel.LoginInfo.user_id = ''; // 未使用資料 刷新
    LoginModel.LoginInfo.user_pw_encrypt = ''; // 未使用資料 刷新

    LoginModel.LoginInfo.login_version = login_version;
    LoginModel.LoginInfo.connect_network = connectType;

    // device info
    if (deviceInfo) {
      LoginModel.LoginInfo.BrowserInfo = deviceInfo.browser.name;
      LoginModel.LoginInfo.BrowserVersion = deviceInfo.browser.version;
      LoginModel.LoginInfo.DeviceInfo = deviceInfo.os.name;
      LoginModel.LoginInfo.DeviceVersion = deviceInfo.os.version;
      LoginModel.LoginInfo.DeviceType =
        deviceInfo.device.type +
        '_' +
        deviceInfo.device.vendor +
        '_' +
        deviceInfo.device.model;
    }
    this.m_state.Transition(enumState.VerifyGuest);
  }

  /**
   * 執行登出動作
   * */
  public DoLogout(
    successCallback?: Function,
    failCallback?: (status: number, data: any) => void,
    skillResult = 0
  ) {
    this.m_callback.logout.success = successCallback;
    this.m_callback.logout.fail = failCallback;
    this.m_logoutSkillGameResult = skillResult;
    this.m_state.Transition(enumState.PinLogout);
  }

  private OnVerifyMobile(status: number, data: any) {
    console.log('[LoginModel] OnVerifyMobile data: ', data);
    if (status === HttpResult.OK && data.result === 0) {
      LoginModel.LoginInfo.kiosk_id = data.data.kiosk_id;
      LoginModel.LoginInfo.device_id = data.data.device_id;
      LoginModel.LoginInfo.pin_id = data.data.pin_id;
      LoginModel.LoginInfo.m_isDefaultPassword = data.data.default_password;
      LoginModel.LoginInfo.machine_id = data.data.machine_id;

      this.m_state.Transition(enumState.KioskLogin);
    } else {
      console.error(
        '[LoginModel] %c VerifyMobile failed\n',
        'font-size:18px;font-weight:bold;color:green;',
        data
      );
      if (this.m_callback.login.fail != null) {
        this.m_callback.login.fail(status, data, 'VerifyMobile');
        this.m_callback.login.fail = null;
      }
    }
  }

  private OnVerifyGuest(status: number, data: any) {
    console.log('[LoginModel] OnVerifyGuest data: ', data);
    console.log('[LoginModel] OnVerifyGuest state: ', status);
    if (status === HttpResult.OK && data.err_code === 0) {
      LoginModel.LoginInfo.pin_id = data.data.pin_id;
      LoginModel.LoginInfo.kiosk_id = data.data.kiosk_id;
      LoginModel.LoginInfo.machine_id = data.data.machine_id;
      LoginModel.LoginInfo.device_id = data.data.device_id;
      LoginModel.LoginInfo.device_uuid = data.data.device_uuid;

      LoginModel.LoginInfo.m_isDefaultPassword = false; // 末使用資料 刷新

      this.m_state.Transition(enumState.KioskLogin);
    } else {
      console.error(
        '[LoginModel] %c VerifyGuest failed\n',
        'font-size:18px;font-weight:bold;color:green;',
        data
      );
      if (this.m_callback.login.fail != null) {
        this.m_callback.login.fail(status, data, 'VerifyGuest');
        this.m_callback.login.fail = null;
      }
    }
  }

  private OnDeviceLogin(status: number, data: any) {
    console.log('[LoginModel] OnDeviceLogin data: ', data);
    if (status === HttpResult.OK) {
      console.log(
        '[LoginModel] %c DeviceLogin success',
        'font-size:18px;font-weight:bold;color:green;'
      );

      LoginModel.LoginInfo.kiosk_ark_id = data.ark_id;
      LoginModel.LoginInfo.kiosk_ark_token = data.ark_token;

      if (this.IsSupportLocalStorage()) {
        localStorage.setItem('kiosk_ark_id', LoginModel.LoginInfo.kiosk_ark_id);
        localStorage.setItem(
          'kiosk_ark_token',
          LoginModel.LoginInfo.kiosk_ark_token
        );
      } else if (this.IsSupportCookie()) {
        document.cookie =
          'kiosk_ark_id=' + LoginModel.LoginInfo.kiosk_ark_id + ';';
        document.cookie =
          'kiosk_ark_token=' + LoginModel.LoginInfo.kiosk_ark_token + ';';
      }

      this.m_state.Transition(enumState.ConnectKioskSocket);
    } else {
      if (data != null) {
        try {
          data = this.m_kioskClient.decodeData(data.text);
        } catch (err) {
          data = data.text | data;
        }
      }
      console.error(
        '[LoginModel] %c DeviceLogin fail. Status: ' + status + '\n',
        'font-size:18px;font-weight:bold;color:green;',
        data
      );

      //異常狀況導致TOKEN未清除，則主動清除
      if (status === HttpResult.Condition && data.reason === -5) {
        const isCheckTokenAndClear = this.IsHaveLoginCache();

        if (isCheckTokenAndClear)
          this.m_state.Transition(enumState.CheckKioskTokenAndClear);
        else {
          //this.PinLoginFail(status, data);
          if (this.m_callback.login.fail != null) {
            this.m_callback.login.fail(status, data, 'DeviceLogin');
            this.m_callback.login.fail = null;
          }
        }
      } else {
        //this.PinLoginFail(status, data);
        if (this.m_callback.login.fail != null) {
          this.m_callback.login.fail(status, data, 'DeviceLogin');
          this.m_callback.login.fail = null;
        }
      }
    }
  }

  private RecvBindAck(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ): void {
    if (this.m_socketClient && !this.m_socketClient.isConnect) return;

    if (
      result === SocketResult.OK &&
      data &&
      data.hasOwnProperty('result') &&
      data['result'] === 0
    ) {
      console.log('result :' + result);
      console.log('data :', data);
      console.log('ret :' + ret);
      console.log('sn : ' + sn);
      console.log('sys :' + sys);
      console.log('cmd :' + cmd);
      console.log('process_time_ms :' + process_time_ms);

      if (this.m_callback.login.success != null) {
        this.m_callback.login.success(
          this.m_kioskClient,
          this.m_pinClient,
          this.m_socketClient
        );
        this.m_callback.login.success = null;
      }
      this.m_callback.login.fail = null; // 釋放註冊的事件，避免遊戲切場景時無法卸載，造成記憶體洩漏
    } else {
      this.PinLoginFailBySocket(result, data);
    }
  }

  private PinLoginFailBySocket(status, data) {
    if (this.m_socketClient && this.m_socketClient.isConnect)
      this.m_socketClient.Close();

    if (this.m_callback.login.fail != null) {
      this.m_callback.login.fail(status, data, 'BindSocket');
      this.m_callback.login.fail = null;
    }
  }

  private RecvCheckRedisKioskToken(
    result: any,
    data: any,
    _cmd_name: any,
    _process_time_ms: any
  ): void {
    console.log(' RecvCheckRedisKioskToken data :', data);

    if (result === HttpResult.OK && data.kiosk_result === 0) {
      if (this.m_socketClient && this.m_socketClient.isConnect)
        this.m_socketClient.Close();

      this.m_state.Transition(enumState.KioskLogin);
    } else {
      this.PinLoginFail(HttpResult.Condition, {reason: -5}); //Redis有Token，並且非本機，所以為重複登入
    }
  }

  private RecvCheckRedisPinToken(
    result: any,
    data: any,
    _cmd_name: any,
    _process_time_ms: any
  ): void {
    console.log('RecvCheckRedisPinToken data :', data);

    if (result === HttpResult.OK && data.pin_result === 0) {
      if (this.m_socketClient && this.m_socketClient.isConnect)
        this.m_socketClient.Close();

      this.m_state.Transition(enumState.KioskLogin);
    } else {
      this.PinLoginFail(HttpResult.Condition, {reason: -5}); //Redis有Token，並且非本機，所以為重複登入
    }
  }
  //送UnPin，等價於登出成功，所以要將Socket斷線
  private async SendUnPinSuccessByWebSocket() {
    await this.m_socketClient.SendCmd('lobby', 'unpin');

    if (this.m_socketClient && this.m_socketClient.isConnect)
      this.m_socketClient.Close();

    if (this.m_callback.logout.success != null) {
      this.m_callback.logout.success();
      this.m_callback.logout.success = null;
    }
    this.m_callback.logout.fail = null; // 釋放註冊的事件，避免遊戲切場景時無法卸載，造成記憶體洩漏
    this.m_callback.onSokcetClose = null; // 釋放註冊的事件，避免遊戲切場景時無法卸載，造成記憶體洩漏
  }

  private OnPinLogin(status: number, result: any) {
    console.log('[LoginModel] OnPinLogin data: ', result);

    if (this.m_socketClient && !this.m_socketClient.isConnect) return;

    if (status === HttpResult.OK) {
      console.log(
        '[LoginModel] %c PinLogin success',
        'font-size:18px;font-weight:bold;color:green;'
      );

      let purchase_serial_id = 0;
      if (result.client_purchase_serial_id !== undefined)
        purchase_serial_id = result.client_purchase_serial_id;

      LoginModel.LoginInfo.purchase_serial_id = purchase_serial_id + 1;

      LoginModel.LoginInfo.pin_ark_id = result.ark_id;
      LoginModel.LoginInfo.pin_ark_token = result.ark_token;

      //@ts-ignore 手機上登入，LOBBY是用Pin的Token (因為可能會卡Token，所以不是用機台Token，避免卡Token等兩分鐘的問題 ...)
      //因為魚機做Socket連線，用相同Token時，舊的會被踢掉，所以魚機是用機台Token
      //但Server是用ArkID去搜尋資產，所以機台的ArkID要設定為Pin的ArkID

      //this.m_kioskClient.arkID = LoginModel.LoginInfo.pin_ark_id;
      if (this.IsSupportLocalStorage()) {
        localStorage.setItem('pin_ark_id', LoginModel.LoginInfo.pin_ark_id);
        localStorage.setItem(
          'pin_ark_token',
          LoginModel.LoginInfo.pin_ark_token
        );
      } else if (this.IsSupportCookie()) {
        document.cookie = 'pin_ark_id=' + LoginModel.LoginInfo.pin_ark_id + ';';
        document.cookie =
          'pin_ark_token=' + LoginModel.LoginInfo.pin_ark_token + ';';
      }

      this.m_state.Transition(enumState.BindSocket);
    } else {
      let data = null;
      if (result != null) {
        try {
          data = this.m_pinClient.decodeData(result.text);
        } catch (err) {
          data = result.text | result;
        }
      }
      console.error(
        '[LoginModel] %c PinLogin fail. Status: ' + status + '\n',
        'font-size:18px;font-weight:bold;color:green;',
        data
      );

      //異常狀況導致TOKEN未清除，則主動清除
      if (status === HttpResult.Condition && data.reason === -5) {
        const isCheckTokenAndClear = this.IsHaveLoginCache();

        if (isCheckTokenAndClear)
          this.m_state.Transition(enumState.CheckPinTokenAndClear);
        else {
          this.PinLoginFail(status, data);
        }
      } else {
        this.PinLoginFail(status, data);
      }
    }
  }

  private IsHaveLoginCache(): boolean {
    let rtnHaveCache = false;
    if (this.IsSupportLocalStorage()) {
      if (
        (localStorage.getItem('kiosk_ark_id') &&
          localStorage.getItem('kiosk_ark_token')) ||
        (localStorage.getItem('pin_ark_id') &&
          localStorage.getItem('pin_ark_token'))
      )
        rtnHaveCache = true;
      else rtnHaveCache = false;
    } else if (this.IsSupportCookie()) {
      if (
        (this.GetCookie('kiosk_ark_id') && this.GetCookie('kiosk_ark_token')) ||
        (this.GetCookie('pin_ark_id') && this.GetCookie('pin_ark_token'))
      )
        rtnHaveCache = true;
      else rtnHaveCache = false;
    }

    return rtnHaveCache;
  }
  private GetCookie(name: string): string {
    const nameLenPlus = name.length + 1;
    return (
      document.cookie
        .split(';')
        .map(c => c.trim())
        .filter(cookie => {
          return cookie.substring(0, nameLenPlus) === `${name}=`;
        })
        .map(cookie => {
          return decodeURIComponent(cookie.substring(nameLenPlus));
        })[0] || null
    );
  }

  private IsSupportCookie(): boolean {
    try {
      let result = false;
      if (window.navigator.cookieEnabled) return true;
      document.cookie = 'testcookie=yes;';
      const cookieSet = document.cookie;
      if (cookieSet.indexOf('testcookie=yes') > -1) result = true;
      document.cookie = '';
      return result;
    } catch (ex) {
      return false;
    }
  }

  private IsSupportLocalStorage(): boolean {
    let rtnIsSupport = true;
    if (window.localStorage) {
      try {
        window.localStorage.setItem('test', '1');
        window.localStorage.removeItem('test');
      } catch (e) {
        rtnIsSupport = false;
      }
    } else rtnIsSupport = false;

    return rtnIsSupport;
  }

  private PinLoginFail(status, data) {
    if (this.m_callback.login.fail != null) {
      this.m_callback.login.fail(status, data, 'PinLogin');
      this.m_callback.login.fail = null;
    }

    if (this.m_socketClient && this.m_socketClient.isConnect)
      this.m_socketClient.Close();
  }
  private OnPinLogout(status: number, result: any) {
    console.log('[LoginModel] OnPinLogout data: ', result);
    if (status === HttpResult.OK) {
      console.log(
        '[LoginModel] %c PinLogout success',
        'font-size:18px;font-weight:bold;color:orange;'
      );

      this.SendUnPinSuccessByWebSocket();
    } else {
      let data = null;

      if (result != null) {
        try {
          data = this.m_pinClient.decodeData(result.text);
        } catch (err) {
          data = result.text | result;
        }
      }

      console.error('[LoginModel] PinLogout fail. data: ', data);
      if (this.m_socketClient && this.m_socketClient.isConnect)
        this.m_socketClient.Close();
      if (this.m_callback.logout.fail != null) {
        this.m_callback.logout.fail(status, data);
        this.m_callback.logout.fail = null;
      }
    }
  }

  private OnStateEntry(lastState: enumState, currentState: enumState) {
    console.log(
      '[LoginModel] Current State: %c' + enumState[currentState],
      'color:red'
    );
    switch (currentState) {
      case enumState.VerifyMobile:
        {
          const cmd_data: any = {
            user_id: LoginModel.LoginInfo.user_id,
            user_pw: LoginModel.LoginInfo.user_pw_encrypt,
          };
          this.m_kioskClient.send_drt_cmd(
            'lobby',
            'verify_mobile',
            cmd_data,
            this.OnVerifyMobile.bind(this)
          );
        }
        break;
      case enumState.VerifyGuest:
        {
          // Guest 登入驗證
          const cmd_data: any = {
            device_uuid: LoginModel.LoginInfo.device_uuid,
            code: LoginModel.LoginInfo.code,
            logo: LoginModel.LoginInfo.logo,
          };
          this.m_kioskClient.send_drt_cmd(
            'lobby',
            'verify_guest',
            cmd_data,
            this.OnVerifyGuest.bind(this)
          );
        }
        break;
      case enumState.VerifyMobileByArkID:
        {
          const confuseArkID = LoginModel.LoginInfo.user_id
            .split('-')
            .join('')
            .substr(1);
          console.log('confuseArkID :' + confuseArkID); //玩家輸入使用ARK登入流程

          const cmd_data: any = {
            ark_id: confuseArkID,
            user_pw: LoginModel.LoginInfo.user_pw_encrypt,
          };

          this.m_kioskClient.send_drt_cmd(
            'lobby',
            'verify_mobile_ByArkID',
            cmd_data,
            this.OnVerifyMobile.bind(this)
          );
        }
        break;
      case enumState.KioskLogin:
        {
          let extraData;

          //@ts-ignore
          try {
            extraData = {
              fromType: 'mobile_kiosk',
              kiosk_id: LoginModel.LoginInfo.kiosk_id,
              device_id: LoginModel.LoginInfo.device_id,
              //@ts-ignore
              mode: LogoMode,
            };
          } catch (e) {
            this.m_callback.login.fail(
              'Failed to obtain gd_LogoMode',
              'Failed to obtain gd_LogoMode',
              'DeviceLogin'
            );
            return;
          }

          this.m_kioskClient.device_login(
            'android',
            LoginModel.LoginInfo.device_id,
            this.OnDeviceLogin.bind(this),
            undefined,
            extraData
          );
        }

        break;
      case enumState.ConnectKioskSocket:
        {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const self = this;

          //if (self.m_socketClient != null) self.m_socketClient.Close();

          self.m_socketClient = new ArkSocketClient(
            self.m_kioskClient,
            1024,
            5,
            10,
            false
          );

          self.m_socketClient.m_auth_exdata = {
            kiosk_id: LoginModel.LoginInfo.kiosk_id,
            device_id: LoginModel.LoginInfo.device_id,
            machine_id: LoginModel.LoginInfo.machine_id,
            is_mobile: true,
          };

          self.m_socketClient.GetConnectInfo(
            (
              client: ArkSocketClient,
              cmd_data: JSON,
              status: number,
              msg: string,
              ip?: string,
              port?: number,
              isWebSocketSecure?: boolean
            ) => {
              console.log('[LoginModel] OnGetConnectInfo');
              self.m_socketClient.ConnectSocket(
                ip,
                port,
                isWebSocketSecure,
                //onOpen
                _arkSocket => {
                  console.log('[LoginModel] OnSocketConnected');
                  self.m_state.Transition(enumState.PinLogin);
                  //self.m_state.Transition(enumState.BindSocket);
                }, //onMsg
                (_arkSocket, _data) => {
                  // console.log('[socket msg]', data);
                }, //onClose
                arkSocket => {
                  console.log('[socket onClose!]');

                  if (arkSocket.authFailData && self.m_tryAuthFailTimes < 3) {
                    console.warn(
                      '[socket auth failed !]',
                      arkSocket.authFailData
                    );
                    arkSocket.authFailData = null;
                    self.m_tryAuthFailTimes++;
                    self.m_state.Transition(enumState.KioskLogin);
                  } else {
                    if (self.m_callback.onSokcetClose != null) {
                      self.m_callback.onSokcetClose();
                      self.m_callback.onSokcetClose = null;
                    }
                  }
                }, //onError
                (arkSocket, error) => {
                  console.error(arkSocket, 'Socket Connect Errorr!', error);

                  self.m_callback.login.fail(
                    'Socket Connect Error',
                    error,
                    'ConnectWebSocket'
                  );
                  self.m_callback.login.fail = null;
                }
              );
            }
          );
        }
        break;
      case enumState.PinLogin:
        {
          const kiosk_id = LoginModel.LoginInfo.kiosk_id;
          const pin_id = LoginModel.LoginInfo.pin_id;
          const device_id = LoginModel.LoginInfo.device_id;

          //validate驗證使用，不論手機或PC皆設定為PIN (ark_member)

          const fromType = 'pin';
          const fromID = kiosk_id + pin_id;
          const fromToken = pin_id;

          this.m_pinClient.fromType = fromType;
          this.m_pinClient.fromID = fromID;
          this.m_pinClient.fromToken = fromToken;

          //_auth驗證使用的額外資訊 (手機版為mobile，此時送上pin才接受登入)

          let extraData;

          try {
            extraData = {
              fromType: 'mobile',
              kiosk_id: kiosk_id,
              device_id: device_id,
              OpenID: fromID,
              //@ts-ignore
              mode: LogoMode,
            };
          } catch (e) {
            this.m_callback.login.fail(
              'Failed to obtain gd_LogoMode',
              'Failed to obtain gd_LogoMode',
              'PinLogin'
            );
            return;
          }

          this.m_pinClient.custom_login(
            fromType,
            fromID,
            fromToken,
            this.OnPinLogin.bind(this),
            extraData,
            extraData
          );
        }
        break;
      //改變機台狀態
      case enumState.BindSocket:
        {
          const cmd_data: any = {
            id: LoginModel.LoginInfo.pin_ark_id,
            browserInfo: LoginModel.LoginInfo.BrowserInfo,
            browserVersion: LoginModel.LoginInfo.BrowserVersion,
            deviceInfo: LoginModel.LoginInfo.DeviceInfo,
            deviceVersion: LoginModel.LoginInfo.DeviceVersion,
            publishVer: LoginModel.LoginInfo.login_version,
            network: LoginModel.LoginInfo.connect_network,
            deviceType: LoginModel.LoginInfo.DeviceType,

            Machine: LoginModel.LoginInfo.Machine,
            OS: LoginModel.LoginInfo.OS,
            OSVersion: LoginModel.LoginInfo.OSVersion,
            CPU: LoginModel.LoginInfo.CPU,
            Mem: LoginModel.LoginInfo.Mem,
            Height: LoginModel.LoginInfo.Height,
            Width: LoginModel.LoginInfo.Width,
          };

          console.log(
            'publishVer= ' +
              LoginModel.LoginInfo.login_version +
              ', network= ' +
              LoginModel.LoginInfo.connect_network +
              ', deviceType=' +
              LoginModel.LoginInfo.DeviceType +
              ', [LoginModel] BindSocket cmd_data=' +
              cmd_data
          );

          this.m_socketClient.SendCmd(
            'lobby',
            'pin',
            cmd_data,
            this.RecvBindAck.bind(this)
          );

          this.sndCountBeforeLoadingTime();
        }
        break;
      case enumState.CheckKioskTokenAndClear:
        {
          const _pinArkID = null;
          const _pinArkToken = null;

          let kioskArkID = null;
          let kioskArkToken = null;

          if (this.IsSupportLocalStorage()) {
            kioskArkID = localStorage.getItem('kiosk_ark_id');
            kioskArkToken = localStorage.getItem('kiosk_ark_token');
          } else if (this.IsSupportCookie()) {
            kioskArkID = localStorage.getItem('kiosk_ark_id');
            kioskArkToken = localStorage.getItem('kiosk_ark_token');
          }

          const cmd_data: any = {
            kiosk_ark_id: kioskArkID,
            kiosk_ark_token: kioskArkToken,
          };

          this.m_kioskClient.send_drt_cmd(
            'lobby',
            'checkToken',
            cmd_data,
            this.RecvCheckRedisKioskToken.bind(this)
          );
        }
        break;
      case enumState.CheckPinTokenAndClear:
        {
          let pinArkID = null;
          let pinArkToken = null;

          const _kioskArkID = null;
          const _kioskArkToken = null;

          if (this.IsSupportLocalStorage()) {
            pinArkID = localStorage.getItem('pin_ark_id');
            pinArkToken = localStorage.getItem('pin_ark_token');
          } else if (this.IsSupportCookie()) {
            pinArkID = this.GetCookie('pin_ark_id');
            pinArkToken = this.GetCookie('pin_ark_token');
          }

          const cmd_data: any = {
            pin_ark_id: pinArkID,
            pin_ark_token: pinArkToken,
          };

          this.m_kioskClient.send_drt_cmd(
            'lobby',
            'checkToken',
            cmd_data,
            this.RecvCheckRedisPinToken.bind(this)
          );
        }
        break;
      case enumState.PinLogout:
        {
          if (this.m_pinClient != null) {
            const cmd_data: any = {
              result: this.m_logoutSkillGameResult,
            };

            this.m_pinClient.send_cmd(
              'lobby',
              'PinLogout',
              cmd_data,
              this.OnPinLogout.bind(this)
            );
          }
        }
        break;
    }
  }

  /**
   * 取得未登入前的聯絡資訊
   * @param code 網址代碼
   * @param logo logo
   * @param successCallback 成功取得資料的 callback
   * @param failCallback 失敗的 callback
   */
  public getContactInfoNotLogin(
    code: string,
    logo: number,
    successCallback: (status: number, data: any, cmdName: string) => void,
    failCallback: (status: number, data: any, cmdName: string) => void
  ) {
    this.getContactInfoSuccessCallback = successCallback;
    this.getContactInfoFailCallback = failCallback;
    // cache logo
    LoginModel.LoginInfo.logo = logo;
    const cmd_data: any = {
      code: code,
      logo: logo,
    };
    this.m_kioskClient.send_drt_cmd(
      'lobby',
      'getContactInfo',
      cmd_data,
      this.onRecieveContactInfoNotLogin.bind(this)
    );
  }

  private getContactInfoSuccessCallback = null;
  private getContactInfoFailCallback = null;

  private onRecieveContactInfoNotLogin(status: number, data: any) {
    console.log('[LoginModel] onRecieveContactInfoNotLogin state: ', status);
    console.log('[LoginModel] onRecieveContactInfoNotLogin data: ', data);

    if (status === HttpResult.OK && data.err_code === 0) {
      if (this.getContactInfoSuccessCallback != null) {
        this.getContactInfoSuccessCallback(
          status,
          data,
          'getContactInfoNotLogin'
        );
        this.getContactInfoSuccessCallback = null;
      }
    } else {
      console.error(
        '[LoginModel] %c getContactInfoNotLogin failed\n',
        'font-size:18px;font-weight:bold;color:green;',
        data
      );
      if (this.getContactInfoFailCallback != null) {
        this.getContactInfoFailCallback(status, data, 'getContactInfoNotLogin');
        this.getContactInfoFailCallback = null;
      }
    }
  }

  /**
   * 發送登入前的 log
   * @param _click_id
   * @param _btn_click_id
   * @param _click_name
   * @param _device_id
   * @param _logo
   */
  public sendDirectClickLog(
    _click_id: string,
    _btn_click_id: number,
    _click_name: string,
    _device_id: string,
    _logo: number,
    deviceInfo: any = null
  ) {
    //@ts-ignore
    const date = new Date();
    const now = date.getTime();
    const local = date.getTime() - date.getTimezoneOffset() * 60000;

    const data: any = {
      click_id: _click_id,
      btn_click_id: _btn_click_id,
      device_id: _device_id,
      logo: _logo,

      click_name: _click_name,

      btn_click_times: 1,
      device_type: 1, //1:h5 0:PC

      client_time_utc: Math.floor(now / 1000),
      client_time_local: Math.floor(local / 1000),

      browser_info: deviceInfo.browser.name,
      browser_version: deviceInfo.browser.version,
      device_info: deviceInfo.os.name,
      device_version: deviceInfo.os.version,
    };

    const arr = [];
    arr[0] = data;
    const cmdData: JSON = <JSON>{};
    cmdData['btn_click_list'] = arr;

    console.warn('sendDirectClickLog');
    console.warn(cmdData);

    this.m_kioskClient.send_drt_cmd(
      'lobby',
      'sendRegDirectClickLog',
      cmdData,
      null
    );
  }

  public sendDirectCmd(
    cmd_id: string,
    cmd_name: string,
    cmd_data?: JSON,
    callback?,
    sn?: string,
    extra_data?: JSON
  ) {
    console.log('LoginModel.sendDirectCmd');
    console.log(cmd_id);
    console.log(cmd_name);
    console.log(cmd_data);

    this.m_kioskClient.send_drt_cmd(
      cmd_id,
      cmd_name,
      cmd_data,
      callback,
      sn,
      extra_data
    );
  }
}

export enum enumState {
  None = 0,
  VerifyMobile,
  VerifyMobileByArkID,
  KioskLogin,
  ConnectKioskSocket,
  PinLogin,
  BindSocket,
  CheckKioskTokenAndClear,
  CheckPinTokenAndClear,
  PinLogout,
  VerifyGuest,
}
