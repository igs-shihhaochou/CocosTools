import {_decorator, Component, Button, Node} from 'cc';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {setScale} from '../../CommonModule/Script/Utility/NodeProperty';

const {ccclass, property} = _decorator;

@ccclass
export class SelectButton extends Component {
  @property(Node)
  private bg: Node = null;

  @property(Node)
  private onText: Node = null;

  @property(Node)
  private offText: Node = null;

  @property(Button)
  private button: Button = null;

  public onClick: Delegate = new Delegate();

  public onLoad() {
    this.button.node.on(Node.EventType.TOUCH_END, () => {
      if (this.onClick.length > 0) {
        this.onClick.notify();
      }
    });
  }

  ////設定選擇
  public SetSelection(selection: boolean) {
    setScale(this.bg, selection ? 1 : -1);
    this.offText.active = selection ? true : false;
    this.onText.active = selection ? false : true;
  }
}
