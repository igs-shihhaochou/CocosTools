import {
  _decorator,
  Animation,
  CCString,
  CCFloat,
  CCInteger,
  type AnimationClip,
} from 'cc';
const {ccclass, property} = _decorator;

import {WinEffectCtrl} from '../../CommonModule/Script/Award/WinEffectCtrl';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {WinType} from '../Define/SlotGameData';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {SlotGDK} from '../Define/SlotGDK';

@ccclass('WinEffectCtrlAccu')
export default class WinEffectCtrlAccu extends WinEffectCtrl {
  @property(Animation)
  private anim: Animation | null = null;
  private animKeyAry: string[] = [];
  @property(CCString)
  private inAudioKey = '';
  @property(CCString)
  private outAudioKey = '';
  @property(CCFloat)
  private stopDelay = 0;

  private winType: WinType = null;
  @property({type: [CCInteger], displayName: 'YOU WIN 動畫 Index'})
  private youClipArray: number[] = [6];
  @property({type: [CCInteger], displayName: 'BIG WIN 動畫 Index'})
  private bigClipArray: number[] = [0];
  @property({type: [CCInteger], displayName: 'MEGA WIN 動畫 Index'})
  private megaWinClipArray: number[] = [0, 2];
  @property({type: [CCInteger], displayName: 'SUPER WIN 動畫 Index'})
  private superWinClipArray: number[] = [0, 2, 4];

  @property({displayName: 'YOU WIN 結束動畫 Index'})
  private youStopClip = 7;
  @property({displayName: 'BIG WIN 結束動畫 Index'})
  private bigStopClip = 1;
  @property({displayName: 'MEGA WIN 結束動畫 Index'})
  private megaStopClip = 3;
  @property({displayName: 'SUPER WIN 結束動畫 Index'})
  private superStopClip = 5;

  @property({displayName: 'YOU WIN 滾錢時長'})
  private youRollDuration = 2.5;
  @property({displayName: 'BIG WIN 滾錢時長'})
  private bigRollDuration = 2.5;
  @property({displayName: 'MEGA WIN 滾錢時長'})
  private megaRollDuration = 8.5;
  @property({displayName: 'SUPER WIN 滾錢時長'})
  private superRollDuration = 16;

  @property({displayName: 'YOU WIN Voice'})
  private youVoiceName = '';
  @property({displayName: 'BIG WIN Voice'})
  private bigVoiceName = '';
  @property({displayName: 'MEGA WIN Voice'})
  private megaVoiceName = '';
  @property({displayName: 'SUPER WIN Voice'})
  private superVoiceName = '';

  private currentSetting: number[] = null;
  private stopClipIdx: number = null;
  private skipClipIdx: number = null;
  private rollDuration: number = null;
  private voiceArray: string[] = null;
  private voiceID: number = null;

  private isSkip = false;

  private lastClip: AnimationClip = null;

  public onLoad() {
    super.onLoad();
    this.animKeyAry = this.anim.clips.map(clip => {
      return clip.name;
    });
  }

  /**
   * 播放特效動畫
   * @param dWinNum 贏分
   * @param fFinishTime Count結束時間
   * @param callback 結束後呼叫的Function
   * @param target 結束後呼叫Function的物件
   */
  public playEffect(
    dWinNum: number,
    fFinishTime: number,
    callback: Function,
    target
  ): void {
    this.winType = target.getWinType();
    this.playStart();
    super.playEffect(dWinNum, this.rollDuration, callback, target);
  }

  public stopEffect(): void {
    this.playEnd();
  }

