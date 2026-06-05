declare namespace BQLOG {
  interface EventLog {
    CreateTS: number;
    UserID: number;
    ArkID: string;
    SessionID: string;
    CreditType: string;
    GameID: string;
    GamePublishVer: string;
    EventID: number;
    SysType: string;
    SysVer: string;
    SysArchitecture: string;
    PlatformName: string;
    PlatformVersion: string;
    PlatformDescription: string;
    TempStr1?: string;
    TempStr2?: string;
    TempStr3?: string;
    TempStr4?: string;
    TempStr5?: string;
    TempStr6?: string;
    GameClientIP?: string;
  }
  interface ErrorLog {
    CreateTS: number;
    UserID: number;
    ArkID: string;
    SessionID: string;
    CreditType: string;
    GameID: string;
    GamePublishVer: string;
    EventID: number;
    SysType: string;
    SysVer: string;
    SysArchitecture: string;
    PlatformName: string;
    PlatformVersion: string;
    PlatformDescription: string;
    TempStr1?: string;
    TempStr2?: string;
    TempStr3?: string;
    TempStr4?: string;
    TempStr5?: string;
    TempStr6?: string;
    GameClientIP?: string;
  }
  interface PlayerExpPingLog {
    MerchantID: string;
    UserID: number;
    MerchantUserAccount: string;
    PublishVer: string;
    GamePublishVer: string;
    MerchantGameID: string;
    OfferID: number;
    ServerIpAddress: string;
    Count: number;
    Value: number;
  }
  interface PlayerExpFpsLog {
    MerchantID: string;
    UserID: number;
    MerchantUserAccount: string;
    PublishVer: string;
    GamePublishVer: string;
    MerchantGameID: string;
    OfferID: number;
    Detail: string;
    Count: number;
    Value: number;
  }
  interface RequestJsonBody {
    event_type: string;
    event_data: JSON;
  }
  interface Config {
    serverUrl: string;
    showLog: boolean;
    sendEvent: boolean;
  }
  class SessionStorageData {
    loginAccount: string | null;
    apiAid: string | null;
    loginToken: string | null;
    ssoToken: string | null;
    merchantID: string | null;
    publishVer: string | null;
    offerId: number | null;
    constructor(data: any);
  }
  class LocalStorageData {
    userId: number | null;
    gameId: string | null;
    gameVersion: string | null;
    creditType: string | null;
    arkId: string | null;
    arkToken: string | null;
    constructor();
  }
  enum EventLogID {
    LOAD_WEBPAGE = 32,
    LOAD_ENGINE_COMPLETE = 33,
    LOAD_SCENE_COMPLETE = 34,
    LOAD_GAME_COMPLETE = 35,
    CLICK_PLAY = 36,
    SEE_GAME_SCENE = 39,
    PLAY_SUCCESS = 40,
    CLICK_INFO = 52,
    FISH_TUTORIAL_START_TUTORIAL = 62,
    FISH_TUTORIAL_START_GAME = 63,
    FISH_TUTORIAL_SKIP_CLICK = 64,
    FISH_TUTORIAL_SKIP_OK = 65,
    FISH_TUTORIAL_SKIP_CANCEL = 66,
    FISH_TUTORIAL_SCENE_FISH_ONE_SHOOT = 67,
    FISH_TUTORIAL_SCENE_ADD_BET = 68,
    FISH_TUTORIAL_SCENE_FISH_TWO_SHOOT = 69,
    FISH_TUTORIAL_SCENE_USE_LOCK_WEAPON = 70,
    FISH_TUTORIAL_SCENE_FISH_THREE_LOCK = 71,
    FISH_TUTORIAL_SCENE_USE_AUTO_LOCK = 72,
    FISH_TUTORIAL_SCENE_FISH_BOSS_LOCK = 73,
    FISH_TUTORIAL_RESTART_TUTORIAL = 74,
    FISH_TUTORIAL_END_TUTORIAL = 75,
    FISHHUNTER_STAY_IN_GAME = 192,
    FISHHUNTER_GO_TO_OCEANPARADISE = 193,
    EVENT_COIN_ICON_CLICK = 202,
    EVENT_COIN_ACTIVITY_START = 203,
    EVENT_COIN_ACTIVITY_STOP = 204,
    EVENT_COIN_GAME_ICON_CLICK = 205,
    EVENT_COIN_REDIRECT_CONFIRM = 206,
    EVENT_COIN_REDIRECT_RETURN = 207,
    EVENT_COIN_RESULT_EXIT = 209,
    EVENT_COIN_RESULT_CONTINUE = 210,
  }
  enum ErrorCode {
    DOWNLOAD_ENGINE_FAILED = '100',
    PARSE_GAMESETTING_FAILED = '200',
    LOAD_GAMESETTING_FAILED = '250',
    LOGIN_FAILED = '300',
    LOAD_RES_FAILED = '400',
    GET_SERVER_DATA_FAILED = '500',
  }
  enum SlotErrorCode {
    START_GAME_ERROR = '600',
    SPIN_ERROR = '700',
    NEXT_FEVER_ERROR = '800',
    INGAME_JP_ERROR = '900',
  }
  enum FishErrorCode {
    DATA_ERROR = '600',
  }
  enum PlayerExpEvent {
    StartPing = 'StartPing',
    StartFps = 'StartFps',
    GetStatusReturn = 'GetStatusReturn',
  }
  interface FpsDetail {
    ElaspedTime: number;
    FPS: number;
    Stage: number;
  }
  class Logger {
    static serverUrl: string;
    static gameClientIP: string;
    static sessionStorageData: SessionStorageData;
    static localStorageData: LocalStorageData;
    static GetDataFromLobby(): Promise<void>;
    static GetDataFromUrl(): void;
    static Init(): Promise<void>;
    static SendLog(event_type: string, event_data: unknown): void;
    static SendEventLogById(
      eventID: number,
      tempStr1?: string,
      tempStr2?: string,
      tempStr3?: string,
      tempStr4?: string,
      tempStr5?: string,
      tempStr6?: string
    ): void;
    static SendErrorLogById(
      eventID: number,
      tempStr1: string,
      tempStr2?: string,
      tempStr3?: string,
      tempStr4?: string,
      tempStr5?: string,
      tempStr6?: string
    ): void;
    static SendEventLog(
      eventID: EventLogID,
      tempStr1?: string,
      tempStr2?: string,
      tempStr3?: string,
      tempStr4?: string,
      tempStr5?: string,
      tempStr6?: string
    ): void;
    static SendErrorLog(
      errorCode: ErrorCode | SlotErrorCode | FishErrorCode,
      errorEventMessage: string,
      errorEventReason?: string,
      errorEventCode?: string
    ): void;
    static SendPlayerPingLog(ip: string, count: number, value: number): void;
    static SendPlayerFpsLog(detail: string, count: number, value: number): void;
  }
  const isInitialized: () => boolean;
}
