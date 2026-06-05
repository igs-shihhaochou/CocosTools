import {_decorator, Component, CCFloat, Sprite, Material} from 'cc';
import {EDITOR} from 'cc/env';
const {ccclass, property, playOnFocus, executeInEditMode, menu} = _decorator;

@ccclass('DissolveSetterEffect')
@playOnFocus
@executeInEditMode
@menu('0_Common/Game/Component/DissolveSetterEffect')
export default class DissolveSetterEffect extends Component {
  @property(CCFloat)
  _range = 0;
  @property({type: CCFloat, tooltip: '溶解程度'})
  public set range(val: number) {
    this._range = val;
    this.Init();
  }
  public get range() {
    return this._range;
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
    this.release();
  }
  private Init() {
    this._sprite = this.node.getComponent(Sprite);
    this._material = this._sprite?.getSharedMaterial(0);
    if (this._material?.name.search('dissolve') !== -1) {
      this._material?.setProperty('noiseThreshold', this._range);
    } else {
      console.error('Wrong material. Please set a material named "dissolve" !');
    }
  }
  private release() {
    this._sprite = null;
    this._material = null;
  }
}
