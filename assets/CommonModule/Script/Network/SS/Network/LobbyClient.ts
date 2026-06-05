import {game, Game} from 'cc';
import {ArkClient} from '../Ark/SSArkClient';
import {ArkSocketClient} from '../Ark/SSArkSocketClient';
import {JPSystem} from './JPSystem';
import {LobbySystem} from './LobbySystem';
import {LoginModel} from './LoginModel';
import {UserClient} from './UserClient';

export enum LOBBY_STATUS {
  LOGIN_OK = 0,
  INTO_LOBBY_OK = 1,
  FIRST_CLICK_ICON = 2,
}

export enum GAME_STATUS {
  ICON_CLICK = 3,
  START_LOAD_PAGE = 4,
  LOAD_PAGE_OK = 5,
  RECV_THEME_SETTING = 6,
  FIRST_SPIN = 7,
}

export class LobbyClient {
  public static Instance: LobbyClient;

  public get GetUserClient() {
    return this.userClient;
  }

  public get GetLobbySystem() {
    return this.lobbySystem;
  }

  public get GetJPSystem() {
    return this.jpSystem;
  }

  // public OnClickLobbyBtn: Function;
  public ReloadGame: Function;
  public ReloadLobby: Function;

  // public IsRecvPosKick = false;
  // public IsRecvShutdown = false;
  public IsSocketErrorClose = false;
  public tmpMissionInfo: any;
  public m_CommonEventInfo_900004: any;
  public m_CommonEventInfo_900005: JSON;
  public m_CommonEventInfo_900005_Rank: JSON = undefined;
  public m_CommonEventInfo: JSON;
  public m_ExtraResult: JSON = undefined;

  public OnGameMaintain: Function;
  public OnGameUpdateVersion: Function;
  public OnGameLoadingOK: Function;

  private loginModel: LoginModel = null;
  private userClient: UserClient = null;

  private lobbySystem: LobbySystem = null;
  private jpSystem: JPSystem = null;

  private socket: ArkSocketClient = null;

  private isLogin = false;
  private isLogoutNow = false;

  private loginSuccessCB;

  private pingWebSocketTimerID;
  private sendLogTimerID;

  public ErrorData = [];

  private PacketDelayData = {
    sent: 0,
    receive: 0,
    loss: -1,
    best: -1,
    average: -1,
    worst: -1,
    totalElapsedTime: -1,
  };

  private Ping: Function;
  private SendLog: Function;

  private isPause;

  public JpShowLastTime = 0;
  public readonly DEAFULT_JP_SHOW_TIMEOUT = 100;

  private static m_arrJsonSpinTypeLog: JSON[] = [];

  /**
   * 指定Instance (此Function主要給遊戲呼叫, 利用大廳實體取代遊戲iframe的LobbyClient實體)
   * @param ins
   */
  public static SetInstance(ins: LobbyClient) {
    // if (LobbyClient.Instance != null) { // 指定新的物件到 instance 之前，先把舊的物件參照清空，以避免記憶體無法回收造成洩漏
    //     LobbyClient.Instance.ClearEvent();
    //     LobbyClient.Instance.ReloadLobby = null;
    //     LobbyClient.Instance.ReloadGame = null;
    // }
    LobbyClient.Instance = ins;
  }

  constructor() {
    if (LobbyClient.Instance != null)
      console.error('LobbyClient is already exist');
    LobbyClient.Instance = this;

    game.on(Game.EVENT_HIDE, this.onAppPause.bind(this));
    game.on(Game.EVENT_SHOW, this.onAppResume.bind(this));
  }

  // public ClearEvent(){
  //     cc.game.targetOff(this);        // cc.game.on 註冊的事件，無法用 cc.game.off 取消註冊，必須用 cc.game.targetOff 才能移除，似乎是 cocos 的 bug
  //     window.clearTimeout(this.pingWebSocketTimerID);
  //     window.clearTimeout(this.sendLogTimerID);
  // }

