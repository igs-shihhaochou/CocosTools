import {
  _decorator,
  Enum,
  Prefab,
  CCFloat,
  Component,
  Node,
  instantiate,
  tween,
} from 'cc';
const {ccclass, property} = _decorator;

import {AwardData, WinType} from '../Define/SlotGameData';
import {SlotGDK} from '../Define/SlotGDK';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import HostSetting from '../Define/HostSetting';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {WinEffectCtrl} from '../../CommonModule/Script/Award/WinEffectCtrl';
import {setOpacity} from '../../CommonModule/Script/Utility/NodeProperty';
import NodeEx from '../../CommonModule/Script/Utility/NodeEx';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';

@ccclass('WinEffect')
export class WinEffect {
  @property({type: Enum(WinType), displayName: 'Win Type'})
  public winType: WinType = WinType.NoWin;
  @property(Prefab)
  public rootObj: Prefab | null = null;
  @property(CCFloat)
  public finishTime = 0;
  @property({displayName: '音效名稱'})
  public clipName = '';
  @property({displayName: 'Fade Out 時間'})
  public audioFadeOutTime = 0;
  @property({displayName: '音效起始音量'})
  public volumeBegin = 1;
  @property({displayName: '音效結束音量'})
  public volumeEnd = 0;
}
@ccclass('WinEffectDictionary')
export class WinEffectDictionary {
  @property({type: WinEffect, displayName: '設定列表'})
  public winSoundList: WinEffect[] = [];

  public getWinEffect(winType: WinType): WinEffect {
    for (const winSound of this.winSoundList) {
      if (winSound.winType === winType) {
        return winSound;
      }
    }
    return null;
  }

  public getClipName(winType: WinType): string {
    const winSound = this.getWinEffect(winType);
    if (winSound) {
      return winSound.clipName;
    } else {
      return '';
    }
  }
}
@ccclass('WinEffectManager')
export class WinEffectManager extends Component {
  public static finishEvent: Delegate = new Delegate();
  public static beforeFinishEvent: Delegate = new Delegate();

  @property({type: SpawnPool, displayName: '物件池'})
  protected spawnPool: SpawnPool = null;

  @property(Node)
  protected targetNode: Node = null;

  @property({type: CCFloat, displayName: '大獎跳過的動畫時間'})
  private skipBigWinAnimDuration = 3;

  @property({type: CCFloat, displayName: '跳過報獎的音效關閉延遲'})
  private skipWinSoundDelay = 0;

  @property(Node)
  protected blackMask: Node = null;

  public spGameWinSoundLoopEnable = true;

  @property({type: WinEffectDictionary, displayName: '報獎設定'})
  protected winEffectDicionary: WinEffectDictionary = new WinEffectDictionary();

  protected winEffectCtrl: WinEffectCtrl = null;
  protected winType: WinType = WinType.NoWin;
  protected isSpecailGame = false;
  private playingWinSoundId: number = undefined;
  private underXTenWinEffectNode: Node | null = null;
  protected activeSkipButton: Function = null;

