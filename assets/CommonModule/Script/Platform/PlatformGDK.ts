import {Delegate} from '../ExtraType';

export class PlatformGDK {
  private static _listDelegate: Delegate[] = [];
  private _listFunction: Function[] = [];

  public static get instance(): PlatformGDK {
    //@ts-expect-error window.PlatformGDK
    if (!window.PlatformGDK) {
      //@ts-expect-error window.PlatformGDK
      window.PlatformGDK = new PlatformGDK();
    }
    //@ts-expect-error window.PlatformGDK
    return window.PlatformGDK;
  }

  /** 呼叫平台端初始化 */
  public initialize: Delegate = new Delegate();
  /** 呼叫平台端Config初始化 */
  public initConfigSetting: Delegate = new Delegate();
  /** 平台端 Ready */
  public isReady: Delegate = new Delegate();

  /**
   * 發送平台EventLog
   */
  public sendEventLog: Delegate = new Delegate();

  /**
   * 顯示彈出訊息
   * @param msg
   * @param subMsg
   * @param callback
   * @param messageId 這個訊息的流水號(不代表播出順序)，帶入此參數可以指定修改此編號訊息的內容，但若此流水號不存在則會改為新增訊息，並回傳新的messageId
   * @param enablePopupTracking 是否啟用彈窗埋點，預設true
   * @param popupTrackingSubMsg 埋點專用副訊息，未傳時預設使用subMsg
   */
  public showPopUpMessage: Delegate = new Delegate();

  /**
   * 平台彈窗提示訊息
   * @param errorCode (number) 錯誤代碼
   */
  public showPopUpMessageByErrorCode: Delegate = new Delegate();

  /**
   * 設定 Loading 條演出的進度
   * @param percentage (number) 百分比
   * @param duration (number) 多久滾到此百分比
   */
  public setLoadingProgress: Delegate = new Delegate();

  /**
   * 開啟 Loading Page
   */
  public openLoadingPage: Delegate = new Delegate();

  /**
   * 關閉 Loading Page
   */
  public closeLoadingPage: Delegate = new Delegate();

  /**
   * 呼叫清除免費資料 Command
   */
  public clearFeature: Delegate = new Delegate();

  /**
   * 更新玩家資產
   * @param data (JSON) 玩家平台資產資料
   * @param duration (number) 更新時間
   */
  public updatePlayerBalance: Delegate = new Delegate();

  public syncPlayerBalance: Delegate = new Delegate();

  /**
   * 更新玩家資產
   * @param data (JSON) 玩家平台資產資料
   * @param coin (number) 資產
   * @param duration (number) 更新時間
   */
  public updatePlayerBalanceCountTo: Delegate = new Delegate();

  /**
   * 增加玩家資產 (分段表演用，需自行防呆)
   * @param winValue (number) 本次贏分
   * @param duration (number) 更新時間
   */
  public addPlayerBalance: Delegate = new Delegate();

  /**
   * 滾動玩家 Game Win (與 AwardManager 中 ShoowWinAni 做出區隔避免重複)
   * @param winValue (number) 本次贏分
   * @param duration (number) 更新時間
   */
  public rollGameWin: Delegate = new Delegate();

  /**
   * 接收到原始的 Start Game 資料
   * @param data (JSON) Start Game 資料
   */
  public receiveOriginalStartGameData: Delegate = new Delegate();

  /**
   * 接收到更改過的 Start Game 資料
   * @param data (JSON) Start Game 資料
   */
  public receiveStartGameData: Delegate = new Delegate();

  public receiveInGameStartGameData: Delegate = new Delegate();

  /**
   * 接收到 BuyBonus 資料
   * @param data (JSON) BuyBonus 資料
   */
  public receiveBuyBonusInfoData: Delegate = new Delegate();

  /**
   * 呼叫平台顯示 Win 分罐頭訊息，供特殊遊戲使用
   * @param winValue (number) ThisWin
   */
  public showWinMessage: Delegate = new Delegate();

  /**
   * 呼叫平台顯示 Win 分罐頭訊息，供特殊遊戲使用
   * @param winValue (number) ThisWin
   */
  public showBigWinMessage: Delegate = new Delegate();

  /**
   * 呼叫平台顯示 Win 分罐頭訊息，供特殊遊戲使用
   * @param winValue (number) ThisWin
   */
  public showFeatureWinMessage: Delegate = new Delegate();

  /**
   * 呼叫平台顯示 Win 分罐頭訊息，供特殊遊戲使用
   * @param winValue (number) ThisWin
   */
  public showLineWinMessage: Delegate = new Delegate();

  /**
   * 呼叫平台顯示客製罐頭訊息，供特殊遊戲使用
   * @param message (string) 訊息內容
   */
  public showCustomMessage: Delegate = new Delegate();

  /**
   * 呼叫平台顯示罐頭訊息，供特殊遊戲使用
   * @param time (number) 倒數時間
   */
  public showCountDownMessage: Delegate = new Delegate();

  /**
   * 呼叫平台顯示 Good Luck 罐頭訊息，供特殊遊戲使用
   */
  public showGoodLuckMessage: Delegate = new Delegate();

  /**
   * 清除平台罐頭訊息，供特殊遊戲使用
   */
  public clearMessage: Delegate = new Delegate();

  /**
   * 隱藏平台罐頭訊息，供特殊遊戲使用
   */
  public hideMessage: Delegate = new Delegate();

