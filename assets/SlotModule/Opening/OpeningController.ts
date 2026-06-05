import {
  _decorator,
  Component,
  sp,
  CCString,
  CCFloat,
  UIOpacity,
  tween,
  Node,
} from 'cc';
import PlatformEventNotifier from '../../CommonModule/Script/Utility/PlatformEventNotifier';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {SlotGDK} from '../Define/SlotGDK';

const {ccclass, property} = _decorator;

@ccclass('OpeningController')
export class OpeningController extends Component {
  @property(sp.Skeleton)
  protected openingSpine: sp.Skeleton = null;

  @property(CCString)
  protected animName = '';

  @property(CCString)
  protected audioName = '';

  @property(Node)
  protected skipBtn: Node = null;

  @property(CCFloat)
  protected skipBtnHideWaitTime = 0;

  @property(CCFloat)
  protected closeOpeningWaitTime = -1;

  protected eventBeforeSkipOpening: Delegate = new Delegate();

  protected audioID = -1;
  protected isSkip = false;

  public async showOpening() {
    SlotGDK.instance.eventOnOpeningStart.notify();
    PlatformEventNotifier.showAllUI(false);
    SlotGameMediator.instance.mainGameHost.setMainGameBGMPause();

    if (this.audioName !== '')
      this.audioID = SlotGameMediator.instance.audioManager.play(
        this.audioName
      );

    PlatformEventNotifier.showAllUI(false);
    this.openingSpine.node.active = true;
    this.openingSpine.setCompleteListener(null);
    this.openingSpine.setAnimation(0, this.animName, false);

    if (this.closeOpeningWaitTime > 0) {
      this.scheduleOnce(() => {
        this.skipOpening();
      }, this.closeOpeningWaitTime);
    } else {
      this.openingSpine.setCompleteListener(() => {
        this.skipOpening();
      });
    }

    // 開始播放動畫後等待多久隱藏Skip按鈕
    this.scheduleOnce(() => {
      if (this.isSkip) return;
      this.skipBtn.active = false;
    }, this.skipBtnHideWaitTime);
  }

  // override func, call from skip btn
  public skipOpening() {
    if (this.isSkip) return;

    if (this.eventBeforeSkipOpening.length > 0) {
      this.eventBeforeSkipOpening.notify();
    }

    this.skipBtn.active = false;

    this.isSkip = true;
    SlotGameMediator.instance.audioManager.stop(this.audioID);
    SlotGameMediator.instance.mainGameHost.playMainGameBGM();

    tween(this.openingSpine.node.getComponent(UIOpacity))
      .to(0.3, {opacity: 0})
      .call(() => {
        this.openingSpine.node.active = false;
        SlotGDK.instance.eventOnOpeningFinished.notify();
        PlatformEventNotifier.showAllUI(true);
      })
      .start();
  }
}
