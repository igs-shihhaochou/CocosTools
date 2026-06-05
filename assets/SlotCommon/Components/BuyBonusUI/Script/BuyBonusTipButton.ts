import {_decorator, Component, Button, Node, UIOpacity} from 'cc';
import {BuyBonusTipEvent} from './BuyBonusTipEvent';
import {SlotGDK} from '../../../../SlotModule/Define/SlotGDK';

const {ccclass, property} = _decorator;

@ccclass
export default class BuyBonusTipButton extends Component {
  @property(Button)
  private button: Button = null;

  private isPanelShowing = false;
  private uiOpacity: UIOpacity = null;

  protected setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';

    this.node.on(Node.EventType.TOUCH_START, this.onClickButton, this);

    SlotGDK.event(BuyBonusTipEvent.buybonusTipEventClose)[func](
      this.onPanelClose,
      this
    );
  }

  protected onLoad(): void {
    this.setEvents(true);
    this.uiOpacity = this.node.getComponent(UIOpacity);
    if (!this.uiOpacity) {
      this.uiOpacity = this.node.addComponent(UIOpacity);
    }
  }

  protected onDestroy(): void {
    this.setEvents(false);
  }

  private onPanelClose() {
    this.isPanelShowing = false;
    this.button.interactable = true;
  }

  public onClickButton() {
    if (!this.button.interactable) {
      return;
    }
    this.button.interactable = false;
    this.isPanelShowing = true;
    SlotGDK.event(BuyBonusTipEvent.buybonusTipEventOpen).notify();
  }
}
