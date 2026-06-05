import {
  _decorator,
  Color,
  Vec2,
  Enum,
  CCFloat,
  Vec3,
  CCBoolean,
  v2,
  type TweenEasing,
} from 'cc';
import {LangType} from '../UIComponent/MultLang';

const {ccclass, property} = _decorator;

// ============================================================
// Re-exports — 為避免 50 款遊戲現有 import 失效,
// 大型 args / parser 類別已搬到 ./Args/ 下,本檔保持穩定的入口。
// ============================================================
export {
  WheelDataArgs,
  BingoArgs,
  BingoType,
  WheelBlockResultArgs,
} from './Args/WheelArgs';
export {
  WinType,
  FeatureType,
  FeatureData,
  SpecialGameState,
  AutoSpinArgs,
  GameStatusArgs,
  StartGameExArgs,
  BingoFrameData,
  AwardData,
} from './Args/GameArgs';
export type {BetInfo, ExtrabetInfo} from './Args/GameArgs';

import {WheelBlockResultArgs} from './Args/WheelArgs';
import {AutoSpinArgs, GameStatusArgs, WinType} from './Args/GameArgs';

export class SlotGameDataEx {
  public static get instance(): SlotGameDataEx {
    if (!window['slotGameDataEx']) {
      window['slotGameDataEx'] = new SlotGameDataEx();
    }
    return window['slotGameDataEx'];
  }

  public isLinesOrCost = 0; //(Lines)線數或(Ways)成本
  public betValue = 0; //每個LinesOrCost的押注
  public totalBetValue = 10; //總押注金額
  public betTextColor: Color = Color.WHITE; //Bet文字顏色
  public startGameData: JSON = null; //StartGame的Data資料
  public spinData: JSON = null; //Spin的Data資料
  public nextFeverData: JSON = null; //NextFever的Data資料
  public inGameJPData: JSON = null; //InGameJpData的Data資料
  //// YCMark
  public usingLanguageType: LangType = LangType.en; //使用的語言type
  public screenOffsetV2: Vec2 = Vec2.ZERO; //畫面位移
  public screenScale = 1; //畫面縮放
  public isMute = false;
  public bottomBarName = 'BottomBar'; //BottomBar名稱
  public bottomPanelDepth = 0; //BottomPanel的深度
  public bottomCoinNumberPosV3: Vec3 = Vec3.ZERO; //Bottom金幣數字的位置
  public bottomSpinBtnPosV3: Vec3 = Vec3.ZERO; //BottomSpinBtn的位置
  public isItemAwarding = false;
}

export class SpinResultExArgs {
  public wheelResultArgsList: WheelBlockResultArgs[];
  public autoSpinArgsData: AutoSpinArgs = null;
  public totalWin = 0;
  public thisWin = 0;
  public thisWinType: WinType = WinType.NoWin;
  public gameStatusData: GameStatusArgs = null;
  public extraInfo: JSON = null;

  public parse(data: JSON): SpinResultExArgs {
    this.wheelResultArgsList = [];
    const wheelBlockData: JSON[] = data['wheel_blocks'];
    for (const wheelblock of wheelBlockData) {
      this.wheelResultArgsList.push(
        new WheelBlockResultArgs().parse(wheelblock)
      );
    }
    this.autoSpinArgsData = new AutoSpinArgs().parse(data);
    if (data.hasOwnProperty('total_win_amount')) {
      this.totalWin = data['total_win_amount'];
    }
    if (data.hasOwnProperty('this_win_amount')) {
      this.thisWin = data['this_win_amount'];
    }
    if (data.hasOwnProperty('win_type')) {
      const winType: number = data['win_type'];
      this.thisWinType = winType;
    }
    this.gameStatusData = new GameStatusArgs().parse(data);

    if (data.hasOwnProperty('extra_info')) {
      this.extraInfo = data['extra_info'];
    }
    return this;
  }
}

/// <summary> Symbol類型 </summary>
export enum SymbolType {
  Normal = 0,
  Wild,
  Scatter,
  Bonus,
  Special,
}

/// <summary> Symbol資料 </summary>
export class SymbolInfomation {
  public type: SymbolType = SymbolType.Normal;
  public symbolID = 0;
  public spriteIndex = 0;
  constructor(typeID: SymbolType, spIndex: number, index: number) {
    this.type = typeID;
    this.spriteIndex = spIndex;
    this.symbolID = index;
  }
}

///轉輪旋轉的方向
export enum RotateDirection {
  Up,
  Down,
  Left,
  Right,
}

export enum WheelStatus {
  Initialize,
  StartRotate,
  Rotate,
  ReadyToStop,
  AllStopped,
}

export enum GamePlayMode {
  None,
  Normal,
  SpecialGame,
  Prewin,
}

// 判斷 doQuickStop 是由快停觸發還是玩家手動觸發
export enum StopBtnClickedType {
  TURBO_AUTO,
  Manual,
}

export enum WheelEasing {
  Easing,
  NoEasing,
}

