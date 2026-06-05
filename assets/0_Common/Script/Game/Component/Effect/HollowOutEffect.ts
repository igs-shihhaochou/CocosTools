import {
  _decorator,
  Component,
  EffectAsset,
  Enum,
  Material,
  Rect,
  Sprite,
  tween,
  Tween,
  UITransform,
  v2,
  Vec2,
  Vec4,
} from 'cc';
import {DEV} from 'cc/env';

const {
  ccclass,
  property,
  requireComponent,
  executeInEditMode,
  disallowMultiple,
  executionOrder,
} = _decorator;

/** 镂空形状 */
export enum HollowOutShape {
  /** 矩形 */
  Rect = 1,
  /** 圆形 */
  Circle,
}

/**
 * [Shader] 挖孔组件，该组件需要对应的 Effect 才能正常使用！
 * @author 陈皮皮 (ifaswind)
 * @version 20210429
 * @see HollowOut.ts https://gitee.com/ifaswind/eazax-ccc/blob/master/components/effects/HollowOut.ts
 * @see eazax-hollowout.effect https://gitee.com/ifaswind/eazax-ccc/blob/master/resources/effects/eazax-hollowout.effect
 */
@ccclass
@requireComponent(Sprite)
@executeInEditMode
@disallowMultiple
@executionOrder(-10)
export default class HollowOut extends Component {
  @property
  protected _effect: EffectAsset = null;
  @property({
    type: EffectAsset,
    tooltip: DEV && 'Effect 资源',
    readonly: true,
  })
  public get effect() {
    return this._effect;
  }
  public set effect(value: EffectAsset) {
    this._effect = value;
    this.init();
  }

  @property
  protected _shape: HollowOutShape = HollowOutShape.Rect;
  @property({type: Enum(HollowOutShape), tooltip: DEV && '镂空形状'})
  public get shape() {
    return this._shape;
  }
  public set shape(value: HollowOutShape) {
    this._shape = value;
    this.updateProperties();
  }

  @property
  protected _center: Vec2 = v2();
  @property({tooltip: DEV && '中心坐标'})
  public get center() {
    return this._center;
  }
  public set center(value: Vec2) {
    this._center = value;
    this.updateProperties();
  }

  @property
  protected _width = 300;
  @property({
    tooltip: DEV && '宽',
    visible: function (this: HollowOut) {
      return this._shape === HollowOutShape.Rect;
    },
  })
  public get width() {
    return this._width;
  }
  public set width(value: number) {
    this._width = value;
    this.updateProperties();
  }

  @property
  protected _height = 300;
  @property({
    tooltip: DEV && '高',
    visible: function (this: HollowOut) {
      return this._shape === HollowOutShape.Rect;
    },
  })
  public get height() {
    return this._height;
  }
  public set height(value: number) {
    this._height = value;
    this.updateProperties();
  }

  @property
  protected _round = 1;
  @property({
    tooltip: DEV && '圆角半径',
    visible: function (this: HollowOut) {
      return this._shape === HollowOutShape.Rect;
    },
  })
  public get round() {
    return this._round;
  }
  public set round(value: number) {
    this._round = value;
    this.updateProperties();
  }

  @property
  protected _radius = 200;
  @property({
    tooltip: DEV && '半径',
    visible: function (this: HollowOut) {
      return this._shape === HollowOutShape.Circle;
    },
  })
  public get radius() {
    return this._radius;
  }
  public set radius(value: number) {
    this._radius = value;
    this.updateProperties();
  }

  @property
  protected _feather = 0.5;
  @property({
    tooltip: DEV && '边缘虚化宽度',
    visible: function (this: HollowOut) {
      return this._shape === HollowOutShape.Circle || this.round > 0;
    },
  })
  public get feather() {
    return this._feather;
  }
  public set feather(value: number) {
    this._feather = value;
    this.updateProperties();
  }

  private isReady = false;

  protected sprite: Sprite = null;

  protected material: Material[] = [];

