import {_decorator, Component, Node, Tween, tween} from 'cc';
const {ccclass, property, menu} = _decorator;
import Functions from '../Utility/Functions';
/**
 * 讀取動畫畫面
 * 各觸發對象依優先權控制 層級越高則需由高優先權關閉
 * 待所有觸發對象皆關閉時 讀取動畫畫面即隱藏
 */
/** 讀取觸發者 */
class LoadingTrigger {
  /** 觸發來源 */
  private _source;
  /** 優先權 0 ~ 9 (值越小越高) */
  private _priority = 0;
  /**
   * 建構式
   * @param source
   * @param priority
   * @param timeout second
   * @param timeoutCallback
   */
  constructor(source, priority = 9, timeout = 10, timeoutCallback?: Function) {
    this._source = source;
    //設置優先權
    this.setPriority(priority, timeout, timeoutCallback);
  }
  /**
   * 釋放LoadingTrigger資源
   */
  public release() {
    //清除逾時處理用的計時器
    this.clearTimeout();
    this._source = undefined;
    this._priority = undefined;
  }
  /**
   * 設置優先權
   * 低於原優先權則無效
   * @param priority
   * @param timeout second
   * @param timeoutCallback
   */
  public setPriority(
    priority: number = null,
    timeout = 10,
    timeoutCallback?: Function
  ): boolean {
    //優先權限制
    if (priority === null) priority = 9;
    this._priority = Functions.clamp(0, 9, priority);
    //若優先權低於原優先權則略過
    if (priority > this._priority) return false;
    //清除逾時處理用的計時器
    this.clearTimeout();
    //若有逾時回呼函式則設置逾時處理
    if (timeoutCallback) this.setTimeout(timeout, timeoutCallback);
    return true;
  }
  /**
   * 設置逾時處理計時器
   * @param timeout second
   * @param callback
   */
  private setTimeout(timeout = 10, callback: Function) {
    if (timeout === null) timeout = 10;
    //清除逾時處理用的計時器
    Tween.stopAllByTarget(this);
    //設置計時器
    tween(this)
      .delay(timeout)
      .call(() => {
        console.info('[LoadingTrigger] timeout callback %O', this._source);
        callback();
      })
      .start();
  }
  /**
   * 清除計時器
   */
  private clearTimeout() {
    //清除逾時處理用的計時器
    Tween.stopAllByTarget(this);
  }
  /** 取得觸發來源 */
  public get source() {
    return this._source;
  }
  /** 取得優先權 */
  public get priority() {
    return this._priority;
  }
}

