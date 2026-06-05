import HostSetting from '../HostSetting';
import {WheelDataArgs, BingoArgs} from './WheelArgs';

/// <summary> 贏分類型 </summary>
export enum WinType {
  NoWin,
  NormalWin,
  LightWin,
  SmallWin,
  BigWin,
  MegaWin,
  SuperWin,
  SpecialWin,
}

export enum FeatureType {
  Rotating,
  End,
  SingleEnd,
}

export class FeatureData {
  public featureKey = '';
  public value = null;
  public featureSection: FeatureType = FeatureType.End;

  constructor(key: string, obj, ftype: FeatureType) {
    this.featureKey = key;
    this.featureSection = ftype;
    this.value = obj;
  }
}

export enum SpecialGameState {
  NO_SG = 0,
  INIT = 1,
  RECOVERY = 3,
  PROCESS = 2,
  END = 4,
}

export type BetInfo = {
  lineBet: number;
  totalBet: number;
};

export type ExtrabetInfo = {
  enabled: boolean;
  ratio: number;
  status: boolean;
  extraBetList: number[];
};

/** 自動旋轉的相關參數 */
export class AutoSpinArgs {
  public isCanAutoSpin: boolean;
  public timesAry: number[];
  public unlockLvAry: number[];
  public enableAry: boolean[];
  public unlockVip: number;

  public parse(data: JSON): AutoSpinArgs {
    if (data.hasOwnProperty('auto_spin_info')) {
      const autoJsonData: JSON = data['auto_spin_info'];
      if (autoJsonData.hasOwnProperty('auto_spin')) {
        this.isCanAutoSpin = autoJsonData['auto_spin'];
      }
      if (autoJsonData.hasOwnProperty('unlocked_vip')) {
        this.unlockVip = autoJsonData['unlocked_vip'];
      }
      if (autoJsonData.hasOwnProperty('count_type')) {
        this.timesAry = autoJsonData['count_type'];
      }
      if (autoJsonData.hasOwnProperty('unlocked')) {
        const enableIntAry: number[] = autoJsonData['unlocked'];
        const count: number = enableIntAry.length;
        this.enableAry = [];
        for (let i = 0; i < count; i++) {
          this.enableAry.push(enableIntAry[i] === 1);
        }
      }
      if (autoJsonData.hasOwnProperty('level')) {
        this.unlockLvAry = autoJsonData['level'];
      }
    }
    return this;
  }
}

export class GameStatusArgs {
  public specialGameID = -1;
  public sgState: SpecialGameState = SpecialGameState.NO_SG;
  public specialGameJsonData: JSON = null;
  public sgTotalTimes = 0;
  public betNowID = 0;
  public bingoCurrentLines = 0;
  public bingoCurrentCosts = 0;
  public isRecoveryNeedStart = false;

  public parse(data: JSON): GameStatusArgs {
    if (data.hasOwnProperty('game_state')) {
      const gameStatusJson: JSON = data['game_state'];
      if (gameStatusJson.hasOwnProperty('sg_state')) {
        this.sgState = gameStatusJson['sg_state'] as SpecialGameState;
      }
      if (gameStatusJson.hasOwnProperty('current_sg_total_times')) {
        this.sgTotalTimes = gameStatusJson['current_sg_total_times'];
      }
      if (gameStatusJson.hasOwnProperty('current_sg_id')) {
        this.specialGameID = gameStatusJson['current_sg_id'];
      }
      if (gameStatusJson.hasOwnProperty('current_bet_id')) {
        this.betNowID = gameStatusJson['current_bet_id'];
      }
      if (gameStatusJson.hasOwnProperty('current_costs')) {
        this.bingoCurrentCosts = gameStatusJson['current_costs'];
      }
      if (gameStatusJson.hasOwnProperty('current_lines')) {
        this.bingoCurrentLines = gameStatusJson['current_lines'];
      }
      if (gameStatusJson.hasOwnProperty('current_script')) {
        if (Object.keys(gameStatusJson['current_script']).length > 0)
          this.specialGameJsonData = gameStatusJson['current_script'];
      }
      if (gameStatusJson.hasOwnProperty('recovery_need_start')) {
        this.isRecoveryNeedStart = gameStatusJson['recovery_need_start'];
      }
    }
    return this;
  }
}

export class StartGameExArgs {
  public fakeWheelDataList: WheelDataArgs[] = null;
  public autoSpinArgsData: AutoSpinArgs = null;
  public bingoMaxLines = 0;
  public bingoLinesFixed = false;
  public bingoMaxCosts = 0;
  public bingoCostsFixed = false;
  public betMinID = 0;
  public betMaxID = 0;
  public betIDAry: number[] = null;
  public specialOddsJson: JSON = null;
  public gameStatusData: GameStatusArgs = null;
  public totalWin = 0;
  public extraInfo: JSON = null;
  public doubleGameInfo: JSON = null;
  public isHaveCoupon = false;
  public extraBetInfo: ExtrabetInfo = null;
  public winType: number[] = null;
  public betList: BetInfo[] = null;
  public betMap: Map<number, number> = new Map();
  public currentLineBet: number = null;

