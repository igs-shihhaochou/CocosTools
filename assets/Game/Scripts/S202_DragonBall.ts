import {_decorator, Component, Font, Label, Sprite, SpriteFrame, sp} from 'cc';
import {DragonBallColor} from './Define';
const {ccclass, property} = _decorator;

@ccclass('S202_DragonBall')
export class S202_DragonBall extends Component {
  @property(Boolean)
  public isMain: boolean = false;
  @property([SpriteFrame])
  private spriteFrameList: SpriteFrame[] = [];
  @property([Font])
  private fontList: Font[] = [];
  @property(Label)
  private label: Label = null;
  @property(Sprite)
  private sprite: Sprite = null;

  @property(sp.Skeleton)
  private multipleEffectSkeleton: sp.Skeleton = null;

  public multiple: number = 0;

  public init(): void {
    this.label.string = '1x';
    this.multiple = 0;
  }

  public setDragonBall(multiPle: number): void {
    const colorIdx = this.getColorIdx(multiPle);
    this.label.font = this.fontList[colorIdx];
    this.sprite.spriteFrame = this.spriteFrameList[colorIdx];
    this.label.string = multiPle.toString() + 'x';
    this.multiple = multiPle;
  }

  private getColorIdx(multiple: number): DragonBallColor {
    if (multiple > 10) return DragonBallColor.Purple;
    else if (multiple > 5) return DragonBallColor.Green;
    else return DragonBallColor.Brown;
  }

  public setMainBall(multiple: number, isFreeGame: boolean): void {
    this.isMain = true;
    if (isFreeGame) {
      this.label.font = this.fontList[DragonBallColor.Gold];
      this.sprite.spriteFrame = this.spriteFrameList[DragonBallColor.Gold];
    } else {
      this.label.font = this.fontList[DragonBallColor.Blue];
      this.sprite.spriteFrame = this.spriteFrameList[DragonBallColor.Blue];
    }
    this.label.string = multiple.toString() + 'x';
    this.multiple = multiple;
  }

  public showMultipleEffect(): void {
    this.multipleEffectSkeleton.node.active = true;
    this.multipleEffectSkeleton.clearTracks();
    this.multipleEffectSkeleton.setAnimation(0, 'SingleLight_In', false);
    this.multipleEffectSkeleton.setCompleteListener(() => {
      this.multipleEffectSkeleton.setCompleteListener(null);
      this.multipleEffectSkeleton.setAnimation(0, 'SingleLight_Loop', true);
    });
  }

  public hideMultipleEffect(): void {
    this.multipleEffectSkeleton.clearTracks();
    this.multipleEffectSkeleton.setAnimation(0, 'SingleLight_Out', false);
    this.multipleEffectSkeleton.setCompleteListener(() => {
      this.multipleEffectSkeleton.setCompleteListener(null);
      this.multipleEffectSkeleton.node.active = false;
    });
  }
}
