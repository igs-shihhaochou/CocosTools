/* eslint-disable camelcase */
import {_decorator, log} from 'cc';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {FeatureType, WheelStatus} from '../../SlotModule/Define/SlotGameData';
import {Status} from '../../SlotModule/Wheel/Wheel';
import {WheelBlockController} from '../../SlotModule/Wheel/WheelBlockController';
import {S202_SymbolID} from './Define';
import S202_Rule from './S202_Rule';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';

const {ccclass, property} = _decorator;

@ccclass
export default class S202_WheelBlock extends WheelBlockController {
  public prewinBoolAry: boolean[] = [];
  protected flag: boolean;
  public nowScCount = 0;
  private firstPreWin = false;
  /** 避免 stopSingle / onSingleWheelStopped 重複觸發下一輪停輪 */
  private nextStopProceedScheduled: Set<number> = new Set();

  public prepareSpin() {
    super.prepareSpin();
    this.nowScCount = 0;
    this.firstPreWin = true;
    this.nextStopProceedScheduled.clear();
  }

  public doQuickStop() {
    //還未準備停輪時不給予急停

    this._isDoQuickStop = true;

    if (this.gameStatus !== WheelStatus.ReadyToStop) {
      return;
    }

    if (
      this.checkHaveFeature(FeatureType.Rotating) ||
      this.checkHaveFeaturePlayingByType(FeatureType.Rotating)
    ) {
      return;
    }

    const stopWheelAmount = this._wheelAmount - this.rotateWheelAry.length;
    for (let i: number = stopWheelAmount; i < this.wheelAmount; i++) {
      const wheelItem: any = this.sortStopWheelList.find(a => {
        return a.sortIndex === i;
      });
      let wheelList: number[] = [];

      if (wheelItem) {
        wheelList = wheelItem.wheelIndexAry;
      }

      for (let j = 0; j < wheelList.length; j++) {
        const wheelIndex: number = wheelList[j];

        const isWheelHavePrewin: boolean = this.prewinBoolAry[wheelIndex];
        const status: Status = this.wheelAry[wheelIndex].wheelStatus;

        //如果有Prewin的可能性，則讓Prewin之前的轉輪帶先做急停
        //// 志浩的code =====================================================
        if (SlotGDK.instance.fastSpin === false && isWheelHavePrewin) {
          if (status <= Status.ReadyToStop) {
            if (Define.DEBUG_LOG)
              log('[S202_WheelBlock][QuickStop] Prewin ', wheelIndex);
            this.flag = true;
            this.stopIndex = i;
            this.doWheelsStop(0);
          }
          return;
        } else {
          if (
            status === Status.Stopping ||
            status === Status.Stop ||
            status === Status.Idle ||
            status === Status.BreakToBound
          ) {
            continue;
          }

          if (Define.DEBUG_LOG)
            log('[S202_WheelBlock][QuickStop] QuickStop ', wheelIndex);

          S202_Rule.prewinAmountFunc(wheelIndex, this.resultAry[wheelIndex]);

          //全部一起停會報音的防呆
          if (this.rotateWheelAry[i] < this._wheelAmount - 1) {
            const nextWheelIndex: number =
              this.sortStopWheelList[this.rotateWheelAry[i] + 1].wheelIndex;
            const isNextWheelHavePrewin: boolean =
              this.prewinBoolAry[wheelIndex] &&
              this.prewinBoolAry[nextWheelIndex];
            if (!isNextWheelHavePrewin) {
              this.wheelAry[this.rotateWheelAry[i]].setNoStopWheelSound();
            }
          }

          if (this.wheelTweenFunc[wheelIndex]) {
            this.unschedule(this.wheelTweenFunc[wheelIndex]);
            this.wheelTweenFunc[wheelIndex] = null;
          }
          this.stopSingleDelay(
            this.quickStopGapTime * (i - stopWheelAmount),
            wheelIndex,
            this.resultAry[wheelIndex],
            false
          );
        }
      }
    }
  }

