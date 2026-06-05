import {_decorator, Animation, Node, tween, v2, Vec3} from 'cc';
const {ccclass, property} = _decorator;

import {TimeManager} from '../../../CommonModule/Script/Define/GlobalSetting';
import {waitForSeconds} from '../../../CommonModule/Script/ExtraType';
import {NodeParticleSystem} from '../../../CommonModule/Script/UIComponent/NodeParticleSystem';
import {SlotGameMediator} from '../../../SlotModule/Define/SlotGameMediator';
import {WinEffectCtrlMegaWin} from './WinEffectCtrl_MegaWin';
import {setOpacity} from '../../../CommonModule/Script/Utility/NodeProperty';
import {nodeEx} from '../../../CommonModule/Script/Utility/NodeEx';

@ccclass('WinEffectCtrlSuperWin')
export class WinEffectCtrlSuperWin extends WinEffectCtrlMegaWin {
  @property(Animation)
  protected superWinAnima: Animation | null = null;
  @property(Node)
  protected superWinLabelRoot: Node | null = null;
  @property(NodeParticleSystem)
  protected diamondParticle: NodeParticleSystem = null;
  protected changeToSuperWin = false;
  protected changeToSuperWinAudioName = 'MEGAWIN_to_SUPERWIN';
  protected superWinBGMName = 'SUPERWIN';
  //    /**
  //     * override 播放報獎效果
  //     */
  public playEffect(
    dWinNum: number,
    fFinishTime: number,
    callback?: Function,
    target?
  ): void {
    //Reset
    setOpacity(this.node, 255);
    this.changeToSuperWin = false;
    this.bigWinAnima.node.active = true;
    this.megaWinAnima.node.active = false;
    this.superWinAnima.node.active = false;
    this.winLabel.node.parent = this.bigWinLabelRoot;
    this.winLabel.node.setPosition(Vec3.ZERO);
    this.coinParticle.emitArea = v2(100, 0);
    this.coinParticle.emissionRate = 15;
    this.coinParticle.speed = 1300;
    this.coinParticle.gravityXY = v2(0, -2000);
    this.coinParticle.rePlayParticleSystem();
    this.diamondParticle.stopParticleSystem();
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
    const changeToMegawinTime: number = fFinishTime / 3;
    const changeToSuperwinTime: number = (fFinishTime * 2) / 3;
    //For Megawin
    this.scheduleOnce(() => {
      this.bigWinAnima.play('Ani_BigWinChange');
      //如果在撥放之前就要撥放SuperWin的話就補做，避免沒換到
      this.bigWinAnima.once(Animation.EventType.FINISHED, () => {
        if (this.changeToSuperWin) {
          this.megaWinAnima.play('Ani_MegaWinChange');
        }
      });
    }, changeToMegawinTime); //ChangeToMegaWin
    //For SuperWin
    this.scheduleOnce(() => {
      this.megaWinAnima.play('Ani_MegaWinChange');
      this.changeToSuperWin = true;
    }, changeToSuperwinTime); //ChangeToSuperWin
    //有滾錢的元件就滾錢, 滾完才Callback
    if (this.winLabel !== null) {
      this.winLabel.reset();
      this.winLabel.setTargetNumberAnimationEx(dWinNum, fFinishTime);
    } else {
      this.scheduleOnce(this.stopEffect, fFinishTime);
    }
  }
  /**
   * 動畫切換到SuperWin的Label位置(AnimationEvent)
   */
  private animaChangeToSuperwinLabelPos() {
    if (this.playingBGMID !== undefined) {
      SlotGameMediator.instance.audioManager.stop(this.playingBGMID);
      this.playingBGMID = undefined;
    }
    //播放MegaWin切換到SuperWin的音效
    SlotGameMediator.instance.audioManager.play(
      this.changeToSuperWinAudioName,
      false,
      1
    );
    this.winLabel.node.parent = this.superWinLabelRoot;
    this.winLabel.node.setPosition(Vec3.ZERO);
    this.coinParticle.emissionRate = 50;
    this.coinParticle.speed = 1300;
    this.coinParticle.gravityXY = v2(0, -1400);
    this.coinParticle.rePlayParticleSystem();
    //顯示鑽石特效
    this.diamondParticle.rePlayParticleSystem();
    //換階段閃白張
    this.shiny.active = true;
    setOpacity(this.shiny, 255);
    tween(nodeEx(this.shiny)).to(0.3, {opacity: 0}).start();
  }
  /**
   * 動畫切換到Superwin(AnimationEvent)
   */
  private async animaChangeToSuperwin() {
    //播放SuperWinBGM
    this.playingBGMID = SlotGameMediator.instance.audioManager.play(
      this.superWinBGMName,
      true,
      1
    );
    this.superWinAnima.node.active = true;
    setOpacity(this.superWinAnima.node, 0);
    await waitForSeconds(TimeManager.FixedTimestep);
    this.bigWinAnima.node.active = false;
    this.megaWinAnima.node.active = false;
    setOpacity(this.superWinAnima.node, 255);
  }
  /**
   * 切換到最後的狀態(Skip用)
   */
  protected changeToFinalState() {
    if (this.superWinAnima.node.active) return; //如果已經切到最後狀態就跳掉
    this.animaChangeToSuperwinLabelPos();
    this.animaChangeToSuperwin();
  }
}
