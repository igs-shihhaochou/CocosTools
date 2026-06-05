import {_decorator, Component, Label, Node, Tween} from 'cc';
import {tweenNodeEx} from '../../../../../../CommonModule/Script/Utility/TweenUtil';
import {SlotGDK} from '../../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../../Buttons/SlotUIBtnEvent';
import {PlatformData} from '../../../../../../CommonModule/Script/Define/PlatformData';
import {SlotUIEvent} from '../../Define/SlotUIEvent';
import {SlotUIBtnType} from '../../Buttons/SlotUIBtnType';
import PlatformEventNotifier from '../../../../../../CommonModule/Script/Utility/PlatformEventNotifier';
import Timer from 'db://assets/CommonModule/Script/Utility/Timer';

const {ccclass, property} = _decorator;

@ccclass
export class PrizeViewer extends Component {
  @property(Node)
  protected nodePrompt: Node = null;

  @property(Label)
  protected labPrize: Label = null;

  @property(Label)
  protected labTimer: Label = null;

  @property(Node)
  protected blocker: Node = null;

  protected timerNow: number = null;
  protected timerStart = 0;
  protected serverData = null;
  protected extraBetServerData = null;
  private timerKey = 'prizePreviewTimer';
  protected clearData() {
    this.serverData = null;
    this.extraBetServerData = null;
  }

  public init(timeStart: number) {
    this.labPrize.string = '';
    this.labTimer.string = '';
    this.timerStart = timeStart;
    this.setEvents(true);
  }

