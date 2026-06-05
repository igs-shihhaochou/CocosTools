/* eslint-disable camelcase */
import {_decorator} from 'cc';
import {
  FeatureData,
  SlotGameDataEx,
} from '../../SlotModule/Define/SlotGameData';
import {DropSymbolPrefab, SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {FeatureRemote} from '../../SlotModule/Feature/FeatureRemote';
import Drop from './Drop';
import S202_Rule from './S202_Rule';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {ComboInfo, S202_FreeGameData, S202_Status} from './Define';

const {ccclass, property} = _decorator;

@ccclass
export default class S202_Combo extends FeatureRemote {
  @property({type: Drop, displayName: '掉落模組'})
  public drop: Drop = null;

  @property({type: S202_Rule, displayName: 'Rule '})
  public rule: S202_Rule = null;

  //開始第一個進入點
  public startFeature(DataArg: FeatureData): void {
    super.startFeature(DataArg);
    this.Drop();
  }

  public async Drop() {
    if (this._data.value.length > 1) {
      const comboInfoAry = this.CheckMaxWin(this._data.value);
      await this.drop.comboFeature(JSON.parse(JSON.stringify(comboInfoAry)));
    } else {
      SlotGDK.event(DropSymbolPrefab.ShowOffClipping).notify();
    }

    this.rule.resetRule();
    SlotGDK.event(DropSymbolPrefab.ShowAllSymbol).notify();
    this.playEnding();
  }

  /**
   * 檢查是否超過最大倍率，如果超過則回傳剛好超過最大倍率的ComboInfo陣列
   */
  public CheckMaxWin(data: ComboInfo[]): ComboInfo[] {
    let isHitMaxWin = false;
    let currentTotalWin = 0;
    if (S202_FreeGameData.Status !== S202_Status.FreeGame) {
      const spinData = SlotGameDataEx.instance.spinData;
      if (
        spinData?.hasOwnProperty('hit_max_win') &&
        (spinData['hit_max_win'] as boolean)
      ) {
        isHitMaxWin = true;
        this.drop.maxWinValue = spinData['total_win_amount'] as number;
      }
    } else {
      const freeGameData = SlotGameDataEx.instance.nextFeverData;
      if (
        freeGameData &&
        freeGameData.hasOwnProperty('sg_map') &&
        freeGameData['sg_map'].hasOwnProperty('hit_max_win') &&
        (freeGameData['sg_map']['hit_max_win'] as boolean)
      ) {
        isHitMaxWin = true;
        this.drop.maxWinValue = freeGameData['total_win_amount'] as number;
        currentTotalWin = S202_FreeGameData.lastTotalWin;
      }
    }

    //如果超過最大倍率，則回傳剛好超過最大倍率的ComboInfo陣列
    if (isHitMaxWin) {
      let comboIndex = 0;
      for (let i = 0; i < data.length; i++) {
        const comboInfo = data[i];
        currentTotalWin += comboInfo.this_win_amount;

        if (
          currentTotalWin / PlatformData.instance.originalTotalBet >
          PlatformData.licenseSetting.infoMaxWinOdds
        ) {
          comboIndex = i;
          break;
        }
      }
      const sliceIndex =
        comboIndex + 2 > data.length ? data.length : comboIndex + 2;
      return data.slice(0, sliceIndex);
    } else {
      return data;
    }
  }
}
