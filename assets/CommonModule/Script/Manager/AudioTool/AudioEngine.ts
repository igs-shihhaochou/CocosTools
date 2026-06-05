import {AudioClip, AudioSource, Node} from 'cc';
import {AudioPool} from './AudioPool';

export enum AudioState {
  INIT = 0,
  PLAYING = 1,
  PAUSED = 2,
  STOPPED = 3,
  INTERRUPTED = 4,
}

export class AudioEngine {
  private _maxAudioInstance = 100;

  private playingAudios: Map<number, AudioSource> = new Map();
  private nextAudioID = 0;

  private audioPool: AudioPool = null;
  constructor(audioRoot: Node) {
    this.audioPool = new AudioPool(audioRoot);
  }

  public play(audioClip: AudioClip, loop: boolean, volume: number): number {
    const audioID = ++this.nextAudioID;
    const audio = this.audioPool.getAudioSource(audioID);
    audio.volume = volume;
    audio.clip = audioClip;
    audio.loop = loop;
    audio.node.on(
      AudioSource.EventType.ENDED,
      () => {
        this.endAudio(audioID);
      },
      audio.node
    );
    audio.play();

    this.playingAudios.set(audioID, audio);
    return audioID;
  }

  /**
   * stop不會觸發AudioSource.EventType.ENDED
   * @param id
   * @returns
   */
  public stop(id: number): boolean {
    const audio = this.playingAudios.get(id);
    if (audio) {
      audio.stop();
      this.endAudio(id);
      this.audioPool.putAudioSource(audio);
      return true;
    } else {
      return false;
    }
  }

  public setVolume(id: number, volume: number) {
    const audio = this.playingAudios.get(id);
    if (audio) {
      audio.volume = volume;
    }
  }
  public setLoop(id: number, loop: boolean) {
    const audio = this.playingAudios.get(id);
    if (audio) {
      audio.loop = loop;
    }
  }
  public getDuration(id: number): number {
    const audio = this.playingAudios.get(id);
    return audio ? audio.duration : 0;
  }
  public getMaxAudioInstance() {
    return this._maxAudioInstance;
  }

  public getCurrentTime(audioID) {
    const audio = this.playingAudios.get(audioID);
    return audio ? audio.currentTime : 0;
  }
  public endAudio(audioID: number) {
    const audio = this.playingAudios.get(audioID);
    if (audio) {
      this.playingAudios.delete(audioID);
    }
  }
  public setFinishCallback(audioID: number, callback: () => void): void {
    const audio = this.playingAudios.get(audioID);
    if (audio) {
      audio.node.on(AudioSource.EventType.ENDED, callback, audio.node);
    }
  }

  public uncacheAll() {
    this.audioPool.uncacheAll();
  }

  public stopAll() {
    this.audioPool.stopAll();
  }

  public pause(id: number) {
    const audio = this.playingAudios.get(id);
    if (audio) {
      audio.pause();
    }
  }

  public resume(id: number) {
    const audio = this.playingAudios.get(id);
    if (audio) {
      audio.play();
    }
  }

  public getVolume(id: number) {
    const audio = this.playingAudios.get(id);
    return audio ? audio.volume : 0;
  }

  public get AudioState() {
    return AudioState;
  }

  public getState(id: number) {
    const audio = this.playingAudios.get(id);
    if (audio) {
      return audio.state;
    } else {
      return AudioState.INTERRUPTED;
    }
  }
}
