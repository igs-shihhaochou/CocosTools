import {
  _decorator,
  Button,
  Color,
  Component,
  EventHandler,
  Label,
  Node,
  Size,
  UITransform,
} from 'cc';
import Functions from '../../../../../CommonModule/Script/Utility/Functions';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {setWidth} from 'db://assets/CommonModule/Script/Utility/NodeProperty';
const {ccclass, property} = _decorator;

enum FontSize {
  LARGE = 56,
  SMALL = 47,
}

enum TextLabelWidth {
  LARGE = 190,
  SMALL = 95,
}

@ccclass('PickerOption')
export class PickerOption extends Component {
  @property(Label)
  private label: Label = null;
  @property(Node)
  private normalBG: Node = null;
  @property(Node)
  private brightBG: Node = null;

  @property(Size)
  private largeSize: Size = new Size(240, 120);
  @property(Size)
  private smallSize: Size = new Size(124, 80);
  private _selected = false;
  private _value = 0;
  private selectedTextColor = new Color(134, 81, 0);
  private unselectedTextColor = new Color(255, 255, 255);
  private _callback: Function = null;
  private _index = -1;
  public usePlatformSetting = false;
  private button: Button = null;
  private useLargeIcon = false;

  protected onLoad(): void {
    this.selected = false;
    this.button = this.node.addComponent(Button);
    const clickHandler = new EventHandler();
    clickHandler.target = this.node;
    clickHandler.component = 'PickerOption';
    clickHandler.handler = 'onTouch';
    this.button.clickEvents.push(clickHandler);
    this.button.interactable = true;
    this.setIconSize();
  }

  protected onEnable(): void {
    if (this.useLargeIcon) {
      this.setIconSize();
    }
  }

  public enableLargeIcon() {
    this.useLargeIcon = true;
    this.setIconSize();
  }

  private setFontSize() {
    if (this.label.string === '∞') {
      return;
    }
    if (this.useLargeIcon) {
      this.label.fontSize = PlatformData.isLandscape
        ? FontSize.SMALL
        : FontSize.LARGE;
      setWidth(
        this.label.node,
        PlatformData.isLandscape ? TextLabelWidth.SMALL : TextLabelWidth.LARGE
      );
    } else {
      this.label.fontSize = FontSize.SMALL;
      setWidth(this.label.node, TextLabelWidth.SMALL);
    }
  }

  private setIconSize() {
    const size = this.useLargeIcon ? this.largeSize : this.smallSize;
    this.node.getComponent(UITransform).setContentSize(size);
    this.normalBG.getComponent(UITransform).setContentSize(size);
    this.brightBG.getComponent(UITransform).setContentSize(size);
    this.setFontSize();
  }

  public set index(value: number) {
    this._index = value;
  }

  public get index() {
    return this._index;
  }

  public set value(value: number) {
    this._value = value;
    if (this._value < 0) {
      this.label.string = '∞';
      this.label.fontSize = 100;
    } else {
      this.setFontSize();
      this.label.string = this.usePlatformSetting
        ? Functions.formatNumberWithPlatformData(value, true, true)
        : value.toString();
    }
  }

  public set selected(value: boolean) {
    this._selected = value;
    this.label.color = value
      ? this.selectedTextColor
      : this.unselectedTextColor;
    this.brightBG.active = value;
    this.setIconSize();
  }

  public get selected() {
    return this._selected;
  }

  public setClickCallback(callback: (index: number) => void) {
    this._callback = callback;
  }

  private onTouch() {
    this.selected = !this._selected;
    if (this._callback) {
      this._callback(this._index);
    }
  }
}
