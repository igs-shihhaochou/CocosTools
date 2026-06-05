import {
  _decorator,
  director,
  game,
  Game,
  EventMouse,
  EventTouch,
  math,
  v3,
  v2,
  JsonAsset,
  Component,
  Sprite,
  Label,
  Node,
  Tween,
  type AudioClip,
} from 'cc';
import {PlatformData} from '../Define/PlatformData';
import Functions from '../Utility/Functions';
import {Dictionary} from '../Utility/Dictionary';
import Signal from '../Utility/Signal';
import {tweenNodeEx} from '../Utility/TweenUtil';
import {setPosition} from '../Utility/NodeProperty';
import {AudioEngine} from './AudioTool/AudioEngine';
import {
  MixerClip,
  MixerGroup,
  type MixerDuck,
  PlayingInfo,
  DuckedGroup,
  FadeType,
  LimitType,
} from './AudioTool/AudioMixerStructure';
import {Define} from '../Define/GlobalSetting';

const {ccclass, property} = _decorator;

export const AUDIO_MANAGER_EVENT = {
  KEY_UPDATE_CLIPS: 'update_Clips',
  KEY_ON_UPDATE_CLIPS: 'on_update_Clips',
  KEY_ON_JSON_LOADED: 'on_json_loaded',
  KEY_ON_AUDIO_MIXER_FINISH: 'on_audio_mixer_finish',
};

