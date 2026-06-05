import {_decorator, Component, Button} from 'cc';
import {setScale} from '../Utility/NodeProperty';
const {ccclass, property} = _decorator;

@ccclass('SyncButton')
export default class SyncButton extends Component {
  @property(Button)
  private targetButton: Button | null = null;
  private selfButton: Button | null = null;
  protected onLoad(): void {
    if (!this.targetButton) {
      console.error('targetButton is null');
      this.destroy();
      return;
    }
    if (!this.selfButton) {
      this.selfButton = this.getComponent(Button);
    }
    this.selfButton.clickEvents = this.targetButton.clickEvents;
    this.setScale();
  }
  private setScale() {
    setScale(
      this.selfButton.node,
      this.targetButton.node.active && this.targetButton.interactable ? 1 : 0
    );
  }
  protected update(): void {
    this.setScale();
  }
}
