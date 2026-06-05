import {_decorator, Component, Label, CCBoolean, CCInteger} from 'cc';
import Functions from '../Utility/Functions';
import {PlatformData} from '../Define/PlatformData';
import {Delegate} from '../ExtraType';

const {ccclass, property} = _decorator;

@ccclass('NumberAnimation')
export class NumberAnimation extends Component {
  @property(CCBoolean)
  public isInteger = false; // 以整數顯示(不顯示小數點)
  @property(CCBoolean)
  public isRatio = false; // 數值是否乘上幣值
  @property(CCBoolean)
  public isKMBFormat = false;
  @property(CCBoolean)
  public isMoney = false;
  @property(CCBoolean)
  public showThousandPlaces = false;
  @property(CCBoolean)
  public showCurrencyName = false; //Joya特規
  @property(CCBoolean)
  public discardDecimalZero = false;
  @property(CCBoolean)
  public chopOff = false;
  @property(CCBoolean)
  public adaptiveDecimal = false; // 是否啟用動態小數位數判斷
  @property({
    visible: function (this: NumberAnimation) {
      return this.showCurrencyName;
    },
  })
  public showCurrecyAtFront = true;
  @property(CCInteger)
  private updateFPS = 30;

  public currentNumber = 0;
  public finishDelegate: Delegate = new Delegate(); //滾到目標時會呼叫的 Delegate
  public getCurrentNumber(): number {
    return this.currentNumber;
  }
  public getTargetNumber(): number {
    return this.targetNumber;
  }
  public getTotalAnimationTime(): number {
    return this.totalCountTime;
  }

  protected targetTxtUGUI: Label | null = null;
  protected animationTimeInPlay = 0;
  protected updatingUnitTime = 0; //每個Frame的間隔時間
  protected updatingUnitValue = 0;

  private targetNumber = 0;
  private baseNumber = 0;
  private totalCountTime = 0;
  private isAnimFinished = false;
  /** 滾分期間鎖定的小數位數，由目標值決定 */
  private lockedDecimalPlaces: number | null = null;

  // Use this for initialization
  public onLoad(): void {
    this.init();
  }

  protected init(): void {
    this.targetTxtUGUI = this.node.getComponent(Label);
    this.setNumberLabel();
  }

  // Update is called once per frame
  update(dt): void {
    if (this.isAnimFinished === false) {
      if (this.targetNumber !== this.currentNumber) {
        // A.R.S 2013/03/06 Add Force Check
        this.animationTimeInPlay += dt;
        if (this.animationTimeInPlay > this.updatingUnitTime) {
          this.currentNumber +=
            this.updatingUnitTime === 0
              ? this.updatingUnitValue
              : this.updatingUnitValue *
                (this.animationTimeInPlay / this.updatingUnitTime);
          this.animationTimeInPlay = 0;

          if (
            (this.currentNumber >= this.targetNumber &&
              this.updatingUnitValue >= 0) ||
            (this.currentNumber <= this.targetNumber &&
              this.updatingUnitValue <= 0)
          ) {
            this.currentNumber = this.targetNumber;
          }

          this.setNumberLabel();
        }
      } else if (
        this.targetNumber > 0 &&
        this.currentNumber > 0 &&
        this.targetNumber === this.currentNumber
      ) {
        ////滾到目標，清除鎖定讓最終顯示使用 adaptive
        if (this.adaptiveDecimal) {
          this.lockedDecimalPlaces = null;
          this.setNumberLabel();
        }
        this.finishDelegate.notify();
        this.isAnimFinished = true;
      } else {
        //沒有設定時的狀態
        this.isAnimFinished = true;
        this.animationTimeInPlay = 0;
      }
    }
  }

  //設定顯示幣種名稱
  public setDisplayCurrencyName(option = false, atFront = true) {
    this.showCurrencyName = option;
    this.showCurrecyAtFront = atFront;
    this.setNumberLabel();
  }

  //重置狀態，將當前的數字和目標都歸0
  public reset() {
    this.currentNumber = 0;
    this.targetNumber = 0;
    this.lockedDecimalPlaces = null;
    this.setNumberLabel();
  }

  //設定當前Label的數字 (目標數字)
  public setCurrentNumber(target: number): void {
    this.currentNumber = target;
    this.setNumberLabel();
  }

