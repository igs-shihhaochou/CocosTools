import {_decorator, Component, Node, sys} from 'cc';
import {SlotGDK} from '../../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../../Buttons/SlotUIBtnEvent';
import {SlotUIEvent} from '../../Define/SlotUIEvent';
const {ccclass, property} = _decorator;

@ccclass('IosFullScreenHint')
export class IosFullScreenHint extends Component {
  @property(Node)
  private hintNode: Node = null;

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.FullScreenClicked)[func](this.showHint, this);
    e(SlotUIBtnEvent.OnScreenFullScreenClicked)[func](this.showHint, this);
    e(SlotUIEvent.IOSSetFullScreen)[func](this.closeHint, this);
    console.log('IosFullScreenHint setEvents');
  }

  onLoad() {
    if (sys.os !== sys.OS.IOS) {
      return;
    }
    this.setEvents(true);
  }

  onDestroy() {
    this.setEvents(false);
  }

  public closeHint() {
    this.hintNode.active = false;
  }

  private showHint() {
    const isChromeInIos = navigator.userAgent.indexOf('CriOS') >= 0;
    if (isChromeInIos) {
      return;
    }
    this.hintNode.active = true;
  }
}
