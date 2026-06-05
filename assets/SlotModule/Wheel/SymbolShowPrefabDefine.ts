import {
  _decorator,
  Node,
  Prefab,
  CCInteger,
  CCBoolean,
  CCFloat,
  Animation,
  sp,
  CCString,
} from 'cc';
const {ccclass, property} = _decorator;

import {Symbol} from './Symbol';
// //Symbol表演相關資訊
export interface AnimationData {
  animation: Animation;
  name: string;
  isLoop: boolean;
}
export interface SpineData {
  spine: sp.Skeleton;
  name: string;
  isLoop: boolean;
}

@ccclass('SymbolShowInfo')
export class SymbolShowInfo {
  public symbolEx: Symbol = null;
  public offClippingTform: Node | null = null;
  public symbolUpperLayerPrefabTform: Node | null = null;
  public wheelStopAnimaPrefabTform: Node | null = null;
  public symbolStopLoopAnimaPrefabTform: Node | null = null;
  public bingoAnimaPrefabTform: Node | null = null;

  public reset(): void {
    this.symbolEx = null;
    this.offClippingTform = null;
    this.symbolUpperLayerPrefabTform = null;
    this.wheelStopAnimaPrefabTform = null;
    this.symbolStopLoopAnimaPrefabTform = null;
    this.bingoAnimaPrefabTform = null;
  }

  public haveUpperPrefabTform(): boolean {
    if (this.symbolUpperLayerPrefabTform !== null) {
      return true;
    }
    return false;
  }

  public haveAnimaPrefabTform(): boolean {
    if (
      this.wheelStopAnimaPrefabTform !== null ||
      this.symbolStopLoopAnimaPrefabTform !== null ||
      this.bingoAnimaPrefabTform !== null
    ) {
      return true;
    }
    return false;
  }

  public activeSelf(): boolean {
    if (this.symbolEx !== null || this.offClippingTform !== null) {
      return true;
    }
    return false;
  }

  public getDisplayNode(): Node {
    let displayNode: Node = null;
    if (this.offClippingTform !== null) {
      displayNode = this.offClippingTform;
    } else if (this.symbolEx !== null) {
      displayNode = this.symbolEx.node;
    }
    return displayNode;
  }
}

@ccclass('AnimaPrefabArgs')
export class AnimaPrefabArgs {
  @property(Prefab)
  public animaPrefabTform: Prefab | null = null;
  @property(CCString)
  public audioKey = '';
  @property({displayName: '動畫名稱'})
  public animationName = '';
  @property({displayName: '是否使用 Spine'})
  public isSpine = false;
  @property({displayName: '是否要Loop'})
  public isLoop = true;
}

@ccclass('SymbolShowSetting')
export class SymbolShowSetting {
  @property(CCInteger)
  public symbolID = 0;
  @property(CCBoolean)
  public offClipping = false;
  @property(CCBoolean)
  public showShiny = false;
  @property(CCBoolean)
  public showWheelStop = false;
  @property(CCBoolean)
  public showLoop = false;
  @property(CCBoolean)
  public showBingo = false;

  @property({
    type: Prefab,
    displayName: '閃白張物件',
    visible: function (this: SymbolShowSetting) {
      return this.showShiny;
    },
  })
  public symbolShinyPrefabTform: Prefab | null = null;

  @property({
    type: AnimaPrefabArgs,
    displayName: '停輪動畫',
    visible: function (this: SymbolShowSetting) {
      return this.showWheelStop;
    },
  })
  public wheelStopAnimaPrefabArgs: AnimaPrefabArgs = new AnimaPrefabArgs();

  @property({
    type: AnimaPrefabArgs,
    displayName: 'Loop動畫',
    visible: function (this: SymbolShowSetting) {
      return this.showLoop;
    },
  })
  public symbolStopLoopAnimaPrefabArgs: AnimaPrefabArgs = new AnimaPrefabArgs();

  @property({
    type: AnimaPrefabArgs,
    displayName: 'Bingo動畫',
    visible: function (this: SymbolShowSetting) {
      return this.showBingo;
    },
  })
  public bingoAnimaPrefabArgs: AnimaPrefabArgs = new AnimaPrefabArgs();

  @property({type: CCFloat, displayName: '圖層(數字大在上面)'})
  public sortIndex = 0;

  public animaLayer: Node | null = null;
  public offClippingLayer: Node | null = null;
}
