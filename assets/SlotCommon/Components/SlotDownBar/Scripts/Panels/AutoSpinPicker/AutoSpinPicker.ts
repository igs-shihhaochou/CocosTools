import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  type JsonAsset,
} from 'cc';
import {OptionSwitch} from '../../Components/OptionSwitch';
import {NumberSlider} from '../../Components/NumberSlider';
import {
  defautAutoSpinPickerData,
  type AutoSpinPickerCookieData,
  type AutoSpinPickerData,
} from './AutoSpinPickerData';
import {PickerOption} from '../../Components/PickerOption';
import {SlotGDK} from '../../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../../Buttons/SlotUIBtnEvent';
import {Delegate} from '../../../../../../CommonModule/Script/ExtraType';
import Functions from '../../../../../../CommonModule/Script/Utility/Functions';
import {PlatformData} from '../../../../../../CommonModule/Script/Define/PlatformData';
import {DEV} from 'cc/env';
import PlatformEventNotifier from '../../../../../../CommonModule/Script/Utility/PlatformEventNotifier';
import {SlotUIEvent} from '../../Define/SlotUIEvent';
import ClickLogManager, {
  type ClickLogData,
} from '../../../../../../CommonModule/Script/Manager/ClickLogManager';
import BQLogger from 'db://assets/CommonModule/Script/Log/BQLog/BQLogger';
const {ccclass, property} = _decorator;

type PickerTable = {
  [key: number]: PickerOption;
};

@ccclass('AutoSpinPicker')
export class AutoSpinPicker extends Component {
  @property(Node)
  private rootNode: Node = null;
  @property(Prefab)
  private optionPrefab: Prefab = null;
  @property(Node)
  private optionContainer: Node = null;
  @property(OptionSwitch)
  private stopOnSpecialFeatureWin: OptionSwitch = null;
  @property(OptionSwitch)
  private showAdvanced: OptionSwitch = null;
  @property(Node)
  private advancedPanel: Node = null;
  @property(NumberSlider)
  private singleWinExceeds: NumberSlider = null;
  @property(NumberSlider)
  private takeProfitLimit: NumberSlider = null;
  @property(NumberSlider)
  private takeLossLimit: NumberSlider = null;

  private _data: AutoSpinPickerData = defautAutoSpinPickerData;
  private autoSpinTable: PickerTable = null;
  private _currentNumberOfSpins: number = null;
  private _selectedNumberOfSpins: number = null;

  public onConfirmClicked: Delegate = new Delegate();

  private get cookieKey() {
    const {gameName, nickName} = PlatformData;
    return `${nickName}_${gameName}_AutoSpinPicker`;
  }

  private get cookieDataString(): AutoSpinPickerCookieData {
    return {
      selectedNumberOfSpins: this._selectedNumberOfSpins,
      stopOnSpecialFeatureWin: this._data.stopOnSpecialFeatureWin,
      showAdvanced: this._data.showAdvanced,
      singleWinExceeds: this._data.singleWinExceeds,
      takeProfitLimit: this._data.takeProfitLimit,
      takeLossLimit: this._data.takeLossLimit,
    };
  }

  onLoad() {
    if (DEV) {
      this.init();
    }
  }

  onDestroy() {
    this.registerEvents(false);
  }

