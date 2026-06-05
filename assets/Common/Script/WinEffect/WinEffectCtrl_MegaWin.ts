import {_decorator, Node, Animation, v2, Vec3, tween} from 'cc';
const {ccclass, property} = _decorator;

import {TimeManager} from '../../../CommonModule/Script/Define/GlobalSetting';
import {waitForSeconds} from '../../../CommonModule/Script/ExtraType';
import {SlotGameMediator} from '../../../SlotModule/Define/SlotGameMediator';
import {WinEffectCtrlBigWin} from './WinEffectCtrl_BigWin';
import {setOpacity} from '../../../CommonModule/Script/Utility/NodeProperty';

@ccclass('WinEffectCtrlMegaWin')
export class WinEffectCtrlMegaWin extends WinEffectCtrlBigWin {
  @property(Node)
  protected shiny: Node | null = null;
  @property(Animation)
  protected megaWinAnima: Animation | null = null;
  @property(Node)
  protected megaWinLabelRoot: Node | null = null;
  protected changeToMegaWinAudioName = 'BIGWIN_to_MEGAWIN';
  protected megaWinBGMName = 'MEGAWIN';
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
    this.megaWinAnima.node.active = false;

    this.winLabel.node.parent = this.bigWinLabelRoot;
    this.winLabel.node.setPosition(Vec3.ZERO);

    this.coinParticle.emitArea = v2(100, 0);
    this.coinParticle.emissionRate = 15;
    this.coinParticle.speed = 1300;
    this.coinParticle.gravityXY = v2(0, -2000);
    this.coinParticle.rePlayParticleSystem();

    //播放BigWinBGM
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

    const changeToMegawinTime: number = fFinishTime / 2;

    //For Megawin
    this.scheduleOnce(() => {
      this.bigWinAnima.play('Ani_BigWinChange');
    }, changeToMegawinTime); //ChangeToMegaWin

    //有滾錢的元件就滾錢, 滾完才Callback
    if (this.winLabel !== null) {
      this.winLabel.reset();
      this.winLabel.setTargetNumberAnimationEx(dWinNum, fFinishTime);
    } else {
      this.scheduleOnce(this.stopEffect, fFinishTime);
    }
  }
  /**
   * override 按下Skip按鈕強制滾到終點
   */
  public forceSkipEffect(): void {
    this.changeToFinalState();

    if (this.winLabel !== undefined) {
      this.winLabel.setNumberToStop();
    }
  }
  /**
   * 動畫切換到MegaWin的Label位置(AnimationEvent)
   */
  protected animaChangeToMegawinLabelPos() {
    if (this.playingBGMID !== undefined) {
      SlotGameMediator.instance.audioManager.stop(this.playingBGMID);
      this.playingBGMID = undefined;
    }

    //播放BigWin切換到MegaWin的音效
    SlotGameMediator.instance.audioManager.play(
      this.changeToMegaWinAudioName,
      false,
      1
    );

    this.winLabel.node.parent = this.megaWinLabelRoot;
    this.winLabel.node.setPosition(Vec3.ZERO);

    this.coinParticle.emissionRate = 30;
    this.coinParticle.speed = 1300;
    this.coinParticle.gravityXY = v2(0, -1400);
    this.coinParticle.rePlayParticleSystem();

    //換階段閃白張
    this.shiny.active = true;
    setOpacity(this.shiny, 255);
    tween(nodeEx(this.shiny)).to(0.3, {opacity: 0}).start();
  }
  /**
   * 動畫切換到MegaWin(AnimationEvent)
   */
  protected async animaChangeToMegawin() {
    //播放MegaWinBGM
    this.playingBGMID = SlotGameMediator.instance.audioManager.play(
      this.megaWinBGMName,
      true,
      1
    );

    this.megaWinAnima.node.active = true;
    setOpacity(this.megaWinAnima.node, 0);

    await waitForSeconds(TimeManager.FixedTimestep);

    this.bigWinAnima.node.active = false;
    setOpacity(this.megaWinAnima.node, 255);
  }
  /**
   * 切換到最後的狀態(Skip用)
   */
  protected changeToFinalState() {
    if (this.megaWinAnima.node.active) return; //如果已經切到最後狀態就跳掉

    this.animaChangeToMegawinLabelPos();
    this.animaChangeToMegawin();
  }
}
