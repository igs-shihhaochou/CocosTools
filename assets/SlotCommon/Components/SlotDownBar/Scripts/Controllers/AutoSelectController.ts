import {_decorator, Component, Label, Vec3, UITransform, Size} from 'cc';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import Functions from '../../../../../CommonModule/Script/Utility/Functions';
import MultiLangHandler from '../../../../../CommonModule/Script/Core/MultiLangHandler';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import Timer from 'db://assets/CommonModule/Script/Utility/Timer';

const {ccclass, property} = _decorator;

@ccclass('AutoSelectController')
export class AutoSelectController extends Component {
  @property(Label)
  private autoSelectCountDownLabel: Label = null;

  // 回調函數
  private autoSelectPerSecCB: Function = null;
  private autoSelectEndCB: Function = null;

  // 設定參數
  private needShowAutoSelectContent = false;
  private customAutoSelectContent = '';
  private currentTime = 0;
  private customCountDownTime = 0;

  // 位置和尺寸設定
  private autoSelectLabelLandscapePos: Vec3 = null;
  private autoSelectLabelLandscapeSize: Vec3 = null;
  private autoSelectLabelPortraitPos: Vec3 = null;
  private autoSelectLabelPortraitSize: Vec3 = null;

  // 計時器 key
  private timerKey = 'autoSelectTimer';

  protected onLoad() {
    // 註冊事件監聽
    this.registerEvents(true);
  }

  protected onDestroy() {
    // 移除事件監聽
    this.registerEvents(false);
  }

  /**
   * 註冊/移除事件監聽
   */
  private registerEvents(register: boolean) {
    const func = register ? 'insert' : 'remove';
    const s = SlotGDK.instance;
    s.eventIniAutoSelectSetting[func](this.onInitAutoSelectSetting, this);
    s.eventStartAutoSelectTimer[func](this.onStartAutoSelectTimer, this);
    s.eventStopAutoSelectTimer[func](this.onStopAutoSelectTimer, this);
  }

  /**
   * 事件處理：初始化自動選擇設定
   */
  private onInitAutoSelectSetting(
    needShowContent = true,
    customContent = '',
    landScapePos: Vec3 = Vec3.ZERO,
    landScapeSize: Vec3 = new Vec3(900, 50, 0),
    portraitPos: Vec3 = Vec3.ZERO,
    portraitSize: Vec3 = new Vec3(500, 100, 0)
  ) {
    this.initAutoSelectSetting(
      needShowContent,
      customContent,
      landScapePos,
      landScapeSize,
      portraitPos,
      portraitSize
    );
  }

  /**
   * 事件處理：開始自動選擇倒數
   */
  private onStartAutoSelectTimer(
    countDownTime = 20,
    perSecCB: Function = null,
    endCB: Function = null
  ) {
    this.startAutoSelectTimer(countDownTime, perSecCB, endCB);
  }

  /**
   * 事件處理：停止自動選擇倒數
   */
  private onStopAutoSelectTimer() {
    this.stopAutoSelectTimer();
  }

  /**
   * 初始化自動選擇設定
   * @param needShowContent 是否顯示預設文字
   * @param customContent 自訂文字內容 (秒數需替代成{0})
   * @param landScapePos 橫版座標
   * @param landScapeSize 橫版Size
   * @param portraitPos 直版座標
   * @param portraitSize 直版Size
   */
  public initAutoSelectSetting(
    needShowContent = true,
    customContent = '',
    landScapePos: Vec3 = Vec3.ZERO,
    landScapeSize: Vec3 = new Vec3(900, 50, 0),
    portraitPos: Vec3 = Vec3.ZERO,
    portraitSize: Vec3 = new Vec3(500, 100, 0)
  ) {
    this.needShowAutoSelectContent = needShowContent;
    this.customAutoSelectContent = customContent;

    this.autoSelectLabelLandscapePos = landScapePos;
    this.autoSelectLabelLandscapeSize = landScapeSize;
    this.autoSelectLabelPortraitPos = portraitPos;
    this.autoSelectLabelPortraitSize = portraitSize;

    this.resetTimer();
    this.refreshAutoSelectUI();
  }

  /**
   * 開始自動倒數
   * @param countDownTime 倒數時間(預設20秒)
   * @param perSecCB 每秒的回調函數
   * @param endCB 結束的回調函數
   * @returns
   */
  public startAutoSelectTimer(
    countDownTime = 20,
    perSecCB: Function = null,
    endCB: Function = null
  ) {
    // 重置倒數
    this.resetTimer();

    if (countDownTime <= 0) {
      console.warn('自動選擇倒數秒數<=0  不做倒數!!');
      return;
    } else {
      this.customCountDownTime = countDownTime;
    }

    this.autoSelectPerSecCB = perSecCB;
    this.autoSelectEndCB = endCB;

    // 立即顯示初始倒數時間
    if (this.needShowAutoSelectContent && this.autoSelectCountDownLabel) {
      let multiStr = Functions.isNullOrEmpty(this.customAutoSelectContent)
        ? MultiLangHandler.getGameText('SlotUIMsg_AutoSelectCountDown')
        : this.customAutoSelectContent;
      multiStr = multiStr.replace('{0}', countDownTime.toString());
      this.autoSelectCountDownLabel.string = multiStr;
      this.autoSelectCountDownLabel.node.active = true;
    }

    // 開始倒數
    Timer.schedule(this.timer.bind(this), 1, this.timerKey);
  }

