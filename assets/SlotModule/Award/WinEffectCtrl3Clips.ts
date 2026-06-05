import {_decorator, Animation, CCString, CCFloat, sp} from 'cc';
const {ccclass, property} = _decorator;

import {WinEffectCtrl} from '../../CommonModule/Script/Award/WinEffectCtrl';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {SlotGDK} from '../Define/SlotGDK';

@ccclass('WinEffectCtrl3Clips')
export default class WinEffectCtrl3Clips extends WinEffectCtrl {
  @property(Animation)
  private anim: Animation | null = null;
  @property(sp.Skeleton)
  private spine: sp.Skeleton = null;
  @property([CCString])
  private spineAnimKeyAry: string[] = ['Start', 'Loop', 'End'];
  @property([CCString])
  private animKeyAry: string[] = ['Start', 'Loop', 'End'];
  @property(CCString)
  private inAudioKey = '';
  @property(CCString)
  private loopAudioKey = '';
  @property(CCString)
  private outAudioKey = '';
  @property(CCFloat)
  private loopDelay = 0;
  @property(CCFloat)
  private stopDelay = 0;
  private loopAudioId = 0;

  public onLoad() {
    super.onLoad();
    if (!this.anim) return;
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
    const logo = PlatformData.logo;
    this.winLabel.isInteger = logo === 'playgd' || logo === 'magiccity';
    this.playStart();
    super.playEffect(dWinNum, fFinishTime, callback, target);
  }

  public stopEffect(): void {
    this.playEnd();
  }

  private playStart() {
    SlotGameMediator.instance.audioManager.play(this.inAudioKey);
    if (this.spine) {
      this.spine.setEndListener(this.playLoop.bind(this));
      this.spine.setAnimation(0, this.spineAnimKeyAry[0], false);
    }
    if (this.anim) {
      this.anim.play(this.animKeyAry[0]);
      this.anim.once(Animation.EventType.FINISHED, this.playLoop, this);
    }
  }

  private async playLoop() {
    await waitForSeconds(this.loopDelay);
    this.loopAudioId = SlotGameMediator.instance.audioManager.play(
      this.loopAudioKey
    );
    if (this.anim) {
      this.anim.play(this.animKeyAry[1]);
    }
    if (this.spine) {
      this.spine.setEndListener(null);
      this.spine.addAnimation(0, this.spineAnimKeyAry[1], true);
    }
  }

  private async playEnd() {
    await waitForSeconds(this.stopDelay);
    SlotGameMediator.instance.audioManager.play(this.outAudioKey);
    SlotGameMediator.instance.audioManager.stop(this.loopAudioId);
    if (!SlotGDK.instance.fastSpin) {
      //寫死，因為取得不到WinEffectManager正確數值
      super.stopEffect();
    } else {
      await waitForSeconds(0.5);
      super.stopEffect();
    }
    if (this.spine) {
      this.spine.setEventListener(null);
      this.spine.setAnimation(0, this.spineAnimKeyAry[2], false);
    }
    if (this.anim) {
      this.anim.stop();
      this.anim.play(this.animKeyAry[2]);
    }
  }
}
