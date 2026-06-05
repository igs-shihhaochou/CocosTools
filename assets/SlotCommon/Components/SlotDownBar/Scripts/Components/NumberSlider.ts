import {
  _decorator,
  Component,
  EditBox,
  ProgressBar,
  Slider,
  macro,
  Color,
  Node,
} from 'cc';
import {HoldingBtn} from './HoldingBtn';
import {setScale} from '../../../../../CommonModule/Script/Utility/NodeProperty';
const {ccclass, property} = _decorator;
macro.ENABLE_MULTI_TOUCH = false;

export type NumberSliderData = {
  min: number;
  max: number;
  section: number;
  currentValue: number;
  isMultiplyer: boolean;
};

@ccclass('NumberSlider')
export class NumberSlider extends Component {
  @property(ProgressBar)
  private progressBar: ProgressBar = null;
  @property(Slider)
  private slider: Slider = null;
  @property(EditBox)
  private editbox: EditBox = null;
  @property(HoldingBtn)
  private plusBtn: HoldingBtn = null;
  @property(HoldingBtn)
  private minusBtn: HoldingBtn = null;
  @property(Node)
  private sliderHandle: Node = null;

  private activeColor: Color = new Color(115, 175, 230, 255);

  private _section = 1;

  private _value = null;

  private _max = 0;

  private _min = 0;

  private sectionArr: number[] = [];

  private _isMultiplyer = false;

  public get step() {
    return this._max / this._section;
  }

  public get max() {
    return this._max;
  }

  public get isMultiplyer() {
    return this._isMultiplyer;
  }

  public get value() {
    return this._value;
  }

  public set value(value: number) {
    if (this._max === 0) {
      console.warn('NumberSlider : max value is 0', this.node);
      return;
    }
    if (value > this._max) {
      this._value = this._max;
    } else if (value < this._min && value > 0) {
      this._value = this._min;
    } else {
      this._value = value;
    }
    this.slider.progress = this.progress;
    this.progressBar.progress = this.progress;
    if (this._value === 0) {
      this.editbox.string = 'Off';
      this.editbox.textLabel.color = Color.GRAY;
    } else {
      this.editbox.string = `${this._isMultiplyer ? 'x' : ''}${this._value}`;
      this.editbox.textLabel.color = this.activeColor;
    }
    this.setBtnInteractable();
  }

  public get progress() {
    return this._value / this._max;
  }

  protected onLoad(): void {
    this.registerBtnEvent(true);
    this.slider.handle.node.on(
      Node.EventType.TOUCH_START,
      this.onTouchStart,
      this
    );
    this.slider.handle.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.slider.handle.node.on(
      Node.EventType.TOUCH_CANCEL,
      this.onTouchEnd,
      this
    );
  }

  private onTouchStart() {
    this.editbox.textLabel.fontSize = 30;
    setScale(this.sliderHandle, 1.3);
  }

  private onTouchEnd() {
    this.editbox.textLabel.fontSize = 22;
    setScale(this.sliderHandle, 0.74);
  }

  protected onDestroy(): void {
    this.registerBtnEvent(false);
  }

  private registerBtnEvent(options: boolean) {
    const func = options ? 'insert' : 'remove';
    this.plusBtn.onTouch[func](this.plus, this);
    this.plusBtn.onHold[func](this.plus, this);
    this.minusBtn.onTouch[func](this.minus, this);
    this.minusBtn.onHold[func](this.minus, this);
  }

  public init(data: NumberSliderData) {
    const {min, max, section, currentValue} = data;
    this._min = min;
    this._max = max;
    this._section = section;
    this._isMultiplyer = data.isMultiplyer;
    this.value = currentValue;
    const step = Math.floor(this._max / this._section);
    for (let i = 0; i <= this._section; i++) {
      this.sectionArr.push(step * i);
    }
    this.setBtnInteractable();
  }

  private setBtnInteractable() {
    this.minusBtn.interactable = this.value > 0;
    this.plusBtn.interactable = this.value < this._max;
  }

  public onSliderChanged() {
    const {progress} = this.slider;
    this.progressBar.progress = progress;
    const val = Math.floor(progress * this._max);

    let sectionCount = 0;
    let temp = val;
    while (temp - this.step >= 0) {
      temp -= this.step;
      sectionCount++;
    }

    this.value = this.sectionArr[sectionCount];
  }

  public editingEnded() {
    const value = parseFloat(this.editbox.string);
    if (isNaN(value)) {
      return;
    }
    this.value = value;
  }

  public plus() {
    this.value += 1;
  }

  public minus() {
    if (this.value - 1 < this._min) {
      this.value = 0;
    } else {
      this.value -= 1;
    }
  }
}
