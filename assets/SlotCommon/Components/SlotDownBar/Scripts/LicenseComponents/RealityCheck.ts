import {_decorator, Component, Label, Node} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import FunctionManager from 'db://assets/CommonModule/Script/Manager/FunctionManager';
import Functions from 'db://assets/CommonModule/Script/Utility/Functions';
import Timer from 'db://assets/CommonModule/Script/Utility/Timer';
const {ccclass, property} = _decorator;

@ccclass('RealityCheck')
export class RealityCheck extends Component {
  @property(Node)
  private realityCheckNode: Node = null;
  @property(Label)
  private contextLabel: Label = null;
  private curTime = 0;
  private timerKey = 'realityCheckTimer';
  protected onLoad(): void {
    if (PlatformData.useCert && PlatformData.licenseSetting.realityCheck) {
      this.curTime = 0;
      SlotGDK.instance.eventSceneIsReady.insert(
        this.setRealityCheckTimer,
        this
      );
      this.setEvents(true);
    } else {
      this.realityCheckNode.active = false;
    }
  }

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.RealityCheckConfirmClicked)[func](
      this.onConfirmClicked,
      this
    );
    e(SlotUIBtnEvent.RealityCheckCancelClicked)[func](this.exitGame, this);
  }

  private setRealityCheckTimer() {
    SlotGDK.instance.eventSceneIsReady.remove(this.setRealityCheckTimer, this);
    const {realityCheck} = PlatformData.licenseSetting;
    const {realityCheckInterval} = PlatformData.licenseClientModeSetting;
    if (realityCheck && realityCheckInterval.length > 0) {
      const realityCheckTime = realityCheckInterval[0];
      //設定timer
      Timer.schedule(
        () => {
          if (this.realityCheckNode.active) {
            return;
          }
          if (this.curTime >= realityCheckTime) {
            this.curTime = 0; // Reset the timer after showing reality check
            this.showRealityCheck();
          }
          this.curTime++;
        },
        1,
        this.timerKey
      );
    }
  }

  private onConfirmClicked() {
    this.closePanel();
  }

  private exitGame() {
    this.closePanel();
    FunctionManager.instance.CloseGame(PlatformData.isMute);
  }

  private closePanel() {
    this.realityCheckNode.active = false;
  }

  private showRealityCheck() {
    // 停止自動旋轉
    if (PlatformData.instance.autospin) {
      SlotGDK.event(SlotUIBtnEvent.StopAutoClicked).notify();
    }
    const getDollarSign = () => {
      if (PlatformData.currencySymbol === '') {
        return '$';
      } else {
        if (PlatformData.isSSEnv) return '$';
        else return `${PlatformData.currencySymbol} `;
      }
    };

    //遊戲時間
    this.realityCheckNode.active = true;
    const hours = Math.floor(this.curTime / 3600);
    const minutes = Math.floor((this.curTime % 3600) / 60);
    const {displayDigit, displayRatio, showThousandPlaces} =
      PlatformData.instance;

    const netWorth = Functions.numberFormat(
      PlatformData.instance.currentNetWorth,
      displayDigit,
      showThousandPlaces,
      '',
      displayRatio
    );
    const message = `You have been playing for: ${hours}h ${minutes}m \n and your NET is: ${getDollarSign()}${netWorth}.`;
    this.contextLabel.string = message;
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventSceneIsReady.remove(this.setRealityCheckTimer, this);
  }
}
