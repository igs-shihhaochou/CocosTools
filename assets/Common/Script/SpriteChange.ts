import {_decorator, Component, Sprite} from 'cc';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';

const {ccclass, property} = _decorator;

@ccclass
export class SpriteChange extends Component {
  @property(Sprite)
  m_Sprite: Sprite = null;

  m_bNeedNativeSize = false;

  ///切換圖片
  ChangeSprite(_index: number) {
    this.m_Sprite.spriteFrame =
      SlotGameMediator.instance.symbolSetting.getSpriteFramebyIndex(_index);
  }
}
