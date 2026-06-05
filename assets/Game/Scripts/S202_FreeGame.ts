/* eslint-disable camelcase */
import {_decorator, UIOpacity, v3} from 'cc';
import {PlatformGDK} from '../../CommonModule/Script/Platform/PlatformGDK';
import {SpecialGameState, WinType} from '../../SlotModule/Define/SlotGameData';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {SpecialGameBase} from '../../SlotModule/SpecialGame/SpecialGameBase';
import {WheelBlockController} from '../../SlotModule/Wheel/WheelBlockController';
import {S202_FreeGameData, S202_Status, S202_SymbolID} from './Define';
import Drop from './Drop';
import SceneManager from './SceneManager';
import {S202_DragonBallCtrl} from './S202_DragonBallCtrl';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';

const {ccclass, property} = _decorator;

@ccclass
export default class S202_FreeGame extends SpecialGameBase {
  @property({type: Drop, displayName: '掉落模組'})
  public dropManager: Drop = null;

  @property({type: SceneManager, displayName: '場景控制'})
  public sceneManager: SceneManager = null;

  @property({type: S202_DragonBallCtrl, displayName: '龍珠控制器'})
  public dragonBallCtrl: S202_DragonBallCtrl = null;

  private specialGameState: SpecialGameState = SpecialGameState.NO_SG;

  private data: S202_FreeGameData = new S202_FreeGameData();
  private sgMap: JSON = null;

  private get wheelCtrl(): WheelBlockController {
    return SlotGameMediator.instance.wheelsManager.wheelControllerList[0]
      .wheelBlock;
  }

  private winType = 0;
  private thisWin = 0;
  private totalWin = 0;
  private hitMaxWin = false;
  private bgmID: number = undefined;

  protected onLoad(): void {
    SlotGDK.instance.receiveStartGame.insert(this.getTotalWin, this);
  }

  public onDestroy(): void {
    SlotGDK.instance.receiveStartGame.remove(this.getTotalWin, this);
    this.unscheduleAllCallbacks();
  }

  public getTotalWin(data): void {
    this.totalWin = 0;
    if (data.hasOwnProperty('TotalWin')) {
      this.totalWin = data.TotalWin;
    }
  }

  ///這裡拆解current_script資料
  public enterSpecialGameOpening(jsonData: JSON) {
    this.isExecuting = true; ///EnterSpecialGameOpening和Recovery一定要把該Flag設成true
    this.registerEvent(true);
    SlotGameMediator.instance.awardController.reset();
    this.sendFeverCommand(null);
  }

  //這裡拆解狀態復原的current_script資料
  public recovery(jsonData: JSON): void {
    S202_FreeGameData.Status = S202_Status.FreeGame;
    this.registerEvent(true);
    this.data.Parse(jsonData['sg_map']);
    this.isExecuting = true; ///EnterSpecialGameOpening和Recovery一定要把該Flag設成true
    //this.sceneManager.setTimes(this.data.currentTime + 1, this.data.totalTime);
    SlotGDK.instance.eventActiveFreeGameBar.notify(true);
    SlotGDK.instance.eventSetFreeGameBarSpinTimes.notify(
      this.data.currentTime + 1,
      this.data.totalTime
    );
    this.sceneManager.Recover();
    this.wheelCtrl.wheelAry.forEach((wheel, wheelIndex) => {
      wheel.symbolAry.forEach((symbol, symbolIndex) => {
        symbol.node.getComponent(UIOpacity).opacity = 255;
        symbol.node.scale = v3(1, 1, 1);
      });
    });
    this.dropManager.totalWin = this.totalWin;
    this.playFreeGameBGM();
    this.finishRecovery();
  }

  public async Transition(): Promise<void> {
    S202_FreeGameData.Status = S202_Status.FreeGame;
    await this.sceneManager.Transition(0, 10);
    SlotGDK.instance.eventActiveFreeGameBar.notify(true);
    this.finishEnterGameOpening();
  }

  public getRequest(jsonData: JSON) {
    this.specialGameState = jsonData['sg_state'];
    let state = '';
    if (this.specialGameState === SpecialGameState.INIT) {
      state = 'INIT';
    } else if (this.specialGameState === SpecialGameState.PROCESS) {
      state = 'PROCESS';
    } else if (this.specialGameState === SpecialGameState.END) {
      state = 'END';
    }
    this.data.Parse(jsonData['sg_map']);

    ///判斷免費遊戲的狀態 0.沒有免費遊戲 1.初始化 2.一般流程 3.狀態復原 4.結束
    switch (this.specialGameState) {
      case SpecialGameState.INIT:
        this.receiveInitData(jsonData);
        break;
      case SpecialGameState.PROCESS:
      case SpecialGameState.END:
        this.receiveProcessData(jsonData);
        break;
    }
  }

  public registerEvent(active: boolean) {
    if (active) {
      this.wheelCtrl.eventFinished.insert(this.onAllWheelsSpinComplete, this);
    } else {
      this.wheelCtrl.eventFinished.remove(this.onAllWheelsSpinComplete, this);
    }
  }

