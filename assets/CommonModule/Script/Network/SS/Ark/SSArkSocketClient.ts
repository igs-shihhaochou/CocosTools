import {LogoMode} from '../Network/SSConst';
import {HttpResult} from './HttpConnect';
import {ArkClient} from './SSArkClient';

export const SocketResult = {
  OK: 0,
  Timeout: 1,
  Error: 2,
  NotReset: 3,
};

export class ArkSocketClient {
  //properties
  protected arkClient: ArkClient = null;
  protected gameUrl = '';
  protected socketClient: WebSocket = null;
  protected bufferSize = 1024;
  protected aliveTimeout = 10;
  protected cmdTimeout = 10;
  protected tableID = '';
  protected isIPV6 = false;

  protected OpenEvent: (client: ArkSocketClient) => {} = null;
  protected MessageEvent: (client: ArkSocketClient, data: JSON) => {} = null;
  protected CloseEvent: (client: ArkSocketClient) => {} = null;
  protected ErrorEvent: (client: ArkSocketClient, error: Event) => {} = null;
  protected keepAliveFunc: number = null;
  protected connectInfoQueue = [];
  protected cmdCallbackDic = {};
  protected _is_connect: Boolean = false;

  protected authFailData: any = null;

  public systemDict: JSON = <JSON>{};
  public get isConnect(): boolean {
    return (
      this._is_connect &&
      Boolean(this.socketClient && this.socketClient.readyState === 1)
    );
  }
  public set TableID(tableID: string) {
    this.tableID = tableID;
  }

  constructor(
    arkClient: ArkClient = null,
    bufferSize = 1024,
    aliveTimeout = 10,
    cmdTimeout = 10,
    isIPV6 = false
  ) {
    this.arkClient = arkClient;
    this.bufferSize = bufferSize;
    this.aliveTimeout = aliveTimeout;
    this.cmdTimeout = cmdTimeout;
    this.isIPV6 = isIPV6;
  }

  public async GetConnectInfo(
    callback: (
      client: ArkSocketClient,
      cmd_data: JSON,
      status: number,
      msg: string,
      ip?: string,
      port?: number,
      isWebSocketSecure?: boolean
    ) => void,
    table_type = null,
    exdata = null
  ) {
    if (!this.arkClient || !this.arkClient.ArkID || !this.arkClient.ArkToken) {
      console.error('arkclient is null or not authed');
      callback(this, undefined, undefined, 'arkclient is null or not authed');
    } else {
      const data: JSON = <JSON>{};
      if (table_type) data['type'] = table_type;
      if (exdata) data['exdata'] = exdata;
      this.connectInfoQueue.push(callback);
      await this.arkClient.send_cmd(
        'table',
        'connect',
        data,
        this.onGetConnectInfo.bind(this)
      );
    }
  }

  private onGetConnectInfo(result, ark_data: JSON) {
    const callback = this.connectInfoQueue.shift();
    try {
      if (result !== HttpResult.OK) callback(this, ark_data, result);
      else {
        // console.log(ark_data)
        const cmd_data: JSON = ark_data['cmd_data'];

        const status: number = cmd_data['status'];
        if (status !== HttpResult.OK) {
          const msg: string = cmd_data['msg'];
          callback(this, ark_data, status, msg);
        } else {
          let isWebSocketSecure = false;
          const url: string = cmd_data['url'];
          let idx: number = url.lastIndexOf(':');
          if (idx <= 0) callback(this, ark_data, -2, 'url parse error');
          else {
            let ip = '';
            let port = 0;

            // wss6url
            if (this.isIPV6 && cmd_data.hasOwnProperty('wss6url')) {
              const wss6url: string = cmd_data['wss6url'];
              idx = wss6url.lastIndexOf(':');
              if (idx <= 0) callback(this, ark_data, -3, 'wss6url parse error');
              else {
                const wss6urlInfo: Array<string> = [
                  wss6url.substring(0, idx),
                  wss6url.substring(idx + 1),
                ];
                ip = wss6urlInfo[0];
                port = Number(wss6urlInfo[1]);
              }
            }

            // ws6url
            else if (this.isIPV6 && cmd_data.hasOwnProperty('ws6url')) {
              const ws6url: string = cmd_data['ws6url'];
              idx = ws6url.lastIndexOf(':');
              if (idx <= 0) callback(this, ark_data, -4, 'ws6url parse error');
              else {
                const ws6urlInfo: Array<string> = [
                  ws6url.substring(0, idx),
                  ws6url.substring(idx + 1),
                ];
                ip = ws6urlInfo[0];
                port = Number(ws6urlInfo[1]);
              }
            }

            // wsurl
            else if (cmd_data.hasOwnProperty('wsurl')) {
              const wsurl: string = cmd_data['wsurl'];
              idx = wsurl.lastIndexOf(':');
              if (idx <= 0) callback(this, ark_data, -5, 'wsurl parse error');
              else {
                const wsurlInfo: Array<string> = [
                  wsurl.substring(0, idx),
                  wsurl.substring(idx + 1),
                ];
                ip = wsurlInfo[0];
                port = Number(wsurlInfo[1]);
              }
            }

            // surl
            else if (cmd_data.hasOwnProperty('surl')) {
              const surl: string = cmd_data['surl'];
              idx = surl.lastIndexOf(':');
              if (idx <= 0) callback(this, ark_data, -6, 'surl parse error');
              else {
                isWebSocketSecure =
                  this.arkClient.GameUrl.toLowerCase().substring(0, 5) ===
                  'https';
                if (isWebSocketSecure) {
                  const surlInfo: Array<string> = [
                    surl.substring(0, idx),
                    surl.substring(idx + 1),
                  ];
                  ip = surlInfo[0];
                  port = Number(surlInfo[1]);
                }
              }
            }

            // url
            else {
              const urlInfo: Array<string> = [
                url.substring(0, idx),
                url.substring(idx + 1),
              ];
              ip = urlInfo[0];
              port = Number(urlInfo[1]);
            }

            callback(this, ark_data, status, '', ip, port, isWebSocketSecure);
          }
        }
      }
    } catch (error) {
      console.error('ArkSocketClient.onConnectInfo:%s', error);
      callback(this, ark_data, -1, error);
    }
  }
  public m_auth_exdata: any = <JSON>{};

