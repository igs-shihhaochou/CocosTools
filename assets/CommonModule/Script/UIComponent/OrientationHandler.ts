import {
  _decorator,
  Layout,
  Component,
  Animation,
  AnimationClip,
  ScrollView,
  Vec2,
  Node,
  Size,
  Widget,
} from 'cc';
const {ccclass, property} = _decorator;

import {PlatformData} from '../Define/PlatformData';
import EventManager from '../Manager/EventManager';
import {OrientationDefine} from '../Type/CommonDefine';
import {LayoutParameter} from './LayoutParameter';
import {WidgetParameter} from './WidgetParameter';
import {setWidth, setHeight} from '../Utility/NodeProperty';

@ccclass('OrientationHandler')
export default class OrientationHandler extends Component {
  @property({type: Animation, displayName: 'Animation'})
  public animation: Animation | null = null;
  @property({
    type: AnimationClip,
    displayName: '顯示橫版使用的 Animation',
    visible: function (this: OrientationHandler) {
      return this.animation !== null;
    },
  })
  public animLandscape: AnimationClip | null = null;
  @property({
    type: AnimationClip,
    displayName: '顯示直版使用的 Animation',
    visible: function (this: OrientationHandler) {
      return this.animation !== null;
    },
  })
  public animPortrait: AnimationClip | null = null;
  @property({type: ScrollView, displayName: 'ScrollView'})
  public scrollView: ScrollView | null = null;
  @property({
    displayName: '橫版時 ScrollView 是否開啟橫向滾動',
    visible: function (this: OrientationHandler) {
      return this.scrollView !== null;
    },
  })
  public scrollViewLandscape = false;
  @property({
    displayName: '直版時 ScrollView 是否開啟直向滾動',
    visible: function (this: OrientationHandler) {
      return this.scrollView !== null;
    },
  })
  public scrollViewPortrait = false;
  @property({type: Layout, displayName: 'Layout'})
  public layout: Layout | null = null;
  @property({
    type: LayoutParameter,
    displayName: '橫版時 Layout 設定',
    visible: function (this: OrientationHandler) {
      return this.layout !== null;
    },
  })
  public layoutLandscape: LayoutParameter = new LayoutParameter();
  @property({
    type: LayoutParameter,
    displayName: '直版時 Layout 設定',
    visible: function (this: OrientationHandler) {
      return this.layout !== null;
    },
  })
  public layoutPortrait: LayoutParameter = new LayoutParameter();
  @property({type: Widget, displayName: 'Widget'})
  public widget: Widget | null = null;
  @property({
    type: WidgetParameter,
    displayName: '橫版時 Widget 設定',
    visible: function (this: OrientationHandler) {
      return this.widget !== null;
    },
  })
  public widgetLandscape: WidgetParameter = new WidgetParameter();
  @property({
    type: WidgetParameter,
    displayName: '直版時 Widget 設定',
    visible: function (this: OrientationHandler) {
      return this.widget !== null;
    },
  })
  public widgetPortrait: WidgetParameter = new WidgetParameter();
  @property({
    displayName: '是否變更Position',
    visible: function (this: OrientationHandler) {
      return this.animation === null;
    },
  })
  public changePosition = false;
  @property({
    displayName: '橫版時 Position 設定',
    visible: function (this: OrientationHandler) {
      return this.changePosition === true;
    },
  })
  private positionLandscape: Vec2 = new Vec2();
  @property({
    displayName: '直版時 Position 設定',
    visible: function (this: OrientationHandler) {
      return this.changePosition === true;
    },
  })
  private positionPortrait: Vec2 = new Vec2();
  @property({
    displayName: '是否變更Scale',
    visible: function (this: OrientationHandler) {
      return this.animation === null;
    },
  })
  public changeScale = false;
  @property({
    displayName: '橫版時 Scale 設定',
    visible: function (this: OrientationHandler) {
      return this.changeScale === true;
    },
  })
  private scaleLandscape: Vec2 = new Vec2(1, 1);
  @property({
    displayName: '直版時 Scale 設定',
    visible: function (this: OrientationHandler) {
      return this.changeScale === true;
    },
  })
  private scalePortrait: Vec2 = new Vec2(1, 1);
  @property({
    displayName: '是否變更顯示的Node',
    visible: function (this: OrientationHandler) {
      return this.animation === null;
    },
  })
  private changeNode = false;
  @property({
    type: Node,
    displayName: '橫版時 Node 設定',
    visible: function (this: OrientationHandler) {
      return this.changeNode === true;
    },
  })
  private nodeLandscape: Node | null = null;
  @property({
    type: Node,
    displayName: '直版時 Node 設定',
    visible: function (this: OrientationHandler) {
      return this.changeNode === true;
    },
  })
  private nodePortrait: Node | null = null;

