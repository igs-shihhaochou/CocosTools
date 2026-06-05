import {_decorator, Animation, Node, tween, Tween} from 'cc';
const {ccclass, property} = _decorator;

import {WinEffectCtrl} from '../../../CommonModule/Script/Award/WinEffectCtrl';
import {
  setOpacity,
  setScale,
} from '../../../CommonModule/Script/Utility/NodeProperty';
import {nodeEx} from '../../../CommonModule/Script/Utility/NodeEx';

@ccclass('WinEffectCtrlWinUnderXTen')
export class WinEffectCtrlWinUnderXTen extends WinEffectCtrl {
  @property(Animation)
  protected bigWinAnima: Animation | null = null;
  @property(Node)
  protected bigWinLabelRoot: Node | null = null;
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
    if (this.winLabel) {
      Tween.stopAllByTarget(this.winLabel.node);
      setOpacity(this.winLabel.node, 255);
      setScale(this.winLabel.node, 0.5);
    }

    if (callback !== null) this.finishCallback = callback.bind(target);

    //有滾錢的元件就滾錢, 滾完才Callback
    if (this.winLabel) {
      //放大效果
      const zoomOut = tween(nodeEx(this.winLabel.node)).to(fFinishTime, {
        scale: 0.7,
      });

      this.winLabel.reset();
      this.winLabel.setTargetNumberAnimationEx(dWinNum, fFinishTime);
      zoomOut.start();
    } else {
      this.scheduleOnce(this.stopEffect, fFinishTime);
    }
  }
  /**
   * override 停止報獎效果
   */
  public stopEffect(): void {
    this.unschedule(this.stopEffect);
    if (this.winLabel) {
      Tween.stopAllByTarget(this.winLabel.node);

      //Delay淡出消失(Manager結束後會等待兩秒才消失，這裡的秒數對照外部3秒客製化調整)
      tween(nodeEx(this.winLabel.node))
        .to(0.05, {scale: 0.7})
        .delay(0.35)
        .to(0.1, {opacity: 0})
        .start();
    }

    if (this.finishCallback !== null) {
      this.finishCallback();
    }
  }
}
