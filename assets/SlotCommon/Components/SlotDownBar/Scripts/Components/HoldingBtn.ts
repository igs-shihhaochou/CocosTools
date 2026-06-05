import {_decorator, Button, CCBoolean, CCFloat, Node, Sprite} from 'cc';
import {Delegate} from '../../../../../CommonModule/Script/ExtraType';
const {ccclass, property} = _decorator;

@ccclass('HoldingBtn')
export class HoldingBtn extends Button {
  @property(CCFloat)
  protected holdThreshold = 1;
  @property(CCBoolean)
  protected isTouching = false;
  protected touchStartTime: Date = null;
  protected _eventRegistered = false;

  public set interactable(value: boolean) {
    if (this._interactable === value) {
      return;
    }

    this._interactable = value;
    this._updateState();

    if (!this._interactable) {
      this._resetState();
    }
    if (!this._disabledSprite) {
      if (value === false) {
        this.transition = Button.Transition.COLOR;
      } else {
        this.target.getComponent(Sprite).color = this._normalColor;
        this.transition = Button.Transition.SPRITE;
      }
    }
  }

  public onTouch: Delegate = new Delegate();
  public onHold: Delegate = new Delegate();

  protected onTouchStart() {
    this.isTouching = true;
    this.touchStartTime = new Date();
    if (this._interactable && this.onTouch.length > 0) {
      this.onTouch.notify();
    }
  }

  protected onTouchHold() {
    if (this.isTouching && this.touchStartTime) {
      const touchHoldTime = new Date();
      const duration =
        (touchHoldTime.getTime() - this.touchStartTime.getTime()) / 1000;
      if (
        duration > this.holdThreshold &&
        this._interactable &&
        this.onHold.length > 0
      ) {
        this.onHold.notify();
      }
    }
  }

  protected onTouchEnd() {
    this.isTouching = false;
    this.touchStartTime = null;
  }

  update(): void {
    if (this.isTouching) {
      this.onTouchHold();
    }
  }

  protected registerEvent(options: boolean) {
    const func = options ? 'on' : 'off';
    this.node[func](Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node[func](Node.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  start(): void {
    this.registerEvent(true);
  }

  onDestroy(): void {
    this.registerEvent(false);
  }
}
