import {_decorator, Component, Node} from 'cc';
import ItemManager from 'db://assets/CommonModule/Script/Manager/ItemManager';
import {ItemSystemDataInterface} from 'db://assets/CommonModule/Script/Network/DataInterface/ItemSystemDataInterface';
import {httpResult} from 'db://assets/CommonModule/Script/Network/Macross/MacrossClient';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import EventManager from 'db://assets/CommonModule/Script/Manager/EventManager';
import BackpackManager from 'db://assets/CommonModule/Script/Manager/BackpackManager';
import {SlotUIEvent} from '../Define/SlotUIEvent';
import {SlotUIBtnType} from '../Buttons/SlotUIBtnType';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import Functions from 'db://assets/CommonModule/Script/Utility/Functions';
import BQLogger from 'db://assets/CommonModule/Script/Log/BQLog/BQLogger';
import HostSetting from 'db://assets/SlotModule/Define/HostSetting';
import GameClient from 'db://assets/CommonModule/Script/Network/GameClient';
import Timer from 'db://assets/CommonModule/Script/Utility/Timer';
const {ccclass, property} = _decorator;

const TIMER_KEY_BAG_SETTING = 'BagCtrl_GetBagSetting';

@ccclass('BagCtrl')
export class BagCtrl extends Component {
  @property(Node)
  private backpackRedDot: Node = null;

  private backpackGetSettingCD = 20;

  onLoad(): void {
    this.registerEvent(true);
    SlotGDK.instance.eventOnOpeningFinished.insert(this.useItemHandler, this);
  }

  onDestroy(): void {
    this.registerEvent(false);
    SlotGDK.instance.eventOnOpeningFinished.remove(this.useItemHandler, this);
    Timer.unschedule(TIMER_KEY_BAG_SETTING);
  }

  start() {}

  public init() {
    if (HostSetting.instance.connectSetting.isConnectServer === false) {
      return;
    }
    this.activeBtn(false);
    this.activeRedDot(false);
    ItemManager.instance.init(() => {}, GameClient.arkClient);
    this.GetBagSetting();
    Timer.schedule(
      this.GetBagSetting.bind(this),
      this.backpackGetSettingCD,
      TIMER_KEY_BAG_SETTING
    );
  }

  public activeBtn(active: boolean) {
    SlotGDK.event(SlotUIEvent.SetBtnActive).notify(
      SlotUIBtnType.Backpack,
      active
    );
  }

  public activeRedDot(active: boolean) {
    this.backpackRedDot.active = active;
  }

  private GetBagSetting() {
    ItemManager.instance.sendBagSetting(this.ReceiveBagSetting.bind(this));
  }

  private registerEvent(option: boolean) {
    console.log('[BackpackCtrl] registerEvent', option);
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.BackpackClicked)[func](this.onBackpackClicked, this);
  }

  private onBackpackClicked() {
    /**BQ埋點 */
    BQLogger.sendClickBagIcon();

    console.log('[BackpackCtrl] onBackpackClicked');
    this.backpackRedDot.active = false;
    EventManager.instance.dispatchEvent(
      BackpackManager.backpackEvent.open,
      this.backpackGetSettingCD
    );
  }

  private ReceiveBagSetting(
    result: number,
    data: ItemSystemDataInterface.S2C_BagSetting
  ) {
    try {
      if (result === httpResult.ok && data.Code === 0) {
        this.activeBtn(true);
        this.backpackRedDot.active = data.New;
        if (data.CoolDown !== undefined && data.CoolDown > 0)
          this.backpackGetSettingCD = data.CoolDown;
      } else if (data.Code === 3) {
        //不再詢問背包按鈕
        Timer.unschedule(TIMER_KEY_BAG_SETTING);
      } else {
        this.activeBtn(false);
      }
    } catch (e) {
      console.error('[BagCtrl] ReceiveBagSetting error', e);
    }
  }

  private useItemHandler() {
    SlotGDK.instance.eventOnOpeningFinished.remove(this.useItemHandler, this);
    PlatformData.instance.itemId = Functions.getCookie(
      BackpackManager.cookieKey
    );

    if (PlatformData.instance.itemId) {
      Functions.setCookie(BackpackManager.cookieKey, null);
      EventManager.instance.dispatchEvent(
        BackpackManager.backpackEvent.useItem,
        PlatformData.instance.itemId
      );
    }
  }

  update(_deltaTime: number) {}
}
