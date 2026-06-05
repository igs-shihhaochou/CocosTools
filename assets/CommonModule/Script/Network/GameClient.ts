import {UrlParameterFormat} from '../Type/CommonDefine';
import {PlatformData} from '../Define/PlatformData';
import Functions from '../Utility/Functions';
import ArkClient from './ArkSDK/ArkClient';
import ArkSocketClient from './ArkSDK/ArkSocketClient';
import BaseArkSystem, {ReturnCommandData} from './System/BaseArkSystem';
import {HttpResult} from './ArkSDK/Utitlity/HttpConnect';
import MacrossClient from './Macross/MacrossClient';
import BQLogger from '../Log/BQLog/BQLogger';
import EventManager from '../Manager/EventManager';
import BackpackManager from '../Manager/BackpackManager';
import GameErrorCode, {ErrorCodeMapping} from '../Core/GameErrorCode';
import {PlatformGDK} from '../Platform/PlatformGDK';
import {sys} from 'cc';
import {getIp} from '../Utility/GetIP';
import {Delegate} from '../ExtraType';
import GAHandler from '../Log/GA/GAHandler';

/** Cookie鍵值 */
const CookieKey = {
  KIOSK_ID: 'ki',
  LINE_CODE: 'lc',
  THIRD_PARTY_NAME: 'tpn',
  NICK_NAME: 'nn',
  USER_ID: 'ui',
  API_TOKEN: 'apit',
  ARK_ID: 'ai',
  ARK_TOKEN: 'at',
  ARK_KEY: 'ak',
  SERVER_ADDRESS: 'sa',
};

/** 裝置類型列舉 */
enum enumDeviceType {
  GT_PC = 0,
  GT_ANDROID = 100,
  GT_IOS = 200,
  APP_ANDROID = 101,
  APP_IOS = 201,
  APP_OTHER = 401,
  H5_ANDROID = 102,
  H5_IOS = 202,
  H5_PC = 302,
  H5_OTHER = 402,
}

/** 登入來源類型列舉 */
export enum enumFromType {
  Common = 'bcompany', //預設值
  Macross = 'macross', //macross登入預設值
  Joya = 'Joya',
  Api = 'webgl',
}

/** 跟平台要domain API */
interface CmdData {
  apiId: number;
  currency: string;
  siteName: string;
  serviceType: string | string[];
  failDomain: string[];
}

const globalKey = 'gameClient';

export default class GameClient {
  /** 取得 Singleton 物件實體 */
  public static get instance(): GameClient {
    if (!window[globalKey]) {
      window[globalKey] = new GameClient();
    }
    return window[globalKey];
  }

  /** ArkClient實體 */
  public static get arkClient(): ArkClient {
    if (GameClient._instance && GameClient._instance.mainArkClient)
      return GameClient._instance.mainArkClient;
    return null;
  }

  /** ArkSocketClient實體 */
  public static get arkSocketClient(): ArkSocketClient {
    if (GameClient.instance) return GameClient.instance.arkSocketClient;
    return null;
  }

  /** Instance 實體 */
  protected static get _instance(): GameClient {
    return window[globalKey];
  }
  protected static set _instance(instance: GameClient) {
    window[globalKey] = instance;
  }

  /** 登入並取得玩家資訊事件Callback */
  protected onUserLoginCallback: Function = null;

  /** 是否為手動模式 */
  private isManualMode = false;
  /** 是否為除錯模式 */
  private isDebugMode = false;

  /** 是否自動刷新資產 */
  private isAutoRefresh = false;
  /** 自動刷新資產間隔時間(s) */
  private refreshInterval = 0;
  /** 刷新資產計時器 */
  private refreshAssetTimer = -1;

  /** url參數資訊 */
  private urlInfo: UrlInfo = null;

  /** 遊戲位址列表 (首位必為主Server) */
  private gameUrlList: Array<string> = [];
  /** 主ArkClient */
  private mainArkClient: ArkClient = null;
  /** ArkClient清單 Http連線 */
  private arkClientDictionary: ArkClientCollection = null;
  /** ArkSocketClient Socket連線 */
  private arkSocketClient: ArkSocketClient = null;
  /** Client IP */
  private clientIP = '';

  /** 第三方來源類型 */
  private thirdPartyFromType: enumFromType = enumFromType.Common;
  /** ExtraData追加參數 */
  private additionExtraData: Object = null;

  /** 使用者網路協定請求標頭 */
  private userAgent = null;

  /** 網路命令 */
  private networkCommand: Network.DataInterface.NetworkCommand =
    Network.CommandSource.API;

  /** 初始化完成事件Callback */
  private onInitCompleteCallback: Function = null;
  /** Socket連線完成事件Callback */
  private onSocketConnectedCallback: Function = null;
  /** Socket Close事件Callback */
  public onSocketCloseCallback: Delegate = new Delegate();

  /** 空的ArkClient清單 Http連線 */
  private pureArkClientDictionary: ArkClientCollection = {};

  private allFailedDomainList: string[] = [];

  constructor() {
    GameClient._instance = this;
  }

  /**
   * 初始化GameClient
   * 未執行玩家登入流程
   * @param onInitCompleteCallback
   * @param isManual 是否為手動模式
   * @param isDebug 是否為除錯模式
   */
  public init(
    onInitCompleteCallback: Function,
    isManual = false,
    isDebug = false
  ) {
    if (this.onInitCompleteCallback !== null) return;

    this.isManualMode = isManual || false;
    this.isDebugMode = isDebug || false;

    //預設啟用自動同步資產
    this.isAutoRefresh = true;
    //未取得Server的同步資產發送間隔 預設為0
    this.refreshInterval = 0;
    this.refreshAssetTimer = -1;
    //@ts-expect-error GlobalUserAgent
    this.userAgent = GlobalUserAgent.getResult();

    this.onInitCompleteCallback = onInitCompleteCallback;

    //取得IP
    this.getIP();
  }

  /**
   * 釋放GameClient資源
   */
  public release() {
    this.urlInfo = null;

    if (this.gameUrlList !== null) {
      for (const idx in this.gameUrlList) {
        delete this.gameUrlList[idx];
      }
    }
    this.gameUrlList = null;
    this.mainArkClient = null;
    if (this.arkClientDictionary !== null) {
      for (const idx in this.arkClientDictionary) {
        delete this.arkClientDictionary[idx];
      }
    }
    this.arkClientDictionary = null;
    this.arkSocketClient = null;

    this.userAgent = null;

    this.networkCommand = null;

    this.onInitCompleteCallback = null;
    this.onUserLoginCallback = null;
    this.onSocketConnectedCallback = null;

    clearInterval(this.refreshAssetTimer);
    this.refreshAssetTimer = -1;

    GameClient._instance = null;
  }

