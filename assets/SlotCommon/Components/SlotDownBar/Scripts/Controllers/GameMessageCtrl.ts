import {_decorator, CCBoolean, Component, Label, Node, Color, Sprite} from 'cc';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import HostSetting from '../../../../../SlotModule/Define/HostSetting';
import {WinType} from '../../../../../SlotModule/Define/SlotGameData';
import {GameMessage} from '../Define/GameMessage';
import Functions from '../../../../../CommonModule/Script/Utility/Functions';
import {PlatformGDK} from '../../../../../CommonModule/Script/Platform/PlatformGDK';
import MultiLangHandler from 'db://assets/CommonModule/Script/Core/MultiLangHandler';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
const {ccclass, property} = _decorator;

const msg = (gameMessage: GameMessage) => {
  return MultiLangHandler.getGameText(`SlotUIMsg_${gameMessage}`);
};

@ccclass('GameMessageCtrl')
export class GameMessageCtrl extends Component {
  @property(Label)
  private label: Label = null;
  @property(Node)
  private bg: Node = null;
  @property([Node])
  private extraBetBtns: Node[] = [];
  @property(CCBoolean)
  private showCurrencyName = false;

  private winType: WinType = WinType.NoWin;
  private totalWin = 0;
  private extraBetSprites: Sprite[] = [];
  private isShowMessage = true;

  onLoad() {
    this.setEvents(true);
    this.bg.active = true;

    // 預先快取 Sprite 組件
    this.extraBetSprites = this.extraBetBtns.map(btn => {
      let sprite = btn.getComponent(Sprite);
      if (!sprite) {
        sprite = btn.addComponent(Sprite);
      }
      return sprite;
    });
  }

  onDestroy() {
    this.setEvents(false);
  }

