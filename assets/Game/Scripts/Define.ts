import {WheelBlockResultArgs} from '../../SlotModule/Define/SlotGameData';

export enum S202_SymbolID {
  SmallJoker = 1,
  Scatter = 2,
  BigJoker = 3,
  Ace = 10,
  King = 11,
  Queen = 12,
  Jack = 13,
  Spades = 14,
  Heart = 15,
  Diamond = 16,
  Club = 17,
  GoldAce = 20,
  GoldKing = 21,
  GoldQueen = 22,
  GoldJack = 23,
  GoldSpades = 24,
  GoldHeart = 25,
  GoldDiamond = 26,
  GoldClub = 27,
}

export enum S202_Status {
  MainGame = 0,
  FreeGame,
}

export interface ComboInfo {
  combo: number;
  combo_multiple: number;
  wbResult: WheelBlockResultArgs;
  result: JSON;
  refresh_pos: number[];
  this_win_amount: number;
  bingo_position: number[][];
  extra_wild_info: JSON;
  vis_multiplier: number; //最終的倍數
  multiple_array: number[]; //上方乘倍
  advance: number; //這手要往前幾格
  bingo_multiplier: number; //乘倍的
}

export enum DragonBallColor {
  Blue = 0,
  Brown = 1,
  Gold = 2,
  Green = 3,
  Purple = 4,
}
// eslint-disable-next-line camelcase
export class S202_FreeGameData {
  public currentTime = 0;
  public totalTime = 0;
  public retriggerTime = 0;
  public mainReels: number[][] = [];
  public mainGameMultipleList: number[] = [];
  public result: JSON = null;
  public wbResult: WheelBlockResultArgs = null;
  public static Status: S202_Status = S202_Status.MainGame;
  public static lastTotalWin = 0;

  // eslint-disable-next-line camelcase
  public Parse(sgMap: JSON): S202_FreeGameData {
    try {
      this.currentTime = sgMap['current_times'];
      this.totalTime = sgMap['total_times'];
      this.currentTime = this.totalTime - this.currentTime;
      this.retriggerTime = sgMap['retrigger_times'];

      if (sgMap.hasOwnProperty('result')) {
        this.result = sgMap['result'];
        this.wbResult = new WheelBlockResultArgs().parse(this.result);
        /** FreeGame result 的 result_wheel 是變完牌後的結果，第一次停輪結果需要從第一次 Feature 結果盤面抓 */
        const comboInfo: ComboInfo[] = this.wbResult.featurList[0].value;
        this.wbResult.parseResultWheels(comboInfo[0].result);
      }
      if (sgMap.hasOwnProperty('main_reels')) {
        this.mainReels = sgMap['main_reels'];
      }
      if (sgMap.hasOwnProperty('ComboMultipleAddList')) {
        this.mainGameMultipleList = sgMap['ComboMultipleAddList'];
      }
    } catch (ex) {
      console.warn('[S202] [Define] ', ex);
      return null;
    }

    return this;
  }
}
