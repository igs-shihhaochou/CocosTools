import {HttpResult} from './Utitlity/HttpConnect';
import ArkClient from './ArkClient';

/** Socket回應狀態 */
export const socketResult = {
  ok: 0,
  timeout: 1,
  error: 2,
  notReset: 3,
};

export default class ArkSocketClient {
  //#region public
  public get gameUrl(): string {
    return this._gameUrl;
  }
  public get systemDict(): JSON {
    return this._systemDict;
  }
  public get isConnect(): boolean {
    return (
      this._isConnect &&
      Boolean(this.socketClient && this.socketClient.readyState === 1)
    );
  }
  //#endregion public

  //properties
  protected bufferSize = 1024;
  protected aliveTimeout = 10;
  protected cmdTimeout = 10;
  protected isIPV6 = false;
  protected _isConnect = false;
  protected _gameUrl = '';

  protected arkClient: ArkClient = null;
  protected socketClient: WebSocket = null;
  protected _systemDict: JSON = null;

  protected keepAliveFunc = null;
  protected cmdCallbackDic = null;

  //#region WebSocket Event
  protected openEvent: (client: ArkSocketClient) => {} = null;
  protected messageEvent: (client: ArkSocketClient, data: JSON) => {} = null;
  protected closeEvent: (client: ArkSocketClient, error: Event) => {} = null;
  protected errorEvent: (client: ArkSocketClient, error: Event) => {} = null;
  //#endregion WebSocket Event

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

