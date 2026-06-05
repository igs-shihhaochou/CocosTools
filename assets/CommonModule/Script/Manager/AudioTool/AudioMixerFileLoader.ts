import {JsonAsset, _decorator, Component} from 'cc';
import SoundManager from '../SoundManager';

const {ccclass, property} = _decorator;

@ccclass
export default class AudioMixerFileLoader extends Component {
  @property(JsonAsset)
  private audioMixerFile: JsonAsset = null;

  protected onLoad(): void {
    if (this.audioMixerFile) {
      const loadJson = () => {
        SoundManager.instance.loadJsonData(this.audioMixerFile);
      };
      this.scheduleOnce(loadJson, 0.5);
    }
  }
}
