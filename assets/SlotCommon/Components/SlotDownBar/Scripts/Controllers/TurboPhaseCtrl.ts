import {_decorator, Component} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import Functions from 'db://assets/CommonModule/Script/Utility/Functions';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import type {SlotGameSetting} from 'db://assets/Common/Script/SlotGameSetting';
const {ccclass} = _decorator;

@ccclass('TurboPhaseCtrl')
export class TurboPhaseCtrl extends Component {
  private recording = false;
  start() {
    if (!(PlatformData.gameSetting as SlotGameSetting).UseTurboPhase) {
      return;
    }
    this.setEvent(true);
  }

  protected onDestroy(): void {
    this.setEvent(false);
  }

  private setEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const s = SlotGDK.instance;
    s.eventSpecialGameStarted[func](this.onSpecialGameStarted, this);
    s.eventSpecialGameEnded[func](this.onSpecialGameEnded, this);
    SlotGDK.event(SlotUIBtnEvent.TurboPhase1Clicked)[func](
      this.onClickTurboPhase1Button,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.TurboPhase2Clicked)[func](
      this.onClickTurboPhase2Button,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.StopTurboPhaseClicked)[func](
      this.onClickStopTurboPhaseButton,
      this
    );
  }

  private get cookieKey() {
    return `${PlatformData.instance.nickName}_${PlatformData.instance.gameName}_turbo_phase_state`;
  }

  private saveState(phase: number) {
    Functions.setCookie(this.cookieKey, phase.toString(), 525600, true);
  }

  private getState() {
    return Functions.getCookie(this.cookieKey);
  }

  private onSpecialGameStarted() {
    this.recording = true;
    if (!PlatformData.instance.fastspin) {
      return;
    }
    const state = this.getState();
    if (!state) {
      SlotGDK.event(SlotUIBtnEvent.TurboPhase1Clicked).notify(false);
      this.saveState(1);
    } else {
      switch (state) {
        case '1':
          SlotGDK.event(SlotUIBtnEvent.TurboPhase1Clicked).notify(false);
          break;
        case '2':
          SlotGDK.event(SlotUIBtnEvent.TurboPhase2Clicked).notify(false);
          break;
        default:
          SlotGDK.event(SlotUIBtnEvent.StopTurboPhaseClicked).notify(false);
          break;
      }
    }
  }

  private onSpecialGameEnded() {
    this.recording = false;
  }

  protected onClickTurboPhase1Button() {
    if (!this.recording) {
      return;
    }
    this.saveState(1);
  }

  protected onClickTurboPhase2Button() {
    if (!this.recording) {
      return;
    }
    this.saveState(2);
  }

  protected onClickStopTurboPhaseButton() {
    if (!this.recording) {
      return;
    }
    this.saveState(0);
  }
}
