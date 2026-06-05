import {_decorator, Component, Color, Sprite, Material} from 'cc';
const {ccclass, property, playOnFocus, executeInEditMode, menu} = _decorator;

@ccclass('UIColorCoverSetterEffect')
@playOnFocus
@executeInEditMode
@menu('0_Common/Game/Component/UIColorCoverSetterEffect')
export default class UIColorCoverSetterEffect extends Component {
  @property
  _coverColor: Color = new Color(255, 255, 255, 255);
  @property({
    type: Color,
    tooltip:
      '設定要覆蓋的顏色,疊不透明白色會整張變白,疊其他顏色則不一定(ex:原圖純黃色疊純紅色=純黃色),如調整沒反應請注意Material是否正確',
  })
  set Color(val: Color) {
    // this._coverColor = val;
    // this.Init();
  }
  get Color() {
    // return this._coverColor;
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
    // if (this._material.name.search("sprite-color-cover") != -1) {
    // this._material.setProperty("coverColor", this._coverColor);
    // }
    // else {
    // console.error("Wrong material. Please set a material named \"sprite-color-cover\" !");
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
//  * 顏色覆蓋設定，可以製作閃白、閃紅等效果
//  */
// @ccclass
// @playOnFocus
// @executeInEditMode
// @menu("0_Common/Game/Component/UIColorCoverSetterEffect")
// export default class UIColorCoverSetterEffect extends cc.Component {
//
//     @property
//     _coverColor: cc.Color = new cc.Color(255, 255, 255, 255);
//     @property({ type: cc.Color, tooltip: "設定要覆蓋的顏色,疊不透明白色會整張變白,疊其他顏色則不一定(ex:原圖純黃色疊純紅色=純黃色),如調整沒反應請注意Material是否正確" })
//     set Color(val: cc.Color) {
//         this._coverColor = val;
//         this.Init();
//     }
//     get Color() {
//         return this._coverColor;
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
//         if (this._material.name.search("sprite-color-cover") != -1) {
//             this._material.setProperty("coverColor", this._coverColor);
//         }
//         else {
//             console.error("Wrong material. Please set a material named \"sprite-color-cover\" !");
//         }
//     }
//
//     private Release() {
//         this._sprite = null;
//         this._material = null;
//     }
// }