  public ConnectSocket(
    ip: string,
    port: number,
    isWebSocketSecure: boolean,
    onOpen?,
    onMsg?,
    onClose?,
    onError?
  ) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.OpenEvent = onOpen;
    this.MessageEvent = onMsg;
    this.CloseEvent = onClose;
    this.ErrorEvent = onError;
    const protocal: string = isWebSocketSecure ? 'wss' : 'ws';
    const gameUrl: string = ip + ':' + port;

    try {
      this.socketClient = new WebSocket(protocal + '://' + gameUrl + '/ws');
      this.socketClient.binaryType = 'arraybuffer';

      //onOpen
      this.socketClient.onopen = async function (_evt) {
        self._is_connect = true;
        if (!self.isConnect) {
          console.error('ConnectSocket');
          self.Close();
        } else {
          const login_obj: any = {
            ark_id: self.arkClient.ArkID,
            ark_token: self.arkClient.ArkToken,
            is_mobile: true,
            exdata: self.m_auth_exdata,
          };

          await self.SendCmd(
            null,
            'auth',
            <JSON>login_obj,
            self.onAuth.bind(self)
          );
        }
      };

      //onMsg
      this.socketClient.onmessage = function (evt) {
        let evt_data: string = evt.data;

        if (typeof evt_data !== 'string') {
          const enc: TextDecoder = new TextDecoder('utf-8');
          evt_data = enc.decode(evt.data);
        }

        const index: number = evt_data.indexOf('{');
        const str: string = evt_data.substring(0, index);
        //console.log("test socketClient.onMsg, msgSize(�ʥ]����) = " + str + ", strlen = " + str.length);

        const package_size: number = parseInt(
          evt_data.substring(0, str.length)
        );
        const cmd_data: JSON = JSON.parse(
          evt_data.substring(str.length, package_size + str.length)
        );

        if (self.MessageEvent) self.MessageEvent(self, cmd_data);

        let data: any = {};
        let ret = '';
        let sn = 0;
        let sys = '';
        let cmd = '';

        if (cmd_data.hasOwnProperty('data')) data = cmd_data['data'];

        if (cmd_data.hasOwnProperty('ret')) ret = cmd_data['ret'];

        if (cmd_data.hasOwnProperty('sn')) sn = cmd_data['sn'];

        if (cmd_data.hasOwnProperty('sys')) sys = cmd_data['sys'];

        if (cmd_data.hasOwnProperty('cmd')) {
          cmd = cmd_data['cmd'];
          // 不確定ret來源是甚麼，先只用cmd判斷
          self.ReceivePacketName(cmd);
        }

        let cmd_key: string = ret || cmd;
        cmd_key += '_' + sn;

        if (self.cmdCallbackDic.hasOwnProperty(cmd_key)) {
          const [callback, start_time]: Array<any> =
            self.cmdCallbackDic[cmd_key];
          const process_time_ms: number = new Date().getTime() - start_time;

          if (callback) {
            callback(SocketResult.OK, data, ret, sn, sys, cmd, process_time_ms);
            delete self.cmdCallbackDic[cmd_key];
          }
        } else if (sys.length > 0) {
          if (self.systemDict.hasOwnProperty(sys)) {
            const system: any = self.systemDict[sys];
            const callback: any = system.cmdDict[cmd];
            if (callback) {
              callback(SocketResult.OK, data, ret, sn, sys, cmd);
            }
          }
        } else {
          for (const sys in self.systemDict) {
            const system: any = self.systemDict[sys];
            const callback: any = system.cmdDict[cmd];
            if (callback) {
              callback(SocketResult.OK, data, ret, sn, sys, cmd);
            }
          }
        }
      };

      //onClose
      this.socketClient.onclose = function (_evt) {
        console.error('socketClient.onclose');
        self.Close();
      };

      //OnError
      this.socketClient.onerror = function (evt) {
        console.error('[ConnectSocket]Unidentified websocket error');
        if (self.ErrorEvent) self.ErrorEvent(self, evt);
        self.Close();
      };
    } catch (error) {
      console.error(
        '[ConnectSocket]websocket is unavailable, ip:%s, port:%s',
        ip,
        port
      );
      if (self.ErrorEvent) self.ErrorEvent(self, error as any);
      self.Close();
    }
  }

  public Close() {
    this._is_connect = false;
    if (this.keepAliveFunc != null) clearInterval(this.keepAliveFunc);
    this.keepAliveFunc = null;
    const socket_client = this.socketClient;
    this.socketClient = null;
    if (socket_client) {
      try {
        socket_client.close();
      } catch (error) {
        console.error('[socket close]:%s', error);
        if (this.ErrorEvent) this.ErrorEvent(this, error as any);
      }
    }

    this.OpenEvent = null;
    this.MessageEvent = null;
    const close_event = this.CloseEvent;
    this.CloseEvent = null;
    if (close_event) close_event(this);
    this.ErrorEvent = null;
  }

  private onAuth(
    result: number,
    data: JSON,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string
  ) {
    const status = data['status'];
    if (result !== SocketResult.OK || status !== HttpResult.OK) {
      console.warn('socket auth fail');
      this.authFailData = data;
      this.Close();
    } else {
      const open_event = this.OpenEvent;
      this.OpenEvent = null;
      if (open_event) open_event(this);

      // send Alive
      const aliveFunc = () => {
        // console.log(this.gameUrl + ' Socket SendCmd alive');
        this.SendCmd(null, 'alive');
      };
      this.keepAliveFunc = setInterval(
        aliveFunc.bind(this),
        this.aliveTimeout * 1000
      );
    }
  }

  public TableAny(callback, table_type = null, extra_data?) {
    const cmd_data: JSON = <JSON>{};

    cmd_data['type'] = table_type || '';

    if (extra_data) cmd_data['exdata'] = extra_data;

    this.SendCmd('table', 'any', cmd_data, callback);
  }

  public async SendCmd(
    cmd_id: string,
    cmd_name: string,
    cmd_data?: JSON,
    callback?: (
      result: number,
      data: JSON,
      ret: string,
      sn: number,
      sys: string,
      cmd: string,
      process_time_ms?: number
    ) => void
  ) {
    try {
      if (!this.isConnect) {
        console.error('Socket is close');
        if (callback)
          callback(SocketResult.NotReset, null, cmd_name, 0, cmd_id, cmd_name);
      } else {
        const sn: string = await ArkClient.get_sn();

        const json_obj: any = {
          sys: cmd_id,
          cmd: cmd_name,
          sn: sn,
        };
        if (cmd_data) {
          cmd_data['device'] = 1;
          try {
            //@ts-ignore
            cmd_data['mode'] = LogoMode;
          } catch (e) {
            callback(
              SocketResult.Error,
              <JSON>{},
              cmd_name,
              Number(sn),
              cmd_id,
              cmd_name
            );
            return null;
          }
          json_obj['data'] = cmd_data;
        }

        const package_size: number = JSON.stringify(json_obj).length;
        let str_package_size = '';
        for (
          let i = package_size.toString().length;
          i < this.bufferSize.toString().length;
          i++
        )
          str_package_size = '0' + str_package_size;
        str_package_size += package_size.toString();

        if (callback) {
          const cmd_key: string = cmd_name + '_' + sn;
          this.cmdCallbackDic[cmd_key] = [callback, new Date().getTime()];

          // cmd timeout
          setTimeout(
            cmd_key => {
              if (!this.cmdCallbackDic.hasOwnProperty(cmd_key)) return;
              const [callback, start_time]: Array<any> =
                this.cmdCallbackDic[cmd_key];
              const process_time_ms: number = new Date().getTime() - start_time;

              if (callback) {
                callback(
                  SocketResult.Timeout,
                  {},
                  cmd_name,
                  sn,
                  cmd_id,
                  cmd_name,
                  process_time_ms
                );
                delete this.cmdCallbackDic[cmd_key];
              }
            },
            this.cmdTimeout * 1000,
            cmd_key
          );
        }
        this.socketClient.send(str_package_size + JSON.stringify(json_obj));

        return sn;
      }
    } catch (error) {
      console.error('[SendCmd]error: %s', error);
      if (callback)
        callback(SocketResult.Error, null, cmd_name, 0, cmd_id, cmd_name);
      if (this.ErrorEvent) this.ErrorEvent(this, error as any);
    }
  }

  public ReceivePacketName(_cmd_name: string) {}
}
