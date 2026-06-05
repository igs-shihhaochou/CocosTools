import {PlatformData} from '../../Define/PlatformData';

export const httpResult = {
  ok: 0,
  abort: 1,
  timeout: 2,
  error: 3,
  status: 4,
  notReset: 5,
  condition: 6,
};

interface Wallet {
  coin: number;
  currencyName: string;
  currencyNumber: number;
  isoID: number;
  rate: number;
  ratio: number;
  unit: number;
}

interface Profile {
  account: string;
  aid: number;
  apiId: number;
  clientMode: {eventId: string; value: number[]}[];
  coin: number;
  id: string;
  nickname: string;
  platform: string;
  siteId: number;
  siteName: string;
  wallets: Wallet[];
  CloseSystemMenu?: boolean;
  IdleMinute?: number;
  SkipTutorial?: boolean;
  ConnectPlatformSocket?: boolean;
  platformID?: string;
}

type MacrossRespond = {
  status: number;
  text: {
    response: Object;
    profile: Object;
    token: string;
  };
};

export default class MacrossClient {
  private static _platformDomain = '';
  private static _platformDomainWs = '';
  private static _ssoKey = '';
  private static _lang = '';
  private static _gameID = '';

  private static _aid = 0;
  private static _apiId = 0;
  private static _siteId = 0;
  private static _siteName = '';
  private static _token = '';
  private static _currencyName = '';
  private static _ratio = 0;
  private static _originalBalance = 0;
  private static _profile: Profile = null;
  private static _platformId = '';

  public static get platformDomain(): string {
    return MacrossClient._platformDomain;
  }
  public static get platformDomainWs(): string {
    return MacrossClient._platformDomainWs;
  }
  public static get gameId(): string {
    return MacrossClient._gameID;
  }
  public static get aid(): number {
    return MacrossClient._aid;
  }
  public static get apiId(): number {
    return MacrossClient._apiId;
  }
  public static get siteId(): number {
    return MacrossClient._siteId;
  }
  public static get siteName(): string {
    return MacrossClient._siteName;
  }
  public static get token(): string {
    return MacrossClient._token;
  }
  public static get currencyName(): string {
    return MacrossClient._currencyName;
  }
  public static get ratio(): number {
    return MacrossClient._ratio;
  }
  public static get originalBalance(): number {
    return MacrossClient._originalBalance;
  }
  public static get profile(): Profile {
    return MacrossClient._profile;
  }
  public static get platformId(): string {
    return MacrossClient._platformId;
  }
  public static get closeSystemMenu(): boolean | null {
    return typeof this._profile?.CloseSystemMenu === 'boolean'
      ? this._profile.CloseSystemMenu
      : null;
  }
  public static get idleMinute(): number | null {
    const rawValue = this._profile?.IdleMinute;

    if (rawValue === null || rawValue === undefined) return null;

    const parsed = parseInt(rawValue.toString(), 10);

    return isNaN(parsed) ? null : parsed;
  }
  public static get skipTutorial(): boolean | null {
    return typeof this._profile?.SkipTutorial === 'boolean'
      ? this._profile.SkipTutorial
      : null;
  }

  public static async ssoLogin(
    callback: (result: number, data, event?) => void,
    event?
  ) {
    const body = `key=${MacrossClient._ssoKey}`;
    const resp = await MacrossClient.post(Macross.api.ssoLogin, body);

    const result = resp.status;
    const data = resp.text;

    if (result === 0 && data.response.error === 0) {
      const profile = data.profile;
      MacrossClient._profile = profile;
      MacrossClient._aid = profile.aid;
      MacrossClient._apiId = profile.apiId;
      MacrossClient._siteId = profile.siteId;
      MacrossClient._siteName = profile.siteName || '';
      MacrossClient._token = data.token;

      const wallet = profile.wallets[0];
      MacrossClient._currencyName = wallet.currencyName;
      MacrossClient._ratio = wallet.ratio;
      MacrossClient._originalBalance = profile.coin;
      MacrossClient._platformId = profile.platformID || '';
    }

    callback(result, data, event);
  }