  /**
   * 設定JP報獎持續時間
   */
  private JPInit() {
    this.JpShowLastTime = this.DEAFULT_JP_SHOW_TIMEOUT;
  }

  private JPFinish() {
    this.JpShowLastTime = 0;
  }

  public IsSocketConnect() {
    return this.socket && this.socket.isConnect;
  }
  private onAppResume() {
    console.log('onAppResume');

    //確定是休眠回來的狀態
    if (this.isPause) {
      this.isPause = false;

      //檢查網路是否已經斷線，

      //Socket若還連著，恢復LOG收集
      if (this.IsSocketConnect()) {
        // this.PauseCollectLog();
        this.CollectLog();
      } else {
        //清除休眠後，斷線所造成的ERROR
        this.ErrorData = [];
      }
    }
  }

  private onAppPause() {
    console.log('onAppPause');
    //APP進入休眠，暫停LOG收集
    // this.PauseCollectLog();
    this.isPause = true;
  }
  // public RecvPosKickCmd(reason: string) {

  //     console.log("RecvPosKickCmd");
  //     this.IsRecvPosKick = true;
  // }

  // public RecvShutdownCmd(min: number) {
  //     console.log("RecvShutdownCmd");
  //     let slef = this;
  //     clearTimeout(slef.shutdownTimeout);

  //     slef.shutdownTimeout = setTimeout(() => {
  //         this.IsRecvShutdown = true;
  //     }, min * 60e3);
  // }
  public async KioskLogin(
    serverUrl: string,
    onFail?: (status: number, data: any, cmdName?) => void
  ) {
    const kioskID = LoginModel.LoginInfo.kiosk_id;
    if (kioskID == null) {
      console.error('[KioskLogin] kioskID is null');
      return;
    }

    let strError = '';
    const arkClient = new ArkClient(serverUrl);

    let device_id = localStorage.getItem('device_id');
    if (device_id == null || device_id === '') {
      const uuid = await arkClient.get_uuid();
      device_id = 'H5Tx_' + uuid;
      localStorage.setItem('device_id', device_id);
    }

    const data = await arkClient._login(
      'win',
      device_id,
      device_id,
      e => {
        strError = e;
        console.log(e);
      },
      null
    );
    const _auth_data = await arkClient._auth(
      data.auto_id,
      data.invite_code,
      e => {
        strError = e;
        console.log(e);
      },
      {
        kiosk_id: kioskID,
        device: 0,
        Machine: 'Test',
        OS: 'Windows',
      }
    );

    if (strError !== '') {
      console.error('[KioskLogin] error ', strError);
      return;
    }

    const cmd_data: any = {
      kiosk_id: kioskID,
      device_id: device_id,
      device: 0,
    };

    const lobbyInfo = await arkClient.send_cmd(
      'lobby',
      'getLobbyInfo',
      cmd_data,
      a => {
        console.log(a);
      }
    );
    if (lobbyInfo && lobbyInfo.cmd_data && lobbyInfo.cmd_data.result) {
      console.error(lobbyInfo.cmd_data);
      if (onFail != null) {
        // errorCode, reason, cmdName
        onFail(lobbyInfo.cmd_data.result, lobbyInfo.cmd_data, 'KioskLogin');
        onFail = null;
      }
    }
    try {
      console.log('[KioskLogin] getLobbyInfo: ', lobbyInfo.cmd_data);
    } catch (err) {
      console.error('[KioskLogin] Exception: ', err);
    }
    return lobbyInfo;
  }

