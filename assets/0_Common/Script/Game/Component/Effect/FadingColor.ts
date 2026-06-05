import {_decorator, Component, Color, Material, sp, Sprite} from 'cc';
import {EDITOR} from 'cc/env';
const {ccclass, property, playOnFocus, executeInEditMode, menu} = _decorator;

// /**
//  * 實現圖片換色
//  */

@ccclass('FadingColor')
@playOnFocus
@executeInEditMode
@menu('0_Common/Game/Component/FadingColor')
export default class NewClass extends Component {
  @property({tooltip: '設定圖片要轉換的顏色'})
  private fadingColor: Color = new Color(255, 255, 255, 255);
  public set color(val: Color) {
    this.fadingColor = val;
    this.init();
  }
  public get color() {
    return this.fadingColor;
  }
  private _material: Material | null = null;
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
    const image =
      this.node.getComponent(Sprite) || this.node.getComponent(sp.Skeleton);
    if (image) {
      this._material = image.getRenderMaterial(0);
    } else {
      console.error(
        'Can not find image component, please add sprite or skeleton component first'
      );
      return;
    }
    if (this._material?.name.search('FadingColor') !== -1) {
      this._material?.setProperty('FadingColor', this.fadingColor);
    } else {
      console.error(
        'Wrong material. Please set a material named "FadingColor" !'
      );
    }
  }
  private release() {
    this._material = null;
  }
}
