import {_decorator, Component} from 'cc';
const {ccclass, property} = _decorator;

import {SpecialGameBase, SGProcessStatus} from './SpecialGameBase';
import {
  SpecialGameEndProcess,
  GameStatusArgs,
  SpecialGameEnterTiming,
  SpecialGameState,
} from '../Define/SlotGameData';
import {AwardController} from '../Award/AwardController';
import {SlotGDK} from '../Define/SlotGDK';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import HostSetting from '../Define/HostSetting';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {DebugLogSetting} from '../Define/DebugLogSetting';

@ccclass('SpecialGameAgent')
export class SpecialGameAgent extends Component {
  // 按下Start按鈕後，告訴是不是這個特殊遊戲的第一回
  public eventOnStartSpecialGame: Function = null;

  // 客製化在鈴聲後的表演，替代制式的顯示Start
  public static customEnterSGMessage: Delegate = new Delegate();

  /// <summary> 回到MainGame(是不是要再跳一次ShowAward) </summary>
  public eventBackToMaingameMode: Delegate = new Delegate();

  @property([SpecialGameBase])
  private specialGameRemoteList: SpecialGameBase[] = [];

  //現在狀態
  /// <summary> 是不是有特殊Symbol(Scatter or Bonus) "第一次"進入遊戲 </summary>
  private isHaveFirstEnterSymbol = false;

  /// <summary> 是不是要按下Button才能進去(從SpecialGameBase取得) </summary>
  private clickStartButtonToEnterGame = false;

  /// <summary> 是不是必須要Alarm</summary>
  private isHaveToAlarm = false;

  /// <summary> 這手的SG的進入類型</summary>
  private sgEnterType: SpecialGameEnterTiming =
    SpecialGameEnterTiming.AfterShowAward;

  /// <summary> 是不是Recovery狀態 </summary>
  private isRecovery = false;

  /// <summary> 是不是Retrigger狀態 </summary>
  private isRetrigger = false;

  /// <summary> 是不是需要回到MainGame去特別做甚麼表演的動作後再跑下一個階段 </summary>
  private needBackToMGProcess: SpecialGameEndProcess =
    SpecialGameEndProcess.DoNextProcess;

  private specialGameList: number[] = [];

  /// <summary> 現在是不是進入特殊遊戲 </summary>
  private _nowSpecialGamePlayMode = false;

  get nowSpecialGamePlayMode(): boolean {
    return this._nowSpecialGamePlayMode;
  }

  /// <summary> Spin Request回來的資料 </summary>
  private gameMap: JSON = null;
  private sgTimes = 0;

  public onLoad() {
    SlotGameMediator.instance.specialGameAgent = this;
  }

  public init(): void {
    // get wait time
    for (let i = 0, count = this.specialGameRemoteList.length; i < count; i++) {
      const _remote: SpecialGameBase = this.specialGameRemoteList[i];
      _remote.eventEnterGameOpeningFinished.insert(
        this.onEnterGameOpeningFinished,
        this
      );
      _remote.eventRecoveryFinished.insert(
        this.onEnterGameOpeningFinished,
        this
      );
      _remote.eventProcessFinished.insert(this.onDoProcessFinished, this);
      _remote.eventDoAfterProcessFinished.insert(
        this.onDoAfterProcessFinished,
        this
      );
      _remote.eventSGFinish.insert(this.onSpecialGameFinished, this);
    }
    this.needBackToMGProcess = SpecialGameEndProcess.DoNextProcess;
  }

  public onDestroy(): void {
    this.eventOnStartSpecialGame = null;
    // SlotGDK.instance.Event_ClickSpGameStartBtn.remove(this.onClickEnterGameStartButton, this);
    AwardController.beforeDoBingoAlarm.remove(this.onWhenSpecialAlarm, this);
    AwardController.finishEvent.remove(this.onAwardProcessFinish, this);
    for (let i = 0, count = this.specialGameRemoteList.length; i < count; i++) {
      const _remote: SpecialGameBase = this.specialGameRemoteList[i];
      _remote.eventEnterGameOpeningFinished?.remove(
        this.onEnterGameOpeningFinished,
        this
      );
      _remote.eventRecoveryFinished?.remove(
        this.onEnterGameOpeningFinished,
        this
      );
      _remote.eventProcessFinished?.remove(this.onDoProcessFinished, this);
      _remote.eventDoAfterProcessFinished?.remove(
        this.onDoAfterProcessFinished,
        this
      );
      _remote.eventSGFinish?.remove(this.onSpecialGameFinished, this);
    }
  }