  private playStart() {
    SlotGameMediator.instance.audioManager.play(this.inAudioKey);
    if (this.anim) {
      switch (this.winType) {
        case WinType.BigWin:
          this.bigWinProcess();
          this.skipClipIdx = this.bigStopClip;
          break;
        case WinType.MegaWin:
          this.megaWinProcess();
          this.skipClipIdx = this.megaStopClip;
          break;
        case WinType.SuperWin:
          this.superWinProcess();
          this.skipClipIdx = this.superStopClip;
          break;
        default:
          this.youWinProcess();
          this.skipClipIdx = this.youStopClip;
          break;
      }
      if (this.currentSetting.length >= 2) {
        this.anim.on(Animation.EventType.FINISHED, this.playNextStep, this);
      }
      this.voiceID = SlotGameMediator.instance.audioManager.play(
        this.voiceArray[0]
      );
      const clipName = this.animKeyAry[this.currentSetting[0]];
      this.anim.play(clipName);
      const clipIndex = this.anim.clips.findIndex(
        clip => clip.name === clipName
      );
      this.lastClip = this.anim.clips[clipIndex];
    }
  }

  //按下Skip按鈕強制滾到終點
  public forceSkipEffect(): void {
    this.stopClipIdx = this.skipClipIdx;
    this.isSkip = true;
    if (this.winLabel !== undefined) {
      this.winLabel.setNumberToStop();
    }
  }

  private youWinProcess() {
    this.currentSetting = this.youClipArray;
    this.stopClipIdx = this.youStopClip;
    this.rollDuration = this.youRollDuration;
    this.voiceArray = [this.youVoiceName];
  }

  private bigWinProcess() {
    this.currentSetting = this.bigClipArray;
    this.stopClipIdx = this.bigStopClip;
    this.rollDuration = this.bigRollDuration;
    this.voiceArray = [this.bigVoiceName];
  }

  private megaWinProcess() {
    this.currentSetting = this.megaWinClipArray;
    this.stopClipIdx = this.megaStopClip;
    this.rollDuration = this.megaRollDuration;
    this.voiceArray = [this.bigVoiceName, this.megaVoiceName];
  }

  private superWinProcess() {
    this.currentSetting = this.superWinClipArray;
    this.stopClipIdx = this.superStopClip;
    this.rollDuration = this.superRollDuration;
    this.voiceArray = [
      this.bigVoiceName,
      this.megaVoiceName,
      this.superVoiceName,
    ];
  }

  private playNextStep() {
    // const clipName = animationEx(this.anim).currentClip;
    const clipName = this.lastClip.name;
    const clips = this.anim.clips;
    const clipIndex = clips.findIndex(clip => clip.name === clipName);
    const settingIndex = this.currentSetting.findIndex(
      num => num === clipIndex
    );
    if (settingIndex !== -1) {
      if (settingIndex !== this.currentSetting.length - 1) {
        const nextClip = this.currentSetting[settingIndex + 1];
        this.anim.play(clips[nextClip].name);
        this.lastClip = clips[nextClip];
        this.voiceID = SlotGameMediator.instance.audioManager.play(
          this.voiceArray[settingIndex + 1]
        );
        if (settingIndex + 1 === this.currentSetting.length - 1) {
          this.anim.off(Animation.EventType.FINISHED, this.playNextStep, this);
        }
      }
    }
  }

  private async playEnd() {
    if (!this.isSkip) {
      await waitForSeconds(this.stopDelay);
    }
    this.isSkip = false;
    SlotGameMediator.instance.audioManager.play(this.outAudioKey);
    SlotGameMediator.instance.audioManager.stop(this.voiceID);
    this.voiceID = null;
    if (!SlotGDK.instance.fastSpin) {
      //寫死，因為取得不到WinEffectManager正確數值
      super.stopEffect();
    } else {
      await waitForSeconds(0.5);
      super.stopEffect();
    }
    if (this.anim) {
      const clip = this.anim.clips;
      //this.anim.clear();
      this.anim.play(clip[this.stopClipIdx].name);
    }
  }

  protected onLabelFinished() {
    if (this.anim !== null && this.stopClipIdx !== null) {
      const stopClip = this.anim.clips[this.stopClipIdx];
      if (this.lastClip !== stopClip) {
        this.anim.play(stopClip.name);
        this.lastClip = stopClip;
      }
    }
    super.onLabelFinished();
  }
}
