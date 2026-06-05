/* eslint-disable camelcase */
import {_decorator, Node, Vec2, sp, Animation, AnimationClip} from 'cc';
import HostSetting from '../../SlotModule/Define/HostSetting';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {Symbol} from '../../SlotModule/Wheel/Symbol';
import {SymbolShowPrefabController} from '../../SlotModule/Wheel/SymbolShowPrefabController';
import {SymbolShowSetting} from '../../SlotModule/Wheel/SymbolShowPrefabDefine';
import {
  isLastScatter,
} from '../../SlotModule/Wheel/SymbolShowPrefabFunctions';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {getWorldSpaceAR} from '../../CommonModule/Script/Utility/NodeProperty';
import {SymbolType} from '../../SlotModule/Define/SlotGameData';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {ReplaceSymbolData} from '../../SlotModule/Wheel/SymbolShowPrefabRule';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';

const {ccclass, property} = _decorator;

@ccclass
export default class S202_SymbolShowPrefabCtrl extends SymbolShowPrefabController {
  //單輪停止
  protected spawnWheelStopAnimaPrefab(
    wheelCtrlIndex: number,
    wheelIndex: number,
    sortedSymbolAry: Symbol[]
  ): void {
    const count: number =
      this.wheelBlockControllerEx.wheelAry[wheelIndex].visibleSymbolAmount +
      this.wheelBlockControllerEx.wheelAry[wheelIndex].outOfTopSymbolAmount;
    //先做出結果盤面的資料給rule
    const symbolIdList: number[] = [];
    for (
      let i: number =
        this.wheelBlockControllerEx.wheelAry[wheelIndex].outOfTopSymbolAmount;
      i < count;
      i++
    ) {
      symbolIdList.push(sortedSymbolAry[i].symbolInfo.symbolID);
    }
    this.symbolShowPrefabRule.setSingleWheelData(wheelIndex, symbolIdList);
    //只跑顯示在畫面上的Symbol
    for (
      let i: number =
        this.wheelBlockControllerEx.wheelAry[wheelIndex].outOfTopSymbolAmount;
      i < count;
      i++
    ) {
      const symbolEx: Symbol = sortedSymbolAry[i];
      //if (!symbolEx.node.active) continue;
      // 2025.04.18
      // Scatter不進避免雙重動畫播放、但金牌要進
      if (symbolEx.symbolInfo.symbolID === 2) continue;
      const symbolShowSetting: SymbolShowSetting =
        this.symbolShowSettingList.find(
          searchSymbolShowSetting =>
            searchSymbolShowSetting.symbolID === symbolEx.symbolInfo.symbolID
        );
      if (HostSetting.instance.bingo.useWheelMask)
        this.symbolShowInfoAry[wheelIndex][i].symbolEx = symbolEx;
      if (symbolShowSetting) {
        const {
          offClipping,
          symbolID,
          symbolShinyPrefabTform,
          wheelStopAnimaPrefabArgs,
          symbolStopLoopAnimaPrefabArgs,
        } = symbolShowSetting;
        //有設定的話就塞進去
        if (HostSetting.instance.bingo.useBingoFrame)
          this.symbolShowInfoAry[wheelIndex][i].symbolEx = symbolEx;
        //判斷要不要顯示去除Clipping的圖片
        if (offClipping) {
          this.createOffClippingTform(
            symbolEx,
            symbolShowSetting.offClippingLayer,
            wheelIndex,
            i
          );
        }
        //不撥放動畫就直接跳下一個
        if (
          !this.symbolShowPrefabRule.checkSymbolShow(
            wheelIndex,
            symbolEx.symbolInfo.symbolID
          )
        )
          continue;
        //判斷是不是被取代的Symbol
        const replaceData: ReplaceSymbolData =
          this.symbolShowPrefabRule.getReplaceSymbolData(symbolID);

        const enterSG =
          SlotGameMediator.instance.mainGameHost.isReadyToEnterSG();

        //閃白張 (急停&沒有Prewin&沒有閃白張的圖片)
        if (
          (symbolShinyPrefabTform &&
            this.wheelBlockControllerEx.isDoQuickStop &&
            !this.wheelBlockControllerEx.isPrewin &&
            !enterSG) ||
          (symbolShinyPrefabTform &&
            wheelStopAnimaPrefabArgs.animaPrefabTform === null)
        ) {
          this.showShinySymbol(symbolShowSetting, symbolEx);
          //播放停輪symbol音效
          this.playSymbolStopAudio(symbolShowSetting, replaceData);
        }
        //播放停輪動畫
        else {
          const playStopLoopAnimation = async () => {
            //若有StopLoop就撥
            const enterSG =
              SlotGameMediator.instance.mainGameHost.isReadyToEnterSG();
            let _isLastScatter = false;
            const {symbolID, type} = symbolEx.symbolInfo;
            const isScatter = type === SymbolType.Scatter;
            //是scatter symbol才進行此判斷
            if (isScatter) {
              //找對應symbol id的rule
              const rule = this.symbolShowPrefabRule.specialSymbolRuleList.find(
                specialSymbolRule => specialSymbolRule.symbolId === symbolID
              );
              if (rule) {
                const {needAmount} =
                  this.symbolShowPrefabRule.specialSymbolRuleList[0];
                _isLastScatter = isLastScatter(
                  this.wheelBlockControllerEx,
                  wheelIndex,
                  i,
                  needAmount,
                  symbolID
                );
              }
            }
            if (symbolStopLoopAnimaPrefabArgs.animaPrefabTform) {
              if (
                this.symbolShowInfoAry[wheelIndex][i].wheelStopAnimaPrefabTform
              ) {
                //若despawnBingo未觸發，則播stoploop
                //若有Stop動畫則等待一下再撥StopLoop
                await waitForSeconds(this.stopAnimationDelay);
                if (!enterSG || (enterSG && !_isLastScatter)) {
                  //隱藏Stop動畫並不顯示底圖
                  this.hideStopAnimaPrefab(wheelIndex, i, false);
                  if (!this.ruleBroke)
                    this.spawnSymbolStopLoopAnimaPrefab(
                      wheelIndex,
                      i,
                      symbolEx
                    );
                } else {
                  //隱藏動畫並顯示底圖
                  this.hideAllAnima();
                  if (_isLastScatter)
                    if (
                      SlotGDK.instance.eventOnLastScatterStopCompleted.length
                    ) {
                      SlotGDK.instance.eventOnLastScatterStopCompleted.notify();
                    }
                }
              }
            }
            //若無StopLoop則隱藏animation並顯示底圖
            else if (wheelStopAnimaPrefabArgs.animaPrefabTform) {
              if (_isLastScatter) {
                if (SlotGDK.instance.eventOnLastScatterStopCompleted.length) {
                  SlotGDK.instance.eventOnLastScatterStopCompleted.notify();
                }
              }
            //  this.hideStopAnimaPrefab(wheelIndex, i, true);
            }
          };
          const {animaPrefabTform, isSpine, animationName, isLoop} =
            wheelStopAnimaPrefabArgs;
          if (animaPrefabTform) {
            const _animaPrefabTform: Node = this.createPrefab(
              animaPrefabTform.data,
              symbolShowSetting.animaLayer,
              getWorldSpaceAR(symbolEx.node, Vec2.ZERO),
              Vec2.ONE
            );
            //隱藏Symbol
            this.showAnima(wheelIndex, i);
            //塞入動畫Node
            this.symbolShowInfoAry[wheelIndex][i].wheelStopAnimaPrefabTform =
              _animaPrefabTform;
            //播動畫
            // 2025.04.18
            // 強制不Rulebreak，讓金牌停輪動畫都能播放
            this.ruleBroke = false;
            this.playAnimation(
              _animaPrefabTform,
              animationName,
              isSpine,
              isLoop,
              this.ruleBroke ? null : playStopLoopAnimation
            );
            //動畫開始的function
            this.playWheelStopAnimaPrefab(
              symbolEx.symbolInfo.symbolID,
              _animaPrefabTform,
              wheelIndex,
              i
            );
            //播放停輪symbol音效
            this.playSymbolStopAudio(symbolShowSetting, replaceData);
          } else {
            //沒有設定就直接播StopLoop
            playStopLoopAnimation();
          }
        }
      }
    }
    //        //2020/09/10 如果是急停，則全部輪音效一起播放(防止爆音)
    if (!PlatformData.instance.fastspin) {
      this.playAllStopWheelTempAudio(); //播放所有音效且清空暫存的音效
    }
    //        //2020/10/7 如果是PreWin則直接播放
    else if (this.wheelBlockControllerEx.isPrewin) {
      this.playAllStopWheelTempAudio(); //播放所有音效且清空暫存的音效
    } else {
      if (wheelIndex === this.wheelBlockControllerEx.wheelAry.length - 1)
        this.playAllStopWheelTempAudio(); //播放所有音效且清空暫存的音效
    }
  }