  //將當前的Label的數字快速跳到設定的數字並停止 (目標數字)
  public setNumberToStop(target: number = this.targetNumber): void {
    this.currentNumber = target;
    this.targetNumber = target;
    this.lockedDecimalPlaces = null;
    this.setNumberLabel();
  }

  //設定Label數字要滾到的目標 (目標數字, 滾到的時間, 強制開始滾動)
  public setTargetNumberAnimationEx(target: number, countTime: number): void {
    this.isAnimFinished = false;
    this.baseNumber = this.currentNumber;
    this.targetNumber = target;
    this.animationTimeInPlay = 0;

    // 依最終目標值鎖定滾分期間的小數位數
    // 滾動期間至少用平台預設位數，避免小數值（如1、0.01）滾動時長時間顯示0
    // 動畫結束後清除鎖定，改由 adaptive 決定最終顯示
    if (this.adaptiveDecimal && !this.isInteger && this.isRatio) {
      const {displayDigit, displayRatio} = this.getCurrencySetting();
      const adaptive = Functions.getAdaptiveDecimalPlaces(
        target,
        displayRatio,
        displayDigit
      );
      this.lockedDecimalPlaces = Math.max(adaptive, displayDigit);
    } else {
      this.lockedDecimalPlaces = null;
    }

    if (this.updateFPS <= 0) this.updateFPS = 10; //預設FPS為10

    this.totalCountTime = countTime;
    if (this.totalCountTime <= 0) this.totalCountTime = 0.1; //預設至少滾0.1秒

    this.updatingUnitTime = 1 / this.updateFPS; //計算每一個Frame的間格時間
    this.updatingUnitValue =
      ((this.targetNumber - this.baseNumber) * this.updatingUnitTime) /
      this.totalCountTime; //計算每一個FPS要滾多少
  }

  protected getCurrencySetting() {
    const {displayDigit, displayRatio, showThousandPlaces} =
      PlatformData.instance;
    return {
      displayDigit: displayDigit,
      displayRatio: displayRatio,
      showThousandPlaces: showThousandPlaces,
    };
  }

  //設定Label的數字
  private setNumberLabel(): void {
    if (this.targetTxtUGUI) {
      const {displayDigit, displayRatio, showThousandPlaces} =
        this.getCurrencySetting();
      const currency = PlatformData.currency;
      const addCommas = this.showThousandPlaces ? showThousandPlaces : false;
      const ratio = this.isRatio ? displayRatio : 1;

      // 決定小數位數：adaptiveDecimal 開啟時 → 滾分鎖定 > 動態判斷；否則用平台預設
      let decimalPlaces: number;
      if (this.isInteger) {
        decimalPlaces = 0;
      } else if (this.adaptiveDecimal && this.lockedDecimalPlaces !== null) {
        decimalPlaces = this.lockedDecimalPlaces;
      } else if (this.adaptiveDecimal && this.isRatio) {
        decimalPlaces = Functions.getAdaptiveDecimalPlaces(
          this.currentNumber,
          ratio,
          displayDigit
        );
      } else {
        decimalPlaces = displayDigit;
      }

      const getDollarSign = () => {
        if (PlatformData.currencySymbol === '') {
          return '$';
        } else {
          return `${PlatformData.currencySymbol} `;
        }
      };

      const dollarSign = this.isMoney ? getDollarSign() : '';

      const currencyName = this.showCurrencyName
        ? PlatformData.currencyName ||
          Functions.getCurrencyDisplayName(currency)
        : '';
      // 滾分期間(lockedDecimalPlaces有值)不discard，避免位數跳動
      const isRolling =
        this.adaptiveDecimal && this.lockedDecimalPlaces !== null;
      const discardZero = isRolling ? false : this.discardDecimalZero;
      const numberStr = this.isKMBFormat
        ? Functions.formatKMBNumber(this.currentNumber * ratio, 2, true)
        : Functions.numberFormat(
            this.currentNumber,
            decimalPlaces,
            addCommas,
            '',
            ratio,
            discardZero,
            this.chopOff
          );
      if (this.showCurrencyName) {
        const displayNumberStr = `${dollarSign}${numberStr}`;
        this.targetTxtUGUI.string = this.showCurrecyAtFront
          ? `${currencyName} ${displayNumberStr}`
          : `${displayNumberStr} ${currencyName}`;
      } else {
        this.targetTxtUGUI.string = `${dollarSign}${numberStr}`;
      }
    }
  }

  public setIsMoney(isMoney: boolean) {
    this.isMoney = isMoney;
    this.setNumberLabel();
  }
}
