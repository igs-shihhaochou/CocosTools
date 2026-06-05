import {
  _decorator,
  Component,
  find,
  instantiate,
  JsonAsset,
  Node,
  Prefab,
} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import BQLogger from '../../CommonModule/Script/Log/BQLog/BQLogger';
import GameActivityManager from '../../CommonModule/Script/Manager/GameActivityManager';
import LoadingHandler from '../../CommonModule/Script/UIComponent/LoadingHandler';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {SlotGameDataEx} from '../../SlotModule/Define/SlotGameData';
import PopupRootController from './PopupRootController';
import {SceneLoader} from './SceneLoader';
import BundleManager from '../../CommonModule/Script/Manager/BundleManager';
import {DEV} from 'cc/env';
import MultiLangHandler from '../../CommonModule/Script/Core/MultiLangHandler';
import {PlatformGDK} from '../../CommonModule/Script/Platform/PlatformGDK';
import Functions from '../../CommonModule/Script/Utility/Functions';

const {ccclass, property} = _decorator;

@ccclass
export default class LoadingPageManager extends Component {
  /** 取得 Singleton 物件實體 */
  public static get instance(): LoadingPageManager {
    return LoadingPageManager._instance;
  }
  /** Instance 實體 */
  private static _instance: LoadingPageManager = null;

  @property(PopupRootController)
  public popupRootController: PopupRootController = null;

  @property(Node)
  private uiRootNode: Node = null;

  private sceneLoader: SceneLoader = null;

  private get showOkBtnWhenLoadingEnd(): boolean {
    return (
      (PlatformData.gameSetting.ShowOkBtnWhenLoadingEnd as boolean) ||
      this.sceneLoader.isJoya
    );
  }

  protected onLoad(): void {
    if (LoadingPageManager._instance !== null) {
      this.node.destroy();
      return;
    }
    LoadingPageManager._instance = this;

    SlotGDK.instance.eventSceneIsReady.insert(this.closeLoadingPage, this);
    PlatformGDK.instance.receiveOriginalStartGameData.insert(
      this.receiveStartGameData,
      this
    );

    const sceneLoaderNode: Node = find('SceneLoader');
    if (sceneLoaderNode)
      this.sceneLoader = sceneLoaderNode.getComponent<SceneLoader>(SceneLoader);

    LoadingHandler.instance.showLoadingView(true);

    this.init();
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventSceneIsReady.remove(this.closeLoadingPage, this);
    PlatformGDK.instance.receiveOriginalStartGameData.remove(
      this.receiveStartGameData,
      this
    );
    LoadingPageManager._instance = null;
  }

  private receiveStartGameData(data) {
    if (data.Code !== 0) {
      return;
    }
    LoadingHandler.instance.setProgress(1, 'ReceiveStartGame');
  }

  private async loadBundleAssetsByKey(bundleKey: string, bundleName: string) {
    return new Promise<void>((resolve, reject) => {
      BundleManager.instance.loadBundleAssetsByKey(
        bundleKey,
        null,
        (progress: number) => {
          LoadingHandler.instance.setProgress(progress, bundleName);
        },
        resolve,
        reject
      );
    });
  }

  private async loadBundleAssets(bundleKey: string, bundleName: string) {
    return new Promise<void>((resolve, reject) => {
      BundleManager.instance.loadBundleAssets(
        bundleKey,
        null,
        (progress: number) => {
          LoadingHandler.instance.setProgress(progress, bundleName);
        },
        resolve,
        reject
      );
    });
  }

  private loadLang(bundleName: string) {
    //設定多國語言
    const lang = `${PlatformData.lang}${this.logoPostFix}`;
    //取得遊戲文字資源
    const gameTextDict = BundleManager.instance.getAsset<JsonAsset>(
      bundleName,
      MultiLangHandler.ASSET_NAME,
      JsonAsset,
      lang
    );
    //新增多語系遊戲文字
    if (gameTextDict) {
      MultiLangHandler.addGameTextDict(gameTextDict.json as JSON);
    }
  }

  private get logoPostFix() {
    switch (Functions.getURLParameter()['ShowLogo']) {
      case 'playgd':
      case 'magiccity':
      case 'playdd':
        return '_playgd';
      case 'Joya':
        return '_joya';
      default:
        return PlatformData.licenseSetting.socialAPI ? '_joya' : '';
    }
  }

