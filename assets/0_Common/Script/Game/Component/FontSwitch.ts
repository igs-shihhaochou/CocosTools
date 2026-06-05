import {_decorator, Component, Label, Font} from 'cc';
const {ccclass, property, menu} = _decorator;

/** 預設Font狀態列舉 */
export enum enumFontType {
  TYPE_0,
  TYPE_1,
  TYPE_2,
  TYPE_3,
  TYPE_4,
  TYPE_5,
  TYPE_6,
  TYPE_7,
  TYPE_8,
  TYPE_9,
}
/**
 * Font切換組件
 * 供Font依自定義狀態切換至對應的Font
 */

@ccclass('FontSwitch')
@menu('0_Common/Game/Component/FontSwitch')
export default class FontSwitch extends Component {
  /** 文字 */
  @property(Label)
  private label: Label = null;
  /** 字體列表 */
  @property([Font])
  private fontList: Font[] = [];
  /**
   * 變更字體
   * @param type 指定的字體
   */
  public changeFont(type: enumFontType) {
    if (this.label) this.label.font = this.fontList[type];
  }
  /**
   * 取得Label
   */
  public get Label(): Label {
    return this.label;
  }
}
