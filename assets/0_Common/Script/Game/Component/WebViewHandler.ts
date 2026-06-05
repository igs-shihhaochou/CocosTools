import {_decorator, Node, CCBoolean, WebView, screen} from 'cc';
const {ccclass, property, menu} = _decorator;

import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import EventManager from '../../../../CommonModule/Script/Manager/EventManager';
import SubViewBase from './SubViewBase';
import PlatformEventNotifier from '../../../../CommonModule/Script/Utility/PlatformEventNotifier';
/**
 * WebView處理
 */

@ccclass('WebViewHandler')
@menu('0_Common/Game/Component/WebViewHandler')
export default class WebViewHandler extends SubViewBase {
  /** WebView節點 */
  @property(Node)
  private webviewNode: Node | null = null;
  /** 是否要在出現系統通知訊息窗時關閉此webview */
  @property(CCBoolean)
  private isCloseWebViewWhenMessageBoxShow = false;
  /** web view */
  private webView: WebView | null = null;
  /** iframe */
  private iframe: HTMLIFrameElement = null;
  /** iframe是否為全螢幕 */
  private isIframeFullscreen = false;
  /**
   * 初始化WebViewHandler
   */
  public init() {
    super.init();
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.MESSAGE_BOX_SHOW,
      this.onMessageBoxShow,
      this
    );
  }
  /**
   * 釋放WebViewHandler資源
   */
  public release() {
    super.release();
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.MESSAGE_BOX_SHOW,
      this.onMessageBoxShow,
      this
    );
  }
  /**
   * 顯示WebView內容
   * @param url
   * @param onLoading
   * @param onLoaded
   * @param onError
   */
  public show(
    url: string,
    onLoading?: Function,
    onLoaded?: Function,
    onError?: Function
  ) {
    //取得WebView組件
    this.webView = this.webviewNode.getComponent(WebView);
    //同一WebView載入不同網址會產生網頁瀏覽紀錄
    //須將WebView銷毀 釋放原本的iframe內容 並重新加入WebView組件建立新的頁面
    if (
      this.webView !== null &&
      this.webView.url !== '' &&
      this.webView.url !== url
    ) {
      this.destroyWebView();
      this.webView = null;
    }
    //開啟後 關閉或載入不同網址會移除WebView 須重新建立
    if (this.webView === null) {
      this.webView = this.webviewNode.addComponent(WebView);
    }
    //修改WebView的iframe
    //this.hackWebViewIframe();

    //設置WebView的url
    this.webView.url = url;
    //iframe全螢幕處理
    //this.webView.node.once('loaded', this.iframeFullscreenHandler, this);

    //載入事件、完成事件、錯誤事件
    if (onLoading !== null) this.webView.node.once('loading', onLoading, this);
    if (onLoaded !== null) this.webView.node.once('loaded', onLoaded, this);
    if (onError !== null) this.webView.node.once('error', onError, this);

    PlatformEventNotifier.showAllUI(false);

    //顯示
    this.display();
  }
  /**
   * 關閉WebView
   * 移除WebView組件 (關閉載入的頁面並釋放資源)
   */
  public hide() {
    //隱藏
    super.hide();

    if (this.webView !== null) {
      //同步iframe的全螢幕狀態
      //this.syncFullscreenState();
      this.isIframeFullscreen = false;

      this.destroyWebView();

      PlatformEventNotifier.showAllUI(true);
    }
    this.webView = null;
    this.iframe = null;
  }
  /**
   * 收到訊息視窗出現事件
   * @param errorCode
   */
  private onMessageBoxShow() {
    //如果isCloseWebViewWhenMessageBoxShow為true，則不論收到erroeCode為何都關閉webView
    if (this.isCloseWebViewWhenMessageBoxShow) {
      this.hide();
      return;
    }
  }
  /**
   * 銷毀WebView (因有自定義覆寫函式 須確保釋放)
   */
  private destroyWebView() {
    if (this.webView === null) return;

    delete this.webView['_impl']['_oldCreateDom'];
    this.webView.destroy();
  }
  /**
   * 修改WebView的iframe
   * 注意'_createDom'屬性已不存在，若要使用需改寫
   */
  private hackWebViewIframe() {
    try {
      this.webView['_impl']['_oldCreateDom'] = this.webView['_impl'][
        '_createDom'
      ].bind(this.webView['_impl']);
      this.webView['_impl']['_createDom'] = this.overrideCreateDom.bind(this);
      //取得webview所使用的iframe
      this.iframe = this.webView['_impl']['_iframe'];
    } catch (err) {
      console.error('[WebViewHandler] hack cocos webview iframe error.', err);
    }
  }
  /**
   * 覆寫WebView創建iframe的DOM處理
   * @param width
   * @param height
   */
  private overrideCreateDom(width: number, height: number) {
    if (this.webView === null) return;
    if (this.webView['_impl']['_oldCreateDom'] === null) return;

    try {
      //呼叫原函式
      this.webView['_impl']['_oldCreateDom'](width, height);
      //允許iframe全螢幕
      const iframe: HTMLIFrameElement = this.webView['_impl']['_iframe'];
      iframe.setAttribute('allowFullScreen', 'true');
      iframe.setAttribute('webkitallowfullscreen', 'true');
      iframe.setAttribute('mozallowfullscreen', 'true');
    } catch (err) {
      console.error('[WebViewHandler] OverrideCreateDom error.', err);
    }
  }
  /**
   * iframe全螢幕處理
   */
  private iframeFullscreenHandler() {
    try {
      //取得iframe
      const iframe: HTMLIFrameElement =
        this.iframe !== null
          ? this.iframe
          : window.document
              .getElementById('Cocos2dGameContainer')
              .getElementsByTagName('iframe')[0];
      //iframe的document
      let iframeDocument: Document = null;
      //取得iframe的document
      try {
        iframeDocument = iframe.contentWindow.document;
      } catch (err) {
        iframeDocument = null;
        console.warn(
          '[WebViewHandler] IframeFullscreenHandler get iframe document fail, maybe cross-origin.'
        );
      }

      //若已全螢幕 則進行全螢幕處理
      if (document.fullscreenElement) {
        //若未取得iframe的document
        if (iframeDocument === null) {
          //關閉全螢幕 交由iframe自行控制
          document.exitFullscreen();
        } else {
          //全螢幕點擊事件 因瀏覽器規範須由使用者點擊才可觸發全螢幕
          //為了取消註冊 須預先宣告
          let onFullscreenClick: EventListener = null;
          onFullscreenClick = () => {
            //iframe內全螢幕
            this.requestFullscreen(iframeDocument.documentElement);
            //取消註冊點擊事件 避免重複觸發
            iframeDocument.removeEventListener('click', onFullscreenClick);
          };
          //註冊全螢幕點擊事件
          iframeDocument.addEventListener('click', onFullscreenClick);
        }
      }

      //iframe的全螢幕變更事件
      const onIframeFullscreenChange: EventListener = () => {
        //紀錄是否為全螢幕的狀態
        if (iframeDocument === null) {
          //僅能透過外層得知是否有全螢幕
          this.isIframeFullscreen = !!document.fullscreenElement;
          //未取得iframe的document時不可同步iframe的全螢幕狀態 會導致外層已全螢幕 iframe內開關全螢幕無效
        } else {
          //確認iframe的全螢幕狀態
          this.isIframeFullscreen = !!this.getFullscreenElement(
            iframe.contentDocument
          );
          //同步iframe的全螢幕狀態
          this.syncFullscreenState();
        }
      };
      //註冊iframe的全螢幕變更事件
      iframe.addEventListener('fullscreenchange', onIframeFullscreenChange);
      iframe.addEventListener(
        'webkitfullscreenchange',
        onIframeFullscreenChange
      );
      iframe.addEventListener('MSFullscreenChange', onIframeFullscreenChange);
      iframe.addEventListener('mozfullscreenchange', onIframeFullscreenChange);
    } catch (err) {
      console.error('[WebViewHandler] set iframe allow fullscreen error.', err);
    }
  }
  /**
   * 同步iframe的全螢幕狀態
   */
  private syncFullscreenState() {
    //此段內容因網頁內外的全螢幕狀態不一 導致全螢幕時有警示 或是關閉全螢幕時無法成功觸發 請忽略除錯訊息
    if (this.isIframeFullscreen) {
      screen['requestFullScreen'](document.documentElement);
    } else {
      screen['exitFullScreen']();
    }
  }
  /**
   * 取得指定document的fullscreenElement
   * @param doc
   */
  private getFullscreenElement(doc: Document): Element {
    if (doc === null) return null;

    if (doc['fullscreenElement']) {
      return doc['fullscreenElement'];
    } else if (doc['webkitFullscreenElement']) {
      return doc['webkitFullscreenElement'];
    } else if (doc['mozFullScreenElement']) {
      return doc['mozFullScreenElement'];
    } else if (doc['msFullscreenElement']) {
      return doc['msFullscreenElement'];
    }
    return null;
  }
  /**
   * 指定element全螢幕
   * @param elem
   */
  private requestFullscreen(elem: Element) {
    if (elem === null) return;

    if (elem['requestFullscreen']) {
      elem['requestFullscreen']();
    } else if (elem['msRequestFullscreen']) {
      elem['msRequestFullscreen']();
    } else if (elem['mozRequestFullScreen']) {
      elem['mozRequestFullScreen']();
    } else if (elem['webkitRequestFullscreen']) {
      elem['webkitRequestFullscreen']();
    }
  }
}
