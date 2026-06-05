import {
  _decorator,
  Component,
  CCBoolean,
  CCFloat,
  Collider2D,
  tween,
  Tween,
  Vec3,
  UITransform,
  BoxCollider2D,
  CircleCollider2D,
} from 'cc';
import {EDITOR} from 'cc/env';
const {ccclass, property, playOnFocus, executeInEditMode, menu} = _decorator;

@ccclass('PositionJumper')
@playOnFocus
@executeInEditMode
@menu('CommonModule/UIComponent/PositionJumper')
export default class PositionJumper extends Component {
  @property(CCBoolean)
  private set preview(bool: boolean) {
    this._preview = bool;
    if (bool) {
      this.init();
    } else {
      this.release();
    }
  }
  private get preview(): boolean {
    return this._preview;
  }
  private _preview = false;
  @property({type: CCFloat, tooltip: '跳躍時間間隔 (秒)'})
  private jumpInterval = 1;
  @property({type: [Collider2D], tooltip: '跳躍範圍(尚未支援節點縮放與旋轉)'})
  private jumpArea: Collider2D[] = [];
  onLoad() {
    this.init();
  }
  onDestroy() {
    this.release();
  }
  /**
   * 初始化PositionJumper
   */
  public init() {
    //編輯模式且非預覽模式則略過
    if (EDITOR && !this.preview) return;
    //最低預設時間
    if (this.jumpInterval < 0.001) this.jumpInterval = 0.001;
    //停止補間
    Tween.stopAllByTarget(this.node);
    //跳躍補間
    tween(this.node)
      .delay(this.jumpInterval)
      .call(() => {
        //初始隨機座標
        const {x, y, z} = this.node.position;
        const randomPos: Vec3 = new Vec3(x, y, z);
        //指定隨機範圍
        const randomArea: Collider2D =
          this.jumpArea[Math.floor(this.jumpArea.length * Math.random())];
        if (randomArea) {
          //隨機範圍座標轉換至跳躍節點所在的座標系
          randomArea.node
            .getComponent(UITransform)
            .convertToWorldSpaceAR(Vec3.ZERO, randomPos);
          this.node.parent
            .getComponent(UITransform)
            .convertToNodeSpaceAR(randomPos, randomPos);
          this.node.angle = randomArea.node.angle;
          //判斷碰撞體類型
          if (randomArea instanceof BoxCollider2D) {
            //隨機座標 (偏移、長寬)
            const rndX: number =
              randomArea.offset.x -
              randomArea.size.x * 0.5 +
              randomArea.size.x * Math.random();
            const rndY: number =
              randomArea.offset.y -
              randomArea.size.y * 0.5 +
              randomArea.size.y * Math.random();
            const radius: number = (randomArea.node.angle * Math.PI) / 180;
            randomPos.x =
              randomPos.x + Math.cos(radius) * rndX - Math.sin(radius) * rndY;
            randomPos.y =
              randomPos.y + Math.sin(radius) * rndX + Math.cos(radius) * rndY;
          } else if (randomArea instanceof CircleCollider2D) {
            //隨機座標 (偏移、半徑)
            const angle: number = 2 * Math.PI * Math.random();
            const distance: number =
              Math.sqrt(Math.random()) * randomArea.radius;
            randomPos.x =
              randomPos.x + randomArea.offset.x + Math.cos(angle) * distance;
            randomPos.y =
              randomPos.y + randomArea.offset.y + Math.sin(angle) * distance;
          }
        }
        //設定跳躍座標
        this.node.setPosition(randomPos);
      })
      .union()
      .repeatForever()
      .start();
  }
  /**
   * 釋放PositionJumperƒ¸
   */
  public release() {
    Tween.stopAllByTarget(this.node);
  }
}
