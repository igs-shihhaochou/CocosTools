import {_decorator, director, Director, Event, Node, Label, Button} from 'cc';
import Functions from '../../../../CommonModule/Script/Utility/Functions';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import MultiLangHandler from '../../../../CommonModule/Script/Core/MultiLangHandler';
import InputManager from '../../../../CommonModule/Script/Manager/InputManager';
import EventManager from '../../../../CommonModule/Script/Manager/EventManager';
import SubViewBase from './SubViewBase';

const {ccclass, property, menu} = _decorator;

/**
 * 訊息視窗種類
 */
export enum MessageBoxType {
  /** 有一個OK按鈕 */
  Ok,
  /** 有YES、NO兩個按鈕 */
  YesOrNo,
}
/**
 * 訊息視窗
 */
/** 訊息框資訊 */
export interface MessageInfo {
  id: number;
  type: MessageBoxType;
  message: string;
  subMessage: string | number;
  okCallback?: Function;
  yesCallback?: Function;
  noCallback?: Function;
}

@ccclass('MessageBox')
@menu('0_Common/Game/Component/MessageBox')
export default class MessageBox extends SubViewBase {
  //    /** 訊息文字 */
  @property(Label)
  private messageText: Label | null = null;
  //    /** 訊息代號 */
  @property(Label)
  private subMessageText: Label | null = null;
  @property(Node)
  private confirmButtonNode: Node | null = null;
  @property(Node)
  private yesNoButtonNode: Node | null = null;
  //    /** 確認按鈕 */
  @property(Button)
  private button: Button | null = null;
  /** 確認按鈕文字  */
  @property(Label)
  private buttonText: Label | null = null;
  /** 點擊OK事件 */
  private okClickEvent: Function = null;
  /** 點擊Yes事件 */
  private yesClickEvent: Function = null;
  /** 點擊No事件 */
  private noClickEvent: Function = null;
  private messageQueue: Array<MessageInfo> = null;
  private messageInfoNow: MessageInfo = null;
  private messageCounter = 0;
  /**
   * 初始化MessageBox
   */
  public init() {
    super.init();
    //設置介面文字
    // this.setUIText();
    //滑鼠游標偵測節點
    InputManager.instance.setButtonsCursor(this.node);
    //防止遊戲場景重載時 訊息佇列功能導致遊戲流程異常
    director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, this.hide, this);
  }
  /**
   * 釋放MessageBox資源
   */
  public release() {
    this.clear();
    super.release();
    director.off(Director.EVENT_BEFORE_SCENE_LAUNCH, this.hide, this);
  }
  public clear() {
    this.okClickEvent = null;
    this.yesClickEvent = null;
    this.noClickEvent = null;
    this.messageQueue = null;
    this.messageInfoNow = null;
    this.messageCounter = 0;
  }
  /**
   * 顯示
   */
  public display() {
    super.display();
    EventManager.instance.dispatchEvent(
      PlatformData.gameEventName.MESSAGE_BOX_SHOW,
      this.messageInfoNow.subMessage
    );
  }
  /**
   * 關閉
   */
  public hide() {
    //隱藏
    super.hide();
    this.clear();
  }
  /**
   * 點擊確認按鈕
   */
  public ok(evt?: Event) {
    console.log('MessageBox - 點擊確認按鈕', this.okClickEvent);
    if (evt && this.okClickEvent) this.okClickEvent();
    this.okClickEvent = null;
    this.messageInfoNow = null;
    this.checkNext();
  }
  /**
   * 點擊確認按鈕
   */
  public yes(evt?: Event) {
    if (evt && this.yesClickEvent) this.yesClickEvent();
    this.yesClickEvent = null;
    this.messageInfoNow = null;
    this.checkNext();
  }
  /**
   * 點擊確認按鈕
   */
  public no(evt?: Event) {
    if (evt && this.noClickEvent) this.noClickEvent();
    this.noClickEvent = null;
    this.messageInfoNow = null;
    this.checkNext();
  }
  /**
   * 修改/添加訊息
   * @param type 對話框樣式
   * @param message 主訊息
   * @param subMessage 副訊息
   * @param okCallback 點擊OK按鈕要呼叫的內容
   * @param yesCallback 點擊YES按鈕要呼叫的內容
   * @param noCallback 點擊NO按鈕要呼叫的內容
   * @param messageId 這個訊息的流水號(不代表播出順序)，帶入此參數可以指定修改此編號訊息的內容，但若此流水號不存在則會改為新增訊息，並回傳新的messageId
   * @returns messageId
   */
  public add(
    type: MessageBoxType,
    message: string,
    subMessage: string | number,
    okCallback?: Function,
    yesCallback?: Function,
    noCallback?: Function,
    messageId?: number
  ): number {
    if (!this.messageQueue) {
      this.messageQueue = [];
      this.messageCounter = 0;
    }
    if (!Functions.isNullOrEmpty(messageId)) {
      //有帶messageId的話嘗試修改資訊
      console.log('MessageBox - 尋找 id:' + messageId);
      if (this.messageInfoNow && this.messageInfoNow.id === messageId) {
        //現正播出
        this.messageInfoNow.type = type;
        this.messageInfoNow.message = message;
        this.messageInfoNow.subMessage = subMessage;
        this.messageInfoNow.okCallback = okCallback;
        this.messageInfoNow.yesCallback = yesCallback;
        this.messageInfoNow.noCallback = noCallback;
        console.log('MessageBox - 修改畫面顯示');
        //修改畫面顯示
        this.show(this.messageInfoNow);
        return this.messageInfoNow.id;
      } else if (this.messageQueue && this.messageQueue.length > 0) {
        //在佇列中尋找
        const index = this.messageQueue.findIndex(
          messageInfo => messageInfo.id === messageId
        );
        if (index > -1) {
          //更新資訊
          const messageInfo: MessageInfo = this.messageQueue[index];
          messageInfo.type = type;
          messageInfo.message = message;
          messageInfo.subMessage = subMessage;
          messageInfo.okCallback = okCallback;
          messageInfo.yesCallback = yesCallback;
          messageInfo.noCallback = noCallback;
          //console.log("MessageBox - 更新資訊");
          return messageInfo.id;
        }
      }
    }
    //上面都沒有的話就新增
    const newMessage: MessageInfo = {
      id: this.messageCounter,
      type: type,
      message: message,
      subMessage: subMessage,
      okCallback: okCallback,
      yesCallback: yesCallback,
      noCallback: noCallback,
    };
    console.log('MessageBox - 新增 id:' + newMessage.id);
    this.messageQueue.push(newMessage);
    this.messageCounter++;
    this.checkNext();
    return newMessage.id;
  }
  /**
   * 檢查，若佇列中還有訊息就播出，沒有就關閉
   */
  private checkNext() {
    if (this.messageInfoNow) {
      //現在有在播放中，不做事
    } else if (
      !this.messageInfoNow &&
      this.messageQueue &&
      this.messageQueue.length > 0
    ) {
      //現在沒有播放中的，而且佇列中還有訊息要播
      //取出下一個來播
      this.messageInfoNow = this.messageQueue.shift();
      this.show(this.messageInfoNow);
    } else {
      //現在沒有播放中的，佇列也沒有訊息，關閉
      this.hide();
    }
  }
  /**
   * 顯示訊息
   * @param setting 訊息設定
   */
  private show(setting: MessageInfo) {
    this.messageText.string = setting.message;
    this.subMessageText.string = '#' + setting.subMessage.toString();
    switch (this.messageInfoNow.type) {
      case MessageBoxType.Ok:
        this.confirmButtonNode.active = true;
        this.yesNoButtonNode.active = false;
        if (setting.okCallback) {
          this.okClickEvent = setting.okCallback;
        }
        //顯示
        this.display();
        break;
      case MessageBoxType.YesOrNo:
        this.confirmButtonNode.active = false;
        this.yesNoButtonNode.active = true;
        if (setting.yesCallback) {
          this.yesClickEvent = setting.yesCallback;
        }
        if (setting.noCallback) {
          this.noClickEvent = setting.noCallback;
        }
        //顯示
        this.display();
        break;
      default:
        //都找不到再檢查下一個
        this.messageInfoNow = null;
        this.checkNext();
        break;
    }
  }
  /**
   * 設置介面文字
   */
  private setUIText() {
    this.buttonText.string = MultiLangHandler.getGameText('OK');
  }
}
