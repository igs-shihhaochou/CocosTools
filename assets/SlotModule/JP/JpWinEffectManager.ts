import {_decorator, CCFloat, Component, Enum, Prefab, Node, tween} from 'cc';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {WinEffectCtrl} from '../../CommonModule/Script/Award/WinEffectCtrl';
import {setOpacity} from '../../CommonModule/Script/Utility/NodeProperty';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import NodeEx from '../../CommonModule/Script/Utility/NodeEx';
import {InGameJPType} from './JpType';
const {ccclass, property} = _decorator;

@ccclass('JpWinEffect')
export class JpWinEffect {
  @property({type: Enum(InGameJPType), displayName: 'Win Type'})
  public jpType: InGameJPType = InGameJPType.CLASSIC;
  @property(Prefab)
  public rootObj: Prefab | null = null;
  @property(CCFloat)
  public finishTime = 0;
  @property({displayName: '音效名稱'})
  public clipName = '';
  @property({displayName: 'Fade Out 時間'})
  public audioFadeOutTime = 0;
  @property({displayName: '音效起始音量'})
  public volumeBegin = 1;
  @property({displayName: '音效結束音量'})
  public volumeEnd = 0;
}
@ccclass('JpWinEffectDictionary')
export class JpWinEffectDictionary {
  @property({type: JpWinEffect, displayName: '設定列表'})
  public winSoundList: JpWinEffect[] = [];

  public getWinEffect(jpType: InGameJPType): JpWinEffect {
    for (const winSound of this.winSoundList) {
      if (winSound.jpType === jpType) {
        return winSound;
      }
    }
    return null;
  }

  public getClipName(jpType: InGameJPType): string {
    const winSound = this.getWinEffect(jpType);
    if (winSound) {
      return winSound.clipName;
    } else {
      return '';
    }
  }
}

@ccclass('JpWinEffectManager')
export class JpWinEffectManager extends Component {
  public static finishEvent: Delegate = new Delegate();
  public static beforeFinishEvent: Delegate = new Delegate();

  @property({type: SpawnPool, displayName: '物件池'})
  protected spawnPool: SpawnPool = null;

  @property({type: CCFloat, displayName: '大獎跳過的動畫時間'})
  private skipBigWinAnimDuration = 3;

  @property({type: CCFloat, displayName: '跳過報獎的音效關閉延遲'})
  private skipWinSoundDelay = 0;

  public spGameWinSoundLoopEnable = true;

  @property({type: JpWinEffectDictionary, displayName: '報獎設定'})
  protected winEffectDicionary: JpWinEffectDictionary =
    new JpWinEffectDictionary();

  @property(Node)
  protected blackMask: Node = null;

  protected winEffectCtrl: WinEffectCtrl = null;
  protected winJpType: InGameJPType = InGameJPType.CLASSIC;
  // protected m_WinType: WinType = WinType.NoWin;
  protected isSpecailGame = false;
  private playingWinSoundId: number = undefined;
  private underXTenWinEffectNode: Node = null;
  private activeSkipButton: Function = null;

  public playEffect(
    _winJpType: InGameJPType,
    thisWin: number,
    duration: number
  ) {
    this.winJpType = _winJpType;
    let winEffectFinishTime = duration;

    console.log(
      '[G84_JpWinEffectManager] playEffect',
      _winJpType,
      thisWin,
      duration
    );

    const effectObj: JpWinEffect = this.winEffectDicionary.getWinEffect(
      this.winJpType
    );

    if (effectObj) {
      // 背景壓黑
      this.showBlackMask();

      const effectTrans: Node = this.spawnPool.spawn(
        effectObj.rootObj.data,
        this.node
      );
      effectTrans.scale = effectObj.rootObj.data.scale;
      this.winEffectCtrl =
        effectTrans.getComponent<WinEffectCtrl>(WinEffectCtrl);
      //優化報獎節奏，如果不為0，則讀取客製化滾分時間 2020/8/20
      winEffectFinishTime =
        effectObj.finishTime === 0 ? winEffectFinishTime : effectObj.finishTime;
      this.winEffectCtrl.playEffect(
        thisWin,
        winEffectFinishTime,
        this.stopEffect,
        this
      );
    } else {
      this.stopEffect();
      console.log('[G84_JpWinEffectManager] stopEffect');
    }
  }