  @property({
    displayName: '是否變更顯示的Size',
    visible: function (this: OrientationHandler) {
      return this.animation === null;
    },
  })
  private changeSize = false;

  @property({
    displayName: '橫版時 Size 設定',
    visible: function (this: OrientationHandler) {
      return this.changeSize === true;
    },
  })
  private sizeLandscape: Size = new Size(0, 0);

  @property({
    displayName: '直版時 Size 設定',
    visible: function (this: OrientationHandler) {
      return this.changeSize === true;
    },
  })
  private sizePortrait: Size = new Size(0, 0);

  protected start(): void {
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.OnOrientationChange,
      this
    );
    this.Init();
  }
  protected onDestroy(): void {
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.OnOrientationChange,
      this
    );
  }
  /**
   * 含有此腳本的物件產生時，如果有設定直橫版參數，根據目前為直or橫做一次變換
   */
  private Init() {
    const orientation =
      PlatformData.instance.isLandscape === false
        ? OrientationDefine.OrientationType.PORTRAIT
        : OrientationDefine.OrientationType.LANDSCAPE;
    this.OnOrientationChange(orientation);
  }
  public OnOrientationChange(
    orientation: OrientationDefine.OrientationType
  ): void {
    if (orientation === null) return;
    const isLandscape =
      orientation === OrientationDefine.OrientationType.LANDSCAPE;

    this.SetOrientaion(isLandscape ? this.animLandscape : this.animPortrait);
    this.SetScrollView(
      isLandscape ? true : this.scrollViewPortrait,
      isLandscape ? this.scrollViewLandscape : true
    );
    this.SetLayout(isLandscape ? this.layoutLandscape : this.layoutPortrait);
    this.SetWidget(isLandscape ? this.widgetLandscape : this.widgetPortrait);

    const pos = isLandscape ? this.positionLandscape : this.positionPortrait;
    this.SetPosition(pos.x, pos.y);

    const scl = isLandscape ? this.scaleLandscape : this.scalePortrait;
    this.SetScale(scl.x, scl.y);

    this.SetNodeActive(
      isLandscape ? this.nodeLandscape : this.nodePortrait,
      isLandscape ? this.nodePortrait : this.nodeLandscape
    );
    this.SetSize(isLandscape ? this.sizeLandscape : this.sizePortrait);
  }
  public SetOrientaion(clip: AnimationClip) {
    if (this.animation && clip) {
      this.animation.play(clip.name);
    }
  }
  public SetScrollView(horizontal: boolean, vertical: boolean): void {
    if (this.scrollView) {
      this.scrollView.horizontal = horizontal;
      this.scrollView.vertical = vertical;
    }
  }
  public SetLayout(parameter: LayoutParameter): void {
    if (this.layout) {
      this.layout.type = parameter.type as any;
      this.layout.paddingLeft = parameter.paddingLeft;
      this.layout.paddingRight = parameter.paddingRight;
      this.layout.paddingTop = parameter.paddingTop;
      this.layout.paddingBottom = parameter.paddingBottom;
      this.layout.spacingX = parameter.spacingX;
      this.layout.spacingY = parameter.spacingY;
      this.layout.horizontalDirection = parameter.horizontalDirection as any;
      this.layout.verticalDirection = parameter.verticalDirection as any;
    }
  }
  public SetWidget(parameter: WidgetParameter): void {
    if (this.widget) {
      this.widget.isAlignTop = parameter.isAlignTop;
      this.widget.isAlignBottom = parameter.isAlignBottom;
      this.widget.isAlignLeft = parameter.isAlignLeft;
      this.widget.isAlignRight = parameter.isAlignRight;
      this.widget.isAlignHorizontalCenter = parameter.isAlignHorizontalCenter;
      this.widget.isAlignVerticalCenter = parameter.isAlignVerticalCenter;
      this.widget.top = parameter.top;
      this.widget.bottom = parameter.bottom;
      this.widget.left = parameter.left;
      this.widget.right = parameter.right;
      this.widget.horizontalCenter = parameter.horizontalCenter;
      this.widget.verticalCenter = parameter.verticalCenter;
    }
  }
  public SetPosition(positionX: number, positionY: number) {
    if (this.changePosition) {
      this.node.setPosition(positionX, positionY);
    }
  }
  public SetScale(scaleX: number, scaleY: number) {
    if (this.changeScale) {
      this.node.setScale(scaleX, scaleY);
    }
  }
  private SetNodeActive(active: Node, inactive: Node) {
    if (!this.changeNode) return;
    if (active) active.active = true;
    if (inactive) inactive.active = false;
  }
  private SetSize(size: Size) {
    if (this.changeSize) {
      setWidth(this.node, size.width);
      setHeight(this.node, size.height);
    }
  }
}
