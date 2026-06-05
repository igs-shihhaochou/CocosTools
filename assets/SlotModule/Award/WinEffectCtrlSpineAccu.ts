import {_decorator, CCString, CCFloat, sp, CCBoolean} from 'cc';
const {ccclass, property} = _decorator;

import {WinEffectCtrl} from '../../CommonModule/Script/Award/WinEffectCtrl';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {Delegate, waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {SlotGameMediator} from '../Define/SlotGameMediator';

@ccclass('SpineData')
export class SpineData {
  @property(CCString)
  public animKey = '';
  @property(CCFloat)
  public playTime = 0;
  @property(CCBoolean)
  public needLoop = false;
  @property(CCString)
  public audioKey = '';
}

@ccclass('WinEffectCtrlSpineAccu')
export default class WinEffectCtrlSpineAccu extends WinEffectCtrl {
  @property(sp.Skeleton)
  public spine: sp.Skeleton = null;
  @property([SpineData])
  private spineDataArray: SpineData[] = [];
  @property(CCFloat)
  private loopDelay = 0;
  @property(CCFloat)
  private stopDelay = 0;

  public finishEventDelegate: Delegate = new Delegate();
  public onStartPlay: Delegate = new Delegate();
  public onLoopPlay: Delegate = new Delegate();
  public onStopPlay: Delegate = new Delegate();

  private inAudioId = 0;
  private loopAudioId = 0;
  private isPlay = false;

  private get lastIndex(): number {
    return this.spineDataArray.length - 1;
  }

  /** 播放單一 SpineData（動畫＋可選 loop 音效） */
  private playSpineData(data: SpineData): void {
    this.spine.setAnimation(0, data.animKey, data.needLoop);
    if (data.audioKey === '') return;
    if (this.loopAudioId > 0) {
      SlotGameMediator.instance.audioManager.stop(this.loopAudioId);
    }
    this.loopAudioId = SlotGameMediator.instance.audioManager.play(
      data.audioKey
    );
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

  private async playStart() {
    this.isPlay = true;
    const {animKey, needLoop, playTime, audioKey} = this.spineDataArray[0];
    this.spine.setAnimation(0, animKey, needLoop);
    this.inAudioId = SlotGameMediator.instance.audioManager.play(audioKey);
    await waitForSeconds(playTime);
    this.playLoop();
  }

  private async playLoop() {
    this.spine.setEndListener(null);
    await waitForSeconds(this.loopDelay);
    this.loopAudioId = -1;

    // 依序播放 spine 動畫
    for (let i = 1; i < this.lastIndex; i++) {
      if (!this.isPlay) break;
      const data = this.spineDataArray[i];
      this.playSpineData(data);
      await waitForSeconds(data.playTime);
    }
  }

  private async playEnd() {
    await waitForSeconds(this.stopDelay);

    const last = this.spineDataArray[this.lastIndex];
    if (this.loopAudioId > 0) {
      SlotGameMediator.instance.audioManager.stop(this.loopAudioId);
    }
    if (this.inAudioId > 0) {
      SlotGameMediator.instance.audioManager.stop(this.inAudioId);
    }

    SlotGameMediator.instance.audioManager.play(last.audioKey);
    this.spine.setAnimation(0, last.animKey, false);
    this.finishEventDelegate.notify();

    await waitForSeconds(last.playTime);
    super.stopEffect();
  }

  protected onLabelFinished(): void {
    this.isPlay = false;
    // 若當前播放的動畫不是倒數第二個，直接播放倒數第二個動畫
    if (this.lastIndex >= 1) {
      const secondToLast = this.spineDataArray[this.lastIndex - 1];
      const currentAnimName = this.spine.getCurrent(0)?.animation?.name ?? '';
      if (currentAnimName !== secondToLast.animKey) {
        this.playSpineData(secondToLast);
      }
    }
    super.onLabelFinished();
  }
}