  /**
   * 取得一個空的arkclient(為了不影響登入流程)
   * */
  public getPureArkClient(
    gameUrl: string | Array<string>,
    siteIndex: number
  ): ArkClient {
    console.log(`[GameClient] getPureArkClient gameUrl: ${gameUrl.toString()}`);

    //處理遊戲連線資訊
    this.handleGameUrl(gameUrl);
    //開始取得ArkClient
    console.log(
      `[GameClient] getPureArkClient gameUrlList: ${this.gameUrlList.toString()}`
    );

    for (const gameUrl of this.gameUrlList) {
      if (!this.pureArkClientDictionary[gameUrl]) {
        this.pureArkClientDictionary[gameUrl] = new ArkClient(gameUrl);
      }
    }
    if (typeof gameUrl === 'string') {
      console.log(
        `[GameClient] getPureArkClient gameUrl is string: ${gameUrl}`
      );
      //return this.pureArkClientDictionary[gameUrl];
      return this.pureArkClientDictionary[this.gameUrlList[siteIndex]];
    } else {
      console.log(
        `[GameClient] getPureArkClient gameUrl not string: ${gameUrl}`
      );
      return this.pureArkClientDictionary[this.gameUrlList[siteIndex]];
    }
  }

  /**
   * 初始化ArkClient
   * 執行玩家登入流程
   * @param gameUrl 支援字串陣列格式 自動轉換至對應URL參數的Server位址 ex: "site1,site2"
   * @param onUserLoginCallback
   * @param isManual
   * @param isDebug
   */
  public initArkClient(
    gameUrl: string | Array<string>,
    onUserLoginCallback: Function
  ) {
    //使用者登入完成事件回呼函式
    this.onUserLoginCallback = onUserLoginCallback;
    //處理遊戲連線資訊
    this.handleGameUrl(gameUrl);
    //開始初始化ArkClient
    console.log(
      `[GameClient] initArkClient gameUrl: ${this.gameUrlList.toString()}, isManual: ${this.isManualMode}, isDebug: ${this.isDebugMode}`
    );
    //未連上Server
    if (GameClient.arkClient === null) {
      //建立arkClient清單 (主Server之外為預建立)
      this.arkClientDictionary = {};
      for (const gameUrl of this.gameUrlList) {
        if (!this.arkClientDictionary[gameUrl])
          this.arkClientDictionary[gameUrl] = new ArkClient(gameUrl);
      }
      //首位為主ArkClient
      this.mainArkClient = this.arkClientDictionary[this.gameUrlList[0]];
      //檢查Cookie資訊
      this.checkLoginCookie();
      //取得Cookie資訊
      const cookieUserID: string = Functions.getCookie(CookieKey.USER_ID);
      //取得外部Ark資訊
      const inputArkID: string =
        Functions.getCookie(CookieKey.ARK_ID) || PlatformData.aID;
      const inputArkToken: string =
        Functions.getCookie(CookieKey.ARK_TOKEN) || PlatformData.aToken;
      //Cookie儲存的userID及apiToken相同 並且Ark欄位都有值就讀Cookie資訊
      if (
        (cookieUserID === PlatformData.uID ||
          cookieUserID === this.urlInfo.devAccount ||
          cookieUserID === this.getDeviceUID) &&
        Functions.getCookie(CookieKey.API_TOKEN) === PlatformData.token &&
        !Functions.isNullOrEmpty(inputArkID) &&
        !Functions.isNullOrEmpty(inputArkToken) &&
        this.getThirdPartyFromType() !== enumFromType.Api
      ) {
        console.log(
          '[GameClient] initArkClient Get Cookie, skip Login',
          this.mainArkClient
        );
        //Ark資訊記錄
        this.mainArkClient.arkId = inputArkID;
        this.mainArkClient.arkToken = inputArkToken;
        this.mainArkClient.arkKey = Functions.getCookie(CookieKey.ARK_KEY);
        //各ArkClient同步Ark資訊
        for (const gameUrl in this.arkClientDictionary) {
          this.arkClientDictionary[gameUrl].clone(this.mainArkClient);
        }
        //完成登入事件的EventLog
        //@ts-expect-error eventlog
        EventLog.SendGameFlow(EventLog.GameFlow.OnLoginFinished);
        //開始取得玩家資訊
        this.startGetUserInfo();
      } else {
        //開始登入流程
        this.startLogin();
      }
    } else {
      //有Server但是沒有初始化過
      // eslint-disable-next-line camelcase
      const retCmdData: ReturnCommandData = {cmd_data: {}};
      this.onLogin(HttpResult.OK, retCmdData);
    }
  }

  public addArkClient(serverUrl: string | Array<string>) {
    //非連線模式
    if (!this.gameUrlList || this.gameUrlList[0] === '') {
      console.warn(
        '[GameClient] addArkClient gameUrl is null or empty, ignore AddArkClient'
      );
      return;
    }
    let connectUrl: Array<string>;
    //處理為遊戲位址列表
    if (typeof serverUrl === 'string')
      connectUrl = serverUrl.replace(' ', '').split(',');
    if (Array.isArray(serverUrl)) connectUrl = serverUrl;
    //非連線模式
    if (!connectUrl || connectUrl[0] === '') {
      console.warn('[GameClient] addArkClient gameUrl is null or empty');
      return;
    }

    this.convertSiteToUrl(connectUrl);

    //建立arkClient清單 (主Server之外為預建立)
    for (const gameUrl of connectUrl) {
      if (!this.arkClientDictionary[gameUrl]) {
        this.arkClientDictionary[gameUrl] = new ArkClient(gameUrl);
        this.gameUrlList.push(gameUrl); //同步回gameUrlList上
      }
    }

    //各ArkClient同步Ark資訊
    for (const gameUrl in this.arkClientDictionary) {
      this.arkClientDictionary[gameUrl].clone(this.mainArkClient);
    }
  }

  /**
   * 初始化ArkSocketClient
   * @param ip
   * @param port
   * @param isWebSocketSecure
   * @param onSocketConnected
   * @param serverIndex
   */
  public initArkSocketClient(
    ip: string,
    port: number,
    isWebSocketSecure: boolean,
    onSocketConnected: Function,
    serverIndex = 1
  ) {
    const arkClient: ArkClient = this.getArkClientByIndex(serverIndex);
    if (arkClient === null) {
      console.warn(
        '[GameClient] initArkSocketClient arkClient is null, serverIndex:',
        serverIndex
      );
      return;
    }
    console.log(
      '[GameClient] initArkSocketClient ip: %s, port: %s, secure: %s, by serverIndex: %s, arkClient:',
      ip,
      port,
      isWebSocketSecure,
      serverIndex,
      arkClient
    );

    //Socket連接完成事件回呼函式
    this.onSocketConnectedCallback = onSocketConnected;
    //創建ArkSocketClient實體
    this.arkSocketClient = new ArkSocketClient(arkClient, 1024, 30);
    //建立Socket連線
    this.arkSocketClient.connectSocket(
      ip,
      port,
      isWebSocketSecure,
      this.onOpen.bind(this),
      this.onMsg.bind(this),
      this.onClose.bind(this),
      this.onError.bind(this)
    );
  }

