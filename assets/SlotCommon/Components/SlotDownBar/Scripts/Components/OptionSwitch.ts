import {_decorator, Button, Component, EventHandler, Node} from 'cc';
import {Delegate} from '../../../../../CommonModule/Script/ExtraType';
const {ccclass, property} = _decorator;

@ccclass('OptionSwitch')
export class OptionSwitch extends Component {
  @property(Node)
  private onNode: Node = null;
  @property(Node)
  private offNode: Node = null;
  private button: Button = null;
  public onSelectedChanged: Delegate = new Delegate();

  private _selected = false;

  protected onLoad(): void {
    this.button = this.node.addComponent(Button);
    const clickHandler = new EventHandler();
    clickHandler.target = this.node;
    clickHandler.component = 'OptionSwitch';
    clickHandler.handler = 'onTouch';
    this.button.clickEvents.push(clickHandler);
    this.button.interactable = true;
  }

  private onTouch() {
    this.selected = !this.selected;
  }

  public set selected(value: boolean) {
    this._selected = value;
    this.onNode.active = value;
    this.offNode.active = !value;
    this.onSelectedChanged.notify(this.selected);
  }

  public get selected() {
    return this._selected;
  }
}