  /**
   * 進行登入動作
   * @param serverUrl Server位置
   * @param user_id
   * @param user_pw
   * @param onSuccess 成功callback
   * @param onFail 失敗callback
   */
  public DoLogin(
    serverUrl: string,
    user_id: string,
    user_pw: string,
    onSuccess?: Function,
    onFail?: (status: number, data: any, cmdName?) => void
  ) {
    try {
      const deviceInfo: any = {
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        browser: {
          name: 'Chrome',
          version: '132.0.0.0',
          major: '132',
        },
        engine: {
          name: 'Blink',
        },
        os: {
          name: 'Mac OS',
          version: '10.15.7',
        },
        device: {},
        cpu: {},
      }; //SS.Common.GameEnvironment.DeviceInfo;
      this.loginSuccessCB = onSuccess;
      if (this.loginModel && this.loginModel.Clear) {
        this.loginModel.Clear();
      }

      let connectType = 'None';
      const login_version = 'Editor';

      if (navigator.connection != null) {
        connectType = navigator.connection.type;
      }

      this.loginModel = new LoginModel(serverUrl);
      this.loginModel.DoLogin(
        user_id,
        user_pw,
        (
          kioskClient: ArkClient,
          pinClient: ArkClient,
          socketClient: ArkSocketClient
        ) => {
          //Success event
          this.OnLoginSuccess(kioskClient, pinClient, socketClient);
        },
        (status: number, data: any, cmdName: string) => {
          console.error(status);
          console.error(data);
          if (onFail != null) {
            onFail(status, data, cmdName);
            onFail = null;
          }
        },
        () => {
          //登入成功造成斷線，為異常斷線
          if (this.isLogin) {
            // this.PauseCollectLog();
            this.IsSocketErrorClose = true;
          } else {
            //沒有進行登出也沒登入成功，則Socket就斷線問題處理

            if (!this.isLogoutNow && onFail != null) {
              onFail(
                -999,
                'Socket disconnected without login',
                'ConnectWebSocket'
              );
              onFail = null;
            }
          }
        },
        deviceInfo,
        login_version,
        connectType
      );
    } catch (err) {
      console.error(err);
      if (onFail != null) {
        onFail(-999, err);
        onFail = null;
      }
    }
  }

  // /**
  //  * 執行 GUEST 登入動作
  //  * @param serverUrl server 位址
  //  * @param device_uuid aka guest id
  //  * @param code url code
  //  * @param logo logo (0,1,2)
  //  * @param successCallback 登入成功的Callback
  //  * @param failCallback 登入失敗的Callback
  //  */
  // public DoGuestLogin(
  //   serverUrl: string,
  //   device_uuid: string,
  //   code: string,
  //   logo: number,
  //   onSuccess?: Function,
  //   onFail?: (status: number, data: any, cmdName?) => void
  // ) {
  //   try {
  //     let deviceInfo: any = SS.Common.GameEnvironment.DeviceInfo;
  //     this.loginSuccessCB = onSuccess;
  //     if (this.loginModel && this.loginModel.Clear) this.loginModel.Clear();
  //     this.loginModel = new LoginModel(serverUrl);

  //     let connectType: string = 'None';
  //     let login_version: string = SS.Common.GameEnvironment.LobbyVersion;

  //     if (navigator.connection != null && navigator.connection != undefined) {
  //       connectType = navigator.connection.type;
  //     }

  //     this.loginModel.DoGuestLogin(
  //       device_uuid,
  //       code,
  //       logo,
  //       (
  //         kioskClient: ArkClient,
  //         pinClient: ArkClient,
  //         socketClient: ArkSDK.ArkSocketClient
  //       ) => {
  //         //Success event
  //         this.OnLoginSuccess(kioskClient, pinClient, socketClient);
  //       },
  //       (status: number, data: any, cmdName: string) => {
  //         console.error(status);
  //         console.error(data);
  //         if (onFail != null) {
  //           onFail(status, data, cmdName);
  //           onFail = null;
  //         }
  //       },
  //       () => {
  //         //登入成功造成斷線，為異常斷線
  //         if (this.isLogin) {
  //           this.PauseCollectLog();
  //           this.IsSocketErrorClose = true;
  //         } else {
  //           //沒有進行登出也沒登入成功，則Socket就斷線問題處理

