import {_decorator, Component, Button, Node, UIOpacity, CCBoolean} from 'cc';
import {SlotGDK} from '../../Define/SlotGDK';
import {QuickTipEvent} from './QuickTipEvent';
import BQLogger from 'db://assets/CommonModule/Script/Log/BQLog/BQLogger';

const {ccclass, property} = _decorator;

@ccclass
export default class QuickTipButton extends Component {
  @property(Button)
  private button: Button = null;
  @property(CCBoolean)
  private hideWhenInteractableFalse = false;
  @property(CCBoolean)
  private hideWhenSpecialGameStarted = false;

  private isPanelShowing = false;
  private specialGamePlaying = false;
  private uiOpacity: UIOpacity = null;

  protected setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    SlotGDK.instance.eventReadyToSpin[func](this.enableButton, this);
    // SlotGDK.instance.eventSpin[func](this.disableButton, this);
    SlotGDK.instance.eventSpecialGameStarted[func](
      this.onSpecialGameStarted,
      this
    );
    SlotGDK.event(QuickTipEvent.quickTipEventClose)[func](
      this.onPanelClose,
      this
    );

    this.node.on(Node.EventType.TOUCH_START, this.onClickButton, this);
  }

  protected onLoad(): void {
    this.setEvents(true);
    this.uiOpacity = this.node.getComponent(UIOpacity);
    if (!this.uiOpacity) {
      this.uiOpacity = this.node.addComponent(UIOpacity);
    }
  }

  protected onDestroy(): void {
    this.setEvents(false);
  }

  public onClickButton() {
    if (!this.button.interactable) {
      return;
    }
    //**BQ埋點 */
    BQLogger.sendClickHint();
    this.button.interactable = false;
    this.isPanelShowing = true;
    SlotGDK.event(QuickTipEvent.quickTipEventOpen).notify();
  }

  private disableButton() {
    this.button.interactable = false;
    if (this.hideWhenInteractableFalse) {
      this.uiOpacity.opacity = 0;
    } else {
      this.uiOpacity.opacity = 125;
    }
  }

  private onSpecialGameStarted() {
    this.specialGamePlaying = true;
    if (this.hideWhenSpecialGameStarted) {
      this.button.interactable = false;
      this.uiOpacity.opacity = 0;
    } else {
      this.uiOpacity.opacity = 125;
    }
  }

  private enableButton() {
    this.specialGamePlaying = false;
    if (this.isPanelShowing) return;
    this.button.interactable = true;
    this.uiOpacity.opacity = 255;
  }

  private onPanelClose() {
    this.isPanelShowing = false;
    if (this.specialGamePlaying && this.hideWhenSpecialGameStarted) {
      this.button.interactable = false;
    } else {
      this.button.interactable = true;
    }
  }
}
