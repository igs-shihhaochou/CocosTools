import {_decorator, Component, Node} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('BuyBonusTipControl')
export class BuyBonusTipControl extends Component {
  @property(Node) private imgNode: Node = null;
  @property(Node) private tipNode: Node = null;
  protected onEnable(): void {
    this.closeTip();
  }
  public openTip() {
    this.imgNode.active = false;
    this.tipNode.active = true;
  }
  public closeTip() {
    this.tipNode.active = false;
    this.imgNode.active = true;
  }
}
