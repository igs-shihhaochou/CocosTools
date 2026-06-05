import {_decorator, Component, Node} from 'cc';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import {UserInfo} from '../../../../../CommonModule/Script/Define/UserInfo';
import {SlotUISwitch} from '../Define/SlotUISwitch';
import {PlatformGDK} from '../../../../../CommonModule/Script/Platform/PlatformGDK';
const {ccclass, property} = _decorator;

@ccclass('PurchaseHintCtrl')
export class PurchaseHintCtrl extends Component {
  @property(Node)
  private root: Node = null;

  onLoad() {
    this.setEvent(true);
    this.root.active = false;
  }

  onDestroy(): void {
    this.setEvent(false);
  }

  private setEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const s = SlotGDK.instance;
    s.eventReadyToSpin[func](this.onSpinReady, this);
    s.eventSpin[func](this.onSpin, this);
  }

  private onSpinReady() {
    this.checkShow();
    SlotGDK.instance.eventClickChangeBet.insert(this.checkShow, this);
    PlatformGDK.instance.updatePlayerBalance.insert(this.checkShow, this);
  }

  private onSpin() {
    this.root.active = false;
    SlotGDK.instance.eventClickChangeBet.remove(this.checkShow, this);
    PlatformGDK.instance.updatePlayerBalance.remove(this.checkShow, this);
  }

  protected get noCoin(): boolean {
    const asset = PlatformData.isUseScoreBox
      ? UserInfo.instance.entries
      : UserInfo.instance.balance;
    return (
      PlatformData.instance.currentTotalBet +
        PlatformData.instance.linkingJpBet >
      asset
    );
  }

  private checkShow() {
    if (SlotUISwitch.showPurchase) {
      this.root.active = this.noCoin;
    }
  }
}
