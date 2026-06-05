import {
  Color,
  Node,
  Component,
  UITransform,
  UIOpacity,
  Vec3,
  Sprite,
  sp,
  Label,
  tween,
  Tween,
  _decorator,
} from 'cc';
import {EDITOR} from 'cc/env';

const {ccclass} = _decorator;

const nodeExCache = new WeakMap<Node, NodeEx>();

/**
 * NodeEx是Node的擴展類別，提供了一些常用的屬性和方法
 * @description 同時取得Node的UITransform和UIOpacity組件，請斟酌使用
 * @description 使用時請盡量暫存NodeEx物件，若使用nodeEx(node)，則會查找cache
 * @description 自動加入NodeExDestroyListener組件，當Node被銷毀時，會自動釋放NodeEx的引用
 */
export default class NodeEx {
  private _node: Node;
  private _trans: UITransform;
  private _opacity: UIOpacity;
  /** 快取可設定 color 的元件 */
  private _colorComp: Sprite | sp.Skeleton | Label;
  /** 如果取不到color組件，會記錄在裡 */
  private _color: Color;

  constructor(node: Node) {
    this._node = node;

    this._trans = node.getComponent(UITransform);
    this._opacity = node.getComponent(UIOpacity);
    this._colorComp = this.getColorComponent();
    this._color = Color.WHITE.clone();

    if (!this._node.getComponent(NodeExDestroyListener) && !EDITOR)
      this._node.addComponent(NodeExDestroyListener);
  }

  public destroy() {
    nodeExCache.delete(this._node);
    Tween.stopAllByTarget(this);

    this._node = null;
    this._trans = null;
    this._opacity = null;
    this._colorComp = null;
  }

  public tweenColor(duration: number, targetColor: Color) {
    // tween color directly will cause flashing
    const ori = this.color.clone();
    tween(ori)
      .to(
        duration,
        {
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b,
        },
        {
          onUpdate: () => {
            this.color = ori;
          },
        }
      )
      .start();
  }

  get x(): number {
    return this._node.position.x;
  }
  set x(value: number) {
    this._node.setPosition(
      new Vec3(value, this._node.position.y, this._node.position.z)
    );
  }

  get y(): number {
    return this._node.position.y;
  }
  set y(value: number) {
    this._node.setPosition(
      new Vec3(this._node.position.x, value, this._node.position.z)
    );
  }

  get z(): number {
    return this._node.position.z;
  }
  set z(value: number) {
    this._node.setPosition(
      new Vec3(this._node.position.x, this._node.position.y, value)
    );
  }

  get opacity(): number {
    return this._opacity?.opacity;
  }
  set opacity(value: number) {
    this._opacity.opacity = value;
  }

  get width(): number {
    return this._trans.width;
  }
  set width(value: number) {
    this._trans.width = value;
  }

  get height(): number {
    return this._trans.height;
  }
  set height(value: number) {
    this._trans.height = value;
  }

  get color(): Color {
    const comp = this.getColorComponent();
    return comp ? comp.color : this._color;
  }
  set color(value: Color) {
    const comp = this.getColorComponent();
    if (comp) comp.color = value;
    else this._color = value;
  }

  private getColorComponent() {
    if (this._colorComp) return this._colorComp;

    this._colorComp =
      this._node.getComponent(Sprite) ??
      this._node.getComponent(sp.Skeleton) ??
      this._node.getComponent(Label) ??
      null;

    return this._colorComp;
  }

  get scale(): number {
    return this._node.getScale().x;
  }
  set scale(value: number) {
    try {
      this._node.setScale(value, value, value);
    } catch (e) {
      console.error(e, this._node);
    }
  }

  get scaleX(): number {
    return this._node.scale.x;
  }
  set scaleX(value) {
    this._node.setScale(value, this._node.scale.y, this._node.scale.z);
  }

  get scaleY(): number {
    return this._node.scale.y;
  }
  set scaleY(value) {
    this._node.setScale(this._node.scale.x, value, this._node.scale.z);
  }

  get scaleZ(): number {
    return this._node.scale.z;
  }
  set scaleZ(value) {
    this._node.setScale(this._node.scale.x, this._node.scale.y, value);
  }

  get position(): Vec3 {
    return this._node.getPosition();
  }
  set position(value: Vec3) {
    this._node.setPosition(value);
  }

  get angle(): number {
    return this._node.angle;
  }
  set angle(value: number) {
    this._node.angle = value;
  }

  get anchorX(): number {
    return this._trans.anchorX;
  }
  set anchorX(value: number) {
    this._trans.anchorX = value;
  }

  get anchorY(): number {
    return this._trans.anchorY;
  }
  set anchorY(value: number) {
    this._trans.anchorY = value;
  }
}

@ccclass
class NodeExDestroyListener extends Component {
  onDestroy() {
    const nodeEx = nodeExCache.get(this.node);
    if (nodeEx) nodeEx.destroy();
  }
}

/**
 * 建立 tween 並自動解除 Node 狀態綁定（若 API 存在）。
 * 3.8.6 沒有 bindNodeState 不會報錯，3.8.7+ 會正確解除綁定。
 */
export const safeTween = <T extends object>(target: T): Tween<T> => {
  const t = tween(target);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (t as any).bindNodeState === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t as any).bindNodeState(false);
  }
  return t;
};

export const nodeEx = (node: Node): NodeEx => {
  let nodeEx = nodeExCache.get(node);
  if (!nodeEx) {
    // console.warn('NodeEx not found', node.name);
    nodeEx = new NodeEx(node);
    nodeExCache.set(node, nodeEx);
  }

  return nodeEx;
};
