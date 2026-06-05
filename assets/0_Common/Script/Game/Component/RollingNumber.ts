import {_decorator, Component, Label, CCBoolean} from 'cc';
const {ccclass, property, menu} = _decorator;

import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import Functions from '../../../../CommonModule/Script/Utility/Functions';
import Signal from '../../../../CommonModule/Script/Utility/Signal';
/**
 * 滾動數值組件
 */

@ccclass('RollingNumber')
@menu('0_Common/Game/Component/RollingNumber')
export default class RollingNumber extends Component {
  /** 滾動數字對象 */
  @property(Label)
  private label: Label | null = null;
  /**
   * 前綴客制文字
   */
  private prefixCustomStr = '';
  /**
   * 後綴客制文字
   */
  private suffixCustomStr = '';
  /** 滾動時間 (s) (default: 1) */
  private rollingTime = 1;
  /** 滾動經過時間 (s) */
  private rollingElapsedTime = 0;
  /** 目前數值 */
  private _currentNumber = 0;
  /** 起始數值 */
  private beginNumber = 0;
  /** 目標數值 */
  private _targetNumber = 0;
  /** 滾動增值 */
  private increaseValue = 0;
  /** 是否顯示為整數 (default: true) */
  private isInteger = true;
  /** 是否顯示千分位 (default: false) */
  @property(CCBoolean)
  private isAddComma = false;
  /** 小數位數 */
  private decimalPlaces = -1;
  /** 貨幣符號 */
  private dollarSign = '';
  /** 是否以Ratio縮放顯示數值 (default: false) */
  private isRatio = false;
  /** 是否使用無條件捨去 (default: false) */
  private isChopOff = false;
  /** 滾分期間鎖定的小數位數，由目標值決定 */
  private lockedDecimalPlaces: number | null = null;

