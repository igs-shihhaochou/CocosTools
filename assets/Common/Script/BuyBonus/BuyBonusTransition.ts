import {_decorator, BlockInputEvents, Component, sp, Node, CCString} from 'cc';
import {SlotGDK} from '../../../SlotModule/Define/SlotGDK';
import {SlotGameMediator} from '../../../SlotModule/Define/SlotGameMediator';
import {waitForSeconds} from '../../../CommonModule/Script/ExtraType';
import {setOpacity} from '../../../CommonModule/Script/Utility/NodeProperty';

const {ccclass, property} = _decorator;

const TransitionAnimationName = 'BuyBonus_Transition';

@ccclass
export default class BuyBonusTransition extends Component {
  /** 轉場動畫根節點，如無設定則設為此腳本的節點 */
  @property(Node)
  protected root: Node = null;

  /** 轉場動畫Spine */
  @property(sp.Skeleton)
  protected spine: sp.Skeleton = null;

  /** 阻擋輸入事件 */
  @property(BlockInputEvents)
  protected blockInputEvents: BlockInputEvents = null;

  /** 音效名稱 */
  @property(CCString)
  protected audioName = '';

  protected onLoad(): void {
    if (!this.root) {
      this.root = this.node;
    }
    setOpacity(this.root, 0);
    this.blockInputEvents.enabled = false;
    SlotGDK.instance.eventPlayBuyBonusEffect.insert(
      this.PlayBuyBonusTransition,
      this
    );
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventPlayBuyBonusEffect.remove(
      this.PlayBuyBonusTransition,
      this
    );
  }

  /** 播放轉場動畫 */
  protected async PlayBuyBonusTransition(callBack: Function = null) {
    setOpacity(this.root, 255);
    this.blockInputEvents.enabled = true;
    this.spine.setAnimation(0, TransitionAnimationName, false);
    if (this.audioName !== '') {
      SlotGameMediator.instance.audioManager.play(this.audioName, false, 1);
    }

    const animationDuration: number =
      this.spine.getCurrent(0).animation.duration;
    await waitForSeconds(animationDuration);
    this.onFinished();

    if (callBack) {
      callBack();
    }
  }

  /** 轉場動畫結束，隱藏節點 */
  protected onFinished() {
    this.blockInputEvents.enabled = false;
    setOpacity(this.root, 0);
  }
}
