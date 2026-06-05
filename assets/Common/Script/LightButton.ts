import {_decorator, Component, Button, Node} from 'cc';
import {Delegate} from '../../CommonModule/Script/ExtraType';

const {ccclass, property} = _decorator;

@ccclass
export class LightButton extends Component {
  @property(Node)
  private onText: Node = null;

  @property(Node)
  private offText: Node = null;

  @property(Button)
  private button: Button = null;

  public onClick: Delegate = new Delegate();

  public onLoad() {
    this.button.node.on(Node.EventType.TOUCH_END, () => {
      if (!this.button.interactable) return;
      if (this.onClick.length > 0) {
        this.onClick.notify();
      }
    });
  }

  //設定選擇
  public setLightOnOff(lightOnOff: boolean) {
    if (!this.button.interactable) return;

    this.offText.active = lightOnOff ? true : false;
    this.onText.active = lightOnOff ? false : true;
  }
}
