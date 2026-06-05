import {_decorator, Component, Node, Label, Sprite, Color, Vec3} from 'cc';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
const {ccclass, property} = _decorator;

@ccclass
export default class FreeGameTimeCtrl extends Component {
  @property(Node)
  private freeGameBar: Node = null;
  @property(Label)
  private currentFGNumLabel: Label = null;
  @property(Label)
  private totalFGNumLabel: Label = null;
  @property(Sprite)
  private freeGameBarSprite: Sprite = null;

  protected onLoad(): void {
    this.freeGameBarSprite = this.freeGameBar.getComponent(Sprite);
    if (!this.freeGameBarSprite) {
      this.freeGameBarSprite = this.freeGameBar.addComponent(Sprite);
    }
    this.freeGameBarSprite.color = new Color(255, 255, 255, 0);
    this.setEvents(true);
    SlotGDK.instance.totalFreeSpinLabelNode = this.totalFGNumLabel.node;
  }

  protected onEnable(): void {
    console.error('[FreeGameTimeCtrl] onEnable');
  }

  protected onDisable(): void {
    console.error('[FreeGameTimeCtrl] onDisable');
  }

  protected onDestroy(): void {
    this.setEvents(false);
  }

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    const e = SlotGDK.instance;
    e.eventSetFreeGameBarSpinTimes[func](this.setFreeGameBarSpinTimes, this);
    e.eventActiveFreeGameBar[func](this.activeFreeGameBar, this);
    e.eventSetFreeGameBarPosition[func](this.setFreeGameBarPosition, this);
  }

  public activeFreeGameBar(isActive: boolean) {
    if (this.freeGameBarSprite) {
      this.freeGameBarSprite.color = new Color(
        255,
        255,
        255,
        isActive ? 255 : 0
      );
    }
  }

  //設定FreeGameBar的次數
  public setFreeGameBarSpinTimes(CurrentSpin: number, TotalSpin: number): void {
    this.currentFGNumLabel.string = CurrentSpin.toString();
    this.totalFGNumLabel.string = TotalSpin.toString();
  }

  //設定FreeGameBar的位置
  public setFreeGameBarPosition(position: Vec3): void {
    this.freeGameBar.setPosition(position.x, position.y, 0);
  }
}
