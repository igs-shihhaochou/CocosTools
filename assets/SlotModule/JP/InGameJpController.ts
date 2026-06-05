import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {StartGameExArgs} from '../Define/SlotGameData';
import {SlotGDK} from '../Define/SlotGDK';
import {JpWinEffectManager} from './JpWinEffectManager';

import {_decorator, Component} from 'cc';
import {InGameJPType} from './JpType';
import {ProtcolSetting, JpItemSett, JpHintSett} from './JpItems';

// 對外保留 export(避免破壞既有 import 來源)
export {JpItemSett};

const {ccclass, property} = _decorator;

@ccclass('InGameJpController')
export default class InGameJpController extends Component {
  @property([JpItemSett])
  protected jpItemAry: JpItemSett[] = [];

  @property(JpHintSett)
  private hintSett: JpHintSett = null;

  @property(ProtcolSetting)
  protected protSett: ProtcolSetting = null;

  @property(JpWinEffectManager)
  protected jpWinEffectMgr: JpWinEffectManager = null;

  protected currentJPValueAry: number[] = [];

  protected baseRate: number[] = [];
  protected betLevel: number[] = [];

  private isGetStartGame = false;
  private isInSpecialGame = false;
  private initValueDone = false;

  protected maxLine = 0;
  protected maxLineBet = 0;

  private isLock = false;
  private rollTime = 3;

  protected onLoad(): void {
    SlotGDK.instance.receiveStartGame.insert(this.getInGameJPInfo, this);
    SlotGDK.instance.eventSetInGameJackpotData.insert(
      this.receiveInGameJPData,
      this
    );

    SlotGDK.instance.eventSpecialGameStarted.insert(
      this.startSpecialGame,
      this
    );
    SlotGDK.instance.eventSpecialGameEnded.insert(this.endSpecialGame, this);

    for (let i = 0; i < this.jpItemAry.length; i++) {
      this.jpItemAry[i].updateCurrItem(i < 2 ? false : true);
    }
  }

  protected onDestroy(): void {
    SlotGDK.instance.receiveStartGame.remove(this.getInGameJPInfo, this);
    SlotGDK.instance.eventSetInGameJackpotData.remove(
      this.receiveInGameJPData,
      this
    );
    SlotGDK.instance.eventClickChangeBet.remove(this.setJPValueNow, this);
    SlotGDK.instance.eventSpecialGameStarted.remove(
      this.startSpecialGame,
      this
    );
    SlotGDK.instance.eventSpecialGameEnded.remove(this.endSpecialGame, this);
    SlotGDK.instance.eventBuyBonusChangeBet.remove(this.setJPValueNow, this);
  }

  private getInGameJPInfo(_args: StartGameExArgs = null) {
    // 初始化 JP 數字
    this.isGetStartGame = true;
    this.baseRate = _args.extraInfo[this.protSett.baseRateKey];
    this.betLevel = _args.extraInfo[this.protSett.betLevelKey];
    this.maxLine = _args.bingoMaxLines;
    this.maxLineBet = _args.extraInfo[this.protSett.maxBetKey];

    console.log('[getInGameJPInfo]', _args);

    this.hintSett.updateHintBet(this.betLevel, this.maxLine);
    // for (let i = 1; i < this.betLevel.length; i++) {
    //   this.hintBetAry[i - 1].string =
    //     convertNumText(this.betLevel[i - 1] * this.maxLine) + ' ⬆︎';
    // }

    SlotGDK.instance.eventClickChangeBet.insert(this.setJPValueNow, this); //收到StartGame後才開始進行切押偵測
    SlotGDK.instance.eventBuyBonusChangeBet.insert(this.setJPValueNow, this); //BuyBonus介面內的切押偵測
    SlotGDK.instance.eventSendInGameJackpotInfoCmd.notify();

    if (!PlatformData.isSSEnv || !PlatformData.isDaraEnv) {
      this.hintSett.updateLayout();
    }
  }

  private receiveInGameJPData(data: JSON, _duration: number) {
    if (!this.isGetStartGame) return;

    if (this.isLock) return;

    const init = this.currentJPValueAry.length === 0;
    this.rollTime = Number.parseInt(data['sent_time_gap']);
    if (this.rollTime < 1) this.rollTime = 3;
    for (let i = 0; i < this.protSett.progressiveLevelNum; i++) {
      const value =
        PlatformData.isSSEnv || PlatformData.isDaraEnv
          ? data[i.toString()]
          : this.maxLine * this.maxLineBet * this.baseRate[i] +
            data[i.toString()];
      if (init) this.currentJPValueAry.push(value);
      else this.currentJPValueAry[i] = value;
    }
    console.log(
      '[receiveInGameJPData]',
      this.currentJPValueAry,
      data,
      this.maxLine,
      this.maxLineBet,
      this.baseRate
    );
    // this.currentJPValue = PlatformData.isSSEnv
    //   ? data['0']
    //   : this.maxLine * this.maxLineBet * this.baseRate[0] + data['0'];
    // console.log('[receiveInGameJPData]', this.currentJPValue, data['0'], data);

    // else if (PlatformData.logo === 'magiccity') {
    // }

    if (!this.initValueDone) {
      this.initValueDone = true;
      this.setJPValueNow();
    } else {
      this.updateJPValue();
      // if (!this.isInSpecialGame) {
      //   //在特殊遊戲中不主動更新面板值
      //   this.updateJPValue();
      // }
    }
  }

