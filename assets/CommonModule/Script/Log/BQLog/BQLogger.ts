import {DEV} from 'cc/env';
import {PlatformData} from '../../Define/PlatformData';
import {
  BQErrorCode,
  FishEventLogID,
  GameCommonEventLogID,
  SkyEventLogID,
  SlotEventLogID,
} from './BQLogDefine';

function isBQLogAvailable(): boolean {
  return (
    typeof BQLOG !== 'undefined' &&
    BQLOG !== null &&
    typeof BQLOG.Logger !== 'undefined' &&
    BQLOG.Logger !== null &&
    !DEV &&
    PlatformData.instance.enableBQLog
  );
}

export default class BQLogger {
  //#region EventLog
  public static sendEventLog(
    eventID: BQLOG.EventLogID | number,
    tempStr1?: string,
    tempStr2?: string,
    tempStr3?: string,
    tempStr4?: string
  ) {
    if (!isBQLogAvailable()) {
      return;
    }
    try {
      if (eventID in BQLOG.EventLogID)
        BQLOG.Logger.SendEventLog(
          eventID,
          tempStr1,
          tempStr2,
          tempStr3,
          tempStr4
        );
    } catch (e) {
      console.warn(e);
    }
  }
  private static _logBuffer: {
    eventID: number;
    tempStr1?: string;
    tempStr2?: string;
    tempStr3?: string;
    tempStr4?: string;
    tempStr5?: string;
    tempStr6?: string;
  }[] = [];

  // 20250522 根據中繼層新增加轉拋ByID事件
  public static SendEventLogById(
    eventID: number,
    tempStr1?: string,
    tempStr2?: string,
    tempStr3?: string,
    tempStr4?: string,
    tempStr5?: string,
    tempStr6?: string
  ) {
    //設定enableBQLog的時間太晚 所以直接讓它通過
    if (DEV || PlatformData.isDaraEnv) {
      return;
    }
    if (typeof BQLOG !== 'undefined' && BQLOG !== null) {
      // 先補拋之前暫存的 log
      this._flushBufferedLogs();

      try {
        BQLOG.Logger.SendEventLogById(
          eventID,
          tempStr1,
          tempStr2,
          tempStr3,
          tempStr4,
          tempStr5,
          tempStr6
        );
      } catch (e) {
        //存錯誤
        console.warn(e);
      }
    } else {
      //存擋起來 log
      this._logBuffer.push({
        eventID,
        tempStr1,
        tempStr2,
        tempStr3,
        tempStr4,
        tempStr5,
        tempStr6,
      });
    }
  }
  private static _flushBufferedLogs() {
    if (!this._logBuffer.length) return;

    for (const log of this._logBuffer) {
      try {
        BQLOG.Logger.SendEventLogById(
          log.eventID,
          log.tempStr1,
          log.tempStr2,
          log.tempStr3,
          log.tempStr4,
          log.tempStr5,
          log.tempStr6
        );
      } catch (e) {
        console.warn(e);
      }
    }

    this._logBuffer = []; // 清空
  }

  // 20250522 根據中繼層新增加轉拋ByID事件
  public static SendErrorLogById(
    eventID: number,
    tempStr1?: string,
    tempStr2?: string,
    tempStr3?: string,
    tempStr4?: string,
    tempStr5?: string,
    tempStr6?: string
  ) {
    if (
      DEV ||
      !PlatformData.instance.enableBQLog ||
      PlatformData.isDaraEnv ||
      typeof BQLOG === 'undefined' ||
      BQLOG === null
    ) {
      return;
    }
    try {
      BQLOG.Logger.SendErrorLogById(
        eventID,
        tempStr1,
        tempStr2,
        tempStr3,
        tempStr4,
        tempStr5,
        tempStr6
      );
    } catch (e) {
      console.warn(e);
    }
  }

  public static setArkID(arkId: string): void {
    // if (DEV || !PlatformData.instance.enableBQLog || PlatformData.isDaraEnv) {
    //   return;
    // }
    try {
      localStorage.setItem('ArkId', arkId);
    } catch (e) {
      console.warn(e);
    }
  }

