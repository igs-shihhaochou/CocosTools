import {_decorator, Animation, Node, tween, v2, Vec2, Vec3} from 'cc';
const {ccclass, property} = _decorator;

import {WinEffectCtrl} from '../../../CommonModule/Script/Award/WinEffectCtrl';
import {NodeParticleSystem} from '../../../CommonModule/Script/UIComponent/NodeParticleSystem';
import {SlotGameMediator} from '../../../SlotModule/Define/SlotGameMediator';
import {setOpacity} from '../../../CommonModule/Script/Utility/NodeProperty';

@ccclass('WinEffectCtrlBigWin')
export class WinEffectCtrlBigWin extends WinEffectCtrl {
  @property(Animation)
  protected bigWinAnima: Animation | null = null;
  @property(Node)
  protected bigWinLabelRoot: Node | null = null;
  @property(NodeParticleSystem)
  protected coinParticle: NodeParticleSystem = null;
  protected bigWinBGMName = 'BIGWIN';
  protected winCountLoopAudioName = 'win_count_loop';
  protected winCountEndAudioName = 'win_count_end';
  protected winCountLoopAudioID: number = undefined;
  protected playingBGMID: number = undefined;
  /**
   * override 播放報獎效果
   */
  public playEffect(
    dWinNum: number,
    fFinishTime: number,
    callback?: Function,
    target?
  ): void {
    //Reset
    setOpacity(this.node, 255);
    this.bigWinAnima.node.active = true;
    this.winLabel.node.parent = this.bigWinLabelRoot;
    this.winLabel.node.setPosition(Vec3.ZERO);
    this.coinParticle.emitArea = new Vec2(100, 0);
    this.coinParticle.emissionRate = 15;
    this.coinParticle.speed = 1300;
    this.coinParticle.gravityXY = v2(0, -2000);
    this.coinParticle.rePlayParticleSystem();
    this.playingBGMID = SlotGameMediator.instance.audioManager.play(
      this.bigWinBGMName,
      true,
      1
    );
    this.winCountLoopAudioID = SlotGameMediator.instance.audioManager.play(
      this.winCountLoopAudioName,
      true,
      0.5
    );
    if (callback !== null) this.finishCallback = callback.bind(target);
    //有滾錢的元件就滾錢, 滾完才Callback
    if (this.winLabel !== null) {
      this.winLabel.reset();
      this.winLabel.setTargetNumberAnimationEx(dWinNum, fFinishTime);
    } else {
      this.scheduleOnce(this.stopEffect, fFinishTime);
    }
  }
  /**
   * override 停止報獎效果
   */
  public stopEffect(): void {
    this.unscheduleAllCallbacks();
    //暫停滾錢音效
    if (this.winCountLoopAudioID !== undefined) {
      SlotGameMediator.instance.audioManager.stop(this.winCountLoopAudioID);
      this.winCountLoopAudioID = undefined;
    }
    SlotGameMediator.instance.audioManager.play(
      this.winCountEndAudioName,
      false,
      1
    );
    //三秒後淡出音效
    this.scheduleOnce(() => {
      if (this.playingBGMID !== undefined) {
        SlotGameMediator.instance.audioManager.stop(this.playingBGMID);
        this.playingBGMID = undefined;
      }
    }, 3);
    //Delay淡出消失(Manager結束後會等待兩秒才消失，這裡的秒數對照外部3秒客製化調整)

    tween(nodeEx(this.node)).delay(2.7).to(0.3, {opacity: 0}).start();
    if (this.finishCallback !== null) {
      this.finishCallback();
    }
  }
}
