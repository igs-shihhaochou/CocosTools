import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {_decorator, Component} from 'cc';
import PlatformEventNotifier from '../../../../../CommonModule/Script/Utility/PlatformEventNotifier';
import ClickLogManager, {
  type ClickLogData,
} from '../../../../../CommonModule/Script/Manager/ClickLogManager';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
const {ccclass} = _decorator;
@ccclass('SlotEventHandler')
export default class SlotEventHandler extends Component {
  protected onLoad(): void {
    this.registerEvent(true);
  }
  protected onDestroy(): void {
    this.registerEvent(false);
  }
  public registerEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const {event: e} = SlotGDK;
    e(SlotUIBtnEvent.InfoClicked)[func](this.onInfoClicked, this);
    e(SlotUIBtnEvent.QuitConfirmClicked)[func](this.onQuitConfirmClicked, this);
    e(SlotUIBtnEvent.PrizePreviewClicked)[func](
      this.onPrizePreviewClicked,
      this
    );
    e(SlotUIBtnEvent.ProfileClicked)[func](this.onProfileClicked, this);
    e(SlotUIBtnEvent.TurboClicked)[func](this.onTurboClicked, this);
  }

  private onInfoClicked() {
    PlatformEventNotifier.info();
  }

  private onQuitConfirmClicked() {
    PlatformEventNotifier.exitGame();
  }

  private onPrizePreviewClicked() {
    PlatformEventNotifier.preview();
  }

  private onProfileClicked() {
    PlatformEventNotifier.profile();
  }

  private onTurboClicked() {
    PlatformEventNotifier.turbo();
    ClickLogManager.instance.addClickLog(
      'Turbo',
      PlatformData.gameName,
      PlatformData.gameName,
      '',
      0,
      {
        NickName: PlatformData.nickName,
        Turbo: PlatformData.instance.fastspin,
      } as ClickLogData
    );
  }
}
