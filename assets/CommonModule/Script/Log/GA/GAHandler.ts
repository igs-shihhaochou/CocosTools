import {PlatformData} from '../../Define/PlatformData';

export default class GAHandler {
  public static gtag: any = null;

  public static async Create(gaID: string): Promise<void> {
    GAHandler.gtag = window['gtag'];
    if (!gaID) {
      console.warn('GAID is not set');
      return;
    }
    await new Promise((resolve, _reject) => {
      if (!GAHandler.gtag) {
        const head = document.getElementsByTagName('head')[0];
        const gtagScript = document.createElement('script');
        gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaID;
        gtagScript.onload = resolve;
        head.appendChild(gtagScript);

        window['dataLayer'] = window['dataLayer'] || [];
        window['gtag'] = function gtag() {
          // eslint-disable-next-line prefer-rest-params
          window['dataLayer'].push(arguments);
        };
        window['gtag']('js', new Date());
        GAHandler.gtag = window['gtag'];
      }
    });

    GAHandler.gtag('config', gaID);
    if (PlatformData.instance.isDebugMode) {
      GAHandler.gtag('config', gaID, {debug_mode: true});
    }
  }

  public static Login(playAcc: string) {
    if (!GAHandler.gtag) return;
    GAHandler.gtag('set', 'user_id', playAcc);

    // GAHandler.gtag('set', 'user_property', {
    //   ark_id: PlatformData.instance.arkClient.arkId,
    //   kiosk_id: SS.Network.LoginModel.LoginInfo.kiosk_id,
    //   environment: Setting.GetSetting('PlayerStatus')['environment'],
    // });
    // if (send) {
    //   GAHandler.gtag('event', 'login', {
    //     method: CustomConfig.Instance.configName,
    //   });
    // }
  }

  public static LoadingStart(game: string) {
    if (!GAHandler.gtag) return;
    GAHandler.gtag('event', 'loading_start', {
      game: game,
    });
  }

  public static LoadingFinish(game: string, duration: number) {
    if (!GAHandler.gtag) return;
    GAHandler.gtag('event', 'loading_end', {
      game: game,
      duration: duration,
    });
  }

  public static FPS(game: string, frameRate: number) {
    if (!GAHandler.gtag) return;
    GAHandler.gtag('event', 'fps', {
      game: game,
      fps: frameRate,
    });
  }

  public static HttpPing(game: string, ping: number, times: number) {
    GAHandler.Ping(game + '_HTTP', ping, times);
  }

  public static SocketPing(game: string, ping: number, times: number) {
    GAHandler.Ping(game + '_Socket', ping, times);
  }

  public static Ping(game: string, ping: number, times: number) {
    if (!GAHandler.gtag) return;
    GAHandler.gtag('event', 'post_score', {
      game: game,
      ping: ping,
      times: times,
    });
  }

  public static ErrorMsg(game: string, errorMsg: string, errorCode: string) {
    if (!GAHandler.gtag) return;
    GAHandler.gtag('event', 'error_msg', {
      game: game,
      errorMsg: errorMsg,
      errorCode: errorCode,
    });
  }

  public static SendEvent(
    category: string,
    eventName: string,
    game: string,
    value = 0
  ): void {
    console.log('GAHandler SendEvent', category, eventName, game, value);
    if (!GAHandler.gtag) return;
    GAHandler.gtag('event', eventName, {
      eventCategory: category,
      game: game,
      value: value,
    });
  }

  public static sendCmdResponesTime(
    game: string,
    cmdId: string,
    cmdName: string,
    time: number
  ) {
    if (!GAHandler.gtag) return;
    GAHandler.gtag('event', 'cmd_resp_time', {
      game,
      cmdId,
      cmdName,
      time,
    });
  }

  public static getGameLoadingTime() {
    const now = Date.now();
    const item = localStorage.getItem('gameLoadingTime');
    if (item === null || item === undefined) {
      localStorage.setItem('gameLoadingTime', now.toString());
      return 0;
    }
    const before = parseInt(item);
    const duration = now - before;
    localStorage.setItem('gameLoadingTime', now.toString());
    return duration;
  }
}