  private async loadBottomBar() {
    const langBundleName = 'SlotDownBarMultiLang';
    const bundleName = 'SlotDownBar';
    const langBundleKey = BundleManager.instance.getBundleKey(langBundleName);
    const bundleKey = BundleManager.instance.getBundleKey(bundleName);
    if (!DEV) {
      await Promise.all([
        this.loadBundleAssetsByKey(langBundleKey, langBundleName),
        this.loadBundleAssetsByKey(bundleKey, bundleName),
      ]);
    } else {
      await Promise.all([
        this.loadBundleAssets(langBundleName, langBundleName),
        this.loadBundleAssets(bundleName, bundleName),
      ]);
    }

    this.loadLang(langBundleName);
    //讀取下bar
    const prefabPath = `Prefab/SlotUI${this.logoPostFix}`;
    const prefab: Prefab = BundleManager.instance.getAsset(
      bundleName,
      prefabPath,
      Prefab
    );
    const node = instantiate(prefab);
    node.name = prefabPath.replace('Prefab/', '');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slotUI: any = node.getComponent('SlotUI');
    //初始化,將PlatformData傳入
    slotUI?.syncData(PlatformData);
    this.uiRootNode.addChild(node);
  }

  public async init() {
    LoadingHandler.instance.setCompleteEvent(() => {
      LoadingHandler.instance.setCompleteEvent(null);
      console.log('[LoadingPageManager]onComplete setCompleteEvent');
      if (this.showOkBtnWhenLoadingEnd) {
        //設定continue button callback
        this.setCloseBtnCallback();
      } else {
        //沒有此流程,直接呼叫closeLoading事件
        SlotGDK.instance.eventBeforeLoadingClose.notify();
      }
      //下載音效
      this.loadAudioBundle();
      PlatformGDK.instance.afterGameReady.notify();
    });

    await Promise.all([
      this.popupRootController.loadErrorCode().then(() => {
        LoadingHandler.instance.setProgress(1, 'ErrorCode');
      }),
      this.loadBottomBar(),
    ]);
    //先呼叫Slot模組取得startGameData
    this.sendGameIsReadyEvent();
    const IsSupportBuyBonus = PlatformData.gameSetting
      .IsSupportBuyBonus as boolean;
    if (IsSupportBuyBonus) this.loadBuyBonus();
  }

  private setCloseBtnCallback() {
    console.log('[LoadingPageManager] setCloseBtnCallback');
    const callback = async () => {
      LoadingHandler.instance.onCloseBtnClicked.remove(callback, this);
      SlotGDK.instance.eventBeforeLoadingClose.notify();
    };
    LoadingHandler.instance.onCloseBtnClicked.insert(callback, this);
  }

  private sendGameIsReadyEvent() {
    console.warn('[LoadingPageManager] sendGameIsReadyEvent');
    if (SlotGDK.instance.eventGameIsReady.length > 0) {
      SlotGDK.instance.eventGameIsReady.notify();
    }
  }

  private closeLoadingPage() {
    BQLogger.sendSeeGameScene();
    BQLogger.startFpsLog();
    BQLogger.startPingLog();

    //**BQ埋點 */
    BQLogger.sendAvgFps();

    LoadingHandler.instance.showLoadingView(false);
    if (!PlatformData.gameSetting.NotShowActivityModuleAfterLoadingPage)
      GameActivityManager.instance?.ShowActivityView(true);
  }

  private async loadBuyBonus() {
    const bundleName = 'BuyBonusUI';
    const LangBundleName = 'BuyBonusUIMultiLang';
    const langBundleKey = BundleManager.instance.getBundleKey(LangBundleName);
    const bundleKey = BundleManager.instance.getBundleKey(bundleName);
    if (!DEV) {
      await Promise.all([
        this.loadBundleAssetsByKey(langBundleKey, LangBundleName),
        this.loadBundleAssetsByKey(bundleKey, bundleName),
      ]);
    } else {
      await Promise.all([
        this.loadBundleAssets(LangBundleName, LangBundleName),
        this.loadBundleAssets(bundleName, bundleName),
      ]);
    }
    this.loadLang(LangBundleName);
    const prefab: Prefab = BundleManager.instance.getAsset(
      bundleName,
      'Prefab/BuyBonus',
      Prefab
    );
    const node = instantiate(prefab);
    node.name = bundleName;
    console.log('[LoadingPageManager] loadBuyBonus', node);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyBonusUI: any = node.getComponent('BuyBonusController');
    buyBonusUI?.syncData(PlatformData, SlotGameDataEx);
    this.uiRootNode.addChild(node);
  }

  private async loadAudioBundle() {
    console.log('[LoadingPageManager] loadAudio');
    const bundleName = 'GameAudio';
    try {
      await this.loadBundleAssets(bundleName, bundleName);
    } catch (error) {
      console.error('[LoadingPageManager] loadAudioBundle error', error);
      return;
    }
    const prefab: Prefab = BundleManager.instance.getAsset(
      bundleName,
      'Prefab/AudioClipList',
      Prefab
    );
    if (prefab) {
      const node = instantiate(prefab);
      node.name = bundleName;
      this.node.addChild(node);
    } else {
      console.error(
        '[LoadingPageManager] loadAudio prefab not found',
        bundleName
      );
    }
  }
}
