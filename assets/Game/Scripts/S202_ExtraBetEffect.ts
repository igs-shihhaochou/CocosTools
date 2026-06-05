import {_decorator, Component, sp} from 'cc';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
const {ccclass, property} = _decorator;

@ccclass('S202_ExtraBetEffect')
export class S202_ExtraBetEffect extends Component {
  @property(sp.Skeleton)
  private extraBetEffectSkeleton: sp.Skeleton = null;

  protected onLoad(): void {
    SlotGDK.instance.eventClickExtraBet.insert(this.activeExtraBetBtn, this);
  }
  protected onDestroy(): void {
    SlotGDK.instance.eventClickExtraBet.remove(this.activeExtraBetBtn, this);
  }

  protected start(): void {
    this.extraBetEffectSkeleton.setToSetupPose();
    this.extraBetEffectSkeleton.node.active = false;
  }

  private activeExtraBetBtn(isActive: boolean): void {
    if (isActive) {
      this.extraBetEffectSkeleton.clearTracks();
      this.extraBetEffectSkeleton.node.active = true;
      this.extraBetEffectSkeleton.addAnimation(0, 'Loop', false);
      this.extraBetEffectSkeleton.setCompleteListener(() => {
        this.extraBetEffectSkeleton.node.active = false;
      });
    } else {
      this.extraBetEffectSkeleton.node.active = false;
    }
  }
}
