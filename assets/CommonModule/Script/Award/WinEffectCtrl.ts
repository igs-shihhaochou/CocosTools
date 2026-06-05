import {_decorator, Component, Button} from 'cc';
const {ccclass, property} = _decorator;

import {NumberAnimation} from '../UIComponent/NumberAnimation';
import {PlatformData} from '../Define/PlatformData';
import {PlatformGDK} from '../Platform/PlatformGDK';

@ccclass('WinEffectCtrl')
export class WinEffectCtrl extends Component {
  @property(NumberAnimation)
  protected winLabel: NumberAnimation = undefined;
  @property(Button)
  public skipButton: Button = undefined;
  @property(Button)
  public confirmButton: Button = undefined;
  protected finishCallback: Function = null;

  protected setFinishDelegate(option: boolean) {
    const func = option ? 'insert' : 'remove';
    if (this.winLabel && this.winLabel.finishDelegate) {
      this.winLabel.finishDelegate[func](this.onLabelFinished, this);
    }
  }

  public onLoad() {
    this.setFinishDelegate(true);
  }

  public onDestroy() {
    this.setFinishDelegate(false);
  }
  //按下Skip按鈕強制滾到終點
  public forceSkipEffect(): void {
    if (this.winLabel !== undefined) {
      this.winLabel.setNumberToStop();
    }
  }
  //播放報獎效果
  public playEffect(
    dWinNum: number,
    fFinishTime: number,
    callback?: Function,
    target?
  ): void {
    if (callback !== null) this.finishCallback = callback.bind(target);
    //有滾錢的元件就滾錢, 滾完才Callback
    if (this.winLabel !== null) {
      this.winLabel.reset();
      this.winLabel.setTargetNumberAnimationEx(dWinNum, fFinishTime);
    } else {
      this.scheduleOnce(this.stopEffect, fFinishTime);
    }
  }
  //停止報獎效果
  public stopEffect(): void {
    this.unschedule(this.stopEffect);
    if (this.finishCallback !== null) {
      this.finishCallback();
    }
  }

  protected onLabelFinished() {
    const includeWinType = PlatformData.userSetting.ShareWinType?.includes(
      PlatformGDK.instance.getWinType(this.winLabel.getTargetNumber())
    );
    if (PlatformData.userSetting.ShareUrl && includeWinType) {
      PlatformGDK.instance.showSharePopup.notify(() => {
        this.stopEffect();
      });
    } else {
      this.stopEffect();
    }
  }
}
