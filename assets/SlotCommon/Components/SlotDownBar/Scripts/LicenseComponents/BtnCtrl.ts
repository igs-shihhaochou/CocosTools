import {_decorator, Component, Node, Sprite} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {
  setOpacity,
  setPosition,
  setSize,
} from 'db://assets/CommonModule/Script/Utility/NodeProperty';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
const {ccclass, property} = _decorator;

@ccclass('BtnCtrl')
export default class BtnCtrl extends Component {
  @property(Node)
  private fullScreenBtn: Node | null = null;
  @property(Node)
  private homeBtn: Node | null = null;
  @property(Node)
  private maxBetBtn: Node | null = null;
  @property(Node)
  private maxBetBtnBlock: Node | null = null;
  @property(Sprite)
  private betBtnBG: Sprite | null = null;
  @property(Node)
  private addBetBtn: Node | null = null;
  @property(Node)
  private reduceBetBtn: Node | null = null;
  @property(Node)
  private betBtnGroup: Node | null = null;
  protected onLoad(): void {
    SlotGDK.instance.eventSceneIsReady.insert(this.onSceneIsReady, this);
  }
  private onSceneIsReady() {
    const {showFullScreenBtn, showHomeBtn, showMaxBet} =
      PlatformData.licenseSetting;
    this.homeBtn.active = showHomeBtn;
    this.fullScreenBtn.active = showFullScreenBtn;
    this.maxBetBtn.active = showMaxBet;
    setOpacity(this.maxBetBtnBlock, showMaxBet ? 150 : 0);
    if (!showMaxBet) {
      this.adjustBetBtn();
    }
  }
  private adjustBetBtn() {
    this.betBtnBG.trim = false;
    this.betBtnBG.type = Sprite.Type.SLICED;
    this.betBtnBG.sizeMode = Sprite.SizeMode.CUSTOM;
    setSize(this.betBtnBG.node, 295);
    setPosition(this.addBetBtn, 117.2);
    setPosition(this.reduceBetBtn, -118);
    setPosition(this.betBtnGroup, 256.674);
  }
}
