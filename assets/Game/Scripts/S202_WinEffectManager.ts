import {_decorator, CCBoolean} from 'cc';
import {DebugLogSetting} from '../../SlotModule/Define/DebugLogSetting';
import HostSetting from '../../SlotModule/Define/HostSetting';
import {AwardData, WinType} from '../../SlotModule/Define/SlotGameData';
import {WinEffectManager} from '../../SlotModule/Award/WinEffectManager';
const {ccclass, property} = _decorator;

@ccclass('S202_WinEffectManager')
export class S202_WinEffectManager extends WinEffectManager {
  @property(CCBoolean) skipMGAward = false;

  public playEffect(awardData: AwardData) {
    this.isSpecailGame = awardData.isSpecialGame;
    if (awardData.winType < WinType.BigWin) {
      awardData.winType = WinType.NoWin;
    }
    this.winType = awardData.winType;
    const isEnterSpecialGame: boolean = awardData.isEnterSpecialGame;
    const isSpSymbolWin: boolean = awardData.haveSpSymobolWin;
    const isSpecialGame: boolean =
      isEnterSpecialGame || this.isSpecailGame || isSpSymbolWin;
    if (isSpecialGame && HostSetting.instance.winEffect.skipInSpecialGame) {
      if (WinEffectManager.finishEvent !== null) {
        WinEffectManager.finishEvent.notify();
      }
      return;
    } else if (
      isSpecialGame === false &&
      this.skipMGAward &&
      this.winType < WinType.BigWin
    ) {
      if (WinEffectManager.finishEvent !== null) {
        WinEffectManager.finishEvent.notify();
      }
      return;
    }
    super.playEffect(awardData);
  }
}
