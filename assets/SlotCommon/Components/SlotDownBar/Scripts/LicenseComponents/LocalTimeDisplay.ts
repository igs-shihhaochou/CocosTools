import {_decorator, Component, Label} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import Timer from 'db://assets/CommonModule/Script/Utility/Timer';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
const {ccclass, property} = _decorator;

@ccclass('LocalTimeDisplay')
export default class LocalTimeDisplay extends Component {
  @property(Label)
  private displayLabel: Label | null = null;
  private _time: Date = null;
  private timerKey = 'localTimeDisplay';
  private onSceneIsReady() {
    if (!PlatformData.licenseSetting.showTime) {
      this.node.setScale(0, 0, 0);
    } else {
      this.updateTime();
      Timer.schedule(this.updateTime.bind(this), 1, this.timerKey); // Update every second
    }
  }
  protected onLoad() {
    SlotGDK.instance.eventSceneIsReady.insert(this.onSceneIsReady, this);
  }
  protected onDestroy(): void {
    SlotGDK.instance.eventSceneIsReady.remove(this.onSceneIsReady, this);
    Timer.unschedule(this.timerKey);
  }
  private updateTime() {
    this._time = new Date();
    const hours = this._time.getHours().toString().padStart(2, '0');
    const minutes = this._time.getMinutes().toString().padStart(2, '0');
    this.displayLabel.string = `${hours}:${minutes}`;
  }
}