@ccclass('SoundManager')
export default class SoundManager extends Component {
  //#region Singleton
  //================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): SoundManager {
    if (!SoundManager._instance) {
      const node: Node = new Node('SoundManager');
      const comp: SoundManager = node.addComponent(SoundManager);
      SoundManager._instance = comp;

      director.getScene().addChild(node);
      director.addPersistRootNode(node);
    }
    return SoundManager._instance;
  }
  protected static set instance(_audioManager: SoundManager) {
    SoundManager._instance = _audioManager;
    if (Functions.isNullOrEmpty(globalThis.SoundManager)) {
      globalThis.SoundManager = SoundManager._instance;
    }
  }
  /** Instance 實體 */
  protected static get _instance(): SoundManager {
    return window['soundManager'];
  }
  protected static set _instance(_audioManager: SoundManager) {
    window['soundManager'] = _audioManager;
  }
  //================================================
  //#endregion Singleton

  /** SoundManager監測介面 */
  @property(Node)
  protected monitor: Node = null;

  //#region AudioMixer參數
  //================================================
  // 主音量
  private masterVolume = 1;
  /** <音效名稱 - Mixer設定>*/
  private sceneClips: Map<string, MixerClip> = new Map();
  /** <Group名稱 - Mixer設定>*/
  private mixerGroups: Map<string, MixerGroup> = new Map();
  /** <MixerDuck - <TriggerGroup名稱 - DuckedGroups> >*/
  private mixerDucks: MixerDuck[] = [];
  /** <音效名稱 - 播放清單<AudioID - 播放設定> >*/
  private playingClips: Map<string, Map<number, PlayingInfo>> = new Map();
  /** <Audio - 音效名稱> */
  private audioClips: Map<number, string> = new Map();

  /** <音效名稱 - AudioID>*/
  private previewingClips: Map<string, number> = new Map();
  /** <Group名稱 - Duck音量>*/
  private duckVolumes: {[key: string]: number} = {};
  /** 未分組的Clip是否可以出聲*/
  private ungroupedSoundable = true;
  /** <OldId - NewId> 避免因loop導致id消失 需紀錄loop給的新id*/
  private audioIdMap: {[key: number]: number} = {};
  //================================================
  //#endregion AudioMixer參數

  //#region Channel參數
  //================================================
  /** 聲音頻道 */
  protected soundChannel: AudioInfo[] = null;
  /** 音樂頻道 */
  protected musicChannel: Map<string, AudioInfo> = null;
  /** 最後的音樂 */
  protected lastMusic: AudioInfo = null;
  /** 頻道數量 */
  protected channel = 16;
  /** 最大頻道數 */
  protected channelLimit = 100;
  //================================================
  //#endregion Channel參數

  //#region Sound、Music參數
  //================================================
  /** 聲音音量 */
  protected soundVolume = 1;
  /** 聲音是否靜音 */
  protected isSoundMute = false;
  /** 音樂音量 */
  protected musicVolume = 1;
  /** 音樂是否靜音 */
  protected isMusicMute = false;
  /** 是否禁用播放音效 */
  protected isDisablePlaySound = false;
  //================================================
  //#endregion Sound、Music參數

  //#region SoundManager
  //================================================

  /** 是否為靜音 */
  protected isMute = false;
  /** 是否為暫停 */
  protected isPause = false;

  protected audioClipMap: Dictionary<string, AudioClip> = null;

  protected audioEngine: AudioEngine = null;

  protected override onLoad() {
    if (!SoundManager._instance) {
      director.addPersistRootNode(this.node);
      SoundManager.instance = this;
    } else if (SoundManager._instance !== this) {
      this.destroy();
    }

    this.init();
  }

  protected override onDestroy() {
    this.release();
  }

  protected override update(dt: number): void {
    // 更新DuckMode音量
    this.updateDuckVolume(dt);
    // 更新播放音頻音量
    this.updateClipVolume(dt);
    // 更新音效音量 (Sound / Music)
    this.updateAudioVolume();
  }

  //#region Public Methods
  //================================================
  /**
   * 初始化SoundManager
   */
  public init() {
    this.audioEngine = new AudioEngine(this.node);

    this.soundChannel = new Array<AudioInfo>(this.channel);
    this.musicChannel = new Map<string, AudioInfo>();

    //監測介面預設隱藏
    this.activeMonitor(false);

    //遊戲暫停處理
    game.on(Game.EVENT_HIDE, this.onGamePause, this);
    game.on(Game.EVENT_SHOW, this.onGameResume, this);

    this.node.on(
      AUDIO_MANAGER_EVENT.KEY_ON_AUDIO_MIXER_FINISH,
      this.onAudioMixerFinish,
      this
    );
  }

  /**
   * 釋放SoundManager資源
   */
  public release() {
    this.node.off(
      AUDIO_MANAGER_EVENT.KEY_ON_AUDIO_MIXER_FINISH,
      this.onAudioMixerFinish,
      this
    );

    /** 釋放AudioMixer資源*/
    this.stopAll();
    this.releaseMixer();

    this.monitor = null;

    if (this.soundChannel) {
      for (const key in this.soundChannel) {
        this.soundChannel[key] = null;
      }
    }
    this.soundChannel = null;
    this.musicChannel?.clear();
    this.musicChannel = null;

    this.audioClipMap?.clear();
    this.audioClipMap = null;

    this.audioEngine?.uncacheAll();
    this.audioEngine?.stopAll();

    if (SoundManager._instance === this) SoundManager._instance = null;

    game.off(Game.EVENT_HIDE, this.onGamePause, this);
    game.off(Game.EVENT_SHOW, this.onGameResume, this);
  }

  /**
   * 在沒有使用中的頻道播放聲音
   * @param audio 音效片段 | 音效名稱
   * @param options 播放選項
   */
  public play(
    audio: AudioClip | string,
    options: AudioPlayOptions = {}
  ): number {
    if (this.isDisablePlaySound) {
      return -1;
    }
    const audioClip: AudioClip = this.getAudioClipByParam(audio);

    if (!SoundManager._instance || !this.soundChannel) return -1;
    if (!audioClip) {
      console.warn('[SoundManager] play: audioClip is null');
      return -1;
    }
    //default
    if (Functions.isNullOrEmpty(options) || typeof options !== 'object') {
      options = {};
    }
    const isMute: boolean = options.isMute ?? false;

    const audioId: number = this.playMixerClip(audioClip.name);
    //音效資訊
    const audioInfo: AudioInfo = {
      name: audioClip.name,
      id: audioId,
      mute: isMute,
      music: false,
      event: new Signal(),
    };
    this.audioEngine.setVolume(audioId, this.getAudioFinalVolume(audioInfo));

    //暫停狀態
    if (this.isPause) this.pause(audioId);

    //取得閒置頻道 若無則擴增
    let idleCh: number = this.getIdleSoundChannel();
    if (idleCh === -1) {
      //記錄播放音效資訊
      this.soundChannel.push(audioInfo);
      idleCh = this.soundChannel.length;
    } else {
      //記錄播放音效資訊
      this.soundChannel[idleCh] = audioInfo;
    }
    //播完自動移除
    this.setFinishCallback(
      audioId,
      () => {
        this.removeAudioInfo(audioId);
      },
      this,
      -1
    );

    //超出頻道上限警示
    if (this.soundChannel.length >= this.channelLimit)
      console.warn('[SoundManager] Out limit.', this.soundChannel);
    // if (Define.DEBUG_LOG) console.log('[SoundManager] play audio end');
    return audioId;
  }

  /**
   * 於指定頻道播放聲音
   * @param chID 頻道ID
   * @param options 播放選項
   */
  public playOn(
    chID: number,
    audio: AudioClip | string,
    options: AudioPlayOnOptions = {}
  ): number {
    const audioClip: AudioClip = this.getAudioClipByParam(audio);

    if (!SoundManager._instance || !this.soundChannel) return -1;
    if (!audioClip) {
      console.warn('[SoundManager] playOn: audioClip is null');
      return -1;
    }
    if (chID >= this.channel) {
      console.warn('[SoundManager] playOn: wrong channel', chID);
      return -1;
    }
    //default
    if (Functions.isNullOrEmpty(options) || typeof options !== 'object') {
      options = {};
    }
    const isMute: boolean = options.isMute ?? false;
    const needOccupy: boolean = options.needOccupy ?? false;

    //停止播放中聲音
    this.stopOn(chID, needOccupy);

    //播放音效
    const audioId: number = this.playMixerClip(audioClip.name);
    //音效資訊
    const audioInfo: AudioInfo = {
      name: audioClip.name,
      id: audioId,
      mute: isMute,
      music: false,
      event: new Signal(),
    };
    this.audioEngine.setVolume(audioId, this.getAudioFinalVolume(audioInfo));

    //暫停狀態
    if (this.isPause) this.pause(audioId);

    //記錄播放音效資訊
    this.soundChannel[chID] = audioInfo;
    //播完自動清除
    this.setFinishCallback(
      audioId,
      () => {
        if (needOccupy === true) {
          this.clearAudioInfo(audioId);
        } else {
          this.removeAudioInfo(audioId);
        }
      },
      this,
      -1
    );

    return audioId;
  }

  /**
   * 播放背景音樂 (正在播放的音樂將記錄在lastMusic)
   * @param audio 音效片段 | 音效名稱
   * @param options 播放選項
   */
  public playMusic(
    audio: AudioClip | string,
    options: AudioPlayMusicOptions = {}
  ): number {
    const audioClip: AudioClip = this.getAudioClipByParam(audio);

    if (!SoundManager._instance) return -1;
    if (!audioClip) {
      console.warn('[SoundManager] playMusic: audioClip is null');
      return -1;
    }
    //default
    if (Functions.isNullOrEmpty(options) || typeof options !== 'object') {
      options = {};
    }
    const isMute: boolean = options.isMute ?? false;
    const isCrossFade: boolean = options.isCrossFade ?? false;
    const stopAudioID: number = options.stopAudioID ?? this.lastMusic?.id ?? -1;

    if (!isCrossFade) {
      //停止播放中音樂
      this.stopMusic(stopAudioID);
    }

    //播放音樂
    const audioId: number = this.playMixerClip(audioClip.name);
    //音樂資訊
    const audioInfo: AudioInfo = {
      name: audioClip.name,
      id: audioId,
      mute: isMute,
      music: true,
    };
    this.audioEngine.setVolume(audioId, this.getAudioFinalVolume(audioInfo));

    //TODO: 修正 未設定漸變時造成的音樂播放音量異常
    //交叉漸變
    if (isCrossFade) {
      this.fadeIn(audioId);

      if (this.lastMusic) {
        const lastAudioId: number = this.lastMusic.id;
        const lastAudioName: string = this.lastMusic.name;

        this.fadeOut(lastAudioId);

        if (stopAudioID !== -1)
          setTimeout(
            () => {
              this.stopMusic(stopAudioID);
            },
            (this.getMixerClip(lastAudioName)?.fadeOutTime ?? 0) * 1000
          );
      }
    }

    //暫停狀態
    if (this.isPause) this.pause(audioId);

    //記錄播放音樂資訊
    this.lastMusic = audioInfo;
    this.musicChannel.set(String(audioId), audioInfo);

    return audioId;
  }

  /**
   * 停止播放聲音/音樂
   * @param audio 初始音效ID | 音效名稱
   */
  public stop(audio: number | string) {
    if (!SoundManager._instance || !this.audioEngine) return;

    //停止聲音並移除所在頻道音效資訊
    this.removePlayingInfo(audio, realAudioId => {
      this.audioEngine.stop(realAudioId);

      this.removeAudioInfo(typeof audio === 'number' ? audio : realAudioId);
    });
  }

  /**
   * 停止指定頻道聲音
   * @param chID
   * @param needOccupy 停止後是否需要佔頻道
   */
  public stopOn(chID: number, needOccupy = false) {
    if (!SoundManager._instance || !this.soundChannel || !this.audioEngine)
      return;

    if (chID >= this.channel) {
      console.warn('[SoundManager] stopOn: wrong channel', chID);
      return;
    }
    const targetAudioInfo: AudioInfo = this.soundChannel[chID];
    if (!targetAudioInfo || targetAudioInfo.id === -1) return;
    //default
    if (Functions.isNullOrEmpty(needOccupy)) needOccupy = false;

    const audioId: number = targetAudioInfo.id;
    //停止聲音並移除所在頻道音效資訊
    this.removePlayingInfo(audioId, realAudioId => {
      this.audioEngine.stop(realAudioId);

      if (needOccupy === true) {
        this.clearAudioInfo(audioId);
      } else {
        this.removeAudioInfo(audioId);
      }
    });
  }

  /**
   * 停止播放音樂
   * @param audioId 初始音效ID 若無則停止全部音樂
   */
  public stopMusic(audioId?: number) {
    if (!SoundManager._instance || !this.audioEngine || !this.musicChannel)
      return;

    if (Functions.isNullOrEmpty(audioId)) {
      const keys: string[] = Array.from(this.musicChannel.keys());
      for (const idStr of keys) {
        const idNum = Number(idStr);
        this.removePlayingInfo(idNum, realAudioId => {
          this.audioEngine.stop(realAudioId);
        });
        this.removeAudioInfo(idNum);
      }
    } else {
      this.removePlayingInfo(audioId, realAudioId => {
        this.audioEngine.stop(realAudioId);
      });
      this.removeAudioInfo(audioId);
    }
  }

  /**
   * 所有頻道的聲音、音樂暫停
   * @param isPause
   */
  public pauseAll(isPause = true) {
    if (
      !SoundManager._instance ||
      !this.soundChannel ||
      !this.musicChannel ||
      isPause === this.isPause
    )
      return;
    //default
    if (Functions.isNullOrEmpty(isPause)) isPause = true;

    //切換暫停狀態
    this.isPause = isPause;

    //聲音
    let audioInfo: AudioInfo = null;
    for (
      let chID = 0, len: number = this.soundChannel.length;
      chID < len;
      chID++
    ) {
      audioInfo = this.soundChannel[chID];
      if (audioInfo && audioInfo.id !== -1) {
        if (this.isPause) {
          this.pause(audioInfo.id);
        } else {
          this.resume(audioInfo.id);
        }
      }
    }
    //音樂
    this.musicChannel.forEach((audioInfo: AudioInfo, audioId: string) => {
      if (this.isPause) {
        this.pause(Number(audioId));
      } else {
        this.resume(Number(audioId));
      }
    });
  }

  /**
   * 暫停播放音效
   * @param audioId 初始音效ID
   */
  public pause(audioId: number) {
    if (!this.audioEngine) return;

    this.audioEngine.pause(this.getNewId(audioId));
  }

  /**
   * 恢復播放音效
   * @param audioId 初始音效ID
   */
  public resume(audioId: number) {
    if (!this.audioEngine) return;

    this.audioEngine.resume(this.getNewId(audioId));
  }

  public disablePlaySound(isDisable: boolean) {
    this.isDisablePlaySound = isDisable;
  }

  /**
   * 佔頻道
   * @param chID
   */
  public occupySoundChannel(chID: number) {
    if (!this.soundChannel) return;
    if (chID >= this.channel) {
      console.warn('[SoundManager] PlayOn: wrong channel', chID);
      return;
    }

    //音效資訊
    const audioInfo: AudioInfo = {
      name: '',
      id: -1,
      mute: false,
      music: false,
      event: new Signal(),
    };
    //記錄播放音效資訊
    this.soundChannel[chID] = audioInfo;
  }
  //================================================
  //#endregion Public Methods

  //#region Public Get Methods
  //================================================
  /**
   * 取得聲音音量
   */
  public getSoundVolume(): number {
    return this.soundVolume;
  }

  /**
   * 取得音樂音量
   */
  public getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * 取得聲音是否靜音
   */
  public getIsSoundMute(): boolean {
    return this.isSoundMute;
  }

  /**
   * 取得音樂是否靜音
   */
  public getIsMusicMute(): boolean {
    return this.isMusicMute;
  }

  /**
   * 取得是否為靜音
   */
  public getIsMute(): boolean {
    return this.isMute;
  }

  /**
   * 取得是否為暫停
   */
  public getIsPause(): boolean {
    return this.isPause;
  }

  /**
   * 取得音樂長度
   * @param audioId
   */
  public getDuration(audioId: number): number {
    if (!this.audioEngine) return 0;

    return this.audioEngine.getDuration(this.getNewId(audioId));
  }
  //================================================
  //#endregion Public Get Methods

  //#region Public Set Methods
  //================================================
  /**
   * 設定遊戲聲音音量
   * @param volume
   */
  public setGameSoundVolume(volume: number) {
    //音量僅在 0 ~ 1
    volume = Functions.clamp(0, 1, volume);
    //限制音量小數
    volume = Number(volume.toFixed(4));

    this.soundVolume = volume;

    this.updateSoundAudioVolume();
  }

  /**
   * 設定遊戲音樂音量
   * @param volume
   */
  public setGameMusicVolume(volume: number) {
    //音量僅在 0 ~ 1
    volume = Functions.clamp(0, 1, volume);
    //限制音量小數
    volume = Number(volume.toFixed(4));

    this.musicVolume = volume;

    this.updateMusicAudioVolume();
  }

  /**
   * 設定遊戲聲音靜音
   * @param isMute
   */
  public setGameSoundMute(isMute: boolean) {
    this.isSoundMute = isMute;

    this.updateSoundAudioVolume();
  }

  /**
   * 設定遊戲音樂靜音
   * @param isMute
   */
  public setGameMusicMute(isMute: boolean) {
    this.isMusicMute = isMute;

    this.updateMusicAudioVolume();
  }

  /**
   * 設定遊戲靜音
   * @param isMute
   */
  public setGameMute(isMute: boolean) {
    this.isMute = isMute;

    this.updateAudioVolume();

    //全域靜音狀態
    PlatformData.isMute = this.isMute;
  }

  /**
   * 調整指定音效是否靜音
   * @param audioId 初始音效ID
   */
  public setAudioMute(audioId: number, isMute = true) {
    if (!SoundManager._instance || !this.audioEngine) return;

    const audioInfo: AudioInfo = this.getAudioInfoByAudioId(audioId);
    if (!audioInfo) return;

    if (isMute === audioInfo.mute) return;

    //default
    if (Functions.isNullOrEmpty(isMute)) isMute = true;

    audioInfo.mute = isMute;

    this.audioEngine.setVolume(
      this.getNewId(audioInfo.id),
      this.getAudioFinalVolume(audioInfo)
    );
  }

  /**
   * 設定指定group靜音
   */
  public setGroupMute(groupName: string, mute: boolean): void {
    const mixerGroup: MixerGroup = this.getMixerGroup(groupName);
    if (Functions.isNullOrEmpty(mixerGroup)) {
      console.warn(
        '[SoundManager] setGroupMute - cant find group: ' + groupName
      );
      return;
    }
    mixerGroup.mute = mute;

    this.checkGroupSoundable();

    //符合group的audioInfo同步mute狀態
    this.setGroupMuteState(groupName, mute);
  }

  /**
   * 註冊聲音結束Callback
   * (非循環的單次播放或指定次數循環播放結束後觸發)
   * @param audioId 初始音效ID
   * @param callback
   * @param target
   * @param priority 預設最低為0, -1為最終移除事件
   */
  public setFinishCallback(
    audioId: number,
    callback: Function,
    target,
    priority = 0
  ) {
    if (!SoundManager._instance || !this.audioEngine) return;
    //default
    if (Functions.isNullOrEmpty(priority)) priority = 0;

    const audioInfo: AudioInfo = this.getAudioInfoByAudioId(audioId);
    if (audioInfo) {
      //結束事件
      const event: Signal = audioInfo.event;
      if (event) {
        //Signal事件
        //callback
        event.addOnce(callback, target, priority);
        //僅需設定一次 避免重複觸發
        if (event.getNumListeners() === 1)
          setRecursiveFinishCallback(
            audioId,
            () => {
              event.dispatch();
            },
            this
          );
      } else {
        //無Signal事件
        setRecursiveFinishCallback(
          audioId,
          () => {
            callback.call(target);
          },
          this
        );
      }
    } else {
      console.warn(
        '[SoundManager] setFinishCallback - audioId not found',
        audioId
      );
    }

    /** 設定會檢查播放中的音效是否播放完畢 若未播放完畢則再次設定 */
    function setRecursiveFinishCallback(
      audioId: number,
      onFinish: Function,
      soundManager: SoundManager
    ) {
      soundManager.audioEngine.setFinishCallback(
        soundManager.getNewId(audioId),
        () => {
          const playingInfo: PlayingInfo = soundManager.getPlayingInfo(
            soundManager.getNewId(audioId)
          );
          // 僅在「還有 playingInfo 且為多段 loop 未播完」時才 reschedule；單次播放(loopTimes<=0)一律清理，避免殭屍留在 soundChannel 導致關不掉
          if (playingInfo && playingInfo.loopTimes > 0) {
            setRecursiveFinishCallback(audioId, onFinish, soundManager);
          } else {
            onFinish();
          }
        }
      );
    }
  }

  /**
   * 設定音效片段清單
   * @param audioClips
   * @param audioClipsName
   */
  public setAudioClip(audioClips: AudioClip[], audioClipsName: string[]) {
    if (!this.audioClipMap)
      this.audioClipMap = new Dictionary<string, AudioClip>();

    if (audioClipsName.length > 0) {
      for (let i = 0; i < audioClips.length; i++) {
        if (!audioClips[i]) continue;
        let clipName: string = audioClips[i].name;
        if (audioClipsName[i] !== '') clipName = audioClipsName[i];

        if (!this.audioClipMap.containsKey(clipName)) {
          this.audioClipMap.add(clipName, audioClips[i]);
        }
      }
    } else {
      for (let i = 0; i < audioClips.length; i++) {
        if (!this.audioClipMap.containsKey(audioClips[i].name)) {
          this.audioClipMap.add(audioClips[i].name, audioClips[i]);
        }
      }
    }
  }
  //================================================
  //#endregion Public Set Methods

  //#region Protected Get Methods
  //================================================
  /**
   * 使用audioId來查詢頻道上的AudioInfo (Sound / Music)
   * @param audioId 初始音效ID
   */
  protected getAudioInfoByAudioId(audioId: number): AudioInfo {
    if (!SoundManager._instance || !this.soundChannel || !this.musicChannel)
      return null;

    let audioInfo: AudioInfo = this.musicChannel.get(String(audioId));
    //如果音樂頻道存在內容 則直接返回
    if (audioInfo) return audioInfo;
    //否則遍歷聲音頻道
    for (
      let chID = 0, len: number = this.soundChannel.length;
      chID < len;
      chID++
    ) {
      audioInfo = this.soundChannel[chID];
      if (audioInfo && audioInfo.id === audioId) {
        return audioInfo;
      }
    }

    return null;
  }
  //================================================
  //#endregion Protected Get Methods

  //#region Protected Set Methods
  //================================================

  //================================================
  //#endregion Protected Set Methods

  //#region Private Methods
  //================================================
  /**
   * 更新音效音量
   */
  private updateAudioVolume() {
    if (!SoundManager._instance || !this.audioEngine) return;

    //音樂
    this.updateMusicAudioVolume();
    //聲音
    this.updateSoundAudioVolume();
  }

  /**
   * 更新聲音音量
   * @param isMute
   */
  private updateSoundAudioVolume() {
    if (!SoundManager._instance || !this.soundChannel || !this.audioEngine)
      return;

    //聲音
    let audioInfo: AudioInfo = null;
    for (
      let chID = 0, len: number = this.soundChannel.length;
      chID < len;
      chID++
    ) {
      audioInfo = this.soundChannel[chID];
      if (!audioInfo || audioInfo.id === -1) continue;

      const realId: number = this.getNewId(audioInfo.id);
      const state: number = this.audioEngine.getState(realId) as number;
      const {INTERRUPTED, STOPPED} = this.audioEngine.AudioState;
      // 引擎已無此 id（INTERRUPTED）或 clip 已播完（STOPPED 但 ENDED 未觸發）：完整清理並回收 source，避免殭屍導致關不掉
      if (state === INTERRUPTED || state === STOPPED) {
        // 先派發 finish 事件，確保外部透過 setFinishCallback 註冊的收尾會在 remove/dispose 前執行
        this.dispatchFinishEvent(audioInfo.id);

        this.removePlayingInfo(audioInfo.id, (realIdToStop: number) => {
          this.audioEngine.stop(realIdToStop);
          this.removeAudioInfo(audioInfo.id);
        });
        this.removeAudioInfo(audioInfo.id); // 無論 playingClips 是否已清，都從 soundChannel 移除
        continue;
      }

      this.audioEngine.setVolume(realId, this.getAudioFinalVolume(audioInfo));
    }
  }

  /**
   * 更新音樂音量
   */
  private updateMusicAudioVolume() {
    if (!SoundManager._instance || !this.musicChannel || !this.audioEngine)
      return;

    this.musicChannel.forEach((audioInfo: AudioInfo, audioId: string) => {
      this.audioEngine.setVolume(
        this.getNewId(Number(audioId)),
        this.getAudioFinalVolume(audioInfo)
      );
    });
  }

  /**
   * 依參數型態取得音效片段
   * @param audio 音效片段 | 音效名稱
   * @returns AudioClip
   */
  private getAudioClipByParam(audio: AudioClip | string): AudioClip {
    if (typeof audio !== 'string') {
      return audio;
    }

    if (audio === '') {
      console.warn('[SoundManager] getAudioClipByParam: audio name is empty');
      return null;
    }

    if (!this.audioClipMap) {
      console.warn('[SoundManager] getAudioClipByParam: audioClipMap is null');
      return null;
    }

    return this.audioClipMap.getValue(audio);
  }

  /**
   * 播放混音片段
   * @param clipName 音效片段名稱
   * @returns 初始音效ID
   */
  private playMixerClip(clipName: string): number {
    if (!SoundManager._instance || !this.audioEngine) return -1;

    let mixerClip: MixerClip = this.getMixerClip(clipName);
    let audioId = -1;

    if (!mixerClip?.clip) {
      // 如果音效不存在 則重新載入音效列表
      // 並再次嘗試取得音效
      SoundManager._instance.node.emit(AUDIO_MANAGER_EVENT.KEY_UPDATE_CLIPS);
      mixerClip = this.getMixerClip(clipName);
    }

    if (mixerClip?.clip) {
      audioId = this.audioEngine.play(
        mixerClip.clip,
        mixerClip.loop === -1,
        this.getSoundable(mixerClip) ? this.getClipVolume(mixerClip, false) : 0
      );
      // 加入至播放列表中
      this.addClipToPlayingList(clipName, audioId);
      this.audioEngine.setFinishCallback(audioId, () => {
        this.onAudioClipFinish(clipName, audioId);
      });
      // ShowLog
      if (this.AudioLog) this.AudioLog(clipName);
      this.refreshUiTable();
    } else {
      console.error(`[SoundManager] playMixerClip "${clipName}" not found!`);
    }

    return audioId;
  }

  /**
   * 移除播放中音檔資訊
   * @param audio 初始音效ID | 音效名稱
   * @param onRemove
   */
  private removePlayingInfo(
    audio: number | string,
    onRemove: (realAudioId: number) => void
  ) {
    if (!SoundManager._instance || !this.playingClips) return;

    if (typeof audio === 'number') {
      const newAudioId: number = this.getNewId(audio);
      for (const playingClip of this.playingClips.values()) {
        if (playingClip.has(newAudioId)) {
          playingClip.delete(newAudioId);
          delete this.audioIdMap[audio];
          onRemove?.(newAudioId);
          this.refreshUiTable();
          break;
        }
      }
    } else {
      const playingClip = this.playingClips.get(audio);
      if (playingClip) {
        playingClip.forEach((playingInfo, audioId) => {
          delete this.audioIdMap[audioId];
          onRemove?.(audioId);
        });
        this.playingClips.delete(audio);
        this.refreshUiTable();
      } else {
        console.error(
          `[SoundManager] removePlayingInfo ${audio} not found in playingClips!`
        );
      }
    }
  }

  /**
   * 清除AudioInfo
   * 佔用頻道
   * @param audioId 初始音效ID
   */
  private clearAudioInfo(audioId: number) {
    if (!SoundManager._instance || !this.soundChannel || !this.musicChannel)
      return;

    const audioInfo: AudioInfo = this.getAudioInfoByAudioId(audioId);
    if (audioInfo) {
      audioInfo.name = '';
      audioInfo.id = -1;
      audioInfo.mute = false;
      //signal物件清除
      if (audioInfo.event) {
        audioInfo.event.dispose();
        audioInfo.event = null;
      }
    } else {
      console.warn('[SoundManager] clearAudioInfo: audioId not found', audioId);
    }
  }

  /**
   * 移除AudioInfo
   * 不佔用頻道
   * @param audioId 初始音效ID
   */
  private removeAudioInfo(audioId: number) {
    if (!SoundManager._instance || !this.soundChannel) return;

    //檢查音樂
    if (this.musicChannel && this.musicChannel.has(String(audioId))) {
      //音樂頻道清空
      this.musicChannel.delete(String(audioId));
      return;
    }
    //檢查聲音
    let audioInfo: AudioInfo = null;
    for (
      let chID = 0, len: number = this.soundChannel.length;
      chID < len;
      chID++
    ) {
      audioInfo = this.soundChannel[chID];
      if (audioInfo && audioInfo.id === audioId) {
        //signal物件清除
        if (audioInfo.event) {
          audioInfo.event.dispose();
          audioInfo.event = null;
        }
        //指定頻道清空
        this.soundChannel[chID] = null;
        //暫存頻道移除
        if (chID >= this.channel) this.soundChannel.splice(chID, 1);

        return;
      }
    }

    // 可能已被其他路徑清理 不重複 warn
    // console.warn('[SoundManager] removeAudioInfo: audioId not found', audioId);
  }

  /**
   * 取得閒置聲音頻道
   */
  private getIdleSoundChannel(): number {
    if (!SoundManager._instance || !this.soundChannel) return -1;

    let tmpChannel: AudioInfo = null;
    for (
      let chID = 0, len: number = this.soundChannel.length;
      chID < len;
      chID++
    ) {
      tmpChannel = this.soundChannel[chID];
      if (
        !tmpChannel ||
        (tmpChannel.id !== -1 &&
          this.audioEngine.getState(tmpChannel.id) ===
            this.audioEngine.AudioState.INTERRUPTED)
      ) {
        //signal物件清除
        if (tmpChannel && tmpChannel.event) {
          tmpChannel.event.dispose();
          tmpChannel.event = null;
        }
        return chID;
      }
    }
    return -1;
  }

  /**
   * 取得音效最終音量
   * @description 靜音條件：全域靜音、音效靜音、音效是否可播放
   * @param audioInfo 音效資訊
   * @returns 混音片段的目前音量(受漸變影響)
   */
  private getAudioFinalVolume(
    audioInfo: AudioInfo,
    mixerClip?: MixerClip,
    playingInfo?: PlayingInfo
  ): number {
    if (!audioInfo || audioInfo.id === -1) return 0;
    //default
    if (Functions.isNullOrEmpty(mixerClip))
      mixerClip = this.getMixerClip(audioInfo.name);
    if (Functions.isNullOrEmpty(playingInfo))
      playingInfo = this.getPlayingInfo(this.getNewId(audioInfo.id));

    if (!mixerClip || !playingInfo) {
      return 0;
    }

    if (audioInfo.music && this.isMusicMute === true) {
      return 0;
    } else if (!audioInfo.music && this.isSoundMute === true) {
      return 0;
    }

    return this.isMute || audioInfo.mute || !this.getSoundable(mixerClip)
      ? 0
      : (audioInfo.music ? this.musicVolume : this.soundVolume) *
          this.getClipVolume(mixerClip, false, playingInfo);
  }

  /**
   * 取得聲音狀態字串
   * @param audioId 初始音效ID
   */
  private getAudioStateString(audioId: number): string {
    if (!SoundManager._instance || !this.audioEngine) return '';

    return this.audioEngine.AudioState[
      this.audioEngine.getState(this.getNewId(audioId))
    ];
  }

  private setGroupMuteState(groupName: string, mute: boolean): void {
    // 符合group的audioInfo同步mute狀態
    for (let i = 0; i < this.soundChannel.length; i++) {
      const audioInfo: AudioInfo = this.soundChannel[i];
      if (!audioInfo || audioInfo.id === -1) continue;

      const mixerClip: MixerClip = this.getMixerClip(audioInfo.name);
      if (!mixerClip || mixerClip.group !== groupName) continue;

      audioInfo.mute = mute;
    }
  }

  /**
   * 遊戲暫停
   */
  private onGamePause() {
    if (PlatformData.isBackgroundUpdate) return;

    this.pauseAll(true);
  }

  /**
   * 遊戲繼續
   */
  private onGameResume() {
    //確定是休眠回來的狀態
    if (!this.isPause) return;

    this.pauseAll(false);
  }
  //================================================
  //#endregion Private Methods

  //#region Audio Monitor
  //================================================
  public getMonitorState(): boolean {
    return this.monitor ? this.monitor.active : false;
  }
  /**
   * 顯示監測介面
   * @param isOn
   */
  public activeMonitor(isOn: boolean) {
    if (!SoundManager._instance) return;
    if (!this.monitor) {
      console.warn('[SoundManager] monitor is null');
      return;
    }
    const monitorBG: Sprite = this.monitor
      .getChildByName('BG')
      .getComponent(Sprite);
    if (!monitorBG) {
      console.warn('[SoundManager] monitor bg is null');
      return;
    }
    const monitorLabel: Label = this.monitor
      .getChildByName('Label')
      .getComponent(Label);
    if (!monitorLabel) {
      console.warn('[SoundManager] monitor label is null');
      return;
    }
    if (isOn === this.monitor.active) return;

    //開關處理
    if (isOn) {
      //開啟
      this.monitor.active = true;
      //座標初始化
      this.monitor.setPosition(v3());
      //除錯資訊
      const debugInfo = (title: string, audioInfo: AudioInfo) => {
        const newId: number = this.getNewId(audioInfo?.id);
        const debugInfo: string =
          `[${title}] ` +
          (audioInfo
            ? `name: ${audioInfo.name}, id: ${audioInfo.id}${newId === audioInfo?.id ? '' : ' (' + newId + ')'}, vol: ${this.getAudioFinalVolume(audioInfo).toFixed(2)}, mute: ${audioInfo.mute}, state: ${this.getAudioStateString(audioInfo.id)}`
            : 'null') +
          '\n';
        return debugInfo;
      };
      //移除資訊更新 避免重複
      Tween.stopAllByTarget(this.monitor);
      //資訊更新
      tweenNodeEx(this.monitor)
        .to(
          1,
          {opacity: 255},
          {
            onUpdate: () => {
              if (
                !this.monitor ||
                !monitorLabel ||
                !this.soundChannel ||
                !this.musicChannel ||
                !this.audioEngine
              )
                return;
              let baseInfo = '';
              let musicInfo = '';
              let soundInfo = '';
              //基本資訊
              baseInfo =
                'ch: ' +
                this.soundChannel.length +
                '/' +
                this.channel +
                ', pause: ' +
                String(this.isPause).toUpperCase() +
                ', game mute: ' +
                String(this.isMute).toUpperCase() +
                ', audio cnt: ' +
                this.audioEngine['playingAudios'].size +
                '\n' +
                'sfx volume: ' +
                this.soundVolume.toFixed(2) +
                ', sfx Mute: ' +
                this.isSoundMute +
                '\n' +
                'bgm volume: ' +
                this.musicVolume.toFixed(2) +
                ', bgm Mute: ' +
                this.isMusicMute +
                '\n';
              //音樂資訊
              musicInfo = debugInfo('last bgm', this.lastMusic);
              this.musicChannel.forEach(
                (audioInfo: AudioInfo, audioId: string) => {
                  musicInfo += debugInfo('bgm_' + audioId, audioInfo);
                }
              );
              //聲音資訊
              for (
                let i = 0, len: number = this.soundChannel.length;
                i < len;
                i++
              ) {
                soundInfo += debugInfo('ch ' + i, this.soundChannel[i]);
              }
              //顯示文字
              monitorLabel.string =
                'Audio Manager Monitor\n' + baseInfo + musicInfo + soundInfo;
            },
          }
        )
        .repeatForever()
        .start();
    } else {
      //移除資訊更新
      Tween.stopAllByTarget(this.monitor);
      //關閉
      this.monitor.active = false;
    }
    let draggable = false;

    // 保護：滑鼠和觸控都要檢查 不然不要提前return
    if (
      monitorBG.node.hasEventListener(Node.EventType.MOUSE_MOVE) &&
      monitorBG.node.hasEventListener(Node.EventType.TOUCH_MOVE)
    ) {
      return;
    }

    const panelDown = () => {
      draggable = true;
    };
    const panelUp = () => {
      draggable = false;
    };
    const dragPanel = (evt: EventMouse | EventTouch) => {
      if (draggable) {
        let deltaX = 0;
        let deltaY = 0;

        if (evt instanceof EventMouse) {
          // 滑鼠移動差量
          deltaX = evt.getDelta().x;
          deltaY = evt.getDelta().y;
        } else if (evt instanceof EventTouch) {
          // 觸控移動 - 用當前位置 - 上次位置計算
          const touch: EventTouch = evt as EventTouch;
          const current: math.Vec2 = touch.getLocation();
          const previous: math.Vec2 = touch.getPreviousLocation();
          deltaX = (current.x - previous.x) / 2;
          deltaY = (current.y - previous.y) / 2;
        }

        setPosition(
          this.monitor,
          v2(this.monitor.x + deltaX, this.monitor.y + deltaY)
        );
      }
    };
    //拖曳事件
    monitorBG.node.on(Node.EventType.MOUSE_DOWN, panelDown, this);
    monitorBG.node.on(Node.EventType.MOUSE_MOVE, dragPanel, this);
    monitorBG.node.on(Node.EventType.MOUSE_UP, panelUp, this);
    // 觸控拖拉支援
    monitorBG.node.on(Node.EventType.TOUCH_START, panelDown, this);
    monitorBG.node.on(Node.EventType.TOUCH_MOVE, dragPanel, this);
    monitorBG.node.on(Node.EventType.TOUCH_END, panelUp, this);
    monitorBG.node.on(Node.EventType.TOUCH_CANCEL, panelUp, this);
  }
  //================================================
  //#endregion Audio Monitor
  //================================================
  //#endregion SoundManager

  //#region AudioMixer
  //================================================
  private getNewId(_oldId: number): number {
    return this.audioIdMap[_oldId] ?? _oldId;
  }

  //#region UI面板註冊的旗標
  private AudioLog: Function = null;
  private tableFlag = true;
  private refreshUiTable() {
    this.tableFlag = true;
  }
  //#endregion UI面板註冊的旗標

  //#region 事件註冊
  public attachEvent(_type: string, _cb: Function, _target = null) {
    SoundManager._instance.node.on(_type, _cb, _target);
  }
  public detachEvent(_type: string, _cb: Function, _target = null) {
    SoundManager._instance.node.off(_type, _cb, _target);
  }
  //#endregion 事件註冊

  public loadJsonData(_audioMixerFile: JsonAsset) {
    // 一個場景只會有一個設定檔 當有新的設定檔需釋放原始AudioMixer
    // this.releaseMixer();
    this.mixerGroups.clear();
    this.mixerDucks = [];

    this.masterVolume = _audioMixerFile.json['MasterVolume'] ?? 1;
    Object.entries(_audioMixerFile.json['Clips'] ?? {}).forEach(
      ([key, value]) => {
        const mixerClip: MixerClip = this.getMixerClip(key);
        if (mixerClip) mixerClip.setData(value);
        this.loadSceneClips(key, mixerClip ? mixerClip : new MixerClip(value));
      }
    );
    Object.entries(_audioMixerFile.json['Group'] ?? {}).forEach(
      ([key, value]) => {
        this.loadMixerGroup(key, new MixerGroup(value));
      }
    );
    Object.entries(_audioMixerFile.json['Duck'] ?? {}).forEach(
      ([triggerGroupName, value]) => {
        this.loadDuckedGroups(triggerGroupName, value as {});
      }
    );

    // 呼叫事件取得AudioClipLists
    SoundManager._instance.node.emit(AUDIO_MANAGER_EVENT.KEY_UPDATE_CLIPS);

    // 呼叫事件Json更新完成
    SoundManager._instance.node.emit(AUDIO_MANAGER_EVENT.KEY_ON_JSON_LOADED);

    console.group('[AudioMixer] AudioMixerData');
    console.info({
      clips: this.sceneClips,
      mixerGroups: this.mixerGroups,
      mixerDucks: this.mixerDucks,
    });
    console.groupEnd();
  }
  public loadAudioClipList(_listKey: string, _audioList: AudioClip[]) {
    let isAddClips = false;

    _audioList.forEach(audio => {
      if (!audio) return;

      const mixerClip: MixerClip = this.getMixerClip(audio.name);
      if (mixerClip) mixerClip.setData({listKey: _listKey, clip: audio});
      else {
        isAddClips = true;
        this.loadSceneClips(
          audio.name,
          new MixerClip({listKey: _listKey, clip: audio})
        );
      }
    });

    if (isAddClips)
      SoundManager._instance.node.emit(AUDIO_MANAGER_EVENT.KEY_ON_UPDATE_CLIPS);
  }
  private loadSceneClips(_clipName: string, _mixerClip: MixerClip) {
    this.sceneClips.set(_clipName, _mixerClip);
  }
  private loadMixerGroup(
    _groupName: string,
    _mixerGroup: MixerGroup | null = null
  ) {
    // 加入時有相同Key以先加入為主
    if (!this.mixerGroups.has(_groupName)) {
      this.mixerGroups.set(_groupName, _mixerGroup ?? new MixerGroup(null));
    }
  }
  private loadDuckedGroups(
    _triggerGroupName: string,
    _duckedGroups: {[duckedGroupName: string]: DuckedGroup}
  ) {
    const duckedGroups: DuckedGroup[] = [];
    Object.keys(_duckedGroups).forEach(duckedGroupName => {
      duckedGroups.push(
        new DuckedGroup(duckedGroupName, _duckedGroups[duckedGroupName])
      );
    });
    this.setDuckGroups(_triggerGroupName, duckedGroups);
  }

  private getMixerClip(_clipName: string): MixerClip | undefined {
    return this.sceneClips.get(_clipName);
  }
  private getMixerGroup(_groupName: string): MixerGroup | undefined {
    return this.mixerGroups.get(_groupName);
  }
  private getMixerDuck(_triggerGroupName: string): MixerDuck | undefined {
    return (
      this.mixerDucks.find(e => e.triggerGroupName === _triggerGroupName) ??
      undefined
    );
  }
  private setDuckGroups(
    _triggerGroupName: string,
    duckedGroups: DuckedGroup[]
  ) {
    const duckGroupTemp: MixerDuck = this.getMixerDuck(_triggerGroupName);
    if (duckGroupTemp) duckGroupTemp.duckedGroups = duckedGroups;
    else
      this.mixerDucks.push({
        triggerGroupName: _triggerGroupName,
        duckedGroups: duckedGroups,
      });
  }
  private getDuckedGroup(
    _triggerGroupName: string,
    _duckedGroupName: string
  ): DuckedGroup | undefined {
    const duckedGroups: DuckedGroup[] =
      this.getMixerDuck(_triggerGroupName)?.duckedGroups;
    return (
      duckedGroups?.find(e => e.duckedGroupName === _duckedGroupName) ??
      undefined
    );
  }
  private getDuckVolume(_groupName: string): number {
    return this.duckVolumes[_groupName] ?? 1;
  }
  private getPlayingInfo(_audioId: number): PlayingInfo | undefined {
    for (const playingClip of Array.from(this.playingClips.values())) {
      if (playingClip.has(_audioId)) {
        return playingClip.get(_audioId);
      }
    }
    return undefined;
  }
  /** 取得Clip播放音量 Clip音量 * 淡入 * 淡出 * 群組 * DuckMode */
  private getClipVolume(
    _mixerClip: MixerClip,
    _isPreview = true,
    _playingInfo: PlayingInfo = null
  ): number {
    const mixerGroup: MixerGroup = this.getMixerGroup(_mixerClip.group);
    const fadeVolume: number = _isPreview
      ? 1
      : _playingInfo?.getFadeVolume(_mixerClip) ?? 0;
    const oriClipVolume: number = _mixerClip.volume;
    const groupVolume: number = mixerGroup?.volume ?? 1;
    const duckVolume: number = this.getDuckVolume(_mixerClip.group);

    return (
      this.masterVolume * oriClipVolume * fadeVolume * groupVolume * duckVolume
    );
  }

  /** 釋放AudioMixer資源 */
  private releaseMixer() {
    this.sceneClips.clear();
    this.mixerGroups.clear();
    this.mixerDucks = [];
  }

  public stopAll() {
    this.playingClips.forEach(playingClip => {
      playingClip.forEach((settingInfo, audioId) => {
        this.audioEngine.stop(audioId);
      });
    });
    this.previewingClips.forEach(audioId => {
      this.audioEngine.stop(audioId);
    });

    this.playingClips.clear();
    this.previewingClips.clear();
    this.audioIdMap = {};
  }

  public fadeIn(_audioId: number) {
    this.fade(_audioId, FadeType.FadeIn);
  }
  public fadeOut(_audioId: number) {
    this.fade(_audioId, FadeType.FadeOut);
  }
  public fade(_audioId: number, _fadeType: FadeType) {
    const audioId: number = this.getNewId(_audioId);
    const playingInfo: PlayingInfo = this.getPlayingInfo(audioId);
    if (playingInfo) playingInfo.setAudioFade(_fadeType);
  }

  private addClipToPlayingList(
    _clipName: string,
    _audioId: number
  ): PlayingInfo {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    const mixerGroup: MixerGroup = this.getMixerGroup(mixerClip.group);
    this.checkLimit(_clipName, mixerClip, mixerGroup);

    // 加至播放清單
    const playingInfo: PlayingInfo = new PlayingInfo(mixerClip, _audioId);
    if (this.playingClips.has(_clipName)) {
      this.playingClips.get(_clipName).set(_audioId, playingInfo);
    } else {
      const playingClipMap = new Map();
      playingClipMap.set(_audioId, playingInfo);
      this.playingClips.set(_clipName, playingClipMap);
    }

    this.audioClips.set(_audioId, _clipName);

    return playingInfo;
  }

  /** 確認有無超過數量限制 */
  private checkLimit(
    _clipName: string,
    _mixerClip: MixerClip,
    _mixerGroup: MixerGroup
  ): boolean {
    // 確認Group有無超過設定上限
    if (_mixerGroup) {
      const limit: number = _mixerGroup.limit;
      const limitType: LimitType = _mixerGroup.limitType;
      const audioQueue: number[] = [];

      // limit設定不為0才啟用group limit
      if (limit !== 0) {
        this.playingClips.forEach((playingClip, clipName) => {
          if (playingClip.size !== 0) {
            const mixerClip: MixerClip = this.getMixerClip(clipName);
            if (mixerClip.group === _mixerClip.group) {
              Array.prototype.push.apply(
                audioQueue,
                [...playingClip.values()].map(playingInfo => playingInfo.initId)
              );
            }
          }
        });

        if (limit <= audioQueue.length) {
          switch (limitType) {
            case LimitType.first:
              audioQueue.sort((a, b) => a - b); // 小到大
              break;
            case LimitType.last:
              audioQueue.sort((a, b) => b - a); // 大到小
              break;
          }
          const audioIdList: number[] = audioQueue.slice(
            0,
            audioQueue.length - limit + 1
          );
          audioIdList.forEach(audioId => {
            this.stop(audioId);
            if (Define.DEBUG_LOG)
              console.log(`[AudioMixer] "${audioId}" out of group limit!`);
          });
          return true;
        }
        return false;
      }
    }

    // 確認Clip有無超過設定上限
    if (this.playingClips.has(_clipName)) {
      const limit: number = _mixerClip.limit;
      const limitType: LimitType = _mixerClip.limitType;
      const playingClip = this.playingClips.get(_clipName);
      if (limit <= playingClip.size) {
        let audioId: number;
        switch (limitType) {
          case LimitType.first:
            audioId = Math.min(
              ...Array.from(
                playingClip.values(),
                playSetting => playSetting.initId
              )
            );
            break;
          case LimitType.last:
            audioId = Math.max(
              ...Array.from(
                playingClip.values(),
                playSetting => playSetting.initId
              )
            );
            break;
        }
        this.stop(audioId);
        if (Define.DEBUG_LOG)
          console.log(`[AudioMixer] "${_clipName}" out of clipSetting limit!`);
        return true;
      }
    }
    return false;
  }
  /** 確認所有音效可否播放聲音 */
  private checkClipSoundable() {
    let haveSoloClip = false;
    // 確認有無開啟solo的clip
    Array.from(this.sceneClips.values(), mixerClip => {
      if (mixerClip.solo) {
        haveSoloClip = true;
      }
    });
    // 確認clip能否播放聲音
    Array.from(this.sceneClips.values(), mixerClip => {
      mixerClip.checkSoundable(haveSoloClip);
    });
  }
  /** 確認所有Group可否播放聲音 */
  private checkGroupSoundable() {
    let haveSoloGroup = false;
    // 確認有無開啟solo的group
    Array.from(this.mixerGroups.values(), mixerGroup => {
      if (mixerGroup.solo) {
        haveSoloGroup = true;
      }
    });
    // 確認group能否播放聲音
    Array.from(this.mixerGroups.values(), mixerGroup => {
      mixerGroup.checkSoundable(haveSoloGroup);
    });
    // 有開啟solo的group 未分組的group須禁音
    this.ungroupedSoundable = !haveSoloGroup;
  }
  private getSoundable(_mixerClip: MixerClip): boolean {
    const clipSoundable: boolean = _mixerClip.soundable;
    let groupSoundable = true;

    const mixerGroup: MixerGroup = this.getMixerGroup(_mixerClip.group);
    if (mixerGroup) groupSoundable = mixerGroup.soundable;
    else groupSoundable = this.ungroupedSoundable;

    return !this.isMute && clipSoundable && groupSoundable;
  }

  private updateDuckVolume(_dt: number) {
    // 更新DuckMode所有音量回復時間
    this.mixerDucks.forEach(mixerDuck => {
      mixerDuck.duckedGroups.forEach(duckedGroup => {
        duckedGroup.updateDuck(_dt);
      });
    });

    // 根據播放、預覽清單判斷是否觸發DuckMode
    this.playingClips.forEach((playingClip, clipName) => {
      const mixerClip: MixerClip = this.getMixerClip(clipName);
      const duckedGroups: DuckedGroup[] = this.getMixerDuck(
        mixerClip.group
      )?.duckedGroups;
      if (duckedGroups) {
        Array.from(playingClip.keys(), audioId => {
          duckedGroups.forEach(duckedGroup => {
            duckedGroup.checkDuck(
              this.audioEngine.getCurrentTime(audioId),
              this.audioEngine.getDuration(audioId)
            );
          });
        });
      }
    });
    this.previewingClips.forEach((audioId, clipName) => {
      const mixerClip: MixerClip = this.getMixerClip(clipName);
      const duckedGroups: DuckedGroup[] = this.getMixerDuck(
        mixerClip.group
      )?.duckedGroups;
      if (duckedGroups) {
        duckedGroups.forEach(duckedGroup => {
          duckedGroup.checkDuck(
            this.audioEngine.getCurrentTime(audioId),
            this.audioEngine.getDuration(audioId)
          );
        });
      }
    });

    // 設定所有Group的DuckMode音量
    this.duckVolumes = {};
    this.mixerDucks.forEach(mixerDuck => {
      mixerDuck.duckedGroups.forEach(duckedGroup => {
        const duckVolume: number = duckedGroup.getDuckVolume();
        if ((this.duckVolumes[duckedGroup.duckedGroupName] ?? 1) > duckVolume)
          this.duckVolumes[duckedGroup.duckedGroupName] = duckVolume;
      });
    });
  }

  /** 更新播放中音效音量 */
  private updateClipVolume(_dt: number) {
    // PlayingClip音量更新
    this.playingClips.forEach((playingClip, clipName) => {
      const mixerClip: MixerClip = this.getMixerClip(clipName);
      playingClip.forEach((playingInfo, audioId) => {
        playingInfo.updateFadeTime(mixerClip, _dt);
      });
    });
    // PreviewClip音量更新
    this.previewingClips.forEach((audioId, clipName) => {
      const mixerClip: MixerClip = this.getMixerClip(clipName);
      this.audioEngine.setVolume(audioId, this.getClipVolume(mixerClip));
    });
  }

  /**
   * AudioMixer 播放結束
   * @param audioId 音效ID
   */
  private onAudioMixerFinish(audioId: number) {
    this.dispatchFinishEvent(audioId);

    this.removeAudioInfo(audioId);
  }

  /**
   * 派發音效結束事件
   * @param audioId 音效ID
   */
  private dispatchFinishEvent(audioId: number) {
    const audioInfo: AudioInfo = this.getAudioInfoByAudioId(audioId);
    if (!audioInfo?.event) return;

    audioInfo.event.dispatch();
  }

  /** 音效結束事件回調 */
  private onAudioClipFinish(_clipName: string, _audioId: number) {
    try {
      const playingClips = this.playingClips.get(_clipName);
      if (!playingClips) return;
      const playingClip: PlayingInfo = playingClips.get(_audioId);
      if (!playingClip) return; // 已被 stop()/limit 等移除
      playingClips.delete(_audioId);

      if (playingClip.loopTimes > 0) {
        // loop尚未結束再播放一次
        playingClip.loopTimes--;
        const mixerClip: MixerClip = this.getMixerClip(_clipName);
        const newAudioId: number = this.audioEngine.play(
          mixerClip.clip,
          false,
          this.getSoundable(mixerClip) ? this.getClipVolume(mixerClip) : 0
        );
        playingClips.set(newAudioId, playingClip);
        this.audioEngine.setFinishCallback(newAudioId, () => {
          this.onAudioClipFinish(_clipName, newAudioId);
        });

        this.audioIdMap[playingClip.initId] = newAudioId;
        // if (Define.DEBUG_LOG) console.log(`[AudioMixer] loop "${_clipName}"`);
      } else if (playingClip.loopTimes === 0) {
        this.node.emit(
          AUDIO_MANAGER_EVENT.KEY_ON_AUDIO_MIXER_FINISH,
          playingClip.initId
        );

        this.audioClips.delete(playingClip.initId);
        delete this.audioIdMap[playingClip.initId];
        this.refreshUiTable();

        // if (Define.DEBUG_LOG) console.log(`[AudioMixer] end "${_clipName}"`);
      } else
        console.error(
          '[AudioMixer] onAudioClipFinish playingClip setting error!'
        );
    } catch (e) {
      console.error(e);
    }
  }

  //#region "SoundManager Setting Function"
  public exportAudioMixerJsonFile() {
    const clipsInfo: {[key: string]: {[key: string]: {}}} = {};
    this.sceneClips.forEach((mixerClip, clipName) => {
      const {listKey} = mixerClip;
      if (!clipsInfo[listKey]) {
        clipsInfo[listKey] = {};
      }
      clipsInfo[listKey][clipName] = mixerClip.toJSON();
    });

    const groupsInfo: {[key: string]: {}} = {};
    this.mixerGroups.forEach((mixerGroup, clipName) => {
      groupsInfo[clipName] = mixerGroup.toJSON();
    });

    const duckModeInfo: {[key: string]: {[key: string]: {}}} = {};
    this.mixerDucks.forEach(mixerDuck => {
      if (!duckModeInfo[mixerDuck.triggerGroupName]) {
        duckModeInfo[mixerDuck.triggerGroupName] = {};
      }
      mixerDuck.duckedGroups.forEach(duckedGroup => {
        duckModeInfo[mixerDuck.triggerGroupName][duckedGroup.duckedGroupName] =
          duckedGroup.toJSON();
      });
    });

    Object.keys(clipsInfo).forEach(fileName => {
      const clips = clipsInfo[fileName];
      const exportJsonFile = {
        MasterVolume: this.masterVolume,
        Clips: clips,
        Group: groupsInfo,
        Duck: duckModeInfo,
      };

      const fileContent: string = JSON.stringify(exportJsonFile, null, 4);
      const blob: Blob = new Blob([fileContent], {type: 'text/plain'});
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName + '.json'; // 設定文件名稱
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });
  }
  public panelSetMasterVolume(_volume: number) {
    this.masterVolume = _volume;
  }
  //#region "Clip Setting Function"
  public setAudioLog(_logFun: Function) {
    this.AudioLog = _logFun;
  }
  public panelSetVolume(_clipName: string, _volume: number) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.volume = _volume;
  }
  public panelSetSolo(_clipName: string, _solo: boolean) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.solo = _solo;

    this.checkClipSoundable();
  }
  public panelSetMute(_clipName: string, _mute: boolean) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.mute = _mute;

    this.checkClipSoundable();
  }
  public panelSetLoop(_clipName: string, _loop: number) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.loop = _loop;

    // 將PlayingClip套用loop設定
    if (this.playingClips.has(_clipName)) {
      Array.from(this.playingClips.get(_clipName), ([key, playingInfo]) => {
        this.audioEngine.setLoop(key, _loop === -1);
        playingInfo.loopTimes = _loop;
      });
    }
  }
  public panelSetGroup(_clipName: string, _groupName: string) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.group = _groupName;
  }
  public panelPreview(_clipName: string) {
    let audioId: number = null;
    const mixerClip: MixerClip = this.getMixerClip(_clipName);

    if (!Functions.isNullOrEmpty(mixerClip)) {
      // 停止先前的播放
      this.panelStopPreview(_clipName);
      audioId = this.audioEngine.play(
        mixerClip.clip,
        false,
        this.getClipVolume(mixerClip)
      );
      this.audioEngine.setFinishCallback(audioId, () => {
        this.previewingClips.delete(_clipName);
        this.refreshUiTable();
      });
      // 加入至預覽清單中
      this.previewingClips.set(_clipName, audioId);
      this.refreshUiTable();
    } else {
      console.error(`[AudioMixer] panelPreview "${_clipName}" not found!`);
    }
  }
  public panelStopPreview(_clipName: string) {
    if (this.previewingClips.has(_clipName)) {
      const oldAudioID: number = this.previewingClips.get(_clipName);
      this.audioEngine.stop(oldAudioID);
      this.previewingClips.delete(_clipName);
      this.refreshUiTable();
    }
  }
  public panelSetFadeIn(_clipName: string, _fadeIn: boolean) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.fadeIn = _fadeIn;
  }
  public panelSetFadeOut(_clipName: string, _fadeOut: boolean) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.fadeOut = _fadeOut;
  }
  public panelSetFadeInTime(_clipName: string, _fadeInTime: number) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.fadeInTime = _fadeInTime;
  }
  public panelSetFadeOutTime(_clipName: string, _fadeOutTime: number) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.fadeOutTime = _fadeOutTime;
  }
  public panelSetLimit(_clipName: string, _limit: number) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.limit =
      _limit < this.audioEngine.getMaxAudioInstance()
        ? _limit
        : this.audioEngine.getMaxAudioInstance();
  }
  public panelSetLimitType(_clipName: string, _limitType: LimitType) {
    const mixerClip: MixerClip = this.getMixerClip(_clipName);
    mixerClip.limitType = _limitType;
  }
  //#endregion "Clip Setting Function"
  //#region "Group Setting Function"
  public panelAddGroup(_groupName: string): boolean {
    if (this.mixerGroups.has(_groupName)) return false;

    this.loadMixerGroup(_groupName);
    this.checkGroupSoundable();
    return true;
  }
  public panelDeleteGroup(_groupName: string) {
    this.mixerGroups.delete(_groupName);
    this.checkGroupSoundable();

    // 判斷所有clip是否為刪除的Group,是則取消
    this.sceneClips.forEach(mixerClip => {
      if (mixerClip.group === _groupName) {
        mixerClip.group = '';
      }
    });

    // 確認DuckMode連動刪除
    this.panelDeleteTriggerDuck(_groupName);
    this.mixerDucks.forEach(mixerDuck => {
      if (
        mixerDuck.duckedGroups.some(
          duckedGroup => duckedGroup.duckedGroupName === _groupName
        )
      ) {
        this.panelDeleteDuckedGroup(mixerDuck.triggerGroupName, _groupName);
      }
    });
  }
  public panelRenameGroup(_lastName: string, _newName: string): boolean {
    if (this.mixerGroups.has(_newName)) {
      console.error(`[AudioMixer] panelRenameGroup ${_newName} already exist!`);
      return false;
    }

    const mixerGroup: MixerGroup = this.getMixerGroup(_lastName);
    if (mixerGroup) {
      // 將舊key移除並新增新key
      this.mixerGroups.delete(_lastName);
      this.mixerGroups.set(_newName, mixerGroup);

      // 將所有clip的Group重新命名
      this.sceneClips.forEach(mixerClip => {
        if (mixerClip.group === _lastName) {
          mixerClip.group = _newName;
        }
      });
    }

    // 將所有MixerDuck的Trigger重新命名
    this.mixerDucks.forEach(mixerDuck => {
      if (mixerDuck.triggerGroupName === _lastName)
        mixerDuck.triggerGroupName = _newName;
      // 將所有MixerDuck的DuckedGroup重新命名
      mixerDuck.duckedGroups.forEach(duckedGroup => {
        if (duckedGroup.duckedGroupName === _lastName)
          duckedGroup.duckedGroupName = _newName;
      });
    });
    return true;
  }
  public panelSetGroupVolume(_groupName: string, _volume: number) {
    const mixerGroup: MixerGroup = this.getMixerGroup(_groupName);
    mixerGroup.volume = _volume;
  }
  public panelSetGroupSolo(_groupName: string, _solo: boolean) {
    const mixerGroup: MixerGroup = this.getMixerGroup(_groupName);
    mixerGroup.solo = _solo;

    this.checkGroupSoundable();
  }
  public panelSetGroupMute(_groupName: string, _mute: boolean) {
    const mixerGroup: MixerGroup = this.getMixerGroup(_groupName);
    mixerGroup.mute = _mute;

    this.checkGroupSoundable();
  }
  public panelSetGroupLimit(_groupName: string, _limit: number) {
    const mixerGroup: MixerGroup = this.getMixerGroup(_groupName);
    mixerGroup.limit =
      _limit < this.audioEngine.getMaxAudioInstance()
        ? _limit
        : this.audioEngine.getMaxAudioInstance();
  }
  public panelSetGroupLimitType(_groupName: string, _limitType: LimitType) {
    const mixerGroup: MixerGroup = this.getMixerGroup(_groupName);
    mixerGroup.limitType = _limitType;
  }
  //#endregion "Group Setting Function"
  //#region "DuckMode Setting Function"
  public panelAddTriggerDuck(_triggerGroupName: string): boolean {
    if (this.getMixerDuck(_triggerGroupName)) {
      console.error(
        `[AudioMixer] panelAddTriggerDuck this trigger "${_triggerGroupName}" already exist!`
      );
      return false;
    }

    this.setDuckGroups(_triggerGroupName, []);
    return true;
  }
  public panelDeleteTriggerDuck(_triggerGroupName: string) {
    this.mixerDucks = this.mixerDucks.filter(
      e => e.triggerGroupName !== _triggerGroupName
    );
  }
  public panelSwitchTriggerDuck(
    _oldTriggerGroupName: string,
    _newTriggerGroupName: string
  ): boolean {
    if (this.getMixerDuck(_newTriggerGroupName)) return false;

    this.mixerDucks.find(
      e => e.triggerGroupName === _oldTriggerGroupName
    ).triggerGroupName = _newTriggerGroupName;
    return true;
  }
  public panelAddDuckedGroup(
    _triggerGroupName: string,
    _duckedGroupName: string
  ): boolean {
    const duckedGroups: DuckedGroup[] =
      this.getMixerDuck(_triggerGroupName)?.duckedGroups;
    if (!duckedGroups) {
      console.error(
        `[AudioMixer] panelAddDuckedGroup this trigger "${_triggerGroupName}" not found!`
      );
      return false;
    } else if (duckedGroups.find(e => e.duckedGroupName === _duckedGroupName)) {
      console.error(
        `[AudioMixer] panelAddDuckedGroup this ducked "${_duckedGroupName}" already exist!`
      );
      return false;
    }

    duckedGroups.push(new DuckedGroup(_duckedGroupName, null));
    this.setDuckGroups(_triggerGroupName, duckedGroups);
    return true;
  }
  public panelDeleteDuckedGroup(
    _triggerGroupName: string,
    _duckedGroupName: string
  ) {
    let duckedGroups = this.getMixerDuck(_triggerGroupName)?.duckedGroups;
    if (duckedGroups) {
      duckedGroups = duckedGroups.filter(
        e => e.duckedGroupName !== _duckedGroupName
      );
      this.setDuckGroups(_triggerGroupName, duckedGroups);
    }
  }
  public panelSwitchDuckedGroup(
    _triggerGroupName: string,
    _oldDuckedGroupName: string,
    _newDuckedGroupName: string
  ): boolean {
    if (this.getDuckedGroup(_triggerGroupName, _newDuckedGroupName))
      return false;

    this.getDuckedGroup(
      _triggerGroupName,
      _oldDuckedGroupName
    ).duckedGroupName = _newDuckedGroupName;
    return true;
  }
  public panelSetVolCut(
    _triggerGroupName: string,
    _duckedGroupName: string,
    _volume: number
  ) {
    const duckedGroup: DuckedGroup = this.getDuckedGroup(
      _triggerGroupName,
      _duckedGroupName
    );
    if (duckedGroup) duckedGroup.volCut = _volume;
  }
  public panelSetBegUnduck(
    _triggerGroupName: string,
    _duckedGroupName: string,
    _volume: number
  ) {
    const duckedGroup: DuckedGroup = this.getDuckedGroup(
      _triggerGroupName,
      _duckedGroupName
    );
    if (duckedGroup) duckedGroup.begUnduck = _volume;
  }
  public panelSetUnduckTime(
    _triggerGroupName: string,
    _duckedGroupName: string,
    _volume: number
  ) {
    const duckedGroup: DuckedGroup = this.getDuckedGroup(
      _triggerGroupName,
      _duckedGroupName
    );
    if (duckedGroup) duckedGroup.unduckTime = _volume;
  }
  //#endregion "DuckMode Setting Function"
  //#endregion "SoundManager Setting Function"

  //================================================
  //#endregion AudioMixer
}

/** AudioClip資訊 */
export interface AudioInfo {
  /** 音效來源名稱 */
  name: string;
  /** 音效ID */
  id: number;
  /** 音效自身是否為需靜音狀態 (非頻道設定) */
  mute: boolean;
  /** 是否為音樂 */
  music: boolean;
  /** 音效的結束事件 (音樂預設沒有結束事件) */
  event?: Signal;
}

/** 播放參數 */
export interface AudioPlayOptions {
  /** 是否靜音 預設 false */
  isMute?: boolean;
}

/** 指定播放參數 */
export interface AudioPlayOnOptions {
  /** 是否靜音 預設 false */
  isMute?: boolean;
  /** 是否佔用頻道 預設 false */
  needOccupy?: boolean;
}

/** 播放音樂參數 */
export interface AudioPlayMusicOptions {
  /** 是否靜音 預設 false */
  isMute?: boolean;
  /** 是否交叉漸變 預設 false */
  isCrossFade?: boolean;
  /**
   * 要停止的音效 ID。預設為目前 lastMusic 的 ID，若無則為 -1。
   * 若要同時播放多首音樂（不先停止前一首），請設為 -1。
   */
  stopAudioID?: number;
}
