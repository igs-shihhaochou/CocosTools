import {_decorator, Component, Tween, tween, v3, Vec3} from 'cc';

const {ccclass} = _decorator;

@ccclass
export default class ShakeNode extends Component {
  private posOri: Vec3 = Vec3.ZERO;
  private shakeTween: Tween<unknown> = null;
  private stopTween: Tween<unknown> = null;

  public shake(distance = 5, duration = 0.25) {
    const unitDuration = duration * 0.25;
    this.posOri = new Vec3(this.node.position.x, this.node.position.y, 0);

    this.shakeTween = tween(this.node)
      .to(unitDuration, {position: v3(this.posOri.x + distance, this.posOri.y + distance, 0)})
      .to(unitDuration, {position: v3(this.posOri.x - distance, this.posOri.y - distance, 0)})
      .to(unitDuration, {position: v3(this.posOri.x + distance, this.posOri.y - distance, 0)})
      .to(unitDuration, {position: v3(this.posOri.x - distance, this.posOri.y + distance, 0)})
      .union()
      .repeatForever()
      .start();
  }

  public stop(onComplete?: () => void) {
    if (this.shakeTween) {
      this.shakeTween.stop();
      this.shakeTween = null;
    }
    if (this.stopTween) {
      this.stopTween.stop();
    }
    this.stopTween = tween(this.node)
      .to(0.1, {position: v3(this.posOri.x, this.posOri.y, 0)})
      .call(() => {
        if (onComplete) onComplete();
      })
      .start();
  }
}
