import {_decorator, Component, UITransform, view, WebView, type Size} from 'cc';
import EventManager from '../../../../../CommonModule/Script/Manager/EventManager';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import PlatformEventNotifier from '../../../../../CommonModule/Script/Utility/PlatformEventNotifier';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIEvent} from '../Define/SlotUIEvent';
const {ccclass, property} = _decorator;

@ccclass('WebViewCtrl')
export class WebViewCtrl extends Component {
  @property(WebView)
  private webView: WebView = null;

  private static _instance: WebViewCtrl = null;

  private showX = false;

  public static get instance(): WebViewCtrl {
    if (!this._instance) {
      this._instance = new WebViewCtrl();
    }
    return this._instance;
  }

  protected onLoad(): void {
    WebViewCtrl._instance = this;
    this.webView.node.active = false;
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.updateObjSize.bind(this)
    );
    this.updateObjSize();
  }

  public openWebView(url: string, showX = false): void {
    console.log('[WebViewCtrl] openWebView', url);
    if (this.webView) {
      this.showX = showX;
      this.webView.node.active = true;
      this.webView.url = url;
      PlatformEventNotifier.showAllUI(false);
      SlotGDK.event(SlotUIEvent.PanelOpened).notify();
      this.scheduleOnce(() => {
        this.updateObjSize();
      });
    }
  }

  public closeWebView(): void {
    console.log('[WebViewCtrl] closeWebView');
    this.webView.node.active = false;
    this.webView.url = '';
    PlatformEventNotifier.showAllUI(true);
    SlotGDK.event(SlotUIEvent.PanelClosed).notify();
  }

  public updateObjSize(): void {
    const size: Size = view.getDesignResolutionSize();
    if (this.showX) {
      size.height = size.height - 44;
    }
    if (this.webView) {
      const transform = this.webView.node.getComponent(UITransform);
      transform.setContentSize(size);
    }
  }

  protected update(): void {}
}