  /**
   * 自訂 setRecovery 攔截器。設定後,setRecovery 會先呼叫此 handler;
   * handler 回傳非 undefined 的 SpecialGameEnterTiming 表示「已處理」,直接以該值返回,
   * 不再執行預設邏輯。回傳 undefined 則 fallback 到預設邏輯。
   *
   * 用於取代各遊戲 extends SpecialGameAgent 並 override setRecovery 的樣板。
   * 由 SpecialGameAgentFlowExtension 自動註冊,或手動賦值。
   */
  public customSetRecoveryHandler:
    | ((data: GameStatusArgs) => SpecialGameEnterTiming | undefined)
    | null = null;

  /**
   * setRecovery 之後觸發的 Delegate(無 return,適合做 side-effect 補充處理)。
   * listener 簽章: (data: GameStatusArgs, result: SpecialGameEnterTiming) => void
   */
  public readonly eventAfterSetRecovery: Delegate = new Delegate();

  /**
   * processExecutingRemote 之後觸發的 Delegate(supports 跨 SG 跳轉檢查)。
   * listener 簽章: (specialGameID: number, data: JSON) => void
   */
  public readonly eventAfterProcessExecutingRemote: Delegate = new Delegate();

  /**
   * finished 之後觸發的 Delegate。
   * listener 簽章: (remote: SpecialGameBase) => void
   */
  public readonly eventAfterFinished: Delegate = new Delegate();

  /** 公開查找:依 specialGameID 取得對應的 SpecialGameBase。給 extension 使用,免 @ts-ignore。 */
  public findSpecialGameRemoteByID(
    specialGameID: number
  ): SpecialGameBase | null {
    return (
      this.specialGameRemoteList.find(r => r.specialGameID === specialGameID) ??
      null
    );
  }

  /** 公開讀取 specialGameList(回傳新陣列,避免外部直接 mutate)。 */
  public getSpecialGameList(): number[] {
    return [...this.specialGameList];
  }

  /** 公開推入 specialGameList(只新增不存在的 id)。 */
  public pushSpecialGameID(specialGameID: number): void {
    if (this.specialGameList.indexOf(specialGameID) === -1) {
      this.specialGameList.push(specialGameID);
    }
  }

  /** 公開移除 specialGameList 內某個 id。 */
  public removeSpecialGameID(specialGameID: number): void {
    const idx = this.specialGameList.indexOf(specialGameID);
    if (idx > -1) this.specialGameList.splice(idx, 1);
  }

  /** 公開讀取目前 gameMap(spin/recovery 收到的 SG 資料)。 */
  public getGameMap(): JSON | null {
    return this.gameMap;
  }

  /** 公開設定 isRecovery / isHaveFirstEnterSymbol 旗標,給 extension 使用。 */
  public setRecoveryFlags(
    isRecovery: boolean,
    isHaveFirstEnterSymbol: boolean
  ): void {
    this.isRecovery = isRecovery;
    this.isHaveFirstEnterSymbol = isHaveFirstEnterSymbol;
  }

  /// <summary> 進入遊戲後需要Recovery </summary>
  public setRecovery(data: GameStatusArgs): SpecialGameEnterTiming {
    if (this.customSetRecoveryHandler) {
      const custom = this.customSetRecoveryHandler(data);
      if (custom !== undefined) {
        if (this.eventAfterSetRecovery.length > 0) {
          this.eventAfterSetRecovery.notify(data, custom);
        }
        return custom;
      }
    }
    let timingStatus: SpecialGameEnterTiming =
      SpecialGameEnterTiming.AfterShowAward;
    this.isHaveFirstEnterSymbol = data.sgState === SpecialGameState.INIT;
    const _remote: SpecialGameBase = this.specialGameRemoteList.find(r => {
      return r.specialGameID === data.specialGameID;
    });
    if (_remote) {
      if (!this.isHaveFirstEnterSymbol) {
        this.isRecovery = true;
        _remote.enterSpecialGameRecovery();
        this.specialGameList.push(data.specialGameID);
      }
      timingStatus = _remote.enterType;
    }
    this.setRequest(data);
    if (this.eventAfterSetRecovery.length > 0) {
      this.eventAfterSetRecovery.notify(data, timingStatus);
    }
    // MainGame在解包時候會自動跳到EnterSpcialGame
    return timingStatus;
  }

