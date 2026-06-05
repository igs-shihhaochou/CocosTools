import {_decorator, Component, Node} from 'cc';
import GameClient from '../Network/GameClient';
import {PlatformGDK} from '../Platform/PlatformGDK';
import Signal from '../Utility/Signal';
import SourceLocker from '../Utility/SourceLocker';
import BundleManager from './BundleManager';
import EventManager from './EventManager';
import {setScale} from '../Utility/NodeProperty';
import {PlatformData} from '../Define/PlatformData';
import {OrientationDefine} from '../Type/CommonDefine';

//TODO: public函式命名改為小駝峰

const {ccclass, property} = _decorator;

/** 活動模組名稱 */
const ACTIVITY_MODULE_NAME = 'ActivityModule';

@ccclass('GameActivityManager')
export default class GameActivityManager extends Component {
  //#region Singleton
  //==============================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): GameActivityManager {
    return GameActivityManager._instance;
  }
  /** Instance 實體 */
  private static _instance: GameActivityManager = null;
  //==============================================================
  //#endregion Singleton

  /** 活動管理目標節點(存放活動模組節點) */
  @property(Node)
  private activeManagerTarget: Node = null;

  /** 活動模組是否已建立 */
  private isActivityModuleSetup = false;
  /** 活動模組是否已初始化 */
  private isActivityModuleInit = false;
  /** 活動模組初始化事件 */
  private onActivityModuleInitEvent: Signal = null;

  /** 活動鎖 */
  private activityLocker: SourceLocker = null;
  /** HUD鎖 */
  private hudLocker: SourceLocker = null;

  /** 目前螢幕方向 */
  private currentOrientation: OrientationDefine.OrientationType =
    OrientationDefine.OrientationType.LANDSCAPE;

  protected onLoad(): void {
    if (GameActivityManager._instance) {
      this.node.destroy();
      return;
    }
    GameActivityManager._instance = this;

    this.activityLocker = new SourceLocker('ActivityLocker');
    this.hudLocker = new SourceLocker('ActivityLocker');

    PlatformGDK.instance.blockActivityInput.insert(
      this.BlockActivityInput,
      this
    );

    EventManager.instance.addEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.onOrientationChanged,
      this
    );
    this.currentOrientation = PlatformData.isLandscape
      ? OrientationDefine.OrientationType.LANDSCAPE
      : OrientationDefine.OrientationType.PORTRAIT;
  }

  protected onDestroy(): void {
    if (this.onActivityModuleInitEvent)
      this.onActivityModuleInitEvent.dispose();
    this.onActivityModuleInitEvent = null;

    PlatformGDK.instance.blockActivityInput.remove(
      this.BlockActivityInput,
      this
    );

    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.onOrientationChanged,
      this
    );

    this.unregisterActivityEvent();

    this.RemoveActivityUpdateBalanceListener(this.updateGameBalance, this);

    this.ResetActivityInputLocker();
    if (this.activityLocker) this.activityLocker.release();
    this.activityLocker = null;

    this.ResetActivityHudDisplay();
    if (this.hudLocker) this.hudLocker.release();
    this.hudLocker = null;

    GameActivityManager._instance = null;
  }

  /**
   * 建立活動模組
   */
  public SetupActivityModule() {
    //標記活動模組未建立及未初始化
    this.isActivityModuleInit = this.isActivityModuleSetup = false;
    //初始化事件集合
    if (!this.onActivityModuleInitEvent)
      this.onActivityModuleInitEvent = new Signal();
    //載入活動模組
    console.log('[GameActivityManager] SetupActivityModule');
    BundleManager.instance.loadBundleAssetsByKey(
      BundleManager.instance.getBundleKey(ACTIVITY_MODULE_NAME),
      null,
      null,
      () => {
        //生成活動模組Prefab
        const activityModule: Node =
          ActivityModule.InstantiateActivityManagerPrefab(
            ActivityModule.enumActivityManagerType.IN_GAME
          );
        activityModule.parent = this.activeManagerTarget;
        //設定活動模組遊戲中狀態
        ActivityModule.ActivityManager.Instance.IsInGame = true;
        //標記活動模組建立完成
        this.isActivityModuleSetup = true;
        //初始化活動模組
        this.InitActivityModule(() => {
          this.AddActivityUpdateBalanceListener(this.updateGameBalance, this);
        });
      },
      (err: Error) => {
        console.error('[GameActivityManager] SetupActivityModule error.', err);
      }
    );
  }

  /**
   * 初始化活動模組
   * @param onInitComplete
   */
  public InitActivityModule(onInitComplete?: Function) {
    if (this.isActivityModuleInit) {
      console.warn('[GameActivityManager] InitActivityModule already init');
      return;
    }
    if (this.onActivityModuleInitEvent && onInitComplete)
      this.onActivityModuleInitEvent.addOnce(onInitComplete, this);
    if (!this.isActivityModuleSetup) {
      console.warn(
        '[GameActivityManager] InitActivityModule ActivityModule not ready, wait for setup'
      );
      return;
    }
    try {
      if (!ActivityModule.ActivityManager.Instance)
        throw new Error('ActivityModule.ActivityManager.Instance is null');
    } catch (err) {
      console.error(
        '[GameActivityManager] InitActivityModule get ActivityModule error.',
        err
      );
      return;
    }
    console.warn('[GameActivityManager] InitActivityModule');
    //活動模組共用資料同步 (3版問題，Bundle載入的模組會變成獨立的PlatformData)
    ActivityModule.ActivityManager.Instance.SyncData(PlatformData);
    //活動模組網路層串接
    ActivityModule.ActivityManager.Instance.SetupArkClient(
      GameClient.arkClient
    );
    //活動模組初始化
    ActivityModule.ActivityManager.Instance.Init();

    //標記活動模組已初始化
    this.isActivityModuleInit = true;

    //註冊活動模組事件
    this.registerActivityEvent();

    //初始化後重新觸發一次 防止遊戲流程已觸發而造成未阻擋
    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.BLOCK_ACTIVITY_INPUT,
      this.activityLocker.isLock
    );

    //預設隱藏活動畫面
    this.ShowActivityView(false);

    //初始化完成事件 觸發後清除
    this.onActivityModuleInitEvent.dispatch();
    this.onActivityModuleInitEvent.dispose();
    this.onActivityModuleInitEvent = null;
  }

  /**
   * 顯示/隱藏活動畫面
   * @param isShow
   */
  public ShowActivityView(isShow = true) {
    if (this.checkAddActivityInitListener(this.ShowActivityView, this, isShow))
      return;

    setScale(this.activeManagerTarget, isShow ? 1 : 0);

    //關閉Loading頁後重新觸發一次
    EventManager.instance.dispatchEvent(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.currentOrientation
    );
    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.GAME_CHANGE_BET,
      PlatformData.instance.originalTotalBet,
      PlatformData.instance.currentTotalBet
    );

    this.BlockActivityInput(!isShow, 'ShowActivityView');
  }

  /**
   * 新增活動初始化監聽事件
   * @param listener
   * @param target
   * @param args
   */
  public AddActivityInitListener(
    listener: Function,
    target?,
    ...args: unknown[]
  ) {
    if (this.isActivityModuleInit) {
      listener.apply(target, args);
      return;
    }

    if (!this.onActivityModuleInitEvent) return;

    this.onActivityModuleInitEvent.addOnce(listener, target, 0, ...args);
  }

  /**
   * 新增活動更新資產監聽事件
   * @param listener
   * @param target
   * @param args
   */
  public AddActivityUpdateBalanceListener(
    listener: Function,
    target?,
    ...args: unknown[]
  ) {
    if (
      this.checkAddActivityInitListener(
        this.AddActivityUpdateBalanceListener,
        this,
        listener,
        target,
        ...args
      )
    )
      return;

    EventManager.instance.addEventListener(
      ActivityModule.ActivityEventName.UPDATE_BALANCE,
      listener,
      target
    );
  }

  /**
   * 移除活動初始化監聽事件
   * @param listener
   * @param target
   */
  public RemoveActivityInitListener(listener: Function, target?) {
    if (!this.onActivityModuleInitEvent) return;

    this.onActivityModuleInitEvent.remove(listener, target);
  }

  /**
   * 移除活動更新資產監聽事件
   * @param listener
   * @param target
   */
  public RemoveActivityUpdateBalanceListener(listener: Function, target?) {
    if (
      this.checkAddActivityInitListener(
        this.RemoveActivityUpdateBalanceListener,
        this,
        listener,
        target
      )
    )
      return;

    EventManager.instance.removeEventListener(
      ActivityModule.ActivityEventName.UPDATE_BALANCE,
      listener,
      target
    );
  }

  //#region BLOCK_ACTIVITY_INPUT
  /**
   * 阻擋活動輸入
   * @param isBlock
   * @param trigger 若未指定則由GameActivityManager代理
   */
  public BlockActivityInput(
    isBlock = true,
    trigger: string | Object = GameActivityManager._instance
  ) {
    if (!this.activityLocker) return;

    trigger = trigger || this;

    const isLockLast = this.activityLocker.isLock;
    this.activityLocker.setLock(isBlock, trigger);

    if (!this.isActivityModuleInit || isLockLast === this.activityLocker.isLock)
      return;

    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.BLOCK_ACTIVITY_INPUT,
      this.activityLocker.isLock
    );
  }

  /**
   * 重置活動輸入狀態鎖
   */
  public ResetActivityInputLocker() {
    if (!this.activityLocker) return;

    this.activityLocker.forceUnlock();

    if (!this.isActivityModuleInit) return;

    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.BLOCK_ACTIVITY_INPUT,
      false
    );
  }
  //#endregion

  //#region GET_HUD_DISPLAY
  /**
   * 設定活動HUD顯示
   * @param isDisplay 是否顯示
   * @param trigger 若未指定則由GameActivityManager代理
   */
  public SetActivityHudDisplay(
    isDisplay = true,
    trigger: string | Object = GameActivityManager._instance
  ) {
    if (!this.hudLocker) return;

    trigger = trigger || this;

    const isDisplayLast = !this.hudLocker.isLock;
    this.hudLocker.setLock(!isDisplay, trigger);

    if (!this.isActivityModuleInit || isDisplayLast === !this.hudLocker.isLock)
      return;

    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.GET_HUD_DISPLAY,
      !this.hudLocker.isLock
    );
  }

  /**
   * 重置HUD顯示狀態鎖
   */
  public ResetActivityHudDisplay() {
    if (!this.hudLocker) return;

    this.hudLocker.forceUnlock();

    if (!this.isActivityModuleInit) return;

    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.GET_HUD_DISPLAY,
      true
    );
  }
  //#endregion

  /**
   * 取得活動模組是否已初始化
   */
  public get IsActivityModuleInit(): boolean {
    return this.isActivityModuleInit;
  }

  public get GetActiveManagerTarget(): Node {
    return this.activeManagerTarget;
  }

  private updateGameBalance(balance: number) {
    PlatformGDK.instance.updatePlayerBalance.notify(balance);
  }

  /**
   * 螢幕方向改變
   * @param orientation
   */
  private onOrientationChanged(orientation: OrientationDefine.OrientationType) {
    this.currentOrientation = orientation;
  }

  /**
   * 檢查並新增初始化活動模組監聽事件
   * @param listener
   * @param target
   * @param args
   * @returns 是否有新增監聽事件
   */
  private checkAddActivityInitListener(
    listener: Function,
    target?,
    ...args: unknown[]
  ): boolean {
    if (this.isActivityModuleInit) return false;

    console.warn(
      '[GameActivityManager] checkAddActivityInitListener ActivityModule is not init, add activity init listener'
    );

    this.AddActivityInitListener(listener, target, ...args);

    return true;
  }

  /**
   * 註冊活動模組事件
   */
  private registerActivityEvent() {
    if (!this.isActivityModuleInit) return;

    EventManager.instance.addEventListener(
      ActivityModule.ActivityEventName.GET_HUD_DISPLAY,
      this.onActivityGetHudDisplay,
      this
    );
  }

  /**
   * 取消註冊活動模組事件
   */
  private unregisterActivityEvent() {
    if (!this.isActivityModuleInit) return;

    EventManager.instance.removeAllEventListener(
      ActivityModule.ActivityEventName.GET_HUD_DISPLAY,
      this
    );
  }
  /**
   * 事件：活動取得HUD是否顯示
   * @param isDisplay
   */
  private onActivityGetHudDisplay(isDisplay: boolean) {
    if (!this.hudLocker) return;
    if (!this.isActivityModuleInit) return;

    if (isDisplay !== null) return;

    EventManager.instance.dispatchEvent(
      ActivityModule.ActivityEventName.GET_HUD_DISPLAY,
      !this.hudLocker.isLock
    );
  }
}