  //           if (!this.isLogoutNow && onFail != null) {
  //             onFail(
  //               -999,
  //               'Socket disconnected without login',
  //               'ConnectWebSocket'
  //             );
  //             onFail = null;
  //           }
  //         }
  //       },
  //       deviceInfo,
  //       login_version,
  //       connectType
  //     );
  //   } catch (err) {
  //     console.error(err);
  //     if (onFail != null) {
  //       onFail(-999, err);
  //       onFail = null;
  //     }
  //   }
  // }
  private OnLoginSuccess(
    kioskClient: ArkClient,
    pinClient: ArkClient,
    socketClient: ArkSocketClient
  ) {
    // this.IsRecvPosKick = false;
    // this.IsRecvShutdown = false;
    this.IsSocketErrorClose = false;
    this.isLogin = true;
    this.isLogoutNow = false;

    this.socket = socketClient;

    if (this.userClient) this.userClient.setNetClient(kioskClient, pinClient);
    else this.userClient = new UserClient(kioskClient, pinClient);

    if (this.lobbySystem) this.lobbySystem.setNetClient(socketClient);
    else {
      this.lobbySystem = new LobbySystem(socketClient);
      // this.lobbySystem.OnPosKickSignal.add(this.RecvPosKickCmd, this);
      // this.lobbySystem.OnShutdownSignal.add(this.RecvShutdownCmd, this);
    }

    //@ts-ignore
    console.warn('[OnLoginSuccess] LogoMode: ' + window.gd_nowLOGO);
    //@ts-ignore
    this.lobbySystem.setLoginLogoMode(window.gd_nowLOGO);

    if (this.jpSystem) this.jpSystem.setNetClient(socketClient, pinClient);
    else {
      this.jpSystem = new JPSystem(socketClient, pinClient);
      this.jpSystem.OnJPStartSignal.add(this.JPInit, this);
      this.jpSystem.OnJPFinishSignal.add(this.JPFinish, this);
    }

    this.CollectLog();

    this.loginSuccessCB();
    this.loginSuccessCB = null;
  }

  private CollectLog() {
    /*this.Ping = () => {
            this.pingWebSocketTimerID = setTimeout(() => {
                if (this.isLogin && this.socket && this.socket.isConnect) {
                    console.log("send ping");

                    this.PacketDelayData.sent++;
                    this.lobbySystem.PingWebSocket(this.RecvPingAck.bind(this));
                }
            }, 5e3);
        }*/

    this.SendLog = () => {
      this.sendLogTimerID = setTimeout(() => {
        if (this.isLogin && this.socket && this.socket.isConnect) {
          console.log('ErrorData', this.ErrorData);
          if (this.ErrorData.length > 0) {
            //因為只有嚴重錯誤，才會記錄，所以不需要擔心太多DB IO  (Info訊息、維護、更新不會記錄))
            this.ErrorData.forEach(item => {
              if (item.PinArkID === LoginModel.LoginInfo.pin_ark_id)
                this.userClient.SendErrorLog(item);
            });

            this.ErrorData = [];
          }

          this.SendLog();
        }
      }, 300e3);
    };

    //this.Ping();

    this.SendLog();
  }

  // public CollectErrorLog(
  //   priority: PopupPriority,
  //   code: string,
  //   sceneName: string,
  //   trigger_point: string
  // ) {
  //   let data = {
  //     error_result: code,
  //     trigger_point: trigger_point,
  //     scene_name: sceneName,
  //     error_handle: priority,
  //     MachineID: LoginModel.LoginInfo.machine_id,
  //     KioskID: LoginModel.LoginInfo.kiosk_id,
  //     PinArkID: LoginModel.LoginInfo.pin_ark_id,
  //     ClientTimeUTC: new Date().getTime(),
  //     // CreateTime: new Date().getTime().toLocaleString().split(',').join(''),
  //     UserID: LoginModel.LoginInfo.user_id,
  //   };

  //   this.ErrorData.push(data);
  // }

