/* eslint-disable no-case-declarations */
import {
  _decorator,
  Component,
  Enum,
  Node,
  CCFloat,
  Button,
  Tween,
  type EventTouch,
  UITransform,
  Vec3,
  v3,
} from 'cc';
const {ccclass, property, menu} = _decorator;

import {PlatformData} from '../Define/PlatformData';
import EventManager from '../Manager/EventManager';
import {tweenNodeEx} from '../Utility/TweenUtil';
import NodeEx from '../Utility/NodeEx';
export enum MagnetType {
  NONE = 0,
  HORIZONTAL = 1,
  VERTICAL = 2,
  NEARER = 3,
}

@ccclass('DragAndDrop')
@menu('CommonModule/UIComponent/DragAndDrop')
export default class DragAndDrop extends Component {
  @property({type: Enum(MagnetType)})
  private magnetType: MagnetType = MagnetType.NONE;
  @property(Node)
  private area: Node = null;
  @property({displayName: '橫版預設位置'})
  private defaultHorizontalPosition: Vec3 = v3();
  @property({displayName: '直版預設位置'})
  private defaultVerticalPosition: Vec3 = v3();
  @property({type: CCFloat, displayName: '四周保留距離'})
  private padding = 0;
  /** 是否可拖曳 */
  public isDraggable = false;
  /** 是否拖曳中 */
  private _isDragging = false;
  /** 觸碰起始位置 */
  private startLocation: Vec3 = null;
  /** 相對根節點的原點 */
  private originPos: Vec3 = null;
  /** 節點上的按鈕 */
  private button: Button = null;
  /** 吸附動態補間 */
  private magnetTween: Tween<NodeEx> = null;
  private minX = 0;
  private maxX = 0;
  private minY = 0;
  private maxY = 0;
  private get tf() {
    return this.node.getComponent(UITransform);
  }
  private get areaTf() {
    return this.area.getComponent(UITransform);
  }

  private get parentTf() {
    return this.node.parent.getComponent(UITransform);
  }

