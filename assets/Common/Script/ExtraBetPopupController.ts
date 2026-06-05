import {_decorator, Component, Animation, AnimationClip} from 'cc';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
const {ccclass, property} = _decorator;

@ccclass('ExtraBetPopupController')
export default class ExtraBetPopupController extends Component {
  @property(Animation)
  private extraBetPopupAnimation: Animation | null = null;
  //放入客製化AnimationClip
  @property(AnimationClip)
  private gamePopupAnimationClip: AnimationClip | null = null;
  public onDestroy(): void {
    SlotGDK.instance.eventShowExtraBetPopup.remove(
      this.ShowExtraBetPopup,
      this
    );
  }
  start() {
    SlotGDK.instance.eventShowExtraBetPopup.insert(
      this.ShowExtraBetPopup,
      this
    );
  }
  private OnClickActiveButton() {
    PlatformData.instance.isExtraBet = true;
    if (SlotGDK.instance.eventClickExtraBet.length > 0) {
      SlotGDK.instance.eventClickExtraBet.notify(true);
    }
    this.extraBetPopupAnimation.node.active = false;
  }
  private OnClickCloseButton() {
    this.extraBetPopupAnimation.node.active = false;
  }
  //播放ExtraBetPopup出現動畫
  private ShowExtraBetPopup() {
    this.extraBetPopupAnimation.node.active = true;
    const appearClip = this.extraBetPopupAnimation.clips.find(
      clip => clip.name === 'Ani_ExtraBetPopup_Appear'
    );
    const appearDuration: number = appearClip ? appearClip.duration : 0;
    let gameTipDuration = 0;
    this.extraBetPopupAnimation.play('Ani_ExtraBetPopup_Appear');
    if (this.gamePopupAnimationClip !== null) {
      this.extraBetPopupAnimation.addClip(
        this.gamePopupAnimationClip,
        this.gamePopupAnimationClip.name
      );
      this.scheduleOnce(() => {
        this.extraBetPopupAnimation.play(this.gamePopupAnimationClip.name);
      }, appearDuration + 0.1);
      gameTipDuration = this.gamePopupAnimationClip.duration;
    }
    this.scheduleOnce(
      () => {
        this.extraBetPopupAnimation.play('Ani_ExtraBetPopup_ShowButton');
      },
      appearDuration + 0.1 + gameTipDuration + 0.1
    );
  }
}