  public async doAllStop(): Promise<void> {
    let scatterAmount = 0;
    this.flag = false;
    this.resultAry.forEach((wheelResult: number[], wheelIndex: number) => {
      this.prewinBoolAry[wheelIndex] = false;
      wheelResult.forEach((result, index) => {
        const symbolIndex: number = wheelResult.length - 1 - index;
        if (scatterAmount === 2) {
          this.prewinBoolAry[wheelIndex] = true;
        }
        if (wheelResult[symbolIndex] === S202_SymbolID.Scatter) {
          scatterAmount++;
        }
      });
    });
    if (Define.DEBUG_LOG)
      log('[S202_WheelBlock][DoAllStop] Prewin ', this.prewinBoolAry);
    super.doAllStop();
  }

  public doWheelsStop(delayTime = 0): void {
    if (Define.DEBUG_LOG)
      log(
        '[S202_WheelBlock][DoWheelsStop] Prepare Stop (Index = ' +
          this.stopIndex +
          ')'
      );
    let isThisWheelStopped = false;

    const wheelItem: any = this.sortStopWheelList.find(a => {
      return a.sortIndex === this.stopIndex;
    });
    let wheelList: number[] = [];

    if (wheelItem) {
      wheelList = wheelItem.wheelIndexAry;
    }

    let maxDelay = 0;
    for (let i = 0, count: number = wheelList.length; i < count; i++) {
      const wheelIndex: number = wheelList[i];
      const gapTime: number =
        this.wheelAry[wheelIndex].nowDropSetting.wheelStopGapTime;
      let wheelDelayTime = 0;
      const wheelStatus: Status = this.wheelAry[wheelIndex].wheelStatus;

      if (
        wheelStatus !== Status.Idle &&
        Number(wheelStatus) < Number(Status.Stopping)
      ) {
        if (this.stopIndex > 0) {
          wheelDelayTime = delayTime + gapTime;
        } else {
          wheelDelayTime = delayTime;
        }

        let isNextWheelHavePrewin = false;
        if (this._isPrewin && this.stopIndex + 1 <= this.maxSortedStopIndex) {
          const NextPrewinWheelItem: any = this.sortStopWheelList.find(a => {
            return a.sortIndex === this.stopIndex + 1;
          });
          if (NextPrewinWheelItem) {
            isNextWheelHavePrewin =
              this.prewinBoolAry[NextPrewinWheelItem.wheelIndexAry[0]];
          }
        }

        //不是急停 & 這一輪和下一輪有沒有預中效果 & 不是最後一輪 && 同時停止要一輪處理
        const isCallNextStop: boolean =
          this.stopIndex < this.maxSortedStopIndex && i === 0;
        if (wheelDelayTime > maxDelay) {
          maxDelay = wheelDelayTime;
        }
        if (Define.DEBUG_LOG)
          log('[S202_WheelBlock] StopSingleDelay', wheelDelayTime);
        //Stop
        this.stopSingleDelay(
          wheelDelayTime,
          wheelIndex,
          this.resultAry[wheelIndex],
          isCallNextStop || this.flag
        );
      } else {
        if (Define.DEBUG_LOG) log('[S202_WheelBlock][DoWheelsStop] ');
        isThisWheelStopped = true;
      }
    }

    if (this.stopIndex <= this.maxSortedStopIndex) {
      this.stopIndex++;
      if (isThisWheelStopped) {
        this.doWheelsStop(0);
      }
    } else {
      log(
        '[S202_WheelBlock][DoWheelsStop] StopIndex = ' +
          this.stopIndex +
          ' is Larger than MaxSortedStopIndex(' +
          this.maxSortedStopIndex +
          '), please check Wheel StopIndex or Call AllStopped()'
      );
    }
  }

  private countScatterOnWheel(wheelIndex: number): number {
    const wheelResult = this.resultAry[wheelIndex];
    if (!wheelResult) return 0;
    let count = 0;
    wheelResult.forEach((result, index) => {
      const symbolIndex = wheelResult.length - 1 - index;
      if (wheelResult[symbolIndex] === S202_SymbolID.Scatter) {
        count++;
      }
    });
    return count;
  }