  private playAnimation(
    node: Node,
    animationName: string,
    isSpine = false,
    isLoop = false,
    callBack: Function = null,
    startTime = 0
  ) {
    //播Spine
    try {
      if (isSpine) {
        const spine: sp.Skeleton =
          node.getComponent(sp.Skeleton) ||
          node.getComponentInChildren(sp.Skeleton);
        node.active = true;
        if (animationName !== '') {
          spine.setEndListener(() => {
            if (callBack !== null) {
              callBack();
            }
            spine.setEndListener(null);
          });
          if (isLoop) {
            const onPlayLoopOnceEnd = () => {
              spine.setAnimation(0, animationName, isLoop);
            };
            spine.setCompleteListener(onPlayLoopOnceEnd);
          }
          if (startTime > 0) {
            if (Define.DEBUG_LOG) console.log('SymbolShowPrefab Play-', name);
            spine.getState();
            const entry: sp.spine.TrackEntry = spine.setAnimation(
              0,
              animationName,
              isLoop
            );
            entry.animationStart = startTime;
          } else {
            spine.setAnimation(0, "In", isLoop);
          }
        } else {
          throw 'SymbolShowPrefabController: Animation Name not found.';
        }
      }
      //播動畫
      else {
        // 2025.04.18
        // 改成強制播放Prefab內所有動畫
        const animations: Animation[] = node.getComponentsInChildren(Animation);
        animations.forEach(animation => {
          const name = animationName
            ? animationName
            : animation.defaultClip.name;
          animation.play();
          const animaState = animation.getState(name);

          animaState.wrapMode = isLoop
            ? AnimationClip.WrapMode.Loop
            : AnimationClip.WrapMode.Default;
          animaState.setTime(startTime);
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
}
