import {_decorator, Component, Label, Node} from 'cc';
import {AutoSpinPicker} from '../Panels/AutoSpinPicker/AutoSpinPicker';
import type {AutoSpinPickerData} from '../Panels/AutoSpinPicker/AutoSpinPickerData';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import {Delegate} from '../../../../../CommonModule/Script/ExtraType';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import HostSetting from '../../../../../SlotModule/Define/HostSetting';
const {ccclass, property} = _decorator;

@ccclass('AutoSpinCtrl')
export class AutoSpinCtrl extends Component {
  @property(AutoSpinPicker)
  public autoSpinPicker: AutoSpinPicker = null;
  @property(Label)
  private autoSpinLabel: Label = null;
  @property(Label)
  private sideAutoSpinLabel: Label = null;
  @property(Node)
  private stopAutoSpinBtn: Node = null;
  @property(Node)
  private sideStopAutoSpinBtn: Node = null;

  private setting: AutoSpinPickerData = null;

  private spinCallback: Delegate = new Delegate();

  private netWorth = 0;

  private thisWin = 0;

  private showCounter = false;

  public registerSpinCallback(func: Function, target) {
    this.spinCallback.insert(func, target);
  }

  private get keepAutoSpin(): boolean {
    return (
      !this.checkLeftAutoSpin() &&
      !this.checkSingleWinExceeds() &&
      !this.checkTakeProfitLimit() &&
      !this.checkTakeLossLimit()
    );
  }

  private checkSingleWinExceeds(): boolean {
    const {singleWinExceeds, singleWinExceedsSetting} = this.setting;
    if (singleWinExceeds > 0) {
      if (singleWinExceedsSetting.isMultiplyer) {
        return (
          this.thisWin / PlatformData.instance.originalTotalBet >=
          singleWinExceeds
        );
      } else {
        return this.thisWin >= singleWinExceeds;
      }
    } else {
      return false;
    }
  }

  private checkTakeProfitLimit(): boolean {
    const {takeProfitLimit} = this.setting;
    return takeProfitLimit > 0 && this.netWorth >= takeProfitLimit;
  }

  private checkTakeLossLimit(): boolean {
    const {takeLossLimit} = this.setting;
    return takeLossLimit > 0 && this.netWorth >= takeLossLimit;
  }

  private checkLeftAutoSpin(): boolean {
    return PlatformData.instance.autospinTimes === 0;
  }

  onLoad() {
    this.registerEvents(true);
  }

  onDestroy(): void {
    this.registerEvents(false);
    this.spinCallback.clear();
  }

  private registerEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    this.autoSpinPicker.onConfirmClicked[func](
      this.onAutoSpinConfirmClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.StopAutoClicked)[func](
      this.stopAutoSpin,
      this
    );
  }

  private setSlotGDKEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    SlotGDK.instance.eventReadyToSpin[func](this.continueAutoSpin, this);
    SlotGDK.instance.receiveSpinData[func](this.onSpinDataReceived, this);
    SlotGDK.instance.eventSpin[func](this.onSpin, this);
    if (PlatformData.instance.stopAutoInSpecialGame) {
      SlotGDK.instance.eventSpecialGameStarted[func](this.stopAutoSpin, this);
    }
  }

  private continueAutoSpin() {
    if (this.keepAutoSpin) {
      if (this.thisWin > 0) {
        this.scheduleOnce(
          this.startSpin.bind(this),
          HostSetting.instance.gameSetting.readyToSpinDelay.haveWin
        );
      } else {
        const delayTime = PlatformData.instance.fastspin
          ? HostSetting.instance.gameSetting.readyToSpinDelay.fastSpinNoWin *
            HostSetting.instance.gameSetting.readyToSpinDelay.multiplier
          : HostSetting.instance.gameSetting.readyToSpinDelay.noWin *
            HostSetting.instance.gameSetting.readyToSpinDelay.multiplier;
        this.scheduleOnce(this.startSpin.bind(this), delayTime);
      }
    } else {
      this.stopAutoSpin();
    }
  }

  private onSpinDataReceived(rawData) {
    if (rawData.data) {
      this.thisWin = rawData.data['this_win_amount'];
      this.netWorth += this.thisWin;
    }
  }

  private updateCounter() {
    if (this.showCounter) {
      const {autospinTimes} = PlatformData.instance;
      const spinTime = autospinTimes;

      if (spinTime === Infinity) {
        this.autoSpinLabel.string = '∞';
        this.autoSpinLabel.fontSize = 80;
        if (this.sideAutoSpinLabel) {
          this.sideAutoSpinLabel.string = '∞';
          this.sideAutoSpinLabel.fontSize = 80;
        }
      } else {
        this.autoSpinLabel.string = spinTime.toString();
        this.autoSpinLabel.fontSize = 40;
        if (this.sideAutoSpinLabel) {
          this.sideAutoSpinLabel.string = spinTime.toString();
          this.sideAutoSpinLabel.fontSize = 40;
        }
      }
    } else {
      this.autoSpinLabel.string = '';
    }
  }

  private onSpin() {
    PlatformData.instance.autospinTimes--;
    this.netWorth -= PlatformData.instance.currentTotalBet;
    if (this.checkLeftAutoSpin()) {
      SlotGDK.event(SlotUIBtnEvent.StopAutoClicked).notify();
    }
    this.updateCounter();
  }

  private onAutoSpinConfirmClicked(data: AutoSpinPickerData) {
    console.log('[AutoSpinCtrl] onAutoSpinConfirmClicked', data);
    if (data.selectedNumberOfSpins === -1) {
      PlatformData.instance.autospinTimes = Infinity;
    } else {
      PlatformData.instance.autospinTimes = data.selectedNumberOfSpins;
    }

    if (PlatformData.instance.autospinMaxTimes > 0) {
      PlatformData.instance.autospinTimes = Math.min(
        PlatformData.instance.autospinTimes,
        PlatformData.instance.autospinMaxTimes
      );
    }
    this.showCounter = data.showCounter;
    PlatformData.instance.stopAutoInSpecialGame = data.stopOnSpecialFeatureWin;
    this.setting = data;
    this.startAutoSpin();
    //若freespin啟用則調整位置與大小
    if (SlotGDK.instance.isFreeSpin) {
      if (this.stopAutoSpinBtn) {
        this.stopAutoSpinBtn.active = false;
      }
      if (this.sideStopAutoSpinBtn) {
        this.sideStopAutoSpinBtn.active = true;
      }
    } else {
      if (this.stopAutoSpinBtn) {
        this.stopAutoSpinBtn.active = true;
      }
      if (this.sideStopAutoSpinBtn) {
        this.sideStopAutoSpinBtn.active = false;
      }
    }
  }

  private startAutoSpin() {
    PlatformData.instance.autospin = true;
    SlotGDK.instance.eventActiveAutoSpin.notify();
    this.setSlotGDKEvents(true);
    this.startSpin();
  }

  private stopAutoSpin() {
    this.setSlotGDKEvents(false);
    PlatformData.instance.autospin = false;
    PlatformData.instance.autospinTimes = 0;
    PlatformData.instance.stopAutoInSpecialGame = false;
    this.updateCounter();
    this.setting = null;
    this.netWorth = 0;
    this.thisWin = 0;
    this.showCounter = false;
    SlotGDK.instance.eventStopAutoSpin.notify();
  }

  private startSpin() {
    this.thisWin = 0;
    if (SlotGDK.instance.eventAutoSpin.length > 0) {
      SlotGDK.instance.eventAutoSpin.notify();
    } else {
      this.spinCallback.notify();
    }
  }
}
