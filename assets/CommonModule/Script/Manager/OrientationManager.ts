import {
  _decorator,
  Component,
  director,
  Director,
  macro,
  Size,
  size,
  UITransform,
  view,
  screen,
  ResolutionPolicy,
} from 'cc';
const {ccclass, property} = _decorator;

import {PlatformData} from '../Define/PlatformData';
import EventManager from './EventManager';
import {OrientationDefine} from '../Type/CommonDefine';
// // 螢幕方向
export enum Orientation {
  Landscape = 0, // 橫向
  Portrait = 1, // 直向
  Auto = 2,
}

@ccclass('OrientationManager')
export default class OrientationManager extends Component {
  //#region Singleton
  //==============================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): OrientationManager {
    return OrientationManager._instance;
  }
  /** Instance 實體 */
  private static _instance: OrientationManager = null;
  //==============================================================
  //#endregion Singleton
  public get orientation(): OrientationDefine.OrientationType {
    return this._orientation;
  }
  @property({displayName: '預計橫版 Canvas 解析度'})
  private designSolutionH: Size = size(1280, 720);
  @property({displayName: '最小橫版 Canvas 解析度'})
  private minDesignSolutionH: Size = size(1280, 720);
  @property({displayName: '預計直版 Canvas 解析度'})
  private designSolutionV: Size = size(720, 1280);
  @property({displayName: '最小直版 Canvas 解析度'})
  private minDesignSolutionV: Size = size(720, 1280);
  private _orientation: OrientationDefine.OrientationType =
    OrientationDefine.OrientationType.LANDSCAPE;
  private screenOrientation: OrientationDefine.OrientationType = null;
  private lastClientSize: Size | null = null;
  private _isSupportOrientationChange = false;
  private _onScreenChange = this.changeDesignResolution.bind(this, true);
  /**
   * 讓遊戲專案可以設定當下是否需要阻擋橫直轉換
   * false: 暫停直橫轉換（design resolution 仍會正常更新，但不會切換方向）
   * true: 恢復直橫轉換，並立即重新偵測方向
   */
  public set isSupportOrientationChange(isSupport: boolean) {
    this._isSupportOrientationChange = isSupport;
    if (isSupport) {
      this.changeDesignResolution(true);
    }
  }

  public get isSupportOrientationChange(): boolean {
    return this._isSupportOrientationChange;
  }

  private get canvasTransform() {
    return director
      .getScene()
      .getChildByName('Canvas')
      .getComponent(UITransform);
  }
  onLoad() {
    if (OrientationManager._instance) {
      this.node.destroy();
      return;
    }
    OrientationManager._instance = this;
  }
  onDestroy() {
    this.release();
  }

  /**
   * 初始化OrientationManager
   */
  public init() {
    this.lastClientSize = size(0, 0);
    if (
      PlatformData.gameSetting.MaxHorizontalHeight !== undefined &&
      PlatformData.gameSetting.MaxHorizontalWidth !== undefined
    ) {
      this.designSolutionH.height =
        PlatformData.gameSetting.MaxHorizontalHeight;
      this.designSolutionH.width = PlatformData.gameSetting.MaxHorizontalWidth;
      console.log(
        "OrientationManager's set Max designSolutionH: ",
        this.designSolutionH
      );
    }

    if (
      PlatformData.gameSetting.MaxPortraitHeight !== undefined &&
      PlatformData.gameSetting.MaxPortraitWidth !== undefined
    ) {
      this.designSolutionV.height = PlatformData.gameSetting.MaxPortraitHeight;
      this.designSolutionV.width = PlatformData.gameSetting.MaxPortraitWidth;
      console.log(
        "OrientationManager's set Max designSolutionV: ",
        this.designSolutionV
      );
    }

    //支援直橫轉換才開啟此功能
    this._isSupportOrientationChange = this.checkOrientationSupport();
    if (this._isSupportOrientationChange) {
      this.screenOrientation = this._orientation;
    }
    this.onSceneLaunched();
    director.on(
      Director.EVENT_AFTER_SCENE_LAUNCH,
      this.onSceneLaunched.bind(this)
    );
    window.addEventListener('orientationchange', this._onScreenChange);
    addEventListener('resize', this._onScreenChange);
    addEventListener('fullscreenchange', this._onScreenChange);
  }
  /**
   * 釋放OrientationManager資源
   */
  public release() {
    this.lastClientSize = null;
    director.off(
      Director.EVENT_AFTER_SCENE_LAUNCH,
      this.onSceneLaunched.bind(this)
    );
    this.unscheduleAllCallbacks();
    OrientationManager._instance = null;
  }
  /**
   * 每次更換場景都需要重新抓取當前Canvas
   */
  public onSceneLaunched() {
    console.log('[OrientationManager] onSceneLaunched');
    this.changeDesignResolution(true);
  }
  public changeDesignResolution(force = false) {
    const size: Size = screen.windowSize.clone();
    size.width = size.width / screen.devicePixelRatio;
    size.height = size.height / screen.devicePixelRatio;

    let isLandscape: boolean = null;
    if (this._orientation === OrientationDefine.OrientationType.AUTO) {
      if (
        size.width === this.lastClientSize.width &&
        size.height === this.lastClientSize.height &&
        !force
      )
        return;
      this.lastClientSize = new Size(size.width, size.height);
      console.log(
        '[OrientationManager] ChangeDesignResolution getFrameSize() = ' + size
      );
      if (
        !this._isSupportOrientationChange &&
        this.screenOrientation !== null
      ) {
        // 暫停直橫轉換時，保持當前方向不變，但仍更新 resolution
        isLandscape =
          this.screenOrientation ===
          OrientationDefine.OrientationType.LANDSCAPE;
      } else {
        isLandscape = size.width / size.height >= 1;
        this.screenOrientation = isLandscape
          ? OrientationDefine.OrientationType.LANDSCAPE
          : OrientationDefine.OrientationType.PORTRAIT;
      }
    } else if (this._orientation) {
      isLandscape =
        this._orientation === OrientationDefine.OrientationType.LANDSCAPE;
      this.screenOrientation = this._orientation;
    }
    if (isLandscape) {
      console.log('[OrientationManager] ChangeDesignResolution 橫版螢幕');
      this.setDesignResolution(
        this.designSolutionH,
        this.minDesignSolutionH,
        size
      );
    } else {
      console.log('[OrientationManager] ChangeDesignResolution 直版螢幕');
      this.setDesignResolution(
        this.designSolutionV,
        this.minDesignSolutionV,
        size
      );
    }
    PlatformData.isLandscape = isLandscape;
    EventManager.instance.dispatchEvent(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.screenOrientation
    );
    director.once(Director.EVENT_AFTER_UPDATE, () => {
      EventManager.instance.dispatchEvent(
        PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
        this.screenOrientation
      );
    });
  }
  /**
   * 根據目標重新設定解析度
   * @param maxDesignSolution 預計解析度
   * @param minDesignSolution 最小解析度
   * @param size 當前螢幕解析度
   */
  private setDesignResolution(
    maxDesignSolution: Size,
    minDesignSolution: Size,
    size: Size
  ): void {
    let canvas: Size = maxDesignSolution.clone();
    const screenRatio = size.width / size.height;
    const maxDesignRatio = maxDesignSolution.width / maxDesignSolution.height;
    const minDesignRatio = minDesignSolution.width / minDesignSolution.height;
    const currentIsLandScape =
      this.screenOrientation === OrientationDefine.OrientationType.LANDSCAPE;
    const currentIsPortrait =
      this.screenOrientation === OrientationDefine.OrientationType.PORTRAIT;

    if (currentIsLandScape) {
      //若螢幕比例超出左右大小,fit最小設定的高,寬度依比例縮放
      if (screenRatio > maxDesignRatio || screenRatio > minDesignRatio) {
        const width = size.width * (minDesignSolution.height / size.height);
        canvas = new Size(
          width < maxDesignSolution.width ? width : maxDesignSolution.width,
          minDesignSolution.height
        );
      } else {
        canvas = minDesignSolution;
      }
    }

    if (currentIsPortrait) {
      //若螢幕比例超出上下大小,fit最小設定的寬,高度依比例縮放
      if (screenRatio < maxDesignRatio || screenRatio < minDesignRatio) {
        let height = size.height * (minDesignSolution.width / size.width);
        if (height < minDesignSolution.height) {
          height = minDesignSolution.height;
        } else if (height > maxDesignSolution.height) {
          height = maxDesignSolution.height;
        }
        canvas = new Size(minDesignSolution.width, height);
      } else {
        canvas = minDesignSolution;
      }
    }
    view.setDesignResolutionSize(
      canvas.width,
      canvas.height,
      ResolutionPolicy.SHOW_ALL
    );
    this.canvasTransform.setContentSize(canvas);
  }
  /**
   * 確認此遊戲的直橫支援，同時支援直版和橫版才開啟轉換功能，否則強制鎖定直版or橫版
   */
  private checkOrientationSupport(): boolean {
    const isSupportLandscape = PlatformData.gameSetting
      .IsSupportLandscape as boolean;
    const isSupportPortrait = PlatformData.gameSetting
      .IsSupportPortrait as boolean;
    if (isSupportLandscape && isSupportPortrait) {
      this._orientation = OrientationDefine.OrientationType.AUTO;
      view.setOrientation(macro.ORIENTATION_AUTO);
    } else if (!isSupportLandscape && !isSupportPortrait) {
      //未支援直橫
      this._orientation = null;
      PlatformData.isLandscape = true;
      view.setOrientation(macro.ORIENTATION_LANDSCAPE);
    } else {
      if (isSupportPortrait) {
        this._orientation = OrientationDefine.OrientationType.PORTRAIT;
        view.setOrientation(macro.ORIENTATION_PORTRAIT);
        PlatformData.isLandscape = false;
      }
      // 若為橫版或都不支援，則強制橫版
      else {
        this._orientation = OrientationDefine.OrientationType.LANDSCAPE;
        view.setOrientation(macro.ORIENTATION_LANDSCAPE);
        PlatformData.isLandscape = true;
      }
    }
    return isSupportLandscape && isSupportPortrait;
  }
}
