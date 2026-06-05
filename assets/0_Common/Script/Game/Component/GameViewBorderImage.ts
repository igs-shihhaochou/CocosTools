import {
  _decorator,
  UITransform,
  Component,
  Size,
  director,
  Director,
  view,
} from 'cc';
import GameViewBorder from './GameViewBorder';
import EventManager from 'db://assets/CommonModule/Script/Manager/EventManager';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';

const {ccclass, property} = _decorator;

@ccclass('GameViewBorderImage')
export class GameViewBorderImage extends Component {
  @property(UITransform)
  private borderImgTf: UITransform = null;
  @property(UITransform)
  private borderImgAddTf: UITransform = null;

  private initImgSize: Size = new Size(0, 0);

  /** 綁定視窗調整Function (註冊與取消註冊對象須相同) */
  private bindResizeHandler: EventListenerObject | null = null;
  start() {
    if (GameViewBorder.instance !== null) {
      // GameViewBorder.instance.node.active = false;
      GameViewBorder.instance.node.addChild(this.node);
    }
    this.init();
  }
  onDestroy() {
    this.release();
  }
  private init() {
    this.initImgSize = this.borderImgTf.contentSize;

    this.resetImgSize();

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

    if (this.bindResizeHandler !== null)
      window.removeEventListener('resize', this.bindResizeHandler);
    this.bindResizeHandler = null;
  }

  /**
   * 視窗調整事件處理
   */
  private onResize() {
    //等待一幀待resize完成
    director.once(
      Director.EVENT_AFTER_UPDATE,
      () => {
        this.resetImgSize();
      },
      this
    );
  }
  private resetImgSize() {
    const designSize: Size = view.getDesignResolutionSize();

    const YRatio = window.innerHeight / designSize.height;
    const XRatio = window.innerWidth / designSize.width;

    const isProtrait =
      designSize.width < designSize.height &&
      designSize.width * YRatio < window.innerWidth;
    if (isProtrait) {
      const scale =
        window.innerWidth / (this.initImgSize.x * YRatio) < 1
          ? 1
          : window.innerWidth / (this.initImgSize.x * YRatio);
      this.borderImgTf.setContentSize(
        this.initImgSize.x * scale,
        this.initImgSize.y * scale
      );
      if (this.borderImgAddTf !== null) {
        this.borderImgAddTf.setContentSize(
          this.initImgSize.x * scale,
          this.initImgSize.y * scale
        );
      }
    } else {
      const scale =
        window.innerHeight / (this.initImgSize.y * XRatio) < 1
          ? 1
          : window.innerHeight / (this.initImgSize.y * XRatio);
      this.borderImgTf.setContentSize(
        this.initImgSize.x * scale,
        this.initImgSize.y * scale
      );
      if (this.borderImgAddTf !== null) {
        this.borderImgAddTf.setContentSize(
          this.initImgSize.x * scale,
          this.initImgSize.y * scale
        );
      }
    }
  }
}
