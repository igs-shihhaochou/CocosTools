import {_decorator, Component, CCFloat, Sprite, Material} from 'cc';
const {ccclass, property, playOnFocus, executeInEditMode, menu} = _decorator;

@ccclass('UIHueShiftSetterEffect')
@playOnFocus
@executeInEditMode
@menu('0_Common/Game/Component/UIHueShiftSetterEffect')
export default class UIHueShiftSetterEffect extends Component {
  @property
  _hue: Number = 0;
  @property({
    type: CCFloat,
    tooltip: '設定色相要偏移的多寡,如調整沒反應請注意Material是否正確',
    min: 0,
    max: 359,
    slide: true,
  })
  set Hue(val: Number) {
    // this._hue = val;
    // this.Init();
  }
  get Hue() {
    // return this._hue;
  }
  @property
  _saturation: Number = 0;
  @property({
    type: CCFloat,
    tooltip: '設定飽和度,如調整沒反應請注意Material是否正確',
    min: 0,
    max: 3,
    slide: true,
  })
  set Saturation(val: Number) {
    // this._saturation = val;
    // this.Init();
  }
  get Saturation() {
    // return this._saturation;
  }
  @property
  _value: Number = 0;
  @property({
    type: CCFloat,
    tooltip: '設定色調,如調整沒反應請注意Material是否正確',
    min: 0,
    max: 3,
    slide: true,
  })
  set Value(val: Number) {
    // this._value = val;
    // this.Init();
  }
  get Value() {
    // return this._value;
  }
  private _sprite: Sprite | null = null;
  private _material: Material | null = null;
  onLoad() {
    // this.Init();
  }
  onEnable() {
    //        //編輯模式下方便重新確認效果
    // if (CC_EDITOR)
    // this.Init();
  }
  onDestroy() {
    // this.Release();
  }
  private Init() {
    // this._sprite = this.node.getComponent(cc.Sprite);
    // this._material = this._sprite.getMaterial(0);
    // if (this._material.name.search("sprite-hue-shift") != -1) {
    // this._material.setProperty("hue", this._hue);
    // this._material.setProperty("saturation", this._saturation);
    // this._material.setProperty("value", this._value);
    // }
    // else {
    // console.error("Wrong material. Please set a material named \"sprite-hue-shift\" !");
    // }
  }
  private Release() {
    // this._sprite = null;
    // this._material = null;
  }
}

/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// const { ccclass, property, playOnFocus, executeInEditMode, menu } = cc._decorator;
// /**
//  * 色相偏移設定
//  */
// @ccclass
// @playOnFocus
// @executeInEditMode
// @menu("0_Common/Game/Component/UIHueShiftSetterEffect")
// export default class UIHueShiftSetterEffect extends cc.Component {
//
//     @property
//     _hue: Number = 0;
//     @property({ type: cc.Float, tooltip: "設定色相要偏移的多寡,如調整沒反應請注意Material是否正確", min: 0, max: 359, slide: true })
//     set Hue(val: Number) {
//         this._hue = val;
//         this.Init();
//     }
//     get Hue() {
//         return this._hue;
//     }
//
//     @property
//     _saturation: Number = 0;
//     @property({ type: cc.Float, tooltip: "設定飽和度,如調整沒反應請注意Material是否正確", min: 0, max: 3, slide: true })
//     set Saturation(val: Number) {
//         this._saturation = val;
//         this.Init();
//     }
//     get Saturation() {
//         return this._saturation;
//     }
//
//     @property
//     _value: Number = 0;
//     @property({ type: cc.Float, tooltip: "設定色調,如調整沒反應請注意Material是否正確", min: 0, max: 3, slide: true })
//     set Value(val: Number) {
//         this._value = val;
//         this.Init();
//     }
//     get Value() {
//         return this._value;
//     }
//
//     private _sprite: cc.Sprite = null;
//     private _material: cc.Material = null;
//
//     onLoad() {
//         this.Init();
//     }
//
//     onEnable() {
//         //編輯模式下方便重新確認效果
//         if (CC_EDITOR)
//             this.Init();
//     }
//
//     onDestroy() {
//         this.Release();
//     }
//
//     private Init() {
//         this._sprite = this.node.getComponent(cc.Sprite);
//         this._material = this._sprite.getMaterial(0);
//
//         if (this._material.name.search("sprite-hue-shift") != -1) {
//             this._material.setProperty("hue", this._hue);
//             this._material.setProperty("saturation", this._saturation);
//             this._material.setProperty("value", this._value);
//         }
//         else {
//             console.error("Wrong material. Please set a material named \"sprite-hue-shift\" !");
//         }
//     }
//
//     private Release() {
//         this._sprite = null;
//         this._material = null;
//     }
// }
