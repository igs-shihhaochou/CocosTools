import {_decorator, Component, RichText} from 'cc';
import {getWidth} from '../../CommonModule/Script/Utility/NodeProperty';

const {ccclass, property} = _decorator;

@ccclass
export class RichTextShrink extends Component {
  @property(RichText)
  private targetRichText: RichText = null;

  private windowWidth = 1280;

  //當RichText長度超過視窗寬度，就縮小字體
  public Shrink() {
    while (getWidth(this.targetRichText.node) > this.windowWidth) {
      this.targetRichText.fontSize = this.targetRichText.fontSize - 1;
    }
  }
}