  private setData(rawData) {
    const {data} = rawData;
    if (data.hasOwnProperty('win_type')) {
      this.winType = data['win_type'];
    }
    if (data.hasOwnProperty('this_win_amount')) {
      this.totalWin = data['this_win_amount'];
    }
  }

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.instance;
    e.eventSpin[func](this.clearMsg, this);
    // e.eventReadyToSpin[func](this.showClickToSpin, this);
    e.receiveSpinData[func](this.setData, this);
    e.receiveFeverData[func](this.setData, this);
    e.eventShowWinAnimCount[func](this.showYouWin, this);
    e.eventShowLineBingoFrameData[func](this.showLineBingoFrameData, this);
    e.eventShowWaysBingoFrameData[func](this.showWaysBingoFrameData, this);
    e.eventShowCountBingoFrameData[func](this.showCountBingoFrameData, this);
    e.eventShowAllBingoFrameData[func](this.showAllBingoFrameData, this);
    e.eventShowRetriggerMessage[func](this.showRetriggerMessage, this);
    e.eventClearBingoData[func](this.clearMsg, this);
    e.eventSceneIsReady[func](this.clearMsg, this);
    const p = PlatformGDK.instance;
    p.showWinMessage[func](this.showYouWin, this);
    p.showBigWinMessage[func](this.showBigWin, this);
    p.showLineWinMessage[func](this.showLineWin, this);
    p.showFeatureWinMessage[func](this.showFeatureWin, this);
    p.showCustomMessage[func](this.setMsg, this);
    p.clearMessage[func](this.clearMsg, this);
    p.hideMessage[func](this.hideMsg, this);
    p.showCountDownMessage[func](this.showCountDown, this);
    // p.showGoodLuckMessage[func](this.showGoodLuck, this);
    // p.rollGameWin[func](this.showYouWin, this);
  }

  private get currencyName() {
    const showCurrency =
      PlatformData.currencyName ||
      Functions.getCurrencyDisplayName(PlatformData.currency);
    return this.showCurrencyName ? showCurrency : '';
  }

  private setMsg(msg: string, arg1?: string, arg2?: string) {
    if (!this.isShowMessage) {
      return;
    }
    let tmpMsg = msg;

    if (arg2?.length !== 0) {
      tmpMsg = tmpMsg.replace('{0}', arg1);
      tmpMsg = tmpMsg.replace('{1}', arg2);
    } else if (arg1?.length !== 0) {
      tmpMsg = tmpMsg.replace('{0}', arg1);
    }
    this.label.string = tmpMsg;
    this.bg.active = true;

    if (PlatformData.isLandscape && this.extraBetSprites.length > 0) {
      const alpha = this.label.string.length > 10 ? 50 : 255;
      this.extraBetSprites.forEach(sprite => {
        sprite.color = new Color(255, 255, 255, alpha);
      });
    }
  }

  private clearMsg() {
    this.label.string = '';
    // this.bg.active = false;
    if (PlatformData.isLandscape && this.extraBetSprites.length > 0) {
      this.extraBetSprites.forEach(sprite => {
        sprite.color = new Color(255, 255, 255, 255);
      });
    }
  }

  private hideMsg() {
    this.isShowMessage = false;
    this.label.node.active = false;
    this.bg.active = false;
  }

  private showCountDown(time: number) {
    this.setMsg(msg(GameMessage.WaitSelectSecond), time.toString());
  }

  private showClickToSpin() {
    if (this.totalWin === 0) {
      this.setMsg(msg(GameMessage.ClickSpin));
    }
  }

  private showGoodLuck() {
    this.totalWin = 0;
    this.setMsg(msg(GameMessage.GoodLuck));
  }

  private showYouWin(winNumber: number) {
    if (winNumber > 0) {
      const winStr = Functions.formatNumberWithPlatformData(winNumber);
      this.setMsg(msg(GameMessage.YouWin), `${this.currencyName} ${winStr}`);
    }
  }

  private showBigWin(winNumber: number) {
    if (winNumber > 0) {
      const winStr = Functions.formatNumberWithPlatformData(winNumber);
      this.setMsg(msg(GameMessage.BigWin), `${this.currencyName} ${winStr}`);
    }
  }

  public showLineWin(lineID: number, winNumber: number): void {
    if (winNumber > 0) {
      const winStr = Functions.formatNumberWithPlatformData(winNumber);
      this.setMsg(
        msg(GameMessage.LineWin),
        `${this.currencyName} ${winStr}`,
        (lineID + 1).toString()
      );
    }
  }

  public showFeatureWin(winNumber: number): void {
    if (winNumber > 0) {
      const winStr = Functions.formatNumberWithPlatformData(winNumber);
      this.setMsg(
        msg(GameMessage.FeatureWin),
        `${this.currencyName} ${winStr}`
      );
    }
  }

  //Line線獎的資訊
  private showLineBingoFrameData(
    lineId: number,
    symbolId: number,
    symbolCount: number,
    multiplier: number,
    win: number
  ) {
    if (!HostSetting.instance.bingo.dontShowBottomBarMessage) {
      this.showLineWin(lineId, win);
    }
  }
  //Ways獎的資訊
  private showWaysBingoFrameData(
    waysCount: number,
    symbolId: number,
    symbolCount: number,
    multiplier: number,
    win: number
  ) {
    if (!HostSetting.instance.bingo.dontShowBottomBarMessage) {
      const winStr = Functions.formatNumberWithPlatformData(win);
      this.setMsg(
        msg(GameMessage.AllWaysWin),
        `${this.currencyName} ${winStr}`
      );
    }
  }

  //Count獎的資訊
  private showCountBingoFrameData(
    totalCount: number,
    symbolId: number,
    symbolCount: number,
    multiplier: number,
    win: number
  ) {
    if (!HostSetting.instance.bingo.dontShowBottomBarMessage) {
      const _bingoFrameData: Object = {
        totalCount: totalCount,
        symbolId: symbolId,
        symbolCount: symbolCount,
        multiplier: multiplier,
        win: win,
      };
    }
  }

  //Show全線的資訊
  private showAllBingoFrameData(thisWin: number) {
    if (!HostSetting.instance.bingo.dontShowBottomBarMessage) {
      if (this.winType >= WinType.BigWin) {
        this.showBigWin(thisWin);
      } else {
        this.showYouWin(thisWin);
      }
    }
  }

  //顯示Retrigger訊息
  private showRetriggerMessage() {}
}
