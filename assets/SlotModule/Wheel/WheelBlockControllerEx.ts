import {_decorator} from 'cc';
const {ccclass} = _decorator;

import {
  GamePlayMode,
  WheelStatus,
  WheelRotateSetting,
} from '../Define/SlotGameData';
import {Status} from './Wheel';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {SlotGDK} from '../Define/SlotGDK';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {WheelBlockController} from './WheelBlockController';
export enum PlayMode {
  Rotate,
  Drop,
}

@ccclass('WheelBlockControllerEx')
export class WheelBlockControllerEx extends WheelBlockController {
  protected isSkipWheel(_wheelIndex: number): boolean {
    return false;
  }

  public async spinAll(playMode: GamePlayMode) {
    //GamePlayMode or WheelRotateInfo):void {
    this.isNowRotateWheel = true;
    this.prepareSpin();

    this.gameStatus = WheelStatus.StartRotate;

    if (this.wheelSpinAudioName !== null && this.wheelSpinAudioName !== '') {
      SlotGameMediator.instance.audioManager.play(this.wheelSpinAudioName);
    }

    for (let i = 0; i < this.wheelAmount; i++) {
      if (this.isSkipWheel(i)) {
        continue;
      }
      for (let j = 0; j < this.stopWheelSequenceAry.length; j++) {
        if (this.stopWheelSequenceAry[j] === i) {
          this.spinSingleByMode(j, playMode);
        }
      }
    }

    this.gameStatus = WheelStatus.Rotate;

    if (this.eventAllSpin.length > 0) {
      this.eventAllSpin.notify();
    }
    if (this.getSpinRequest) {
      this.stopAll();
    }
  }

  public doWheelsStop(delayTime = 0): void {
    if (Define.DEBUG_LOG)
      console.log(
        '[WheelControllerEx][DoWheelsStop] Prepare Stop (Index = ' +
          this.stopIndex +
          ')' +
          '==============================='
      );
    let isThisWheelStopped = false;
    let first = true;

    const WheelItem = this.sortStopWheelList.find(a => {
      return a.sortIndex === this.stopIndex;
    });
    let wheelList: number[] = [];
    if (WheelItem) {
      wheelList = WheelItem.wheelIndexAry;
    }
    for (let i = 0, count: number = wheelList.length; i < count; i++) {
      const wheelIndex = wheelList[i];

      if (this.isSkipWheel(wheelIndex)) {
        continue;
      }

      let gapTime = 0;
      if (this.playMode === PlayMode.Rotate) {
        gapTime = this.nowRotateInfo.wheelStopGapTime;
      } else if (this.playMode === PlayMode.Drop) {
        gapTime = this.nowDropSetting.wheelStopGapTime;
      }
      if (
        SlotGDK.instance.fastSpin &&
        SlotGameMediator.instance.mainGameHost.getNowPlayMode() ===
          GamePlayMode.Normal
      ) {
        gapTime = gapTime / this.fastSpinSpeedMultiple;
      }
      if (
        this.playMode === PlayMode.Rotate &&
        this.wheelAry[wheelIndex].nowRotateInfo
      ) {
        gapTime = this.wheelAry[wheelIndex].nowRotateInfo.wheelStopGapTime;
      } else if (
        this.playMode === PlayMode.Drop &&
        this.wheelAry[wheelIndex].nowDropSetting
      ) {
        gapTime = this.wheelAry[wheelIndex].nowDropSetting.wheelStopGapTime;
      }
      let wheelDelayTime = 0;
      const wheelStatus: Status = this.wheelAry[wheelIndex].wheelStatus;
      if (
        wheelStatus !== Status.Idle &&
        Number(wheelStatus) < Number(Status.Stopping)
      ) {
        const _isWheelHavePrewin =
          this.isPrewin && this._prewinAry[wheelIndex] === 1;
        //                 //If it's Prewin Wheel, set prewin data.
        if (_isWheelHavePrewin) {
          const _preiwnInfo: WheelRotateSetting = this.getRotateSetting(
            GamePlayMode.Prewin
          );
          this.showPrewin(wheelIndex);
          wheelDelayTime += _preiwnInfo.wheelStopGapTime;
        } else {
          if (this.stopIndex > 0) {
            wheelDelayTime = delayTime + gapTime;
          } else {
            wheelDelayTime = delayTime;
          }
        }
        if (Define.DEBUG_LOG)
          console.log(
            '[WheelControllerEx][DoWheelsStop] StopIndex = ' +
              this.stopIndex +
              ' | WheelStatus(' +
              wheelIndex +
              ') = ' +
              this.wheelAry[wheelIndex].wheelStatus +
              ' | Delay ' +
              wheelDelayTime +
              ' sec To Stop!'
          );
        let isNextWheelHavePrewin = false;
        if (this._isPrewin && this.stopIndex + 1 <= this.maxSortedStopIndex) {
          const nextPrewinWheelItem = this.sortStopWheelList.find(a => {
            return a.sortIndex === this.stopIndex + 1;
          });
          if (nextPrewinWheelItem) {
            isNextWheelHavePrewin =
              this._prewinAry[nextPrewinWheelItem.wheelIndexAry[0]] === 1;
          }
        }
        //不是急停 & 這一輪和下一輪有沒有預中效果 & 不是最後一輪 && 同時停止要一輪處理
        const isCallNextStop: boolean =
          !this.isDoQuickStop &&
          !isNextWheelHavePrewin &&
          !_isWheelHavePrewin &&
          this.stopIndex < this.maxSortedStopIndex &&
          i === 0;

        first = false;

        //Stop Single Wheel
        this.stopSingleDelay(
          wheelDelayTime,
          wheelIndex,
          this.resultAry[wheelIndex],
          isCallNextStop
        );
      } else {
        isThisWheelStopped = true;
      }
    }
    if (this.stopIndex <= this.maxSortedStopIndex) {
      this.stopIndex++;
      if (Define.DEBUG_LOG)
        console.log(
          '[WheelControllerEx][DoWheelsStop] m_StopIndex++, m_StopIndex=' +
            this.stopIndex
        );
      if (isThisWheelStopped || first) {
        this.doWheelsStop(0);
      }
    } else {
      if (Define.DEBUG_LOG)
        console.log(
          '[WheelControllerEx][DoWheelsStop] StopIndex = ' +
            this.stopIndex +
            ' is Larger than MaxSortedStopIndex(' +
            this.maxSortedStopIndex +
            '), please check Wheel StopIndex or Call AllStopped()'
        );
    }
  }
}
