import {_decorator, Component, Node, Vec3} from 'cc';
import {
  getNodeSpaceAR,
  getWorldSpaceAR,
} from '../../../CommonModule/Script/Utility/NodeProperty';
import {SlotGDK} from '../../../SlotModule/Define/SlotGDK';

const {ccclass, property} = _decorator;

@ccclass
export default class BuyBonusInGameJp extends Component {
  @property(Node)
  private jpRoot: Node = null;

  @property(Node)
  private originalJpParentNode: Node = null;

  private oriPos: Vec3 = Vec3.ZERO;

  onLoad() {
    SlotGDK.instance.eventBuyBonusSetInGameJpUI.insert(
      this.SetInGameJpUI,
      this
    ); //BuyBonus介面設定InGameJPUI
    SlotGDK.instance.eventBuyBonusPanelClose.insert(this.OnBuyBonusClose, this); //BuyBonus介面關閉
  }

  onDestroy(): void {
    SlotGDK.instance.eventBuyBonusSetInGameJpUI.remove(
      this.SetInGameJpUI,
      this
    );
    SlotGDK.instance.eventBuyBonusPanelClose.remove(this.OnBuyBonusClose, this);
  }

  private SetInGameJpUI(parentNode: Node) {
    this.oriPos = this.jpRoot.getPosition();
    const worldPos = getWorldSpaceAR(this.jpRoot.parent, this.oriPos);
    const newPos = getNodeSpaceAR(parentNode, worldPos);

    this.jpRoot.setParent(parentNode);
    this.jpRoot.setPosition(newPos);
  }

  private OnBuyBonusClose() {
    this.jpRoot.setParent(this.originalJpParentNode);
    this.jpRoot.setPosition(this.oriPos);
  }
}
