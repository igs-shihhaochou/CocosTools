import {_decorator, Component, CCFloat, CCBoolean, Enum} from 'cc';
const {ccclass, property} = _decorator;

import {AwardData, SpecialGameEnterTiming} from '../Define/SlotGameData';
import {SlotGDK} from '../Define/SlotGDK';
import HostSetting from '../Define/HostSetting';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {WinEffectManager} from '../Award/WinEffectManager';
import {AwardController} from '../Award/AwardController';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';

export enum SGProcessStatus {
  Wait,
  DoProcess,
  ShowAward,
  DoAfterShowAward,
  CheckHaveSpecialGame,
  ProcessReturn,
}

/// <summary>
/// FG與JG都可以使用
/// </summary>
@ccclass('SpecialGameBase')
export abstract class SpecialGameBase extends Component {
  //Events
  /// <summary> 進入SG的表演結束 </summary>
  public eventEnterGameOpeningFinished: Delegate = new Delegate();

  /// <summary> SG Recovery結束 </summary>
  public eventRecoveryFinished: Delegate = new Delegate();

  /// <summary> SG中，需要在接下去報獎時呼叫此Event </summary>
  public eventProcessFinished: Delegate = new Delegate();

  /// <summary> SG中，結束AfterShowAward時後呼叫</summary>
  public eventDoAfterProcessFinished: Delegate = new Delegate();

  /// <summary> SG含最後表演整個結束 </summary>
  public eventSGFinish: Delegate = new Delegate();

  /// Properties
  @property(CCFloat)
  public specialGameID = 0;

  /// <summary> SG進入的類型，通常是ShowAward之後 </summary>
  @property({type: Enum(SpecialGameEnterTiming)})
  public enterType: Readonly<SpecialGameEnterTiming> =
    SpecialGameEnterTiming.AfterShowAward;

  /// <summary> 是不是要按下Button才能進去 </summary>
  @property(CCBoolean)
  public isClickStartButtonToEnterGame: Readonly<boolean> = true;

  /// <summary> 是不是要有鈴聲 </summary>
  @property(CCBoolean)
  public isNeedAlarm = true;

  /// <summary> 是不是正在執行SG </summary>
  public isExecuting = false;

  public isNeedStart = false;

  public nowFeverProcessStatus: SGProcessStatus = SGProcessStatus.Wait;

  /// <summary> 進入SG前，聽到Alarm在叫的時候的表演(SpecialGameCtrl呼叫) </summary>
  public prepareEnterSpecialGameWhenAlarm(): void {}

  /// <summary> 進入SG當下收到的資料與表演(SpecialGameCtrl呼叫) </summary>
  public abstract enterSpecialGameOpening(jsonData: JSON, TotalTimes: number);

  /// <summary> 進入SG Recovery需要IsExecuting = true設定(SpecialGameCtrl呼叫) </summary>
  public enterSpecialGameRecovery(): void {
    this.isExecuting = true;
  }

  /// <summary> 進入SG Recovery表演(SpecialGameCtrl呼叫)，並且需要直接轉場+SPIN</summary>
  public recovery(_jsonData: JSON): void {}

  /// <summary>
  /// SG這個回合需要幹的事情，包含發送NextFever的Command給Server
  /// </summary>
  public abstract doProcess(): void;

  /// <summary> SG這一回合SG會收穫的資料與執行</summary>
  public getRequest(_jsonData: JSON): void {}

  /// <summary> 結束報獎後，SG要幹的事情，並且確認SG是不是該結束了，結束的話請跑結束表演流程並傳FinishSpecialGame()，否則呼叫Event_AfterShowAwardFinished</summary>
  public abstract doAfterShowAward();

  /// <summary> 離開SG/SpecialGameCtrl呼叫FreeGame該離開SG，不會進入報獎流程而是直接回MG的ReadyToSpin(如果沒有第二個SG要繼續執行) </summary>
  public finishSpecialGame(totalWin: number): void {
    this.isExecuting = false;
    if (HostSetting.instance.winEffect.showTotalAfterSpecialGame) {
      this.showTotalAward(totalWin);
    } else {
      if (this.eventSGFinish.length > 0) {
        this.eventSGFinish.notify(this);
      }
    }
  }

