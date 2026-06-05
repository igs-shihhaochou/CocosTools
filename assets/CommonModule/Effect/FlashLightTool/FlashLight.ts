/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import {
  _decorator,
  Color,
  Vec2,
  v2,
  Component,
  Sprite,
  Material,
  CCFloat,
} from 'cc';

const {ccclass, property} = _decorator;

@ccclass('FlashLightUBO')
export class FlashLightUBO {
  /**
   * 中心点颜色
   */
  @property({displayName: '光的顏色'})
  lightColor: Color = new Color(255, 255, 255, 150);

  /**
   * 中心点坐标 ([0.0, 1.0], [0.0, 1.0])
   */
  lightCenterPoint: Vec2 = v2(0, 0.5);

  /**
   * 光束角度 [0.0, 180.0]
   */
  @property({type: CCFloat, displayName: '光的角度'})
  lightAngle = 90;

  /**
   * 光束宽度 [0.0, +∞]
   */
  @property({type: CCFloat, displayName: '光的寬度'})
  lightWidth = 0.1;

  /**
   * 是否启用光束渐变
   */
  enableGradient = true;

  /**
   * 是否裁剪掉透明区域上的点光
   */
  cropAlpha = true;

  /**
   * 是否开启战争迷雾效果
   */
  enableFog = false;
}

@ccclass
export default class FlashLight extends Component {
  @property({type: FlashLightUBO, displayName: 'Setting'})
  private flashLightUBO: FlashLightUBO = new FlashLightUBO();

  @property({type: CCFloat, displayName: '刷光時間'})
  private flashTime = 2.5;

  @property({type: CCFloat, displayName: '刷光間隔時間'})
  private flashInterval = 0;

  private _timer = 0;
  private _sprite: Sprite = null;
  private _material: Material = null;
  private _transparent: Color = new Color(0, 0, 0, 0);

  public onLoad(): void {
    this._sprite = this.getComponent(Sprite);
    this._material = this._sprite.getSharedMaterial(0);
  }

  public update(dt): void {
    this._timer += dt;
    if (this._timer > this.flashTime + this.flashInterval) {
      this._timer = -this.flashLightUBO.lightWidth;
      return;
    } else if (this._timer > this.flashTime) {
      this.flashLightUBO.lightCenterPoint.x = 1 + this.flashLightUBO.lightWidth;
    } else {
      this.flashLightUBO.lightCenterPoint.x =
        (this._timer / this.flashTime) *
          (1 + 2 * this.flashLightUBO.lightWidth) -
        this.flashLightUBO.lightWidth;
    }
    this._updateMaterial();
  }

  private _updateMaterial() {
    // const frame = this._sprite.spriteFrame as any;
    // let l = 0,
    //   r = 0,
    //   b = 1,
    //   t = 1;
    // l = frame.uv[0];
    // t = frame.uv[5];
    // r = frame.uv[6];
    // b = frame.uv[3];
    // const u_UVoffset = new Vec4(l, t, r, b);
    // const u_rotated = frame.isRotated() ? 1.0 : 0.0;
    // this._material.setProperty('u_UVoffset', u_UVoffset);
    // this._material.setProperty('u_rotated', u_rotated);
    this._material.setProperty(
      'lightColor',
      this._timer > this.flashTime
        ? this._transparent
        : this.flashLightUBO.lightColor
    );
    this._material.setProperty(
      'lightCenterPoint',
      this.flashLightUBO.lightCenterPoint
    );
    this._material.setProperty('lightAngle', this.flashLightUBO.lightAngle);
    this._material.setProperty('lightWidth', this.flashLightUBO.lightWidth);
    // this._material.setProperty(
    //   'enableGradient',
    //   this.flashLightUBO.enableGradient
    // );
    // this._material.setProperty('cropAlpha', this.flashLightUBO.cropAlpha);
    // this._material.setProperty('enableFog', this.flashLightUBO.enableFog);
    this._sprite.setSharedMaterial(this._material, 0);
  }
}
