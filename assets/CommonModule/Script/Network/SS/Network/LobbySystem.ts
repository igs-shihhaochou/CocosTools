import {ArkSocketClient, SocketResult} from '../Ark/SSArkSocketClient';
import {Signal} from './Common/Signal';

export class LobbySystem {
  private m_socketClient: ArkSocketClient = null;
  //private m_recvPinCB;

  /*OnMarqueeSignal(JSON)*/
  public OnMarqueeSignal: Signal = new Signal();
  public OnUpdateSignal: Signal = new Signal();

  // 戰艦佔領資訊CB(領獎用)
  public OnRecvSubmarineOccupyInfoSignal: Signal = new Signal();

  //public OnShutdownSignal: Signal = new Signal();
  //public OnPosKickSignal: Signal = new Signal();

  /*for ArkSocketClient 收到廣播封包訊息發送 (請勿存取)*/
  public cmdDict: JSON = <JSON>{};

  public m_isPosKick = false;
  public m_ServerToIdleWaitMin = -1;

  private loginLogoMode = '';

  public Release() {
    this.m_socketClient = null;
    if (this.OnMarqueeSignal) {
      this.OnMarqueeSignal.removeAll();
      this.OnMarqueeSignal = null;
    }
    if (this.OnUpdateSignal) {
      this.OnUpdateSignal.removeAll();
      this.OnUpdateSignal = null;
    }
    if (this.OnRecvSubmarineOccupyInfoSignal) {
      this.OnRecvSubmarineOccupyInfoSignal.removeAll();
      this.OnRecvSubmarineOccupyInfoSignal = null;
    }
  }

  public setLoginLogoMode(logoMode: string) {
    this.loginLogoMode = logoMode;
  }

  public setNetClient(socketClient: ArkSocketClient) {
    this.m_socketClient = socketClient;
    this.m_socketClient.systemDict['lobby'] = this;
  }

  constructor(socketClient: ArkSocketClient) {
    this.m_socketClient = socketClient;
    //註冊此系統

    this.m_socketClient.systemDict['lobby'] = this;

    //註冊cmdCallBack
    this.cmdDict['shutdown'] = this.OnRecvShutdownCmd.bind(this);
    this.cmdDict['pos_kick'] = this.OnRecvPosKickCmd.bind(this);
    this.cmdDict['UpdateInfo'] = this.OnRecvUpdataInfoCmd.bind(this);
    this.cmdDict['GetSubmarineOccupyInfo'] =
      this.OnRecvSubmarineOccupyInfo.bind(this);
  }

  public PingWebSocket(recvPinCB) {
    if (this.m_socketClient) {
      this.m_socketClient.SendCmd('lobby', 'ping', null, recvPinCB);
    }
  }

  //private RecvPingAck(result: number, data: JSON, ret: string, sn: number, sys: string, cmd: string, process_time_ms?: number) {

  //    //if (result == ArkSDK.Sockeesult.OK)
  //        this.m_recvPinCB(result,process_time_ms);
  //}

  private OnRecvShutdownCmd(
    result: number,
    data: JSON,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ): void {
    console.log(
      '[SS.Network.OnRecvShutdownCmd]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      if (data.hasOwnProperty('min')) {
        this.m_ServerToIdleWaitMin = parseInt(data['min']);
      }
    }
  }

  private OnRecvPosKickCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ): void {
    console.log(
      '[SS.Network.OnRecvPosKickCmd]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      this.m_isPosKick = true;
    }
  }

  private OnRecvUpdataInfoCmd(
    result: number,
    data: any,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ): void {
    // console.log(
    //   '[SS.Network.OnRecvUpdataInfoCmd]',
    //   result,
    //   data,
    //   ret,
    //   sn,
    //   sys,
    //   cmd,
    //   process_time_ms,
    //   new Date().toUTCString()
    // );

    if (result === SocketResult.OK) {
      if (data.hasOwnProperty('msg_info')) {
        if (data['msg_info'].hasOwnProperty('platform')) {
          for (const strPlatform of data['msg_info']['platform']) {
            if (strPlatform === 'PHONE')
              this.OnMarqueeSignal.dispatch(data['msg_info']);
          }
        }
      }

      if (data.hasOwnProperty('game_version')) {
        if (data['game_version'].hasOwnProperty(this.loginLogoMode))
          this.OnUpdateSignal.dispatch(
            data['game_version'][this.loginLogoMode]
          );
      }

      //#TODO game_maintain_list server還沒拆分平台
    }
  }

  // 後台記錄進入遊戲
  public SendSessionLengthLogin(gameID: number) {
    const cmdData: JSON = <JSON>{};
    cmdData['gameId'] = gameID;
    if (this.m_socketClient) {
      this.m_socketClient.SendCmd('lobby', 'SessionLengthLogin', cmdData, null);
    }
  }

  // 後台記錄離開遊戲
  public SendSessionLengthLogout(gameID: number, recvCB = null) {
    const cmdData: JSON = <JSON>{};
    cmdData['gameId'] = gameID;
    if (this.m_socketClient) {
      this.m_socketClient.SendCmd(
        'lobby',
        'SessionLengthLogout',
        cmdData,
        recvCB
      );
    }
  }

  // 大廳取得遊戲需求資料
  public SendGameRequest(cmd: string) {
    const cmdData: JSON = <JSON>{};
    cmdData['cmd'] = cmd;
    if (this.m_socketClient) {
      this.m_socketClient.SendCmd('lobby', 'gameRequest', cmdData, null);
    }
  }

  // 大廳取得大神戰艦被佔領資訊
  public SendGetSubmarineOccupyInfo() {
    if (this.m_socketClient) {
      this.m_socketClient.SendCmd(
        'lobby',
        'getSubmarineOccupyInfo',
        null,
        null
      );
    }
  }

  // 大神戰艦被佔領資訊CB(不同cmd)
  private OnRecvSubmarineOccupyInfo(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ) {
    console.log(
      '[SS.Network.OnRecvSubmarineOccupyInfoSignal]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      this.OnRecvSubmarineOccupyInfoSignal.dispatch(data);
    }
  }

  // 大神戰艦通知server玩家已領取佔領獎勵
  public SendClearSubmarineOccupyInfo(submarineName: string, occupyTs: number) {
    const cmdData: JSON = <JSON>{};
    cmdData['submarine_name'] = submarineName;
    cmdData['occupy_ts'] = occupyTs;
    if (this.m_socketClient) {
      this.m_socketClient.SendCmd(
        'lobby',
        'clearSubmarineOccupyInfo',
        cmdData,
        null
      );
    }
  }
}