  /** SS 特規: 進入特殊遊戲並非每一手進行報獎，而是每手累計贏分，出特殊遊戲時報獎 */
  protected showTotalAward(totalWin: number): void {
    const winType: number = SlotGDK.instance.getWinType(totalWin);
    const awardData: AwardData = new AwardData();
    awardData.winType = winType;
    awardData.thisWin = totalWin;
    WinEffectManager.finishEvent.insert(this.showTotalAwardFinished, this);
    AwardController.startWinEffectEvent.notify();
    SlotGameMediator.instance.awardController.winEffectManager.playEffect(
      awardData
    );
  }

  /** SS 特規: 進入特殊遊戲並非每一手進行報獎，而是每手累計贏分，出特殊遊戲時報獎 */
  protected showTotalAwardFinished(): void {
    WinEffectManager.finishEvent.remove(this.showTotalAwardFinished, this);
    if (this.eventSGFinish.length > 0) {
      this.eventSGFinish.notify(this);
    }
  }

  /// <summary> 設定FreeGameBar </summary>
  protected setTimesFreeGameBar(
    _currentTimes: number,
    _totalTimes: number
  ): void {}

  /// <summary> 設定FreeGameBar文字版 </summary>
  protected setStringFreeGameBar(_barText: string): void {}

  protected sendFeverCommand(jsonData: JSON): void {
    if (Define.DEBUG_LOG && DebugLogSetting.specialGame) {
      console.log(
        '%c[SpecialGameBase][SendFeverCommand] SG(' + this.specialGameID + ')',
        'color:#ffff68'
      );
    }
    if (
      PlatformData.instance.isBonusPlay &&
      PlatformData.gameSetting.UseApiServer
    ) {
      if (SlotGDK.instance.sendBonusNextFeverCmd.length > 0) {
        SlotGDK.instance.sendBonusNextFeverCmd.notify(
          this.specialGameID,
          jsonData
        );
      }
    } else {
      if (SlotGDK.instance.sendNextFeverCmd.length > 0) {
        SlotGDK.instance.sendNextFeverCmd.notify(this.specialGameID, jsonData);
      }
    }
  }

  /// <summary> 結束開頭表演後就呼叫</summary>
  protected finishEnterGameOpening() {
    if (this.eventEnterGameOpeningFinished.length > 0) {
      this.eventEnterGameOpeningFinished.notify(this);
    }
  }

  protected finishRecovery() {
    if (this.isNeedStart) {
      if (SlotGDK.instance.eventShowEnterSpecialGameBtn !== null) {
        SlotGDK.instance.eventClickSpGameStartBtn.insert(
          this.onStartRecovery,
          this
        );
        SlotGDK.instance.eventShowEnterSpecialGameBtn.notify();
      }
    } else {
      if (this.eventRecoveryFinished.length > 0) {
        this.eventRecoveryFinished.notify(this);
      }
    }
  }

  protected onStartRecovery(): void {
    SlotGDK.instance.eventClickSpGameStartBtn.remove(
      this.onStartRecovery,
      this
    );
    if (this.isNeedStart && this.eventRecoveryFinished.length) {
      this.eventRecoveryFinished.notify(this);
    }
  }

  /// <summary> 結束表演後需要報獎就呼叫</summary>
  protected finishedToShowAward(): void {
    if (this.nowFeverProcessStatus === SGProcessStatus.DoProcess) {
      if (this.eventProcessFinished.length > 0) {
        this.eventProcessFinished.notify(this);
      }
    }
  }

  /// <summary> 結束表演後需要執行確認是不是有第二個SpecialGame就呼叫</summary>
  protected finishedDoAfterProcess(): void {
    if (this.nowFeverProcessStatus === SGProcessStatus.DoAfterShowAward) {
      if (this.eventDoAfterProcessFinished.length > 0) {
        this.eventDoAfterProcessFinished.notify(this);
      }
    }
  }
  public onDestroy() {}
}
