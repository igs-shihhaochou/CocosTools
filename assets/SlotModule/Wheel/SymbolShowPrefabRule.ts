import {_decorator, CCFloat, CCBoolean, CCInteger, Component} from 'cc';
const {ccclass, property} = _decorator;

import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {Delegate} from '../../CommonModule/Script/ExtraType';
@ccclass('SpecialSymbolRule')
export class SpecialSymbolRule {
  @property(CCFloat)
  public symbolId = -1; // Symbol ID
  @property(CCFloat)
  public needAmount = 3; // 最低要幾顆Symbol，才會達成進入特殊遊戲條件
  @property(CCFloat)
  public singleWheelDisplayMaxAmount = 0; // 單輪出現的最大數量(在m_iDisplayWheelAry中)
  @property(CCBoolean)
  public fixedAtFirstWheel = false; // 必須要第一輪有出現(在m_iDisplayWheelAry中)
  @property(CCBoolean)
  public continuousInWheel = false; // 必須要連續出現(在m_iDisplayWheelAry中)
  @property([CCInteger])
  public displayWheelAry: number[] = []; // 會出現的輪
  public accumulationAmount = 0; // 當前累積的數量
  public isContiune = true; // 判斷當前有沒有連續出現
  public ruleBreak = false; // 規則不符的Flag

  public reset(): void {
    this.accumulationAmount = 0;
    this.ruleBreak = false;
    this.isContiune = true;
  }
}

@ccclass('SymbolReplaceSetting')
export class SymbolReplaceSetting {
  @property(CCFloat)
  public searchSymbolId = 0;
  @property(CCFloat)
  public replaceSymbolId = 0;
  @property(CCBoolean)
  public useReplaceSymbolWheelStopAudio = false;
}

export interface ReplaceSymbolData {
  _replaceSymbolId: number;
  _isPlayReplaceSymbolAudio: boolean;
}

/*
 * 根據Inspector的設定判斷Symbol動畫播放規則
 * byYC
 */
@ccclass('SymbolShowPrefabRule')
export class SymbolShowPrefabRule extends Component {
  @property([SpecialSymbolRule])
  public specialSymbolRuleList: SpecialSymbolRule[] = [];

  //用於Symbol可以互相替代的狀況 *假設設定Wild替代成Scatter時，Scatter有連線的話Wild當成Scatter(播放Wild動畫，Scatter音效)，Scatter沒連線的話Wild還是Wild(播放Wild自己的動畫和音效)   *此為金雞報喜規格制定
  @property([SymbolReplaceSetting])
  public replaceSymbolIdList: SymbolReplaceSetting[] = [];
  public ruleBreak: Delegate = new Delegate();

  /// <summary>
  /// 重製當前紀錄的規則(每一手計算前都要做一次)
  /// </summary>
  public reset(): void {
    for (const specialSymbolRule of this.specialSymbolRuleList) {
      specialSymbolRule.reset();
    }
  }

  /// <summary>
  /// 塞入當下停下那輪的資料 *先塞資料再CheckSymbolShowl,為了解決複數Symbol的規格必須整倫一起看
  /// </summary>
  public setSingleWheelData(
    _currentWheelIndex: number,
    _singleWheelData: number[]
  ): void {
    for (let symbolData of _singleWheelData) {
      if (this.replaceSymbolIdList) {
        const tempSymbolReplaceSetting: SymbolReplaceSetting =
          this.replaceSymbolIdList.find(
            _searchSymbolReplaceSetting =>
              _searchSymbolReplaceSetting.searchSymbolId === symbolData
          );
        if (tempSymbolReplaceSetting) {
          if (!this.isRuleBreak(tempSymbolReplaceSetting.replaceSymbolId)) {
            symbolData = tempSymbolReplaceSetting.replaceSymbolId;
          }
        }
      }
      const tempSpecialSymbolRult: SpecialSymbolRule =
        this.specialSymbolRuleList.find(
          _searchSpecialSymbolRule =>
            _searchSpecialSymbolRule.symbolId === symbolData
        );
      if (tempSpecialSymbolRult) {
        if (
          this.integerArrayExist(
            tempSpecialSymbolRult.displayWheelAry,
            _currentWheelIndex
          )
        ) {
          tempSpecialSymbolRult.accumulationAmount++;
        }
      }
    }
    // 判斷特殊Symbol規則
    for (const specialSymbolRule of this.specialSymbolRuleList) {
      if (specialSymbolRule.ruleBreak) {
        continue;
      }
      const canHaveMaxAmount: number =
        this.checkRemainingDisplayWheel(
          specialSymbolRule.displayWheelAry,
          _currentWheelIndex
        ) *
          specialSymbolRule.singleWheelDisplayMaxAmount +
        specialSymbolRule.accumulationAmount;
      if (canHaveMaxAmount < specialSymbolRule.needAmount) {
        if (Define.DEBUG_LOG) {
          console.log(
            '<color=#00ff00>[SymbolShowPrefabRule] Symbol ID : ' +
              specialSymbolRule.symbolId +
              ', RuleBreak : Amount</color>'
          );
        }
        specialSymbolRule.ruleBreak = true;
        if (this.ruleBreak) {
          this.ruleBreak.notify(specialSymbolRule.symbolId);
        }
        continue;
      }
      if (
        specialSymbolRule.fixedAtFirstWheel &&
        specialSymbolRule.displayWheelAry[0] === _currentWheelIndex &&
        !this.integerArrayExist(_singleWheelData, specialSymbolRule.symbolId)
      ) {
        if (Define.DEBUG_LOG) {
          console.log(
            '<color=#00ff00>[SymbolShowPrefabRule] Symbol ID : ' +
              specialSymbolRule.symbolId +
              ', RuleBreak : FirstWheel</color>'
          );
        }
        specialSymbolRule.ruleBreak = true;
        if (this.ruleBreak) {
          this.ruleBreak.notify(specialSymbolRule.symbolId);
        }
        continue;
      }
      if (
        specialSymbolRule.continuousInWheel &&
        this.integerArrayExist(
          specialSymbolRule.displayWheelAry,
          _currentWheelIndex
        ) &&
        !this.integerArrayExist(_singleWheelData, specialSymbolRule.symbolId)
      ) {
        if (
          specialSymbolRule.accumulationAmount < specialSymbolRule.needAmount
        ) {
          if (Define.DEBUG_LOG) {
            console.log(
              '<color=#00ff00>[SymbolShowPrefabRule] Symbol ID : ' +
                specialSymbolRule.symbolId +
                ', RuleBreak : ContinuousInWheel</color>'
            );
          }
          specialSymbolRule.ruleBreak = true;
          if (this.ruleBreak) {
            this.ruleBreak.notify(specialSymbolRule.symbolId);
          }
          continue;
        } else {
          specialSymbolRule.isContiune = false;
        }
      }
    }
  }