  /**
   * 中斷Socket連線
   * @param isGameClose 是否由遊戲中呼叫，不是的話，中斷時會出現錯誤視窗
   */
  public closeArkSocketClient(isGameClose = false) {
    if (this.arkSocketClient) {
      this.arkSocketClient.close(isGameClose);
      this.onSocketConnectedCallback = null;
    }
  }

  /**
   * 設定第三方來源類型
   * @param type
   */
  public setThirdPartyFromType(type: enumFromType) {
    this.thirdPartyFromType = type;
    PlatformData.instance.thirdPartyFromType = type;
  }

  /**
   * 取得第三方來源類型
   * @param type
   */
  public getThirdPartyFromType() {
    return this.thirdPartyFromType;
  }

  /**
   * 設定ExtraData追加內容
   * (此設定將與原內容合併)
   * @param data
   */
  public setAdditionExtraData(data: Object) {
    this.additionExtraData = data;
    console.log('[GameClient] additional extradata:', data);
  }

  /**
   * 設置HttpSystem 附加ArkClient至指定HttpSystem進行命令收發
   * @param system
   * @param serverIndex
   */
  public setupHttpSystem(system: BaseArkSystem, serverIndex = 1) {
    const arkClient: ArkClient = this.getArkClientByIndex(serverIndex);
    if (arkClient === null) {
      console.warn(
        '[GameClient] setupHttpSystem arkClient is null, serverIndex:',
        serverIndex
      );
      return;
    }
    console.warn(
      '[GameClient] setupHttpSystem by serverIndex: %s, arkClient:',
      serverIndex,
      arkClient
    );

    system.setupHttpClient(arkClient);
  }

  /**
   * 設置SocketSystem 附加ArkSocketClient至指定SocketSystem進行命令收發
   * @param system
   */
  public setupSocketSystem(system: BaseArkSystem) {
    if (this.arkSocketClient === null) {
      console.warn('[GameClient] setupSocketSystem arkSocketClient is null');
      return;
    }

    system.setupSocketClient(this.arkSocketClient);
  }

  /**
   * 自動刷新資產
   * @param isActive
   */
  public autoRefreshAsset(isActive = true) {
    console.warn('[GameClient] autoRefreshAsset:', isActive);

    this.isAutoRefresh = isActive;

    clearInterval(this.refreshAssetTimer);
    this.refreshAssetTimer =
      isActive && this.refreshInterval > 0
        ? setInterval(
            this.sendGetAssetCmd.bind(this),
            this.refreshInterval * 1000
          )
        : -1;
  }

  /**
   * 由Server列表的索引取得ArkClient
   * @param serverIndex
   */
  public getArkClientByIndex(serverIndex: number): ArkClient {
    if (
      !this.arkClientDictionary ||
      !this.gameUrlList ||
      Object.keys(this.arkClientDictionary).length === 0 ||
      this.gameUrlList.length === 0
    ) {
      console.warn(
        '[GameClient] getArkClientByIndex arkClientDictionary/gameUrlList is null or empty, serverIndex:',
        this.arkClientDictionary,
        this.gameUrlList,
        serverIndex
      );
      return null;
    }

    serverIndex = this.gameUrlList.length === 1 ? 0 : serverIndex;
    const arkClient: ArkClient =
      this.arkClientDictionary[this.gameUrlList[serverIndex]];
    if (arkClient === null)
      console.warn(
        '[GameClient] getArkClientByIndex arkClient is null, by serverIndex:',
        serverIndex,
        this.arkClientDictionary,
        this.gameUrlList
      );

    return arkClient;
  }

  /**
   * 由Server列表的索引取得ArkClient
   * @param serverIndex
   */
  public getArkClientByUrl(gameUrl: string): ArkClient {
    if (
      !this.arkClientDictionary ||
      !this.gameUrlList ||
      Object.keys(this.arkClientDictionary).length === 0 ||
      this.gameUrlList.length === 0
    ) {
      console.warn(
        '[GameClient] getArkClientByIndex arkClientDictionary/gameUrlList is null or empty, arkClientDictionary:',
        this.arkClientDictionary,
        ' gameUrlList:',
        this.gameUrlList,
        'gameUrl:',
        gameUrl
      );
      return null;
    }

    const arkClient: ArkClient = this.arkClientDictionary[gameUrl];
    if (arkClient === null)
      console.warn(
        '[GameClient] getArkClientByIndex arkClient is null, by gameUrl:',
        gameUrl,
        this.arkClientDictionary,
        this.gameUrlList
      );

    return arkClient;
  }

  /**
   * 開始取得玩家資訊
   */
  protected startGetUserInfo() {
    //手動登入則略過取得玩家資訊命令 由專案自行發送
    if (this.isManualMode) {
      if (this.onUserLoginCallback !== null) {
        this.onUserLoginCallback();
        this.onUserLoginCallback = null;
      }
      //發送取得資產設定命令
      this.sendGetAssetSettingCmd();
    } else {
      const {haveGetUserInfoCmd} = PlatformData.instance;
      // GetUserInfo 和 GetAssetSetting 並行發送（互不依賴）
      this.sendGetAssetSettingCmd();
      //傳送取得玩家資訊命令
      if (haveGetUserInfoCmd) {
        this.sendGetUserInfoCmd();
      } else {
        //TODO: 環境判斷流程優化
        if (PlatformData.isSSEnv) {
          this.ssProcess();
          return;
        }
        if (PlatformData.isDaraEnv) {
          this.joyaProcess();
          return;
        }
        throw new Error('[GameClient] no logo found');
      }
    }
  }

  /**
   * 處理遊戲連線資訊
   * */
  public handleGameUrl(gameUrl: string | Array<string>) {
    this.getUrlInfo();
    // domain優化 不需要直接return
    if (!PlatformData.site?.trim()) {
      return;
    }
    //處理為遊戲位址列表
    if (typeof gameUrl === 'string')
      this.gameUrlList = gameUrl.replace(' ', '').split(',');
    if (Array.isArray(gameUrl)) this.gameUrlList = gameUrl;
    //非連線模式
    if (!this.gameUrlList || this.gameUrlList[0] === '') {
      console.warn(
        '[GameClient] initArkClient gameUrl is null or empty, ignore GameClient'
      );

      this.onUserLoginCallback();
      return;
    }

    this.convertSiteToUrl(this.gameUrlList);

    PlatformData.lobbyDomain = this.gameUrlList[0];
  }

