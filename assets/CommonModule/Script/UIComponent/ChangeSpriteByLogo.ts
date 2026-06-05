import {_decorator, CCString, SpriteFrame, Component, Sprite} from 'cc';
const {ccclass, property} = _decorator;

import {PlatformData} from '../Define/PlatformData';

@ccclass('ChangeSpriteByLogo')
export class ChangeSpriteSetting {
  @property(CCString)
  public logo = '';
  @property(SpriteFrame)
  public spriteFrame: SpriteFrame = null;
}

export default class ChangeSpriteByLogo extends Component {
  @property(Sprite)
  private sprite: Sprite | null = null;
  @property([ChangeSpriteSetting])
  private settingList: Array<ChangeSpriteSetting> =
    new Array<ChangeSpriteSetting>();
  private defaultSpriteFrame: SpriteFrame | null = null;
  protected onLoad(): void {
    if (this.sprite === null) {
      this.sprite = this.node.getComponent(Sprite);
    }

    this.defaultSpriteFrame = this.sprite.spriteFrame;
  }
  protected start(): void {
    this.ChangeSprite();
  }
  private ChangeSprite() {
    let tempSpriteFrame: SpriteFrame = this.defaultSpriteFrame;
    for (let i = 0; i < this.settingList.length; i++) {
      if (this.settingList[i].logo === PlatformData.logo) {
        tempSpriteFrame = this.settingList[i].spriteFrame;
        break;
      }
    }
    this.sprite.spriteFrame = tempSpriteFrame;
  }
}
