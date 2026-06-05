import {_decorator, Component, Node} from 'cc';
import {SlotGDK} from '../../../../SlotModule/Define/SlotGDK';
import {BuyBonusTipEvent} from './BuyBonusTipEvent';
const {ccclass, property} = _decorator;

@ccclass('BuyBonusTipPanel')
export class BuyBonusTip extends Component {
  @property(Node)
  private root: Node = null;

  protected onLoad(): void {
    SlotGDK.event(BuyBonusTipEvent.buybonusTipEventOpen).insert(
      this.onPanelOpen,
      this
    );
  }

  protected onDestroy(): void {
    SlotGDK.event(BuyBonusTipEvent.buybonusTipEventOpen).remove(
      this.onPanelOpen,
      this
    );
  }

  private onPanelOpen() {
    this.root.active = true;
  }

  public onPanelClose() {
    this.root.active = false;
    SlotGDK.event(BuyBonusTipEvent.buybonusTipEventClose).notify();
  }
}