  /// <summary>
  /// 檢查該Symbol要不要表演 *先塞資料再CheckSymbolShowl,為了解決複數Symbol的規格必須整輪一起看
  /// </summary>
  public checkSymbolShow(_wheelIndex: number, _symbolID: number): boolean {
    if (this.replaceSymbolIdList) {
      const tempSymbolReplaceSetting: SymbolReplaceSetting =
        this.replaceSymbolIdList.find(
          _searchSymbolReplaceSetting =>
            _searchSymbolReplaceSetting.searchSymbolId === _symbolID
        );
      if (tempSymbolReplaceSetting) {
        if (!this.isRuleBreak(tempSymbolReplaceSetting.replaceSymbolId)) {
          _symbolID = tempSymbolReplaceSetting.replaceSymbolId;
        }
      }
    }
    const tempSpecialSymbolRult: SpecialSymbolRule =
      this.specialSymbolRuleList.find(
        _searchSpecialSymbolRule =>
          _searchSpecialSymbolRule.symbolId === _symbolID
      );
    if (tempSpecialSymbolRult) {
      if (
        tempSpecialSymbolRult.ruleBreak ||
        !this.integerArrayExist(
          tempSpecialSymbolRult.displayWheelAry,
          _wheelIndex
        )
      ) {
        return false;
      }
      if (!tempSpecialSymbolRult.isContiune) {
        return false;
      }
    }
    return true;
  }

  /// <summary>
  /// 取得ReplaceSymbol的資料
  /// </summary>
  public getReplaceSymbolData(_searchSymbol: number): ReplaceSymbolData {
    const ret = {
      _replaceSymbolId: 0,
      _isPlayReplaceSymbolAudio: false,
    };
    if (this.replaceSymbolIdList) {
      const tempSymbolReplaceSetting: SymbolReplaceSetting =
        this.replaceSymbolIdList.find(
          _searchSymbolReplaceSetting =>
            _searchSymbolReplaceSetting.searchSymbolId === _searchSymbol
        );
      if (tempSymbolReplaceSetting) {
        if (!this.isRuleBreak(tempSymbolReplaceSetting.replaceSymbolId)) {
          ret._replaceSymbolId = tempSymbolReplaceSetting.replaceSymbolId;
          ret._isPlayReplaceSymbolAudio =
            tempSymbolReplaceSetting.useReplaceSymbolWheelStopAudio;
        }
      }
    }
    return ret;
  }

  //判斷指定SymbolId當前的規則有沒有被中斷
  private isRuleBreak(_symbolId: number): boolean {
    const tempReplaceSpecialSymbolRult: SpecialSymbolRule =
      this.specialSymbolRuleList.find(
        _searchSpecialSymbolRule =>
          _searchSpecialSymbolRule.symbolId === _symbolId
      );
    if (
      tempReplaceSpecialSymbolRult &&
      tempReplaceSpecialSymbolRult.ruleBreak
    ) {
      return true;
    }
    return false;
  }

  //檢查Int陣列中有沒有存在指定的值
  private integerArrayExist(_ary: number[], _value: number): boolean {
    for (const value of _ary) {
      if (value === _value) {
        return true;
      }
    }
    return false;
  }

  //檢查接下來還有機會出現Symbol的輪數
  private checkRemainingDisplayWheel(
    _displayWheelAry: number[],
    _currentWheelIndex: number
  ): number {
    let _wheelAmount = 0;
    for (const wheel of _displayWheelAry) {
      if (wheel > _currentWheelIndex) {
        _wheelAmount++;
      }
    }
    return _wheelAmount;
  }
}