  public setRequest(data: GameStatusArgs): void {
    if (data.specialGameID === -1) {
      return;
    }
    this.isHaveFirstEnterSymbol = data.sgState === SpecialGameState.INIT;
    this.gameMap = data.specialGameJsonData;
    this.sgTimes = data.sgTotalTimes;
    this.clickStartButtonToEnterGame = false;
    this.isHaveToAlarm = false;
    //確認這一次進入的是哪個遊戲
    const _remote: SpecialGameBase = this.specialGameRemoteList.find(r => {
      return r.specialGameID === data.specialGameID;
    });
    if (_remote) {
      if (this.isHaveFirstEnterSymbol && !_remote.isExecuting) {
        this.specialGameList.push(data.specialGameID);
        this.clickStartButtonToEnterGame =
          _remote.isClickStartButtonToEnterGame;
        this.isHaveToAlarm = _remote.isNeedAlarm;
      }
      this.sgEnterType = _remote.enterType;
      _remote.isNeedStart = data.isRecoveryNeedStart;
    } else {
      if (Define.DEBUG_LOG) {
        console.warn(
          '[SpecialGameAgent][setRequest] Target Game(' +
            data.specialGameID +
            ') is NULL!'
        );
      }
      return;
    }
    if (Define.DEBUG_LOG) {
      console.warn(
        '[SpecialGameAgent][setRequest] SG ID = ' +
          data.specialGameID +
          ' IsHaveEnterSymbol = ' +
          this.isHaveFirstEnterSymbol
      );
    }
  }

  /// <summary> 若特殊遊戲本身需要Retrigger </summary>
  public setRetrigger(
    isHaveAlarm: boolean,
    isNeedClickStartButton: boolean
  ): void {
    this.clickStartButtonToEnterGame = isNeedClickStartButton;
    this.isHaveToAlarm = isHaveAlarm;
    this.isRetrigger = true;
  }

  /// <summary> "開始遊戲"的訊息顯示，由MainGameHost呼叫 </summary>
  public enterSpecialGameMessage(
    enterType: SpecialGameEnterTiming,
    callBackFunc: Function,
    self
  ): boolean {
    const sgID: number = this.checkNextSpecialGame();
    this._nowSpecialGamePlayMode = sgID > -1 && this.sgEnterType === enterType;
    if (this._nowSpecialGamePlayMode) {
      if (this.isHaveFirstEnterSymbol) {
        if (callBackFunc) {
          this.eventOnStartSpecialGame = callBackFunc.bind(self);
        }
        // 客製化開始遊戲的那部分，可以依照m_gameMap內的資訊確認是否是Mystry或是其他狀況與需要的資料
        if (SpecialGameAgent.customEnterSGMessage.length > 0) {
          SpecialGameAgent.customEnterSGMessage.notify(
            sgID,
            this.gameMap,
            this.onClickEnterGameStartButton
          );
          this.isHaveFirstEnterSymbol = false;
          return true;
        } else {
          if (this.clickStartButtonToEnterGame) {
            // InputController click start event
            // SlotGDK.instance.Event_ClickSpGameStartBtn.insert(this.onClickEnterGameStartButton, this);
            this.showStartSpecialGameMessage();
            this.isHaveFirstEnterSymbol = false;
            return true;
          }
        }
      }
      if (
        !this.isHaveFirstEnterSymbol ||
        !this.clickStartButtonToEnterGame ||
        SpecialGameAgent.customEnterSGMessage.length === 0
      ) {
        if (callBackFunc) {
          callBackFunc(this.isRecovery || this.isHaveFirstEnterSymbol);
        }
        this.isHaveFirstEnterSymbol = false;
        this.doSpecialGame(sgID);
        return true;
      } else {
        //
      }
    }
    return false;
  }

