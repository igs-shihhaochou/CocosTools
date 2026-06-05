import {_decorator, Component, Prefab, Node, Animation} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import Functions from '../../CommonModule/Script/Utility/Functions';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';

const {ccclass, property} = _decorator;

@ccclass
export class WheelEffectController extends Component {
  @property(SpawnPool)
  protected wheelEffectPool: SpawnPool = null;

  @property(Prefab)
  public wheelLightSweep_Landscape: Prefab = null;

  @property(Prefab)
  public wheelLightSweep_Portrait: Prefab = null;

  private defaultHideTime = 5;

  onLoad() {
    SlotGDK.instance.eventPlayBuyBonusEffect.insert(
      this.PlayWheelLightSweep,
      this
    );
  }

  onDestroy() {
    SlotGDK.instance.eventPlayBuyBonusEffect.remove(
      this.PlayWheelLightSweep,
      this
    );
  }

  /** 播放盤面掃光特效 */
  public async PlayWheelLightSweep(callBack: Function = null) {
    let wheelLightSweepNode: Node = null;
    if (PlatformData.isLandscape) {
      wheelLightSweepNode = this.wheelEffectPool.spawn(
        this.wheelLightSweep_Landscape.data
      );
    } else {
      wheelLightSweepNode = this.wheelEffectPool.spawn(
        this.wheelLightSweep_Portrait.data
      );
    }
    wheelLightSweepNode.parent = this.node;
    wheelLightSweepNode.active = true;

    let animationTime: number =
      wheelLightSweepNode.getComponent(Animation).defaultClip.duration;
    if (Functions.isNullOrEmpty(animationTime))
      animationTime = this.defaultHideTime;

    //動畫結束後清除節點
    this.scheduleOnce(() => {
      this.HideEffect(wheelLightSweepNode);
    }, animationTime);

    await waitForSeconds(animationTime);

    if (callBack) {
      callBack();
    }
  }

  /** 隱藏特效 */
  public HideEffect(node: Node) {
    this.wheelEffectPool.despawn(node);
  }

  /** 隱藏所有特效 */
  public HideAllEffect() {
    this.wheelEffectPool.despawnAll();
  }
}
