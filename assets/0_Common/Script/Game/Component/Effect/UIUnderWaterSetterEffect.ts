import {_decorator, Component, CCFloat, Sprite, Material} from 'cc';
import {EDITOR} from 'cc/env';
const {ccclass, property, playOnFocus, executeInEditMode, menu} = _decorator;

@ccclass('UIUnderWaterSetterEffect')
@playOnFocus
@executeInEditMode
@menu('0_Common/Game/Component/UIUnderWaterSetterEffect')
export default class UIUnderWaterSetterEffect extends Component {
  @property
  _timeFactor = 0.2;
  @property({type: CCFloat, tooltip: '設定波動速度'})
  set timeFactor(val: number) {
    this._timeFactor = val;
    this.init();
  }
  get timeFactor() {
    return this._timeFactor;
  }
  @property
  _offsetFactor = 0.1;
  @property({type: CCFloat, tooltip: '設定波動幅度'})
  set offsetFactor(val: number) {
    this._offsetFactor = val;
    this.init();
  }
  get offsetFactor() {
    return this._offsetFactor;
  }
  @property
  _addTime = 0;
  @property({
    type: CCFloat,
    tooltip:
      '設定要重複疊色的次數,非純黑的地方會越疊越亮,如調整沒反應請注意Material是否正確,如場景不適合加光斑請設為0',
  })
  set addTimes(val: number) {
    this._addTime = val;
    this.init();
  }
  get addTimes() {
    return this._addTime;
  }
  private _sprite: Sprite | null = null;
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
    this._sprite = this.node.getComponent(Sprite);
    this._material = this._sprite.material;
    //@ts-ignore
    if (this._material._parent._name === 'under-water') {
      this._material.setProperty('timeFactor', this._timeFactor);
      this._material.setProperty('offsetFactor', this._offsetFactor);
      this._material.setProperty('addTimes', this._addTime);
    } else {
      console.error(
        'Wrong material. Please set a material named "under-water" !'
      );
    }
  }
  private release() {
    this._sprite = null;
    this._material = null;
  }
}
