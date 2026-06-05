import {_decorator, Component} from 'cc';
const {ccclass, menu} = _decorator;

//TODO: 修復組件功能

/**
 * 自定義形狀點擊測試組件
 * 覆寫同節點按鈕元件的HitTest功能
 * 以同節點的碰撞體做為點擊區域判定
 */
@ccclass('ShapeHitTest')
@menu('0_Common/Game/Component/ShapeHitTest')
export default class ShapeHitTest extends Component {
  // /** 按鈕 */
  // private button: Button = null;
  // /** 視為點擊區域的碰撞體 */
  // private shape: CircleCollider2D | BoxCollider2D | PolygonCollider2D = null;

  onLoad() {
    console.warn('[ShapeHitTest] Need to fix component function TODO');

    // this.button = this.getComponent(Button);
    // if (this.button == null) {
    //   console.warn('[ShapeHitTest] button: null, node:', this.node.name);
    //   return;
    // }
    // //取得碰撞體
    // this.shape =
    //   this.node.getComponent(CircleCollider2D) ??
    //   this.node.getComponent(BoxCollider2D) ??
    //   this.node.getComponent(PolygonCollider2D);
    //
    // this.node['_oldHitTest'] = this.node['_hitTest'].bind(this.node);
    // this.node['_hitTest'] = this.OverrideHitTest.bind(this);
  }

  onDestroy() {
    // this.shape = null;
    // delete this.node['_oldHitTest'];
    // this.button = null;
  }

  // private OverrideHitTest(point: Vec3, listener): boolean {
  //   if (this.button == null) return;
  //   if (this.node['_oldHitTest'] == null) return;
  //   if (!this.button.interactable) return;

  //   if (this.shape instanceof CircleCollider2D) {
  //     point = this.node.getComponent(UITransform).convertToNodeSpaceAR(point);

  //     return Intersection.circleCircle(
  //       {position: point, radius: 1},
  //       {
  //         position: this.shape.offset,
  //         radius: this.shape.radius,
  //       }
  //     );
  //   } else if (this.shape instanceof BoxCollider2D) {
  //     point = this.node.getComponent(UITransform).convertToNodeSpaceAR(point);

  //     return Intersection.rectRect(
  //       rect(point.x, point.y, 1, 1),
  //       rect(
  //         -this.shape.size.width * 0.5 + this.shape.offset.x,
  //         -this.shape.size.height * 0.5 + this.shape.offset.y,
  //         this.shape.size.width,
  //         this.shape.size.height
  //       )
  //     );
  //   } else if (this.shape instanceof PolygonCollider2D) {
  //     point = this.node.getComponent(UITransform).convertToNodeSpaceAR(point);

  //     return Intersection.pointInPolygon(
  //       point,
  //       this.shape.points.map((value: Vec2) => {
  //         return value.add(this.shape.offset);
  //       })
  //     );
  //   } else {
  //     return this.node['_oldHitTest'](point, listener);
  //   }
  // }
}