  private savedSpriteRec: Rect = null;

  protected tweenRes: () => void = null;

  protected onLoad() {
    this.init();
  }

  public resetInEditor() {
    this.init();
  }

  /**
   * 初始化组件
   */
  protected async init() {
    if (!this._effect) return;

    this.isReady = false;

    this.sprite = this.node.getComponent(Sprite);
    // 生成并应用材质
    const mat = new Material();
    mat.initialize({effectAsset: this._effect});
    this.material = [mat];
    this.sprite.sharedMaterials = this.material;
    this.AdjustUVData();
    // 更新材质属性
    this.updateProperties();

    this.isReady = true;
  }

  update(dt: number) {
    this.Update(dt);
  }

  private Update(_dt: number) {
    //若無spriteFrame則略過
    if (this.sprite?.spriteFrame == null) return;

    if (this.isReady) {
      //因為自動合圖需要一段時間，圖集才會定下來，因此在這邊讓他調整，但似乎判斷會有問題，變成一直跑進去= =
      const Rec = this.sprite.spriteFrame?.rect;
      if (!!Rec && Rec !== this.savedSpriteRec) {
        this.AdjustUVData();
      }
    }
  }

  /**
   * 更新材质属性
   */
  protected updateProperties() {
    switch (this._shape) {
      case HollowOutShape.Rect:
        this.rect(
          this._center,
          this._width,
          this._height,
          this._round,
          this._feather
        );
        break;
      case HollowOutShape.Circle:
        this.circle(this._center, this._radius, this._feather);
        break;
    }
  }

  /**
   * 矩形镂空
   * @param center 中心坐标
   * @param width 宽
   * @param height 高
   * @param round 圆角半径
   * @param feather 边缘虚化宽度
   */
  public rect(
    center?: Vec2,
    width?: number,
    height?: number,
    round?: number,
    feather?: number
  ) {
    // 保存类型
    this._shape = HollowOutShape.Rect;
    // 确认参数
    if (center != null) {
      this._center = center;
    }
    if (width != null) {
      this._width = width;
    }
    if (height != null) {
      this._height = height;
    }
    if (round != null) {
      this._round = round >= 0 ? round : 0;
      const min = Math.min(this._width / 2, this._height / 2);
      this._round = this._round <= min ? this._round : min;
    }
    if (feather != null) {
      this._feather = feather >= 0 ? feather : 0;
      this._feather =
        this._feather <= this._round ? this._feather : this._round;
    }
    // 更新材质
    //const material = this.material;
    this.material[0].setProperty('size', this.getNodeSize());
    this.material[0].setProperty('center', this.getCenter(this._center));
    this.material[0].setProperty('width', this.getWidth(this._width));
    this.material[0].setProperty('height', this.getHeight(this._height));
    this.material[0].setProperty('round', this.getRound(this._round));
    this.material[0].setProperty('feather', this.getFeather(this._feather));
    this.sprite.sharedMaterials = this.material;
  }

  /**
   * 圆形镂空
   * @param center 中心坐标
   * @param radius 半径
   * @param feather 边缘虚化宽度
   */
  public circle(center?: Vec2, radius?: number, feather?: number) {
    // 保存类型
    this._shape = HollowOutShape.Circle;
    // 确认参数
    if (center != null) {
      this._center = center;
    }
    if (radius != null) {
      this._radius = radius;
    }
    if (feather != null) {
      this._feather = feather >= 0 ? feather : 0;
    }
    // 更新材质
    //const material = this.material;
    this.material[0].setProperty('size', this.getNodeSize());
    this.material[0].setProperty('center', this.getCenter(this._center));
    this.material[0].setProperty('width', this.getWidth(this._radius * 2));
    this.material[0].setProperty('height', this.getHeight(this._radius * 2));
    this.material[0].setProperty('round', this.getRound(this._radius));
    this.material[0].setProperty('feather', this.getFeather(this._feather));
    this.sprite.sharedMaterials = this.material;
  }