  /**
   * 檢查登入的Cookie資訊
   */
  private checkLoginCookie() {
    console.log(
      '[GameClient] checkLoginCookie before:\n-',
      document.cookie.replace(/;/g, '\n-')
    );
    //若連線位址相異 清除Cookie資訊並更新Cookie連線位址
    const cookieServerAddress: string = Functions.getCookie(
      CookieKey.SERVER_ADDRESS
    );
    if (cookieServerAddress !== this.mainArkClient.gameUrl) {
      console.log(
        '%c[GameClient] checkLoginCookie: different server address, clear cookie, update server address:',
        'color:yellow;background:black',
        cookieServerAddress
      );
      //清除Cookie
      this.clearCookie();
      Functions.setCookie(
        CookieKey.SERVER_ADDRESS,
        this.mainArkClient.gameUrl,
        30
      );
    }
    //若非使用UrlArk資訊的UID變更 或 使用UrlArk資訊卻有UID 清除Cookie資訊
    const isUrlArkInfo: boolean = !!PlatformData.aID && !!PlatformData.aToken;
    const cookieUserID: string = Functions.getCookie(CookieKey.USER_ID);
    const compareUID: string =
      PlatformData.uID || this.urlInfo.devAccount || this.getDeviceUID;
    console.log(
      '[GameClient] checkLoginCookie\ncookieUserID:',
      cookieUserID,
      '\ncompareUID:',
      compareUID,
      '\nUrlArkInfo && cookieUserID:',
      isUrlArkInfo
    );
    if (
      (!isUrlArkInfo && cookieUserID !== compareUID) ||
      (isUrlArkInfo && cookieUserID)
    ) {
      console.log(
        '%c[GameClient] checkLoginCookie: different user id, clear cookie',
        'color:yellow;background:black'
      );
      //清除Cookie
      this.clearCookie();
    }
    //若URL的Ark資訊非空值 且ArkToken與Cookie相異 更新為最新資訊
    const cookieArkID: string = Functions.getCookie(CookieKey.ARK_ID);
    const cookieArkToken: string = Functions.getCookie(CookieKey.ARK_TOKEN);
    if (
      !Functions.isNullOrEmpty(PlatformData.aID) &&
      !Functions.isNullOrEmpty(PlatformData.aToken) &&
      PlatformData.aToken !== cookieArkToken
    ) {
      console.log(
        '%c[GameClient] checkLoginCookie: %supdate ark info',
        'color:yellow;background:black',
        cookieArkToken ? 'different ark info, ' : '',
        cookieArkID,
        cookieArkToken
      );
      //更新Ark資訊
      Functions.setCookie(CookieKey.ARK_ID, PlatformData.aID, 30);
      Functions.setCookie(CookieKey.ARK_TOKEN, PlatformData.aToken, 30);
      Functions.setCookie(CookieKey.ARK_KEY, '', 0);
    }
    console.log(
      '[GameClient] checkLoginCookie after:\n-',
      document.cookie.replace(/;/g, '\n-')
    );
  }

  /**
   * 登入
   */
  private startLogin() {
    console.log('[GameClient] startLogin');
    const {haveGetUuidCmd, usePasswordLogin} = PlatformData.instance;
    const uuid: string = sys.localStorage.getItem('uuid');
    //若無uuid則從ark取得 正常取得則重新導回此流程 異常則視為登入失敗
    if (
      haveGetUuidCmd &&
      (uuid === null || uuid.length === 0) &&
      (this.isDebugMode ||
        Functions.getURLParameterByName('GetUuid') === 'true') &&
      !PlatformData.useApiServer
    ) {
      this.mainArkClient.getUuid(this.onGetUUID.bind(this));
    } else {
      //Debug模式才進行裝置登入
      if (this.isDebugMode && !PlatformData.useApiServer) {
        //開發帳號登入
        const devAccount: string = this.urlInfo.devAccount;
        if (usePasswordLogin && !Functions.isNullOrEmpty(devAccount)) {
          this.devAccountLogin(devAccount);
          return;
        }
        //裝置登入
        if (
          Functions.isNullOrEmpty(PlatformData.uID) ||
          Functions.isNullOrEmpty(PlatformData.token)
        ) {
          this.deviceLogin();
          return;
        }
      }

      switch (PlatformData.logo) {
        case enumFromType.Joya:
          this.setJoyaData();
          break;
        default:
          break;
      }
      //第三方登入
      this.thirdPartyLogin();
    }
  }

  private setJoyaData() {
    const extraData = {
      fromType: MacrossClient.apiId.toString(),
      // eslint-disable-next-line camelcase
      from_id: MacrossClient.aid.toString(),
      // eslint-disable-next-line camelcase
      from_token: MacrossClient.token,
      // eslint-disable-next-line camelcase
      from_type: MacrossClient.apiId.toString(),
      // eslint-disable-next-line camelcase
      game_id: MacrossClient.apiId.toString(),
      // eslint-disable-next-line camelcase
      kiosk_id: MacrossClient.siteId.toString(),
    };
    this.setAdditionExtraData(extraData);
  }

  /**
   * 開發帳號登入
   */
  private devAccountLogin(devAccount: string) {
    console.warn(
      '[GameClient] devAccountLogin, devAccount: %s',
      devAccount,
      this.devLoginExtraData
    );

    this.mainArkClient.customLogin(
      'webgl',
      devAccount,
      devAccount,
      this.onLogin.bind(this),
      this.devLoginExtraData,
      this.devLoginExtraData
    );
  }

  /**
   * 裝置登入
   */
  private deviceLogin() {
    //登入
    this.mainArkClient.deviceLoginInternal(
      sys.isBrowser ? 'webgl' : sys.os.toLowerCase(),
      this.getDeviceUID, //開發模式無MID時會影響MID
      this.onLogin.bind(this),
      this.deviceLoginExtraData,
      this.deviceLoginExtraData
    );

    console.log(
      '[GameClient] deviceLogin DeviceUID:',
      this.getDeviceUID,
      this.deviceLoginExtraData
    );
  }

  /**
   * 第三方登入
   */
  private thirdPartyLogin() {
    console.log(
      '[GameClient] thirdPartyLogin PlatformData.UID: %s, PlatformData.Token: %s',
      PlatformData.uID,
      PlatformData.token,
      this.loginExtraData
    );
    const extraData: Object = Object.assign(
      JSON.parse(JSON.stringify(this.additionExtraData)) ?? {},
      this.loginExtraData
    );
    this.mainArkClient.customLogin(
      this.thirdPartyFromType,
      PlatformData.uID,
      PlatformData.token,
      this.onLogin.bind(this),
      extraData,
      extraData
    );
  }

  /**
   * 取得UUID
   * @param result
   * @param data
   */
  private onGetUUID(result, data: ReturnCommandData) {
    if (result === HttpResult.OK) {
      console.log('[GameClient] onGetUUID');
      sys.localStorage.setItem('uuid', data);
      this.startLogin();
    } else {
      console.log('[GameClient] onGetUUID fail');
      //當作Login失敗處理
      this.onLogin(result, data);
    }
  }