  /**
   * 停止自動倒數
   */
  public stopAutoSelectTimer() {
    // 停止倒數
    Timer.unschedule(this.timerKey);

    if (this.autoSelectCountDownLabel) {
      this.autoSelectCountDownLabel.node.active = false;
    }
    // 重置倒數
    this.resetTimer();
  }

  /**
   * 刷新自動選擇UI
   */
  private refreshAutoSelectUI() {
    if (!this.needShowAutoSelectContent) {
      return;
    }

    // 檢查 autoSelectCountDownLabel 是否存在
    if (!this.autoSelectCountDownLabel) {
      console.warn(
        '[AutoSelectController] autoSelectCountDownLabel is not assigned!'
      );
      return;
    }

    // 確保節點初始為隱藏狀態
    this.autoSelectCountDownLabel.node.active = false;

    // 設定位置和尺寸（目前註解掉，可根據需要啟用）
    // this.applyPositionAndSize()
  }

  /**
   * 應用位置和尺寸設定
   */
  private applyPositionAndSize() {
    if (!this.autoSelectCountDownLabel) return;

    // 如果不支援直橫轉換，先預設橫版客製處理
    if (PlatformData.isLandscape === null) {
      console.warn('[AutoSelectController] 不支援直橫轉換');
      this.applyLandscapeSettings();
      return;
    }

    if (PlatformData.isLandscape) {
      this.applyLandscapeSettings();
    } else {
      this.applyPortraitSettings();
    }
  }

  /**
   * 應用橫版設定
   */
  private applyLandscapeSettings() {
    if (!this.autoSelectCountDownLabel) return;

    // 設定位置
    if (this.autoSelectLabelLandscapePos !== null) {
      this.autoSelectCountDownLabel.node.setPosition(
        this.autoSelectLabelLandscapePos
      );
    }

    // 設定尺寸
    if (this.autoSelectLabelLandscapeSize !== null) {
      const uiTransform =
        this.autoSelectCountDownLabel.node.getComponent(UITransform);
      if (uiTransform) {
        uiTransform.contentSize = new Size(
          this.autoSelectLabelLandscapeSize.x,
          this.autoSelectLabelLandscapeSize.y
        );
      }
    }
  }

  /**
   * 應用直版設定
   */
  private applyPortraitSettings() {
    if (!this.autoSelectCountDownLabel) return;

    // 設定位置
    if (this.autoSelectLabelPortraitPos !== null) {
      this.autoSelectCountDownLabel.node.setPosition(
        this.autoSelectLabelPortraitPos
      );
    }

    // 設定尺寸
    if (this.autoSelectLabelPortraitSize !== null) {
      const uiTransform =
        this.autoSelectCountDownLabel.node.getComponent(UITransform);
      if (uiTransform) {
        uiTransform.contentSize = new Size(
          this.autoSelectLabelPortraitSize.x,
          this.autoSelectLabelPortraitSize.y
        );
      }
    }
  }

  /**
   * 時間倒數計時器
   */
  private timer() {
    this.currentTime++;
    const remainingTime = this.customCountDownTime - this.currentTime;

    if (this.needShowAutoSelectContent && this.autoSelectCountDownLabel) {
      // 取得多國語系的字串顯示
      let multiStr = Functions.isNullOrEmpty(this.customAutoSelectContent)
        ? MultiLangHandler.getGameText('SlotUIMsg_AutoSelectCountDown')
        : this.customAutoSelectContent;
      // 替換剩餘時間
      multiStr = multiStr.replace('{0}', remainingTime.toString());
      this.autoSelectCountDownLabel.string = multiStr;

      this.autoSelectCountDownLabel.node.active = remainingTime > 0;
    }

    // 每秒回調
    if (this.autoSelectPerSecCB !== null) {
      this.autoSelectPerSecCB(remainingTime);
    }

    if (remainingTime <= 0) {
      Timer.unschedule(this.timerKey);
      // 結束回調
      if (this.autoSelectEndCB !== null) {
        this.autoSelectEndCB();
      }
      this.resetTimer();
    }
  }

  /**
   * 重置計時器設定
   */
  private resetTimer() {
    this.autoSelectPerSecCB = null;
    this.autoSelectEndCB = null;
    this.currentTime = 0;
  }

  /**
   * 檢查是否正在倒數
   */
  public isCountingDown(): boolean {
    return this.autoSelectPerSecCB !== null || this.autoSelectEndCB !== null;
  }

  /**
   * 取得剩餘時間
   */
  public getRemainingTime(): number {
    return Math.max(0, this.customCountDownTime - this.currentTime);
  }
}