  public static parsingUrl() {
    const currentUrl: URL = new URL(window.location.href);
    MacrossClient._ssoKey = getParam(currentUrl, Macross.urlQuery.ssoKey);
    MacrossClient._lang = getParam(currentUrl, Macross.urlQuery.lang);
    MacrossClient._gameID =
      PlatformData.gameID ||
      getParam(currentUrl, Macross.urlQuery.transformGameId) ||
      getParam(currentUrl, Macross.urlQuery.singleGameId);
    MacrossClient._platformDomain = `${MacrossClient.reverseString(getParam(currentUrl, Macross.urlQuery.domainPlatform))}`;
    MacrossClient._platformDomain = MacrossClient._platformDomain.endsWith('/')
      ? MacrossClient._platformDomain.slice(0, -1)
      : MacrossClient._platformDomain;
    MacrossClient._platformDomainWs = `${MacrossClient.reverseString(getParam(currentUrl, Macross.urlQuery.domainPlatformWs))}`;
    MacrossClient._platformDomainWs = MacrossClient._platformDomainWs.endsWith(
      '/'
    )
      ? MacrossClient._platformDomainWs.slice(0, -1)
      : MacrossClient._platformDomainWs;
    console.log(`[parsingUrl]ssoKey: ${MacrossClient._ssoKey}`);
    console.log(`[parsingUrl]lang: ${MacrossClient._lang}`);
    console.log(`[parsingUrl]gameID: ${MacrossClient._gameID}`);
    console.log(
      `[parsingUrl]platform_domain: ${MacrossClient._platformDomain}`
    );
    console.log(
      `[parsingUrl]platform_domainWs: ${MacrossClient._platformDomainWs}`
    );

    function getParam(url: URL, param: string): string {
      if (url === null || url === undefined) return '';
      return decodeURIComponent(url.searchParams.get(param) || '');
    }
  }

  public static SetSSOKey(ssoKey: string) {
    MacrossClient._ssoKey = ssoKey || '';
    console.log(`[SetSSOKey]ssoKey: ${MacrossClient._ssoKey}`);
  }

  private static reverseString(str: string): string {
    return str.split('').reverse().join('');
  }

  // 正式發送封包方法
  private static post(api: string, body: string) {
    console.log(`[post]api: ${api}, body: `, body);
    return new Promise<MacrossRespond>((resolve, reject) => {
      const xhr: XMLHttpRequest = new XMLHttpRequest();
      const url: URL = new URL(`${MacrossClient._platformDomain}/${api}`);
      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

      xhr.addEventListener(
        'load',
        MacrossClient.onLoad.bind(MacrossClient, resolve, reject, xhr)
      );
      xhr.addEventListener(
        'abort',
        MacrossClient.onError.bind(MacrossClient, resolve, httpResult.abort)
      );
      xhr.addEventListener(
        'error',
        MacrossClient.onError.bind(MacrossClient, resolve, httpResult.error)
      );
      xhr.addEventListener(
        'timeout',
        MacrossClient.onError.bind(MacrossClient, resolve, httpResult.timeout)
      );
      console.log(body);
      xhr.send(body);
    }).catch(resp => {
      return resp;
    });
  }

  private static onLoad(resolve, reject, xhr: XMLHttpRequest) {
    const resp = {
      status: httpResult.error,
      text: {},
    };

    if (xhr && xhr.status >= 200 && xhr.status < 400) {
      resp.status = httpResult.ok;
      resp.text = JSON.parse(xhr.responseText);
      resolve(resp);
    } else {
      resp.text = JSON.parse(xhr.responseText);
      reject(resp);
    }
  }

  private static onError(resolve, status: number) {
    console.error(`[onError]resolve: ${resolve}, status: ${status}`);
    const resp = {
      status: status,
      text: {},
    };

    resolve(resp);
  }
}

/** Macross 使用 */
export namespace Macross {
  export const urlQuery = {
    ssoKey: 'ssoKey',
    lang: 'lang',
    transformGameId: 'gameID',
    singleGameId: 'gameId',
    domainPlatform: 'domain_platform',
    domainPlatformWs: 'domain_platform_ws',
  };
  export const api = {
    ssoLogin: 'backend/sso-login.api',
  };
}
