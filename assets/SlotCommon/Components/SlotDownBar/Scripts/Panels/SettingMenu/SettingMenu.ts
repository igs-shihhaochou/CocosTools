import {_decorator, Component, Node} from 'cc';
import {SlotUIBtnEvent} from '../../Buttons/SlotUIBtnEvent';
import {SlotButtonCtrl} from '../../Controllers/SlotButtonCtrl';
import {SlotGDK} from '../../../../../../SlotModule/Define/SlotGDK';
import BQLogger from 'db://assets/CommonModule/Script/Log/BQLog/BQLogger';
const {ccclass, property} = _decorator;

@ccclass('SettingMenu')
export class SettingMenu extends Component {
  @property(Node)
  private rootNode: Node = null;
  @property(SlotButtonCtrl)
  private slotButtonCtrl: SlotButtonCtrl = null;

  private registerEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.SettingClicked)[func](this.onSettingClicked, this);
    e(SlotUIBtnEvent.CloseSettingClicked)[func](
      this.onCloseSettingClicked,
      this
    );

    e(SlotUIBtnEvent.InfoClicked)[func](this.onCloseSettingClicked, this);
    e(SlotUIBtnEvent.HistoryClicked)[func](this.onCloseSettingClicked, this);
    e(SlotUIBtnEvent.HomeClicked)[func](this.onCloseHomeSettingClicked, this);
  }

  private onSettingClicked() {
    this.rootNode.active = true;
    this.slotButtonCtrl.onSettingClicked();
    this.slotButtonCtrl.showBlocker();
  }

  private onCloseSettingClicked() {
    this.rootNode.active = false;
    this.slotButtonCtrl.onCloseSettingClicked();
    this.slotButtonCtrl.hideBlocker();
  }

  private onCloseHomeSettingClicked() {
    //**BQ埋點 */
    BQLogger.sendClickExit();
    this.onCloseSettingClicked();
  }

  public setVisibility(option: boolean) {
    this.rootNode.active = option;
  }

  protected onLoad(): void {
    this.registerEvent(true);
  }

  protected onDestroy(): void {
    this.registerEvent(false);
  }
}
