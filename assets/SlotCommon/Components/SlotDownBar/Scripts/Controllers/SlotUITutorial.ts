import {_decorator, CCBoolean, Component, Node, sys} from 'cc';
import {SlotUISwitch} from '../Define/SlotUISwitch';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import Functions from '../../../../../CommonModule/Script/Utility/Functions';
import EventManager from '../../../../../CommonModule/Script/Manager/EventManager';
const {ccclass, property} = _decorator;

@ccclass('SlotUITutorial')
export class SlotUITutorial extends Component {
  @property([Node])
  private backPack: Node[] = [];
  @property([Node])
  private purchase: Node[] = [];
  @property(Node)
  private step1: Node = null;
  @property(Node)
  private step1blockH: Node = null;
  @property([Node])
  private step2: Node[] = [];
  @property(Node)
  private profile: Node = null;
  @property(Node)
  private history: Node = null;
  @property(Node)
  private fullscreen: Node = null;
  @property(Node)
  private closeFullScreen: Node = null;
  @property(Node)
  private button: Node = null;

  @property(CCBoolean)
  private enableTutorial = true;

  private current = 0;

  private get cookieKey() {
    const {nickName} = PlatformData;
    return `${nickName}_SlotUITutorial`;
  }

  private saveSettingToCookie() {
    Functions.setCookie(this.cookieKey, 'true', 525600, true);
  }

  protected onLoad(): void {
    this.button.active = false;
    this.step1.active = false;
    this.step2.forEach(node => {
      node.active = false;
    });
  }

  private onOrientationChange() {
    if (this.current === 0) {
      this.step1blockH.active = PlatformData.isLandscape;
    }
  }

  public init(): void {
    if (
      Functions.getCookie(this.cookieKey) === 'true' ||
      !this.enableTutorial
    ) {
      return;
    }
    SlotGDK.instance.eventOnOpeningFinished.insert(this.showTutorial, this);

    const {showBackPack, showPurchase} = SlotUISwitch;
    this.backPack.forEach(node => {
      node.active = showBackPack;
    });
    this.purchase.forEach(node => {
      node.active = showPurchase;
    });
  }

  private showTutorial() {
    SlotGDK.instance.eventOnOpeningFinished.remove(this.showTutorial, this);
    this.current = 0;
    this.showStep1();
  }

  onclick() {
    if (this.current === 0) {
      this.step1.active = false;
      this.showStep2();
      this.current++;
      return;
    }
    if (this.current === 1) {
      this.hideStep2();
      SlotGDK.event(SlotUIBtnEvent.CloseSettingClicked).notify();
    }
  }

  private showStep1() {
    this.button.active = true;
    this.step1.active = true;
    this.step1blockH.active = PlatformData.isLandscape;
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.onOrientationChange,
      this
    );
  }

  private showStep2() {
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.onOrientationChange,
      this
    );
    this.step1blockH.active = false;
    SlotGDK.event(SlotUIBtnEvent.SettingClicked).notify();
    this.step2.forEach(node => {
      node.active = true;
    });
    const {showHistory, showProfile, showFullScreen} = SlotUISwitch;
    //僅有iphone safari/PC/Android可顯示全螢幕
    const isChromeInIos = navigator.userAgent.indexOf('CriOS') >= 0;
    const isIphone =
      sys.os === sys.OS.IOS &&
      sys.isMobile &&
      sys.browserType === sys.BrowserType.SAFARI &&
      !isChromeInIos;
    const isAndroid = sys.os === sys.OS.ANDROID;
    const isPc = !sys.isMobile && sys.os !== sys.OS.IOS;
    const canShowFullScreen = isIphone || isAndroid || isPc;
    this.history.active = showHistory;
    this.profile.active = showProfile;
    this.fullscreen.active = canShowFullScreen && showFullScreen;
    this.closeFullScreen.active = canShowFullScreen && showFullScreen;
    this.saveSettingToCookie();
  }

  private hideStep2() {
    this.step2.forEach(node => {
      node.active = false;
    });
    this.button.active = false;
  }
}
