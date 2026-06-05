import {_decorator, Component, CCFloat, Sprite, Material} from 'cc';
import {EDITOR} from 'cc/env';
const {ccclass, property, playOnFocus, executeInEditMode, menu} = _decorator;

@ccclass('UILinearDodgeSetterEffect')
@playOnFocus
@executeInEditMode
@menu('0_Common/Game/Component/UILinearDodgeSetterEffect')
export default class UILinearDodgeSetterEffect extends Component {
  @property({
    type: CCFloat,
    tooltip:
      '設定要重複疊色的次數,非純黑的地方會越疊越亮,如調整沒反應請注意Material是否正確',
  })
  private _addTime: Number = 0;

  set AddTimes(val: Number) {
    this._addTime = val;
    this.Init();
  }
  get AddTimes() {
    return this._addTime;
  }
  private _sprite: Sprite | null = null;
  private _material: Material | null | undefined = null;
  onLoad() {
    this.Init();
  }
  onEnable() {
    //編輯模式下方便重新確認效果
    if (EDITOR) this.Init();
  }
  onDestroy() {
    this.Release();
  }
  private Init() {
    this._sprite = this.node.getComponent(Sprite);
    this._material = this._sprite?.getSharedMaterial(0);
    if (this._material?.name.search('sprite-linear-dodge') !== -1) {
      this._material?.setProperty('addTimes', this._addTime as number);
    } else {
      console.error(
        'Wrong material. Please set a material named "sprite-linear-dodge" !'
      );
    }
  }
  private Release() {
    this._sprite = null;
    this._material = null;
  }
}
