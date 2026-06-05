import {_decorator, Component, Animation} from 'cc';

const {ccclass, property} = _decorator;

@ccclass
export class EnableToPlayAnimation extends Component {
  @property(Animation)
  private animation: Animation = null;

  ///物件被打開時
  public onEnable() {
    if (this.animation === null) {
      this.animation = this.getComponent(Animation);
    }

    this.animation.play();
  }

  ///播放指定動畫
  private PlayAnimation(animationClipName: string) {
    this.animation.play(animationClipName);
  }
}
