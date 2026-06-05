import {AudioClip, _decorator, Component} from 'cc';
import SoundManager, {AUDIO_MANAGER_EVENT} from '../SoundManager';

const {ccclass} = _decorator;

@ccclass()
export class ClipLoader extends Component {
  /**@clipsSource AudioClipDictionary | AudioClipArray | CustomIterSource
        ** AudioClipDictionary -
        static AudioClips = {
            Button_press: null as AudioClip,
            Debut: null as AudioClip,
            ......
        }

        ** AudioClipArray -
        public m_listAudioSetting: AudioClip[] = [];

        ** CustomIterSource -
        * iter_Clip(){
            for(const clip in clips)
            {
                yield clip;
            }
        }
    */
  private get clipsSource() {
    return null;
  }

  private get clips(): Iterable<AudioClip> {
    if (!this.clipsSource) return [];

    // CustomIterSource
    if (typeof this.clipsSource[Symbol.iterator] === 'function')
      return this.clipsSource;
    else return Object.values(this.clipsSource);
  }

  public onLoad(): void {
    this.OnUpdateClips();
    SoundManager.instance.attachEvent(
      AUDIO_MANAGER_EVENT.KEY_UPDATE_CLIPS,
      this.OnUpdateClips,
      this
    );
  }
  protected onDestroy(): void {
    SoundManager.instance.detachEvent(
      AUDIO_MANAGER_EVENT.KEY_UPDATE_CLIPS,
      this.OnUpdateClips,
      this
    );
  }

  private OnUpdateClips() {
    SoundManager.instance.loadAudioClipList('AudioMixer', [...this.clips]);
  }
}
