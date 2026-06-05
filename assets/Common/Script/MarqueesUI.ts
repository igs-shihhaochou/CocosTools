import {_decorator, Component, RichText, Node, tween, Tween} from 'cc';
import {RichTextShrink} from './RichTextShrink';
import NodeEx, {nodeEx} from '../../CommonModule/Script/Utility/NodeEx';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';

const {ccclass, property} = _decorator;

type MarqueesData = {
  text: string;
  priority: number;
  duration: number;
};

@ccclass
export class MarqueesUI extends Component {
  @property(Node)
  private marqueesBg: Node = null;

  @property(RichText)
  private textLabel: RichText = null;

  @property(RichTextShrink)
  private textLabelShrink: RichTextShrink = null;

  private marqueesList: MarqueesData[] = [];

  private lastSN = -1; //每則跑馬燈的流水號(收到的夏禕則小於或等於時則不顯示)

  private currentTween: Tween<NodeEx> = null;

  //新增跑馬燈訊息
  public addMarquees(
    text: string,
    serialNo: number,
    priority: number,
    duration: number
  ) {
    if (serialNo === this.lastSN) return;
    this.lastSN = serialNo;

    const obj = {text: text, priority: priority, duration: duration};

    let alreadyAddMarquees = false;

    for (let i = 0; i < this.marqueesList.length; i++) {
      //找到priority有比較小的就插進去
      if (priority > this.marqueesList[i].priority) {
        this.marqueesList.splice(i, 0, obj);
        alreadyAddMarquees = true;
        break;
      }
    }

    //都沒有找到就直接加入
    if (!alreadyAddMarquees) {
      this.marqueesList.push(obj);
    }

    this.showNextMarquee();
  }

  //Check下一則跑馬燈
  private showNextMarquee() {
    //如果有正在播放的跑馬燈就跳掉
    if (this.currentTween) return;

    //播放下一則
    if (this.marqueesList.length > 0) {
      //先顯示背景和塞入要顯示的文字
      const marqueesData = this.marqueesList.shift();
      this.showMarquees(marqueesData.text, marqueesData.duration);
    }
  }

  //Show出跑馬燈
  private showMarquees(text: string, duration: number) {
    Tween.stopAllByTarget(this.marqueesBg);
    //先顯示背景和塞入要顯示的文字
    this.textLabel.string = text;
    this.textLabelShrink.Shrink();

    this.currentTween = tween(nodeEx(this.marqueesBg))
      .to(0.5, {opacity: 255})
      .delay(duration)
      .to(0.5, {opacity: 0})
      .call(async () => {
        await waitForSeconds(1);
        this.currentTween = null;
        this.showNextMarquee();
      })
      .start();
  }
}
