import {_decorator} from 'cc';
const {ccclass, property} = _decorator;

import {WheelMaskController} from '../Wheel/WheelMaskController';
import {SymbolShowPrefabController} from '../Wheel/SymbolShowPrefabController';
import {WheelBlockController} from '../Wheel/WheelBlockController';
import {FrameController} from './FrameController';
import HostSetting from '../Define/HostSetting';

@ccclass('ShowFrameObj')
export class ShowFrameObj {
  @property(WheelBlockController)
  public wheelBlockControllerEx: WheelBlockController = null;
  @property(FrameController)
  public frameControllerEx: FrameController = null;
  @property(WheelMaskController)
  public wheelMaskControllerEx: WheelMaskController = null;
  @property({type: SymbolShowPrefabController})
  public symbolShowPrefabController: SymbolShowPrefabController = null;

  public lineId = 0;
  public awardDataId = 0;
  public symbolAnimList: number[][] = [];

  public init(): void {
    if (HostSetting.instance.bingo.useWheelMask) {
      if (this.wheelMaskControllerEx === null) {
        console.error('WheelBlockController: this.WheelMask is null.');
      } else {
        for (let i = 0; i < this.wheelBlockControllerEx.wheelAmount; i++) {
          this.wheelMaskControllerEx.init(
            i,
            this.wheelBlockControllerEx.wheelAry[i].symbolAmount
          );
          for (
            let j = 0;
            j < this.wheelBlockControllerEx.wheelAry[i].symbolAmount;
            j++
          ) {
            this.wheelMaskControllerEx.spawnMask(
              i,
              j,
              this.wheelBlockControllerEx.wheelAry[i].symbolAry[j].node
            );
          }
        }
      }
    }
  }

  public stopAll(): void {
    this.hideBingoFrame();
    this.hideWheelMask();
    this.stopSymbolAnimation(this.symbolAnimList, false);
  }

  public showBingoFrame(positionList: number[][]): void {
    this.frameControllerEx.init(this.wheelBlockControllerEx);
    if (HostSetting.instance.bingo.useBingoFrame) {
      this.frameControllerEx.showBingoFrame(positionList);
    }
  }

  public showWheelMask(positionList: number[][]): void {
    if (HostSetting.instance.bingo.useWheelMask) {
      for (let i = 0; i < this.wheelBlockControllerEx.wheelAmount; i++) {
        for (
          let j = 0;
          j <
          this.wheelBlockControllerEx.wheelAry[i].symbolAmount -
            this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount;
          j++
        ) {
          if (positionList[i][j] === 1) {
            this.wheelMaskControllerEx.hideMask(
              i,
              j + this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount
            );
          } else {
            this.wheelMaskControllerEx.showMask(
              i,
              j + this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount
            );
          }
        }
      }
    }
  }

  public hideBingoFrame(): void {
    if (HostSetting.instance.bingo.useBingoFrame) {
      this.frameControllerEx.hideBingoFrame();
    }
  }

  public hideWheelMask(): void {
    if (HostSetting.instance.bingo.useWheelMask) {
      for (let i = 0; i < this.wheelBlockControllerEx.wheelAmount; i++) {
        for (
          let j = 0;
          j < this.wheelBlockControllerEx.wheelAry[i].symbolAmount;
          j++
        ) {
          this.wheelMaskControllerEx.hideMask(i, j);
        }
      }
    }
  }

  public stopSymbolAnimation(
    bingoSymbolList: number[][],
    bIsSpecialGame: boolean
  ) {
    this.wheelBlockControllerEx.stopSymbolsShowAnimation(
      bingoSymbolList,
      bIsSpecialGame
    );
    this.symbolAnimList = null;
  }

  /** 撥放 Symbol 中獎動畫 */
  public showSymbolAnimation(
    bingoPosList: number[][],
    isSpecialSymbol: boolean
  ): void {
    if (isSpecialSymbol) {
      this.stopSGSymbolAnimation();
    }
    ///show symbol anim
    this.wheelBlockControllerEx.showBingoSymbolAnim(
      bingoPosList,
      isSpecialSymbol
    );
    this.symbolAnimList = bingoPosList;
  }

  public stopSGSymbolAnimation(): void {
    if (this.wheelBlockControllerEx !== null) {
      this.wheelBlockControllerEx.stopSGSymbolsShowAnimation();
      this.wheelBlockControllerEx.hideOverFrameSymbol(); //close symbols are depth higher wheel frame.
    }
  }

  public hideOffClippingSymbol(bingoSymbolList: number[][]): void {
    this.symbolShowPrefabController.hideOffClippingSymbol(bingoSymbolList);
  }

  public showOffClippingSymbol(): void {
    this.symbolShowPrefabController.showOffClippingSymbol();
  }
}
