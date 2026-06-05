import Functions from '../Utility/Functions';
import {FunctionQueue} from '../Utility/FunctionQueue';
import EventIconSettingDownloader from '../Utility/Downloader/EventIconSettingDownloader';
import GameDetailsListDownloader from '../Utility/Downloader/GameDetailsListDownloader';
import {UrlParameterFormat} from '../Type/CommonDefine';
import {PlatformData} from '../Define/PlatformData';
import GameErrorCode from '../Core/GameErrorCode';
import {PlatformGDK} from '../Platform/PlatformGDK';
import ArkClient from '../Network/ArkSDK/ArkClient';
import {GameGuideSystemCommand} from '../Network/Command/GameGuideSystemCommand';
import {GameGuideSystemDataInterface} from '../Network/DataInterface/GameGuideSystemDataInterface';
import {GameInfoSystemCommand} from '../Network/Command/GameInfoSystemCommand';
import {GameInfoSystemDataInterface} from '../Network/DataInterface/GameInfoSystemDataInterface';
import {ReturnCommandData} from '../Network/System/BaseArkSystem';
import GameGuideSystem from '../Network/System/GameGuideSystem';
import GameInfoSystem from '../Network/System/GameInfoSystem';

export class GameListData {
  /** 遊戲名稱 */
  gameName = '';
  /** 遊戲ID */
  gameId = -1;
  /** 圖示名稱(目前未使用) */
  icon = '';
}