  /** 滾動動作時觸發的事件集合 */
  private onRolling: Signal = null;
  /** 文字變更時觸發的事件集合 */
  private onChanging: Signal = null;
  /** 滾動完成时觸发的事件集合 */
  private onFinish: Signal = null;
  onLoad() {
    if (this.label === null) {
      console.warn('[RollingNumber] label: null', this.node.name);
      this.enabled = false;
    }
  }
  onDestroy() {
    this.release();
  }
  update(dt: number) {
    this._update(dt);
  }
  /**
   * 滾動數字初始化
   * @param rollingTime 滾動時間 (s) (default: 1)
   * @param isInteger 是否顯示為整數，true為整數、false為系統指定小數位數、此欄位直接帶數字即指定小數位數 (default: true)
   * @param addComma 加入千分位 (default: false)
   * @param dollarSign 貨幣符號  (default: "")
   * @param isRatio 是否縮放數值  (default: false)
   * @param isChopOff 是否使用無條件捨去 (default: false)
   */
  public init(
    rollingTime = 1,
    isInteger: boolean | number = true,
    addComma = false,
    dollarSign = '',
    isRatio = false,
    isChopOff = false
  ) {
    if (rollingTime === null) rollingTime = 1;
    if (isInteger === null) isInteger = true;
    if (addComma === null) addComma = false;
    if (dollarSign === null) dollarSign = '';
    if (isRatio === null) isRatio = false;
    if (isChopOff === null) isChopOff = false;

    this.rollingTime = rollingTime;

    if (typeof isInteger === 'boolean') {
      this.isInteger = isInteger;
      this.decimalPlaces = this.isInteger ? 0 : PlatformData.decimalPlaces;
    } else {
      this.isInteger = false;
      this.decimalPlaces = Number(isInteger);
    }

    this.isAddComma = addComma;

    this.dollarSign = dollarSign;
    this.isRatio = isRatio;
    this.isChopOff = isChopOff;

    this._currentNumber = 0;
    this.beginNumber = 0;
    this._targetNumber = 0;
    this.increaseValue = 0;

    this.rollingElapsedTime = 0;

    this.setNumberToUI();

    this.releaseSignal();
  }
  /**
   * 釋放RollingNumber資源
   */
  public release() {
    this.label = null;

    this.releaseSignal();
  }
  /**
   * 更新滾動文字
   * @param deltaTime 更新經過時間 (s)
   */
  public _update(deltaTime: number) {
    if (this.label === null) return;

    try {
      //目前數值與目標數值不相符則執行
      if (this._currentNumber !== this._targetNumber) {
        //滾動經過時間
        this.rollingElapsedTime += deltaTime;
        //是否取為整數
        if (this.isInteger) {
          this._currentNumber =
            this.beginNumber +
            Math.round(
              this.increaseValue * (this.rollingElapsedTime / this.rollingTime)
            );
        } else {
          this._currentNumber =
            this.beginNumber +
            this.increaseValue * (this.rollingElapsedTime / this.rollingTime);
        }
        //符合條件則停止滾动
        if (this.checkComplete()) {
          //觸發滾动完成事件
          if (this.onFinish !== null && this.onFinish.getNumListeners() > 0) {
            this.onFinish.dispatch();
          }
        } else {
          //觸發滾动中事件
          if (this.onRolling !== null && this.onRolling.getNumListeners() > 0) {
            this.onRolling.dispatch();
          }
        }
        //設定現在數字
        const lastLabelString: string = this.label.string;
        this.setNumberToUI();
        //觸發文字變更事件
        if (
          this.label.string !== lastLabelString &&
          this.onChanging !== null &&
          this.onChanging.getNumListeners() > 0
        ) {
          this.onChanging.dispatch();
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  /**
   * 設置滾動數字目標數值
   * @param targetNumber 目標數值
   * @param duration 滾動時間(s) (default: null 原滾動時間)
   */
  public setTargetNumber(targetNumber: number, duration: number = null) {
    if (this.label === null) return;

    try {
      if (duration !== null) {
        if (duration <= 0) {
          this._currentNumber = targetNumber;
        } else {
          this.rollingTime = duration;
        }
      }

      if (this.isInteger) {
        targetNumber = Math.round(targetNumber);
      }

      // 依最終目標值鎖定滾分期間的小數位數
      if (!this.isInteger && this.isRatio) {
        this.lockedDecimalPlaces = Functions.getAdaptiveDecimalPlaces(
          targetNumber,
          PlatformData.currencyRatio,
          this.decimalPlaces
        );
      } else {
        this.lockedDecimalPlaces = null;
      }

      this.beginNumber = this._currentNumber;
      this._targetNumber = targetNumber;

      this.increaseValue = this._targetNumber - this._currentNumber;
      this.rollingElapsedTime = 0;

      //避免錯誤
      if (this.checkComplete()) {
        this.setNumberToUI();
        //觸發滾动完成事件
        if (this.onFinish !== null && this.onFinish.getNumListeners() > 0) {
          this.onFinish.dispatch();
        }
      }
    } catch (err) {
      console.error(
        '[RollingNumber] setTargetNumber - targetNumber: ',
        targetNumber
      );
      console.error(err);
    }
  }

  /**
   * 設置滾動時間
   * @param rollingTime 滾動時間 (s)
   */
  public setRollingTime(rollingTime: number) {
    if (rollingTime <= 0) return;

    this.rollingTime = rollingTime;
  }
  /**
   * 設置是否顯示為整數
   * @param isInteger 是否為整數
   */
  public setInteger(isInteger: boolean) {
    this.isInteger = isInteger;
  }
  /**
   * 設置小數位數
   * @param decimalPlaces 小數位數
   */
  public setDecimalPlaces(decimalPlaces: number) {
    this.decimalPlaces = decimalPlaces;
  }
  /**
   * 設置貨幣符號
   * @param dollarSign 貨幣符號
   */
  public setDollarSign(dollarSign: string) {
    this.dollarSign = dollarSign;
  }
  /**
   * 設定滾動數字Label內容
   * @param str 內容
   */
  public setNumberLabel(str: string) {
    this.label.string = str;
  }
  /**
   * 取得滾動數字的目前數值
   */
  public get currentNumber(): number {
    return this._currentNumber;
  }
  public setPrefixCustomStr(str: string) {
    this.prefixCustomStr = str;
  }
  public setSuffixCustomStr(str: string) {
    this.suffixCustomStr = str;
  }
  /**
   * 取得滾動數字的目標數值
   */
  public get targetNumber(): number {
    return this._targetNumber;
  }
  /**
   * 設置滾動動作中的觸發事件
   * @param callback 事件
   * @param target 目標
   */
  public addRollingCB(callback: Function, target?: Object) {
    if (this.onRolling === null) this.onRolling = new Signal();

    this.onRolling.add(callback, target);
  }
  /**
   * 設置文字變更的觸發事件
   * @param callback 事件
   * @param target 目標
   */
  public addChangingCB(callback: Function, target?: Object) {
    if (this.onChanging === null) this.onChanging = new Signal();

    this.onChanging.add(callback, target);
  }
  /**
   * 設置滾動動作完成时的觸發事件
   * @param callback 事件
   * @param target 目標
   */
  public addRollingFinishCB(callback: Function, target?: Object) {
    if (this.onFinish === null) this.onFinish = new Signal();

    this.onFinish.add(callback, target);
  }
  /**
   * 移除滾動動作中的觸發事件
   * @param callback 事件
   * @param target 目標
   */
  public removeRollingCB(callback: Function, target?: Object) {
    if (this.onRolling === null) return;

    this.onRolling.remove(callback, target);
  }
  /**
   * 移除文字變更的觸發事件
   * @param callback 事件
   * @param target 目標
   */
  public removeChangingCB(callback: Function, target?: Object) {
    if (this.onChanging === null) return;

    this.onChanging.remove(callback, target);
  }
  /**
   * 移除滾動動作完成时的觸發事件
   * @param callback 事件
   * @param target 目標
   */
  public removeRollingFinishCB(callback: Function, target?: Object) {
    if (this.onFinish === null) return;

    this.onFinish.remove(callback, target);
  }
  /**
   * 移除全部滾動動作中的觸發事件
   */
  public removeAllRollingCB() {
    if (this.onRolling === null) return;

    this.onRolling.removeAll();
  }
  /**
   * 移除全部文字變更的觸發事件
   */
  public removeAllChangingCB() {
    if (this.onChanging === null) return;

    this.onChanging.removeAll();
  }
  /**
   * 移除全部滾動动作完成时的觸发事件
   */
  public removeAllRollingFinishCB() {
    if (this.onFinish === null) return;

    this.onFinish.removeAll();
  }
  /**
   * 檢查目前數值是否滾动至目標數值或已超值
   */
  private checkComplete(): boolean {
    if (
      this.increaseValue === 0 ||
      (this.increaseValue > 0 && this._currentNumber >= this._targetNumber) ||
      (this.increaseValue < 0 && this._currentNumber <= this._targetNumber)
    ) {
      this._currentNumber = this._targetNumber;
      return true;
    } else {
      return false;
    }
  }
  /**
   * 設置目前滾動數值至UI文字上
   */
  private setNumberToUI() {
    if (this.label === null) return;

    const ratio = this.isRatio ? PlatformData.currencyRatio : 1;
    // 決定小數位數：滾分鎖定 > 動態判斷 > 平台預設
    let dp: number;
    if (this.isInteger) {
      dp = 0;
    } else if (this.lockedDecimalPlaces !== null) {
      dp = this.lockedDecimalPlaces;
    } else if (this.isRatio) {
      dp = Functions.getAdaptiveDecimalPlaces(
        this._currentNumber,
        ratio,
        this.decimalPlaces
      );
    } else {
      dp = this.decimalPlaces;
    }

    this.label.string =
      this.prefixCustomStr +
      Functions.numberFormat(
        this._currentNumber,
        dp,
        this.isAddComma,
        this.dollarSign,
        ratio,
        false,
        this.isChopOff
      ) +
      this.suffixCustomStr;
  }
  private releaseSignal() {
    if (this.onRolling !== null) this.onRolling.dispose();
    if (this.onChanging !== null) this.onChanging.dispose();
    if (this.onFinish !== null) this.onFinish.dispose();
    this.onRolling = null;
    this.onChanging = null;
    this.onFinish = null;
  }
}