  /**
   * 登入成功
   * @param result
   * @param data
   */
  private onLogin(result, data: ReturnCommandData) {
    try {
      //登入資訊存進cookie
      Functions.setCookie(CookieKey.KIOSK_ID, PlatformData.kioskId, 30);
      Functions.setCookie(CookieKey.LINE_CODE, PlatformData.lineCode, 30);
      Functions.setCookie(CookieKey.NICK_NAME, PlatformData.nickName, 30);
      Functions.setCookie(
        CookieKey.USER_ID,
        PlatformData.uID ||
          (this.isDebugMode
            ? this.urlInfo.devAccount || this.getDeviceUID
            : ''),
        30
      );
      Functions.setCookie(CookieKey.API_TOKEN, PlatformData.token, 30);
      Functions.setCookie(CookieKey.ARK_ID, this.mainArkClient.arkId, 30);
      Functions.setCookie(CookieKey.ARK_TOKEN, this.mainArkClient.arkToken, 30);
      Functions.setCookie(CookieKey.ARK_KEY, this.mainArkClient.arkKey, 30);
      Functions.setCookie(
        CookieKey.SERVER_ADDRESS,
        this.mainArkClient.gameUrl,
        30
      );
      //各ArkClient同步Ark資訊
      for (const gameUrl in this.arkClientDictionary) {
        this.arkClientDictionary[gameUrl].clone(this.mainArkClient);
      }
      console.warn(
        '[GameClient] onLogin set cookie:\n-',
        document.cookie.replace(/;/g, '\n-')
      );
      //Http回應正常且有資料判斷
      if (result === HttpResult.OK && data !== null) {
        console.warn('[GameClient] onLogin: %s', JSON.stringify(data));
        //登入完成事件EventLog
        //@ts-expect-error eventlog
        EventLog.SendGameFlow(EventLog.GameFlow.OnLoginFinished);
        //開始取得玩家資訊
        this.startGetUserInfo();
      } else {
        BQLogger.sendLoginFailed('ArkLogin');
        this.connectErrorHandler('OnLogin', result, data);
      }
    } catch (err) {
      BQLogger.sendLoginFailed('ArkLogin: exception', err);
      this.connectErrorHandler('OnLogin', result, data);
    }
  }

  /**
   * 傳送取得玩家資訊命令
   */
  private sendGetUserInfoCmd() {
    console.log(
      `[GameClient] sendGetUserInfoCmd - cmdID: ${this.networkCommand.GetUserInfo.ID}, cmdName: ${this.networkCommand.GetUserInfo.Name}`
    );
    this.mainArkClient.sendCmd(
      this.networkCommand.GetUserInfo.ID,
      this.networkCommand.GetUserInfo.Name,
      null,
      this.onGetUserInfo.bind(this)
    );
  }

  private ssProcess() {
    if (this.onUserLoginCallback !== null) {
      PlatformData.nickName = GameClient.arkClient.arkId;
      this.onUserLoginCallback();
      this.onUserLoginCallback = null;
    }
  }

  public joyaProcess() {
    const profile = MacrossClient.profile;
    PlatformData.nickName = profile.aid.toString();
    PlatformData.loginName = profile.account;
    PlatformData.kioskId = MacrossClient.siteId.toString();
    PlatformData.lineCode = ''; //TODO: 優化處理流程 設置第三方名稱 (API特規)
    if (this.onUserLoginCallback !== null) {
      this.onUserLoginCallback();
      this.onUserLoginCallback = null;
    }
  }

  public joyaSendGetAsset() {
    this.mainArkClient.sendCmd(
      'CommonSystem',
      this.networkCommand.GetAsset.Name,
      null,
      this.onGetAsset.bind(this)
    );
  }

  /**
   * 取得玩家資訊回應內容的事件處理
   * @param result
   * @param data
   */
  private onGetUserInfo(result, data: ReturnCommandData) {
    //Http回應正常且有資料判斷
    try {
      if (result === HttpResult.OK && data !== null) {
        console.log('[GameClient] onGetUserInfo: %s', JSON.stringify(data));
        //複製Command回應的內容
        const retCmdData: Network.DataInterface.S2C_UserInfo = JSON.parse(
          JSON.stringify(data.cmd_data)
        ) as Network.DataInterface.S2C_UserInfo;

        //設置玩家暱稱及資產
        try {
          PlatformData.nickName = retCmdData.data.ThirdPartyNick;
          PlatformData.loginName = retCmdData.data.ThirdPartyName;
          PlatformData.balance = retCmdData.data.Balance;
          PlatformData.kioskId = '';
          PlatformData.lineCode = retCmdData.data.LineCode;
          //TODO: 優化處理流程 設置第三方名稱 (API特規)
          Functions.setCookie(
            CookieKey.THIRD_PARTY_NAME,
            retCmdData.data.ThirdPartyName,
            30
          );
          GAHandler.Login(PlatformData.loginName);
        } catch (err) {
          PlatformData.nickName = '';
          PlatformData.loginName = '';
          PlatformData.balance = 0;
          console.error('[GameClient] onGetUserInfo data error.', err);
        }
        //GetAssetSetting 已在 startGetUserInfo 中並行發送，不重複發送
        //設置EventLog使用的暱稱
        //@ts-expect-error eventlog
        EventLog.NickName = PlatformData.nickName;
        //玩家登入流程結束
        if (this.onUserLoginCallback !== null) {
          this.onUserLoginCallback();
          this.onUserLoginCallback = null;
        }
        return;
      }
    } catch (err) {
      console.error('[GameClient] onGetUserInfo error:', err);
    }
    //連接錯誤處理
    this.connectErrorHandler('OnGetUserInfo', result, data);
  }

  /**
   * 傳送取得資產設定命令
   * @param retryCount
   */
  private sendGetAssetSettingCmd() {
    console.log(
      `[GameClient] sendGetAssetSettingCmd - cmdID: ${this.networkCommand.GetAssetSetting.ID}, cmdName: ${this.networkCommand.GetAssetSetting.Name}`
    );

    this.mainArkClient.sendCmd(
      this.networkCommand.GetAssetSetting.ID,
      this.networkCommand.GetAssetSetting.Name,
      null,
      this.onGetAssetSetting.bind(this)
    );
  }

  /**
   * 取得資產設定回應內容的事件處理
   * @param result
   * @param data
   */
  private onGetAssetSetting(result, data: ReturnCommandData) {
    let isAutoRefresh = false;
    //Http回應正常且有資料判斷
    try {
      if (result === HttpResult.OK && data !== null) {
        console.log('[GameClient] onGetAssetSetting: %s', JSON.stringify(data));
        //複製Command回應的內容
        const retCmdData: Network.DataInterface.S2C_AssetSetting = JSON.parse(
          JSON.stringify(data.cmd_data)
        ) as Network.DataInterface.S2C_AssetSetting;
        //若Code為0才啟用自動刷新
        if (retCmdData.Code === 0) {
          //自動刷新間隔時間
          this.refreshInterval = Number(retCmdData.Interval) || 5;
          //取得是否自動刷新資產的設定
          isAutoRefresh = this.isAutoRefresh;
        } else {
          //關閉可自動刷新資產的請求間隔
          this.refreshInterval = -1;
          //關閉自動刷新資產
          isAutoRefresh = false;
        }
      }
    } catch (err) {
      this.refreshInterval = -1;
      isAutoRefresh = false;
      console.error('[GameClient] onGetAssetSetting error:', err);
      BQLogger.sendGetServerDataFailed(
        this.networkCommand.GetAssetSetting.Name,
        err
      );
    }
    //設定是否自動刷新資產
    this.autoRefreshAsset(isAutoRefresh);
  }

