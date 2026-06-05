import {_decorator, Component, Label, Color, Node, Animation} from 'cc';
import {setColor} from '../../../CommonModule/Script/Utility/NodeProperty';

const {ccclass, property} = _decorator;

@ccclass
export default class OddsLabel extends Component {
  @property(Label)
  public oddsLabel: Label = null;

  @property(Node)
  private mask: Node = null;

  @property(Animation)
  public labelAnimation: Animation = null;

  public setLabelValue(oddsValue: number) {
    if (this.oddsLabel !== null) {
      this.oddsLabel.string = oddsValue.toString();
    } else {
      console.error('oddsLabelMissing');
    }
  }

  public setMask(active: boolean) {
    this.mask.active = active;
  }

  public playOddsLabelBingoAnime() {
    if (this.labelAnimation !== null) {
      this.labelAnimation.play();
      setColor(this.oddsLabel.node, new Color(255, 255, 0));
    }
  }

  public stopOddsLabelBingoAnime() {
    if (this.labelAnimation !== null) {
      // reset
      this.labelAnimation.stop();
      setColor(this.oddsLabel.node, new Color(255, 255, 255));
    }
  }
}
