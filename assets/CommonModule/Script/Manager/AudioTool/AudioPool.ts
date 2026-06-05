import {AudioSource, Node} from 'cc';

export class AudioPool {
  private _all: AudioSource[] = [];

  private _pool: AudioSource[] = [];

  private _audioManager: Node = null;

  constructor(audioManager: Node) {
    this._audioManager = audioManager;
  }

  public getAudioSource(audioID: number): AudioSource {
    let audioSource: AudioSource = null;

    if (this._pool.length > 0) {
      audioSource = this._pool.shift();
    } else {
      // Create new node with AudioSource
      const node = new Node(`P_AudioSource${this._all.length}`);
      audioSource = node.addComponent(AudioSource);

      // Add to all pool
      this._all.push(audioSource);

      // Attach node as child
      this._audioManager.addChild(node);
      // if (Define.DEBUG_LOG) console.log(`Get ${node.name}`);
    }

    // Automatically return the AudioSource if stopped
    audioSource.node.targetOff(audioSource.node);
    audioSource.node.on(
      AudioSource.EventType.ENDED,
      () => {
        this.putAudioSource(audioSource);
      },
      audioSource.node
    );
    audioSource.node.name = audioSource.node.name.replace('P_', 'G_');
    // if (Define.DEBUG_LOG) console.log(`Get ${audioSource.node.name}`);

    return audioSource;
  }

  public putAudioSource(audioSource: AudioSource) {
    audioSource.node.name = audioSource.node.name.replace('G_', 'P_');
    // if (Define.DEBUG_LOG) console.log(`Put ${audioSource.node.name}`);

    this.withdrawSource(audioSource);
  }

  /**
   * 回收 AudioSource 回 pool
   * 必須徹底清理 否則會導致：短音效重複播放、場景重載後脫離控制、靜音關不掉
   * 關鍵：clip = null、targetOff 移除所有 ENDED 等監聽
   */
  public withdrawSource(audioSource: AudioSource) {
    if (!audioSource || !audioSource.node) return;
    audioSource.stop();
    audioSource.clip = null;
    audioSource.loop = false;
    audioSource.volume = 0;

    // 延遲徹底清理 確保當前剛觸發的 ENDED 事件可以順利派發給 SoundManager
    setTimeout(() => {
      if (audioSource.node && audioSource.node.isValid) {
        audioSource.node.targetOff(audioSource.node);
        this._pool.push(audioSource);
      }
    }, 0);
  }

  public uncacheAll() {
    this._all?.forEach(audioSource => {
      audioSource.destroy();
    });
    this._pool?.forEach(audioSource => {
      audioSource.destroy();
    });

    this._all = [];
    this._pool = [];
  }

  public stopAll() {
    this._all.forEach(audioSource => {
      this.putAudioSource(audioSource);
    });
    this._pool.forEach(audioSource => {
      this.putAudioSource(audioSource);
    });
  }
}