  /**
   * 缓动镂空（矩形）
   * @param time 时间
   * @param center 中心坐标
   * @param width 宽
   * @param height 高
   * @param round 圆角半径
   * @param feather 边缘虚化宽度
   */
  public rectTo(
    time: number,
    center: Vec2,
    width: number,
    height: number,
    round = 0,
    feather = 0
  ): Promise<void> {
    return new Promise(res => {
      // 保存类型
      this._shape = HollowOutShape.Rect;
      // 停止进行中的缓动
      Tween.stopAllByTarget(this);
      this.unscheduleAllCallbacks();
      // 完成上一个期约
      if (this.tweenRes) {
        this.tweenRes();
      }
      this.tweenRes = res;
      // 确认参数
      round = Math.min(round, width / 2, height / 2);
      feather = Math.min(feather, round);
      // 缓动
      tween<HollowOut>(this)
        .to(time, {
          center: center,
          width: width,
          height: height,
          round: round,
          feather: feather,
        })
        .call(() => {
          this.scheduleOnce(() => {
            if (this.tweenRes) {
              this.tweenRes();
              this.tweenRes = null;
            }
          });
        })
        .start();
    });
  }

  /**
   * 缓动镂空（圆形）
   * @param time 时间
   * @param center 中心坐标
   * @param radius 半径
   * @param feather 边缘虚化宽度
   */
  public circleTo(
    time: number,
    center: Vec2,
    radius: number,
    feather = 0
  ): Promise<void> {
    return new Promise(res => {
      // 保存类型
      this._shape = HollowOutShape.Circle;
      // 停止进行中的缓动
      Tween.stopAllByTarget(this);
      this.unscheduleAllCallbacks();
      // 完成上一个期约
      if (this.tweenRes) {
        this.tweenRes();
      }
      this.tweenRes = res;
      // 缓动
      tween<HollowOut>(this)
        .to(time, {
          center: center,
          radius: radius,
          feather: feather,
        })
        .call(() => {
          this.scheduleOnce(() => {
            if (this.tweenRes) {
              this.tweenRes();
              this.tweenRes = null;
            }
          });
        })
        .start();
    });
  }

  /**
   * 取消所有挖孔
   */
  public reset() {
    this.rect(v2(), 0, 0, 0, 0);
  }

  /**
   * 挖孔设为节点大小（就整个都挖没了）
   */
  public setNodeSize() {
    const node = this.node,
      width = node.getComponent(UITransform).width,
      height = node.getComponent(UITransform).height;
    this._radius = Math.sqrt(width ** 2 + height ** 2) / 2;
    const position = node.getPosition();
    this.rect(v2(position.x, position.y), width, height, 0, 0);
  }

  /**
   * 获取中心点
   * @param center
   */
  protected getCenter(center: Vec2) {
    const node = this.node,
      width = node.getComponent(UITransform).width,
      height = node.getComponent(UITransform).height;
    const x = (center.x + width / 2) / width,
      y = (-center.y + height / 2) / height;
    return v2(x, y);
  }

  /**
   * 获取节点尺寸
   */
  protected getNodeSize() {
    return v2(
      this.node.getComponent(UITransform).width,
      this.node.getComponent(UITransform).height
    );
  }

  /**
   * 获取挖孔宽度
   * @param width
   */
  protected getWidth(width: number) {
    return width / this.node.getComponent(UITransform).width;
  }

  /**
   * 获取挖孔高度
   * @param height
   */
  protected getHeight(height: number) {
    return height / this.node.getComponent(UITransform).width;
  }

  /**
   * 获取圆角半径
   * @param round
   */
  protected getRound(round: number) {
    return round / this.node.getComponent(UITransform).width;
  }

  /**
   * 获取边缘虚化宽度
   * @param feather
   */
  protected getFeather(feather: number) {
    return feather / this.node.getComponent(UITransform).width;
  }

