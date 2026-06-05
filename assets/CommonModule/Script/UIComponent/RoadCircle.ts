import {_decorator, CCFloat, Component, Vec2} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('RoadCircle')
export class RoadCircle extends Component {
  @property({type: CCFloat, displayName: '半徑'}) public radius = 10;
  @property({type: CCFloat, displayName: '起始角度'}) public angle = 0;
  @property({type: CCFloat, displayName: '速度'}) public speed = 1;

  private center: Vec2 = new Vec2(0, 0);

  protected onLoad(): void {
    this.center.x = this.node.position.x;
    this.center.y = this.node.position.y;
  }
  update(dt: number) {
    this.angle += dt * this.speed; // 每幀增加角度（可以乘以速度係數）
    const x = this.center.x + this.radius * Math.cos(this.angle);
    const y = this.center.y + this.radius * Math.sin(this.angle);
    this.node.setPosition(x, y);
  }
}
