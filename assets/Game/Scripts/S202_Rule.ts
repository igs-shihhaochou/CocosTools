/* eslint-disable camelcase */
import {_decorator, Prefab, instantiate, Vec3, Node, UITransform, sp} from 'cc';

import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {
  GamePlayMode,
  WheelDropSetting,
} from '../../SlotModule/Define/SlotGameData';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {DropRule, SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {Symbol} from '../../SlotModule/Wheel/Symbol';
import {SymbolShowPrefabRule} from '../../SlotModule/Wheel/SymbolShowPrefabRule';
import {WheelBlockController} from '../../SlotModule/Wheel/WheelBlockController';
import {S202_SymbolID} from './Define';
import S202_WheelBlock from './S202_WheelBlock';

const {ccclass, property} = _decorator;

@ccclass('S202_Pool')
export class S202_Pool {
  @property({type: Prefab, displayName: 'Prefab'})
  protected prefab: Prefab = null;

  protected pool: sp.Skeleton[] = [];

  public Get(): sp.Skeleton {
    let skeleton = this.pool.shift();
    if (!skeleton) {
      const node = instantiate(this.prefab);
      skeleton = node.getComponent(sp.Skeleton);
    }
    return skeleton;
  }

  public Put(skeleton: sp.Skeleton): void {
    skeleton.setToSetupPose();
    skeleton.node.active = false;
    this.pool.push(skeleton);
  }
}

@ccclass
export default class S202_Rule extends SymbolShowPrefabRule {
  @property({type: S202_Pool, displayName: '正常 Scatter'})
  protected pool: S202_Pool = new S202_Pool();

  @property({displayName: '正常 Scatter 動畫名'})
  protected normalAnimaName = '';

  @property({displayName: '聽牌 Scatter 動畫名'})
  protected prewinAnimaName = '';

  @property({displayName: '入場 Scatter 動畫名'})
  protected inAnimaName = '';

  @property({type: Node, displayName: 'Anima Root'})
  protected animaRoot: Node = null;

  public static isPrewin: boolean[][] = [];
  public static prewinDropSetting: WheelDropSetting = null;
  public static normalDropSetting: WheelDropSetting = null;
  public static prewinAmountFunc: Function = null;
  // public static showPrewin: Function = null;
  // public static StopPrewin: Function = null;

  protected prewinScatterAmount = 0;
  protected prewinAmount: number[] = [];
  protected scatterAmount = 0;
  protected scatterPosition: number[][] = [];
  protected playingAnimation: sp.Skeleton[] = [];

  protected get wheelBlockController(): WheelBlockController {
    return SlotGameMediator.instance.awardController.showFrameObj[0]
      .wheelBlockControllerEx;
  }

  protected onLoad(): void {
    for (let i = 0; i < 5; ++i) {
      this.scatterPosition.push([]);
      this.prewinAmount.push(-1);
      S202_Rule.isPrewin.push([]);
      for (let j = 0; j < 4; ++j) {
        this.scatterPosition[i].push(0);
        S202_Rule.isPrewin[i].push(false);
      }
    }
    SlotGDK.event(DropRule.SingleWheel).insert(this.updateWheelData, this);
    SlotGDK.event('Rule_SetPrewin').insert(this.setPrewin, this);
    S202_Rule.prewinDropSetting =
      this.wheelBlockController.wheelDropSettingList.find(
        (setting: WheelDropSetting, id: number) => {
          return setting.playModeName === GamePlayMode.Prewin;
        }
      );
    S202_Rule.normalDropSetting =
      this.wheelBlockController.wheelDropSettingList.find(
        (setting: WheelDropSetting, id: number) => {
          return setting.playModeName === GamePlayMode.Normal;
        }
      );
    // S202_Rule.showPrewin = this.showPrewin.bind(this);
    S202_Rule.prewinAmountFunc = this.PrewinAmount.bind(this);
    // S202_Rule.StopPrewin = this.StopPrewin.bind(this);
    window['Rule'] = this;
  }

  protected onDestroy(): void {
    SlotGDK.event(DropRule.SingleWheel).remove(this.updateWheelData, this);
    SlotGDK.event('Rule_SetPrewin').remove(this.setPrewin, this);
    S202_Rule.prewinDropSetting = null;
    // S202_Rule.showPrewin = null;
    // S202_Rule.StopPrewin = null;
  }

  public reset(): void {}
  public resetRule(): void {
    this.scatterAmount = 0;
    this.prewinScatterAmount = 0;
    this.scatterPosition.forEach((scatterArr: number[], wheelIndex: number) => {
      scatterArr.forEach((scatter: number, symbolIndex: number) => {
        this.scatterPosition[wheelIndex][symbolIndex] = 0;
      });
    });
    S202_Rule.isPrewin.forEach((prewinArr: boolean[], wheelIndex: number) => {
      prewinArr.forEach((prewin: boolean, symbolIndex: number) => {
        S202_Rule.isPrewin[wheelIndex][symbolIndex] = false;
      });
    });
    this.prewinAmount.forEach((amount, wheelIndex) => {
      this.prewinAmount[wheelIndex] = -1;
    });

    this.clearAnimation();
  }

  public PrewinAmount(wheelIndex: number, wheelResult: number[]): number {
    if (this.prewinAmount[wheelIndex] >= 0) {
      return this.prewinAmount[wheelIndex];
    }
    if (SlotGDK.instance.fastSpin) {
      return 0;
    }

    let prewinAmount = 0;
    wheelResult.forEach((result, symbolIndex) => {
      if (
        wheelResult[wheelResult.length - 1 - symbolIndex] ===
        S202_SymbolID.Scatter
      ) {
        ++this.prewinScatterAmount;
        if (this.prewinScatterAmount === 2) {
          prewinAmount = -1;
        }

        if (this.prewinScatterAmount === 3) {
          prewinAmount++;
        }
      }

      if (this.prewinScatterAmount === 2) {
        prewinAmount++;
      }
    });
    this.prewinAmount[wheelIndex] = prewinAmount;
    return prewinAmount;
  }
  public static CheckNeedWait(
    wheelIndex: number,
    wheelResult: number[]
  ): Boolean {
    if (SlotGDK.instance.fastSpin) {
      return false;
    }
    const nowScCount = (
      SlotGameMediator.instance.wheelsManager.wheelControllerList[0]
        .wheelBlock as S202_WheelBlock
    ).nowScCount;
    let needWait = false;
    wheelResult.forEach((result, symbolIndex) => {
      if (
        wheelResult[wheelResult.length - 1 - symbolIndex] ===
        S202_SymbolID.Scatter
      ) {
        if (nowScCount === 1 || nowScCount === 2) {
          needWait = true;
        }
      }
    });
    return needWait;
  }

  public setPrewin(wheelIndex: number, wheelResult: number[]): void {
    wheelResult.forEach((result, symbolIndex) => {
      const index = wheelResult.length - 1 - symbolIndex;
      if (wheelResult[index] === S202_SymbolID.Scatter) {
        ++this.scatterAmount;
        if (this.scatterAmount === 3) {
          if (SlotGDK.instance.fastSpin) {
            S202_Rule.isPrewin[wheelIndex][index] = false;
          } else {
            S202_Rule.isPrewin[wheelIndex][index] = true;
          }
        } else {
          S202_Rule.isPrewin[wheelIndex][index] = false;
        }
      } else {
        if (SlotGDK.instance.fastSpin) {
          S202_Rule.isPrewin[wheelIndex][index] = false;
        } else {
          S202_Rule.isPrewin[wheelIndex][index] = this.scatterAmount === 2;
        }
      }
    });
  }

  public updateWheelData(wheelIndex: number, wheelResult: number[]): void {
    wheelResult.forEach((result, symbolIndex) => {
      const index = wheelResult.length - 1 - symbolIndex;
      if (
        wheelResult[index] === S202_SymbolID.Scatter &&
        this.scatterPosition[wheelIndex][index] === 0
      ) {
        this.showScatter(wheelIndex, index);
      }
    });
  }

  public setSingleWheelData(wheelIndex: number, wheelResult: number[]): void {}

  public async showScatter(
    wheelIndex: number,
    symbolIndex: number
  ): Promise<void> {
    const symbol: Symbol = this.getSymbol(wheelIndex, symbolIndex);

    if (this.playingAnimation.length === 1) {
      this.prewinAllScatter();
      // SlotGDK.function(Audio.Play)('a09');
      SlotGameMediator.instance.audioManager.play('a09');
    } else if (this.playingAnimation.length === 2) {
      this.normalAllScatter();
      // SlotGDK.function(Audio.Play)('a10');
      SlotGameMediator.instance.audioManager.play('a10');
    } else if (this.playingAnimation.length === 0) {
      // SlotGDK.function(Audio.Play)('a08');
      SlotGameMediator.instance.audioManager.play('a08');
    }

    this.scatterPosition[wheelIndex][symbolIndex] = 1;
    const skeleton: sp.Skeleton = this.pool.Get();
    skeleton.node.parent = this.animaRoot;
    skeleton.node.active = true;
    this.Align(skeleton.node, symbol.node);
    this.playingAnimation.push(skeleton);
    //skeleton.setAnimation(0, this.inAnimaName, false);
    const entry = skeleton.setAnimation(0, this.inAnimaName, false);
    symbol.hide();
    await waitForSeconds(entry.animationStart);
    if (skeleton.node.active) {
      const animaName: string =
        this.playingAnimation.length === 2
          ? this.prewinAnimaName
          : this.normalAnimaName;
      //animation.play(animaName, time);
      skeleton.setAnimation(0, animaName, true);
    }
  }

  public prewinAllScatter(): void {
    this.playingAnimation.forEach((skeleton: sp.Skeleton) => {
      skeleton.setAnimation(0, this.prewinAnimaName, true);
    });
  }

  public normalAllScatter(): void {
    this.playingAnimation.forEach((skeleton: sp.Skeleton) => {
      skeleton.setAnimation(0, this.normalAnimaName, true);
    });
  }

  public Align(target: Node, to: Node): void {
    const pos: Vec3 = to
      .getComponent(UITransform)
      .convertToWorldSpaceAR(Vec3.ZERO);
    const position: Vec3 = target.parent
      .getComponent(UITransform)
      .convertToNodeSpaceAR(pos);
    target.position = position;
  }

  public getSymbol(wheelIndex: number, symbolIndex: number): Symbol {
    const symbolID: number =
      symbolIndex +
      this.wheelBlockController.wheelAry[wheelIndex].outOfTopSymbolAmount;
    return this.wheelBlockController.wheelAry[wheelIndex].getSymbolEx(symbolID);
  }

  // public showPrewin(wheelIndex: number): void {
  //     this.wheelBlockController.Event_PrewinStart.Notify(0, wheelIndex);
  // }

  // public StopPrewin(wheelIndex: number): void {
  //     this.wheelBlockController.Event_PrewinFinished.Notify(0, wheelIndex);
  // }

  public clearAnimation(): void {
    while (this.playingAnimation.length > 0) {
      const animation = this.playingAnimation.shift();
      this.pool.Put(animation);
    }
  }

  public stopAnimation(): void {
    this.playingAnimation.forEach((skeleton: sp.Skeleton) => {
      const entry = skeleton.setAnimation(0, this.normalAnimaName, false);
      // 直接跳到最後一幀並凍住，不從頭播
      const duration = entry.animation.duration;
      entry.trackTime = Math.max(0, duration - 1 / 30);
      entry.timeScale = 0;
      skeleton.updateAnimation(0);
    });
  }
}