  /// <summary> 執行指定的特殊遊戲(use Command Only)</summary>
  public processExecutingRemote(specialGameID: number, data: JSON): void {
    const _remote: SpecialGameBase = this.specialGameRemoteList.find(r => {
      return r.specialGameID === specialGameID;
    });
    if (_remote) {
      if (_remote.isExecuting) {
        _remote.getRequest(data);
      }
    }
    if (this.eventAfterProcessExecutingRemote.length > 0) {
      this.eventAfterProcessExecutingRemote.notify(specialGameID, data);
    }
  }

  /// <summary> 開始執行特殊遊戲 </summary>
  private doSpecialGame(specialGameID = -1): void {
    if (specialGameID === -1) {
      specialGameID = this.checkNextSpecialGame();
    }
    if (specialGameID > -1) {
      const remote: SpecialGameBase = this.specialGameRemoteList.find(r => {
        return r.specialGameID === specialGameID;
      });
      if (remote) {
        this._nowSpecialGamePlayMode = true;
        SlotGameMediator.instance.awardController.SetSpGameWinSoundLoopEnable(
          true
        ); //// SG專用報獎音效
        if (Define.DEBUG_LOG && DebugLogSetting.specialGame) {
          console.log(
            '%c[SpecialGameAgent][DoNextSpecialGame] SGID = ' +
              specialGameID +
              ' | ' +
              (remote.isExecuting ? 'Is Excuting!' : 'First Time') +
              ' | ' +
              (this.isRecovery ? ' recovery!' : ''),
            'color:#d7adf7'
          );
        }
        // 原本就有在執行，就該繼續
        if (this.isRecovery) {
          this.isRecovery = false;
          remote.recovery(this.gameMap);
        } else if (remote.isExecuting) {
          this.nextSGProcess(remote);
        } else {
          // 按下"開始遊戲"後進入特殊遊戲選擇畫面/特殊遊戲初始化
          // 接著由特殊遊戲內的CODE來決定遙控流程
          this.isHaveFirstEnterSymbol = false;
          this.clickStartButtonToEnterGame = false;
          this.isHaveToAlarm = false;
          this.needBackToMGProcess = SpecialGameEndProcess.DoNextProcess;

          remote.nowFeverProcessStatus = SGProcessStatus.Wait;
          remote.enterSpecialGameOpening(this.gameMap, this.sgTimes);

          if (HostSetting.instance.gameSetting.isUseShutter) {
            SlotGameMediator.instance.wheelsManager.openAllWheelBlock();
            SlotGameMediator.instance.mainGameHost.setMainGameBGMPause();
          }
        }
      }
    }
  }

  /// <summary> One Special Game finished, if all finished, back to main game mode.</summary>
  public finished(remote: SpecialGameBase): void {
    if (Define.DEBUG_LOG && DebugLogSetting.specialGame) {
      console.log(
        '[SpecialGameAgent][finished] Finish SG = ' + remote.specialGameID
      );
    }
    this._nowSpecialGamePlayMode = false;
    //remove now finished special game.
    if (this.specialGameList.length > 0) {
      if (
        remote.specialGameID ===
        this.specialGameList[this.specialGameList.length - 1]
      ) {
        this.specialGameList.shift();
      } else {
        // search right special game id to remove
        const removeSGID: number = this.specialGameList.findIndex(
          s => s === remote.specialGameID
        );
        if (removeSGID > -1) {
          this.specialGameList.splice(removeSGID, 1);
        }
      }
      if (SlotGDK.instance.eventActiveFreeGameBar.length > 0)
        SlotGDK.instance.eventActiveFreeGameBar.notify(false);
    }
    if (this.eventAfterFinished.length > 0) {
      this.eventAfterFinished.notify(remote);
    }
  }

