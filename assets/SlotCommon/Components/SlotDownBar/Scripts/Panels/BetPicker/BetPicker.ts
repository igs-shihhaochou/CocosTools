import {_decorator, Component, instantiate, Label, Node, Prefab} from 'cc';
import {SlotGDK} from '../../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../../Buttons/SlotUIBtnEvent';
import {PickerOption} from '../../Components/PickerOption';
import type {BetInfo} from '../../../../../../SlotModule/Define/SlotGameData';
import Functions from '../../../../../../CommonModule/Script/Utility/Functions';
import {SlotUIEvent} from '../../Define/SlotUIEvent';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';

const {ccclass, property} = _decorator;

type PickerTable = {
  [key: number]: PickerOption;
};

@ccclass('BetPicker')
export class BetPicker extends Component {
  @property(Node)
  private rootNode: Node = null;
  @property(Prefab)
  private optionPrefab: Prefab = null;
  @property(Node)
  private optionContainer: Node = null;
  @property(Label)
  private betTitle: Label = null;

  private _currentIndex: number = null;

  private _selecteIndex: number = null;

  private betTable: PickerTable = null;

  private _betList: BetInfo[] = null;

  private _currentRatio = 1;

  private setEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.BetBtnClicked)[func](this.showPanel, this);
    e(SlotUIBtnEvent.BetConfirmClicked)[func](this.onBetConfirmClicked, this);
    e(SlotUIBtnEvent.BetCancelClicked)[func](this.onBetCancelClicked, this);
  }

  onLoad(): void {
    this.setEvent(true);
    this.rootNode.active = false;
  }

  onDestroy(): void {
    this.setEvent(false);
  }

  private showPanel() {
    this.rootNode.active = true;
    SlotGDK.event(SlotUIEvent.PanelOpened).notify();
    console.log('BetPicker.showPanel', this.rootNode);
  }

  private createOption(value: number, index: number) {
    const option: Node = instantiate(this.optionPrefab.data);
    const pickerOption = option.getComponent(PickerOption);
    pickerOption.usePlatformSetting = true;
    pickerOption.setClickCallback(this.setSelectedBet.bind(this));
    pickerOption.value = value;
    pickerOption.index = index;
    pickerOption.enableLargeIcon();
    this.betTable[index] = pickerOption;
    return option;
  }

  public init(betList: BetInfo[], selectedBet: number) {
    let temp = JSON.parse(JSON.stringify(betList));
    //sort from small to large
    temp = temp.sort((a, b) => a.totalBet - b.totalBet);
    this._betList = temp;
    this.betTable = {};
    temp.forEach((betInfo, index) => {
      const option = this.createOption(betInfo.totalBet, index);
      this.optionContainer.addChild(option);
    });
    const betInfo = this._betList.find(x => x.lineBet === selectedBet);
    this.rootNode.active = true;
    this.currentIndex = this._betList.indexOf(betInfo);
    this.rootNode.active = false;
    this.setSelectedBet(this._currentIndex);
  }

  private setSelectedBet(index: number) {
    if (this._selecteIndex !== index && this._selecteIndex !== null) {
      this.betTable[this._selecteIndex].selected = false;
    }
    this.betTable[index].selected = true;
    this._selecteIndex = index;
    console.log('[BetPicker]:after setSelectedBet', index, this._betList);
  }

  private onBetCancelClicked() {
    this.setSelectedBet(this._currentIndex);
    this.rootNode.active = false;
    SlotGDK.event(SlotUIEvent.PanelClosed).notify();
  }

  private onBetConfirmClicked() {
    this.currentIndex = this._selecteIndex;
    this.rootNode.active = false;
    SlotGDK.event(SlotUIEvent.PanelClosed).notify();
  }

  private set currentIndex(value: number) {
    console.log('[BetPicker]:currentIndex', value, this._betList);
    this._currentIndex = value;
    const {totalBet, lineBet} = this._betList[value];
    PlatformData.instance.currentLineBet = Functions.accMul(
      lineBet,
      this._currentRatio
    );
    PlatformData.instance.currentTotalBet = Functions.accMul(
      totalBet,
      this._currentRatio
    );
    PlatformData.instance.originalLineBet = lineBet;
    PlatformData.instance.originalTotalBet = totalBet;

    SlotGDK.instance.eventClickChangeBet.notify(
      PlatformData.instance.currentLineBet,
      PlatformData.instance.currentTotalBet,
      PlatformData.instance.originalLineBet,
      PlatformData.instance.originalTotalBet
    );
  }

  public setOptionRatio(ratio: number) {
    console.log('[BetPicker]:setOptionRatio', ratio);
    this._currentRatio = ratio;
    this._betList.forEach((info, index) => {
      const {totalBet} = info;
      this.betTable[index].value = Functions.accMul(totalBet, ratio);
    });
  }

  public addBet() {
    if (this._currentIndex + 1 > this._betList.length - 1) {
      return;
    } else {
      this.setSelectedBet(this._currentIndex + 1);
      this.onBetConfirmClicked();
    }
  }

  public reduceBet() {
    if (this._currentIndex - 1 < 0) {
      return;
    } else {
      this.setSelectedBet(this._currentIndex - 1);
      this.onBetConfirmClicked();
    }
  }

  public setBet(lineBet: number) {
    const betInfo = this._betList.find(x => x.lineBet === lineBet);
    if (betInfo) {
      this.setSelectedBet(this._betList.indexOf(betInfo));
      this.onBetConfirmClicked();
    }
  }
}
