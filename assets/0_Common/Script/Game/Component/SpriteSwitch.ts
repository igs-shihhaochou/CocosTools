import {_decorator, Component, Sprite, SpriteFrame} from 'cc';
const {ccclass, property, menu} = _decorator;

// /** 預設Sprite狀態列舉 */
export enum SpriteState {
  STATE_0,
  STATE_1,
  STATE_2,
  STATE_3,
  STATE_4,
  STATE_5,
  STATE_6,
  STATE_7,
  STATE_8,
  STATE_9,
}
// /**
//  * Sprite切換組件
//  * 供Sprite依自定義狀態切換至對應的主副Sprite
//  */

@ccclass('SpriteSwitch')
@menu('0_Common/Game/Component/SpriteSwitch')
export default class SpriteSwitch extends Component {
  /** 主Sprite */
  @property(Sprite)
  private mainSprite: Sprite | null = null;
  /** 副Sprite */
  @property(Sprite)
  private subSprite: Sprite | null = null;
  /** 主SpriteFrame */
  @property([SpriteFrame])
  private mainSpriteFrame: SpriteFrame[] = [];
  /** 副SpriteFrame */
  @property([SpriteFrame])
  private subSpriteFrame: SpriteFrame[] = [];
  /**
   * 變更Sprite狀態 切換SpriteFrame
   * @param state
   */
  public changeState(state: SpriteState) {
    if (this.mainSprite)
      this.mainSprite.spriteFrame = this.mainSpriteFrame[state];
    if (this.subSprite) this.subSprite.spriteFrame = this.subSpriteFrame[state];
  }
  /**
   * 主副Sprite交換
   */
  public mainSubSwitch() {
    let tempSprite: Sprite = this.mainSprite;
    this.mainSprite = this.subSprite;
    this.subSprite = tempSprite;
    tempSprite = null;
  }
  /**
   * 取得主Sprite
   */
  public getMainSprite(): Sprite {
    return this.mainSprite;
  }
  /**
   * 取得副Sprite
   */
  public getSubSprite(): Sprite {
    return this.subSprite;
  }
}