  public playEffect(awardData: AwardData) {
    this.isSpecailGame = awardData.isSpecialGame;
    this.winType = awardData.winType;
    const thisWin: number = awardData.thisWin;
    const winLabelAniTime: number = awardData.winLabelAniTime;
    const skipBtnDelay: number = awardData.skipBtnShowDelay;
    const isEnterSpecialGame: boolean = awardData.isEnterSpecialGame;
    const isSpSymbolWin: boolean = awardData.haveSpSymobolWin;
    const isSpecialGame: boolean =
      isEnterSpecialGame || this.isSpecailGame || isSpSymbolWin;
    let WinEffectFinishTime = winLabelAniTime;
    if (isSpecialGame && HostSetting.instance.winEffect.skipInSpecialGame) {
      if (DebugLogSetting.winEffectManager) {
        console.log('[WinEffectManager] Skip In SpecialGame');
      }
      this.sendFinishEvent();
      return;
    }
    switch (this.winType) {
      case WinType.NormalWin:
      case WinType.LightWin:
      case WinType.SmallWin:
        if (
          PlatformData.licenseSetting.noSoundUnder1 &&
          awardData.winOdds <= 1
        ) {
          break;
        }
        this.playWinSoundByMode(this.winType);
        // this.activeSkipBtn(false, 0.1);
        break;
      case WinType.BigWin:
      case WinType.MegaWin:
      case WinType.SuperWin:
      case WinType.SpecialWin:
        this.activeSkipBtn(true, skipBtnDelay);
        this.playWinSound(this.winType);
        break;
    }
    if (this.winType !== WinType.NoWin) {
      //2020/8/25 10倍以下獎項，走不同流程，不會卡住報獎流程
      if (this.winType <= 3) {
        const effectObj: WinEffect = this.winEffectDicionary.getWinEffect(
          this.winType
        );
        let effectTrans: Node = null;
        if (effectObj !== null) {
          if (this.underXTenWinEffectNode === null) {
            effectTrans = instantiate(effectObj.rootObj.data);
            effectTrans.parent = this.targetNode ? this.targetNode : this.node;
            // V3共用報獎本身使用OrientationHandler設定直橫版scale，故關閉此行避免scale異常 2025.04.09
            //effectTrans.scale = effectObj.rootObj.data.scale;
            this.underXTenWinEffectNode = effectTrans;
          } else {
            effectTrans = this.underXTenWinEffectNode;
          }
          this.winEffectCtrl =
            effectTrans.getComponent<WinEffectCtrl>(WinEffectCtrl);
          //優化報獎節奏，如果不為0，則讀取客製化滾分時間 2020/8/20
          WinEffectFinishTime =
            effectObj.finishTime === 0
              ? WinEffectFinishTime
              : effectObj.finishTime;
          this.winEffectCtrl.playEffect(
            thisWin,
            WinEffectFinishTime,
            this.stopEffect,
            this
          );
        } else {
          console.log('[WinEffectManager] No EffectObj, Skip Effect');
          this.stopEffect();
        }
      } else {
        const effectObj: WinEffect = this.winEffectDicionary.getWinEffect(
          this.winType
        );
        if (effectObj !== null) {
          // 2024/09/23 增加背景壓黑
          this.showBlackMask();

          const effectTrans: Node = this.spawnPool.spawn(
            effectObj.rootObj.data,
            this.targetNode ? this.targetNode : this.node
          );
          // V3共用報獎本身使用OrientationHandler設定直橫版scale，故關閉此行避免scale異常 2025.04.09
          //effectTrans.scale = effectObj.rootObj.data.scale;
          this.winEffectCtrl =
            effectTrans.getComponent<WinEffectCtrl>(WinEffectCtrl);
          //優化報獎節奏，如果不為0，則讀取客製化滾分時間 2020/8/20
          WinEffectFinishTime =
            effectObj.finishTime === 0
              ? WinEffectFinishTime
              : effectObj.finishTime;
          this.winEffectCtrl.playEffect(
            thisWin,
            WinEffectFinishTime,
            this.stopEffect,
            this
          );
        } else {
          console.log('[WinEffectManager] No EffectObj, Skip Effect');
          this.stopEffect();
        }
      }
    } else {
      this.activeSkipBtn(false, 0.01);
      this.schedule(this.sendFinishEvent, 0, 0, 0.02);
      this.schedule(this.stopSpecialWinSound, 0, 0, this.skipWinSoundDelay);
    }
  }

  public stopEffect() {
    const effectObj: WinEffect = this.winEffectDicionary.getWinEffect(
      this.winType
    );
    if (DebugLogSetting.winEffectManager) {
      console.log('stopEffect~!!');
    }
    SlotGDK.instance.eventClickSkipButton.remove(this.onSkipBtnClick, this);
    this.unschedule(this.activeSkipButton);
    const fadeOutDuration =
      effectObj === null ? this.skipWinSoundDelay : effectObj.audioFadeOutTime;
    switch (this.winType) {
      case WinType.NormalWin:
      case WinType.LightWin:
      case WinType.SmallWin:
        // this.activeSkipBtn(false, 0.01);
        this.schedule(this.sendFinishEvent, 0, 0, 0.02);
        this.schedule(this.stopSpecialWinSound, 0, 0, fadeOutDuration);
        break;
      case WinType.BigWin:
      case WinType.MegaWin:
      case WinType.SuperWin:
      case WinType.SpecialWin:
        this.activeSkipBtn(false, 0.01);
        SlotGDK.instance.eventForceStopBigWinEffect.insert(
          this.onForceStopBigWinEffect,
          this
        );
        this.schedule(
          this.despawnAllWinEffect,
          0,
          0,
          this.skipBigWinAnimDuration
        );
        // SlotGameMediator.instance.audioManager.SetVolume(
        //   this.playingWinSoundId,
        //   effectObj.volumeEnd,
        //   fadeOutDuration
        // );
        this.schedule(this.stopWinSound, 0, 0, fadeOutDuration);
        break;
    }
    this.sendBeforeFinishEvent();
  }

