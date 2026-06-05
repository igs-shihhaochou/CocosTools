import {_decorator, Component, Node} from 'cc';
import {SlotGDK} from '../../Define/SlotGDK';
import {QuickTipEvent} from './QuickTipEvent';

const {ccclass, property} = _decorator;

@ccclass
export default class QuickTipPanel extends Component {
  @property(Node)
  private root: Node = null;

  protected onLoad(): void {
    SlotGDK.event(QuickTipEvent.quickTipEventOpen).insert(
      this.onPanelOpen,
      this
    );
    SlotGDK.instance.eventSpin.insert(this.onPanelClose, this);
  }

  protected onDestroy(): void {
    SlotGDK.event(QuickTipEvent.quickTipEventOpen).remove(
      this.onPanelOpen,
      this
    );
    SlotGDK.instance.eventSpin.remove(this.onPanelClose, this);
  }

  private onPanelOpen() {
    this.root.active = true;
  }

  public onPanelClose() {
    this.root.active = false;
    SlotGDK.event(QuickTipEvent.quickTipEventClose).notify();
  }
}
