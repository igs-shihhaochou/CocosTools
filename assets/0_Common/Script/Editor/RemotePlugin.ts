import {_decorator, CCBoolean, CCInteger, CCString, Component} from 'cc';
import {EDITOR} from 'cc/env';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import GameClient, {
  enumFromType,
} from 'db://assets/CommonModule/Script/Network/GameClient';
import Functions from 'db://assets/CommonModule/Script/Utility/Functions';
const {ccclass, property} = _decorator;
import md5 from 'md5';
import MacrossSocketClient from '../../../CommonModule/Script/Network/Macross/MacrossSocketClient';

type SSOLoginResponse = {
  profile: {aid: string};
  token: string;
};

@ccclass('GameSetting')
export class GameSetting extends Component {
  @property(CCInteger)
  private gameID = 0;
  @property(CCString)
  private gameName = '';
  @property(CCString)
  private gameServer = '';
  @property(CCString)
  private gameScene = '';
  @property(CCBoolean)
  private useApiServer = false;
  @property(CCBoolean)
  private supportLandscape = false;
  @property(CCBoolean)
  private supportPortrait = false;
  @property(CCBoolean)
  private supportBuyBonus = false;
  @property(CCBoolean)
  private isManualLogin = false;
  @property(CCBoolean)
  private debugMode = true;
  @property(CCBoolean)
  private useBundleLoad = false;
  @property(CCBoolean)
  private useNextJsHtmlInfo = false;
  @property(CCString)
  private defaultUrl = 'mid=2&currency=THB&logo=acewin';
  @property(CCBoolean)
  private connectLocalDevServer = false;
  @property(CCString)
  private macrossPlatformUrl =
    'https://macross-platform-ingress.acewin-test.com';
  @property(CCString)
  private agentId = '21001_rd4qc_single_01';
  @property(CCString)
  private agentKey = '9d6ff0f9e3ca9adc36596f02d4d08e02ec395e7e';
  @property(CCString)
  private lang = 'zh-cn';
  @property(CCInteger)
  private balance = 1000000;
  @property(CCString)
  private account = 'your_account';
  @property(CCString)
  private initGameScene = 'Game';

  public static isNeedSingleLogin = false;
  private static _macrossPlatformUrl =
    'https://macross-platform-ingress.acewin-test.com';
  private static _agentId = '21001_rd4qc_single_01';
  private static _agentKey = '9d6ff0f9e3ca9adc36596f02d4d08e02ec395e7e';
  private static _lang = 'zh-cn';
  private static _balance = 1000000;
  private static _account = 'your_account';

  public static get domainPlatform(): string {
    return this._macrossPlatformUrl;
  }

  protected onLoad(): void {
    // 確保在編輯器下才執行
    if (!EDITOR) {
      return;
    }
    if (PlatformData.fromFakeLobby) {
      this.gameServer = Functions.getURLParameter(PlatformData.editorUrl)[
        'site'
      ];
      console.log('remotePlugin gameServer:', this.gameServer);
    }

    if (!PlatformData.fromFakeLobby) {
      PlatformData.editorUrl = `${this.defaultUrl}${this.connectLocalDevServer ? '&site=127.0.0.1:8080' : ''}${this.lang ? `&lang=${this.lang}` : ''}`;
    }

    PlatformData.gameSetting = {
      InitGameScene: this.initGameScene,
      GameScene: this.gameScene,
      GameID: this.gameID,
      GameName: this.gameName,
      GameServer: this.gameServer,
      IsSupportLandscape: this.supportLandscape,
      IsSupportPortrait: this.supportPortrait,
      IsSupportBuyBonus: this.supportBuyBonus,
      IsManualLogin: this.isManualLogin,
      DebugMode: this.debugMode,
      UseBundleLoad: this.useBundleLoad,
      DefaultLang: 'en-us',
      SupportLang: {
        'en-us': true,
        'zh-cn': true,
        'ms-my': true,
        'th-th': true,
        'vi-vn': true,
        'id-id': true,
        'my-mm': true,
        'pt-br': true,
        'es-es': true,
        'it-it': true,
        'sv-se': true,
        'ro-ro': true,
        'gr-gr': true,
        'fr-fr': true,
      },
      ShowOkBtnWhenLoadingEnd: false,
      ShowLoadingOnce: true,
      UseApiServer: this.useApiServer,
      UseProgressJp: true,
      UseNextJSHtmlInfo: this.useNextJsHtmlInfo,
      UseTurboPhase: true,
    } as any;

    PlatformData.gameConfig = {
      RootBundle: '_Root',
      GameInfo: '../GameInfo/',
      GameLog: '../../../GameLog/%version/GameLog/index.html',
      RemoteResources: '../../../_RemoteResources/',
      ErrorCodeXmlName: 'ErrorCodeStringTable',
    };

    PlatformData.commonBundleConfig = {
      GameLoadingPage: {
        Name: 'GameLoadingPage',
        Weight: 1,
        MultiLang: false,
      },
    };

    GameSetting._macrossPlatformUrl = this.macrossPlatformUrl;
    GameSetting._agentId = this.agentId;
    GameSetting._agentKey = this.agentKey;
    GameSetting._lang = this.lang;
    GameSetting._balance = this.balance;
    GameSetting._account = this.account;
    GameSetting.isNeedSingleLogin =
      !this.connectLocalDevServer && !PlatformData.fromFakeLobby;
    if (this.connectLocalDevServer) {
      PlatformData.token = 'test';
    }
  }