  public stopEffect() {
    const effectObj: JpWinEffect = this.winEffectDicionary.getWinEffect(
      this.winJpType
    );
    SlotGDK.instance.eventClickSkipButton.remove(this.onSkipBtnClick, this);
    this.unschedule(this.activeSkipButton);
    const fadeOutDuration =
      effectObj === null ? this.skipWinSoundDelay : effectObj.audioFadeOutTime;
    switch (this.winJpType) {
      case InGameJPType.EPIC:
      case InGameJPType.LEGEND:
      case InGameJPType.RICH:
      case InGameJPType.CLASSIC:
        this.activeSkipBtn(false, 0.01);
        SlotGDK.instance.eventForceStopBigWinEffect.insert(
          this.onForceStopBigWinEffect,
          this
        );
        this.schedule(
          this.despawnAllWinEffect,
          0,
          0,
          this.skipBigWinAnimDuration
        );
        // SlotGameMediator.instance.audioManager.SetVolume(
        //   this.playingWinSoundId,
        //   effectObj.volumeEnd,
        //   fadeOutDuration
        // );
        this.schedule(this.stopWinSound, 0, 0, fadeOutDuration);
        break;
    }
    this.sendBeforeFinishEvent();
  }

  public resetWinEffect() {
    this.spawnPool.despawnAll();
  }

  protected stopSpecialWinSound() {
    if (this.isSpecailGame && this.spGameWinSoundLoopEnable) {
      this.stopWinSound();
      this.playingWinSoundId =
        SlotGameMediator.instance.audioManager.play('win_count_end');
    }
  }

  private sendFinishEvent() {
    console.log('[sendFinishEvent]');
    if (JpWinEffectManager.finishEvent !== null)
      JpWinEffectManager.finishEvent.notify();
  }

  private sendBeforeFinishEvent() {
    // 2024/09/23 隱藏背景壓黑
    this.hideBlackMask();

    if (JpWinEffectManager.beforeFinishEvent !== null)
      JpWinEffectManager.beforeFinishEvent.notify();
  }

  private despawnAllWinEffect() {
    SlotGDK.instance.eventForceStopBigWinEffect.remove(
      this.onForceStopBigWinEffect,
      this
    );
    this.spawnPool.despawnAll();
    this.sendFinishEvent();
  }

  private onForceStopBigWinEffect() {
    SlotGDK.instance.eventForceStopBigWinEffect.remove(
      this.onForceStopBigWinEffect,
      this
    );
    this.unschedule(this.despawnAllWinEffect);
    this.unschedule(this.stopWinSound);
    this.stopWinSound();
    this.spawnPool.despawnAll();
    this.sendFinishEvent();
  }

  protected activeSkipBtn(active: boolean, waitTime: number) {
    this.activeSkipButton = this.skipButton.bind(this, active);
    this.scheduleOnce(this.activeSkipButton, waitTime);
  }

  protected skipButton(active: boolean): void {
    if (active) {
      SlotGDK.instance.eventClickSkipButton.insert(this.onSkipBtnClick, this);
    }
    if (SlotGDK.instance.eventActiveTakeBtn.length > 0) {
      SlotGDK.instance.eventActiveTakeBtn.notify(active);
    }
  }

  private onSkipBtnClick() {
    this.winEffectCtrl.forceSkipEffect();
  }

  protected playWinSound(winJpType: InGameJPType) {
    this.stopWinSound();
    const winEffect: JpWinEffect =
      this.winEffectDicionary.getWinEffect(winJpType);
    if (!winEffect) return;
    if (winEffect.clipName === '') return;
    // console.log('[playWinSound]', winType, winEffect, winEffect.clipName);

    switch (this.winJpType) {
      case InGameJPType.EPIC:
      case InGameJPType.LEGEND:
      case InGameJPType.RICH:
      case InGameJPType.CLASSIC:
        this.playingWinSoundId = SlotGameMediator.instance.audioManager.play(
          winEffect.clipName
        );
        break;
    }
  }

  protected stopWinSound() {
    if (this.playingWinSoundId !== undefined) {
      SlotGameMediator.instance.audioManager.stop(this.playingWinSoundId);
      this.playingWinSoundId = undefined;
    }
    // if (m_PlayingWinSound != null)
    //         SlotAudioManager.instance.Stop(m_PlayingWinSound);
  }

  public onDestroy() {
    SlotGDK.instance.eventClickSkipButton.remove(this.onSkipBtnClick, this);
    SlotGDK.instance.eventForceStopBigWinEffect.remove(
      this.onForceStopBigWinEffect,
      this
    );
  }

  public getWinJpType() {
    return this.winJpType;
  }

  protected showBlackMask() {
    // 2024/09/13 增加背景壓黑
    if (this.blackMask) {
      setOpacity(this.blackMask, 0);
      const nodeEx = new NodeEx(this.blackMask);
      tween(nodeEx).to(0.5, {opacity: 204}).start();
    }
  }

  protected hideBlackMask() {
    if (this.blackMask) {
      setOpacity(this.blackMask, 0);
    }
  }
}
export {InGameJPType};
