import {_decorator, Component, sys} from 'cc';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
import {SlotUIEvent} from '../Define/SlotUIEvent';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {SlotUISwitch} from '../Define/SlotUISwitch';
import {GameCommonEventLogID} from 'db://assets/CommonModule/Script/Log/BQLog/BQLogDefine';
import BQLogger from 'db://assets/CommonModule/Script/Log/BQLog/BQLogger';
const {ccclass} = _decorator;

@ccclass('IosFullScreenCtrl')
export class IosFullScreenCtrl extends Component {
  private static get swipeHandler() {
    return window['iOSFullscreenSwipeHandlerInstance'];
  }

  onLoad() {
    SlotGDK.instance.eventSceneIsReady.insert(this.onSceneIsReady, this);
  }

  private setUpBqLogCallback() {
    IosFullScreenCtrl.swipeHandler.setSwipeUpSuccessCallback(() => {
      BQLogger.sendEventLog(GameCommonEventLogID.IOS_MANUAL_CLOSE_SWIPE_UP);
    });
    IosFullScreenCtrl.swipeHandler.setManualCloseCallback(() => {
      BQLogger.sendEventLog(GameCommonEventLogID.IOS_SWIPE_UP_SUCCESS);
    });
  }

  private onSceneIsReady() {
    SlotGDK.instance.eventSceneIsReady.remove(this.onSceneIsReady, this);
    if (sys.os === sys.OS.IOS && IosFullScreenCtrl.swipeHandler) {
      this.schedule(this.detectIosFullScreen, 0.01);
      this.setEvents(true);
      this.setUpBqLogCallback();
    }
  }

  onDestroy() {
    this.setEvents(false);
    this.unschedule(this.detectIosFullScreen);
  }

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.event;
    e(SlotUIBtnEvent.OnScreenExitFullScreenClicked)[func](
      this.showHideUrlBar,
      this
    );
    e(SlotUIBtnEvent.ExitFullScreenClicked)[func](this.showHideUrlBar, this);

    // 檢測是否為iOS Chrome
    const isChromeInIos = navigator.userAgent.indexOf('CriOS') >= 0;
    // 如果是iOS Chrome，使用特殊的fullscreen處理
    if (isChromeInIos && SlotUISwitch.enableFullScreenInIosChrome) {
      e(SlotUIBtnEvent.FullScreenClicked)[func](this.showSwipeUp, this);
      e(SlotUIBtnEvent.OnScreenFullScreenClicked)[func](this.showSwipeUp, this);
    }
  }

  private detectIosFullScreen() {
    if (IosFullScreenCtrl.swipeHandler) {
      const shouldShowSwipe =
        IosFullScreenCtrl.swipeHandler.getShouldShowSwipe();
      if (shouldShowSwipe) {
        SlotGDK.event(SlotUIEvent.IOSExitFullScreen).notify();
      } else {
        SlotGDK.event(SlotUIEvent.IOSSetFullScreen).notify();
      }
    }
  }

  public showSwipeUp() {
    if (IosFullScreenCtrl.swipeHandler) {
      IosFullScreenCtrl.swipeHandler.registerEventListeners();
      IosFullScreenCtrl.swipeHandler.initSwipeDetection();
    }
  }

  private showHideUrlBar() {
    if (IosFullScreenCtrl.swipeHandler) {
      IosFullScreenCtrl.swipeHandler.showUrlBarTutorial();
    }
  }
}
