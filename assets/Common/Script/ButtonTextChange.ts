import {_decorator, Component, Button, Touch, Node} from 'cc';
import {
  getSize,
  getWorldSpaceAR,
} from '../../CommonModule/Script/Utility/NodeProperty';

const {ccclass, property} = _decorator;

@ccclass
export class ButtonTextChange extends Component {
  @property(Node)
  private normalText: Node = null;

  @property(Node)
  private pressedText: Node = null;

  @property(Button)
  private button: Button = null;

  public onLoad() {
    this.button.node.on(Node.EventType.TOUCH_START, () => {
      this.SetButtonPressedText(true);
    });

    this.button.node.on(Node.EventType.TOUCH_CANCEL, () => {
      this.SetButtonPressedText(false);
    });

    this.button.node.on(Node.EventType.TOUCH_END, () => {
      this.SetButtonPressedText(false);
    });

    //如果點擊的位置超出按鈕，則顯示為off狀態
    this.button.node.on(
      Node.EventType.TOUCH_MOVE,
      (event: Touch) => {
        const currPosition = event.getLocation();
        const btnPosition = getWorldSpaceAR(this.button.node);

        if (
          currPosition.x >
            btnPosition.x + getSize(this.button.node).width / 2 ||
          currPosition.x <
            btnPosition.x - getSize(this.button.node).width / 2 ||
          currPosition.y >
            btnPosition.y + getSize(this.button.node).height / 2 ||
          currPosition.y < btnPosition.y - getSize(this.button.node).height / 2
        ) {
          this.SetButtonPressedText(false);
        } else {
          this.SetButtonPressedText(true);
        }
      },
      this.button.node
    );
  }

  //設定選擇
  public SetButtonPressedText(pressed: boolean) {
    if (!this.button.interactable) return;

    this.pressedText.active = pressed ? true : false;
    this.normalText.active = pressed ? false : true;
  }
}
