import {PlatformData} from '../Define/PlatformData';
import Functions from '../Utility/Functions';
import EventManager from './EventManager';

export default class FunctionManager {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get instance() {
    if (FunctionManager._instance === null) {
      FunctionManager._instance = new FunctionManager();
    }
    return FunctionManager._instance;
  }
  /** Instance 實體 */
  private static _instance: FunctionManager = null;
  //=======================================================
  //#endregion Singleton

  constructor() {
    this.Init();
  }

  /**
   * 初始化FunctionManager
   */
  public Init() {
    FunctionManager._instance = this;
  }

  /**
   * 釋放FunctionManager資源
   */
  public Release() {
    FunctionManager._instance = null;
  }

  /**
   * 關閉遊戲功能管理，如有人註冊關閉遊戲前事件，則不關閉遊戲改呼叫事件
   * @param isMute
   */
  public CloseGame(isMute = false) {
    if (
      EventManager.instance.hasEventListener(
        PlatformData.gameEventName.BEFORE_CLOSE_GAME
      )
    ) {
      EventManager.instance.dispatchEvent(
        PlatformData.gameEventName.BEFORE_CLOSE_GAME,
        isMute
      );
    } else {
      Functions.closeGame(isMute, true);
    }
  }
}
