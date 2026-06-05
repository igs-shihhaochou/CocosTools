import {
  _decorator,
  Button,
  CCBoolean,
  Color,
  Component,
  Enum,
  EventHandler,
  Label,
  Node,
  Size,
  Sprite,
  SpriteFrame,
  tween,
  Tween,
} from 'cc';
import {SlotUIBtnEvent, SlotUIBtnEventNum} from './SlotUIBtnEvent';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {SlotUIBtnType} from './SlotUIBtnType';
import {SlotUIEvent} from '../Define/SlotUIEvent';
import {
  getSize,
  setColor,
  setSize,
} from '../../../../../CommonModule/Script/Utility/NodeProperty';
import {tweenNodeEx} from '../../../../../CommonModule/Script/Utility/TweenUtil';
import SoundManager from 'db://assets/CommonModule/Script/Manager/SoundManager';
const {ccclass, property} = _decorator;

@ccclass('SlotUIBtn')
export class SlotUIBtn extends Component {
  @property({type: Enum(SlotUIBtnEventNum), displayName: '按鈕事件'})
  protected eventType: SlotUIBtnEventNum = SlotUIBtnEventNum.SpinClicked;
  @property({type: Enum(SlotUIBtnType), displayName: '按鈕類型'})
  protected btnType: SlotUIBtnType = SlotUIBtnType.Spin;
  protected get eventName() {
    return SlotUIBtnEvent[SlotUIBtnEventNum[this.eventType]];
  }
  @property(Node)
  protected btn: Node = null;
  @property(CCBoolean)
  protected hasLabel = false;
  @property({
    type: Label,
    visible: function (this: SlotUIBtn) {
      return this.hasLabel;
    },
  })
  protected label: Label = null;
  @property(CCBoolean)
  private zoom = true;
  @property(CCBoolean)
  private setGray = true;
  @property(CCBoolean)
  private changeSprite = false;
  @property({
    type: SpriteFrame,
    visible: function (this: SlotUIBtn) {
      return this.changeSprite;
    },
  })
  private clickedSpriteFrame: SpriteFrame = null;
  @property({
    type: SpriteFrame,
    visible: function (this: SlotUIBtn) {
      return this.changeSprite;
    },
  })
  private originalSprietFrame: SpriteFrame = null;
  private button: Button = null;

  protected _interactable = true;
  private size: Size = null;
  protected onTouchStart() {
    console.log('BarBtn.onTouchStart:', this.eventName);
    this.playAudio();
    SlotGDK.event(this.eventName).notify();
    Tween.stopAllByTarget(this.node);
    if (this.zoom) {
      tweenNodeEx(this.node)
        .to(0.05, {scale: 1.1})
        .to(0.05, {scale: 1.0})
        .start();
    }
    if (this.changeSprite) {
      tween(this.btn.getComponent(Sprite))
        .set({spriteFrame: this.clickedSpriteFrame})
        .delay(0.1)
        .set({spriteFrame: this.originalSprietFrame})
        .start();
    }
  }

  protected playAudio() {
    let audioName = '';
    switch (this.eventType) {
      case SlotUIBtnEventNum.SpinClicked:
        audioName = 'CM_Spin';
        break;
      case SlotUIBtnEventNum.BetConfirmClicked:
      case SlotUIBtnEventNum.QuitConfirmClicked:
      case SlotUIBtnEventNum.AutoSpinConfirmClicked:
        audioName = 'Btn_Select_n_v01';
        break;
      case SlotUIBtnEventNum.BlockerClicked:
        break;
      default:
        audioName = 'SLOT_setting';
    }
    if (audioName !== '') SoundManager.instance.play(audioName);
  }

  protected setActive(type: SlotUIBtnType, option: boolean) {
    if (type === this.btnType && this.btn) {
      this.btn.active = option;
      if (option) {
        setSize(this.node, this.size);
      } else {
        setSize(this.node, new Size(0, 0));
      }
    }
  }
  protected setInteractable(type: SlotUIBtnType, option: boolean) {
    if (type === this.btnType) {
      if (this.button.interactable === option) {
        return;
      }
      this.button.interactable = option;
      if (this.setGray) {
        setColor(this.btn, option ? Color.WHITE : Color.GRAY);
        if (this.hasLabel) {
          this.label.color = option ? Color.WHITE : Color.GRAY;
        }
      }
    }
  }

  onLoad() {
    if (!this.btn) {
      console.warn(
        'BarBtn.onLoad: btn is null',
        'eventName:',
        this.eventName,
        'node:',
        this.node
      );
      return;
    }

    this.button = this.btn.addComponent(Button);
    const clickHandler = new EventHandler();
    clickHandler.target = this.node;
    clickHandler.component = 'SlotUIBtn';
    clickHandler.handler = 'onTouchStart';
    this.button.clickEvents.push(clickHandler);
    SlotGDK.event(SlotUIEvent.SetBtnActive).insert(this.setActive, this);
    SlotGDK.event(SlotUIEvent.SetBtnInteractable).insert(
      this.setInteractable,
      this
    );
    this.button.interactable = true;
    this.size = getSize(this.node).clone();
  }

  onDestroy(): void {
    SlotGDK.event(SlotUIEvent.SetBtnActive).remove(this.setActive, this);
    SlotGDK.event(SlotUIEvent.SetBtnInteractable).remove(
      this.setInteractable,
      this
    );
  }
}