  public connectServerReady: Delegate = new Delegate();

  public commandDataIsNull: Delegate = new Delegate();

  public commandErrorHandler: Delegate = new Delegate();

  public startBQLog: Delegate = new Delegate();

  public quitBQLog: Delegate = new Delegate();

  /** 離開遊戲(SS) */
  public backToLobby: Delegate = new Delegate();
  /** 平台遊戲場景Bundle下載完成(SS) */
  public loadBundleComplete: Delegate = new Delegate();
  /** 串接平台Socket(SS) */
  public initPlatformSystem: Delegate = new Delegate();
  /** 取得平台資產(SS) */
  public getAssetData: Delegate = new Delegate();
  /** 更新平台資產(SS) */
  public updateAssetData: Delegate = new Delegate();

  public blockActivityInput: Delegate = new Delegate();

  /** 開啟跳轉專用loading與msgbox */
  public showRedirectLoading: Delegate = new Delegate();
  public showRedirectMsgBox: Delegate = new Delegate();

  /** GameInit GameClient完成登入 */
  public onGameClientInitCompleted: Delegate = new Delegate();

  /** 遊戲Ready後 */
  public afterGameReady: Delegate = new Delegate();

  /** 顯示分享畫面 (callback: Function) */
  public showSharePopup: Delegate = new Delegate();

  public getWinType: Function = null;

  /**
   * 取得一個事件來註冊或呼叫
   * @param index 事件名稱 (若是多模組公用請在 EventSystem 下方新增 Global 變數)
   * @returns Delegate
   */
  public static event(index: string): Delegate {
    if (PlatformGDK._listDelegate[index]) {
      return PlatformGDK._listDelegate[index];
    } else {
      PlatformGDK._listDelegate[index] = new Delegate();
      return PlatformGDK._listDelegate[index];
    }
  }

  /**
   * 取得一個 Function
   * @param index 提供者註冊的 Function 名稱 (若是多模組公用請使用 EventSystem 下方 Global 變數)
   * @returns Function
   */
  public function(index: string): Function {
    if (PlatformGDK.instance._listFunction[index]) {
      return PlatformGDK.instance._listFunction[index];
    } else {
      return () => {
        console.warn("There is no Function registered named '" + index + "'");
      };
    }
  }

  /**
   * 註冊一個 Function
   * @param index 要註冊的 Function 名稱 (若是多模組公用請在 EventSystem 下方新增 Global 變數)
   * @param callBack 要註冊的 Function
   */
  public registerFunction(index: string, callBack: Function): void {
    if (PlatformGDK.instance._listFunction[index]) {
      console.warn(
        "There is already a Function registered named '" +
          index +
          "'\n System will cancell the registration!"
      );
    } else {
      PlatformGDK.instance._listFunction[index] = new Function();
      PlatformGDK.instance._listFunction[index] = callBack;
    }
  }

  public unregisterFunction(index: string): void {
    if (PlatformGDK.instance._listFunction[index]) {
      PlatformGDK.instance._listFunction[index] = null;
    } else {
      console.warn(
        "There is no Function registered named '" +
          index +
          "'\n System will do Nothing!"
      );
    }
  }

  public destroy(): void {
    for (let i of PlatformGDK._listDelegate) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      i = null;
    }
    PlatformGDK._listDelegate = [];

    for (let i of PlatformGDK.instance._listFunction) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      i = null;
    }
    PlatformGDK.instance._listFunction = [];
    // PlatformGDK._instance = null;
  }
}

enum PlatformPurchaseEvent {
  OnPurchaseSuccess = '[Purchase]_OnPurchaseSuccess',
  OnPurchasePanelDisable = '[Purchase]_OnPurchasePanelDisable',
  ShowPanel = '[Purchase]_ShowPanel',
}

enum CookieEvent {
  Set = '[Cookie]_Set',
  Get = '[Cookie]_Get',
}

enum SlotUIFunc {
  GetDownBarMgr = '[SlotUI]_GetDownBarMgr',
  GetPrizeViewer = '[SlotUI]_GetPrizeViewer',
  GetMsgMgr = '[SlotUI]_GetMsgMgr',
  GetDownBarGameWin = '[SlotUI]_GetDownBarGameWin',
}

enum EventGameFlow {
  onHTMLLoad = 0,
  gameInit = 1,
  LoginFinished = 2,
  inGame = 3,
  firstPlay = 4,
}

enum GAEventGameFlow {
  //開啟網頁
  htmlLoad = 'HTMLLoaded',
  //引擎載入完成
  engineLoaded = 'engineLoaded',
  //
  getPluginAndGetBundleVersion = 'getPluginAndGetBundleVersion',
  //
  initBundleManager = 'initBundleManager',
  //
  loadAndSetLoadingPage = 'loadAndSetLoadingPage',
  //
  loadRootBundle = 'loadRootBundle',
  //
  loadAndSetDynamicUI = 'loadAndSetDynamicUI',
  //遊戲場景載入完成
  gameLoadFinish = 'gameLoadFinish',
  //顯示繼續按鈕
  showLoadingContinueBtn = 'showLoadingContinueBtn',
  //點擊繼續按鈕
  onClickContinueBtn = 'onClickContinueBtn',
  //第一次spin
  firstPlay = 'firstPlay',
}

export {
  SlotUIFunc,
  EventGameFlow,
  GAEventGameFlow,
  PlatformPurchaseEvent,
  CookieEvent,
};
