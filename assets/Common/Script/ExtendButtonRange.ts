import {_decorator, Component, Button, Node} from 'cc';

const {ccclass, property} = _decorator;

@ccclass
export default class ExtendButtonRange extends Component {
  @property(Button)
  private targetButton: Button = null;

  @property(Button)
  private zoneButton: Button = null;

  //監聽關閉按鈕事件，在不改變圖片大小的情況下加大監聽區域
  public start() {
    this.zoneButton.node.on(
      Node.EventType.TOUCH_START,
      (event: Touch) => {
        this.targetButton.node.emit(Node.EventType.TOUCH_START, event);
      },
      this.zoneButton.node
    );

    this.zoneButton.node.on(
      Node.EventType.TOUCH_END,
      (event: Touch) => {
        this.targetButton.node.emit(Node.EventType.TOUCH_END, event);
      },
      this.zoneButton.node
    );

    this.zoneButton.node.on(
      Node.EventType.TOUCH_CANCEL,
      (event: Touch) => {
        this.targetButton.node.emit(Node.EventType.TOUCH_CANCEL, event);
      },
      this.zoneButton.node
    );
  }
}
