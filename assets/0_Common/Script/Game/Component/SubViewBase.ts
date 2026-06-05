import {_decorator, Component, Node} from 'cc';
import InputManager from '../../../../CommonModule/Script/Manager/InputManager';

const {ccclass, menu, property} = _decorator;

/**
 * 子畫面
 */

@ccclass('SubViewBase')
@menu('0_Common/Game/Component/SubViewBase')
export default class SubViewBase extends Component {
  @property(Node)
  private root: Node = null;
  protected start(): void {
    this.hide();
  }

  onDestroy() {
    this.release();
  }
  /**
   * 初始化SubViewBase
   */
  public init() {
    //預設隱藏
    this.hide();
    //設置按鈕游標狀態
    InputManager.instance.setButtonsCursor(this.node);
  }
  /**
   * 釋放SubViewBase資源
   */
  public release() {}
  /**
   * 顯示
   */
  public display() {
    if (this.root) this.root.active = true;
    else this.node.active = true;
  }
  /**
   * 關閉
   */
  public hide() {
    if (this.root) this.root.active = false;
    else this.node.active = false;
  }
}