@ccclass('LoadingScreen')
@menu('CommonModule/UIComponent/LoadingScreen')
export default class LoadingScreen extends Component {
  /** 讀取動畫節點 */
  @property(Node)
  private loadingAnimationNode: Node | null = null;
  /** 讀取畫面的觸發者列表 */
  private loadingTriggerList: Array<LoadingTrigger> = null;
  onLoad() {
    this.init();
  }
  onDestroy() {
    this.release();
  }
  /**
   * 初始化LoadingScreen
   */
  public init() {
    //建立列表
    this.loadingTriggerList = new Array<LoadingTrigger>();
    //預設隱藏
    this.node.active = false;
  }
  /**
   * 釋放LoadingScreen資源
   */
  public release() {
    this.clearAll();
    this.loadingTriggerList = null;
  }
  /**
   * 顯示讀取畫面
   * 使用高優先權則無法由低優先權關閉
   * 優先權範圍 0 ~ 9 值越小越高
   * @param trigger
   * @param priority 0 ~ 9 null則為預設9
   * @param timeout null則為預設10秒 單位:秒數
   * @param timeoutCallback
   */
  public show(trigger, priority = 9, timeout = 10, timeoutCallback?: Function) {
    if (this.loadingTriggerList === null) return;
    //優先權限制
    if (priority === null) priority = 9;
    priority = Functions.clamp(0, 9, priority);
    //檢查觸發列表
    for (const loadingTrigger of this.loadingTriggerList) {
      //指定的觸發者是否已存在
      if (trigger === loadingTrigger.source) {
        const isSucess: boolean = loadingTrigger.setPriority(
          priority,
          timeout,
          timeoutCallback
        );
        //除錯訊息
        if (isSucess) {
          console.warn(
            '[LoadingScreen] show from %O ( %s -> %s )%s, trigger list: %O',
            loadingTrigger.source,
            loadingTrigger.priority,
            priority,
            !timeoutCallback ? ' timeout: ' + timeout : '',
            this.loadingTriggerList
          );
        } else {
          console.warn(
            '[LoadingScreen] already show from %O (%s), trigger list: %O',
            loadingTrigger.source,
            loadingTrigger.priority,
            this.loadingTriggerList
          );
        }
        //結束搜尋並返回
        return;
      }
    }
    //新增觸發來源
    const newLoadingTrigger: LoadingTrigger = new LoadingTrigger(
      trigger,
      priority,
      timeout,
      timeoutCallback
    );
    this.loadingTriggerList.push(newLoadingTrigger);
    //若為隱藏狀態則顯示讀取畫面
    if (!this.node.active) {
      //播放讀取動畫
      this.playLoadingAnimation();
      this.node.active = true;
    }
    //除錯訊息
    console.warn(
      '[LoadingScreen] show from %O (%s)%s, trigger list: %O',
      trigger,
      priority,
      !timeoutCallback ? ' timeout: ' + timeout : '',
      this.loadingTriggerList
    );
  }
  /**
   * 隱藏讀取畫面
   * 低優先權無法關閉高優先權
   * 優先權範圍 0 ~ 9 值越小越高
   * 若無其他觸發來源則隱藏讀取畫面
   * @param trigger
   * @param priority 0 ~ 9
   */
  public hide(trigger, priority = 9) {
    if (this.loadingTriggerList === null) return;
    //優先權限制
    if (priority === null) priority = 9;
    priority = Functions.clamp(0, 9, priority);
    //檢查觸發列表
    for (const idx in this.loadingTriggerList) {
      //取得指定的觸發來源
      const loadingTrigger: LoadingTrigger = this.loadingTriggerList[idx];
      //指定的觸發者是否已存在
      if (trigger === loadingTrigger.source) {
        //是否高於等於原優先權
        if (priority <= loadingTrigger.priority) {
          //移除觸發來源
          this.removeLoadingTrigger(Number(idx));
          //若無其他觸發來源則隱藏讀取畫面
          if (this.loadingTriggerList.length === 0) {
            //若為顯示狀態則隱藏讀取動畫
            if (this.node.active) {
              //停止讀取动画
              this.stopLoadingAnimation();
              this.node.active = false;
            }
            //除錯訊息
            console.log(
              '[LoadingScreen] hide from %O (%s), clear loading screen',
              trigger,
              priority
            );
          } else {
            //除錯訊息
            console.warn(
              '[LoadingScreen] hide from %O (%s), trigger list: %O',
              trigger,
              priority,
              this.loadingTriggerList
            );
          }
        } else {
          //除錯訊息
          console.warn(
            '[LoadingScreen] hide fail from %O (%s > %s), trigger list: %O',
            trigger,
            priority,
            loadingTrigger.priority,
            this.loadingTriggerList
          );
        }
        //結束搜尋並返回
        return;
      }
    }
    //除錯訊息
    console.warn(
      '[LoadingScreen] hide fail from %O (%s), trigger list: %O',
      trigger,
      priority,
      this.loadingTriggerList
    );
  }
  /**
   * 清除讀取畫面
   * 無視觸發來源 非必要請避免使用
   */
  public clearAll() {
    if (this.loadingTriggerList === null) return;
    //釋放讀取觸發者
    for (const loadingTrigger of this.loadingTriggerList) {
      loadingTrigger.release();
    }
    //清除列表
    this.loadingTriggerList.length = 0;
    //停止讀取動畫
    this.stopLoadingAnimation();
    //隱藏讀取畫面
    this.node.active = false;
  }
  /**
   * 移除讀取觸發者
   * @param index
   */
  private removeLoadingTrigger(index: number) {
    const loadingTrigger: LoadingTrigger = this.loadingTriggerList[index];
    if (loadingTrigger) loadingTrigger.release();
    //從列表中移除
    this.loadingTriggerList.splice(index, 1);
  }
  /**
   * 播放讀取動畫
   */
  private playLoadingAnimation() {
    //停止原動畫
    this.stopLoadingAnimation();
    //讀取動畫
    tween(this.loadingAnimationNode)
      .sequence(
        tween(this.loadingAnimationNode).delay(0.03),
        tween(this.loadingAnimationNode).call(() => {
          this.loadingAnimationNode.angle -= 15;
        })
      )
      .repeatForever()
      .start();
  }
  /**
   * 停止讀取动画
   */
  private stopLoadingAnimation() {
    if (!this.loadingAnimationNode.isValid) return;
    //清除緩動
    Tween.stopAllByTarget(this.loadingAnimationNode);
    //角度歸零
    this.loadingAnimationNode.angle = 0;
  }
}