  protected setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.PrizePreviewClicked)[func](this.showPanel, this);
    e(SlotUIBtnEvent.PrizePreviewCancelClicked)[func](this.hidePrompt, this);
    e(SlotUIBtnEvent.PrizePreviewPlayClicked)[func](this.hideAndSpin, this);
    SlotGDK.instance.eventSpin[func](this.clearData, this);
  }

  onDestroy(): void {
    this.setEvents(false);
  }

  protected hideAndSpin(): void {
    this.blocker.active = true;
    PlatformEventNotifier.playPreview();
    SlotGDK.event(SlotUIBtnEvent.SpinClicked).notify();
    this.hidePrompt();
  }

  protected hidePrompt() {
    SlotGDK.event(SlotUIEvent.SetBtnActive).notify(
      SlotUIBtnType.Blocker,
      false
    );
    this.setShowStatus(false);
    Timer.unschedule(this.timerKey);
    PlatformEventNotifier.closePreview();
    SlotGDK.event(SlotUIEvent.PanelClosed).notify();
  }

  protected showPrompt() {
    this.labTimer.string = '';
    this.setShowStatus(true);
    SlotGDK.event(SlotUIEvent.SetBtnActive).notify(SlotUIBtnType.Blocker, true);
    PlatformEventNotifier.showPreview();
  }

  protected setShowStatus(option: boolean) {
    this.nodePrompt.active = true;
    Tween.stopAllByTarget(this.nodePrompt);
    tweenNodeEx(this.nodePrompt)
      .set({opacity: option ? 0 : 255})
      .to(0.25, {opacity: option ? 255 : 0})
      .call(() => {
        this.nodePrompt.active = option;
      })
      .start();
  }

  protected setTimer() {
    if (this.timerNow > 0) {
      this.labTimer.string = this.timerNow.toString();
      this.timerNow--;
      Timer.scheduleOnce(this.setTimer.bind(this), 1, this.timerKey);
    } else {
      this.hidePrompt();
    }
  }

  protected async showPanel() {
    SlotGDK.event(SlotUIEvent.PanelOpened).notify();
    const {isExtraBet, currentLineBet} = PlatformData.instance;
    this.showPrompt();
    if (
      (isExtraBet && !this.extraBetServerData) ||
      (!isExtraBet && !this.serverData) ||
      (isExtraBet &&
        this.extraBetServerData &&
        !this.extraBetServerData[currentLineBet]) ||
      (!isExtraBet && this.serverData && !this.serverData[currentLineBet])
    ) {
      this.labPrize.string = 'Loading...';
      try {
        if (PlatformData.useApiServer) {
          await this.sendRequestNew();
        } else {
          await this.sendRequest();
        }
        this.setDisplayLabel();
      } catch (e) {
        this.hidePrompt();
        return;
      }
    }

    if (PlatformData.prizeViewerSec) {
      this.timerNow = PlatformData.prizeViewerSec;
      this.setTimer();
    }
    this.setDisplayLabel();
    this.blocker.active = false;
    PlatformEventNotifier.showPreview();
  }

  protected sendRequest() {
    const data: JSON = <JSON>{};
    data['game_id'] = PlatformData.gameName;
    const list = [];
    PlatformData.instance.betList.forEach(bet => {
      list.push(bet['line_bet']);
    });
    data['preview_bet_range'] = list;
    data['extra_bet'] = PlatformData.instance.isExtraBet;
    console.log('[PrizePreview] sendRequest', data);
    return new Promise<void>((resolve, reject) => {
      PlatformData.instance.arkClient.sendCmd(
        'SlotGame',
        'preview',
        data,
        (result, data) => {
          console.log('[PrizePreview] onReceiveData', result, data);
          if (result === 0 && data['cmd_data']['result'] === 0) {
            if (
              data['cmd_data']['data'].hasOwnProperty('extra_bet') &&
              data['cmd_data']['data']['extra_bet']
            ) {
              this.extraBetServerData =
                data['cmd_data']['data']['preview_info'];
            } else {
              this.serverData = data['cmd_data']['data']['preview_info'];
            }
            resolve();
          } else {
            console.warn("[PrizePreview] Can't get preview data");
            reject();
          }
        }
      );
    });
  }

  /**
   * api模組
   */
  protected sendRequestNew() {
    const currentLineBet = PlatformData.instance.currentLineBet;
    const cmdData = {
      GameName: PlatformData.gameName,
      BetValue: currentLineBet,
    };
    console.log('[PrizePreview] sendRequest slot new', cmdData);
    return new Promise<void>((resolve, reject) => {
      PlatformData.instance.arkClient.sendCmd(
        'SlotGame',
        'PREVIEW',
        cmdData,
        (result, data) => {
          console.log('[PrizePreview] onReceiveData', result, data);
          if (result === 0 && data['cmd_data']['result']['id'] === 0) {
            if (this.serverData === null) {
              this.serverData = {};
            }
            this.serverData[currentLineBet] = [];
            this.serverData[currentLineBet].push({
              // eslint-disable-next-line camelcase
              game_trigger: data['cmd_data']['HitFever'],
              // eslint-disable-next-line camelcase
              game_win: data['cmd_data']['TotalWin'],
            });
            resolve();
          } else {
            console.warn("[PrizePreview] Can't get preview data");
            reject();
          }
        }
      );
    });
  }

  protected updatePreviewWin(getSG: boolean, win: number) {
    if (getSG) {
      if (win === 0) {
        this.labPrize.string = 'Special Game';
        this.labPrize.fontSize = 64;
      } else {
        this.labPrize.string = win.toString() + '\n+\n' + 'Special Game';
        this.labPrize.fontSize = 48;
      }
    } else {
      this.labPrize.string = win.toString();
      this.labPrize.fontSize = 64;
    }
  }

  protected setDisplayLabel() {
    const {isExtraBet, currentLineBet} = PlatformData.instance;
    console.log('[PrizePreview] setDisplayLabel', isExtraBet, currentLineBet);
    const data = isExtraBet ? this.extraBetServerData : this.serverData;
    console.log('[PrizePreview] data', data);
    const gameWin = data[currentLineBet][0]['game_win'];
    const gameTrigger = data[currentLineBet][0]['game_trigger'];
    this.updatePreviewWin(gameTrigger, gameWin);
  }
}
