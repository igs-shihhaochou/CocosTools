import {Node, SpriteFrame, Vec2} from 'cc';

export class DropSymbolNodeMember {
  public showSymbolNode: Node | null = null;
  public spriteFrame: SpriteFrame | null = null;
  public originalPosition: Vec2 = Vec2.ZERO; //在盤面上原先的位置
  public endPosition: Vec2 = Vec2.ZERO; //要前往的位置
}
