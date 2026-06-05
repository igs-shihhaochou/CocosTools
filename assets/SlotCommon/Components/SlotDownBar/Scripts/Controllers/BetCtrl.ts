import {_decorator, Component, Label} from 'cc';
import {BetPicker} from '../Panels/BetPicker/BetPicker';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {
  StartGameExArgs,
  type BetInfo,
  type ExtrabetInfo,
} from '../../../../../SlotModule/Define/SlotGameData';
import {SlotButtonCtrl} from './SlotButtonCtrl';
import Functions from '../../../../../CommonModule/Script/Utility/Functions';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import EventManager from '../../../../../CommonModule/Script/Manager/EventManager';
import MultiLangHandler from 'db://assets/CommonModule/Script/Core/MultiLangHandler';
import {SlotUIEvent} from '../Define/SlotUIEvent';
import {SlotUIBtnType} from '../Buttons/SlotUIBtnType';
import {PlatformGDK} from 'db://assets/CommonModule/Script/Platform/PlatformGDK';

const {ccclass, property} = _decorator;

@ccclass('BetCtrl')
export class BetCtrl extends Component {
  @property(BetPicker)
  private betPicker: BetPicker = null;
  @property(SlotButtonCtrl)
  private slotButtonCtrl: SlotButtonCtrl = null;
  @property(Label)
  private betLabel: Label = null;
  @property(Label)
  private betTitle: Label = null;

  private extraBetRatio = 1;
  private originalTotalBet = 0;

  //#region Lifecycle

  onLoad() {
    this.registerEvent(true);
    SlotGDK.instance.betNumberNode = this.betLabel.node;
  }

  onDestroy() {
    this.registerEvent(false);
  }

  //#endregion

  //#region Public

  public init(startGameData: StartGameExArgs) {
    console.log('BetCtrl init', startGameData);
    this.setBetTitleDisplay();

    const {betList, currentLineBet, extraBetInfo} = startGameData;
    let lineBet = currentLineBet;
    //檢查currentLineBet是否在betList中,若不存在取最小的
    if (!betList.some(x => x.lineBet === currentLineBet)) {
      lineBet = this.getMinLineBet(betList);
    }
    this.betPicker.init(betList, lineBet);
    this.initExtraBet(extraBetInfo);
  }

  public setBetTitleDisplay() {
    this.betTitle.string = MultiLangHandler.getGameText(
      `SlotUI_BetTitle${PlatformData.isUseScoreBox ? 'Scorebox' : ''}`
    );
  }

  public addBet() {
    this.betPicker.addBet();
  }

  public reduceBet() {
    this.betPicker.reduceBet();
  }

  //#endregion

  //#region Event Registration

  private registerEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const {event: e} = SlotGDK;
    e(SlotUIBtnEvent.ExtraBetClicked)[func](this.onExtraBetClicked, this);
    e(SlotUIBtnEvent.StopExtraBetClicked)[func](
      this.onStopExtraBetClicked,
      this
    );
    e(SlotUIBtnEvent.AddBetClicked)[func](this.addBet, this);
    e(SlotUIBtnEvent.ReduceBetClicked)[func](this.reduceBet, this);
    SlotGDK.instance.eventClickChangeBet[func](this.onBetChanged, this);
    SlotGDK.instance.eventSetCanChangeBet[func](this.setCanChangeBet, this);
    PlatformGDK.instance.receiveInGameStartGameData[func](
      this.receiveInGameStartGameData,
      this
    );