  public lockJpUpdate(lock) {
    this.isLock = lock;
  }

  private startSpecialGame() {
    this.updateJPValue();
    this.isInSpecialGame = true;
  }

  private endSpecialGame() {
    this.updateJPValue();
    this.isInSpecialGame = false;
  }

  public updateJPValue() {
    for (let i = 0; i < this.jpItemAry.length; i++) {
      const jpType = i + 1;
      if (i < this.protSett.progressiveLevelNum) {
        this.jpItemAry[i].setTargetNumberAnimationEx(
          this.getShowValue(jpType),
          this.rollTime
        );
      } else {
        this.jpItemAry[i].setNumberToStop(this.getShowValue(jpType));
      }
    }
  }

  public setJPValueNow() {
    for (let i = 0; i < this.jpItemAry.length; i++) {
      const jpType = i + 1;
      this.jpItemAry[i].setNumberToStop(this.getShowValue(jpType));
    }

    this.updateJpStatus();
  }

  public setJPValueToBase(index: number) {
    if (index < 0 || index >= this.jpItemAry.length) return;
    this.jpItemAry[index].setNumberToStop(
      PlatformData.instance.originalTotalBet * this.baseRate[index]
    );
  }

  protected updateJpStatus() {
    const oriLineBet = PlatformData.instance.originalLineBet;
    let status = -1;
    for (let i = 0; i < this.betLevel.length; i++) {
      if (oriLineBet >= this.betLevel[i]) {
        status = i;
        break;
      }
    }

    // status 0 : 全開, 1 : 鎖EPIC, 2 : 鎖 EPIC / LEGEND
    // G75_GameData.instance.jpStatus = status;

    switch (status) {
      case 0:
        for (let i = 0; i < this.jpItemAry.length; i++) {
          this.jpItemAry[i].lockFrame(false);
        }
        for (let i = 0; i < this.hintSett.length; i++)
          this.hintSett.setOpacity(i, 0);
        // for (let i = 0; i < this.hintLabelRootAry.length; i++)
        //   setOpacity(this.hintLabelRootAry[i].node, 0);
        break;
      case 1:
      case 2:
        for (let i = 0; i < status; i++) {
          this.jpItemAry[i].lockFrame(true);
          this.hintSett.setOpacity(i, 255);
          // setOpacity(this.hintLabelRootAry[i].node, 255);
        }
        for (let i = status; i < 2; i++) {
          this.hintSett.setOpacity(i, 0);

          // setOpacity(this.hintLabelRootAry[i].node, 0);
        }
        // setOpacity(this.hintLabel.node, 255);
        for (let i = status; i < this.jpItemAry.length; i++) {
          this.jpItemAry[i].lockFrame(false);
        }
        break;
    }

    return status;
  }

  public getShowValue(type: InGameJPType) {
    let showValue = 0.0;
    switch (type) {
      case InGameJPType.EPIC:
        showValue =
          this.currentJPValueAry[0] *
          (PlatformData.instance.originalLineBet / this.maxLineBet);
        break;
      case InGameJPType.LEGEND:
        showValue =
          this.currentJPValueAry[1] *
          (PlatformData.instance.originalLineBet / this.maxLineBet);
        break;
      case InGameJPType.RICH:
        showValue = PlatformData.instance.originalTotalBet * this.baseRate[2];
        break;
      case InGameJPType.CLASSIC:
        showValue = PlatformData.instance.originalTotalBet * this.baseRate[3];
        break;
    }
    console.log(
      '[getShowValue]',
      type,
      showValue,
      this.currentJPValueAry,
      PlatformData.instance.originalLineBet,
      this.maxLineBet
    );
    return showValue;
  }

  public forceupdateJPValue(value: number, type: InGameJPType, duration = 3) {
    const index = type - 1;
    switch (type) {
      case InGameJPType.EPIC:
        this.jpItemAry[index].setTargetNumberAnimationEx(value, duration);
        break;
      case InGameJPType.LEGEND:
        this.jpItemAry[index].setTargetNumberAnimationEx(value, duration);
        break;
      case InGameJPType.RICH:
        this.jpItemAry[index].setTargetNumberAnimationEx(value, duration);
        break;
      case InGameJPType.CLASSIC:
        this.jpItemAry[index].setTargetNumberAnimationEx(value, duration);
        break;
    }
  }

  public forceResetJPValue() {
    for (let i = 0; i < this.jpItemAry.length; i++) {
      this.jpItemAry[i].setNumberToStop(
        PlatformData.instance.originalTotalBet * this.baseRate[i]
      );
    }
  }

  public playEffect(jpType: InGameJPType, thisWin: number, duration: number) {
    this.jpWinEffectMgr.playEffect(jpType, thisWin, duration);
  }
}