export default class GameGuideManager {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): GameGuideManager {
    if (!window['gameGuideManager']) {
      window['gameGuideManager'] = new GameGuideManager();
    }
    return window['gameGuideManager'];
  }
  public static set instance(instance: GameGuideManager) {
    window['gameGuideManager'] = instance;
  }
  //=======================================================
  //#endregion Singleton

  public get gameGuideSystem(): GameGuideSystem {
    return this._gameGuideSystem;
  }
  private _gameGuideSystem: GameGuideSystem = null;

  public get gameInfoSystem(): GameInfoSystem {
    return this._gameInfoSystem;
  }
  private _gameInfoSystem: GameInfoSystem = null;

  private getListCallBack: FunctionQueue = new FunctionQueue();
  private getGameListCallBack: FunctionQueue = new FunctionQueue();
  private gameInfoRetryCount = 0;
  private readonly maxRetryCount = 3;
  private isGameListLoading = false; // 標記是否正在載入遊戲清單

  /** 遊戲列表設定 */
  private gameListSetting: GameListSetting = null;

  /** 活動icon設定(與app共用，故與logoSetting拆開) */
  private eventIconSetting: EventIconSetting = null;

  constructor() {
    GameGuideManager.instance = this;
  }

  onDestroy() {
    this.release();
  }

  public init(onInitCompleteCallback: Function, arkClient: ArkClient) {
    this.initSystem(arkClient);
    onInitCompleteCallback();
  }

  public release() {
    this.unregisterSystemEvent();
    GameGuideManager.instance = null;
    if (this._gameGuideSystem) this._gameGuideSystem.release();
    if (this._gameInfoSystem) this._gameInfoSystem.release();
  }

  private initSystem(arkClient: ArkClient) {
    if (arkClient == null) {
      console.warn("[GameGuideManager] initSystem arkClient doesn't exist.");
      return;
    }

    this._gameGuideSystem = new GameGuideSystem();
    this._gameInfoSystem = new GameInfoSystem();

    //針對對應的GameClient設定好System
    this._gameGuideSystem.setupHttpClient(arkClient);
    this._gameInfoSystem.setupHttpClient(arkClient);

    //註冊封包事件
    this.registerSystemEvent();
  }

  private registerSystemEvent() {
    if (this._gameGuideSystem) {
      this._gameGuideSystem.addEventListener(
        GameGuideSystemCommand.Command.CMD_GET_LIST,
        this.receiveGetListData,
        this
      );
      this._gameGuideSystem.addEventListener(
        GameGuideSystemCommand.Command.CMD_REDIRECT,
        this.receiveRedirectData,
        this
      );
    }

    if (this._gameInfoSystem) {
      this._gameInfoSystem.addEventListener(
        GameInfoSystemCommand.Command.CMD_GET_GAME_LIST,
        this.receiveGetGameListData,
        this
      );
    }
  }

  private unregisterSystemEvent() {
    if (this._gameGuideSystem) {
      this._gameGuideSystem.removeEventListener(
        GameGuideSystemCommand.Command.CMD_GET_LIST,
        this.receiveGetListData,
        this
      );
      this._gameGuideSystem.removeEventListener(
        GameGuideSystemCommand.Command.CMD_REDIRECT,
        this.receiveRedirectData,
        this
      );
    }

    if (this._gameInfoSystem) {
      this._gameInfoSystem.removeEventListener(
        GameInfoSystemCommand.Command.CMD_GET_GAME_LIST,
        this.receiveGetGameListData,
        this
      );
    }
  }

  // 是否在遊戲清單內
  public isInGameListByName(gameName: string): boolean {
    return (
      this.gameListSetting && this.gameListSetting.GameList.includes(gameName)
    );
  }

  public sendGetList(callBack: (listSetting: GameListSetting) => void) {
    if (PlatformData.isDaraEnv || PlatformData.isSSEnv) {
      this.getListCallBack.enqueue(callBack);

      const cmdData: GameGuideSystemDataInterface.C2S_GetList = {};
      cmdData.Lang = PlatformData.lang;
      cmdData.CurrGame = Number(PlatformData.gameID);

      this._gameGuideSystem.sendGetList(cmdData);
    } else if (PlatformData.isMacrossEnv) {
      // 先取本地資料，然後在同一次異步中取遠端資料
      this.getGameListFromLocalThenRemote(callBack);
    } else {
      //尚未實串Server，先取遠端資料
      this.getGameListFromLocal(callBack);
    }
  }

  private receiveGetListData(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    const code: number = retCmdData.cmd_data.Code as number;
    if (code === 0) {
      const data: GameGuideSystemDataInterface.S2C_GetListResponse =
        retCmdData.cmd_data as GameGuideSystemDataInterface.S2C_GetListResponse;
      if (data !== undefined) {
        this.getListCallBack.invoke(data as GameListSetting);
      }
    } else {
      //TODO:錯誤處理
      // this.closeEntryAndSchedule();
      if (code !== -10) {
        console.error('[GameGuideManager] receiveGetListData code:' + code);
      }
    }
  }

  public sendRedirect(gameName: string, retry = false) {
    this.retryGameName = gameName;
    if (!retry) this.retryCount = 0;

    const cmdData: GameGuideSystemDataInterface.C2S_Redirect = {};
    cmdData.Lang = PlatformData.lang;
    cmdData.CurrGame = Number(PlatformData.gameID);
    cmdData.GameName = gameName;
    cmdData.FullScreen = PlatformData.supportFullscreen;

    this._gameGuideSystem.sendRedirect(cmdData);

    PlatformGDK.instance.showRedirectLoading.notify(true);
  }

  private retryDelayAry: Array<number> = [1000, 3000, 5000];
  private retryCount = 0;
  private retryGameName = '';

  private receiveRedirectData(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    const code: number = retCmdData.cmd_data.Code as number;

    if (code === 0) {
      const data: GameGuideSystemDataInterface.S2C_RedirectResponse =
        retCmdData.cmd_data as GameGuideSystemDataInterface.S2C_RedirectResponse;
      if (data !== undefined) {
        // url中的domain換成目前的domain
        data.Url = data.Url.replace(/https?:\/\/[^/]+/, window.location.origin);
        console.log(
          '[GameGuideManager] RecieveRedirectData()--> window.location.origin(original domain) = ',
          window.location.origin
        );
        // 加入白牌換logo所需參數
        data.Url = this.urlAddCustomParam(data.Url, 'ShowLogo');
        console.log(
          '[GameGuideManager] receiveRedirectData final redirect url: ' +
            data.Url
        );
        this.redirectGame(data.Url);
      }
    } else {
      //重送三次機制，每次delay秒數不一樣，需重送的error code為40
      if (code === 40 && this.retryCount < 3) {
        setTimeout(() => {
          this.retryCount++;
          this.sendRedirect(this.retryGameName, true);
        }, this.retryDelayAry[this.retryCount]);
      } else if (code === 40 && this.retryCount >= 3) {
        console.error(
          '[GameGuideManager] receiveRedirectData code:' +
            code +
            ' retryCount:' +
            this.retryCount
        );

        const errorMessage = GameErrorCode.GetMessage(
          GameErrorCode.REDIRECT_ERROR
        );

        PlatformGDK.instance.showRedirectMsgBox.notify(
          errorMessage,
          code,
          Functions.closeGame
        );
      } else {
        console.error('[GameGuideManager] receiveRedirectData code:' + code);
        const errorMessage = GameErrorCode.GetMessage(
          GameErrorCode.REDIRECT_ERROR
        );
        PlatformGDK.instance.showRedirectMsgBox.notify(
          errorMessage,
          code,
          Functions.closeGame
        );
      }
    }
  }

  /**
   * 從url取得參數的key與value結合成字串
   * @param url
   * @param key
   */
  private urlAddCustomParam(url: string, key: string) {
    const paramValue = Functions.getURLParameterByName(key);
    if (paramValue !== '') {
      url += '&' + key + '=' + paramValue;
    }
    return url;
  }

  private redirectGame(redirectURL: string) {
    window.location.replace(redirectURL);
  }

  /**
   * 取得遊戲列表，如果設定表不為null則直接回傳
   * @param callBack
   */
  public getGameListFromLocal(callBack: Function) {
    if (this.gameListSetting == null) {
      // 將 callback 包裝後加入佇列（FunctionQueue.invoke 只接受一個參數）
      if (callBack) {
        this.getGameListCallBack.enqueue(
          (data: {
            listSetting: GameListSetting;
            eventIconSetting: EventIconSetting;
          }) => {
            callBack(data.listSetting, data.eventIconSetting);
          }
        );
      }
      this.getLocalGameListSetting();
    } else {
      if (callBack) {
        callBack(this.gameListSetting, this.eventIconSetting);
      }
    }
  }

  /**
   * Macross 環境專用：先取本地資料，然後在同一次異步中取遠端資料
   * @param callBack
   */
  private getGameListFromLocalThenRemote(callBack: Function) {
    if (this.gameListSetting == null) {
      const enqueueCallback = (data: {
        listSetting: GameListSetting;
        eventIconSetting: EventIconSetting;
      }) => {
        callBack(data.listSetting, data.eventIconSetting);
      };
      // 如果已經在載入中，只需要將 callback 加入佇列即可
      if (this.isGameListLoading) {
        if (callBack) {
          this.getGameListCallBack.enqueue(enqueueCallback);
        }
        return;
      }

      // 標記開始載入
      this.isGameListLoading = true;

      // 先載入本地資料
      this.downloadGameListFromFile(() => {
        // 本地資料載入完成後，立即在同一個異步流程中取遠端資料
        // 將 callback 加入佇列（包裝後）
        if (callBack) {
          this.getGameListCallBack.enqueue(enqueueCallback);
        }

        // 重置重試計數並發送遠端請求
        this.gameInfoRetryCount = 0;
        this.sendGetGameListFromGameInfo();
      });
    } else {
      if (callBack) {
        callBack(this.gameListSetting, this.eventIconSetting);
      }
    }
  }

  public getGameList(callBack: Function) {
    // 將 callback 包裝後加入佇列（總是嘗試取得遠端資料，不使用快取）
    if (callBack) {
      this.getGameListCallBack.enqueue(
        (data: {
          listSetting: GameListSetting;
          eventIconSetting: EventIconSetting;
        }) => {
          callBack(data.listSetting, data.eventIconSetting);
        }
      );
    }
    this.gameInfoRetryCount = 0;
    this.sendGetGameListFromGameInfo();
  }

  /**
   * 調用所有 getGameListCallBack 中的回調函數
   * @param listSetting 遊戲列表設定
   * @param eventIconSetting 活動圖示設定
   */
  private invokeGameListCallbacks(
    listSetting: GameListSetting,
    eventIconSetting: EventIconSetting
  ) {
    // 使用包裝對象來傳遞兩個參數給 FunctionQueue.invoke
    const callbackData = {listSetting, eventIconSetting};
    this.getGameListCallBack.invoke(callbackData);
  }

  /**
   * 使用 GameInfoSystem 取得遊戲清單
   */
  private sendGetGameListFromGameInfo() {
    const cmdData: GameInfoSystemDataInterface.C2S_GetGameList = {};

    this._gameInfoSystem.sendGetGameList(cmdData);
  }

  /**
   * 接收 GameInfo 系統的遊戲清單回應
   */
  private receiveGetGameListData(
    result: number,
    retCmdData: ReturnCommandData,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _processTimeMs?: number
  ) {
    const responseData =
      retCmdData.cmd_data as GameInfoSystemDataInterface.S2C_GetGameListResponse;
    const code: number = responseData?.Code; //過早發送GetGameList可能回應錯誤內容 導致無Code

    if (code === 0) {
      // 成功取得遊戲清單，直接使用Response資料
      this.gameListSetting.GameList = responseData.GameList;

      console.log(
        '[GameGuideManager] Received GameListSetting from Server:',
        this.gameListSetting
      );

      // 成功時調用所有回調
      this.isGameListLoading = false;
      this.invokeGameListCallbacks(this.gameListSetting, this.eventIconSetting);
    } else {
      // 例外包含responseData直接回應錯誤的情況
      // 因此過早發送GetGameList可能回應錯誤內容 導致無Message
      console.error(
        '[GameGuideManager] receiveGetGameListData code:',
        code,
        'responseData:',
        responseData,
        'message:',
        responseData?.Message
      );

      // 重試機制：重試三次
      if (this.gameInfoRetryCount < this.maxRetryCount) {
        this.gameInfoRetryCount++;
        console.log(
          `[GameGuideManager] Retrying GameInfo request (${this.gameInfoRetryCount}/${this.maxRetryCount})`
        );
        setTimeout(() => {
          this.sendGetGameListFromGameInfo();
        }, 1000 * this.gameInfoRetryCount); // 遞增延遲時間
      } else {
        // 重試三次後失敗，使用上次的 GameList 或回傳 NULL
        console.warn(
          '[GameGuideManager] GameInfo requests failed after retries, falling back to previous GameList or returning NULL'
        );

        // 重試失敗後調用所有回調
        this.isGameListLoading = false;
        if (this.gameListSetting != null) {
          // 使用上次取得的 GameList
          this.invokeGameListCallbacks(
            this.gameListSetting,
            this.eventIconSetting
          );
        } else {
          // 沒有上一次的遊戲清單，回傳 NULL
          this.invokeGameListCallbacks(null, null);
        }
      }
    }
  }

  /** 取得Client端設定檔 */
  private getLocalGameListSetting() {
    this.downloadGameListFromFile(() => {
      this.invokeGameListCallbacks(this.gameListSetting, this.eventIconSetting);
    });
  }

  private async downloadGameListFromFile(onDownloadComplete: Function) {
    //下載遊戲排序設定
    await new Promise(
      (resolve: (jsonData: JSON) => void, reject: (err: Error) => void) => {
        const internalMode: boolean = /^(1|true)$/.test(
          (Functions.getURLParameter() as UrlParameterFormat).InternalMode
        );
        const cdnUrl = `${PlatformData.gameConfig.RemoteResources}./Logo/${PlatformData.logo}/${internalMode ? 'internal/' : ''}`;
        const gameDetailsListDownloader: GameDetailsListDownloader =
          new GameDetailsListDownloader();
        gameDetailsListDownloader.start(cdnUrl, resolve, reject);
        console.log(
          '[GameGuideManager] Init GameListSetting download cdnUrl = ',
          cdnUrl
        );
      }
    )
      .then((jsonData: JSON) => {
        console.log(
          '[GameGuideManager] Init GameListSetting download jsonData = ',
          jsonData
        );
        this.gameListSetting = jsonData as unknown as GameListSetting;
      })
      .catch(err => {
        console.error(
          '[GameGuideManager] Init GameListSetting download error.',
          err
        );
        this.gameListSetting = null;
      });

    //下載活動icon設定
    await new Promise(
      (resolve: (jsonData: JSON) => void, reject: (err: Error) => void) => {
        const internalMode: boolean = /^(1|true)$/.test(
          (Functions.getURLParameter() as UrlParameterFormat).InternalMode
        );
        const cdnUrl = `${PlatformData.gameConfig.RemoteResources}./Game/GameLobby/EventIcon/${PlatformData.logo}/${internalMode ? 'internal/' : ''}`;
        const iconSettingDownloader: EventIconSettingDownloader =
          new EventIconSettingDownloader();
        iconSettingDownloader.start(cdnUrl, resolve, reject);
        console.log(
          '[GameGuideManager] Init EventIconSetting download cdnUrl = ',
          cdnUrl
        );
      }
    )
      .then((jsonData: JSON) => {
        this.eventIconSetting = jsonData as unknown as EventIconSetting;
        console.log(
          '[GameGuideManager] Init EventIconSetting download jsonData = ',
          jsonData
        );
      })
      .catch(err => {
        console.error(
          '[GameGuideManager] Init EventIconSetting download error.',
          err
        );
        this.eventIconSetting = null;
      });

    if (onDownloadComplete) {
      onDownloadComplete(null);
    }
  }
}

/** EventIconSetting 參數格式 */
export interface EventIconSetting {
  /** EventIcon鍵值 */
  [GameName: string]: {
    /** 活動開始時間 */
    start?: string;
    /** 活動結束時間 */
    end?: string;
    /** 活動icon圖片網址 例.key為en-us */
    [keyName: string]: string;
  };
}

/** GameListSetting 參數格式 */
export interface GameListSetting {
  /** 遊戲排序 */
  GameList?: Array<string>;
  /** 遊戲詳細資訊 */
  GameDetailsList?: {
    /** 遊戲名稱 */
    [GameName: string]: {
      /** 遊戲ID */
      GameID?: number;
      /** 顯示名稱 */
      GameShowName?: string;
      /** 遊戲類型 */
      GameType?: string;
      /** 是否為熱門遊戲 */
      Hot?: boolean;
      /** 是否為新遊戲 */
      New?: boolean;
      /** 是否有ExtraBet */
      ExtraBet?: boolean;
      /** 刺激度(0~5) */
      Excitement?: number;
      /** 額外資訊 */
      ExtraData?: {
        /** 遊戲平台(H5、APP) */
        Platform?: string;
      };
    };
  };
}
