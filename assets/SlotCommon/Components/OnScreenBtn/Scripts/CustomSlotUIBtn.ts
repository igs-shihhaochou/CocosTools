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
import {CustomSlotUIBtnType} from './CustomSlotUIBtnType';
import {
  CustomSlotUIBtnEvent,
  CustomSlotUIBtnEventNum,
} from './CustomSlotUIBtnEvent';
import {
  setSize,
  setColor,
  getSize,
} from '../../../../CommonModule/Script/Utility/NodeProperty';
import {tweenNodeEx} from '../../../../CommonModule/Script/Utility/TweenUtil';
import {SlotGDK} from '../../../../SlotModule/Define/SlotGDK';
import SoundManager from 'db://assets/CommonModule/Script/Manager/SoundManager';

const {ccclass, property} = _decorator;

export enum CustomSlotUIEvent {
  DisableAllButton = '[SlotUIEvents]DisableAllButton',
  SetBtnActive = '[SlotUIEvents]SetBtnActive',
  SetBtnInteractable = '[SlotUIEvents]SetBtnInteractable',
  Initialize = '[SlotUIEvents]Initialize',
}

@ccclass('CustomSlotUIBtn')
export class CustomSlotUIBtn extends Component {
  @property({type: Enum(CustomSlotUIBtnEventNum), displayName: '按鈕事件'})
  protected eventType: CustomSlotUIBtnEventNum =
    CustomSlotUIBtnEventNum.SpinClicked;
  @property({type: Enum(CustomSlotUIBtnType), displayName: '按鈕類型'})
  protected btnType: CustomSlotUIBtnType = CustomSlotUIBtnType.Spin;
  protected get eventName() {
    return CustomSlotUIBtnEvent[CustomSlotUIBtnEventNum[this.eventType]];
  }
  @property(Node)
  protected btn: Node = null;
  @property(CCBoolean)
  protected hasLabel = false;
  @property({
    type: Label,
    visible: function (this: CustomSlotUIBtn) {
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
    visible: function (this: CustomSlotUIBtn) {
      return this.changeSprite;
    },
  })
  private clickedSpriteFrame: SpriteFrame = null;
  @property({
    type: SpriteFrame,
    visible: function (this: CustomSlotUIBtn) {
      return this.changeSprite;
    },
  })
  private originalSprietFrame: SpriteFrame = null;

  private size: Size = null;
  private button: Button = null;

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
      case CustomSlotUIBtnEventNum.SpinClicked:
        audioName = 'CM_Spin';
        break;
      case CustomSlotUIBtnEventNum.BetConfirmClicked:
      case CustomSlotUIBtnEventNum.QuitConfirmClicked:
      case CustomSlotUIBtnEventNum.AutoSpinConfirmClicked:
        audioName = 'Btn_Select_n_v01';
        break;
      case CustomSlotUIBtnEventNum.BlockerClicked:
        break;
      default:
        audioName = 'SLOT_setting';
    }
    if (audioName !== '') SoundManager.instance.play(audioName);
  }

  protected setActive(type: CustomSlotUIBtnType, option: boolean) {
    if (type === this.btnType && this.btn) {
      this.btn.active = option;
      if (option) {
        setSize(this.node, this.size);
      } else {
        setSize(this.node, new Size(0, 0));
      }
    }
  }

  protected setInteractable(type: CustomSlotUIBtnType, option: boolean) {
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
    clickHandler.component = 'CustomSlotUIBtn';
    clickHandler.handler = 'onTouchStart';
    this.button.clickEvents.push(clickHandler);
    SlotGDK.event(CustomSlotUIEvent.SetBtnActive).insert(this.setActive, this);
    SlotGDK.event(CustomSlotUIEvent.SetBtnInteractable).insert(
      this.setInteractable,
      this
    );
    this.button.interactable = true;
    this.size = getSize(this.node).clone();
  }

  onDestroy(): void {
    SlotGDK.event(CustomSlotUIEvent.SetBtnActive).remove(this.setActive, this);
    SlotGDK.event(CustomSlotUIEvent.SetBtnInteractable).remove(
      this.setInteractable,
      this
    );
  }
}