  /**
   * 傳送取得資產命令
   */
  private sendGetAssetCmd() {
    console.log(
      `[GameClient] sendGetAssetCmd - cmdID: ${this.networkCommand.GetAsset.ID}, cmdName: ${this.networkCommand.GetAsset.Name}`
    );

    this.mainArkClient.sendCmd(
      this.networkCommand.GetAsset.ID,
      this.networkCommand.GetAsset.Name,
      null,
      this.onGetAsset.bind(this)
    );
  }

  /**
   * 取得資產回應內容的事件處理
   * @param result
   * @param data
   */
  private onGetAsset(result, data: ReturnCommandData) {
    //Http回應正常且有資料判斷
    try {
      if (result === HttpResult.OK && data !== null) {
        if (PlatformData.pauseRefreshBalance) {
          console.log(
            '[GameClient] onGetAsset: balance apply skipped (PlatformData.pauseRefreshBalance);'
          );
          return;
        }
        //複製Command回應的內容
        const retCmdData: Network.DataInterface.S2C_Asset = JSON.parse(
          JSON.stringify(data.cmd_data)
        ) as Network.DataInterface.S2C_Asset;
        console.log(
          '[GameClient] onGetAsset: %s',
          JSON.stringify(data),
          retCmdData
        );
        try {
          //資產同步
          if (retCmdData.Code === 0) {
            if (PlatformData.logo === enumFromType.Joya) {
              //todo-與窗暉確認可否統一
              PlatformData.balance = data.cmd_data['Asset']['Coin'];
            } else {
              if (PlatformData.isMacrossEnv) {
                const ts: number = data.cmd_data.ts;
                if (ts <= PlatformData.instance.lastMacrossUpdateBalanceTs)
                  return;
              }
              PlatformData.balance = retCmdData.Coin;
            }

            EventManager.instance.dispatchEvent(
              PlatformData.gameEventName.ASSET_REFRESH,
              PlatformData.balance,
              data.cmd_data.ts
            );
            EventManager.instance.dispatchEvent(
              PlatformData.gameEventName.ASSET_REFRESH_SCOREBOX,
              data
            );
            EventManager.instance.dispatchEvent(
              BackpackManager.backpackEvent.updateBalance,
              PlatformData.balance
            );
          }
        } catch (err) {
          BQLogger.sendGetServerDataFailed(
            this.networkCommand.GetAsset.Name,
            err
          );
          console.error('[GameClient] onGetAsset error:', err);
        }
        return;
      }
    } catch (err) {
      BQLogger.sendGetServerDataFailed(this.networkCommand.GetAsset.Name, err);
      console.error('[GameClient] onGetAsset error:', err);
    }
    //連接錯誤處理 (定時同步的錯誤處理在弱網時太過頻繁 改用錯誤提示)
    console.error('[GameClient] onGetAsset error.', result, data);
    //this.connectErrorHandler("OnGetAsset", result, data);
  }

  /**
   * 連線錯誤處理
   * @param level
   * @param result
   * @param data
   */
  private connectErrorHandler(level: string, result, data: ReturnCommandData) {
    //因可能ArkToken失效 為避免ArkToken重複使用 清除Cookie
    this.clearCookie();

    //回傳資料為空 Server維護中(且非測試帳號)或Token失效
    if (data === null) {
      PlatformGDK.instance.showPopUpMessage.notify(
        GameErrorCode.GetMessage(GameErrorCode.LOGINFAILED_VERIFY_FAILED),
        GameErrorCode.LOGINFAILED_VERIFY_FAILED + '(DN)',
        Functions.closeGame
      );
      console.error(
        '[GameClient] %s: connect error (%s): data is null',
        level,
        result
      );
      return;
    }
    //Token重複使用
    if (result === HttpResult.Condition) {
      PlatformGDK.instance.showPopUpMessage.notify(
        GameErrorCode.GetMessage(GameErrorCode.LOGINFAILED_VERIFY_FAILED),
        GameErrorCode.LOGINFAILED_VERIFY_FAILED,
        Functions.closeGame
      );
      console.error(
        '[GameClient] %s: connect error (%s):',
        level,
        result,
        data
      );
      return;
    }
    //伺服器維護
    if (result !== HttpResult.OK) {
      PlatformGDK.instance.showPopUpMessage.notify(
        GameErrorCode.GetMessage(GameErrorCode.MAINTENANCE),
        GameErrorCode.MAINTENANCE,
        Functions.closeGame
      );
      console.error(
        '[GameClient] %s: connect error (%s):',
        level,
        result,
        data
      );
      return;
    }
  }

  //#region Socket Connect
  //=======================================================
  private onOpen(socketClient: ArkSocketClient) {
    console.log('[GameClient] websocket OnOpen ArkSocketClient:', socketClient);

    if (this.onSocketConnectedCallback !== null)
      this.onSocketConnectedCallback();
  }

  private onMsg() {}

  private onClose(socketClient: ArkSocketClient, error) {
    console.warn('[GameClient] websocket OnClose', error);
    let subMsg = GameErrorCode.UNKNOWN;
    let code = GameErrorCode.UNKNOWN;

    const key = `S${error ? error.reason : ''}`;

    if (key in ErrorCodeMapping) {
      code = ErrorCodeMapping[key as keyof typeof ErrorCodeMapping];
      subMsg = error.reason;
    }

    const showMsg =
      PlatformData.gameConfig.ShowDisconnectedMsg !== undefined
        ? PlatformData.gameConfig.ShowDisconnectedMsg
        : true;
    if (showMsg)
      PlatformGDK.instance.showPopUpMessage.notify(
        GameErrorCode.GetMessage(code),
        subMsg + '(SC)',
        Functions.closeGame,
        undefined,
        false
      );
    BQLogger.sendSocketClose(
      showMsg ? subMsg + '(SC)' : '',
      error?.reason ? `${error.reason}(SC)` : subMsg + '(SC)'
    );
    this.onSocketCloseCallback.notify(error);
  }

  private onError(socketClient: ArkSocketClient, error) {
    console.error('[GameClient] websocket OnError.', error);

    const showMsg =
      PlatformData.gameConfig.ShowDisconnectedMsg !== undefined
        ? PlatformData.gameConfig.ShowDisconnectedMsg
        : true;
    if (showMsg)
      PlatformGDK.instance.showPopUpMessage.notify(
        GameErrorCode.GetMessage(GameErrorCode.UNKNOWN),
        GameErrorCode.UNKNOWN + '(SE)',
        Functions.closeGame,
        undefined,
        false
      );
    BQLogger.sendSocketError(
      showMsg ? showMsg + '(SE)' : '',
      error?.reason ? `${error.reason}(SE)` : GameErrorCode.UNKNOWN + '(SE)'
    );
    this.onSocketCloseCallback.notify(error);
  }
  //=======================================================
  //#endregion Socket Connect

