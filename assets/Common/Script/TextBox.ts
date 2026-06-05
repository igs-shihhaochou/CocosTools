import {_decorator, Component, Label, Sprite, SpriteFrame} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('TextBox')
export class TextBox extends Component {
  @property(Label)
  protected label: Label | null = null;
  @property(Sprite)
  protected bg: Sprite | null = null;
  @property(SpriteFrame)
  public selectSprite: SpriteFrame | null = null;
  @property(SpriteFrame)
  public unSelectSprite: SpriteFrame | null = null;
  //set text content
  public setText(text: string) {
    this.label.string = text;
  }
  //get text content
  public getText(): string {
    return this.label.string;
  }
  //set selection status
  public setSelection(selection: boolean) {
    this.bg.spriteFrame = selection ? this.selectSprite : this.unSelectSprite;
  }
}
