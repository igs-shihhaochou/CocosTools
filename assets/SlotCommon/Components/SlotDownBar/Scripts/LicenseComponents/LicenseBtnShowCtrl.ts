import {_decorator, Component} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
import {SlotUIEvent} from '../Define/SlotUIEvent';
import {SlotUIBtnType} from '../Buttons/SlotUIBtnType';
import type {SlotGameSetting} from 'db://assets/Common/Script/SlotGameSetting';
const {ccclass} = _decorator;

@ccclass('LicenseBtnShowCtrl')
export class LicenseBtnShowCtrl extends Component {
  protected onLoad(): void {
    SlotGDK.instance.eventSceneIsReady.insert(this.onSceneIsReady, this);
  }

  private onSceneIsReady() {
    if (PlatformData.useCert) {
      const {autoPlay, closeSpeedUp} = PlatformData.licenseSetting;
      this.setAutoBtnActive(!autoPlay);
      this.setTurboBtnActive(!closeSpeedUp);
    } else {
      this.setTurboBtnActive(true);
      this.setAutoBtnActive(true);
    }
  }

  private setTurboBtnActive(option: boolean) {
    const {UseTurboPhase} = PlatformData.gameSetting as SlotGameSetting;
    if (UseTurboPhase) {
      this.setBtnActive(SlotUIBtnType.Turbo, false);
      this.setBtnActive(SlotUIBtnType.StopTurbo, false);
      this.setBtnActive(SlotUIBtnType.TurboPhase1, option);
      this.setBtnActive(SlotUIBtnType.TurboPhase2, false);
      this.setBtnActive(SlotUIBtnType.StopTurboPhase, false);
    } else {
      this.setBtnActive(SlotUIBtnType.Turbo, option);
      this.setBtnActive(SlotUIBtnType.TurboPhase1, false);
      this.setBtnActive(SlotUIBtnType.TurboPhase2, false);
      this.setBtnActive(SlotUIBtnType.StopTurboPhase, false);
    }
  }

  private setAutoBtnActive(option: boolean) {
    this.setBtnActive(SlotUIBtnType.Auto, option);
  }

  private setBtnActive(type: SlotUIBtnType, option: boolean) {
    SlotGDK.event(SlotUIEvent.SetBtnActive).notify(type, option);
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventSceneIsReady.remove(this.onSceneIsReady, this);
  }
}