  /**
   * 取得URL參數資訊
   */
  private getUrlInfo() {
    if (this.urlInfo) return;

    this.urlInfo = {};

    const urlObj: UrlParameterFormat = Functions.getURLParameter();
    //連線位址
    this.urlInfo.site = PlatformData.site;
    //是否強制為SSL
    this.urlInfo.isSSL = /1|true/.test(urlObj.isSSL);
    //開發帳號
    if (this.isDebugMode) this.urlInfo.devAccount = urlObj.devAccount;
    //是否為unity來源
    this.urlInfo.unity = urlObj.unity;

    console.log('[GameClient] getUrlInfo:', this.urlInfo);
  }

  /**
   * 取得 Client IP
   */
  private getIP() {
    if (!Functions.isNullOrEmpty(this.clientIP)) return;

    // 非阻塞：立即觸發 callback，IP 在背景取得
    if (this.onInitCompleteCallback) {
      this.onInitCompleteCallback();
      this.onInitCompleteCallback = null;
    }

    //設定timer 超時則將IP設為127.0.0.1
    const timeoutTimer: number = setTimeout(() => {
      if (this.clientIP === '') {
        this.clientIP = '127.0.0.1';
        console.warn('[GameClient] getIP timeout set IP: %s', this.clientIP);
      }
    }, 10000);
    //抓取使用者IP（背景執行）
    try {
      getIp(
        data => {
          this.clientIP = data;
          console.warn('[GameClient] getIP: %s', this.clientIP);
          clearTimeout(timeoutTimer);
        },
        err => {
          console.error(err);
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * 登入額外資訊
   */
  private get loginExtraData(): Object {
    const extraData = {};
    extraData['browser'] = this.userAgent['browser']['name'];
    extraData['browser_version'] = this.userAgent['browser']['version'];
    extraData['os'] = this.userAgent['os']['name'];
    extraData['os_version'] = this.userAgent['os']['version'];
    extraData['game_id'] = PlatformData.gameID;
    extraData['currency'] = PlatformData.currency;
    extraData['trid'] = PlatformData.mID;
    extraData['DeviceType'] = this.getDeviceType;
    return extraData;
  }

  /**
   * 開發登入額外資訊 (測試用)
   */
  private get devLoginExtraData(): Object {
    const extraData = this.loginExtraData;
    extraData['mid'] = PlatformData.mID;
    extraData['linecode'] = 0;
    extraData['nick'] = this.urlInfo.devAccount;
    return extraData;
  }

  /**
   * 裝置登入額外資訊 (測試用)
   */
  private get deviceLoginExtraData(): Object {
    const extraData = this.loginExtraData;
    extraData['mid'] = PlatformData.mID;
    extraData['linecode'] = 0;
    extraData['nick'] =
      'test_' + PlatformData.currency + '_' + PlatformData.mID;
    return extraData;
  }

  /**
   * 取得裝置UID (測試用)
   */
  private get getDeviceUID(): string {
    //測試MID預設為2
    PlatformData.mID = !Functions.isNullOrEmpty(PlatformData.mID)
      ? PlatformData.mID
      : '2';
    //測試UID為 uuid + mid + currency
    return (
      sys.localStorage.getItem('uuid') +
      '-' +
      PlatformData.mID.toLowerCase() +
      '-' +
      PlatformData.currency.toLowerCase()
    );
  }

  /**
   * 取得裝置類型
   */
  private get getDeviceType(): number {
    let deviceType: enumDeviceType = enumDeviceType.GT_PC;
    const os: string = String(this.userAgent['os']['name']).toLowerCase();
    if (this.urlInfo.unity === 'true') {
      switch (os) {
        case 'android':
          deviceType = enumDeviceType.APP_ANDROID;
          break;
        case 'ios':
          deviceType = enumDeviceType.APP_IOS;
          break;
        default:
          deviceType = enumDeviceType.APP_OTHER;
          break;
      }
    } else {
      switch (os) {
        case 'android':
          deviceType = enumDeviceType.H5_ANDROID;
          break;
        case 'ios':
          deviceType = enumDeviceType.H5_IOS;
          break;
        case 'windows':
        case 'mac':
          deviceType = enumDeviceType.H5_PC;
          break;
        default:
          deviceType = enumDeviceType.H5_OTHER;
          break;
      }
    }
    return deviceType;
  }

  /**
   * 清除瀏覽器Cookie
   */
  private clearCookie() {
    console.warn('[GameClient] clearCookie');
    Functions.setCookie(CookieKey.USER_ID, '', 0);
    Functions.setCookie(CookieKey.API_TOKEN, '', 0);
    Functions.setCookie(CookieKey.ARK_ID, '', 0);
    Functions.setCookie(CookieKey.ARK_TOKEN, '', 0);
    Functions.setCookie(CookieKey.ARK_KEY, '', 0);
  }

  // 轉換site# to url
  private convertSiteToUrl(serverUrlList: Array<string>) {
    //URL取得Server位址列表
    const siteListStr: string = this.urlInfo.site;
    let siteList: Array<string> = null;
    if (siteListStr) siteList = siteListStr.split(',');
    //遊戲Server位址通訊協定調整 若遊戲Server位址為"site#" 則嘗試替換為列表對應的Server位址
    let gameUrlStr = '';
    const protocol: string =
      window.location.protocol === undefined
        ? 'https:'
        : window.location.protocol;
    for (const idx in serverUrlList) {
      gameUrlStr = serverUrlList[idx];
      //檢查gameUrl是否為"site#"的格式 取代為指定位址
      if (/^site[\d]+$/.test(gameUrlStr)) {
        const siteNumber = Number(gameUrlStr.replace('site', ''));
        gameUrlStr = ''; //clear
        if (siteList) gameUrlStr = siteList[siteNumber];
        if (Functions.isNullOrEmpty(gameUrlStr))
          console.warn(
            `[GameClient] initArkClient get site number ${siteNumber} fail, please check url parameters`
          );
      }
      //檢查gameUrl是否為http通訊協定起始的格式 若無則附加https
      if (gameUrlStr && !/^http[s]?:\/\//.test(gameUrlStr))
        gameUrlStr = 'https://' + gameUrlStr;
      //TODO: 全面採用SSL時移除此判斷 改強制https
      if (this.urlInfo.isSSL || protocol === 'https:')
        gameUrlStr = gameUrlStr.replace('http:', 'https:');
      serverUrlList[idx] = gameUrlStr;
    }

    return serverUrlList;
  }

  /** 取得平台所有可用的 service domain 對應表 */
  public async getServiceDomains(
    serverUrlList: string[],
    customDomainPlatform?: string
  ): Promise<string[]> {
    const urlParams = this.getURLParameter();

    // 安全取得並處理 domain_platform 參數
    const domainPlatformParam = urlParams['domain_platform'];

    let platformDomain = null;
    if (!domainPlatformParam && !customDomainPlatform) {
      throw new Error(
        '[getServiceDomains] 缺少必要網址參數 domain_platform，無法取得平台 domain。'
      );
    }
    if (customDomainPlatform) {
      platformDomain = customDomainPlatform;
    } else {
      platformDomain = decodeURIComponent(
        domainPlatformParam.split('').reverse().join('')
      );
    }

    const apiUrl = platformDomain + '/gs/GetServiceDomain';
    const serviceTypes = serverUrlList.filter(Boolean);

    const cmdData: CmdData = {
      apiId: Number(urlParams['apiId']),
      currency: urlParams['currency'] || '',
      siteName: PlatformData.siteName || '',
      serviceType: serviceTypes,
      failDomain: [],
    };

    console.log('[InitGameClient] :', apiUrl);
    console.log('[InitGameClient] cmdData:', cmdData);

    // 呼叫平台 API 取得 DomainList
    const response = await this.sendAPI<{DomainList: string[]}>(
      apiUrl,
      cmdData
    );
    let domainList = response.DomainList || [];

    console.log('[InitGameClient] responseAPI :', response);
    //**BQ埋點 */
    BQLogger.sendGetGameDomainListFinish();

    // 執行 domain 可用性檢查與自動重試
    const retryCountRef = {count: 0};
    domainList = await this.checkDomainList(serviceTypes, domainList);
    //**BQ埋點 */
    BQLogger.sendGetGameDomainListRetryFinish(retryCountRef.count);

    // 替換 this.gameUrlList
    this.gameUrlList = domainList.map(domain => {
      return /^http/.test(domain) ? domain : 'https://' + domain;
    });
    return this.gameUrlList;
  }
  /** 取得平台所有可用的 domain */
  private async sendAPI<T>(url: string, data): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        //throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[sendAPI] Platform Fetch Failed:', error);
      throw error;
    }
  }
  /** Url處理 */
  private getURLParameter(): Record<string, string> {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    const queryString: Record<string, string> = {};

    for (const param of vars) {
      const pair = param.split('=');
      queryString[pair[0]] = decodeURIComponent(pair[1]);
    }

    return queryString;
  }
  /** Domain連線驗證 */
  private async checkDomain(domain: string): Promise<void> {
    const url = `https://${domain}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5秒超時

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeout);
      console.log('HTTP error! Status: ${response.status}  ' + error);
      throw error;
    }
  }
  /** 檢查整體 domain list，回傳失敗的 serviceType 與對應 domain */
  private async checkDomainList(
    serviceTypes: string[],
    domainList: string[],
    retryCountRef?: {count: number}
  ): Promise<string[]> {
    const failedTypes: string[] = [];
    const failedDomains: string[] = [];

    await Promise.all(
      serviceTypes.map(async (type, index) => {
        const domain = domainList[index];
        if (!type || type === 'redirect') return;
        if (!domain) return;
        try {
          await this.checkDomain(domain);
        } catch {
          failedTypes.push(type);
          failedDomains.push(domain);
        }
      })
    );

    if (failedTypes.length > 0) {
      console.log('Domain fail!!! ' + failedTypes);
      const retryList = await this.RetryGetDomainList(
        failedTypes,
        failedDomains,
        retryCountRef
      );
      // 替換重試回來的結果
      retryList.forEach((newDomain, i) => {
        const originalIndex = serviceTypes.findIndex(
          type => type === failedTypes[i]
        );
        if (originalIndex !== -1) {
          domainList[originalIndex] = newDomain;
        }
      });
    }

    return domainList;
  }
  /** 遞迴重試直到成功的 domain 清單 */
  private async RetryGetDomainList(
    serviceTypes: string[],
    failDomains: string[],
    retryCountRef?: {count: number}
  ): Promise<string[]> {
    if (retryCountRef) retryCountRef.count++;
    const urlParams = this.getURLParameter();
    const domainPlatformParam = urlParams['domain_platform'];

    const platformDomain = decodeURIComponent(
      domainPlatformParam.split('').reverse().join('')
    );
    const apiUrl = platformDomain + '/gs/GetServiceDomain';

    // 將失敗域名與當前失敗域名合併，避免重複
    for (let i = 0; i < failDomains.length; i++) {
      if (!this.allFailedDomainList.includes(failDomains[i])) {
        this.allFailedDomainList.push(failDomains[i]);
      }
    }

    const cmdData = {
      apiId: Number(urlParams['apiId']),
      currency: urlParams['currency'] || '',
      siteName: PlatformData.siteName || '',
      serviceType: serviceTypes,
      failDomain: this.allFailedDomainList,
    };

    console.log(' RetryGetDomainList!!!!' + failDomains);

    const response = await this.sendAPI<{DomainList: string[]}>(
      apiUrl,
      cmdData
    );
    const domainList = response.DomainList || [];

    // 檢查回傳的 domain 清單中是否成功
    const updatedDomainList = await this.checkDomainList(
      serviceTypes,
      domainList,
      retryCountRef
    );

    return updatedDomainList;
  }
}

//#region Network System

/** API 使用 */
namespace Network.CommonSystem {
  export const SystemName = 'CommonSystem';
  export const Command = {
    UserInfo: 'get_user_info',
  };
}

/** 資產系統 */
namespace Network.AssetSystem {
  export const SystemName = 'Asset';
  export const Command = {
    GetAssetSetting: 'GET_ASSET_SETTING',
    GetAsset: 'GET_ASSET',
  };
}
//#endregion System

/** 網路資料封包及命令格式 */
namespace Network.DataInterface {
  export interface NetworkCommand {
    GetUserInfo: ArkCommand;
    GetAssetSetting: ArkCommand;
    GetAsset: ArkCommand;
  }

  export interface S2C_UserInfo {
    data?: {
      ThirdPartyNick?: string;
      ThirdPartyName?: string;
      LineCode?: string;
      Balance: number;
    };
    Asset?: number;
  }

  export interface S2C_AssetSetting {
    Code?: number;
    Interval?: number; //sec
  }

  export interface S2C_Asset {
    Code?: number;
    Coin?: number;
  }

  export interface ArkCommand {
    ID: string;
    Name: string;
  }
}

/** 網路命令來源 */
namespace Network.CommandSource {
  export const API: Network.DataInterface.NetworkCommand = {
    GetUserInfo: {
      ID: Network.CommonSystem.SystemName,
      Name: Network.CommonSystem.Command.UserInfo,
    },
    GetAssetSetting: {
      ID: Network.AssetSystem.SystemName,
      Name: Network.AssetSystem.Command.GetAssetSetting,
    },
    GetAsset: {
      ID: Network.AssetSystem.SystemName,
      Name: Network.AssetSystem.Command.GetAsset,
    },
  };
}

/** ArkClient集合 */
interface ArkClientCollection {
  [gameUrl: string]: ArkClient;
}

/** URL參數資訊格式 */
interface UrlInfo {
  /** 連線位址 */
  site?: string;
  /** 是否強制為SSL */
  isSSL?: boolean;
  /** 開發帳號 */
  devAccount?: string;
  /** 是否為unity來源 */
  unity?: string;
}
