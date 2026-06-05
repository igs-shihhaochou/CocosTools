import {_decorator, Component} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
const {ccclass} = _decorator;

import {SlotUIBtnEvent} from 'db://assets/SlotCommon/Components/SlotDownBar/Scripts/Buttons/SlotUIBtnEvent';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';

import {SlotUIBtnType} from 'db://assets/SlotCommon/Components/SlotDownBar/Scripts/Buttons/SlotUIBtnType';
import {SlotUIEvent} from 'db://assets/SlotCommon/Components/SlotDownBar/Scripts/Define/SlotUIEvent';

@ccclass('InfoOnView')
export default class InfoOnView extends Component {
  private isPanelShowing = false; //說明頁是否已開啟，用於阻擋連續點擊

  protected onLoad(): void {
    SlotGDK.instance.eventSceneIsReady.insert(this.onSceneIsReady, this);
  }

  private onSceneIsReady() {
    if (!PlatformData.licenseSetting.infoOnView) {
      this.disableButton();
      SlotGDK.event(SlotUIEvent.SetBtnActive).notify(
        SlotUIBtnType.InfoOnView,
        false
      );
    } else {
      SlotGDK.instance.eventReadyToSpin.insert(this.enableButton, this); //等待Spin時 開啟按鈕
      SlotGDK.instance.eventSpin.insert(this.disableButton, this); //Spin時 關閉按鈕
      SlotGDK.instance.eventSpecialGameStarted.insert(this.disableButton, this); //特別遊戲開始時 關閉按鈕
      //this.bottomBar.closeMainMenuButtonClicked.Insert(this.onPanelClose, this);//關閉主選單時 開啟按鈕
      SlotGDK.event(SlotUIEvent.PanelClosed).insert(this.onPanelClose, this);
      SlotGDK.event(SlotUIBtnEvent.InfoClicked).insert(
        this.onClickButton,
        this
      ); //關閉設置時 開啟按鈕
    }
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventSceneIsReady.remove(this.onSceneIsReady, this);
    SlotGDK.instance.eventReadyToSpin.remove(this.enableButton, this);
    SlotGDK.instance.eventSpin.remove(this.disableButton, this);
    SlotGDK.instance.eventSpecialGameStarted.remove(this.disableButton, this);
    //this.bottomBar.closeMainMenuButtonClicked.Remove(this.onPanelClose, this);
    SlotGDK.event(SlotUIEvent.PanelClosed).remove(this.onPanelClose, this);
    SlotGDK.event(SlotUIBtnEvent.InfoClicked).remove(this.onClickButton, this); //關閉設置時 開啟按鈕
  }

  public onClickButton() {
    // this.button.interactable = false;
    SlotGDK.event(SlotUIEvent.SetBtnActive).notify(
      SlotUIBtnType.InfoOnView,
      false
    );
    SlotGDK.event(SlotUIEvent.SetBtnInteractable).notify(
      SlotUIBtnType.InfoOnView,
      false
    );
    this.isPanelShowing = true;
  }

  private disableButton() {
    //this.button.interactable = false;
    // SlotGDK.event(SlotUIEvent.SetBtnActive).notify(
    //     SlotUIBtnType.InfoOnView,
    //     false
    // );
    SlotGDK.event(SlotUIEvent.SetBtnInteractable).notify(
      SlotUIBtnType.InfoOnView,
      false
    );
  }

  private enableButton() {
    if (this.isPanelShowing || PlatformData.instance.autospin) return;
    //this.button.interactable = true;
    // SlotGDK.event(SlotUIEvent.SetBtnActive).notify(
    //     SlotUIBtnType.InfoOnView,
    //     true
    // );
    SlotGDK.event(SlotUIEvent.SetBtnInteractable).notify(
      SlotUIBtnType.InfoOnView,
      true
    );
  }

  private onPanelClose() {
    this.isPanelShowing = false;
    //this.button.interactable = true;
    SlotGDK.event(SlotUIEvent.SetBtnActive).notify(
      SlotUIBtnType.InfoOnView,
      true
    );
    SlotGDK.event(SlotUIEvent.SetBtnInteractable).notify(
      SlotUIBtnType.InfoOnView,
      true
    );
  }
}
