import {_decorator, Component, Label} from 'cc';
import {NumberAnimation} from '../../../../../CommonModule/Script/UIComponent/NumberAnimation';
import {PlatformGDK} from '../../../../../CommonModule/Script/Platform/PlatformGDK';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import {setOpacity} from '../../../../../CommonModule/Script/Utility/NodeProperty';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {tweenNodeEx} from 'db://assets/CommonModule/Script/Utility/TweenUtil';

const {ccclass, property} = _decorator;

@ccclass('GameWinCtrl')
export class GameWinCtrl extends Component {
  @property(NumberAnimation)
  private gameWin: NumberAnimation = null;
  @property(Label)
  private gameWinTitle: Label = null;

  onLoad() {
    this.registerEvent(true);
  }

  onDestroy() {
    this.registerEvent(false);
  }

  public init() {
    SlotGDK.instance.bottomBarGameWinLabelNode = this.gameWin.node;
    if (PlatformData.useCert) {
      this.gameWin.setIsMoney(true);
    }
    if (PlatformData.licenseSetting.closeWinTxtWithZero) {
      this.setWinDisplay(false);
    }
  }

  public getGameWin() {
    return this.gameWin.getTargetNumber();
  }

  private registerEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    PlatformGDK.instance.rollGameWin[func](this.rollGameWin, this);
    SlotGDK.instance.eventShowWinAnimCount[func](this.rollGameWin, this);
    SlotGDK.event(SlotUIBtnEvent.TakeClicked)[func](this.stopRollAndSet, this);
    SlotGDK.instance.eventSpin[func](this.onSpin, this);
  }

  private onSpin() {
    this.gameWin.setCurrentNumber(0);
    this.setWinDisplay(!PlatformData.licenseSetting.closeWinTxtWithZero);
  }

  private setWinDisplay(option: boolean) {
    setOpacity(this.gameWin.node, option ? 255 : 0);
    setOpacity(this.gameWinTitle.node, option ? 255 : 0);
  }

  private rollGameWin(winNumber: number, duration = 1, showStopAnim = false) {
    if (PlatformData.licenseSetting.closeWinTxtWithZero) {
      this.setWinDisplay(winNumber > 0);
    }
    if (showStopAnim)
      this.gameWin.finishDelegate.insert(this.showGameWinRollStopAnim, this);
    this.gameWin.setTargetNumberAnimationEx(winNumber, duration);
  }

  // 快速跳到最後贏分
  private stopRollAndSet(showStopAnim = false): void {
    if (PlatformData.licenseSetting.closeWinTxtWithZero) {
      this.setWinDisplay(this.gameWin.getTargetNumber() > 0);
    }
    this.gameWin.setNumberToStop();
    if (showStopAnim) this.showGameWinRollStopAnim();
  }

  private showGameWinRollStopAnim(): void {
    this.gameWin.finishDelegate.remove(this.showGameWinRollStopAnim, this);

    tweenNodeEx(this.gameWin.node)
      .to(0.2, {scale: 1.2})
      .to(0.15, {scale: 1})
      .start();
  }
}
