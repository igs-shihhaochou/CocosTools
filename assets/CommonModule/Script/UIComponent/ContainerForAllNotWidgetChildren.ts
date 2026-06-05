import {
  _decorator,
  Component,
  CCFloat,
  Node,
  Widget,
  type Vec3,
  UITransform,
  Layout,
  rect,
  v3,
  type Rect,
} from 'cc';
const {ccclass, property, menu, executeInEditMode} = _decorator;

@ccclass('ContainerForAllNotWidgetChildren')
@menu('CustomUI/ContainerForAllNotWidgetChildren')
@executeInEditMode
export default class ContainerForAllNotWidgetChildren extends Component {
  @property({displayName: '編輯器內禁止更新'})
  protected disableInEditorMode = true;
  @property({displayName: '調校模式'})
  protected tuning = false;
  @property(CCFloat)
  protected paddingLeft = 0;
  @property(CCFloat)
  protected paddingRight = 0;
  @property(CCFloat)
  protected paddingTop = 0;
  @property(CCFloat)
  protected paddingBottom = 0;
  private requireUpdateSize = true;
  private get transform() {
    return this.node.getComponent(UITransform);
  }
  protected onLoad() {
    this.tuning = this.tuning && CC_EDITOR;
  }
  protected onEnable(): void {
    this.requireUpdateSize = true;
    this.node.children.forEach(this.addChildrenEvents);
    this.node.on(Node.EventType.SIZE_CHANGED, this.requestUpdate, this);
    this.node.on(Node.EventType.CHILD_ADDED, this.onAddChild, this);
    this.node.on(Node.EventType.CHILD_REMOVED, this.onRemoveChild, this);
  }
  protected onDisable(): void {
    this.requireUpdateSize = false;
    this.node.children.forEach(this.removeChildrenEvents);
    this.node.off(Node.EventType.SIZE_CHANGED, this.requestUpdate, this);
    this.node.off(Node.EventType.CHILD_ADDED, this.onAddChild, this);
    this.node.off(Node.EventType.CHILD_REMOVED, this.onRemoveChild, this);
  }
  protected lateUpdate(): void {
    if (CC_EDITOR && this.disableInEditorMode) return;
    if (!CC_EDITOR && this.tuning) this.tuning = false;

    if (this.tuning) this.updateTuningMode();
    else this.updateSizeImmediately();
  }
  public updateSizeImmediately() {
    if (this.tuning) return;
    else if (CC_EDITOR || this.requireUpdateSize) {
      this.requireUpdateSize = false;
      this.updateResizeMode();
    }
  }
  private addChildrenEvents: (node: Node) => void = function (
    this: ContainerForAllNotWidgetChildren,
    node: Node
  ) {
    node.on(Node.EventType.TRANSFORM_CHANGED, this.requestUpdate, this);
    node.on(Node.EventType.SIZE_CHANGED, this.requestUpdate, this);
    node.on(Node.EventType.ANCHOR_CHANGED, this.requestUpdate, this);
    node.on('active-in-hierarchy-changed', this.requestUpdate, this);
    this.requestUpdate();
  }.bind(this);
  private removeChildrenEvents: (node: Node) => void = function (
    this: ContainerForAllNotWidgetChildren,
    node: Node
  ) {
    node.off(Node.EventType.TRANSFORM_CHANGED, this.requestUpdate, this);
    node.off(Node.EventType.SIZE_CHANGED, this.requestUpdate, this);
    node.off(Node.EventType.ANCHOR_CHANGED, this.requestUpdate, this);
    node.off('active-in-hierarchy-changed', this.requestUpdate, this);
    this.requestUpdate();
  };

  private onAddChild(child: Node) {
    this.addChildrenEvents(child);
  }
  private onRemoveChild(child: Node) {
    this.removeChildrenEvents(child);
  }
  private requestUpdate() {
    this.requireUpdateSize = true;
  }
  private isContent: (node: Node) => boolean = function (node: Node): boolean {
    if (node === null || !node.active) return false;
    const widget = node.getComponent(Widget);
    return widget === null || !widget.enabled;
  };
  private updateTuningMode(): void {
    const contents = this.node.children.filter(this.isContent);

    if (contents !== null && contents.length > 0) {
      let xmin = Number.MAX_VALUE;
      let ymin = Number.MAX_VALUE;
      let xmax = Number.MIN_VALUE;
      let ymax = Number.MIN_VALUE;

      const localPositions: Array<Vec3> = new Array(contents.length);
      contents.forEach((child, index) => {
        const rect = child.getComponent(UITransform).getBoundingBox();
        xmin = Math.min(xmin, rect.xMin);
        ymin = Math.min(ymin, rect.yMin);
        xmax = Math.max(xmax, rect.xMax);
        ymax = Math.max(ymax, rect.yMax);
        localPositions[index] = child.position;
      });
      this.paddingLeft = xmin + this.transform.anchorX * this.transform.width;
      this.paddingRight =
        (1 - this.transform.anchorX) * this.transform.width - xmax;
      this.paddingBottom =
        ymin + this.transform.anchorY * this.transform.height;
      this.paddingTop =
        (1 - this.transform.anchorY) * this.transform.height - ymax;
    } else {
      this.paddingLeft = this.paddingRight = this.transform.width;
      this.paddingTop = this.paddingBottom = this.transform.height;
    }
  }
  private updateResizeMode(): void {
    const contents = this.node.children.filter(this.isContent);

    if (contents !== null && contents.length > 0) {
      let xmin = Number.MAX_VALUE;
      let ymin = Number.MAX_VALUE;
      let xmax = Number.MIN_VALUE;
      let ymax = Number.MIN_VALUE;

      const localPositions = new Array(contents.length);
      contents.forEach((child, index) => {
        child
          .getComponent(ContainerForAllNotWidgetChildren)
          ?.updateSizeImmediately();
        child.getComponent(Layout)?.updateLayout(); // TODO: 如果有新的 layout 這邊也必須更新

        const rect = child.getComponent(UITransform).getBoundingBox();
        xmin = Math.min(xmin, rect.xMin);
        ymin = Math.min(ymin, rect.yMin);
        xmax = Math.max(xmax, rect.xMax);
        ymax = Math.max(ymax, rect.yMax);
        localPositions[index] = child.position;
      });
      xmin -= this.paddingLeft;
      xmax += this.paddingRight;
      ymin -= this.paddingBottom;
      ymax += this.paddingTop;
      const containerRect: Rect = rect(xmin, ymin, xmax - xmin, ymax - ymin);
      const pivot: Vec3 = v3(
        containerRect.xMin + containerRect.width * this.transform.anchorX,
        containerRect.yMin + containerRect.height * this.transform.anchorY,
        0
      );

      this.transform.setContentSize(containerRect.size);
      // 重建立子物件位置
      contents.forEach((child, index) => {
        const nextPos = localPositions[index].subtract(pivot);
        child.setPosition(nextPos);
      });
    } else {
      this.transform.setContentSize(
        this.paddingLeft + this.paddingRight,
        this.paddingTop + this.paddingBottom
      );
    }
  }
}
