import {_decorator, CCString, Component, SpriteAtlas, SpriteFrame} from 'cc';
const {ccclass, property} = _decorator;
@ccclass('LoadingSymbolMap')
class LoadingSymbolMap {
  @property(CCString)
  public symbolName = '';
  @property(SpriteFrame)
  public symbolSprite: SpriteFrame = null;
}

@ccclass('LoadingSymbolMapper')
export class LoadingSymbolMapper extends Component {
  @property([LoadingSymbolMap])
  private symbolMapList: LoadingSymbolMap[] = [];

  public spriteAtlas: SpriteAtlas = null;

  protected onLoad(): void {
    this.spriteAtlas = new SpriteAtlas();
    this.symbolMapList.forEach(symbolMap => {
      this.spriteAtlas.spriteFrames[symbolMap.symbolName] =
        symbolMap.symbolSprite;
    });
  }
}
