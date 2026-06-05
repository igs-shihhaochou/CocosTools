import {_decorator, CCFloat, Component, Sprite, SpriteFrame} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('BuyBonusSpriteAnim')
export class BuyBonusSpriteAnim extends Component {
  @property([SpriteFrame])
  public animFrames: SpriteFrame[] = [];
  @property(Sprite)
  public targetSprite: Sprite = null;
  @property(CCFloat)
  public timeFreame = 1;

  private index = 0;
  private isPlaying = false;
  private promise: Promise<void> = null;
  protected onEnable(): void {
    this.index = 0;
    this.isPlaying = true;
    this.playSpriteAnim();
  }
  protected onDisable(): void {
    this.isPlaying = false;
    this.unscheduleAllCallbacks();
  }

  private playSpriteAnim() {
    if (this.isPlaying === false) return;

    this.targetSprite.spriteFrame = this.animFrames[this.index];
    this.index++;
    if (this.index >= this.animFrames.length) {
      this.index = 0;
    }

    this.scheduleOnce(() => {
      this.checkPlayNext();
    }, this.timeFreame);
  }
  private checkPlayNext() {
    if (this.isPlaying) {
      this.playSpriteAnim();
    }
  }
}
