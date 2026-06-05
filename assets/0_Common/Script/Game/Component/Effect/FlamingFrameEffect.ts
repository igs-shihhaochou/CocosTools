import {
  _decorator,
  Component,
  Texture2D,
  Color,
  CCFloat,
  Sprite,
  Material,
} from 'cc';
import {EDITOR} from 'cc/env';
const {ccclass, property, playOnFocus, executeInEditMode, menu} = _decorator;

@ccclass('FlamingFrameEffect')
@playOnFocus
@executeInEditMode
@menu('0_Common/Game/Component/FlamingFrameEffect')
export default class FlamingFrameEffect extends Component {
  @property({type: Texture2D, tooltip: '噪聲圖'})
  protected noiseTexInternal: Texture2D | null = null;
  public set noiseTex(val: Texture2D) {
    this.noiseTexInternal = val;
    this.init();
  }
  public get noiseTex(): Texture2D | null {
    return this.noiseTexInternal;
  }
  @property({tooltip: '設定主要基底色'})
  protected mainColorInternal: Color = new Color(218, 62, 27, 255);
  public set MainColor(val: Color) {
    this.mainColorInternal = val;
    this.init();
  }
  public get mainColor() {
    return this.mainColorInternal;
  }
  @property({tooltip: '設定高光混色1 (會因基底色產生偏移)'})
  protected subColor1Internal: Color = new Color(255, 133, 0, 255);
  public set subColor1(val: Color) {
    this.subColor1Internal = val;
    this.init();
  }
  public get subColor1() {
    return this.subColor1Internal;
  }
  @property({tooltip: '設定高光混色2 (會因基底色產生偏移)'})
  protected subColor2Internal: Color = new Color(255, 255, 255, 255);
  public set SubColor2(val: Color) {
    this.subColor2Internal = val;
    this.init();
  }
  public get subColor2() {
    return this.subColor2Internal;
  }
  @property({type: CCFloat, tooltip: '火焰擺動速度，正往內，負往外'})
  protected speedInternal = 0.9;
  public get speed() {
    return this.speedInternal;
  }
  public set speed(value: number) {
    this.speedInternal = value;
    this.init();
  }
  @property({type: CCFloat, tooltip: '上下火焰邊框厚度'})
  protected upAndDownInternal = 0.18;
  public get upAndDown() {
    return this.upAndDownInternal;
  }
  public set upAndDown(value: number) {
    this.upAndDownInternal = value;
    this.init();
  }
  @property({type: CCFloat, tooltip: '左右火焰邊框厚度'})
  protected leftAndRightInternal = 0.1;
  public get leftAndRight() {
    return this.leftAndRightInternal;
  }
  public set leftAndRight(value: number) {
    this.leftAndRightInternal = value;
    this.init();
  }
  private _sprite: Sprite | null = null;
  private _material: Material | null | undefined = null;
  onLoad() {
    this.init();
  }
  onEnable() {
    //編輯模式下方便重新確認效果
    if (EDITOR) this.init();
  }
  onDestroy() {
    this.release();
  }
  private init() {
    this._sprite = this.node.getComponent(Sprite);
    this._material = this._sprite?.getSharedMaterial(0);
    if (this._material && this._material?.name.search('flame') !== -1) {
      if (this.noiseTexInternal)
        this._material.setProperty('noiseTex', this.noiseTexInternal);
      this._material.setProperty('speed', this.speedInternal);
      this._material.setProperty('up_and_down', this.upAndDownInternal);
      this._material.setProperty('left_and_right', this.leftAndRightInternal);
      this._material.setProperty('u_brightness', this.mainColorInternal);
      this._material.setProperty('u_middle', this.subColor1Internal);
      this._material.setProperty('u_dark', this.subColor2Internal);
    } else {
      console.error('Wrong material. Please set a material named "flame" !');
    }
  }
  private release() {
    this._sprite = null;
    this._material = null;
  }
}
