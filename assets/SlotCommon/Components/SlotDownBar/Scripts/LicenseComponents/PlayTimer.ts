import {_decorator, Component, Label} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import Timer from 'db://assets/CommonModule/Script/Utility/Timer';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
const {ccclass, property} = _decorator;

@ccclass('PlayTimer')
export default class PlayTimer extends Component {
  @property(Label)
  private playTimeDisplay: Label | null = null;
  private totalSeconds = 0;
  private timerKey = 'playTimer';
  protected onLoad() {
    SlotGDK.instance.eventSceneIsReady.insert(this.onSceneIsReady, this);
  }
  protected onDestroy(): void {
    SlotGDK.instance.eventSceneIsReady.remove(this.onSceneIsReady, this);
  }
  private onSceneIsReady() {
    if (!PlatformData.licenseSetting.showPlayTime) {
      this.node.setScale(0, 0, 0);
    } else {
      this.updateTimer();
      Timer.schedule(this.updateTimer.bind(this), 1, this.timerKey);
    }
  }
  private updateTimer() {
    const hours = Math.floor(this.totalSeconds / 3600);
    const minutes = Math.floor((this.totalSeconds % 3600) / 60);
    const seconds = this.totalSeconds % 60;

    const timeString = `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
    this.playTimeDisplay.string = timeString;

    this.totalSeconds++;
  }
  private padZero(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