  public parse(data: JSON): StartGameExArgs {
    this.fakeWheelDataList = [];
    const wheelBlockData: JSON[] = data['wheel_blocks'];
    for (const wheelblock of wheelBlockData) {
      const wheelArgs: WheelDataArgs = new WheelDataArgs().parse(wheelblock);
      this.fakeWheelDataList.push(wheelArgs);
    }

    this.currentLineBet = data['current_line_bet'];
    if (data.hasOwnProperty('bet_list')) {
      this.betList = [];
      const betListData = data['bet_list'].sort(
        (a, b) => b['total_bet'] - a['total_bet']
      );
      for (const betData of betListData) {
        this.betList.push({
          lineBet: betData['line_bet'],
          totalBet: betData['total_bet'],
        });
        this.betMap.set(betData['total_bet'], betData['line_bet']);
      }
    }

    if (data.hasOwnProperty('max_lines')) {
      this.bingoMaxLines = data['max_lines'];
    }
    if (data.hasOwnProperty('max_costs')) {
      this.bingoMaxLines = data['max_costs'];
    }
    if (data.hasOwnProperty('special_odds')) {
      this.specialOddsJson = data['special_odds'];
    }
    this.gameStatusData = new GameStatusArgs().parse(data);
    if (data.hasOwnProperty('extra_info')) {
      this.extraInfo = data['extra_info'];
    }
    if (data.hasOwnProperty('double_game_info')) {
      this.doubleGameInfo = data['double_game_info'];
    }
    if (data.hasOwnProperty('total_win_amount')) {
      this.totalWin = data['total_win_amount'];
    }
    this.isHaveCoupon = false;
    if (data.hasOwnProperty('social_data')) {
      const socialJson: JSON = data['social_data'];
      if (socialJson.hasOwnProperty('coupon')) {
        this.isHaveCoupon = true;
      }
    }
    if (data.hasOwnProperty('ExtraBet')) {
      this.extraBetInfo = {
        enabled: data['ExtraBet']['Enable'],
        ratio: data['ExtraBet']['Ratio'],
        status: data['ExtraBet']['Status'],
        extraBetList: data['ExtraBet']['extra_bet_list'],
      };
    }
    if (data.hasOwnProperty('WinType')) {
      this.winType = data['WinType'];
    }
    return this;
  }
}

export class BingoFrameData {
  public wheelBlockIndex = -1;
  public bingoList: BingoArgs[] = [];
  public spSymbolBingoList: number[][] = [];
  /** 這輪線獎的加總結果 */
  public allBingoSymbolPosition: number[][] = [];
}

export class AwardData {
  public isEnterSpecialGame = false;
  public isSpecialGame = false;
  public thisWin: number;
  public totalWin: number;
  public winType: WinType;
  public winOdds: number;
  public needBingoAlarm = false;
  public waitBingoFrameEnd = false;
  public haveSpSymobolWin = false;
  public bingoFrameStayTime = 2;
  public bingoDataList: BingoFrameData[] = [];

  /** 特殊報獎的滾錢時間 */
  get winLabelAniTime(): number {
    let time = 0;
    switch (this.winType) {
      case WinType.NormalWin:
      case WinType.LightWin:
      case WinType.SmallWin:
        time = HostSetting.instance.winEffect.smallWin.duration;
        break;
      case WinType.BigWin:
        time = HostSetting.instance.winEffect.bigWin.duration;
        break;
      case WinType.MegaWin:
        time = HostSetting.instance.winEffect.megaWin.duration;
        break;
      case WinType.SuperWin:
        time = HostSetting.instance.winEffect.superWin.duration;
        break;
      case WinType.SpecialWin:
        time = HostSetting.instance.winEffect.specialWin.duration;
        break;
    }
    return time;
  }

  get winLabelRollTime(): number {
    let time = 0;
    switch (this.winType) {
      case WinType.NormalWin:
      case WinType.LightWin:
      case WinType.SmallWin:
        time = HostSetting.instance.winLabel.smallWin.duration;
        break;
      case WinType.BigWin:
        time = HostSetting.instance.winLabel.bigWin.duration;
        break;
      case WinType.MegaWin:
        time = HostSetting.instance.winLabel.megaWin.duration;
        break;
      case WinType.SuperWin:
        time = HostSetting.instance.winLabel.superWin.duration;
        break;
      case WinType.SpecialWin:
        time = HostSetting.instance.winLabel.specialWin.duration;
        break;
    }
    return time;
  }

  /** 略過按鈕出現的延遲時間 */
  get skipBtnShowDelay(): number {
    return 0;
  }
}