  private AdjustUVData(): void {
    const tmpSpriteFrame = this.sprite.spriteFrame;
    if (tmpSpriteFrame == null) return;

    const tmpSpriteRec = tmpSpriteFrame.getRect();
    const tmpTexture = tmpSpriteFrame.texture;
    const isRotate = tmpSpriteFrame.isRotated();

    this.savedSpriteRec = tmpSpriteRec;

    //xMin跟yMin就是sprite在texture中的xy座標，未旋轉時是sprite的左上角xy，有旋轉的則是sprite的左下角xy
    //xMax就是sprite未旋轉前的W + 在texture中sprite的x座標，所以未旋轉時這個值代表右上角x座標，有旋轉的則只代表跟xMin相減後就是sprite的原寬(W)
    //yMax就是sprite未旋轉前的H + 在texture中sprite的y座標，所以未旋轉時這個值代表右下角y座標，有旋轉的則只代表跟yMin相減後就是sprite的原高(H)
    const recX = tmpSpriteRec.xMin;
    const recW = tmpSpriteRec.xMax - tmpSpriteRec.xMin;
    const recY = tmpSpriteRec.yMin;
    const recH = tmpSpriteRec.yMax - tmpSpriteRec.yMin;

    //texture由傳進shader的isRotate判斷是否要旋轉，這邊先準備調整過旋轉的起終點資訊給shader裡的光走
    if (isRotate === true) {
      //這邊要把sprite在大圖裡的座標轉換到0~1的範圍內表示
      const l = tmpTexture.width === 0 ? recX : recX / tmpTexture.width;
      const r =
        tmpTexture.width === 0 ? recX + recH : (recX + recH) / tmpTexture.width; //這邊是加H
      const b =
        tmpTexture.height === 0
          ? recY + recW
          : (recY + recW) / tmpTexture.height;
      const t = tmpTexture.height === 0 ? recY : recY / tmpTexture.height;

      this.material[0].setProperty('u_uvOffset', new Vec4(l, t, r, b));
      this.material[0].setProperty('u_uvRotated', 1.0); //shader不支援true false
    } else {
      //這邊要把sprite在大圖裡的座標轉換到0~1的範圍內表示
      const l = tmpTexture.width === 0 ? recX : recX / tmpTexture.width;
      const r =
        tmpTexture.width === 0 ? recX + recW : (recX + recW) / tmpTexture.width; //這邊是加W
      const b =
        tmpTexture.height === 0
          ? recY + recH
          : (recY + recH) / tmpTexture.height;
      const t = tmpTexture.height === 0 ? recY : recY / tmpTexture.height;

      this.material[0].setProperty('u_uvOffset', new Vec4(l, t, r, b));
      this.material[0].setProperty('u_uvRotated', 0.0); //shader不支援true false
    }

    //如果有做九宮格拉伸
    if (this.node.getComponent(Sprite).type === Sprite.Type.SLICED) {
      const sl = tmpSpriteFrame.insetLeft / recW;
      const sr = 1 - tmpSpriteFrame.insetRight / recW;
      const sb = 1 - tmpSpriteFrame.insetBottom / recH;
      const st = tmpSpriteFrame.insetTop / recH;

      this.material[0].setProperty('u_uvSliced', 1.0); //shader不支援true false
      this.material[0].setProperty('u_uvsOffset', new Vec4(sl, sr, st, sb));
      this.material[0].setProperty(
        'u_ur',
        new Vec4(
          0,
          tmpSpriteFrame.insetLeft,
          this.node.getComponent(UITransform).width - tmpSpriteFrame.insetRight,
          this.node.getComponent(UITransform).width
        )
      );
      this.material[0].setProperty(
        'u_vr',
        new Vec4(
          0,
          tmpSpriteFrame.insetTop,
          this.node.getComponent(UITransform).height -
            tmpSpriteFrame.insetBottom,
          this.node.getComponent(UITransform).height
        )
      );
    } else {
      this.material[0].setProperty('u_uvSliced', 0.0); //shader不支援true false
    }
  }
}
