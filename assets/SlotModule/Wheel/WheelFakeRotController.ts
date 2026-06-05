import {_decorator, Animation, Component} from 'cc';
const {ccclass, property} = _decorator;

@ccclass
export class WheelFakeRotController extends Component {
  @property([Animation])
  fakeAnimationAry: Animation[] = [];

  public setSingleFakeSpriteStart(index: number) {
    this.fakeAnimationAry[index].node.active = true;
    this.fakeAnimationAry[index].play();
  }

  public setSingleFakeSpriteStop(index: number) {
    this.fakeAnimationAry[index].stop();
    this.fakeAnimationAry[index].node.active = false;
  }

  public setAllFakeSpriteStart() {
    this.setAllFakeSpritesEnable(true);
  }

  public setAllFakeSpritesEnable(enable: boolean) {
    for (let i = 0, count = this.fakeAnimationAry.length; i < count; i++) {
      if (enable) {
        this.setSingleFakeSpriteStart(i);
      } else {
        this.setSingleFakeSpriteStart(i);
      }
    }
  }
}
