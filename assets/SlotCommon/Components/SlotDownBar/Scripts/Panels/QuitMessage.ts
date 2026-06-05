import {_decorator, Component, Node} from 'cc';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import FunctionManager from '../../../../../CommonModule/Script/Manager/FunctionManager';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
const {ccclass, property} = _decorator;

@ccclass('QuitMessage')
export class QuitMessage extends Component {
  @property(Node)
  private root: Node = null;

  protected onLoad(): void {
    this.setEvents(true);
  }

  protected onDestroy(): void {
    this.setEvents(false);
  }

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.HomeClicked)[func](this.showPanel, this);
    e(SlotUIBtnEvent.QuitConfirmClicked)[func](this.onConfirmClicked, this);
    e(SlotUIBtnEvent.QuitCancelClicked)[func](this.closePanel, this);
  }

  private showPanel() {
    this.root.active = true;
  }
  private onConfirmClicked() {
    FunctionManager.instance.CloseGame(PlatformData.isMute);
    this.closePanel();
  }

  private closePanel() {
    this.root.active = false;
  }
}
