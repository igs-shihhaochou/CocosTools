// 來源 : https://forum.cocos.org/t/topic/157250/2

import {
  CCInteger,
  Component,
  DirectorEvent,
  Enum,
  Node,
  Rect,
  Size,
  TransformBit,
  UITransform,
  Vec3,
  _decorator,
  director,
} from 'cc';

const {
  ccclass,
  menu,
  property,
  disallowMultiple,
  requireComponent,
  executeInEditMode,
} = _decorator;

/**
 * 佈局類型
 * - NONE 不做任何縮放
 * - CONTAINER 容器的大小會根據子節點的大小自動縮放。
 */
enum ResizeMode {
  NONE = 0,
  /** 容器的大小會根據子節點的大小自動縮放。*/
  CONTAINER,
}

@ccclass
@executeInEditMode // 在編輯器模式下執行
@disallowMultiple
@menu('CommonModule/UIComponent/LayoutResize')
@requireComponent(UITransform)
export default class LayoutResize extends Component {
  @property
  private _resize = ResizeMode.NONE;
  @property({
    type: Enum(ResizeMode),
    displayName: '佈局類型',
  })
  get resizeMode() {
    return this._resize;
  }
  set resizeMode(value: ResizeMode) {
    this._resize = value;
    this._doLayoutDirty();
  }

  @property
  private _paddingTop = 0;
  @property({type: CCInteger, tooltip: '容器內上邊距'})
  get paddingTop() {
    return this._paddingTop;
  }
  set paddingTop(value: number) {
    this._paddingTop = value;
    this._doLayoutDirty();
  }

  @property
  private _paddingBottom = 0;
  @property({type: CCInteger, tooltip: '容器內下邊距'})
  get paddingBottom() {
    return this._paddingBottom;
  }
  set paddingBottom(value: number) {
    this._paddingBottom = value;
    this._doLayoutDirty();
  }

  @property
  private _paddingLeft = 0;
  @property({type: CCInteger, tooltip: '容器內左邊距'})
  get paddingLeft() {
    return this._paddingLeft;
  }
  set paddingLeft(value: number) {
    this._paddingLeft = value;
    this._doLayoutDirty();
  }

  @property
  private _paddingRight = 0;
  @property({type: CCInteger, tooltip: '容器內右邊距'})
  get paddingRight() {
    return this._paddingRight;
  }
  set paddingRight(value: number) {
    this._paddingRight = value;
    this._doLayoutDirty();
  }

  private _layoutDirty = true;
  private _layoutSize = new Size(100, 100);
  private hasListeners = false;

  onEnable() {
    this._addEventListeners();
    const trans = this.node.getComponent(UITransform);
    if (trans?.contentSize.equals(new Size(0, 0))) {
      trans?.setContentSize(this._layoutSize);
    }

    // 監聽 AFTER_UPDATE，統一在渲染前最後一刻刷新
    director.on(DirectorEvent.AFTER_UPDATE, this._flushLayout, this);

    // 首幀就排一次
    this._layoutDirty = true;
  }

  onDisable() {
    director.off(DirectorEvent.AFTER_UPDATE, this._flushLayout, this);
    this._removeEventListeners();
  }

  onLoad() {
    this.onEnable();
  }

  onDestroy() {
    this.onDisable();
  }

  _flushLayout() {
    if (!this._layoutDirty) return;

    this.updateLayout();
    this._layoutDirty = false;
  }

  _doLayoutDirty() {
    this._layoutDirty = true;
    //this.updateLayout();
  }

  _doLayoutTransform(type: TransformBit) {
    switch (type) {
      case TransformBit.POSITION:
      case TransformBit.SCALE:
      case TransformBit.RS:
      case TransformBit.TRS:
        this._doLayoutDirty();
        break;
      default:
        break;
    }
  }

