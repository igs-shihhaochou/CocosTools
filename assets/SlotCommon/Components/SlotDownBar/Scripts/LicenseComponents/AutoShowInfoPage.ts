import {_decorator, Component} from 'cc';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
const {ccclass} = _decorator;

@ccclass('AutoShowInfoPage')
export class AutoShowInfoPage extends Component {
  start() {
    if (PlatformData.useCert && PlatformData.licenseSetting.autoShowPayTable) {
      //SlotGDK.instance.receiveStartGame.insert(this.OnAfterStartGame, this);
      SlotGDK.instance.eventOnOpeningFinished.insert(this.ShowInfoPage, this);
    }
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventOnOpeningFinished.remove(this.ShowInfoPage, this);
  }

  private ShowInfoPage() {
    SlotGDK.instance.eventOnOpeningFinished.remove(this.ShowInfoPage, this);
    SlotGDK.event(SlotUIBtnEvent.InfoClicked).notify();
  }
}
