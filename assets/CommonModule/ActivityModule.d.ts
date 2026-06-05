import {Component, Node} from 'cc';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  abstract class ActivityBase
    extends Component
    implements ActivityModule.IActivityBase
  {
    protected abstract activityName: string;
    protected isUnread: boolean;
    /** 未讀事件 */
    protected unreadEvent: Signal;
    /**
     * 同步主專案平台資料
     * @param platformData 平台資料
     */
    SyncData(platformData: any): void;
    /**
     * 初始化ActivityBase
     */
    Init(): void;
    /**
     * 釋放ActivityBase資源
     */
    Release(): void;
    /**
     * 顯示提示
     * @param message 提示訊息
     * @param isKeep 是否保持提示
     */
    ShowPrompt(message: string, isKeep?: boolean): void;
    /**
     * 設定未讀狀態
     * @param isUnread 是否未讀
     */
    SetUnread(isUnread?: boolean): void;
    /**
     * 取得圖示節點
     * @returns {Node} 圖示節點
     */
    GetIcon(): Node;
    /**
     * 註冊監聽事件
     * @param event 活動基底事件
     * @param listener 監聽事件觸發的函式
     * @param context 監聽事件觸發函式的對象
     */
    AddEventListener(
      event: enumActivityBaseEvent,
      listener: Function,
      context?: Object
    ): void;
    /**
     * 移除註冊監聽事件
     * @param event 活動基底事件
     * @param listener 監聽事件觸發的函式
     * @param context 監聽事件觸發函式的對象
     */
    RemoveEventListener(
      event: enumActivityBaseEvent,
      listener: Function,
      context?: Object
    ): void;
    /**
     * 檢查活動是否啟用
     */
    abstract CheckActivityEnable(): any;
    /**
     * 供ActivityManager主動開啟活動頁面
     */
    abstract AutoShowActivity(): any;
    /**
     * 活動名稱
     */
    get ActivityName(): string;
    /**
     * 是否未讀
     */
    get IsUnread(): boolean;
  }

  namespace ActivityModule {
    /** 活動管理類型列舉 */
    enum enumActivityManagerType {
      /** 大廳 */
      LOBBY = 0,
      /** 遊戲 */
      IN_GAME = 1,
      /** 單一活動 */
      SINGLE = 2,
    }
    /** 活動事件名稱列表 */
    const ActivityEventName: ActivityEventName;
    /**
     * 實例化活動管理Prefab
     * @param managerType 活動管理類型
     * @param activityManagerParent 活動管理父節點
     * @param activityLayerParent 活動層父節點
     */
    function InstantiateActivityManagerPrefab(
      managerType: enumActivityManagerType,
      activityManagerParent?: Node,
      activityLayerParent?: Node
    ): Node;
    class ActivityManager extends Component {
      /** 取得 Singleton 物件實體 */
      static get Instance(): ActivityManager;
      /** Instance 實體 */
      protected static instance: ActivityManager;
      /** 活動管理類型列表 */
      private activityManagerTypeList;
      /** 遊戲名稱列表 (供外部設定 作為中介變數傳遞) */
      GameNameList: GameNameTable;
      /** 多語系遊戲名稱列表 */
      MultiGameNameList: MultiGameNameTable;
      /** 是否在遊戲中 */
      IsInGame: boolean;
      /** 主遊戲是否就緒 */
      IsMainGameReady: boolean;
      /** 自動關閉選單時間 */
      AutoCloseMenuTime: number;
      /** 是否可在遊戲中跳轉其他遊戲 */
      CanRedirectInGame: boolean;
      /** 時區 */
      TimeZone: number;
      /** 活動管理類型 */
      protected managerType: enumActivityManagerType;
      /** 活動模組設定 */
      protected activityModuleSetting: ActivityModuleSetting;
      /** 活動管理 */
      protected activityManager: IActivityManager;
      /** 依賴的ArkClient對象 */
      private arkClient;
      onLoad(): void;
      onDestroy(): void;
      /**
       * 同步主專案平台資料
       * @param platformData 平台資料
       */
      SyncData(platformData: any): void;
      /**
       * 初始化ActivityManager
       */
      Init(singleActivityName?: string): Promise<void>;
      /**
       * 釋放ActivityManager資源
       */
      Release(): void;
      /**
       * 依管理類型實例化活動管理Prefab
       * @param managerType 活動管理類型
       * @param activityManagerParent 活動管理父節點
       * @param activityLayerParent 活動層父節點
       */
      InstantiateManagerPrefab(
        managerType?: enumActivityManagerType,
        activityManagerParent?: Node,
        activityLayerParentNode?: Node
      ): void;
      /**
       * 設定活動管理父節點
       * @param parent
       */
      SetActivityManagerParent(parent: Node): void;
      /**
       * 設定活動層父節點
       * @param parent
       */
      SetActivityLayerParent(parent: Node): void;
      /**
       * 擴展選單
       * @param isExpand
       */
      ExpandMenu(isExpand?: boolean): void;
      /**
       * 設定ActivityManager顯示狀態
       * @param isVisible
       */
      SetVisible(isVisible: boolean): void;
      /**
       * 設置ArkClient
       * @param arkClient
       */
      SetupArkClient(arkClient: ArkClient): void;
      /**
       * 是否為擴展狀態
       */
      get IsExpand(): boolean;
      /**
       * 同步資料給活動，如果在AddActivity前需要PlatformData才呼叫
       * @param activity
       */
      SyncActivityData(activity: ActivityBase);
      /**
       * 新增活動
       * @param activity
       * @param activityIcon
       * @returns {boolean} 是否成功
       */
      AddActivity(activity: ActivityBase, activityIcon: Prefab): boolean;
      /**
       * 移除活動
       * @param activity
       */
      RemoveActivity(activity: ActivityBase): void;
      /**
       * 自動開啟活動頁面
       * @param activity
       */
      AutoShowActivity(activity: ActivityBase): void;
      /**
       * 自動關閉遊戲
       * @param activity
       */
      AutoCloseGame(activity: ActivityBase): void;
      /**
       * 設置HttpSystem 附加ArkClient至指定HttpSystem進行命令收發
       * @param system
       */
      SetupHttpSystem(system: BaseArkSystem): void;
      /**
       * 取得MultiGameList
       * (因可由外部設定 故提供此功能)
       * @param onComplete
       * @param onError
       */
      DownloadMultiGameNameList(
        onComplete: (json: JSON) => void,
        onError: (err: Error) => void
      ): void;
      /**
       * 取得活動Icon節點
       * @param activity
       * @returns {Node} Icon節點
       */
      GetIcon(activity: ActivityBase): Node;
      /**
       * 設定活動Icon是否可互動
       * @param activity
       * @param isInteractable
       */
      SetIconInteractable(
        activity: ActivityBase,
        isInteractable: boolean
      ): void;
      /**
       * 取得ActivityModuleSetting
       * @param onComplete
       * @param onError
       */
      protected DownloadActivityModuleSetting(
        onComplete: (json: JSON) => void,
        onError: (err: Error) => void
      ): void;
      /**
       * 命名轉換 蛇型轉大駝峰
       * @param str
       */
      protected SnakeToPascal(str: string): string;
    }
    class CommonFunction {
      /**
       * 由外部強制設定遊戲列表快取；傳入 null 可清除快取
       * @param listSetting
       */
      static SetGameListSetting(listSetting: GameListSetting | null): void;
      /**
       * 遊戲跳轉
       * @param gameName
       */
      static RedirectGame(gameName: string | RedirectGameParam): void;
      /**
       * 取得遊戲列表
       * @param callBack  (GameListSetting)=>void
       */
      static GetGameList(
        callBack: (listSetting: GameListSetting) => void
      ): void;
    }
    /** 遊戲跳轉參數 */
    interface RedirectGameParam {
      GameName: string;
      CurrencyName: string;
    }
    /** 遊戲名稱表 */
    interface GameNameTable {
      [GameName: string]: {
        GameID?: number;
        GameShowName?: string;
      };
    }
    /** 多語系遊戲名稱表 */
    interface MultiGameNameTable {
      [GameName: string]: {
        [Lang: string]: string;
      };
    }
    /** 活動模組設定 */
    interface ActivityModuleSetting {
      /** Manager設定 */
      ManagerSetting?: {
        [TypeName: string]: ManagerSetting;
      };
      /** 活動刷新時間 */
      ActivityRefreshSec?: number;
      /** 是否可在遊戲中跳轉其他遊戲 */
      CanRedirectInGame?: boolean;
      /** 時區 */
      TimeZone?: number;
    }
    /** Manager設定 */
    interface ManagerSetting {
      /** 活動設定 */
      ActivitySetting?: ActivitySetting;
    }
    /** 活動設定 */
    interface ActivitySetting {
      [ActivityName: string]: ActivityInfo;
    }
    /** 活動資訊 */
    interface ActivityInfo {
      /** 活動排序 */
      Sort?: number;
      /** 載入優先權 (未實作) */
      Priority?: string;
    }
    /** 活動事件名稱 */
    interface ActivityEventName extends EventNameList {
      /** [管理 > 活動] 檢查活動是否啟用 */
      readonly CHECK_ACTIVITY_ENABLE: string;
      /** [管理/活動 > 遊戲] 開啟遊戲 參數: ( gameName: string ) */
      readonly OPEN_GAME: string;
      /** [遊戲 > 活動] 關閉遊戲 */
      readonly CLOSE_GAME: string;
      /** [遊戲 > 活動] 主遊戲就緒 */
      readonly MAIN_GAME_READY: string;
      /** [遊戲 > 活動] 阻擋活動輸入 參數: ( isBlock: boolean ) */
      readonly BLOCK_ACTIVITY_INPUT: string;
      /** [遊戲 > 活動] 遊戲切換押注 參數： ( bet: number ) */
      readonly GAME_CHANGE_BET: string;
      /** [遊戲 > 活動] 玩家點擊押注 */
      readonly GAME_PLAYER_CLICK_BET: string;
      /** [活動 > 管理/遊戲] 中場休息事件開始 參數: ( param: IntermissionEventParam ) */
      readonly INTERMISSION_EVENT_BEGIN: string;
      /** [遊戲 > 管理] 遊戲呼叫中場休息事件就緒 參數: ( id: string ) */
      readonly INTERMISSION_EVENT_GAME_READY: string;
      /** [管理 > 活動] 中場休息事件就緒 參數: ( id: string ) */
      readonly INTERMISSION_EVENT_READY: string;
      /** [活動 > 管理] 中場休息事件結束 參數: ( param: string | IntermissionEventParam ) */
      readonly INTERMISSION_EVENT_END: string;
      /** [管理 > 遊戲] 所有中場休息事件結束 */
      readonly INTERMISSION_EVENT_ALL_END: string;
      /** [活動 > 遊戲] 暫停更新資產 參數: ( isPause: boolean, autoResumeAfterSec: number ) */
      readonly PAUSE_REFRESH_BALANCE: string;
      /** [活動 > 遊戲] 更新資產 參數: ( asset: number ) */
      readonly UPDATE_BALANCE: string;
      /** [活動 > 管理] 活動初始化完成 參數: ( activity: ActivityBase ) */
      readonly ACTIVITY_INIT_COMPLETE: string;
      /** [活動 > 管理] 活動關閉頁面 參數: ( activity: ActivityBase ) */
      readonly ACTIVITY_CLOSE: string;
      /** [管理 <-> 遊戲] 取得主遊戲是否就緒 參數： ( isReady: boolean ) */
      readonly GET_MAIN_GAME_READY: string;
      /** [活動 <-> 遊戲] 取得HUD是否顯示 參數： ( isDisplay: boolean ) */
      readonly GET_HUD_DISPLAY: string;
      /** [活動 <-> 遊戲] 取得遊戲押注段 參數： ( betList: Array<number>, betIndex:number ) */
      readonly GET_GAME_BET_LIST: string;
      /** [活動 <-> 遊戲] 取得遊戲押注 參數： ( bet: number ) */
      readonly GET_GAME_BET: string;
      /** [活動 <-> 遊戲] 取得遊戲總押注 參數： ( totalBet: number ) */
      readonly GET_GAME_TOTAL_BET: string;
      /** [活動 <-> 遊戲] 取得遊戸總押注（含Scale） 參數： ( totalBet: number ) */
      readonly GET_GAME_TOTAL_BET_WITH_SCALE: string;
      /** [活動 <-> 遊戲] 取得遊戲資產 參數： ( asset: number ) */
      readonly GET_GAME_BALANCE: string;
      /** [活動 > 遊戲] 使用道具委派開始 參數： ( param: ItemDelegateParam ) */
      readonly USE_ITEM_DELEGATE_BEGIN: string;
      /** [活動 > 遊戲] 使用道具委派結束 參數： ( param: ItemKeyInfo ) */
      readonly USE_ITEM_DELEGATE_END: string;
    }
    interface IActivityManager {
      /** 是否為擴展狀態 */
      readonly IsExpanded: boolean;
      /**
       * 初始化活動管理
       */
      Init(): any;
      /**
       * 釋放活動管理資源
       */
      Release(): any;
      /**
       * 設定Manager配置
       * @param setting
       */
      SetManagerSetting(setting: ManagerSetting): any;
      /**
       * 設定顯示狀態
       * @param isVisible
       */
      SetVisible(isVisible: boolean): any;
      /**
       * 設定父節點
       * @param parent
       */
      SetParent(parent: Node): any;
      /**
       * 設定活動層父節點
       * @param parent
       */
      SetActivityLayerParent(parent: Node): any;
      /**
       * 設定活動更新間隔時間
       * @param interval 間隔秒數
       */
      SetRefreshInterval(interval: number): any;
      /**
       * 預新增活動節點
       * (因節點未生成且未啟用時 無法執行對應Script 故提供此功能)
       * @param activity 活動類別節點
       */
      PreAddActivity(activity: Node): any;
      /**
       * 新增活動
       * @param activity 活動類別
       * @param activityIcon 活動圖示
       * @returns {boolean} 是否成功
       */
      AddActivity(activity: ActivityBase, activityIcon: Prefab): boolean;
      /**
       * 移除活動
       * @param activity 活動類別
       */
      RemoveActivity(activity: ActivityBase): any;
      /**
       * 擴展選單
       * @param isExpand
       */
      ExpandMenu(isExpand: boolean): any;
      /**
       * 取得活動Icon節點
       * @param activity 活動類別
       * @returns {Node} Icon節點
       */
      GetIcon(activity: ActivityBase): Node;
      /**
       * 設定活動Icon是否可互動
       * @param activity 活動類別
       * @param isInteractable 是否可互動
       */
      SetIconInteractable(activity: ActivityBase, isInteractable: boolean): any;
      /**
       * 取得活動數量
       * @returns {number} 活動數量
       */
      GetActivityCount(): number;
      /**
       * 銷毀物件
       * (因活動管理物件未必隸屬此物件 故提供此功能)
       */
      Destroy(): any;
    }
    interface IActivityBase extends Component {
      /** 活動名稱 */
      readonly ActivityName: string;
      /** 是否未讀 */
      readonly IsUnread: boolean;
      /**
       * 初始化活動
       */
      Init(): any;
      /**
       * 釋放活動資源
       */
      Release(): any;
      /**
       * 檢查活動是否啟用
       */
      CheckActivityEnable(): any;
      /**
       * 供ActivityManager主動開啟活動頁面
       */
      AutoShowActivity(): any;
      /**
       * 設定未讀狀態
       * @param isUnread 是否未讀
       */
      SetUnread(isUnread?: boolean): any;
      /**
       * 取得圖示節點
       * @returns {Node} 圖示節點
       */
      GetIcon(): Node;
      /**
       * 註冊活動監聽事件
       * @param event 活動基底事件
       * @param listener 監聽事件觸發的函式
       * @param context 監聽事件觸發函式的對象
       */
      AddEventListener(
        event: enumActivityBaseEvent,
        listener: Function,
        context?: Object
      ): any;
      /**
       * 移除註冊監聽事件
       * @param event 活動基底事件
       * @param listener 監聽事件觸發的函式
       * @param context 監聽事件觸發函式的對象
       */
      RemoveEventListener(
        event: enumActivityBaseEvent,
        listener: Function,
        context?: Object
      ): any;
    }
    /** 中場休息事件參數 */
    interface IntermissionEventParam {
      /** 中場休息就緒執行內容 */
      OnReadyEvent: Function;
      /** 事件ID */
      ID: string;
    }

    /** 道具鍵值資訊 */
    interface ItemKeyInfo {
      DelegateID: string;
      SessionID: string;
      ItemID: string;
    }

    /** 道具委派參數 */
    interface ItemDelegateParam extends ItemKeyInfo {
      Amount: number;
      Ratio: number;
      UseItemEvent?: (amount: number) => void;
      UseItemSuccessEvent?: (win: number) => void;
    }
  }

  /** 活動基底事件 */
  enum enumActivityBaseEvent {
    /** 未讀狀態 參數: ( isUnread: boolean ) */
    UNREAD = 'ActivityBase_UnreadEvent',
    /** 顯示提示 參數: ( message: string, isKeep: boolean ) */
    SHOW_PROMPT = 'ActivityBase_ShowPromptEvent',
  }
}
