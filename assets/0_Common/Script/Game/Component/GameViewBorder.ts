import {
  _decorator,
  Component,
  Node,
  UITransform,
  Vec3,
  director,
  Director,
  view,
  screen,
  type Size,
} from 'cc';
const {ccclass, property, menu} = _decorator;

import {enumBorderCoverType} from '../../../../CommonModule/Script/Type/CommonDefine';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import EventManager from '../../../../CommonModule/Script/Manager/EventManager';
import {nodeEx} from '../../../../CommonModule/Script/Utility/NodeEx';

/** 覆蓋畫面最大拓展比例 */
const MAX_COVER_EXTEND_SCALE = 2;

/**
 * 遊戲外邊緣覆蓋畫面
 * 若使用enumBorderCoverType僅覆蓋上下或左右時 最大拓展比例為兩倍
 */
@ccclass('GameViewBorder')
@menu('0_Common/Game/Component/GameViewBorder')
export default class GameViewBorder extends Component {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): GameViewBorder {
    if (!window['gameViewBorder']) {
      window['gameViewBorder'] = new GameViewBorder();
    }
    return window['gameViewBorder'];
  }
  /** Instance 實體 */
  private static set instance(instance: GameViewBorder) {
    window['gameViewBorder'] = instance;
  }
  //=======================================================
  //#endregion Singleton

  /** 上遮罩 */
  @property(Node)
  private top: Node | null = null;
  /** 下遮罩 */
  @property(Node)
  private bottom: Node | null = null;
  /** 左遮罩 */
  @property(Node)
  private left: Node | null = null;
  /** 右遮罩 */
  @property(Node)
  private right: Node | null = null;

  /** 最後的邊界覆蓋類型 */
  private lastBorderCoverType: enumBorderCoverType = null;
  /** 綁定視窗調整Function (註冊與取消註冊對象須相同) */
  private bindResizeHandler: EventListenerObject | null = null;

  start() {
    GameViewBorder.instance = this;
    this.init();
  }

  onDestroy() {
    this.release();
  }

  /**
   * 設置邊界覆蓋類型
   * @param type
   */
  public setBorderCoverType(type: enumBorderCoverType) {
    this.lastBorderCoverType = type;

    this.setPosition();
    this.setSize();
  }

  /**
   * 初始化GameViewBorder
   */
  private init() {
    //同步Canvas節點位置及大小
    // kyy to do
    // this.node.getComponent(UITransform).zIndex = macro.MAX_ZINDEX;

    //設置覆蓋類型
    this.lastBorderCoverType =
      PlatformData.gameSetting?.BorderCoverType ||
      enumBorderCoverType.ALL_SIDES;

    //各遮罩中心點定位
    this.top.getComponent(UITransform).setAnchorPoint(0.5, 0);
    this.bottom.getComponent(UITransform).setAnchorPoint(0.5, 1);
    this.left.getComponent(UITransform).setAnchorPoint(1, 0.5);
    this.right.getComponent(UITransform).setAnchorPoint(0, 0.5);

    this.setPosition();
    this.setSize();

    this.bindResizeHandler = {
      handleEvent: this.onResize.bind(this),
    };
    window.addEventListener('resize', this.bindResizeHandler);

    EventManager.instance.addEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.onResize,
      this
    );
  }

  /**
   * 釋放GameViewBorder資源
   */
  private release() {
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.onResize,
      this
    );

    if (this.bindResizeHandler != null)
      window.removeEventListener('resize', this.bindResizeHandler);
    this.bindResizeHandler = null;

    this.lastBorderCoverType = null;

    GameViewBorder.instance = null;
  }

  /**
   * 視窗調整事件處理
   */
  private onResize() {
    //等待一幀待resize完成
    director.once(
      Director.EVENT_AFTER_UPDATE,
      () => {
        this.setPosition();
        this.setSize();
      },
      this
    );
  }

  /**
   * 設置位置
   */
  private setPosition() {
    const designSize: Size = view.getDesignResolutionSize();
    const halfWidth: number = designSize.width * 0.5;
    const halfHeight: number = designSize.height * 0.5;

    this.top.setPosition(0, halfHeight);
    this.bottom.setPosition(0, -halfHeight);
    this.left.setPosition(-halfWidth, 0);
    this.right.setPosition(halfWidth, 0);

    //若僅為兩側則最多 MAX_COVER_EXTEND_SCALE 寬或高
    switch (this.lastBorderCoverType) {
      case enumBorderCoverType.TOP_BOTTOM:
        nodeEx(this.left).x = -halfWidth * MAX_COVER_EXTEND_SCALE - 0.5;
        nodeEx(this.right).x = halfWidth * MAX_COVER_EXTEND_SCALE - 0.5;
        break;
      case enumBorderCoverType.LEFT_RIGHT:
        nodeEx(this.top).y = halfHeight * MAX_COVER_EXTEND_SCALE - 0.5;
        nodeEx(this.bottom).y = -halfHeight * MAX_COVER_EXTEND_SCALE - 0.5;
        break;
    }

    //強制置中 重置座標至世界座標中心
    const origin = new Vec3();
    director
      .getScene()
      .getChildByName('Canvas')
      .getComponent(UITransform)
      .convertToWorldSpaceAR(origin, origin);
    this.node.parent
      .getComponent(UITransform)
      .convertToNodeSpaceAR(origin, origin);
    this.node.setPosition(origin);
  }

  /**
   * 設置尺寸
   */
  private setSize() {
    const designSize: Size = view.getDesignResolutionSize();
    const frameSize: Size = screen.windowSize;
    const designAspectRatio: number = designSize.width / designSize.height;
    const frameAspectRatio: number = frameSize.width / frameSize.height;
    const viewRatio: number = frameAspectRatio / designAspectRatio;

    this.top
      .getComponent(UITransform)
      .setContentSize(designSize.width, frameSize.height * (1 / viewRatio));
    this.bottom
      .getComponent(UITransform)
      .setContentSize(designSize.width, frameSize.height * (1 / viewRatio));
    this.left
      .getComponent(UITransform)
      .setContentSize(frameSize.width * viewRatio, designSize.height);
    this.right
      .getComponent(UITransform)
      .setContentSize(frameSize.width * viewRatio, designSize.height);
  }
}
