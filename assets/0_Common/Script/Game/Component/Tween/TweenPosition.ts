import {
  _decorator,
  Component,
  Vec3,
  Enum,
  CCFloat,
  Tween,
  type Node,
  tween,
  v3,
} from 'cc';
const {ccclass, property, menu} = _decorator;

export enum PlayStyle {
  ONCE,
  LOOP,
  PINGPONG,
}

@ccclass('TweenPosition')
@menu('0_Common/Game/Component/Tween/TweenPosition')
export default class TweenPosition extends Component {
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
  private _tween: Tween<Node> | null = null;
  protected start(): void {
    this.node.position = this.from;
    if (this.playStyle === PlayStyle.ONCE) {
      this._tween = tween(this.node)
        .delay(this.startDelay)
        .to(this.duration, {position: this.to})
        .start();
    } else if (this.playStyle === PlayStyle.LOOP) {
      this._tween = tween(this.node)
        .repeatForever(
          tween(this.node)
            .delay(this.startDelay)
            .to(this.duration, {position: this.to})
            .to(0, {position: this.from})
        )
        .start();
    } else if (this.playStyle === PlayStyle.PINGPONG) {
      this._tween = tween(this.node)
        .repeatForever(
          tween(this.node)
            .delay(this.startDelay)
            .to(this.duration, {position: this.to})
            .to(this.duration, {position: this.from})
        )
        .start();
    }
  }
  public stop() {
    if (this._tween !== null) this._tween.stop();
  }
  public play() {
    if (this._tween !== null) this._tween.start();
  }
}
