import {_decorator, Component, Label, RichText, CCString} from 'cc';
const {ccclass, property, menu} = _decorator;

import MultiLangHandler from '../Core/MultiLangHandler';
/**
 * 多語系文字工具
 */

@ccclass('UIMultiLang')
@menu('CommonModule/Script/UIComponent/UIMultiLang')
export default class UIMultiLang extends Component {
  @property(CCString)
  public key = '';
  private label: Label | null = null;
  private richText: RichText | null = null;
  protected onLoad(): void {
    this.label = this.node.getComponent(Label);
    this.richText = this.node.getComponent(RichText);
  }
  protected onEnable(): void {
    if (this.key) {
      if (this.label) {
        this.label.string = MultiLangHandler.getGameText(this.key);
      } else if (this.richText) {
        this.richText.string = MultiLangHandler.getGameText(this.key);
      } else {
        console.warn('Without label component!');
      }
    } else {
      console.warn('Need multi language key!');
    }
  }
}
