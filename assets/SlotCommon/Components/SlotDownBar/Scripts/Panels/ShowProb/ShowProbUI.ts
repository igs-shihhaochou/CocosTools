import {_decorator, Component, Input, input, KeyCode, Label} from 'cc';
import {PlatformData} from '../../../../../../CommonModule/Script/Define/PlatformData';
import {DEBUG} from 'cc/env';
import {PlatformGDK} from '../../../../../../CommonModule/Script/Platform/PlatformGDK';
const {ccclass, property} = _decorator;

@ccclass('ShowProbUI')
export class ShowProbUI extends Component {
  @property(Label)
  private probLabel: Label = null;

  protected onLoad(): void {
    this.node.active = false;
    if (!PlatformData.instance.isDebugMode || !DEBUG) {
      return;
    }
    PlatformGDK.instance.receiveOriginalStartGameData.insert(
      this.receiveStartGameData,
      this
    );
    input.on(Input.EventType.KEY_DOWN, this.toggleCheatkeyData, this);
  }

  protected onDestroy(): void {
    this.node.active = false;
    if (!PlatformData.instance.isDebugMode || !DEBUG) {
      return;
    }
    PlatformGDK.instance.receiveOriginalStartGameData.remove(
      this.receiveStartGameData,
      this
    );
    input.off(Input.EventType.KEY_DOWN, this.toggleCheatkeyData, this);
  }

  protected receiveStartGameData(data) {
    if (!PlatformData.instance.isDebugMode || !DEBUG) {
      return;
    }
    if (!this.probLabel) {
      return;
    }
    if (data.hasOwnProperty('data')) {
      const dataJson: JSON = data['data'];
      const rtp = dataJson['Rtp'] !== undefined ? dataJson['Rtp'] : 0;
      const probId = dataJson['ProbId'] !== undefined ? dataJson['ProbId'] : '';
      this.probLabel.string = 'ProbID: ' + probId + ',RTP:' + rtp + '%';
      this.node.active = true;
    }
  }
  private toggleCheatkeyData(event) {
    if (event.keyCode === KeyCode.KEY_Q) {
      this.node.active = !this.node.active;
    }
  }
}
