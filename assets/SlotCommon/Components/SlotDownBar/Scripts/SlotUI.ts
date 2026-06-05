import {_decorator, Component, type JsonAsset} from 'cc';
import {SettingMenu} from './Panels/SettingMenu/SettingMenu';
import {SlotButtonCtrl} from './Controllers/SlotButtonCtrl';
import type {StartGameExArgs} from '../../../../SlotModule/Define/SlotGameData';
import {SlotUILabelCtrl} from './Controllers/SlotUILabelCtrl';
import {BetCtrl} from './Controllers/BetCtrl';
import {AutoSpinCtrl} from './Controllers/AutoSpinCtrl';
import {AssetDisplayCtrl} from './Controllers/AssetDisplayCtrl';
import {SlotUISwitch} from './Define/SlotUISwitch';
import {PrizeViewer} from './Panels/PrizePreview/PrizePreview';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import {SlotGDK} from '../../../../SlotModule/Define/SlotGDK';
import {DEV} from 'cc/env';
import {GameWinCtrl} from './Controllers/GameWinCtrl';
import {SlotUITutorial} from './Controllers/SlotUITutorial';
import {BagCtrl} from './Controllers/BagCtrl';
const {ccclass, property} = _decorator;

@ccclass('SlotUI')
export class SlotUI extends Component {
  @property(BetCtrl)
  public readonly betCtrl: BetCtrl = null;
  @property(SlotUILabelCtrl)
  public readonly labelCtrl: SlotUILabelCtrl = null;
  @property(AutoSpinCtrl)
  public readonly autoSpinCtrl: AutoSpinCtrl = null;
  @property(SettingMenu)
  public readonly settingMenu: SettingMenu = null;
  @property(SlotButtonCtrl)
  public readonly slotButtonCtrl: SlotButtonCtrl = null;
  @property(BagCtrl)
  public readonly bagCtrl: BagCtrl = null;
  @property(AssetDisplayCtrl)
  public readonly assetDisplayCtrl: AssetDisplayCtrl = null;
  @property(PrizeViewer)
  public readonly prizeViewer: PrizeViewer = null;
  @property(GameWinCtrl)
  public readonly gameWinCtrl: GameWinCtrl = null;
  @property(SlotUITutorial)
  public readonly slotTutorial: SlotUITutorial = null;

  private autoSpinInited = false;
  private slotUiInited = false;
  private inited = false;

  public init(startGameData: StartGameExArgs) {
    console.log('SlotUI init', startGameData);
    this.betCtrl.init(startGameData);
    if (DEV) {
      this.assetDisplayCtrl.init();
      this.gameWinCtrl.init();
      this.slotButtonCtrl.init();
      this.settingMenu.setVisibility(false);
    }
    this.prizeViewer.init(0);
    this.slotTutorial.init();
    this.inited = true;
    if (DEV) {
      SlotGDK.instance.eventBottomBarLoaded.notify();
    }
  }

  public initSlotUISwitch(data: JsonAsset) {
    const config = data.json;
    Object.keys(SlotUISwitch).forEach(key => {
      SlotUISwitch[key] = config[key] ?? SlotUISwitch[key];
    });
    this.assetDisplayCtrl.init();
    this.assetDisplayCtrl.updatePlayerBalance();
    this.gameWinCtrl.init();
    this.slotButtonCtrl.init();
    this.labelCtrl.init();
    this.settingMenu.setVisibility(false);
    this.slotTutorial.init();
    this.bagCtrl?.init();
    this.slotUiInited = true;
  }

  public initAutoSpinPicker(data: JsonAsset) {
    this.autoSpinCtrl.autoSpinPicker.loadRemoteConfig(data);
    this.autoSpinInited = true;
  }

  public syncData(platformData) {
    Object.keys(PlatformData).forEach(key => {
      PlatformData[key] = platformData[key];
    });
  }

  update() {
    if (this.autoSpinInited && this.slotUiInited && this.inited) {
      this.autoSpinInited = false;
      this.slotUiInited = false;
      this.inited = false;
      SlotGDK.instance.eventBottomBarLoaded.notify();
    }
  }

  public showInternetUnstableTip(_option: boolean) {}

  public getGameWin() {
    return this.gameWinCtrl.getGameWin();
  }
}
