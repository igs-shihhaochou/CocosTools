import {_decorator, AudioClip, CCBoolean, Component} from 'cc';
import SoundManager, {AUDIO_MANAGER_EVENT} from '../Manager/SoundManager';

const {ccclass, property} = _decorator;

@ccclass('CommonAudioSetting')
export class CommonAudioSetting {
  @property({type: AudioClip, displayName: '音效檔案'})
  public audioClip: AudioClip = null;

  @property({displayName: '音效名字'})
  public clipName = '';
}

@ccclass()
export class AudioClipContainer extends Component {
  @property({type: CommonAudioSetting, displayName: '音效檔案'})
  public listAudioSetting: CommonAudioSetting[] = [];

  @property({type: AudioClip, displayName: '快速拉音效用'})
  private listAudio: AudioClip[] = [];

  private audioClipList: AudioClip[] = [];
  private audioNameList: string[] = [];

  @property({type: CCBoolean, displayName: '取得音效'})
  private get GetClip(): boolean {
    return false;
  }
  private set GetClip(value: boolean) {
    if (value) {
      this.setAudio();
    }
  }

  public start(): void {
    this.audioClipList = [];
    this.audioNameList = [];
    this.listAudioSetting.forEach(setting => {
      this.audioClipList.push(setting.audioClip);
      this.audioNameList.push(setting.clipName);
    });

    SoundManager.instance.setAudioClip(this.audioClipList, this.audioNameList);

    this.onUpdateClips();
    SoundManager.instance.attachEvent(
      AUDIO_MANAGER_EVENT.KEY_UPDATE_CLIPS,
      this.onUpdateClips,
      this
    );
  }

  public sort(): void {
    const list: CommonAudioSetting[] = [];
    this.listAudioSetting.forEach(audio => {
      if (audio.audioClip !== null && audio.clipName !== '') {
        list.push(audio);
      }
    });
    this.listAudioSetting = list;
  }

  public setAudio(): void {
    this.listAudio.forEach(audio => {
      const setting: CommonAudioSetting = new CommonAudioSetting();
      setting.audioClip = audio;
      setting.clipName = audio.name;
      this.listAudioSetting.push(setting);
    });
  }

  private get clipsSource() {
    return [
      ...this.listAudio,
      ...this.listAudioSetting
        .filter(audio => audio.clipName.length > 0 && audio.audioClip)
        .map(audio => audio.audioClip),
    ];
  }

  private get clips(): AudioClip[] {
    if (!this.clipsSource) return [];

    // CustomIterSource
    if (typeof this.clipsSource[Symbol.iterator] === 'function')
      return this.clipsSource;
    else return Object.values(this.clipsSource);
  }

  private onUpdateClips() {
    SoundManager.instance.loadAudioClipList('AudioMixer', [...this.clips]);
  }
}