  /* ========= API：LoginWithoutRedirect ========= */
  public static async singleLogin() {
    const qs = new URLSearchParams({
      Token: await GameSetting.getTestToken(this._account, this._balance),
      GameId: PlatformData.gameSetting.GameID.toString(),
      Lang: this._lang,
      AgentId: this._agentId,
    });

    qs.append(
      'Key',
      this.getHash(qs.toString(), this._agentId, this._agentKey)
    );

    const url = `${this._macrossPlatformUrl}/singleWallet/LoginWithoutRedirect?${qs}`;
    const data = await this.request<{Data: string}>(url, {method: 'GET'});

    const ssoKey = new URL(data.Data).searchParams.get('ssoKey');

    if (ssoKey) {
      const resp: SSOLoginResponse = await this.ssoLogin(ssoKey); // 呼叫 ssoLogin
      console.log('singleLogin ssoLogin response:', resp);
      PlatformData.uID = resp.profile.aid;
      PlatformData.token = resp.token;
      GameClient.instance.setThirdPartyFromType(enumFromType.Macross);
      this.MacrossSocketClientConnect();
    } else {
      throw new Error('ssoKey not found in URL');
    }
  }

  /* ========= API：取得測試 Token ========= */
  private static async getTestToken(
    account: string,
    balance: number
  ): Promise<string> {
    const qs = new URLSearchParams({
      username: account,
      currency: 'THB',
      balance: String(balance),
    });

    const url = `${this._macrossPlatformUrl}/SWSimulator/testToken?${qs}`;

    /** 後端規格：GET + Basic Auth */
    const data = await this.request<{token?: string}>(url, {
      method: 'GET',
      headers: {Authorization: 'Basic amlsaTo1NDMyMQ=='},
    });

    if (!data?.token) throw new Error('testToken: 回傳格式錯誤');
    return data.token;
  }

  /* ========= API：SSO Login ========= */
  private static async ssoLogin(ssoKey: string): Promise<SSOLoginResponse> {
    const body = new URLSearchParams({key: ssoKey});

    return await this.request(
      `${this._macrossPlatformUrl}/backend/sso-login.api`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body,
      }
    );
  }

  private static getHash(str, agid: string, agentKey: string): string {
    const d = new Date();
    const localTime = d.getTime();
    const localOffset = d.getTimezoneOffset() * 60000; //getTimezoneOffset 獲取偏移"分鐘數" 再乘上* 60000 (毫秒)
    const utc = localTime + localOffset; //utc即GMT时间
    const offset = -4;
    const date4 = utc + 3600000 * offset;
    const nd = new Date(date4);
    const month = nd.getMonth() + 1;
    let monthStr = month.toString();
    if (month >= 1 && month <= 9) {
      monthStr = '0' + monthStr;
    }

    const dateStr =
      nd.getFullYear().toString().substring(2, 4) + monthStr + nd.getDate();
    const KeyG = md5(dateStr + agid + agentKey).toString();
    const key = md5(str + KeyG).toString();
    return '000000' + key + '000000';
  }

  private static async request<T>(
    url: string,
    init: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(url, {
      // 透過展開運算子允許呼叫端覆蓋 header / method
      ...init,
      headers: {
        // 預設 JSON；GET 可以保留 text/plain 也無妨，視後端要求
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!res.ok) {
      // 取不到 JSON 也要把 text 回傳，以方便排錯
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} – ${res.statusText}\n${errText}`);
    }

    // 後端若偶爾回 text/plain，可先 try json，再退回 text
    return (await res.json().catch(() => res.text())) as T;
  }

  private static MacrossSocketClientConnect() {
    const url = this._macrossPlatformUrl.replace('https://', 'wss://');
    const macrossSocketClient = new MacrossSocketClient(
      url,
      Number(PlatformData.uID), // MacrossClient.aid,
      PlatformData.gameSetting.GameID.toString(), // MacrossClient.gameId,
      PlatformData.token, // MacrossClient.token,
      Number(this._agentId) // MacrossClient.apiId
    );
    macrossSocketClient.connect();
  }
}