    this.keepAliveFunc = null;
    this.cmdCallbackDic = {};
  }

  public connectSocket(
    ip: string,
    port: number,
    isWebSocketSecure: boolean,
    onOpen?,
    onMsg?,
    onClose?,
    onError?
  ) {
    const protocol: string = isWebSocketSecure ? 'wss' : 'ws';

    this._gameUrl = ip + ':' + port;

    this._systemDict = {} as JSON;

    this.openEvent = onOpen;
    this.messageEvent = onMsg;
    this.closeEvent = onClose;
    this.errorEvent = onError;

    try {
      this.socketClient = new WebSocket(
        protocol + '://' + this._gameUrl + '/ws'
      );
      this.socketClient.binaryType = 'arraybuffer';

      //onOpen
      this.socketClient.onopen = async () => {
        this._isConnect = true;
        if (!this._isConnect) {
          this.close();
        } else {
          const loginObj = {
            ark_id: this.arkClient.arkId,
            ark_token: this.arkClient.arkToken,
          };

          await this.sendCmd(
            null,
            'auth',
            JSON.parse(JSON.stringify(loginObj)),
            this.onAuth.bind(this)
          );
        }
      };
      //onMsg
      this.socketClient.onmessage = evt => {
        let evtData: string = evt.data;

        if (typeof evtData !== 'string') {
          const enc: TextDecoder = new TextDecoder('utf-8');
          evtData = enc.decode(evt.data);
        }

        const packageSize: number = parseInt(evtData.substring(0, 4));
        let cmdData: JSON = null;
        try {
          cmdData = JSON.parse(evtData.substring(4, packageSize + 4));
        } catch {
          const base64Data: string = evtData.substring(4, packageSize + 4);
          cmdData = JSON.parse(atob(base64Data));
        }

        if (this.messageEvent) this.messageEvent(this, cmdData);

        let data = {};
        let ret = '';
        let sn = 0;
        let sys = '';
        let cmd = '';

        if (cmdData.hasOwnProperty('data')) data = cmdData['data'];

        if (cmdData.hasOwnProperty('ret')) ret = cmdData['ret'];

        if (cmdData.hasOwnProperty('sn')) sn = cmdData['sn'];

        if (cmdData.hasOwnProperty('sys')) sys = cmdData['sys'];

        if (cmdData.hasOwnProperty('cmd')) cmd = cmdData['cmd'];

        let cmdKey: string = ret || cmd;
        cmdKey += '_' + sn;

        console.log(
          `%c[ArkSocketClient]%c[${sys ? sys : 'undefined'}]%c ReceiveSocketCmd %c${cmd ? cmd : 'undefined'}`,
          'background:darkgreen',
          'color:orange',
          'color:cyan',
          'color:orange',
          cmdData
        );
        //cmd return
        if (this.cmdCallbackDic.hasOwnProperty(cmdKey)) {
          const [callback, startTime] = this.cmdCallbackDic[cmdKey];
          const processTimeMs: number = new Date().getTime() - startTime;

          if (callback) {
            callback(socketResult.ok, data, ret, sn, sys, cmd, processTimeMs);
            delete this.cmdCallbackDic[cmdKey];
          }
        }
        //server send cmd
        else if (sys.length > 0) {
          if (this._systemDict.hasOwnProperty(sys)) {
            const system = this._systemDict[sys];
            const callback = system.cmdDict[cmd];
            if (callback) callback(socketResult.ok, data, ret, sn, sys, cmd);
          }
        }
      };
      //onClose
      this.socketClient.onclose = evt => {
        this.close(false, evt);
      };
      //onError
      this.socketClient.onerror = evt => {
        console.error(
          '[ArkSocketClient] ConnectSocket Unidentified websocket error.'
        );

        if (this.errorEvent) this.errorEvent(this, evt);
        this.close(false, evt);
      };
    } catch (error) {
      console.error(
        '[ArkSocketClient] ConnectSocket websocket is unavailable, ip: %s, port: %s.',
        ip,
        port
      );

      if (this.errorEvent) this.errorEvent(this, error as Event);
      this.close();
    }
  }

  public close(isGameClose = false, evt: Event = null) {
    this._isConnect = false;

    if (this.keepAliveFunc !== null) clearInterval(this.keepAliveFunc);
    this.keepAliveFunc = null;

    if (this.socketClient !== null) {
      try {
        this.socketClient.close();
      } catch (error) {
        console.error('[ArkSocketClient] socket close error.', error);

        if (this.errorEvent) this.errorEvent(this, error as Event);
      }
    }
    this.socketClient = null;

    this.openEvent = null;
    this.messageEvent = null;
    if (!isGameClose && this.closeEvent !== null) {
      this.closeEvent(this, evt);
    }
    this.closeEvent = null;
    this.errorEvent = null;
  }

  public async sendCmd(
    cmdId: string,
    cmdName: string,
    cmdData?: JSON,
    callback?: (
      result: number,
      data: JSON,
      ret: string,
      sn: number,
      sys: string,
      cmd: string,
      processTimeMs?: number
    ) => void
  ) {
    try {
      if (!this._isConnect) {
        console.error(
          '[ArkSocketClient] Socket is close, cmdId: %s, cmdName: %s.',
          cmdId,
          cmdName
        );

        if (callback)
          callback(socketResult.notReset, null, cmdName, 0, cmdId, cmdName);
      } else {
        const sn: string = ArkClient.getSn();
        const jsonObj = {
          sys: cmdId,
          cmd: cmdName,
          sn: sn,
        };
        if (cmdData) jsonObj['data'] = cmdData;

        const packageSize: number = JSON.stringify(jsonObj).length;
        let strPackageSize = '';
        for (
          let i = packageSize.toString().length;
          i < this.bufferSize.toString().length;
          i++
        ) {
          strPackageSize = '0' + strPackageSize;
        }
        strPackageSize += packageSize.toString();

        if (callback) {
          const cmdKey: string = cmdName + '_' + sn;
          this.cmdCallbackDic[cmdKey] = [callback, new Date().getTime()];

          //cmd timeout
          setTimeout(
            cmdKey => {
              if (!this.cmdCallbackDic.hasOwnProperty(cmdKey)) return;

              const [callback, startTime] = this.cmdCallbackDic[cmdKey];
              const processTimeMs: number = new Date().getTime() - startTime;

              if (callback) {
                callback(
                  socketResult.timeout,
                  {},
                  cmdName,
                  sn,
                  cmdId,
                  cmdName,
                  processTimeMs
                );
                delete this.cmdCallbackDic[cmdKey];
              }
            },
            this.cmdTimeout * 1000,
            cmdKey
          );
        }

        this.socketClient.send(strPackageSize + JSON.stringify(jsonObj));
      }
    } catch (error) {
      console.error('[ArkSocketClient] SendCmd error.', error);

      if (callback)
        callback(socketResult.error, null, cmdName, 0, cmdId, cmdName);

      if (this.errorEvent) this.errorEvent(this, error as Event);
    }
  }

  protected onAuth(result: number, data: JSON) {
    const status: number = data['status'];
    if (result !== socketResult.ok && status !== HttpResult.OK) {
      console.warn('[ArkSocketClient] socket auth fail');

      this.close();
    } else {
      if (this.openEvent !== null) this.openEvent(this);
      this.openEvent = null;

      //send Alive
      const aliveFunc = () => {
        this.sendCmd(null, 'alive');
      };
      this.keepAliveFunc = setInterval(
        aliveFunc.bind(this),
        this.aliveTimeout * 1000
      );
    }
  }
}