  // private RecvPingAck(
  //   result: number,
  //   data: JSON,
  //   ret: string,
  //   sn: number,
  //   sys: string,
  //   cmd: string,
  //   process_time_ms?: number
  // ) {
  //   if (result == ArkSDK.SocketResult.OK) {
  //     this.PacketDelayData.receive++;
  //   }

  //   if (process_time_ms === undefined) process_time_ms = 10e3;

  //   this.PacketDelayData.totalElapsedTime += process_time_ms;

  //   if (
  //     this.PacketDelayData.best == -1 ||
  //     this.PacketDelayData.best > process_time_ms
  //   )
  //     this.PacketDelayData.best = process_time_ms;

  //   if (
  //     this.PacketDelayData.worst == -1 ||
  //     this.PacketDelayData.worst < process_time_ms
  //   )
  //     this.PacketDelayData.worst = process_time_ms;

  //   if (this.PacketDelayData.sent > 5) {
  //     this.PacketDelayData.loss =
  //       this.PacketDelayData.sent - this.PacketDelayData.receive;
  //     this.PacketDelayData.average =
  //       this.PacketDelayData.totalElapsedTime / this.PacketDelayData.sent;
  //     console.log(
  //       'send SendPacketDelayData : ',
  //       JSON.stringify(this.PacketDelayData)
  //     );

  //     var copyPacketDelayData = Object.assign({}, this.PacketDelayData);

  //     this.userClient.SendPacketDelayData(copyPacketDelayData);

  //     this.ResetPacketDelayData();
  //   }

  //   this.Ping();
  // }

  private ResetPacketDelayData() {
    this.PacketDelayData.sent = 0;
    this.PacketDelayData.receive = 0;
    this.PacketDelayData.loss = -1;
    this.PacketDelayData.best = -1;
    this.PacketDelayData.average = -1;
    this.PacketDelayData.worst = -1;
    this.PacketDelayData.totalElapsedTime = -1;
  }
  // private PauseCollectLog() {
  //   window.clearTimeout(this.pingWebSocketTimerID);
  //   window.clearTimeout(this.sendLogTimerID);

  //   // this.ResetPacketDelayData();
  // }

  // /**
  //  * 進行登出動作
  //  * @param onSuccess 成功callback
  //  * @param onFail 失敗callback
  //  */
  // public async DoLogout(
  //   onSuccess?: Function,
  //   onFail?: (status: number, data: any) => void,
  //   skillResult = 0
  // ) {
  //   try {
  //     // await ClickLog.SendLogWhenDoLogout(); // 手動上傳剩下的 click log

  //     this.isLogin = false;
  //     this.isLogoutNow = true;
  //     // this.lobbySystem.OnPosKickSignal.remove(this.RecvPosKickCmd, this);
  //     // this.lobbySystem.OnShutdownSignal.remove(this.RecvShutdownCmd, this);
  //     if (this.jpSystem.OnJPStartSignal) {
  //       this.jpSystem.OnJPStartSignal.remove(this.JPInit, this);
  //     }

  //     if (this.jpSystem.OnJPFinishSignal) {
  //       this.jpSystem.OnJPFinishSignal.remove(this.JPFinish, this);
  //     }

  //     // this.PauseCollectLog();

  //     //this.lobbySystem.Release();
  //     this.lobbySystem = null;

  //     //this.jpSystem.Release();    // 釋放前，先把綁再 SSNetwork 的 callback 清空
  //     this.jpSystem = null;
  //     //this.userClient.Release();  // 釋放前，先把綁再 SSNetwork 的 callback 清空
  //     this.userClient = null;
  //     // if (this.socket){
  //     //     this.socket.systemDict = null;
  //     // }

  //     this.loginModel.DoLogout(onSuccess, onFail, skillResult);
  //     //this.loginModel = null;
  //   } catch (err) {
  //     console.error(err);
  //     if (onFail != null) {
  //       onFail(-999, err);
  //       onFail = null;
  //     }
  //   }
  // }
}
