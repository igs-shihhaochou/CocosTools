import {
  _decorator,
  director,
  Event as CCEvent,
  Director,
  type EventMouse,
  type EventTouch,
  game,
  Vec2,
  Component,
  Node,
  Button,
} from 'cc';
import {PlatformData} from '../Define/PlatformData';
import EventManager, {EventNameList} from './EventManager';
import PlatformEventNotifier from '../Utility/PlatformEventNotifier';

const {ccclass, menu} = _decorator;

/** 遊戲輸入事件名稱列表 */
export const GameInputEvent: GameInputEvent = {
  /** 主輸入移動 */
  inputMove: 'InputManager_Move',
  TouchEvent: 'InputManager_TouchEvent',
  MouseEvent: 'InputManager_MouseEvent',
};

/** 遊戲輸入事件名稱列表 */
interface GameInputEvent extends EventNameList {
  /** 主輸入移動 參數: ( pos: Vec2 ) */
  readonly inputMove: string;
  /** 觸控事件*/
  readonly TouchEvent: string;
  /** 滑鼠事件 */
  readonly MouseEvent: string;
}

/** 偵測輸入模式的間隔時間 (毫秒) */
const INPUT_MODE_DETECT_INTERVAL = 333;

@ccclass('InputManager')
@menu('CommonModule/Manager/InputManager')
export default class InputManager extends Component {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): InputManager {
    if (!window['inputManager']) {
      window['inputManager'] = new InputManager();
    }
    return window['inputManager'];
  }
  public static set instance(instance: InputManager) {
    window['inputManager'] = instance;
  }

  //=======================================================
  //#endregion Singleton

  /** 輸入位置 (滑鼠、觸控) */
  private inputPosition: Vec2 = null;
  /** 是否隱藏游標 */
  private isHideCursor = false;
  /** 是否在遊戲畫布內 */
  private isInGameCanvas = false;
  /** 是否在按鈕內 */
  private isInButton = false;
  /** 滑鼠事件時間戳記 */
  private mouseEventTs = 0;
  /** 當前游標樣式 */
  private cursorStyle = 'default';

  onLoad() {
    // disable by liu 2024/11/12
    // if (InputManager.instance) {
    //   this.node.destroy();
    //   return;
    // }
    InputManager.instance = this;
  }

  onDestroy() {
    this.release();
  }

  /**
   * 初始化InputManager
   */
  public init() {
    this.cursorStyle = game.canvas.style.cursor;

    EventManager.instance.registerEvents(GameInputEvent);

    this.inputPosition = new Vec2();

    this.registerInputAreaEvent();

    director.on(
      Director.EVENT_AFTER_SCENE_LAUNCH,
      this.registerInputAreaEvent,
      this
    );
  }

  /**
   * 釋放InputManager資源
   */
  public release() {
    this.inputPosition = null;

    this.unregisterInputAreaEvent();

    director.off(
      Director.EVENT_AFTER_SCENE_LAUNCH,
      this.registerInputAreaEvent,
      this
    );

    InputManager.instance = null;
  }

  /**
   * 隱藏游標
   * @param isHide
   */
  public hideCursor(isHide = true) {
    this.isHideCursor = isHide;
  }

  /**
   * 設置非行動裝置時 改變按鈕上的游標狀態
   * @param node
   */
  public setButtonsCursor(node: Node) {
    if (!PlatformData.isMobile) {
      const buttons: Array<Button> = node.getComponentsInChildren(Button);
      let button: Button = null;
      for (let i = 0; i < buttons.length; i++) {
        button = buttons[i];
        button.node.on(
          Node.EventType.MOUSE_ENTER,
          this.onButtonMouseEvent,
          this
        );
        button.node.on(
          Node.EventType.MOUSE_LEAVE,
          this.onButtonMouseEvent,
          this
        );
      }
      button = undefined;
    }
  }

  /**
   * 取得輸入位置
   * @returns
   */
  public getInputPosition(): Vec2 {
    return this.inputPosition;
  }

  /**
   * 註冊輸入區域事件
   */
  private registerInputAreaEvent() {
    const canvas = director.getScene().getChildByName('Canvas');

    canvas.on(
      Node.EventType.MOUSE_DOWN,
      this.onDeviceMouseInputEvent,
      this,
      true
    );
    canvas.on(
      Node.EventType.MOUSE_MOVE,
      this.onDeviceMouseInputEvent,
      this,
      true
    );
    canvas.on(
      Node.EventType.MOUSE_UP,
      this.onDeviceMouseInputEvent,
      this,
      true
    );
    canvas.on(
      Node.EventType.MOUSE_ENTER,
      this.onDeviceMouseInputEvent,
      this,
      true
    );
    canvas.on(
      Node.EventType.MOUSE_LEAVE,
      this.onDeviceMouseInputEvent,
      this,
      true
    );

    canvas.on(Node.EventType.TOUCH_START, this.switchMoveEvent, this, true);
    canvas.on(Node.EventType.MOUSE_DOWN, this.switchMoveEvent, this, true);
    canvas.on(Node.EventType.MOUSE_ENTER, this.switchMoveEvent, this, true);

    canvas.on(Node.EventType.MOUSE_ENTER, this.onCanvasInputEvent, this, true);
    canvas.on(Node.EventType.MOUSE_LEAVE, this.onCanvasInputEvent, this, true);
  }

  /**
   * 取消註冊輸入區域事件
   */
  private unregisterInputAreaEvent() {
    const canvas = director.getScene().getChildByName('Canvas');

    canvas.off(
      Node.EventType.MOUSE_DOWN,
      this.onDeviceMouseInputEvent,
      this,
      true
    );
    canvas.off(
      Node.EventType.MOUSE_MOVE,
      this.onDeviceMouseInputEvent,
      this,
      true
    );
    canvas.off(
      Node.EventType.MOUSE_UP,
      this.onDeviceMouseInputEvent,
      this,
      true
    );
    canvas.off(
      Node.EventType.MOUSE_ENTER,
      this.onDeviceMouseInputEvent,
      this,
      true
    );
    canvas.off(
      Node.EventType.MOUSE_LEAVE,
      this.onDeviceMouseInputEvent,
      this,
      true
    );

    canvas.off(Node.EventType.TOUCH_START, this.switchMoveEvent, this, true);
    canvas.off(Node.EventType.MOUSE_DOWN, this.switchMoveEvent, this, true);
    canvas.off(Node.EventType.MOUSE_ENTER, this.switchMoveEvent, this, true);

    //依據輸入類型監聽的事件一併取消
    canvas.off(Node.EventType.TOUCH_MOVE, this.onMainInputEvent, this, true);
    canvas.off(Node.EventType.MOUSE_MOVE, this.onMainInputEvent, this, true);

    canvas.off(Node.EventType.MOUSE_ENTER, this.onCanvasInputEvent, this, true);
    canvas.off(Node.EventType.MOUSE_LEAVE, this.onCanvasInputEvent, this, true);
  }

  /**
   * 事件: 裝置滑鼠操作
   * @param event
   */
  private onDeviceMouseInputEvent(event: EventMouse | EventTouch) {
    switch (event.type) {
      case Node.EventType.MOUSE_DOWN:
      case Node.EventType.MOUSE_MOVE:
      case Node.EventType.MOUSE_UP:
      case Node.EventType.MOUSE_ENTER:
      case Node.EventType.MOUSE_LEAVE:
        this.mouseEventTs = Date.now();
        break;
    }
  }

  /**
   * 切換移動事件
   * @param event
   */
  private switchMoveEvent(event: EventMouse | EventTouch) {
    const canvas = director.getScene().getChildByName('Canvas');
    switch (event.type) {
      case Node.EventType.TOUCH_START:
        canvas.off(
          Node.EventType.MOUSE_MOVE,
          this.onMainInputEvent,
          this,
          true
        );
        canvas.on(Node.EventType.TOUCH_MOVE, this.onMainInputEvent, this, true);
        break;
      case Node.EventType.MOUSE_DOWN:
      case Node.EventType.MOUSE_ENTER:
        canvas.off(
          Node.EventType.TOUCH_MOVE,
          this.onMainInputEvent,
          this,
          true
        );
        canvas.on(Node.EventType.MOUSE_MOVE, this.onMainInputEvent, this, true);

        this.onMainInputEvent(event);
        break;
    }
    this.detectInputMode();
  }

  /**
   * 事件: 主輸入操作
   * @param event
   */
  private onMainInputEvent(event: EventMouse | EventTouch) {
    switch (event.type) {
      case Node.EventType.MOUSE_DOWN:
      case Node.EventType.MOUSE_ENTER:
      case Node.EventType.TOUCH_MOVE:
      case Node.EventType.MOUSE_MOVE:
        game.canvas.style.cursor =
          this.isInGameCanvas && this.isHideCursor
            ? 'none'
            : this.isInButton
              ? 'pointer'
              : 'default';
        this.cursorStyle = game.canvas.style.cursor;
        this.inputPosition.set(event.getUILocation());
        EventManager.instance.dispatchEvent(
          GameInputEvent.inputMove,
          this.inputPosition
        );
        break;
    }
  }

  /**
   * 事件: 遊戲畫布輸入操作
   * @param event
   */
  private onCanvasInputEvent(event: EventMouse | EventTouch) {
    switch (event.type) {
      case Node.EventType.MOUSE_ENTER:
        game.canvas.style.cursor = this.isHideCursor ? 'none' : 'default';
        this.isInGameCanvas = true;
        this.isInButton = false;
        break;
      case Node.EventType.MOUSE_LEAVE:
        game.canvas.style.cursor = this.isInButton ? 'pointer' : 'default';
        this.isInGameCanvas = false;
        break;
    }

    // 如果游標樣式變更，發出更新事件給平台
    if (this.cursorStyle !== game.canvas.style.cursor) {
      this.cursorStyle = game.canvas.style.cursor;
      PlatformEventNotifier.setCursor(this.cursorStyle);
    }

    this.detectInputMode();
  }

  /**
   * 事件: 按鈕滑鼠操作
   * @param style
   */
  private onButtonMouseEvent(event: CCEvent) {
    switch (event.type) {
      case Node.EventType.MOUSE_ENTER:
        game.canvas.style.cursor =
          this.isInGameCanvas && this.isHideCursor ? 'none' : 'pointer';
        this.isInButton = true;
        break;
      case Node.EventType.MOUSE_LEAVE:
        game.canvas.style.cursor =
          this.isInGameCanvas && this.isHideCursor ? 'none' : 'default';
        this.isInButton = false;
        break;
    }
    this.detectInputMode();
  }

  /**
   * 偵測輸入模式 延遲一幀後發出滑鼠或觸控事件
   */
  private detectInputMode() {
    director.once(Director.EVENT_AFTER_UPDATE, () => {
      const isMouseMode: boolean =
        Date.now() - this.mouseEventTs < INPUT_MODE_DETECT_INTERVAL;
      //傳出滑鼠或觸控事件
      EventManager.instance.dispatchEvent(
        isMouseMode ? GameInputEvent.MouseEvent : GameInputEvent.TouchEvent
      );
    });
  }
}
