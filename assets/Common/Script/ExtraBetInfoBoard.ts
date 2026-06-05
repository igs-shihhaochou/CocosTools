import {_decorator, Component, Node, Animation} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';

const {ccclass, property} = _decorator;

@ccclass
export default class ExtraBetInfoBoard extends Component {
  @property(Node)
  private root: Node = null;
  @property(Animation)
  private anim: Animation = null;

  @property({type: Node, displayName: '打勾的那個勾勾'})
  private dontShowAgainIconNode: Node = null;

  /**按下OK後的回傳(參數:是否不再顯示) */
  private isClicked = false;

  protected onLoad() {
    this.root.active = false;
    SlotGDK.instance.Event_ShowExtraBetPopup.Insert(this.ShowInfo, this);
  }

  protected onDestroy() {
    SlotGDK.instance.Event_ShowExtraBetPopup.Remove(this.ShowInfo, this);
  }

  protected ShowInfo(isDontShowAgain = false) {
    console.warn('SSS show info', isDontShowAgain);
    if (this.root.active) return;

    this.root.active = true;
    this.isClicked = false;
    this.dontShowAgainIconNode.active = isDontShowAgain;

    this.anim.play(this.anim.defaultClip.name);
    this.PlayAppearAudio();
  }

  public OnClickDontShowAgain() {
    this.dontShowAgainIconNode.active = !this.dontShowAgainIconNode.active;
  }

  public OnClickOK() {
    if (this.isClicked) return;
    this.isClicked = true;
    console.log('%cOnClickOK ' + this.root.active, 'font-size:32px;');
    this.PlayCloseAudio();

    //BrowserUtility.SetGameBrowserData("extra_bet_info_dont_show", (this.dontShowAgainIconNode.active) ? "1" : "0");

    //調整規格 按下OK即為開啟ExtraBet 2023/11/01
    if (!PlatformData.instance.isExtraBet) {
      PlatformData.instance.isExtraBet = true;
      if (SlotGDK.instance.Event_ClickExtraBet.Length > 0) {
        SlotGDK.instance.Event_ClickExtraBet.Notify(
          PlatformData.instance.isExtraBet
        );
      }
    }

    // 按下OK後的回傳(參數:是否不再顯示)
    if (SlotGDK.instance.Event_CloseExtraBetPopup.Length > 0)
      SlotGDK.instance.Event_CloseExtraBetPopup.Notify(
        this.dontShowAgainIconNode.active
      );
    this.root.active = false;
  }

  private PlayAppearAudio() {
    SlotGameMediator.instance.audioManager.play('extra_board_open', false, 1);
  }

  private PlayCloseAudio() {
    SlotGameMediator.instance.audioManager.play('extra_board_close', false, 1);
  }

  /**讀取Cookie */
  // public GetCookie(cookieKey: string): string {
  //     cookieKey = UserInfo.Instance.nickName + "_" + PlatformData.Instance.gameId + "_" + cookieKey;
  //     let value: string = "";
  //     if (JSUtility.IsSupportLocalStorage()) {
  //         value = localStorage.getItem(cookieKey);
  //     } else if (JSUtility.IsSupportCookie()) {
  //         value = JSUtility.GetCookie(cookieKey);
  //     }
  //     return value;
  // }
}
