import {_decorator, Component, sp} from 'cc';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
const {ccclass, property} = _decorator;

@ccclass('S202_WheelSpotlightCtrl')
export class S202_WheelSpotlightCtrl extends Component {
  @property([sp.Skeleton])
  private spotlightSkeleton: sp.Skeleton[] = [];

  onLoad(): void {
    SlotGDK.instance.receiveFeverData.insert(this.onFeverData, this);
  }

  protected onDestroy(): void {
    SlotGDK.instance.receiveFeverData.remove(this.onFeverData, this);
  }

  protected start(): void {
    this.init();
  }

  private onFeverData(rawData: JSON): void {
    const goldenCols = this.extractGoldenCols(rawData);

    for (let i = 0; i < goldenCols.length; i++) {
      this.showSpotlight(goldenCols[i]);
    }
  }

  private extractGoldenCols(rawData: JSON): number[] {
    const goldenCols = rawData?.['data']?.['sg_map']?.['golden_cols'];
    if (!Array.isArray(goldenCols)) return [];
    return goldenCols;
  }

  public init(): void {
    for (let i = 0; i < this.spotlightSkeleton.length; i++) {
      this.spotlightSkeleton[i].setToSetupPose();
      this.spotlightSkeleton[i].node.active = false;
    }
  }

  public showSpotlight(index: number): void {
    this.spotlightSkeleton[index].node.active = true;
    this.spotlightSkeleton[index].timeScale = 1.5;
    this.spotlightSkeleton[index].setAnimation(0, 'IN', false);
    this.spotlightSkeleton[index].addAnimation(0, 'LOOP', false);
    this.spotlightSkeleton[index].addAnimation(0, 'OUT', false);
    this.spotlightSkeleton[index].setCompleteListener(
      (trackEntry: sp.spine.TrackEntry) => {
        if (trackEntry?.animation?.name !== 'OUT') return;
        this.spotlightSkeleton[index].setCompleteListener(null);
        this.hideSpotlight(index);
      }
    );
  }

  public hideSpotlight(index: number): void {
    this.spotlightSkeleton[index].node.active = false;
  }
}