  _addEventListeners() {
    if (this.hasListeners) return;

    this.node.on(Node.EventType.SIZE_CHANGED, this._resized, this);
    this.node.on(Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
    this.node.on(Node.EventType.CHILD_ADDED, this._childAdded, this);
    this.node.on(Node.EventType.CHILD_REMOVED, this._childRemoved, this);
    this._addChildrenEventListeners();
    this.hasListeners = true;
  }

  _removeEventListeners() {
    if (!this.hasListeners) return;

    this.node.off(Node.EventType.SIZE_CHANGED, this._resized, this); // 大小改變
    this.node.off(Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this); // 錨點改變
    this.node.off(Node.EventType.CHILD_ADDED, this._childAdded, this); // 添加子節點
    this.node.off(Node.EventType.CHILD_REMOVED, this._childRemoved, this); // 刪除子節點
    this._removeChildrenEventListeners();
    this.hasListeners = false;
  }

  _addChildrenEventListeners() {
    const children = this.node.children;
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      child.on(Node.EventType.TRANSFORM_CHANGED, this._doLayoutTransform, this);
      child.on(Node.EventType.SIZE_CHANGED, this._doLayoutDirty, this);
      child.on(Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
      child.on('active-in-hierarchy-changed', this._doLayoutDirty, this);
    }
  }

  _removeChildrenEventListeners() {
    const children = this.node.children;
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      // onDestroy 會在onDisable 之後被調用
      if (!child.isValid) continue;
      child.off(
        Node.EventType.TRANSFORM_CHANGED,
        this._doLayoutTransform,
        this
      );
      child.off(Node.EventType.SIZE_CHANGED, this._doLayoutDirty, this);
      child.off(Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
      child.off('active-in-hierarchy-changed', this._doLayoutDirty, this);
    }
  }

  _childAdded(child) {
    child.on(Node.EventType.TRANSFORM_CHANGED, this._doLayoutTransform, this);
    child.on(Node.EventType.SIZE_CHANGED, this._doLayoutDirty, this);
    child.on(Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
    child.on('active-in-hierarchy-changed', this._doLayoutDirty, this);
    this._doLayoutDirty();
  }

  _childRemoved(child) {
    child.off(Node.EventType.TRANSFORM_CHANGED, this._doLayoutTransform, this);
    child.off(Node.EventType.SIZE_CHANGED, this._doLayoutDirty, this);
    child.off(Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
    child.off('active-in-hierarchy-changed', this._doLayoutDirty, this);
    this._doLayoutDirty();
  }

  _resized() {
    this._layoutSize = this.node.getComponent(UITransform)!.contentSize;
    this._doLayoutDirty();
  }

  _doLayoutBasic() {
    const {children} = this.node;
    let allChildrenBoundingBox: Rect | null = null;
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      if (child.activeInHierarchy) {
        if (allChildrenBoundingBox) {
          Rect.union(
            allChildrenBoundingBox,
            allChildrenBoundingBox,
            child.getComponent(UITransform)!.getBoundingBoxToWorld()
          );
        } else {
          allChildrenBoundingBox = child
            .getComponent(UITransform)!
            .getBoundingBoxToWorld();
        }
      }
    }

    if (allChildrenBoundingBox) {
      const trans =
        this.node.getComponent(UITransform) ??
        this.node.addComponent(UITransform);
      let leftBottomSpace = trans.convertToNodeSpaceAR(
        new Vec3(allChildrenBoundingBox.x, allChildrenBoundingBox.y)
      );
      leftBottomSpace = new Vec3(
        leftBottomSpace.x - this.paddingLeft,
        leftBottomSpace.y - this.paddingBottom
      );
      let rightTopSpace = trans.convertToNodeSpaceAR(
        new Vec3(allChildrenBoundingBox.xMax, allChildrenBoundingBox.yMax)
      );
      rightTopSpace = new Vec3(
        rightTopSpace.x + this.paddingRight,
        rightTopSpace.y + this.paddingTop
      );

      const space = rightTopSpace.subtract(leftBottomSpace);
      const newSize = new Size(
        parseFloat(space.x.toFixed(2)),
        parseFloat(space.y.toFixed(2))
      );
      if (newSize.width !== 0) {
        // 反轉是為了得到子節點在父座標系中的座標點
        const newAnchorX = -leftBottomSpace.x / newSize.width;
        trans.anchorX = parseFloat(newAnchorX.toFixed(2));
      }
      if (newSize.height !== 0) {
        // 反轉是為了得到子節點在父座標系中的座標點
        const newAnchorY = -leftBottomSpace.y / newSize.height;
        trans.anchorY = parseFloat(newAnchorY.toFixed(2));
      }

      trans.setContentSize(newSize);
    }
  }

  /**
   * 立即執行更新佈局
   *
   * @method updateLayout
   *
   * @example
   * layout.type = cc.Layout.HORIZONTAL;
   * layout.node.addChild(childNode);
   * cc.log(childNode.x); // not yet changed
   * layout.updateLayout();
   * cc.log(childNode.x); // changed
   */
  updateLayout() {
    if (this._resize !== ResizeMode.CONTAINER) return;
    if (!this._layoutDirty) return;
    if (!this.node.children.length) return;
    const activeChild = this.node.children.find(node => node.activeInHierarchy);
    if (!activeChild) return;
    this._doLayoutBasic();
    this._layoutDirty = false;
  }
}
