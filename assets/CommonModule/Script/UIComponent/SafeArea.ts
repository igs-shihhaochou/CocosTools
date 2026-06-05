import {_decorator, Component, type Size, UITransform, view} from 'cc';
import {PlatformData} from '../Define/PlatformData';
import EventManager from '../Manager/EventManager';

const {ccclass} = _decorator;

@ccclass
export default class SafeArea extends Component {
  protected onLoad(): void {
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.updateObjSize.bind(this)
    );
    this.updateObjSize();
  }

  protected onDestroy(): void {
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.updateObjSize.bind(this)
    );
  }

  public updateObjSize(): void {
    const size: Size = view.getDesignResolutionSize();
    const transform = this.node?.getComponent(UITransform);
    transform?.setContentSize(size);
  }
}