  /// <summary> 確認這一手要玩哪個遊戲</summary>
  public checkNextSpecialGame(): number {
    let targetID = -1;
    if (this.specialGameList.length > 0) {
      targetID = this.specialGameList[this.specialGameList.length - 1];
    }
    return targetID;
  }

  /// <summary> 確認這一手「準備」要玩哪個遊戲</summary>
  public checkReadyToEnterSpecialGame(): boolean {
    if (this.specialGameList.length > 0) {
      const targetID: number =
        this.specialGameList[this.specialGameList.length - 1];
      const remote: SpecialGameBase = this.specialGameRemoteList.find(r => {
        return r.specialGameID === targetID;
      });
      if (!remote.isExecuting || this.isRetrigger) {
        return true;
      }
    }
    return false;
  }

  /// <summary> 確認現在在堆疊內有沒有這款遊戲</summary>
  public checkSpecialGameIsExist(targetSGID: number): boolean {
    if (this.specialGameList.length > 0) {
      const targetID: number = this.specialGameList.findIndex(
        s => s === targetSGID
      );
      if (targetID > -1) return true;
    }
    return false;
  }

  /// <summary> 確認現在這款遊戲有沒有執行</summary>
  public checkSpecialGameIsExecuting(targetSGID: number): boolean {
    if (this.specialGameList.length > 0) {
      const remote: SpecialGameBase = this.specialGameRemoteList.find(r => {
        return r.specialGameID === targetSGID;
      });
      if (remote) return remote.isExecuting;
    }
    return false;
  }

  /// <summary> 要知道有沒有鈴鈴聲 </summary>
  public isNeedBingoAlarm(): boolean {
    return this.isHaveToAlarm;
  }

  /// <summary> 顯示制式化的Start </summary>
  public showStartSpecialGameMessage(): void {
    // InputController Start Button Hide and Show
    if (SlotGDK.instance.eventShowEnterSpecialGameBtn.length > 0)
      SlotGDK.instance.eventShowEnterSpecialGameBtn.notify();
  }

  /// <summary> 取得現在List內有多少SpcialGame </summary>
  public getSpecialGameListCount(): number {
    return this.specialGameList.length;
  }

  /// <summary> 設定需要回到MG去做報獎或二次進SG的動作 </summary>
  public setNeedBackToMGToShowAward(): void {
    this.needBackToMGProcess = SpecialGameEndProcess.NeedShowAward;
  }

  /// <summary> 設定需要回到MG不要再報獎的動作 </summary>
  public setNeedBackToMGToAfterShowAward(): void {
    this.needBackToMGProcess = SpecialGameEndProcess.NeedAfterShowAward;
  }

  /// <summary> 額外設定要不要鈴聲 </summary>
  public setIsNeedAlarm(SetValue: boolean): void {
    this.isHaveToAlarm = SetValue;
  }

  private nextSGProcess(remote: SpecialGameBase = null): void {
    if (!remote) {
      // 只有ShowAward的時候才會取得null的Remote
      remote = this.specialGameRemoteList.find(r => {
        return (
          r.isExecuting && r.nowFeverProcessStatus === SGProcessStatus.ShowAward
        );
      });
      if (!remote) {
        // 可能已經被先Finished掉，所以直接跳
        if (Define.DEBUG_LOG && DebugLogSetting.specialGame) {
          console.warn(
            '[SpecialGameAgent][NextProcess] remote is NULL! Call checkHaveSpecialGame()'
          );
        }
        this.checkHaveSpecialGame();
        return;
      }
    }
    const feverProcess: SGProcessStatus = remote.nowFeverProcessStatus + 1;
    if (Define.DEBUG_LOG && DebugLogSetting.specialGame) {
      console.log(
        '%c[SpecialGameAgent][NextProcess] SG(' +
          remote.specialGameID +
          ') Status = ' +
          feverProcess,
        'color:#d7adf7'
      );
    }
    remote.nowFeverProcessStatus = feverProcess;
    switch (feverProcess) {
      case SGProcessStatus.DoProcess:
        remote.doProcess();
        break;
      case SGProcessStatus.ShowAward:
        this.showAward();
        break;
      case SGProcessStatus.DoAfterShowAward:
        remote.doAfterShowAward();
        break;
      case SGProcessStatus.CheckHaveSpecialGame:
        this.checkHaveSpecialGame(remote);
        break;
      case SGProcessStatus.ProcessReturn:
        this.processReturn(remote); //返回Wait
        break;
      default:
        this.nextSGProcess(remote);
        break;
    }
  }