  protected onLoad(): void {
    this.init();
  }
  protected onDestroy(): void {
    this.release();
  }
  public init() {
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.resetRange,
      this
    );
    this.button = this.node.getComponent(Button);
    this.isDraggable = true;
    this.resetRange();
    const touchMove: Function = (evt: EventTouch) => {
      if (!this.isDraggable && !this._isDragging) return;
      const touchLoc = evt.getUILocation();
      const pos: Vec3 = new Vec3(touchLoc.x, touchLoc.y, 0);
      if (!this._isDragging && Vec3.distance(this.startLocation, pos) < 10)
        return;
      this._isDragging = this.isDraggable;
      if (this.button && this.button.enabled) this.button.enabled = false;
      this.node.setPosition(
        this.node.parent
          .getComponent(UITransform)
          .convertToNodeSpaceAR(new Vec3(pos.x, pos.y, 0))
      );
      this.setInRange();
    };
    this.node.on(
      Node.EventType.TOUCH_START,
      (evt: EventTouch) => {
        this._isDragging = false;
        //console.log("[DragAndDrop] TOUCH START!");
        const touchLoc = evt.getUILocation();
        const pos: Vec3 = new Vec3(touchLoc.x, touchLoc.y, 0);
        this.startLocation = pos;
        if (this.magnetTween) this.magnetTween.stop();
        this.calcRange();
        this.node.on(Node.EventType.TOUCH_MOVE, touchMove, this, true);
      },
      this,
      true
    );
    const touchEnd: Function = () => {
      this.node.off(Node.EventType.TOUCH_MOVE, touchMove, this, true);
      if (this.button) this.button.enabled = true;
      this.magnet();
      this._isDragging = false;
    };
    this.node.on(Node.EventType.TOUCH_END, touchEnd, this, true);
    this.node.on(Node.EventType.TOUCH_CANCEL, touchEnd, this, true);
  }
  public release() {
    this.startLocation = null;
    this.originPos = null;
    this.button = null;
    this.magnetTween = null;
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.resetRange,
      this
    );
  }
  public setMagnetType(type: MagnetType) {
    this.magnetType = type;
  }
  public setArea(rootNode: Node) {
    if (rootNode === this.node) {
      console.warn('[DragAndDrop] SetRoot same node ???');
      return;
    }
    this.area = rootNode;
    this.resetRange();
  }
  public setDefaultHorizontalPosition(position: Vec3) {
    this.defaultHorizontalPosition.set(position);
  }
  public setDefaultVerticalPosition(position: Vec3) {
    this.defaultVerticalPosition.set(position);
  }
  public setPadding(padding: number) {
    this.padding = padding;
    this.calcRange();
  }
  public resetRange() {
    if (!this.area) {
      console.warn('[DragAndDrop] Need root node !!!');
      return;
    }
    this.calcRange();
    this.moveToOrigin();
    this.setInRange();
    this.magnet();
  }
  public magnet() {
    this.calcRange();
    if (this.magnetTween) this.magnetTween.stop();

    const pos: Vec3 = this.node.getPosition();
    switch (this.magnetType) {
      case MagnetType.HORIZONTAL:
        this.magnetTween = tweenNodeEx(this.node)
          .to(0.1, {
            position: new Vec3(
              pos.x >= this.originPos.x ? this.maxX : this.minX,
              pos.y,
              pos.z
            ),
          })
          .start();
        break;
      case MagnetType.VERTICAL:
        this.magnetTween = tweenNodeEx(this.node)
          .to(0.1, {
            position: new Vec3(
              pos.x,
              pos.y >= this.originPos.y ? this.maxY : this.minY,
              pos.z
            ),
          })
          .start();
        break;
      case MagnetType.NEARER:
        let targetX: number = Math.min(Math.max(pos.x, this.minX), this.maxX);
        let targetY: number = Math.min(Math.max(pos.y, this.minY), this.maxY);

        const distanceX: number =
          targetX >= this.originPos.x
            ? Math.abs(targetX - this.maxX)
            : Math.abs(targetX - this.minX);
        const distanceY: number =
          targetY >= this.originPos.y
            ? Math.abs(targetY - this.maxY)
            : Math.abs(targetY - this.minY);

        if (distanceX < distanceY) {
          targetX = pos.x >= this.originPos.x ? this.maxX : this.minX;
        } else {
          targetY = pos.y >= this.originPos.y ? this.maxY : this.minY;
        }

        this.magnetTween = tweenNodeEx(this.node)
          .to(0.1, {position: new Vec3(targetX, targetY)})
          .start();
        break;
    }
  }
  public get isDragging(): boolean {
    return this._isDragging;
  }
  private moveToOrigin() {
    const rootLocPos: Vec3 =
      PlatformData.isLandscape === null || PlatformData.isLandscape
        ? this.defaultHorizontalPosition
        : this.defaultVerticalPosition;
    let initPos: Vec3 = Vec3.ZERO;
    initPos = this.areaTf.convertToWorldSpaceAR(
      new Vec3(rootLocPos.x, rootLocPos.y)
    );
    this.parentTf.convertToNodeSpaceAR(initPos, initPos);
    this.node.setPosition(initPos);
  }
  private setInRange() {
    const {x, y, z} = this.node.position;
    const newX = Math.max(this.minX, Math.min(x, this.maxX));
    const newY = Math.max(this.minY, Math.min(y, this.maxY));
    this.node.setPosition(new Vec3(newX, newY, z));
  }
  private calcRange() {
    if (this.node === null || this.area === null) return;
    this.originPos = new Vec3();
    this.originPos = this.areaTf.convertToWorldSpaceAR(Vec3.ZERO);
    this.originPos = this.parentTf.convertToNodeSpaceAR(this.originPos);
    this.minX =
      this.originPos.x -
      Math.max(
        0,
        this.areaTf.width * this.areaTf.anchorX -
          this.tf.width * this.tf.anchorX -
          this.padding
      );
    this.maxX =
      this.originPos.x +
      Math.max(
        0,
        this.areaTf.width * (1 - this.areaTf.anchorX) -
          this.tf.width * (1 - this.tf.anchorX) -
          this.padding
      );
    this.minY =
      this.originPos.y -
      Math.max(
        0,
        this.areaTf.height * this.areaTf.anchorY -
          this.tf.height * this.tf.anchorY -
          this.padding
      );
    this.maxY =
      this.originPos.y +
      Math.max(
        0,
        this.areaTf.height * (1 - this.areaTf.anchorY) -
          this.tf.height * (1 - this.tf.anchorY) -
          this.padding
      );
  }
}
