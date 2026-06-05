import {_decorator, Component} from 'cc';
import {MessagePopup} from './MessagePopup';

const {ccclass, property} = _decorator;

@ccclass
export class PopupRoot extends Component {
  @property(MessagePopup)
  public messagePopup: MessagePopup = null; ////顯示共用訊息的Popup
}
