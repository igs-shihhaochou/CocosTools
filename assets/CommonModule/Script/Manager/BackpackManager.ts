import {_decorator, Component, instantiate, Node, Prefab} from 'cc';
const {ccclass, property} = _decorator;

import {PlatformData} from '../Define/PlatformData';
import BundleManager from './BundleManager';
import EventManager, {EventNameList} from './EventManager';
import GameGuideManager from './GameGuideManager';
import ArkClient from '../Network/ArkSDK/ArkClient';
import Functions from '../Utility/Functions';
import {ItemSystemCommand} from '../Network/Command/ItemSystemCommand';
import {ItemSystemDataInterface} from '../Network/DataInterface/ItemSystemDataInterface';
import ItemSystem from '../Network/System/ItemSystem';
import ItemManager from './ItemManager';

interface BackpackEvent extends EventNameList {
  readonly open: string;
  readonly close: string;
  readonly ready: string;
  readonly redirect: string;
  readonly useItem: string;
  readonly sendGetBag: string;
  readonly receiveGetBag: string;
  readonly sendGetHistory: string;
  readonly receiveHistory: string;
  readonly unreadItem: string;
  readonly setTotalWin: string;
  readonly updateBalance: string;
}

@ccclass('BackpackManager')
export default class BackpackManager extends Component {
  public static backpackEvent: BackpackEvent = {
    open: 'backpack_open',
    close: 'backpack_close',
    ready: 'backpack_ready',
    redirect: 'backpack_redirect',
    useItem: 'backpack_use_item',
    sendGetBag: 'backpack_send_get_bag',
    receiveGetBag: 'backpack_rec_get_bag',
    sendGetHistory: 'backpack_send_get_history',
    receiveHistory: 'backpack_rec_get_history',
    unreadItem: 'backpack_unread_item',
    setTotalWin: 'backpack_set_total_win',
    updateBalance: 'backpack_update_balance',
  };

  public static cookieKey = 'ItemId';
  public get itemSystem(): ItemSystem {
    return this._itemSystem;
  }
  private _itemSystem: ItemSystem = null;

  @property(Node)
  private uiNode: Node = null;

  start() {}

  public init() {
    EventManager.instance.registerEvents(BackpackManager.backpackEvent);
    EventManager.instance.addEventListener(
      BackpackManager.backpackEvent.sendGetBag,
      this.sendGetBag,
      this
    );
    EventManager.instance.addEventListener(
      BackpackManager.backpackEvent.sendGetHistory,
      this.sendGetHistory,
      this
    );
    EventManager.instance.addEventListener(
      BackpackManager.backpackEvent.redirect,
      this.redirectGame,
      this
    );
    this.loadBackpackBundle();
  }

  public initSystem(arkClient: ArkClient) {
    if (this._itemSystem) return;

    if (!arkClient) {
      console.warn("[BackpackManager] initSystem arkClient doesn't exist.");
      return;
    }

    this._itemSystem = new ItemSystem();

    //針對對應的GameClient設定好System
    this._itemSystem.setupHttpClient(arkClient);

    //註冊封包事件
    this.registerSystemEvent();
  }

  private registerSystemEvent() {
    if (this._itemSystem) {
      this._itemSystem.addEventListener(
        ItemSystemCommand.Command.CMD_GET_BAG,
        this.receiveGetBag,
        this
      );
      this._itemSystem.addEventListener(
        ItemSystemCommand.Command.CMD_GET_HISTORY,
        this.receiveGetHistory,
        this
      );
    }
  }

  private unregisterSystemEvent() {
    if (this._itemSystem) {
      this._itemSystem.removeEventListener(
        ItemSystemCommand.Command.CMD_GET_BAG,
        this.receiveGetBag,
        this
      );
      this._itemSystem.removeEventListener(
        ItemSystemCommand.Command.CMD_GET_HISTORY,
        this.receiveGetHistory,
        this
      );
    }
  }

  private sendGetBag() {
    if (ItemManager.instance)
      ItemManager.instance.sendGetBag(this.receiveGetBag.bind(this));
  }

  private receiveGetBag(
    result: number,
    data: ItemSystemDataInterface.S2C_GetBag
  ) {
    // dataStr = this.fakeInitData;
    // result = 0;
    EventManager.instance.dispatchEvent(
      BackpackManager.backpackEvent.receiveGetBag,
      result,
      data
    );
  }

  private sendGetHistory(from: number, count: number) {
    if (ItemManager.instance)
      ItemManager.instance.sendGetHistory(
        this.receiveGetHistory.bind(this),
        from,
        count
      );
  }

  private receiveGetHistory(
    result: number,
    data: ItemSystemDataInterface.S2C_GetHistory
  ) {
    EventManager.instance.dispatchEvent(
      BackpackManager.backpackEvent.receiveHistory,
      result,
      data
    );
  }

  private redirectGame(gameName: string, itemId: string) {
    if (GameGuideManager.instance.gameGuideSystem) {
      Functions.setCookie(BackpackManager.cookieKey, '', 0, true);
      Functions.setCookie(BackpackManager.cookieKey, itemId, 30, true);
      GameGuideManager.instance.sendRedirect(gameName);
    }
  }

  public async loadBackpackBundle() {
    console.log('[BackpackManager] loadBackpackBundle start!');

    await new Promise((resolve: Function, reject: (err: Error) => void) => {
      BundleManager.instance.loadBundleAssetsByKey(
        'BackpackCcv3',
        PlatformData.lang,
        null,
        resolve,
        reject
      );
      BundleManager.instance.loadBundleAssetsByKey(
        'BackpackMultilangCcv3',
        PlatformData.lang,
        null,
        resolve,
        reject
      );
    })
      .then(() => {
        console.log('[BackpackManager] loadBackpackBundle complete!');
        const backpackNode = instantiate(
          BundleManager.instance.getAsset('Backpack', 'Prefab/Backpack', Prefab)
        );
        this.uiNode.addChild(backpackNode);
        backpackNode.name = 'Backpack';
        const itemRootNode = instantiate(
          BundleManager.instance.getAsset('Backpack', 'Prefab/ItemRoot', Prefab)
        );
        this.uiNode.addChild(itemRootNode);
        itemRootNode.name = 'ItemRoot';
      })
      .catch((err: Error) => {
        console.warn('[BackpackManager] loadBackpackBundle error!', err);
      });
  }
}
