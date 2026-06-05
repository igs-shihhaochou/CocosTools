import {_decorator, Component, Node, sp} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('S202_PrewinAnim')
export class S202_PrewinAnim extends Component {
  @property(sp.Skeleton)
  private prewinSkeleton: sp.Skeleton = null;

  public playAnimation(): void {
    this.node.active = true;
    this.prewinSkeleton.setAnimation(0, 'In', false);
    this.prewinSkeleton.addAnimation(0, 'Loop', true);
  }

  public playOutAnimation(): void {
    if (!this.node.active) return;
    this.prewinSkeleton.setAnimation(0, 'Out', false);
    this.prewinSkeleton.setCompleteListener(() => {
      this.prewinSkeleton.setCompleteListener(null);
      this.node.active = false;
    });
  }
}
