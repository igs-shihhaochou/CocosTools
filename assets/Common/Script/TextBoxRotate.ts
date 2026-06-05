import {_decorator, SpriteFrame} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import EventManager from '../../CommonModule/Script/Manager/EventManager';
import {OrientationDefine} from '../../CommonModule/Script/Type/CommonDefine';
import {TextBox} from './TextBox';

const {ccclass, property} = _decorator;

@ccclass
export default class TextBoxRotate extends TextBox {
  @property(SpriteFrame)
  public selectSpriteV: SpriteFrame = null;

  @property(SpriteFrame)
  public unSelectSpriteV: SpriteFrame = null;

  private isSelected = false;
  private currentOrientation: OrientationDefine.OrientationType =
    OrientationDefine.OrientationType.LANDSCAPE;

  protected onLoad(): void {
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.onOrientationChanged,
      this
    );
    this.currentOrientation = PlatformData.isLandscape
      ? OrientationDefine.OrientationType.LANDSCAPE
      : OrientationDefine.OrientationType.PORTRAIT;
    this.onOrientationChanged(this.currentOrientation);
  }

  protected onDestroy(): void {
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.onOrientationChanged,
      this
    );
  }

  private onOrientationChanged(orientation: OrientationDefine.OrientationType) {
    this.currentOrientation = orientation;
    if (orientation === OrientationDefine.OrientationType.LANDSCAPE) {
      this.bg.spriteFrame = this.isSelected
        ? this.selectSprite
        : this.unSelectSprite;
    } else {
      this.bg.spriteFrame = this.isSelected
        ? this.selectSpriteV
        : this.unSelectSpriteV;
    }
  }

  //set selection status
  public setSelection(selection: boolean) {
    this.isSelected = selection;
    this.onOrientationChanged(this.currentOrientation);
  }
}
