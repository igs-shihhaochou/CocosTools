import {_decorator, Component, Enum, screen, Size, Sprite, view} from 'cc';
import {setSize} from '../Utility/NodeProperty';

const {ccclass, property, menu} = _decorator;

/** 覆蓋畫面最大拓展比例 */
const MAX_COVER_EXTEND_SCALE = 2;

/** 預設螢幕長寬比 */
const DEFAULT_ASPECT_HEIGHT = 9;
const DEFAULT_ASPECT_WIDTH = 16;

/** 適應畫面模式 */
export enum enumFitViewMode {
  /** 適應畫面尺寸 (非等比延展) */
  FIT,
  /** 節點圖像覆蓋畫面尺寸 (等比縮放) */
  COVER,
}

@ccclass
@menu('CommonModule/UIComponent/FitViewWidget')
export default class FitViewWidget extends Component {
  @property({
    type: Enum(enumFitViewMode),
    tooltip:
      '適應畫面模式\n\nFIT: 適應畫面尺寸 (非等比延展)\nCOVER: 節點圖像覆蓋畫面尺寸 (等比縮放)',
  })
  private fitMode: enumFitViewMode = enumFitViewMode.FIT;

  private sprite: Sprite = null;

  private bindResizeHandler: EventListenerObject = null;

  protected override onLoad() {
    this.init();
  }

  protected override onDestroy() {
    this.release();
  }

  /**
   * 初始化FitViewWidget
   */
  public init() {
    this.sprite = this.node.getComponent(Sprite);

    this.resizeHandler();

    this.bindResizeHandler = {
      handleEvent: this.resizeHandler.bind(this),
    };
    window.addEventListener('resize', this.bindResizeHandler);
  }

  /**
   * 釋放FitViewWidget資源
   */
  public release() {
    this.sprite = null;

    if (this.bindResizeHandler != null)
      window.removeEventListener('resize', this.bindResizeHandler);
    this.bindResizeHandler = null;
  }

  public updateSize() {
    this.resizeHandler();
  }

  /**
   * 設置適應畫面模式
   * @param mode
   */
  public setFitMode(mode: enumFitViewMode) {
    this.fitMode = mode;

    this.resizeHandler();
  }

  /**
   * 尺寸變更處理
   */
  private resizeHandler() {
    // - 目前以寬為主 若須以高為主 或依遊戲設定 需調整計算方式
    const sourceSize: Size =
      this.sprite?.spriteFrame?.originalSize.clone() ||
      view.getDesignResolutionSize();
    const designSize: Size = view.getDesignResolutionSize();
    const frameSize: Size = screen.windowSize;
    //覆蓋原解析度縮放大小
    const designCoverScale: number = Math.max(
      1,
      designSize.width / sourceSize.width,
      designSize.height / sourceSize.height
    );

    /** 判斷設計解析度是橫向還是直向 */
    const isDesignPortrait = designSize.height > designSize.width;
    /** 判斷框架解析度是橫向還是直向 */
    const isFramePortrait = frameSize.height > frameSize.width;
    /** 轉換後的designSize，將直版比例轉換成16:9的橫版比例 */
    const convertedSize = new Size(designSize);

    /** 針對橫向／直向用不同的比值公式 */
    let frameCoverScale: number;
    //覆蓋頁面框架縮放大小
    if (isDesignPortrait && !isFramePortrait) {
      // 由於PC螢幕為橫版，將直版比例根據16:9做轉換，得到放大的寬後再去計算
      convertedSize.width =
        (convertedSize.height / DEFAULT_ASPECT_HEIGHT) * DEFAULT_ASPECT_WIDTH;
      frameCoverScale = Math.min(
        MAX_COVER_EXTEND_SCALE,
        Math.max(
          1,
          frameSize.width /
            frameSize.height /
            (convertedSize.width / convertedSize.height)
        )
      );
    } else
      frameCoverScale = Math.min(
        MAX_COVER_EXTEND_SCALE,
        Math.max(
          1,
          frameSize.width /
            frameSize.height /
            (designSize.width / designSize.height)
        )
      );

    //高度縮放
    switch (this.fitMode) {
      case enumFitViewMode.FIT:
        sourceSize.height = designSize.height;
        break;
      case enumFitViewMode.COVER:
        sourceSize.height *= designCoverScale * frameCoverScale;
        break;
    }
    //寬度縮放
    sourceSize.width *= designCoverScale * frameCoverScale;
    //設定節點大小
    setSize(this.node, sourceSize);
  }
}
