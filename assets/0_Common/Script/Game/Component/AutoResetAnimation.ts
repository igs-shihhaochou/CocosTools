import {_decorator, Component, Animation} from 'cc';
const {ccclass, requireComponent, menu} = _decorator;

@ccclass('AutoResetAnimation')
@menu('0_Common/Game/Component/AutoResetAnimation')
@requireComponent(Animation)
export default class AutoResetAnimation extends Component {
  private _animation: Animation | null = null;
  onLoad() {
    this._animation = this.getComponent(Animation);
  }

  onEnable() {
    this._animation?.play();
  }
  onDisable() {
    this._animation?.stop();
  }
}
