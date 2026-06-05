import lifeServiceProto from './lifeServiceProto/lifeService.js';

//TODO: lifeServiceProto介面完善

class InitInfo {
  private _userId = '';
  public get userId(): string {
    return this._userId;
  }
  private _aid = 0;
  public get aid(): number {
    return this._aid;
  }
  private _gameId = '';
  public get gameId(): string {
    return this._gameId;
  }
  private _token = '';
  public get token(): string {
    return this._token;
  }
  private _apiId = 0;
  public get apiId(): number {
    return this._apiId;
  }
  private _route = 1;
  public set route(v: number) {
    this._route = v;
  }
  constructor(aid: number, gameId: string, token: string, apiId: number) {
    this._aid = aid;
    this._gameId = gameId;
    this._token = token;
    this._apiId = apiId;
  }
}

const HEART_BEAT_TYPE = -1;

export default class MacrossSocketClient {
  private _socketClient: WebSocket = null;
  private _platformDomain = '';
  private _startKeepLive = false;
  public onErrorCallback: Function = null;
  public onCloseCallBack: Function = null;

  constructor(
    platformDomain: string,
    aid: number,
    gameId: string,
    token: string,
    apiId: number
  ) {
    this._platformDomain = this.replaceUrlSchema(platformDomain);
    this._initInfo = new InitInfo(aid, gameId, token, apiId);
  }

  public connect() {
    console.log(
      '[MacrossSocketClient]_Connect:',
      `${this._platformDomain}/lifeservice/ws2`
    );
    this._socketClient = new WebSocket(
      `${this._platformDomain}/lifeservice/ws2`
    );
    this._socketClient.onopen = this.onOpen.bind(this);
    this._socketClient.onmessage = this.onMessage.bind(this);
    this._socketClient.onclose = this.onClose.bind(this);
    this._socketClient.onerror = this.onError.bind(this);
  }

  private replaceUrlSchema(platformDomain) {
    if (platformDomain.startsWith('https://'))
      return platformDomain.replace('https://', 'wss://');
    else if (platformDomain.startsWith('http://'))
      return platformDomain.replace('http://', 'ws://');
    else return platformDomain;
  }

  private onOpen(ev: Event) {
    console.log('[onOpen]ev: ', ev);
    this.init();
    if (!this._startKeepLive) {
      this._startKeepLive = true;
      this.sendAliveMsg();
    }
  }

  private onMessage(message: MessageEvent) {
    console.log('[onMessage]ev: ', message.data);
  }

  private onClose(ev: CloseEvent) {
    console.warn('[onClose]ev: ', ev);
    if (this.onCloseCallBack) {
      this.onCloseCallBack();
    }
    this.socketReset();
  }

  private onError(error: Event) {
    console.error('[onError]ev: ', error);
    if (this.onErrorCallback) {
      this.onErrorCallback();
    }
    this.socketReset();
  }

  private socketReset() {
    this._startKeepLive = false;
  }

  private _initInfo: InitInfo = null;

  private init() {
    const req: lifeServiceProto.lifeServiceProto.LifeServiceInitInfo =
      new lifeServiceProto.lifeServiceProto.LifeServiceInitInfo();
    req.accountID = this._initInfo.aid;
    req.gameID = Number(this._initInfo.gameId);
    req.apiID = this._initInfo.apiId;
    req.userID = this._initInfo.userId;
    req.route = this._initInfo.route;
    req.token = this._initInfo.token;
    const w = lifeServiceProto.lifeServiceProto.LifeServiceInitInfo.encode(req);
    const data = w.finish();
    this._socketClient.send(data);
  }

  private sendAliveMsg() {
    setInterval(() => {
      if (
        !this._socketClient ||
        this._socketClient.readyState !== this._socketClient.OPEN
      )
        return;
      const date: Date = new Date();
      const year = date.getUTCFullYear();
      const mon = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const hour = date.getUTCHours();
      const min = date.getUTCMinutes();
      const sec = date.getUTCSeconds();
      const req = {
        cmdType: HEART_BEAT_TYPE,
        content: {
          currentDatetime:
            year + '/' + mon + '/' + day + ' ' + hour + ':' + min + ':' + sec,
        },
      };
      this._socketClient.send(JSON.stringify(req));
    }, 7 * 1000);
  }
}