  public static setArkToken(arkToken: string): void {
    // if (DEV || !PlatformData.instance.enableBQLog || PlatformData.isDaraEnv) {
    //   return;
    // }
    try {
      localStorage.setItem('ArkToken', arkToken);
    } catch (e) {
      console.warn(e);
    }
  }

  public static setGameVersion(version: string): void {
    // if (DEV || !PlatformData.instance.enableBQLog || PlatformData.isDaraEnv) {
    //   return;
    // }
    try {
      localStorage.setItem('GameVersion', version);
    } catch (e) {
      console.warn(e);
    }
  }

  //** 紀錄時間
  public static getGameLoadingTime(setTimestamp = true) {
    const now = Date.now();
    const item = localStorage.getItem('BQgameLoadingTime');
    if (item === null || item === undefined) {
      localStorage.setItem('BQgameLoadingTime', now.toString());
      return (0).toString();
    }
    const before = parseInt(item);
    const duration = now - before;
    if (setTimestamp) localStorage.setItem('BQgameLoadingTime', now.toString());
    return duration.toString();
  }

  public static getGameLoadingTimeForStart() {
    const now = Date.now();
    const item = localStorage.getItem('BQgameLoadingTimeForStart');

    if (item === null || item === undefined) {
      localStorage.setItem('BQgameLoadingTimeForStart', now.toString());
      return (0).toString();
    }
    const before = parseInt(item);
    const duration = now - before;
    return duration.toString();
  }

  /** 載入模式標記：launcher 或 direct */
  private static getLoadMode(): string {
    return PlatformData.isLauncherMode ? 'launcher' : 'direct';
  }

  /**轉化率事件 */
  /**引擎載入完成 V*/
  public static sendLoadEngine() {
    //設定enableBQLog的時間太晚 所以直接讓它通過
    if (DEV) {
      return;
    }

    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.LOAD_ENGINE,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**取得設定完成 V*/
  public static sendGetPluginBundleVersion() {
    //設定enableBQLog的時間太晚 所以直接讓它通過
    if (DEV) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.GET_PLUGIN_BUNDLE_VERSION,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**初始化bundleManger完成 V*/
  public static sendInitBundleManager() {
    //設定enableBQLog的時間太晚 所以直接讓它通過
    if (DEV) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.INIT_BUNDLE_MANAGER,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**下載動態loading頁完成 V*/
  public static sendLoadSetLoadingPage() {
    //設定enableBQLog的時間太晚 所以直接讓它通過
    if (DEV) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.LOAD_SET_LOADING_PAGE,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**下載初始bundle完成 V*/
  public static sendLoadRootBundle() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.LOAD_ROOT_BUNDLE,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**下載訊息框資源完成 V*/
  public static sendLoadSetDynamicUI() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.LOAD_SET_DYNAMIC_UI,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**遊戲Loading完成 V(有兩個地方)*/
  public static sendLoading() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.LOADING,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**SSO Login完成 V*/
  public static sendSsoLoginComplete() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime(false);
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.SSO_LOGIN_COMPLETE,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**顯示繼續按鈕 V*/
  public static sendShowLoadingContinueBtn() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.SHOW_LOADING_CONTINUE_BTN,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**點擊Continue-進入遊戲畫面 */
  public static sendClickContinue() {
    if (!isBQLogAvailable()) {
      return;
    }
    //測試用
    if (PlatformData.gameSetting?.DebugMode) {
      BQLogger.TestErrorLog();
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.CLICK_CONTINUE,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**看到遊戲初始畫面  */
  public static sendShowInitialScreen() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.SHOW_INITIAL_SCREEN,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**成功遊玩一筆注單紀錄(點擊SPIN/射擊) V*/
  public static sendFirstPlay() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.FIRST_PLAY,
      duration,
      durationForStart,
      this.getLoadMode()
    );
  }

  /**取得domain完成 */
  public static sendGetGameDomain() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.GET_GAME_DOMAIN,
      duration,
      durationForStart
    );
  }

  /**單純取的domainlist完成 */
  public static sendGetGameDomainListFinish() {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.GET_GAME_DOMAIN_LIST_FINISH,
      duration,
      durationForStart
    );
  }

  /**驗證domain並如果有發生錯誤一並檢查完成 */
  public static sendGetGameDomainListRetryFinish(retryCount?: number) {
    if (!isBQLogAvailable()) {
      return;
    }
    const duration = this.getGameLoadingTime();
    const durationForStart = this.getGameLoadingTimeForStart();
    this.SendEventLogById(
      GameCommonEventLogID.GET_GAME_DOMAIN_LIST_RETRY_FINISH,
      duration,
      durationForStart,
      retryCount?.toString() ?? '0'
    );
  }

  /**各別事件 */

  /**點擊info頁 V*/
  public static sendClickInfoForBQ() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(GameCommonEventLogID.CLICK_INFO);
  }

