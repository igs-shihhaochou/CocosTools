import {_decorator, Component, Sprite, Node, Animation, type Vec3} from 'cc';
import OddsLabel from './OddsLabel';

const {ccclass, property} = _decorator;

@ccclass
export default class OddsTableItem extends Component {
  @property(Sprite)
  public symbolSprite: Sprite = null;

  @property(Node)
  public symbolMask: Node = null;

  @property(Node)
  public oddsLabelLayout: Node = null;

  @property(Animation)
  public symbolBingoAnimation: Animation = null;

  private _symbolID: number = null;

  public oddsLabels: OddsLabel[] = [];

  private originalScale: Vec3 = null;

  protected onLoad() {
    this.originalScale = this.symbolSprite.node.scale;
  }

  set symbolID(id: number) {
    this._symbolID = id;
  }

  get symbolID() {
    return this._symbolID;
  }

  public playSymbolBingoAnimation() {
    if (this.symbolBingoAnimation !== null) {
      this.symbolBingoAnimation.play();
    }
  }

  public setMask(active: boolean) {
    this.symbolMask.active = active;
  }

  public stopSymbolBingoAnimation() {
    if (this.symbolBingoAnimation !== null) {
      this.symbolBingoAnimation.stop();
      this.symbolSprite.node.angle = 0;
      this.symbolSprite.node.scale = this.originalScale;
    }
  }
}
