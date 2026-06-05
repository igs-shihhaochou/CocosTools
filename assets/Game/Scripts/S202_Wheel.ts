/* eslint-disable camelcase */
import {_decorator, Node, tween, v3, Vec3} from 'cc';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {DropRule, SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {Wheel} from '../../SlotModule/Wheel/Wheel';
import {S202_FreeGameData, S202_Status, S202_SymbolID} from './Define';
import S202_Rule from './S202_Rule';
import NodeEx from '../../CommonModule/Script/Utility/NodeEx';
import S202_WheelBlock from './S202_WheelBlock';
import {S202_PrewinAnim} from './S202_PrewinAnim';

const {ccclass, property} = _decorator;

@ccclass
export default class S202_Wheel extends Wheel {
  @property(S202_PrewinAnim)
  private preWinAnim: S202_PrewinAnim = null;

  protected resultWheel: number[] = [];
  protected result: number[] = [];

  public wheelBlock: S202_WheelBlock = null;

  protected onLoad(): void {
    this.wheelBlock = SlotGameMediator.instance.wheelsManager
      .wheelControllerList[0].wheelBlock as S202_WheelBlock;
  }

  public async symbolClearing() {
    for (let i = this.symbolNodeMember.length - 1; i >= 0; i--) {
      const tempNode = this.symbolNodeMember[i].showSymbolNode;
      const tempNodeEx = new NodeEx(tempNode);
      const clearDistance =
        this.symbolNodeMember[i].originalPosition.y -
        this.symbolNodeMember[this.symbolNodeMember.length - 1].originalPosition
          .y;
      tween(tempNodeEx)
        .to(
          this.nowDropInfo.clearTime,
          {
            y: this.symbolNodeMember[i].endPosition.y,
          },
          {easing: this.nowDropInfo.wheelEasing}
        )
        .call(() => {
          tempNode.position = this.nowDropInfo.constantDropSpeed
            ? new Vec3(
                tempNode.position.x,
                this.clearStartNode.position.y + clearDistance
              )
            : new Vec3(tempNode.position.x, this.clearStartNode.position.y);
        })
        .call(() => {
          if (i === 0) {
            this.clearFlag = true;
          }
        })
        .start();
      if (this.nowDropInfo.clearGapTime > 0) {
        await waitForSeconds(this.nowDropInfo.clearGapTime); //原先是0.03
      }
    }
  }
  public async drop() {
    let needScPreWin = false;
    this.resultWheel.forEach((result, id) => {
      this.resultWheel[id] = 0;
    });
    this.result.forEach((result, id) => {
      this.result[id] = 0;
    });
    this.symbolAry.forEach((symbol, index) => {
      this.result[index] = symbol.symbolInfo.symbolID;
    });

    // SlotGDK.function(Audio.Play)('a13');
    SlotGameMediator.instance.audioManager.play('a13');
    SlotGDK.event('Rule_SetPrewin').notify(this.wheelIndex, this.result);
    let alreadyShow = false;
    let id = null;
    for (let i = this.symbolNodeMember.length - 1; i >= 0; i--) {
      const tempNode = this.symbolNodeMember[i].showSymbolNode;
      if (S202_Rule.isPrewin[this.wheelIndex][i]) {
        this.nowDropInfo = S202_Rule.prewinDropSetting.normalWheelDropInfo;
      } else if (S202_FreeGameData.Status === S202_Status.FreeGame) {
        this.nowDropInfo = S202_Rule.normalDropSetting.normalWheelDropInfo;
      } else if (SlotGDK.instance.fastSpin) {
        this.nowDropInfo = S202_Rule.normalDropSetting.fastWheelDropInfo;
      } else {
        this.nowDropInfo = S202_Rule.normalDropSetting.normalWheelDropInfo;
      }

      if (!alreadyShow && S202_Rule.isPrewin[this.wheelIndex][i]) {
        alreadyShow = true;
        // S202_Rule.ShowPrewin(this.WheelIndex);
        // SlotGDK.Function(Audio.Play)("a11");
        if (this.preWinAnim) this.preWinAnim.playAnimation();
        id = SlotGameMediator.instance.audioManager.play('a11');
      }
      if (this.symbolAry[i].symbolInfo.symbolID === S202_SymbolID.Scatter) {
        this.wheelBlock.nowScCount += 1;
        if (
          this.wheelBlock.nowScCount === 2 ||
          this.wheelBlock.nowScCount === 3
        ) {
          needScPreWin = true;
        }
      }

      tween<Node>(tempNode)
        .call(() => {
          if (!S202_Rule.isPrewin[this.wheelIndex][i]) {
            SlotGDK.event('Deal').notify(this.wheelIndex);
          }
        })
        .to(
          this.nowDropInfo.dropTime,
          {
            position: v3(
              tempNode.position.x,
              this.symbolNodeMember[i].originalPosition.y,
              tempNode.position.z
            ),
          },
          {easing: this.nowDropInfo.wheelEasing}
        )
        .call(() => {
          this.resultWheel[i] = this.symbolAry[i].symbolInfo.symbolID;
          SlotGDK.event(DropRule.SingleWheel).notify(
            this.wheelIndex,
            this.resultWheel
          );
          if (i === 0) {
            // S202_Rule.StopPrewin(this.WheelIndex);
            if (this.preWinAnim) this.preWinAnim.playOutAnimation();
            if (id !== null) SlotGameMediator.instance.audioManager.stop(id);
            alreadyShow = false;
            this.stopped();
            if (this.eventWheelBreakAndBound.length > 0) {
              this.eventWheelBreakAndBound.notify(
                this._wheelIndex,
                this.symbolAry
              );
            }
          } else if (
            S202_Rule.isPrewin[this.wheelIndex][i - 1] === false &&
            S202_Rule.isPrewin[this.wheelIndex][i] === true
          ) {
            //如果本來聽牌，掉落後變成沒聽牌，後面就不需要再聽牌了
            // S202_Rule.StopPrewin(this.WheelIndex);
            if (this.preWinAnim) this.preWinAnim.playOutAnimation();
            SlotGameMediator.instance.audioManager.stop(id);
            alreadyShow = false;
          }
        })
        .start();

      if (this.nowDropInfo.symbolGapTime > 0) {
        await waitForSeconds(this.nowDropInfo.symbolGapTime); //同一輪 每顆symbol的間隔時間
      }
      if (SlotGDK.instance.fastSpin === false && needScPreWin) {
        needScPreWin = false;
        await waitForSeconds(1);
      }
    }
  }
}