  /**開啟/關閉音效 0:關閉 1:打開 V*/
  public static sendClickVoice(value: string) {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(GameCommonEventLogID.CLICK_VOICE, value);
  }

  /**點擊活動*/
  public static sendClickEvent() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(GameCommonEventLogID.CLICK_EVENT);
  }

  /**3分鐘平均fps V*/
  public static sendAvgFps() {
    if (!isBQLogAvailable()) {
      return;
    }
    const eventName = GameCommonEventLogID[GameCommonEventLogID.AVG_FPS];
    window.dispatchEvent(new CustomEvent(eventName));
  }

  /**封包回應時間 V*/
  public static sendCmdRespTime(
    commandID: string,
    commandName: string,
    duration: number
  ) {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(
      GameCommonEventLogID.CMD_RESP_TIME,
      commandID,
      commandName,
      duration.toString()
    );
  }

  /**視窗訊息(提示、錯誤) V*/
  public static sendPopupMessage(msg: string, subMsg: string) {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(GameCommonEventLogID.POPUP_MESSAGE, msg, subMsg);
  }

  /**斷線重連(未上線)*/
  public static sendDisconnectReconnect() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(GameCommonEventLogID.DISCONNECT_RECONNECT);
  }

  /**重送機制(未上線) */
  public static sendResendMechanism() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(GameCommonEventLogID.RESEND_MECHANISM);
  }

  /**遊戲紀錄 V*/
  public static sendHistory() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(GameCommonEventLogID.HISTORY);
  }

  /**放大(全螢幕) V*/
  public static sendClickZoom() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(GameCommonEventLogID.CLICK_ZOOM);
  }

  /**離開(全螢幕) V*/
  public static sendClickExitZoom() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(GameCommonEventLogID.CLICK_EXIT_ZOOM);
  }

  /**放大(全螢幕) V*/
  public static sendClickOnScreenZoom() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(GameCommonEventLogID.CLICK_ON_SCREEN_ZOOM);
  }

  /**離開(全螢幕) V*/
  public static sendClickOnScreenExitZoom() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(GameCommonEventLogID.CLICK_ON_SCREEN_EXIT_ZOOM);
  }

  /**離開(HOME) V*/
  public static sendClickExit() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(GameCommonEventLogID.CLICK_EXIT);
  }

  /**點擊會動圖示(虎機) */
  public static sendClickAnimatedIcon() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(SlotEventLogID.CLICK_ANIMATED_ICON);
  }

  /**點擊 TurboV*/
  public static sendClickTurbo() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(SlotEventLogID.CLICK_TURBO);
  }

  /**點擊 Turbo Phase 1 V*/
  public static sendClickTurboPhase1(isFg: boolean) {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(SlotEventLogID.CLICK_TURBO_PHASE_1, isFg ? '1' : '0');
  }

  /**點擊 Turbo Phase 2 V*/
  public static sendClickTurboPhase2(isFg: boolean) {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(SlotEventLogID.CLICK_TURBO_PHASE_2, isFg ? '1' : '0');
  }

  /**點擊 Stop Turbo Phase V*/
  public static sendClickStopTurboPhase(isFg: boolean) {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(
      SlotEventLogID.CLICK_STOP_TURBO_PHASE,
      isFg ? '1' : '0'
    );
  }

  /**點擊 Hint*/
  public static sendClickHint() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(SlotEventLogID.CLICK_HINT);
  }

  /**點擊auto次數 */
  public static sendClickAutoTime(value: string) {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(SlotEventLogID.CLICK_AUTO_TIME, value);
  }

  /**點擊auto按鈕次數 */
  public static sendClickAutoBtn() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(SlotEventLogID.CLICK_AUTO_BTN);
  }

  /**點擊背包按鈕 */
  public static sendClickBagIcon() {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(SlotEventLogID.CLICK_BAG_ICON);
  }

  /**遊戲內點擊分享-成功 */
  public static sendClickInGameShareSuccess(fromShare: boolean) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(
      SlotEventLogID.CLICK_IN_GAME_SHARE_SUCCESS,
      fromShare ? '1' : '0'
    );
  }

  /**遊戲內點擊分享-取消 */
  public static sendClickInGameShareCancel(fromShare: boolean) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(
      SlotEventLogID.CLICK_IN_GAME_SHARE_CANCEL,
      fromShare ? '1' : '0'
    );
  }
  /**點擊技能跳過按鈕(魚機) */
  public static sendClickSkillSkip(skillType: string, trigger: string) {
    if (!isBQLogAvailable()) {
      return;
    }

    this.SendEventLogById(FishEventLogID.SKILL_SKIP_CLICK, skillType, trigger);
  }

  //#region SKY KING EVENT LOG

  /**飛機-進入新手教學模式 */
  public static sendClickTutorialMode() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_CLICK_TUTORIAL_MODE);
  }
  /**飛機-進入遊戲模式 */
  public static sendClickGameMode() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_CLICK_GAME_MODE);
  }

  /**飛機-跳過新手教學-確認 */
  public static sendClickTutorialSkipOk(tutorialStep: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_SKIP_OK, tutorialStep);
  }

  /**飛機-新手教學-完成射擊小魚1 */
  public static sendFinishTutorialHitTarget1(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_HIT_TARGET_1, costTime);
  }

  /**飛機-新手教學-完成射擊小魚2 */
  public static sendFinishTutorialHitTarget2(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_HIT_TARGET_2, costTime);
  }

  /**飛機-新手教學-完成押注變更 */
  public static sendFinishTutorialChangeBet(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_CHANGE_BET, costTime);
  }

  /**飛機-新手教學-完成拖曳射擊 */
  public static sendFinishTutorialDragHintTip(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_DRAGHINT_TIP, costTime);
  }

  /**飛機-新手教學-完成使用鎖定 */
  public static sendFinishTutorialLock(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_LOCK, costTime);
  }

  /**飛機-新手教學-完成射擊領頭機 */
  public static sendFinishTutorialHitTarget3(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_HIT_TARGET_3, costTime);
  }

  /**飛機-新手教學-完成切換武器 */
  public static sendFinishTutorialChangeWeapon(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_CHANGE_WEAPON, costTime);
  }

  /**飛機-新手教學-完成擊殺領頭機 */
  public static sendFinishTutorialHitTarget4(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_HIT_TARGET_4, costTime);
  }

  /**飛機-新手教學-點擊智能鎖定按鈕 */
  public static sendFinishTutorialAuto() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_AUTO);
  }

  /**飛機-新手教學-完成結訓任務 */
  public static sendFinishTutorialMission(costTime: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_TUTORIAL_MISSION, costTime);
  }

  /**飛機-新手教學-進入遊戲模式 */
  public static sendClickTutorialToGameMode() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_CLICK_TUTORIAL_TO_GAME_MODE);
  }

  /**飛機-新手教學-重新體驗新手教學模式 */
  public static sendClickRestartTutorialMode() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_CLICK_RESTART_TUTORIAL_MODE);
  }

  /**飛機-遊戲模式-點擊智能鎖定按鈕 */
  public static sendClickAutoLockBtn(active: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_CLICK_AUTO_BTN, active);
  }

  /**飛機-遊戲模式-點擊特效按鈕 */
  public static sendClickEffectBtn(active: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_CLICK_EFFECT_BTN, active);
  }

  /**飛機-遊戲模式-點擊ShowOdds按鈕 */
  public static sendClickShowOddsBtn(active: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_CLICK_ODDS_BTN, active);
  }

  /**飛機-遊戲模式-點擊FREE FLY按鈕 */
  public static sendClickFreeFlyBtn(active: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(SkyEventLogID.SKY_CLICK_FREE_FLY_BTN, active);
  }

  /**飛機-遊戲模式-切換成單人廳館 */
  public static sendClickSingleRoom(currBG: string, currRoomType: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(
      SkyEventLogID.SKY_CLICK_SINGLE_ROOM,
      currBG,
      currRoomType
    );
  }

  /**飛機-遊戲模式-切換成多人廳館 */
  public static sendClickMultiRoom(currBG: string, currRoomType: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendEventLogById(
      SkyEventLogID.SKY_CLICK_MULTI_ROOM,
      currBG,
      currRoomType
    );
  }
  //#endregion SKY KING EVENT LOG

  //////////////////////////////////////////////////////////////////////////////////
  //    ********舊版埋點 *********    //
  /**場景加載完成*/
  public static sendLoadSceneComplete() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendEventLog(BQLOG.EventLogID.LOAD_SCENE_COMPLETE);
  }
  /**GameLoading完成*/
  public static sendLoadGameComplete() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendEventLog(BQLOG.EventLogID.LOAD_GAME_COMPLETE);
  }
  /**點擊-Play-進入遊戲畫面*/
  public static sendClickPlay() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendEventLog(BQLOG.EventLogID.CLICK_PLAY);
  }
  /**看到遊戲初始畫面*/
  public static sendSeeGameScene() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendEventLog(BQLOG.EventLogID.SEE_GAME_SCENE);
  }
  /**開info頁*/
  public static sendClickInfo() {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendEventLog(BQLOG.EventLogID.CLICK_INFO);
  }
  //#endregion

  //#region ErrorLog
  public static sendErrorLog(
    errorCode: BQLOG.ErrorCode | BQLOG.SlotErrorCode | BQLOG.FishErrorCode,
    errorEventMessage: string,
    errorEventReason?: string
  ) {
    try {
      BQLOG.Logger.SendErrorLog(errorCode, errorEventMessage, errorEventReason);
    } catch (e) {
      console.warn(e);
    }
  }
  /**Slot Cmd: start_game*/
  public static sendStartGameError(packet: Object, errorMessage: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendErrorLog(
      BQLOG.SlotErrorCode.START_GAME_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
    //**BQ 埋點 */
    this.SendErrorLogById(
      BQErrorCode.START_GAME_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
  }
  /**Slot Cmd: spin*/
  public static sendSpinError(packet: Object, errorMessage: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendErrorLog(
      BQLOG.SlotErrorCode.SPIN_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
    //**BQ 埋點 */
    this.SendErrorLogById(
      BQErrorCode.SPIN_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
  }
  /**Slot Cmd: next_fever*/
  public static sendNextFeverError(packet: Object, errorMessage: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendErrorLog(
      BQLOG.SlotErrorCode.NEXT_FEVER_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
    //**BQ 埋點 */
    this.SendErrorLogById(
      BQErrorCode.NEXT_FEVER_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
  }
  /**Slot Cmd: get_in_game_jp_info*/
  public static sendInGameJPError(packet: Object, errorMessage: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendErrorLog(
      BQLOG.SlotErrorCode.INGAME_JP_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
    //**BQ 埋點 */
    this.SendErrorLogById(
      BQErrorCode.INGAME_JP_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
  }

  public static sendLoadGameSettingFailed(settingName: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendErrorLog(
      BQLOG.ErrorCode.LOAD_GAMESETTING_FAILED,
      `Download ${settingName} Failed.`
    );
    //**BQ 埋點 */
    this.SendErrorLogById(
      BQErrorCode.LOAD_GAMESETTING_FAILED,
      `Download ${settingName} Failed.`
    );
  }

  public static sendParseGameSettingFailed(settingName: string, err?) {
    if (!isBQLogAvailable()) {
      return;
    }
    const errStr = err
      ? typeof err === 'object'
        ? JSON.stringify(err)
        : String(err)
      : '';

    this.sendErrorLog(
      BQLOG.ErrorCode.PARSE_GAMESETTING_FAILED,
      `${settingName} Data Parse Failed.`
    );

    //**BQ 埋點 */
    this.SendErrorLogById(
      BQErrorCode.PARSE_GAMESETTING_FAILED,
      `${settingName} Data Parse Failed.`,
      errStr
    );
  }

  public static sendGetServerDataFailed(cmdName: string, err?) {
    if (!isBQLogAvailable()) {
      return;
    }
    const errStr = err
      ? typeof err === 'object'
        ? JSON.stringify(err)
        : String(err)
      : '';
    this.sendErrorLog(
      BQLOG.ErrorCode.GET_SERVER_DATA_FAILED,
      `${cmdName} Data Parse Failed.`
    );

    //**BQ 埋點 */
    this.SendErrorLogById(
      BQErrorCode.GET_SERVER_DATA_FAILED,
      `${cmdName} Data Parse Failed.`,
      errStr
    );
  }

  public static sendLoadResFailed(resName: string, err?) {
    if (!isBQLogAvailable()) {
      return;
    }
    const errStr = err
      ? typeof err === 'object'
        ? JSON.stringify(err)
        : String(err)
      : '';
    this.sendErrorLog(
      BQLOG.ErrorCode.LOAD_RES_FAILED,
      `Download ${resName} Failed.`
    );

    //**BQ 埋點 */
    this.SendErrorLogById(
      BQErrorCode.LOAD_RES_FAILED,
      `Download ${resName} Failed.`,
      errStr
    );
  }

  public static sendLoginFailed(name: string, err?) {
    if (!isBQLogAvailable()) {
      return;
    }
    const errStr = err
      ? typeof err === 'object'
        ? JSON.stringify(err)
        : String(err)
      : '';

    this.sendErrorLog(BQLOG.ErrorCode.LOGIN_FAILED, `${name} Failed.`);

    //**BQ 埋點 */
    this.SendErrorLogById(BQErrorCode.LOGIN_FAILED, `${name} Failed.`, errStr);
  }

  public static sendDataError(packet: Object, errorMessage) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.sendErrorLog(
      BQLOG.FishErrorCode.DATA_ERROR,
      JSON.stringify(packet),
      errorMessage
    );
  }

  public static sendSocketClose(errorMessage: string, reason?: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendErrorLogById(BQErrorCode.SOCKET_CLOSE, errorMessage, reason);
  }

  public static sendSocketError(errorMessage: string, reason?: string) {
    if (!isBQLogAvailable()) {
      return;
    }
    this.SendErrorLogById(BQErrorCode.SOCKET_ERROR, errorMessage, reason);
  }
  //#endregion

  public static setStatus(status) {
    if (!isBQLogAvailable()) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent(BQLOG.PlayerExpEvent.GetStatusReturn, {detail: {status}})
    );
  }

  public static startFpsLog() {
    if (!isBQLogAvailable()) {
      return;
    }
    window.dispatchEvent(new CustomEvent(BQLOG.PlayerExpEvent.StartFps));
  }

  public static startPingLog() {
    if (!isBQLogAvailable()) {
      return;
    }
    window.dispatchEvent(new CustomEvent(BQLOG.PlayerExpEvent.StartPing));
  }

  public static TestErrorLog() {
    if (!isBQLogAvailable()) {
      return;
    }
    BQLogger.sendLoadResFailed('test');
    BQLogger.sendLoginFailed('test');
    BQLogger.sendGetServerDataFailed('test');
    BQLogger.sendParseGameSettingFailed('test');
    BQLogger.sendLoadGameSettingFailed('test');
    BQLogger.sendStartGameError(Object, 'test');
    BQLogger.sendSpinError(Object, 'test');
    BQLogger.sendNextFeverError(Object, 'test');
    BQLogger.sendInGameJPError(Object, 'test');
  }
}
