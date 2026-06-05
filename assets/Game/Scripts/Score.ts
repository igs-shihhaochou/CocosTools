import {
  _decorator,
  Component,
  Label,
  tween,
  Tween,
  Animation,
  UIOpacity,
} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import Functions from '../../CommonModule/Script/Utility/Functions';
import ShakeNode from './ShakeNode';

const {ccclass, property} = _decorator;

const ANIM = 'ScoreMultipe-001';

@ccclass
export default class Score extends Component {
  @property({type: Label, displayName: '分數'})
  public text: Label = null;
  @property({type: Label, displayName: '倍數'})
  public multipleText: Label = null;

  @property({type: Animation, displayName: '動畫'})
  public animation: Animation = null;

  @property(ShakeNode)
  public shakeNode: ShakeNode = null;

  protected onDestroy(): void {
    Tween.stopAllByTarget(this.node.getComponent(UIOpacity));
    this.unscheduleAllCallbacks();
  }

  public set value(value: number) {
    // this.text.string = value.toString();
    this.text.string = Functions.numberFormat(
      value,
      PlatformData.instance.displayDigit,
      false,
      '',
      PlatformData.instance.displayRatio,
      true
    );
  }

  public showLineMultiple(value: number, multiple: number) {
    const lineValue = value / multiple;

    const lineValueStr = Functions.formatNumberAdaptive(lineValue, true);
    this.text.string = lineValueStr + ' X ' + multiple;
    this.scheduleOnce(() => {
      this.text.string = Functions.formatNumberAdaptive(value, true);
    }, 0.8);
    this.scheduleOnce(() => {
      this.fadeOut();
    }, 1.8);
  }

  public showMultipleValue(value: number, multiple: number) {
    if (multiple === 1) {
      this.text.string = Functions.formatNumberAdaptive(value, true);
      this.multipleText.string = '';
      this.scheduleOnce(() => {
        this.fadeOut();
      }, 1.8);
      return;
    }
    const lineValue = value / multiple;
    const lineValueStr = Functions.formatNumberAdaptive(lineValue, true);
    this.text.string = lineValueStr;
    this.multipleText.string = multiple + 'x';
    this.scheduleOnce(() => {
      this.text.string = Functions.formatNumberAdaptive(value, true);
      this.shakeNode.stop();
      this.shakeNode.shake(5, 0.15);
      this.scheduleOnce(() => {
        this.shakeNode.stop();
      }, 0.15);
    }, 1.1);

    this.scheduleOnce(() => {
      this.fadeOut();
    }, 1.8);
  }

  public fadeIn(): void {
    tween<UIOpacity>(this.node.getComponent(UIOpacity))
      .to(0.1, {opacity: 255})
      .call(this.Animation.bind(this))
      .start();
  }

  public fadeOut(): void {
    tween<UIOpacity>(this.node.getComponent(UIOpacity))
      .to(0.1, {opacity: 0})
      .start();
  }

  public Animation(): void {
    this.animation.play(ANIM);
  }
}
