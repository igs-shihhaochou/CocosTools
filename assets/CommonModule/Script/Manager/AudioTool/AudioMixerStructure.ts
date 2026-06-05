import {AudioClip} from 'cc';
export class MixerClip {
  listKey = '';
  clip: AudioClip = null;
  volume = 1;
  private _loop = 0;
  fadeIn = false;
  private _fadeInTime = 0;
  fadeOut = false;
  private _fadeOutTime = 0;
  limit = 1;
  limitType: LimitType = LimitType.first;
  group = '';

  // RunTimeVariable
  solo = false;
  mute = false;
  private _soundable = true;

  set loop(_loopTimes: number) {
    const loopTimes = Math.floor(_loopTimes);
    this._loop = loopTimes >= -1 ? loopTimes : 0;
  }
  get loop(): number {
    return this._loop;
  }

  set fadeInTime(_volume: number) {
    const duration: number = this.clip?.getDuration?.() ?? _volume;
    this._fadeInTime = Math.min(_volume, duration);
  }
  get fadeInTime() {
    return this._fadeInTime;
  }

  set fadeOutTime(_volume: number) {
    const duration: number = this.clip?.getDuration?.() ?? _volume;
    this._fadeOutTime = Math.min(_volume, duration);
  }
  get fadeOutTime() {
    return this._fadeOutTime;
  }

  get soundable(): boolean {
    return this._soundable;
  }

  constructor(_data: Partial<MixerClip>) {
    Object.assign(this, _data);
  }
  setData(_data: Partial<MixerClip>) {
    Object.assign(this, _data);
  }

  toJSON() {
    return {
      volume: this.volume,
      loop: this.loop,
      fadeIn: this.fadeIn,
      fadeInTime: this.fadeInTime,
      fadeOut: this.fadeOut,
      fadeOutTime: this.fadeOutTime,
      limit: this.limit,
      limitType: this.limitType,
      group: this.group,
    };
  }

  checkSoundable(_IsOtherClipSolo: boolean) {
    this._soundable = !(this.mute || (_IsOtherClipSolo && !this.solo));
  }
}
export class MixerGroup {
  volume = 1;
  limit = 0;
  limitType: LimitType = LimitType.first;

  // RunTimeVariable
  solo = false;
  mute = false;
  private _soundable = true;

  get soundable() {
    return this._soundable;
  }

  constructor(_data: Partial<MixerGroup>) {
    Object.assign(this, _data);
  }

  toJSON() {
    return {
      volume: this.volume,
      limit: this.limit,
      limitType: this.limitType,
    };
  }

  checkSoundable(_IsOtherGroupSolo: boolean) {
    this._soundable = !(this.mute || (_IsOtherGroupSolo && !this.solo));
  }
}

export interface MixerDuck {
  triggerGroupName: string;
  duckedGroups: DuckedGroup[];
}

export class DuckedGroup {
  duckedGroupName = '';
  volCut = 0;
  begUnduck = 0;
  unduckTime = 0;

  // RunTimeVariable
  private ducking = false;
  private restoreTime = 0;

  constructor(_duckedGroupName: string, _data: Partial<DuckedGroup>) {
    this.duckedGroupName = _duckedGroupName;
    Object.assign(this, _data);
    this.restoreTime = this.unduckTime;
  }

  toJSON() {
    return {
      volCut: this.volCut,
      begUnduck: this.begUnduck,
      unduckTime: this.unduckTime,
    };
  }

  updateDuck(_dt: number) {
    if (!this.ducking && this.restoreTime < this.unduckTime) {
      this.restoreTime += _dt;
    }
    this.ducking = false;
  }
  checkDuck(_triggerCurrent: number, _triggerDuration: number) {
    if (this.ducking) return;

    const executePercentage = (_triggerCurrent / _triggerDuration) * 100;
    if (this.begUnduck > executePercentage) {
      this.ducking = true;
      this.restoreTime = 0;
    } else {
      this.restoreTime =
        ((executePercentage - this.begUnduck) * _triggerDuration) / 100;
    }
  }
  getDuckVolume() {
    let restorePercentage = 0;
    if (!this.ducking) {
      restorePercentage =
        this.restoreTime < this.unduckTime
          ? this.restoreTime / this.unduckTime
          : 1;
    }

    const currentCut = this.volCut * (1 - restorePercentage);
    return getVolumeFromDb(currentCut);
  }
}

export enum LimitType {
  first = 'first',
  last = 'last',
}
export enum FadeType {
  None,
  FadeIn,
  FadeOut,
}

export class PlayingInfo {
  loopTimes: number;
  initId: number;

  private fadeType: FadeType;
  private fadingTime: number;

  constructor(_mixerClip: MixerClip, _id: number) {
    this.loopTimes = _mixerClip.loop;
    this.initId = _id;
    this.setAudioFade(FadeType.None);
  }

  getFadeVolume(_mixerClip: MixerClip) {
    let fadeVolume = 1;
    switch (this.fadeType) {
      case FadeType.FadeIn:
        if (_mixerClip.fadeIn)
          fadeVolume =
            this.fadingTime < _mixerClip.fadeInTime
              ? this.fadingTime / _mixerClip.fadeInTime
              : 1;
        break;
      case FadeType.FadeOut:
        if (_mixerClip.fadeOut)
          fadeVolume =
            this.fadingTime < _mixerClip.fadeOutTime
              ? 1 - this.fadingTime / _mixerClip.fadeOutTime
              : 0;
        break;
      default:
        return 1;
    }
    return fadeVolume;
  }

  setAudioFade(_fadeType: FadeType) {
    this.fadeType = _fadeType;
    this.fadingTime = 0;
  }

  updateFadeTime(_mixerClip: MixerClip, _dt: number) {
    if (this.fadeType === FadeType.None) return;

    if (this.fadingTime < _mixerClip.clip?.getDuration())
      this.fadingTime += _dt;
  }
}

/**音量轉換為DB */
function _getDbFromVolume(_volume: number): number {
  return Math.log10(_volume) * 20;
}

/**DB轉換為音量 */
function getVolumeFromDb(_db: number): number {
  return Math.pow(10, _db / 20);
}