  public resetWinEffect() {
    this.spawnPool.despawnAll();
  }

  protected playWinSoundByMode(winType: WinType) {
    if (this.isSpecailGame && this.spGameWinSoundLoopEnable) {
      this.stopWinSound();
      this.playingWinSoundId =
        SlotGameMediator.instance.audioManager.play('win_count_loop');
    } else {
      this.playWinSound(winType);
    }
  }

  protected stopSpecialWinSound() {
    if (this.isSpecailGame && this.spGameWinSoundLoopEnable) {
      this.stopWinSound();
      this.playingWinSoundId =
        SlotGameMediator.instance.audioManager.play('win_count_end');
    }
  }

  private sendFinishEvent() {
    if (WinEffectManager.finishEvent !== null)
      WinEffectManager.finishEvent.notify();
  }

  private sendBeforeFinishEvent() {
    // 2024/09/23 隱藏背景壓黑
    this.hideBlackMask();

    if (WinEffectManager.beforeFinishEvent !== null)
      WinEffectManager.beforeFinishEvent.notify();
  }

  private despawnAllWinEffect() {
    SlotGDK.instance.eventForceStopBigWinEffect.remove(
      this.onForceStopBigWinEffect,
      this
    );
    this.spawnPool.despawnAll();
    this.sendFinishEvent();
  }

  private onForceStopBigWinEffect() {
    SlotGDK.instance.eventForceStopBigWinEffect.remove(
      this.onForceStopBigWinEffect,
      this
    );
    this.unschedule(this.despawnAllWinEffect);
    this.unschedule(this.stopWinSound);
    this.stopWinSound();
    this.spawnPool.despawnAll();
    this.sendFinishEvent();
  }

  protected activeSkipBtn(active: boolean, waitTime: number) {
    this.activeSkipButton = this.skipButton.bind(this, active);
    this.scheduleOnce(this.activeSkipButton, waitTime);
  }

  protected skipButton(active: boolean): void {
    if (active) {
      SlotGDK.instance.eventClickSkipButton.insert(this.onSkipBtnClick, this);
    }
    if (SlotGDK.instance.eventActiveTakeBtn.length > 0) {
      SlotGDK.instance.eventActiveTakeBtn.notify(active);
    }
  }

  private onSkipBtnClick() {
    this.winEffectCtrl.forceSkipEffect();
  }

  protected playWinSound(winType: WinType) {
    this.stopWinSound();
    const winEffect: WinEffect = this.winEffectDicionary.getWinEffect(winType);
    if (!winEffect) return;
    if (winEffect.clipName === '') return;
    if (DebugLogSetting.winEffectManager) {
      console.log('[playWinSound]', winType, winEffect, winEffect.clipName);
    }

    switch (this.winType) {
      case WinType.NormalWin:
      case WinType.LightWin:
      case WinType.SmallWin:
        this.playingWinSoundId = SlotGameMediator.instance.audioManager.play(
          winEffect.clipName
        );
        break;
      case WinType.BigWin:
      case WinType.MegaWin:
      case WinType.SuperWin:
      case WinType.SpecialWin:
        this.playingWinSoundId = SlotGameMediator.instance.audioManager.play(
          winEffect.clipName
        );
        break;
    }
  }

  protected stopWinSound() {
    if (this.playingWinSoundId !== undefined) {
      SlotGameMediator.instance.audioManager.stop(this.playingWinSoundId);
      this.playingWinSoundId = undefined;
    }
    // if (m_PlayingWinSound != null)
    //         SlotAudioManager.instance.Stop(m_PlayingWinSound);
  }

  public onDestroy() {
    SlotGDK.instance.eventClickSkipButton.remove(this.onSkipBtnClick, this);
    SlotGDK.instance.eventForceStopBigWinEffect.remove(
      this.onForceStopBigWinEffect,
      this
    );
    // SlotGDK.instance.eventForceStopBigWinEffect -= this.onForceStopBigWinEffect;
  }

  public getWinType() {
    return this.winType;
  }

  protected showBlackMask() {
    // 2024/09/13 增加背景壓黑
    if (DebugLogSetting.winEffectManager) {
      console.log('[WinEffectManager] [ShowBlackMask]', this.blackMask);
    }

    if (this.blackMask) {
      setOpacity(this.blackMask, 0);
      const nodeEx = new NodeEx(this.blackMask);
      tween(nodeEx).to(0.5, {opacity: 204}).start();
    }
  }

  protected hideBlackMask() {
    if (this.blackMask) {
      setOpacity(this.blackMask, 0);
    }
  }
}