  private showAward(): void {
    AwardController.finishEvent.insert(this.onAwardProcessFinish, this);
    AwardController.beforeDoBingoAlarm.insert(this.onWhenSpecialAlarm, this);
    SlotGameMediator.instance.awardController.doStart();
  }

  private checkHaveSpecialGame(remote: SpecialGameBase = null): void {
    this.isRetrigger = false;
    let isSameSG = false;
    const nextSGID: number = this.checkNextSpecialGame();
    const isHaveSG: boolean = nextSGID > -1;
    if (remote)
      isSameSG = nextSGID === remote.specialGameID && remote.isExecuting; //為了屏除SG雖然ID相同但是其實是要當作不同個SG來執行，所以更新判斷條件
    if (isHaveSG) {
      if (this.needBackToMGProcess === SpecialGameEndProcess.NeedShowAward) {
        if (this.eventBackToMaingameMode.length > 0) {
          this.eventBackToMaingameMode.notify(this.needBackToMGProcess);
        }
        this.needBackToMGProcess = SpecialGameEndProcess.DoNextProcess;
      } else {
        if (isSameSG) {
          this.nextSGProcess(remote);
        } else {
          this.enterSpecialGameMessage(
            SpecialGameEnterTiming.AfterShowAward,
            null,
            this
          );
        }
      }
    } else {
      // back to MG
      if (this.eventBackToMaingameMode.length > 0) {
        this.eventBackToMaingameMode.notify(this.needBackToMGProcess);
      }
    }
  }

  private processReturn(remote: SpecialGameBase): void {
    this.isHaveFirstEnterSymbol = false;
    this.clickStartButtonToEnterGame = false;
    this.isHaveToAlarm = false;
    remote.nowFeverProcessStatus = SGProcessStatus.Wait;
    this.nextSGProcess(remote);
  }

  /// <summary> 進入SG前，聽到Alarm在叫的時候的表演 </summary>
  public onWhenSpecialAlarm(): void {
    AwardController.beforeDoBingoAlarm.remove(this.onWhenSpecialAlarm, this);
    const sgID: number = this.checkNextSpecialGame();
    if (sgID > -1) {
      const remote: SpecialGameBase = this.specialGameRemoteList.find(r => {
        return r.specialGameID === sgID;
      });
      if (remote) remote.prepareEnterSpecialGameWhenAlarm();
    }
  }

  public onClickEnterGameStartButton(): void {
    // SlotGDK.instance.Event_ClickSpGameStartBtn.remove(this.onClickEnterGameStartButton, this);
    if (this.eventOnStartSpecialGame) {
      this.eventOnStartSpecialGame(true);
      this.eventOnStartSpecialGame = null;
    }
    // Do Real Enter Special Game
    this.doSpecialGame();
  }

  /// <summary> 結束開頭表演的時候 </summary>
  private onEnterGameOpeningFinished(remote: SpecialGameBase): void {
    this.nextSGProcess(remote);
  }

  /// <summary> Fever Game結束一回合的時候 </summary>
  private onDoProcessFinished(remote: SpecialGameBase): void {
    this.nextSGProcess(remote);
  }

  private onAwardProcessFinish(): void {
    AwardController.beforeDoBingoAlarm.remove(this.onWhenSpecialAlarm, this);
    AwardController.finishEvent.remove(this.onAwardProcessFinish, this);
    this.nextSGProcess();
  }

  /// <summary> 結束報獎後流程的時候 </summary>
  private onDoAfterProcessFinished(remote: SpecialGameBase): void {
    this.nextSGProcess(remote);
  }

  /// <summary> 結束全部的時候 </summary>
  private onSpecialGameFinished(remote: SpecialGameBase): void {
    this.finished(remote);
    this.nextSGProcess(remote);
  }
}