@ccclass('WheelDropInfo')
export class WheelDropInfo {
  @property({type: CCFloat, displayName: '掉落時間'})
  public dropTime = 0.4;
  @property({type: CCFloat, displayName: '彈跳高度'})
  public bounceHeigh = 7;
  @property({type: CCFloat, displayName: '彈起時間'})
  public bounceUpTime = 0.1;
  @property({type: CCFloat, displayName: '彈起後掉落時間'})
  public bounceDownTime = 0.3;
  @property({type: CCFloat, displayName: '掉落間隔時間'})
  public symbolGapTime = 0.03;
  @property({type: CCFloat, displayName: '清空间隔时间'})
  public clearGapTime = 0.03;
  @property({type: CCFloat, displayName: '清空盘面时间'})
  public clearTime = 0.4;
  /**Spin 時 Symbol 等速掉落*/
  @property({displayName: 'Spin 時 Symbol 等速掉落'})
  public constantDropSpeed = false;
  @property({
    type: Enum(WheelEasing),
    displayName: 'Spin 時 Symbol 等速掉落',
  })
  private _wheelEasing: WheelEasing = WheelEasing.Easing;

  public set wheelEasing(value: WheelEasing) {
    this._wheelEasing = value;
  }

  /**Wheel 旋转中是否需要 Easing */
  public get wheelEasing(): TweenEasing {
    switch (this._wheelEasing) {
      case WheelEasing.Easing:
        return 'cubicIn';
      default:
        return null;
    }
  }
}

@ccclass('WheelRotateSetting')
export class WheelRotateSetting {
  @property({type: Enum(GamePlayMode)})
  public playModeName: GamePlayMode = GamePlayMode.None;
  @property({type: Enum(RotateDirection)})
  public direction: RotateDirection = RotateDirection.Down;
  @property(CCFloat)
  public readyToStopDelayTime = 0;
  @property(CCFloat)
  public readyToFastStopDelayTime = 0;
  @property(CCFloat)
  public wheelStopGapTime = 0.3;
  @property(Vec2)
  public breakPosition: Vec2 = v2();
  @property(CCFloat)
  public breakAndBoundTime = 0.125;
  @property(CCFloat)
  public wheelRotateSpeed = 25;
  @property(CCFloat)
  public breakSneakingTime = 0.5;

  @property(CCFloat)
  public breakSneakingSpeed = 20;

  @property(CCFloat)
  public addForce = 1.5;

  @property(CCFloat)
  public initRotateSpeed = 0;
}

@ccclass('WheelDropSetting')
export class WheelDropSetting {
  @property({type: Enum(GamePlayMode)})
  public playModeName: GamePlayMode = GamePlayMode.None;
  @property({type: Enum(RotateDirection)})
  public direction: RotateDirection = RotateDirection.Down;
  @property(CCFloat)
  public readyToStopDelayTime = 0.8;
  @property(CCFloat)
  public readyToFastStopDelayTime = 0.1;
  @property(CCFloat)
  public wheelStopGapTime = 0.4;
  @property(Vec2)
  public breakPosition: Vec2 = new Vec2();
  @property(CCFloat)
  public breakAndBoundTime = 0.2;
  @property(CCFloat)
  public wheelRotateSpeed = 20;
  @property(CCFloat)
  public breakSneakingTime = 1;

  @property(CCFloat)
  public breakSneakingSpeed = 20;

  @property(CCFloat)
  public addForce = 0.3;

  @property(CCFloat)
  public initRotateSpeed = -3;

  @property(CCBoolean)
  public immediatelyChangeResultSymbols = false;

  @property({type: WheelDropInfo, tooltip: '一般的掉落參數'})
  public normalWheelDropInfo: WheelDropInfo = new WheelDropInfo();

  @property({type: WheelDropInfo, tooltip: '急停的掉落參數'})
  public fastWheelDropInfo: WheelDropInfo = null;
}

/** Special Game Enter Timing */
export enum SpecialGameEnterTiming {
  AfterShowAward,
  WheelRotating,
}

/** Special Game Enter Timing */
export enum SpecialGameEndProcess {
  DoNextProcess,
  NeedShowAward,
  NeedAfterShowAward,
}

/** 紀錄Symbol位置的資料 */
export class SymbolPosInfo {
  public wheelIndex = -1;
  public sortIndex = -1;

  public symbolPosInfo(_iWheelIndex = 0, _iSortIndex = 0) {
    this.wheelIndex = _iWheelIndex;
    this.sortIndex = _iSortIndex;
  }

  /** 初始化至-1 */
  public reset() {
    this.wheelIndex = -1;
    this.sortIndex = -1;
  }
}

/** symbol連線顯示方式 */
export enum LineWayShowType {
  FRAME,
  HIGHLIGHT,
}

export enum ShowMode {
  All,
  LineThenAll,
  AllThenLine,
}

/** 特殊SPIN觸發方式 */
export enum SpecialSpinType {
  BUYBONUS,
  ITEM,
}