  private registerEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    SlotGDK.event(SlotUIBtnEvent.AutoSpinCancelClicked)[func](
      this.onAutoSpinCancelClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.AutoSpinConfirmClicked)[func](
      this.onAutoSpinConfirmClicked,
      this
    );
    SlotGDK.event(SlotUIBtnEvent.AutoClicked)[func](this.onAutoClicked, this);
  }

  private init() {
    this.registerEvents(true);
    this._currentNumberOfSpins = this._data.selectedNumberOfSpins;
    this.readSettingFromCookie();
    //若為送審審核版本，則需設定
    if (PlatformData.useCert) this.setLicenseAutoSpinData();
    this.createAndSetAutoSpinPickerOption();
    this.initOptionSwitch();
    this.initSlider();
    this.rootNode.active = false;
    this.showAdvanced.node.active = this._data.showAutoAdvance;
  }

  public async loadRemoteConfig(data: JsonAsset) {
    this.registerEvents(true);
    this._data = data.json as AutoSpinPickerData;
    this._currentNumberOfSpins = this._data.selectedNumberOfSpins;
    this.readSettingFromCookie();
    this.setLicenseAutoSpinData();
    this.createAndSetAutoSpinPickerOption();
    this.initOptionSwitch();
    this.initSlider();
    this.rootNode.active = false;
    this.showAdvanced.node.active = this._data.showAutoAdvance;
  }

  private readSettingFromCookie() {
    const str = Functions.getCookie(this.cookieKey);
    if (str === '' || !str) {
      return;
    }
    const cookieData = JSON.parse(str) as AutoSpinPickerCookieData;
    console.log('[AutoSpinPicker]readSettingFromCookie', cookieData);

    this._currentNumberOfSpins = cookieData.selectedNumberOfSpins;
    this._data.stopOnSpecialFeatureWin = cookieData.stopOnSpecialFeatureWin;
    this._data.showAdvanced = cookieData.showAdvanced;
    this._data.singleWinExceedsSetting.currentValue =
      cookieData.singleWinExceeds;
    this._data.takeLossLimitSetting.currentValue = cookieData.takeLossLimit;
    this._data.takeProfitLimitSetting.currentValue = cookieData.takeProfitLimit;
    this._data.singleWinExceeds = cookieData.singleWinExceeds;
    this._data.takeLossLimit = cookieData.takeLossLimit;
    this._data.takeProfitLimit = cookieData.takeProfitLimit;
  }

  private setAutoSpinTime(value: number) {
    if (!this.autoSpinTable) {
      return;
    }
    if (
      this._selectedNumberOfSpins !== value &&
      this._selectedNumberOfSpins !== null
    ) {
      this.autoSpinTable[this._selectedNumberOfSpins].selected = false;
    }
    this.autoSpinTable[value].selected = true;
    this._selectedNumberOfSpins = value;
    console.log('[AutoSpinPicker]setAutoSpinTime', value);
  }

  private createPickerOption(value: number) {
    const option = instantiate(this.optionPrefab);
    const pickerOption = option.getComponent(PickerOption);
    pickerOption.setClickCallback(this.setAutoSpinTime.bind(this));
    pickerOption.index = value;
    pickerOption.value = value;
    this.autoSpinTable[value] = pickerOption;
    return option;
  }

  private setLicenseAutoSpinData() {
    if (
      !PlatformData.licenseSetting.autoPlay &&
      PlatformData.licenseClientModeSetting.roundBtn.length > 0
    ) {
      //防止單手局數過大 防呆
      if (PlatformData.licenseClientModeSetting.maxRound.length > 0) {
        const filteredBtn =
          PlatformData.licenseClientModeSetting.roundBtn.filter(
            val => val <= PlatformData.licenseClientModeSetting.maxRound
          );
        this._data.numberOfSpins = filteredBtn;
      } else {
        this._data.numberOfSpins =
          PlatformData.licenseClientModeSetting.roundBtn;
      }
    }
  }

  private createAndSetAutoSpinPickerOption() {
    this.autoSpinTable = {};
    const list = this._data.numberOfSpins;
    for (const value of list) {
      const option = this.createPickerOption(value);
      this.optionContainer.addChild(option);
    }

    //檢查currentNumberOfSpins是否在範圍內 防止國家切來切去拿cookie的值導致錯誤
    if (
      this._data.numberOfSpins.length > 0 &&
      !this._data.numberOfSpins.includes(this._currentNumberOfSpins)
    ) {
      this._currentNumberOfSpins = this._data.numberOfSpins[0];
      this._data.selectedNumberOfSpins = this._data.numberOfSpins[0];
    }

    this.setAutoSpinTime(this._currentNumberOfSpins);
  }

  private initOptionSwitch() {
    this.stopOnSpecialFeatureWin.selected = this._data.stopOnSpecialFeatureWin;

    this.showAdvanced.onSelectedChanged.insert(
      this.onShowAdvancedChanged,
      this
    );
    this.showAdvanced.selected =
      this._data.showAdvanced && this._data.showAutoAdvance;
  }

  private initSlider() {
    const {
      singleWinExceedsSetting,
      takeProfitLimitSetting,
      takeLossLimitSetting,
    } = this._data;
    this.singleWinExceeds.init(singleWinExceedsSetting);
    this.takeProfitLimit.init(takeProfitLimitSetting);
    this.takeLossLimit.init(takeLossLimitSetting);
  }

  private onShowAdvancedChanged(value: boolean) {
    console.warn('[AutoSpinPicker]onShowAdvancedChanged', value);
    this._data.showAdvanced = value;
    this.advancedPanel.active = value;
    this.saveSettingToCookie();
  }

  private onAutoSpinCancelClicked() {
    console.log('[AutoSpinPicker]onAutoSpinCancelClicked');
    this.setAutoSpinTime(this._currentNumberOfSpins);
    this.stopOnSpecialFeatureWin.selected = this._data.stopOnSpecialFeatureWin;
    this.singleWinExceeds.value = this._data.singleWinExceeds;
    this.takeProfitLimit.value = this._data.takeProfitLimit;
    this.takeLossLimit.value = this._data.takeLossLimit;
    this.rootNode.active = false;
    SlotGDK.event(SlotUIEvent.PanelClosed).notify();
  }

  private onAutoSpinConfirmClicked() {
    SlotGDK.event(SlotUIEvent.PanelClosed).notify();
    console.log('[AutoSpinPicker]onAutoSpinConfirmClicked');
    this._data.selectedNumberOfSpins = this._selectedNumberOfSpins;
    this._data.singleWinExceeds = this.singleWinExceeds.value;
    this._data.takeProfitLimit = this.takeProfitLimit.value;
    this._data.takeLossLimit = this.takeLossLimit.value;
    this._data.stopOnSpecialFeatureWin = this.stopOnSpecialFeatureWin.selected;
    this._currentNumberOfSpins = this._selectedNumberOfSpins;
    this.saveSettingToCookie();
    this.onConfirmClicked.notify(JSON.parse(JSON.stringify(this._data)));
    this.rootNode.active = false;
    PlatformEventNotifier.auto(this._data);

    ClickLogManager.instance.addClickLog(
      'AutoSpin',
      PlatformData.gameName,
      PlatformData.gameName,
      '',
      0,
      {
        NickName: PlatformData.nickName,
        NumberOfSpin: this._data.selectedNumberOfSpins,
        StopOnFG: parseInt(
          Number(this._data.stopOnSpecialFeatureWin).toString()
        ),
        SingleWin: parseInt(this._data.singleWinExceeds.toString()),
        TakeProfit: this._data.takeProfitLimit,
        TakeLoss: this._data.takeLossLimit,
      } as ClickLogData
    );
    /**BQ埋點 */
    BQLogger.sendClickAutoTime(this._currentNumberOfSpins.toString());
  }

  private onAutoClicked() {
    //**BQ埋點 */
    BQLogger.sendClickAutoBtn();
    console.log('[AutoSpinPicker]onAutoClicked', this._currentNumberOfSpins);
    this.rootNode.active = true;
    this.setAutoSpinTime(this._currentNumberOfSpins);
    SlotGDK.event(SlotUIEvent.PanelOpened).notify();
  }

  private saveSettingToCookie() {
    Functions.setCookie(this.cookieKey, JSON.stringify(this.cookieDataString));
    console.log(
      '[AutoSpinPicker]saveSettingToCookie',
      this.cookieDataString,
      525600,
      true
    );
  }
}
