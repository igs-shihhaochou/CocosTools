import {_decorator, Animation, AnimationClip, CCString, CCFloat} from 'cc';
const {ccclass, property} = _decorator;

import {WinEffectCtrl} from '../../../CommonModule/Script/Award/WinEffectCtrl';
import {waitForSeconds} from '../../../CommonModule/Script/ExtraType';
import {SlotGameMediator} from '../../../SlotModule/Define/SlotGameMediator';

@ccclass('WinEffectCtrlCommonReward')
export class WinEffectCtrlCommonReward extends WinEffectCtrl {
  @property(Animation)
  winEffectAnimation: Animation | null = null;
  @property(AnimationClip)
  startAnimationClip: AnimationClip | null = null;
  @property(AnimationClip)
  loopAnimationClip: AnimationClip | null = null;
  @property(AnimationClip)
  stopAnimationClip: AnimationClip | null = null;
  @property(CCString)
  WinEffectBGMName = '';
  @property(CCString)
  WinEffectSkipBGMName = '';
  protected playingBGMID: number = undefined;

  @property(CCFloat)
  public playStopAnimDelay = 2;

  /**
   * override 播放報獎效果
   */
  public playEffect(
    dWinNum: number,
    fFinishTime: number,
    callback?: Function,
    target?
  ): void {
    if (callback !== null) this.finishCallback = callback.bind(target);

    //有滾錢的元件就滾錢, 滾完才Callback
    if (this.winLabel !== null) {
      this.winLabel.reset();
      this.winLabel.setTargetNumberAnimationEx(dWinNum, fFinishTime);

      if (
        this.winEffectAnimation === null ||
        this.startAnimationClip === null ||
        this.loopAnimationClip === null ||
        this.stopAnimationClip === null
      ) {
        this.scheduleOnce(this.stopEffect, fFinishTime);
      }

      this.playingBGMID = SlotGameMediator.instance.audioManager.play(
        this.WinEffectBGMName,
        false,
        1
      );

      this.winEffectAnimation.play(this.startAnimationClip.name);
      this.winEffectAnimation.once(
        Animation.EventType.FINISHED,
        () => {
          this.winEffectAnimation.play(this.loopAnimationClip.name);
        },
        this
      );
    } else {
      this.scheduleOnce(this.stopEffect, fFinishTime);
    }
  }
  /**
   * override 停止報獎效果
   */
  public async stopEffect(): Promise<void> {
    this.unschedule(this.stopEffect);

    if (this.finishCallback !== null) {
      this.finishCallback();
    }

    if (this.playingBGMID !== undefined) {
      SlotGameMediator.instance.audioManager.stop(this.playingBGMID);
      this.playingBGMID = undefined;

      SlotGameMediator.instance.audioManager.play(
        this.WinEffectSkipBGMName,
        false,
        1
      );
    }

    await waitForSeconds(this.playStopAnimDelay);

    this.winEffectAnimation.play(this.stopAnimationClip.name);
  }
}
