import {_decorator, Component, Enum, CCFloat, tween, Vec3, v3} from 'cc';
const {ccclass, property, menu} = _decorator;

export enum PlayStyle {
  ONCE,
  LOOP,
  PINGPONG,
}

@ccclass('TweenScale')
@menu('0_Common/Game/Component/Tween/TweenScale')
export default class TweenScale extends Component {
  @property(Vec3)
  private from: Vec3 = v3(0, 0, 0);
  @property(Vec3)
  private to: Vec3 = v3(0, 0, 0);
  @property({type: Enum(PlayStyle)})
  private playStyle: PlayStyle = PlayStyle.ONCE;
  @property(CCFloat)
  private duration = 1;
  @property(CCFloat)
  private startDelay = 0;

  protected start(): void {
    this.node.setScale(this.from);
    if (this.playStyle === PlayStyle.ONCE) {
      tween(this.node)
        .delay(this.startDelay)
        .to(this.duration, {
          scale: new Vec3(this.to.x, this.to.y, this.to.z),
        })
        .start();
    } else if (this.playStyle === PlayStyle.LOOP) {
      tween(this.node)
        .repeatForever(
          tween(this.node)
            .delay(this.startDelay)
            .to(this.duration, {
              scale: new Vec3(this.to.x, this.to.y, this.to.z),
            })
            .to(this.duration, {
              scale: new Vec3(this.from.x, this.from.y, this.from.z),
            })
        )
        .start();
    } else if (this.playStyle === PlayStyle.PINGPONG) {
      tween(this.node)
        .repeatForever(
          tween(this.node)
            .delay(this.startDelay)
            .to(this.duration, {
              scale: new Vec3(this.to.x, this.to.y, this.to.z),
            })
            .to(this.duration, {
              scale: new Vec3(this.from.x, this.from.y, this.from.z),
            })
        )
        .start();
    }
  }
}
