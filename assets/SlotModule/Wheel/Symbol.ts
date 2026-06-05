import {_decorator, Component, Sprite} from 'cc';
const {ccclass} = _decorator;

import {SymbolInfomation} from '../Define/SlotGameData';
import {SlotGameMediator} from '../Define/SlotGameMediator';

@ccclass('Symbol')
export class Symbol extends Component {
  symbolIndex: number = undefined;
  symbolInfo: SymbolInfomation = null;
  sprite: Sprite = null;
  /// <summary>
  /// 用來重設symbol圖層高度的最初參數
  /// </summary>
  originalOrderInLayer = 0;
  protected onLoad(): void {
    this.sprite = this.getComponent(Sprite);
  }
  public changeSymbol(_info: SymbolInfomation) {
    if (!_info) {
      console.log('ChangeSymbol Info Is Null');
      return;
    }

    this.symbolInfo = _info;
    this.sprite.spriteFrame =
      SlotGameMediator.instance.symbolSetting.getSpriteFramebyIndex(
        this.symbolInfo.spriteIndex
      );
  }
  public show(): void {
    this.node.active = true;
  }
  public hide(): void {
    this.node.active = false;
  }
  public getActive(): boolean {
    return this.node.active;
  }
}
