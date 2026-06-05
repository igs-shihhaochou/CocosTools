import {game} from 'cc';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import WebWorkerManager from './WebWorkerManager';

export default class ToolManager {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get Instance(): ToolManager {
    if (ToolManager.instance == null) {
      ToolManager.instance = new ToolManager();
    }
    return ToolManager.instance;
  }
  /** Instance 實體 */
  private static instance: ToolManager = null;
  //=======================================================
  //#endregion Singleton

  // 背景處理
  private backgroundUpdateHandler:
    | ((this: Document, ev: Event) => void)
    | null = null;

  constructor() {
    this.Init();
  }

  /**
   * 初始化ToolManager
   */
  public Init() {
    this.Release();

    ToolManager.instance = this;
  }

  /**
   * 釋放ToolManager資源
   */
  public Release() {
    this.backgroundUpdateHandler = null;

    ToolManager.instance = null;
  }

  /**
   * 新增背景執行功能
   * @param updateKey
   * @returns
   */
  public AddBackgroundUpdateHandler(
    updateKey: string
  ): (this: Document, ev: Event) => void {
    if (!this.backgroundUpdateHandler) {
      this.backgroundUpdateHandler = () => {
        if (
          document.visibilityState === 'hidden' &&
          PlatformData.isBackgroundUpdate
        ) {
          if (game.isPaused()) game.resume();

          WebWorkerManager.instance.createUpdateWorker(
            updateKey,
            game.step.bind(game),
            1000 / 30
          ); //30fps
        } else {
          WebWorkerManager.instance.closeUpdateWorker(updateKey);
        }
      };
    }

    return this.backgroundUpdateHandler;
  }

  /**
   * 移除背景執行功能
   */
  public RemoveBackgroundUpdateHandler(updateKey: string) {
    if (this.backgroundUpdateHandler) {
      this.backgroundUpdateHandler = null;
    }

    WebWorkerManager.instance.closeUpdateWorker(updateKey);

    if (document.visibilityState === 'hidden') game.pause();
  }
}
