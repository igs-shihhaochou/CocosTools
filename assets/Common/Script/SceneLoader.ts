import {_decorator, Component, director} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import BundleManager from '../../CommonModule/Script/Manager/BundleManager';
import GameClient, {
  enumFromType,
} from '../../CommonModule/Script/Network/GameClient';
import LoadingHandler from '../../CommonModule/Script/UIComponent/LoadingHandler';
import {
  GAEventGameFlow,
  PlatformGDK,
} from '../../CommonModule/Script/Platform/PlatformGDK';
import GAHandler from '../../CommonModule/Script/Log/GA/GAHandler';
import BQLogger from '../../CommonModule/Script/Log/BQLog/BQLogger';
import EventManager from '../../CommonModule/Script/Manager/EventManager';

const {ccclass} = _decorator;

/** 遊戲階段名稱 */
const GAME_LEVEL_NAME = 'Main';
const TOTAL_LOADING_MERGE = 5;
const _TOTAL_LOADING_BUYBONUS_MERGE = 7;

@ccclass
export class SceneLoader extends Component {
  /** 目前進度 */
  private gameClientInited = false;

  private sceneLoadCompleted = false;

  private startTime: number = null;

  private loadingLogSent = false;

  private addLoadTasks() {
    LoadingHandler.instance.addLoadTask('ErrorCode', 0.1);
    LoadingHandler.instance.addLoadTask('SlotDownBarMultiLang', 0.05);
    LoadingHandler.instance.addLoadTask('SlotDownBar', 0.05);
    LoadingHandler.instance.addLoadTask('ReceiveStartGame', 0.1);
    LoadingHandler.instance.addLoadTask(GAME_LEVEL_NAME, 0.6);
  }

  public get isJoya() {
    return PlatformData.logo === enumFromType.Joya;
  }

  public get showLoadingOnce(): boolean {
    return (
      (PlatformData.gameSetting.ShowLoadingOnce as boolean) ||
      PlatformData.isDaraEnv
    );
  }

  private onGameClientInitCompleted() {
    this.gameClientInited = true;
    this.setup();
  }

  private setup() {
    //網路層串接
    if (PlatformData.isDaraEnv || PlatformData.useApiServer) {
      PlatformData.instance.lobbyArkClient =
        GameClient.instance.getArkClientByIndex(0);
      PlatformData.instance.arkClient =
        GameClient.instance.getArkClientByIndex(1);
    } else {
      PlatformData.instance.arkClient = GameClient.arkClient;
      PlatformData.instance.lobbyArkClient = GameClient.arkClient;
    }
  }

  private setLoadingMerge() {
    PlatformData.gameSetting.InitLoadingMerge = TOTAL_LOADING_MERGE;
  }

  protected onLoad(): void {
    LoadingHandler.instance.reset();
    PlatformData.gameSetting.WaitAfterGameReady = true;
    this.setLoadingMerge();
    PlatformGDK.instance.onGameClientInitCompleted.insert(this.init, this);

    EventManager.instance.addEventListenerOnce(
      PlatformData.gameEventName.DYNAMIC_UI_LOADED,
      this.init,
      this
    );
  }

  private async init() {
    this.startTime = Date.now();
    const LOADING_LEVEL_TEXT = 'Common';

    PlatformGDK.instance.onGameClientInitCompleted.insert(
      this.onGameClientInitCompleted,
      this
    );

    director.addPersistRootNode(this.node);

    //載入狀態重設
    LoadingHandler.instance.setLoadingLevelText(LOADING_LEVEL_TEXT);

    if ((PlatformData.gameSetting.GameScene as string) === null) {
      console.error(
        '[SceneLoader] PlatformData.GameSetting.GameScene is null.'
      );
      return;
    }

    const onProgress = (completedCount: number, totalCount: number) => {
      //載入進度 (主遊戲部分)
      const percentage = completedCount / totalCount;
      LoadingHandler.instance.setProgress(percentage, GAME_LEVEL_NAME);
    };

    const onLoaded = (err: Error) => {
      if (err) {
        console.error('[SceneLoader] preloadScene error.', err);
      } else {
        GAHandler.SendEvent(
          'loading',
          GAEventGameFlow.gameLoadFinish,
          PlatformData.gameName,
          GAHandler.getGameLoadingTime()
        );

        if (!this.loadingLogSent) {
          //**BQ埋點 */
          BQLogger.sendLoading();
          this.loadingLogSent = true;
        }

        this.sceneLoadCompleted = true;
        console.log(
          '[SceneLoader] preloadScene loaded, cost time:',
          (Date.now() - this.startTime) / 1000
        );
      }
    };

    const normalLoad = () => {
      console.warn('請使用BundleLoad!!');
      director.preloadScene(
        PlatformData.gameSetting.GameScene as string,
        (completedCount: number, totalCount: number) => {
          //載入進度 (主遊戲部分)
          const percentage = completedCount / totalCount;
          //joya loading頁優化,讓loading條不從preload進度開始跑
          if (this.showLoadingOnce) {
            LoadingHandler.instance.setProgress(percentage, GAME_LEVEL_NAME);
            if (percentage === 1) {
              LoadingHandler.instance.setLoadingLevelText(GAME_LEVEL_NAME);
              GAHandler.SendEvent(
                'loading',
                GAEventGameFlow.gameLoadFinish,
                PlatformData.gameName,
                GAHandler.getGameLoadingTime()
              );
              //**BQ埋點 */
              BQLogger.sendLoading();
              this.sceneLoadCompleted = true;
            }
          } else {
            LoadingHandler.instance.setProgress(percentage, LOADING_LEVEL_TEXT);
          }
        },
        (err: Error) => {
          if (err) {
            console.error('[SceneLoader] preloadScene error.', err);
          }
        }
      );
    };

    this.addLoadTasks();

    if (PlatformData.gameSetting.UseBundleLoad) {
      // 預載主遊戲場景 (計入進度條)
      BundleManager.instance.loadBundleAssets(
        'Game',
        null,
        onProgress,
        onLoaded,
        normalLoad
      );
    } else {
      normalLoad();
    }
  }

  onEnable() {
    LoadingHandler.instance.showLoadingView(true);
  }

  protected update(): void {
    if (this.sceneLoadCompleted && this.gameClientInited) {
      this.sceneLoadCompleted = false;
      this.gameClientInited = false;
      director.getScene().getChildByName('GameInit').destroy();
      director.loadScene(PlatformData.gameSetting.GameScene);
    }
  }
}
