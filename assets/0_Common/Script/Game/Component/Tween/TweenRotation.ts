import {_decorator, Component, CCInteger, Enum, CCFloat, tween} from 'cc';
const {ccclass, property, menu} = _decorator;

export enum PlayStyle {
  ONCE,
  LOOP,
  PINGPONG,
}

@ccclass('TweenRotation')
@menu('0_Common/Game/Component/Tween/TweenRotation')
export default class TweenRotation extends Component {
  @property(CCInteger)
  private from = 0;
  @property(CCInteger)
  private to = 0;
  @property({type: Enum(PlayStyle)})
  private playStyle: PlayStyle = PlayStyle.ONCE;
  @property(CCFloat)
  private duration = 1;
  @property(CCFloat)
  private startDelay = 0;
  protected start(): void {
    this.node.angle = this.from;
    if (this.playStyle === PlayStyle.ONCE) {
      tween(this.node)
        .delay(this.startDelay)
        .to(this.duration, {angle: this.to})
        .start();
    } else if (this.playStyle === PlayStyle.LOOP) {
      tween(this.node)
        .repeatForever(
          tween(this.node)
            .delay(this.startDelay)
            .to(this.duration, {angle: this.to})
            .to(0, {angle: this.from})
        )
        .start();
    } else if (this.playStyle === PlayStyle.PINGPONG) {
      tween(this.node)
        .repeatForever(
          tween(this.node)
            .delay(this.startDelay)
            .to(this.duration, {angle: this.to})
            .to(this.duration, {angle: this.from})
        )
        .start();
    }
  }
}