  /**
   * 統計「下一輪開始掉之前」前面停輪順序已出現的 Scatter 數
   */
  private countScatterBeforeNextStop(nextWheelIndex: number): number {
    const nextItem = this.sortStopWheelList.find(item =>
      item.wheelIndexAry.includes(nextWheelIndex)
    );
    if (!nextItem) {
      let count = 0;
      for (let w = 0; w < nextWheelIndex; w++) {
        count += this.countScatterOnWheel(w);
      }
      return count;
    }

    let count = 0;
    for (const item of this.sortStopWheelList) {
      if (item.sortIndex >= nextItem.sortIndex) break;
      for (const w of item.wheelIndexAry) {
        count += this.countScatterOnWheel(w);
      }
    }
    return count;
  }

  private getNextSortedStopWheelIndex(wheelIndex: number): number | null {
    const thisItem = this.sortStopWheelList.find(item =>
      item.wheelIndexAry.includes(wheelIndex)
    );
    if (!thisItem) return null;
    const nextItem = this.sortStopWheelList.find(
      item => item.sortIndex === thisItem.sortIndex + 1
    );
    return nextItem?.wheelIndexAry[0] ?? null;
  }

  /**
   * 下一輪開始掉之前，若前面已累積 >= 2 顆 Scatter，必須等本輪 drop 完
   */
  private shouldWaitPreviousWheelDropFinish(wheelIndex: number): boolean {
    if (SlotGDK.instance.fastSpin) return false;
    const nextWheelIndex = this.getNextSortedStopWheelIndex(wheelIndex);
    if (nextWheelIndex === null) return false;
    return this.countScatterBeforeNextStop(nextWheelIndex) >= 2;
  }

  /// <summary> 呼叫下一個轉輪停止 </summary>
  public callNextWheelReadyToStop(wheelIndex: number): void {
    if (this.rotateWheelAry.length === 0) return;

    const needWaitDropFinish =
      this.shouldWaitPreviousWheelDropFinish(wheelIndex);

    const proceedNextStop = (skipFormulaDelay: boolean) => {
      if (this.nextStopProceedScheduled.has(wheelIndex)) return;
      this.nextStopProceedScheduled.add(wheelIndex);

      // 前面已有 2 顆 SC：已等該輪 drop 播完，不再疊 prewinAmount * dropTime * 1.2
      if (skipFormulaDelay) {
        this.doWheelsStop(0);
        this.firstPreWin = false;
        return;
      }

      let prewinAmount = 0;
      prewinAmount = S202_Rule.prewinAmountFunc(
        wheelIndex,
        this.resultAry[wheelIndex]
      );
      if (Define.DEBUG_LOG)
        log('[S202_WheelBlock][DoWheelsStop] Prewin Amount = ' + prewinAmount);
      const nextNeedWait = S202_Rule.CheckNeedWait(
        wheelIndex,
        this.resultAry[wheelIndex]
      );
      if (prewinAmount > 0 || nextNeedWait) {
        this.scheduleOnce(
          () => {
            this.doWheelsStop(0);
          },
          prewinAmount *
            S202_Rule.prewinDropSetting.normalWheelDropInfo.dropTime *
            1.2 +
            (nextNeedWait ? 1 : 0)
        );
        this.firstPreWin = false;
      } else {
        this.doWheelsStop(0);
      }
    };

    if (needWaitDropFinish) {
      const wheel = this.wheelAry[wheelIndex];
      if (wheel.wheelStatus !== Status.Stop) {
        const onWheelDropped = (stoppedIndex: number) => {
          if (stoppedIndex !== wheelIndex) return;
          wheel.eventWheelStopped.remove(onWheelDropped, this);
          proceedNextStop(true);
        };
        wheel.eventWheelStopped.insert(onWheelDropped, this);
        return;
      }
      proceedNextStop(true);
      return;
    }

    proceedNextStop(false);
  }
}