  ///這裡處理INIT(初始化)的資料
  private receiveInitData(jsonData: JSON) {
    this.Transition();
    this.playFreeGameBGM();
  }

  public playFreeGameBGM(): void {
    // this.bgmID = SlotGDK.function(Audio.Play)('BONUS');
    this.bgmID = SlotGameMediator.instance.audioManager.play('BONUS');
    SlotGameMediator.instance.mainGameHost.stopMainGameBGM();
  }

  ///這裡處理PROCESS(一般流程)和END(結束)的資料
  private receiveProcessData(jsonData: JSON) {
    this.sgMap = jsonData['sg_map'];
    this.winType = jsonData['win_type']; ///報獎效果的狀態，用於區分BigWin、MegaWin、SuperWin....
    this.thisWin = jsonData['this_win_amount']; ///這一手的贏分
    S202_FreeGameData.lastTotalWin = this.totalWin;
    this.totalWin = jsonData['total_win_amount']; ///免費遊戲到目前為止累積的贏分
    SlotGameMediator.instance.awardController.initCustomized(
      this.thisWin,
      this.totalWin,
      this.winType,
      null,
      null
    );

    this.wheelCtrl.spinRequest(this.data.wbResult);
    this.wheelCtrl.stopAll();
    //this.FinishedToshowAward();
  }

  public doAfterShowAward() {
    SlotGameMediator.instance.awardController.reset();
    ///報獎後判斷現在的狀態是不是結束了
    if (this.specialGameState !== SpecialGameState.END) {
      this.finishedDoAfterProcess(); ///報獎後的流程跑完後，Call這個Function進入DoProcess
    } else {
      this.Leave();
    }
  }

  public async Leave(): Promise<void> {
    this.registerEvent(false);
    S202_FreeGameData.Status = S202_Status.MainGame;
    const wheelBlock =
      SlotGameMediator.instance.wheelsManager.wheelControllerList[0].wheelBlock;
    this.scheduleOnce(() => {
      wheelBlock.setWheelData(null, this.data.mainReels);
      this.dragonBallCtrl.updateMultipleList(this.data.mainGameMultipleList);

      wheelBlock.eventPrepareSpin.notify();
      this.sceneManager.BackToMain();
      this.dragonBallCtrl.setMultipleBall(this.data.mainGameMultipleList);
      this.dragonBallCtrl.setMainMultipleBall(
        this.data.mainGameMultipleList[0]
      );
      SlotGDK.instance.eventActiveFreeGameBar.notify(false);
    }, 1);
    SlotGameMediator.instance.mainGameHost.playMainGameBGM();
    SlotGameMediator.instance.audioManager.stop(this.bgmID);
    this.bgmID = undefined;
    PlatformGDK.instance.showWinMessage.notify(this.totalWin);
    await this.sceneManager.Leave(this.totalWin);
    this.finishSpecialGame(this.hitMaxWin ? 0 : this.totalWin);
  }

  public doProcess(): void {
    this.sendFeverCommand(null);
    //this.sceneManager.setTimes(this.data.currentTime + 1, this.data.totalTime);
    SlotGDK.instance.eventSetFreeGameBarSpinTimes.notify(
      this.data.currentTime + 1,
      this.data.totalTime
    );
    SlotGameMediator.instance.wheelsManager.spin();
  }

  private onAllWheelsSpinComplete() {
    if (this.data.retriggerTime > 0) {
      this.Retrigger();
    } else {
      this.scheduleOnce(this.prepareShowAward, 0.5);
    }
  }

  public async Retrigger() {
    // SlotGDK.function(Audio.Play)('SH_Line_special');
    SlotGameMediator.instance.audioManager.play('SH_Line_special');
    const bingoPos: number[][] = [];
    this.wheelCtrl.wheelAry.forEach((wheel, wheelID) => {
      bingoPos.push([]);
      wheel.symbolAry.forEach((symbol, symbolID) => {
        bingoPos[wheelID].push(
          symbol.symbolInfo.symbolID === S202_SymbolID.Scatter ? 1 : 0
        );
      });
    });

    this.scheduleOnce(this.prepareShowAward, 0.5);
  }

  private prepareShowAward() {
    if (
      this.sgMap?.hasOwnProperty('hit_max_win') &&
      (this.sgMap['hit_max_win'] as boolean)
    ) {
      this.hitMaxWin = true;
      this.showMaxWin();
    } else {
      this.hitMaxWin = false;
      this.finishedToShowAward();
    }
  }

  private showMaxWin(): void {
    if (SlotGDK.instance.eventShowCustomMaxWin.length > 0) {
      SlotGDK.instance.eventShowCustomMaxWin.notify(
        PlatformData.licenseSetting.infoMaxWinOdds,
        this.finishedToShowAward.bind(this)
      );
    } else {
      SlotGDK.instance.eventCheckMaxWin.notify(
        this.sgMap,
        this.finishedToShowAward.bind(this)
      );
    }
  }
}
