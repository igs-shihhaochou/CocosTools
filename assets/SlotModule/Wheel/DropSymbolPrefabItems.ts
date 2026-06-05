import {_decorator, Prefab, Node, Sprite, Enum, CCFloat} from 'cc';
import {Symbol} from './Symbol';
import {EnumAnimaType} from './DropModule';

const {ccclass, property} = _decorator;

/** 播放的相關設定 */
@ccclass('DropAnimaPrefabArgs')
export class DropAnimaPrefabArgs {
  init(type: EnumAnimaType = EnumAnimaType.EnumWheelStop): DropAnimaPrefabArgs {
    this.type = type;
    return this;
  }
  @property({type: Enum(EnumAnimaType), displayName: '動畫類型'})
  public type: EnumAnimaType = EnumAnimaType.EnumWheelStop;
  @property({type: Prefab, displayName: 'Prefab'})
  public prefab: Prefab | null = null;
  @property({displayName: '音效'})
  public audioKey = '';
  @property({displayName: '是否隱藏 Symbol'})
  public hideSymbol = true;
  @property({displayName: '動畫名'})
  public animName = '';
}

@ccclass('DropSymbolShowSetting')
export class DropSymbolShowSetting {
  @property({type: CCFloat, tooltip: '要設定動畫的SymbolID'})
  public symbolID = 0;
  @property({tooltip: '是否需要複製該symbol圖片壓在上層'})
  public isOffClipping = false;
  @property({type: Prefab, tooltip: 'Symbol閃白張的Prefab'})
  public shinyAnim: Prefab | null = null;
  @property({type: CCFloat, displayName: '停輪動畫時長'})
  public stopAnimaDuration = 0.2;
  @property({type: DropAnimaPrefabArgs, displayName: '停輪動畫的資訊'})
  public stopAnima: DropAnimaPrefabArgs = new DropAnimaPrefabArgs().init(
    EnumAnimaType.EnumWheelStop
  );
  @property({type: DropAnimaPrefabArgs, displayName: '停輪 LOOP 動畫的資訊'})
  public stopLoopAnima: DropAnimaPrefabArgs = new DropAnimaPrefabArgs().init(
    EnumAnimaType.EnumWheelStopLoop
  );
  @property({type: DropAnimaPrefabArgs, displayName: '中獎動畫的資訊'})
  public bingoAnima: DropAnimaPrefabArgs = new DropAnimaPrefabArgs().init(
    EnumAnimaType.EnumBingo
  );
  @property({type: DropAnimaPrefabArgs, displayName: '消失動畫的資訊'})
  public splitAnima: DropAnimaPrefabArgs = new DropAnimaPrefabArgs().init(
    EnumAnimaType.EnumSplit
  );
  @property({type: CCFloat, displayName: '圖層(數字大在上面)'})
  public sortIndex = 0;
  public animaLayer: Node | null = null;
  public offClippingLayer: Node | null = null;
  public getArgs(type: EnumAnimaType): DropAnimaPrefabArgs {
    switch (type) {
      case EnumAnimaType.EnumWheelStop:
        return this.stopAnima;
      case EnumAnimaType.EnumWheelStopLoop:
        return this.stopLoopAnima;
      case EnumAnimaType.EnumBingo:
        return this.bingoAnima;
      case EnumAnimaType.EnumSplit:
        return this.splitAnima;
    }
  }
}

/** Symbol表演相關資訊 */
@ccclass('DropSymbolShowInfo')
export class DropSymbolShowInfo {
  public type: EnumAnimaType = EnumAnimaType.EnumWheelStop;
  public symbol: Symbol = null;
  public offClipping: Sprite | null = null;
  public anim: Node | null = null;
  public reset(): void {
    this.symbol = null;
    this.offClipping = null;
  }
  public haveAnima(): boolean {
    if (this.anim) {
      return true;
    }
    return false;
  }
  public activeSelf(): boolean {
    if (this.symbol || this.offClipping) {
      return true;
    }
    return false;
  }
  /** 檢查是否有上層節點,沒有的話回傳symbol節點 */
  public getDisplayNode(): Node {
    let displayNode: Node | null = null;
    if (this.offClipping) {
      displayNode = this.offClipping.node;
    } else if (this.symbol) {
      displayNode = this.symbol.node;
    }
    return displayNode;
  }
  /** 檢查是否有上層節點,沒有的話呼叫 symbol 節點 */
  public set active(active: boolean) {
    if (this.offClipping) {
      this.offClipping.node.active = active;
    } else if (this.symbol) {
      if (active) {
        this.symbol.show();
      } else {
        this.symbol.hide();
      }
    }
  }
}
