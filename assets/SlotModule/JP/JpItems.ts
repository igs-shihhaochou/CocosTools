import {
  _decorator,
  CCBoolean,
  CCString,
  Color,
  Node,
  Label,
  Animation,
} from 'cc';
import {NumberAnimation} from '../../CommonModule/Script/UIComponent/NumberAnimation';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import Functions from '../../CommonModule/Script/Utility/Functions';
import {
  setColor,
  setOpacity,
} from '../../CommonModule/Script/Utility/NodeProperty';

const {ccclass, property} = _decorator;

export const convertNumText = (value: number) => {
  const {displayDigit, displayRatio} = PlatformData.instance;
  switch (PlatformData.logo) {
    case 'playgd':
    case 'magiccity':
      return Functions.numberFormat(value, 0, true);
    default:
      return Functions.numberFormat(
        value,
        displayDigit,
        true,
        '',
        displayRatio
      );
  }
};

@ccclass('ProtcolSetting')
export class ProtcolSetting {
  @property({displayName: '[封包] baseRate Key'})
  public baseRateKey = '';

  @property({displayName: '[封包] betLevel Key'})
  public betLevelKey = '';

  @property({displayName: '[封包] maxBet Key'})
  public maxBetKey = '';

  @property({displayName: '累加索引'})
  public progressiveLevelNum = 2;
}

@ccclass('JpItem')
export class JpItem {
  @property(Node)
  public root: Node = null;

  @property(Node)
  public frame: Node = null;

  @property(NumberAnimation)
  public label: NumberAnimation = null;

  @property(Node)
  public typeLabel: Node = null;

  public updateActive(show: boolean) {
    this.root.active = show;
  }

  public lockFrame(color: Color) {
    if (!this.frame) this.frame = this.root;
    if (this.frame) setColor(this.frame, color);
    if (this.label.node) setColor(this.label.node, color);
    if (this.typeLabel) setColor(this.typeLabel, color);
  }

  public setNumberToStop(val) {
    this.label.setNumberToStop(val);
  }

  public setTargetNumberAnimationEx(val: number, duration: number) {
    this.label.setTargetNumberAnimationEx(val, duration);
  }
}

@ccclass('JpItemSett')
export class JpItemSett {
  @property(CCBoolean)
  private advacnce = false;

  @property({
    visible: function (this: JpItemSett) {
      return this.advacnce;
    },
  })
  private useLowItem = false;

  @property(JpItem)
  protected normalItem: JpItem = null;

  @property({
    type: JpItem,
    visible: function (this: JpItemSett) {
      return this.useLowItem;
    },
  })
  protected lowItem: JpItem = null;

  @property({
    visible: function (this: JpItemSett) {
      return this.advacnce;
    },
  })
  protected darkColor: Color = new Color(140, 140, 140, 255);
  protected activeColor: Color = new Color(255, 255, 255, 255);

  public isLock = false;
  public useLow = true;

  get currItem() {
    return this.useLow ? this.lowItem : this.normalItem;
  }

  get lock() {
    return this.isLock;
  }

  public lockFrame(lock: boolean) {
    this.normalItem.lockFrame(lock ? this.darkColor : this.activeColor);
    if (!lock && this.isLock) this.unLock();
    if (this.lowItem)
      this.lowItem.lockFrame(lock ? this.darkColor : this.activeColor);
    this.isLock = lock;
  }

  protected unLock() {}

  public updateCurrItem(low: boolean) {
    if (!this.useLowItem || !this.lowItem) {
      this.normalItem.updateActive(true);
      this.useLow = false;
      return;
    }

    if (this.lowItem) this.lowItem.updateActive(low);
    this.normalItem.updateActive(!low);
    this.useLow = low;
  }

  public setNumberToStop(val: number) {
    if (this.lowItem) this.lowItem.setNumberToStop(val);
    this.normalItem.setNumberToStop(val);
  }

  public setTargetNumberAnimationEx(val: number, duration: number) {
    if (this.useLow) {
      if (this.lowItem) this.lowItem.setTargetNumberAnimationEx(val, duration);
      this.normalItem.setNumberToStop(val);
    } else {
      this.normalItem.setTargetNumberAnimationEx(val, duration);
      if (this.lowItem) this.lowItem.setNumberToStop(val);
    }
  }

  public setNumberAnimParam(isMoney: boolean) {
    this.normalItem.label.setIsMoney(isMoney);
    if (this.lowItem) this.lowItem.label.setIsMoney(isMoney);
  }
}

@ccclass('JpHintItem')
export class JpHintItem {
  @property(Node)
  private hintRoot: Node = null;
  @property(Label)
  private hintBet: Label = null;
  @property(CCString)
  private animKey = '';

  public updateHintBet(betLev, maxLine: number) {
    this.hintBet.string = convertNumText(betLev * maxLine) + ' ⬆︎';
  }

  public setOpacity(opacity: number) {
    setOpacity(this.hintRoot, opacity);
  }

  public updateLayout() {
    const anim = this.hintRoot.getComponent(Animation);
    if (anim) {
      console.log('[updateLayout]', anim, this.animKey);
      anim.play(this.animKey);
    }
  }
}

@ccclass('JpHintSett')
export class JpHintSett {
  @property([JpHintItem])
  private hintItemAry: JpHintItem[] = [];

  get length() {
    return this.hintItemAry.length;
  }

  public updateHintBet(betLev: number[], maxLine: number) {
    try {
      for (let i = 1; i < betLev.length; i++) {
        this.hintItemAry[i - 1].updateHintBet(betLev[i - 1], maxLine);
      }
    } catch (error) {
      console.error('[JpHintSett] updateHintBet error:', error);
    }
  }

  public setOpacity(index: number, opacity: number) {
    if (index >= this.hintItemAry.length) return -1;
    this.hintItemAry[index].setOpacity(opacity);
  }

  public updateLayout() {
    for (let i = 0; i < this.hintItemAry.length; i++)
      this.hintItemAry[i].updateLayout();
  }
}
