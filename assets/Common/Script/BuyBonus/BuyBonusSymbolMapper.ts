import {_decorator, CCString, Component, SpriteAtlas, SpriteFrame} from 'cc';
const {ccclass, property} = _decorator;
@ccclass('BuyBonusSymbolMap')
class BuyBonusSymbolMap {
  @property(CCString)
  public symbolName = '';
  @property(SpriteFrame)
  public symbolSprite: SpriteFrame = null;
}

@ccclass('BuyBonusSymbolMapper')
export class BuyBonusSymbolMapper extends Component {
  @property([BuyBonusSymbolMap])
  private symbolMapList: BuyBonusSymbolMap[] = [];

  public spriteAtlas: SpriteAtlas = null;

  protected onLoad(): void {
    this.spriteAtlas = new SpriteAtlas();
    this.symbolMapList.forEach(symbolMap => {
      this.spriteAtlas.spriteFrames[symbolMap.symbolName] =
        symbolMap.symbolSprite;
    });
  }
}