    const func2 = option ? 'addEventListener' : 'removeEventListener';
    EventManager.instance[func2](
      PlatformData.gameEventName.CHANGE_GAME_BET,
      this.setBet.bind(this)
    );
    EventManager.instance[func2](
      PlatformData.gameEventName.FORCE_SET_BET,
      this.forceSetBet.bind(this)
    );
  }

  //#endregion

  //#region Event Handlers

  private onExtraBetClicked() {
    this.betPicker.setOptionRatio(this.extraBetRatio);

    const totalBet = Functions.accMul(
      this.originalTotalBet,
      this.extraBetRatio
    );
    this.updateBetLabel(totalBet);

    console.log('BetCtrl onExtraBetClicked', this.originalTotalBet);
    PlatformData.instance.currentTotalBet =
      PlatformData.instance.originalTotalBet * this.extraBetRatio;
    PlatformData.instance.currentLineBet =
      PlatformData.instance.originalLineBet * this.extraBetRatio;
    this.notifyBetChanged();
  }

  private onStopExtraBetClicked() {
    this.betPicker.setOptionRatio(1);
    this.updateBetLabel(this.originalTotalBet);

    console.log('BetCtrl onStopExtraBetClicked', this.originalTotalBet);
    PlatformData.instance.currentTotalBet =
      PlatformData.instance.originalTotalBet;
    PlatformData.instance.currentLineBet =
      PlatformData.instance.originalLineBet;
    this.notifyBetChanged();
  }

  private onBetChanged(
    currentLineBet: number,
    currentTotalBet: number,
    originalLineBet: number,
    originalTotalBet: number
  ) {
    this.updateBetLabel(currentTotalBet);
    this.originalTotalBet = originalTotalBet;
  }

  private setCanChangeBet(option: boolean) {
    PlatformData.instance.canChangeBet = option;
    SlotGDK.event(SlotUIEvent.SetBtnInteractable).notify(
      SlotUIBtnType.Bet,
      option
    );
  }

  private receiveInGameStartGameData(data) {
    console.log('BetCtrl receiveInGameStartGameData', data);
    if (data.data['ExtraBet']) {
      const extraBetInfo: ExtrabetInfo = {
        enabled: data.data['ExtraBet']['Enable'],
        ratio: data.data['ExtraBet']['Ratio'],
        status: data.data['ExtraBet']['Status'],
        extraBetList: data.data['ExtraBet']['extra_bet_list'],
      };
      this.initExtraBet(extraBetInfo);
    } else {
      this.initExtraBet({
        enabled: false,
        ratio: 1,
        status: false,
        extraBetList: [],
      });
    }
  }

  //#endregion

  //#region Private Helpers

  private setBet(lineBet: number, isExtraBet: boolean) {
    this.betPicker.setBet(lineBet);
    if (isExtraBet) {
      this.onExtraBetClicked();
    } else {
      this.onStopExtraBetClicked();
    }
  }

  private forceSetBet(totalBet: number) {
    const lineBet = Functions.accDiv(totalBet, this.getCost());
    this.onBetChanged(lineBet, totalBet, lineBet, totalBet);
    PlatformData.instance.currentLineBet = lineBet;
    PlatformData.instance.currentTotalBet = totalBet;
    PlatformData.instance.originalLineBet = lineBet;
    PlatformData.instance.originalTotalBet = totalBet;
    this.notifyBetChanged();
  }

  private initExtraBet(extraBetInfo: ExtrabetInfo) {
    console.log('BetCtrl initExtraBet', extraBetInfo);
    if (extraBetInfo) {
      const {enabled, ratio, status} = extraBetInfo;
      this.extraBetRatio = ratio;
      this.slotButtonCtrl.setExtraBetButton(enabled, status);
      if (enabled && status) {
        this.onExtraBetClicked();
      } else {
        this.onStopExtraBetClicked();
      }
    } else {
      this.slotButtonCtrl.setExtraBetButton(false, false);
    }
  }

  private updateBetLabel(totalBet: number) {
    const dollarSign = this.getDollarSign();
    const betStr = Functions.formatNumberWithPlatformData(
      totalBet,
      false,
      true
    );
    this.betLabel.string = `${dollarSign}${betStr}`;
  }

  private notifyBetChanged() {
    SlotGDK.instance.eventClickChangeBet.notify(
      PlatformData.instance.currentLineBet,
      PlatformData.instance.currentTotalBet,
      PlatformData.instance.originalLineBet,
      PlatformData.instance.originalTotalBet
    );
  }

  private getDollarSign(): string {
    if (PlatformData.useCert === false) return '';
    if (PlatformData.currencySymbol === '') {
      return '$';
    } else {
      if (PlatformData.isSSEnv) return '$';
      else return `${PlatformData.currencySymbol} `;
    }
  }

  private getMinLineBet(betList: BetInfo[]): number {
    return betList.sort((a, b) => a.lineBet - b.lineBet)[0].lineBet;
  }

  protected getCost() {
    return Functions.accDiv(
      PlatformData.instance.maxTotalBet,
      PlatformData.instance.maxLineBet
    );
  }

  //#endregion
}
