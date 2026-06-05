import {_decorator, Component, director} from 'cc';
const {ccclass, menu} = _decorator;

/**
 * 防止物件切換場景被銷毀的組件
 * 會在切換場景後加入至根節點
 */

@ccclass('DontDestroy')
@menu('0_Common/Game/Component/DontDestroy')
export default class DontDestroy extends Component {
  onLoad() {
    director.addPersistRootNode(this.node);
  }
}
