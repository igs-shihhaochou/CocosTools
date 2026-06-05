import {_decorator, Component, Label} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import Functions from '../../CommonModule/Script/Utility/Functions';

const {ccclass, property} = _decorator;

export enum ClickOKHandle {
  None,
  RestartGame,
  CloseWeb,
}

@ccclass
export class MessagePopup extends Component {
  @property(Label)
  private messageLabel: Label = null;

  @property(Label)
  private subMessageLabel: Label = null;

  private clickOkBtnHandle: ClickOKHandle = ClickOKHandle.None;

  public ShowMessagePopup(
    text: string,
    subText: string,
    clickOkBtnHandle: ClickOKHandle
  ) {
    this.messageLabel.string = text;
    this.subMessageLabel.string = subText;
    this.clickOkBtnHandle = clickOkBtnHandle;

    this.node.active = true;
  }

  //按下確認按鈕
  private OnClickOkBtn() {
    this.node.active = false;

    //   2023/07/12 因應Macross，調整為一律關閉遊戲不做刷新
    if (
      this.clickOkBtnHandle === ClickOKHandle.RestartGame ||
      this.clickOkBtnHandle === ClickOKHandle.CloseWeb
    ) {
      Functions.closeGame(PlatformData.isMute);
    }

    // if (this.clickOkBtnHandle === ClickOKHandle.RestartGame) {

    //     director.loadScene(director.getScene().name);
    // } else if (this.clickOkBtnHandle === ClickOKHandle.CloseWeb) {

    //     Functions.closeGame(PlatformData.IsMute);
    // }
  }
}
