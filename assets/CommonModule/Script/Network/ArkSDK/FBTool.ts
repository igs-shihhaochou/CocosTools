declare let FB: FBSDK;

const fbScr = document.createElement('script');
fbScr.async = true;
fbScr.defer = true;
fbScr.src = '//connect.facebook.net/en_US/sdk.js';
fbScr.crossOrigin = 'anonymous';
document.head.appendChild(fbScr);

const FBTool: FBTool = (function () {
  let asyncReady = false;
  let onAsyncReady: Function | undefined = undefined;
  const fbsdk: () => FBSDK | undefined = function () {
    return FB != null ? FB : undefined;
  };
  let isReady = false;

  const onAsyncInit = function () {
    console.log('FB init, FB = ' + FB);
    asyncReady = true;
    if (onAsyncReady != null) onAsyncReady();
    onAsyncReady = undefined;
  };
  const setConfig = async function (configs: IFBConfig): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (asyncReady) {
        if (fbsdk() != null) {
          fbsdk().init(configs);
          resolve((isReady = true));
        } else {
          resolve((isReady = false));
        }
      } else {
        onAsyncReady = () => {
          resolve((isReady = true));
        };
      }
    });
  };
  const login = async function (): Promise<FBStatus> {
    if (fbsdk() == null) {
      return Promise.reject('No fb sdk');
    } else {
      return new Promise<FBStatus>(resolve => {
        fbsdk().login(resp => resolve(resp));
      });
    }
  };
  const logout = async function (): Promise<FBStatus> {
    if (fbsdk() == null) {
      return Promise.reject('No fb sdk');
    } else {
      return new Promise<FBStatus>(resolve => {
        fbsdk().logout(resp => resolve(resp));
      });
    }
  };
  const getLoginStatus = async function () {
    if (fbsdk() == null) {
      return Promise.reject('No fb sdk');
    } else {
      return new Promise<FBStatus>(resolve => {
        fbsdk().getLoginStatus(resp => resolve(resp));
      });
    }
  };
  const api = async function (...fields: string[]) {
    if (fbsdk() == null) {
      return Promise.reject('No fb sdk');
    }
    let fieldColle: string;
    if (fields == null) fieldColle = 'name, picture.width(100)';
    else fieldColle = fields.join(', ');
    return new Promise(resolve => {
      fbsdk().api('/me', {fields: fieldColle}, resp => resolve(resp));
    });
  };

  window['fbAsyncInit'] = onAsyncInit;
  return {
    IsReady: isReady,
    get SDK() {
      return fbsdk();
    },
    init: setConfig,
    login: login,
    logout: logout,
    getLoginStatus: getLoginStatus,
    getAuthResponse: () =>
      fbsdk() != null ? fbsdk().getAuthResponse() : undefined,
    api: api,
  };
})();

/** fb configs */
type IFBConfig = {
  appId: string;
  version: string;
  cookie?: boolean;
  localStorage?: boolean;
  status?: boolean;
  xfbml?: boolean;
  frictionlessRequests?: boolean;
  hideFlashCallback?: Function;
};
/** fb 狀態檢查的 data class */
type FBStatus = {status: FBStatusKey; authResponse: FBAuth};
/** fb 狀態檢查的狀態key */
type FBStatusKey = 'connected' | 'not_authorized' | 'unknown';
/** fb 授權 data class */
type FBAuth = {
  accessToken: string;
  userID: string;
  expiresIn: number;
  signedRequest: string;
  graphDomain: string;
  data_access_expiration_time: number;
};
/** fb 事件 data class */
type FBEvent = {
  subscribe(eventkey: string, callback: (resp: FBStatus) => void): void;
  unsubscribe(eventkey: string, callback: (resp: FBStatus) => void): void;
};
/** fb sdk typescript interface */
type FBSDK = {
  Event: FBEvent;
  init(fbconfigs: IFBConfig): void;
  login(callback: (resp: FBStatus) => void): void;
  logout(callback: (resp: FBStatus) => void): void;
  getLoginStatus(callback: (resp: FBStatus) => void): void;
  getAuthResponse(): object;
  api(path: string, params: object, callback: (resp: any) => void): void;
};
type FBTool = {
  readonly IsReady: boolean;
  readonly SDK: FBSDK;
  init(configs: IFBConfig): Promise<boolean>;
  login(): Promise<FBStatus>;
  logout(): Promise<FBStatus>;
  getLoginStatus(): Promise<FBStatus>;
  getAuthResponse(): object;
  api(...fields: string[]): Promise<any>;
};

export {FBTool, FBSDK, IFBConfig, FBStatus, FBAuth, FBEvent};
