import {_decorator, Component, Animation, EventHandler, CCString} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('AnimationAutoPlay')
export default class AnimationAutoPlay extends Component {
  @property(Animation)
  private animation: Animation = null;
  @property(CCString)
  private animationName = '';
  @property([EventHandler])
  private completeEventAry: EventHandler[] = [];
  private _compelteFunctionAry: Function[] = [];
  ///物件被打開時
  public onEnable() {
    this._playAnim();
  }
  protected onDisable(): void {
    this._playAnim();
  }
  private _playAnim() {
    if (!this.animation) return;
    if (this.animationName.length === 0)
      this.animationName = this.animation.defaultClip.name;
    this.animation.play(this.animationName);
    this.animation.on(
      Animation.EventType.FINISHED,
      this.onAnimPlayComplete.bind(this)
    );
  }
  //    /**程式碼加入結束事件 */
  public addCompleteEvent(callback: Function) {
    this._compelteFunctionAry.push(callback);
  }
  public onAnimPlayComplete() {
    for (let i = 0; i < this._compelteFunctionAry.length; i++) {
      this._compelteFunctionAry[i]();
    }
    Component.EventHandler.emitEvents(this.completeEventAry);
  }
}
