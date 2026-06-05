import {
  _decorator,
  CCFloat,
  CCString,
  Component,
  SpriteAtlas,
  SpriteFrame,
} from 'cc';
const {ccclass, property} = _decorator;
@ccclass('GameNameSymbolMap')
class GameNameSymbolMap {
  @property(CCString)
  public symbolName = '';
  @property(SpriteFrame)
  public symbolSprite: SpriteFrame = null;
  @property(CCFloat)
  public customScale = 1.0;
}

@ccclass('GameNameSymbolMapper')
export class GameNameSymbolMapper extends Component {
  @property([GameNameSymbolMap])
  private symbolMapList: GameNameSymbolMap[] = [];

  public spriteAtlas: SpriteAtlas = null;

  public getCustomScale(symbolName: string): number {
    const symbolMap = this.symbolMapList.find(
      symbolMap => symbolMap.symbolName === symbolName
    );
    return symbolMap.customScale;
  }

  public getSymbolHeightRatio(symbolName: string): number {
    const symbolMap = this.symbolMapList.find(
      symbolMap => symbolMap.symbolName === symbolName
    );
    return (
      (symbolMap.symbolSprite.originalSize.height /
        symbolMap.symbolSprite.originalSize.width) *
      symbolMap.customScale
    );
  }

  protected onLoad(): void {
    console.log('[GameNameSymbolMapper]', this.symbolMapList);
    this.spriteAtlas = new SpriteAtlas();
    this.symbolMapList.forEach(symbolMap => {
      this.spriteAtlas.spriteFrames[symbolMap.symbolName] =
        symbolMap.symbolSprite;
    });
  }
}
