import {
  _decorator,
  Component,
  Button,
  Node,
  Label,
  Toggle,
  Vec2,
  Tween,
} from 'cc';
import {
  setPosition,
  setScale,
} from '../../../../CommonModule/Script/Utility/NodeProperty';
import {tweenNodeEx} from '../../../../CommonModule/Script/Utility/TweenUtil';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import {BuyBonusUISwitch} from './Define/BuyBonusUISwitch';
import MultiLangHandler from 'db://assets/CommonModule/Script/Core/MultiLangHandler';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';

const {ccclass, property} = _decorator;

@ccclass('BuyBonusViewManager')
export default class BuyBonusViewManager extends Component {
  /** BuyBonus面板開啟按鈕 */
  @property(Button)
  private buyBonusIcon: Button | null = null;
  /** BuyBonus按鈕紅點 */
  @property(Node)
  private redDot: Node | null = null;
  /** BuyBonus新手教學 */
  @property(Node)
  private buyBonusTip: Node | null = null;
  /** BuyBonus新手教學內的按鈕 */
  @property(Node)
  private buyBonusTipBtnNode: Node | null = null;
  /** BuyBonus面板根節點 */
  @property(Node)
  private buyBonusUIRoot: Node | null = null;
  /** 押注面板根節點 */
  @property(Node)
  private totalBetRoot: Node | null = null;
  /** 一般押注面板根節點 */
  @property(Node)
  private normalTotalBetRoot: Node | null = null;
  /** 額外押注面板根節點 */
  @property(Node)
  private extraTotalBetRoot: Node | null = null;
  /** 押注Label */
  @property(Label)
  private betLabel: Label | null = null;
  /** 額外押注選項根節點 */
  @property(Node)
  private extraBetRoot: Node | null = null;
  /** 額外押注選項Toggle */
  @property(Toggle)
  private extraBetToggle: Toggle | null = null;
  @property(Node)
  private messageRoot: Node | null = null;
  /** 訊息Label */
  @property(Label)
  private messageLabel: Label | null = null;
  /** BuyBonus介紹頁面 */
  @property(Node)
  private infoNode: Node | null = null;
  /** InGameJP遊戲的JP面板，開啟BuyBonus時的母節點 */
  @property(Node)
  private jpRoot: Node | null = null;
  /** 押注標題Label */
  @property(Label)
  private betTitleLabel: Label | null = null;
  /** 介紹頁第一句的Label，需客製調整BET文字 */
  @property(Label)
  private infoContent1Label: Label | null = null;

  private tweenInSpecialGame: Tween | null = null;

  public init() {
    SlotGDK.instance.buyBonusBtnNode = this.buyBonusIcon.node;
    this.resetUI();
  }
  public resetUI() {
    this.hideBuyBonusIcon();
    this.hidePanel();
    this.hideInfo();
    this.hideTip();
    this.hideRedDot();
    this.hideMessage();
  }
  /**
   * 直橫版介面調整
   * @param isLandscape
   */
  public adjustUI(isLandscape = true) {
    if (isLandscape) {
      const position: Vec2 = new Vec2(
        BuyBonusUISwitch.customIconPositionLX ?? 585,
        BuyBonusUISwitch.customIconPositionLY ?? -205
      );
      setPosition(this.buyBonusIcon.node, position);
      setPosition(this.buyBonusTipBtnNode, position);
    } else {
      const position: Vec2 = new Vec2(
        BuyBonusUISwitch.customIconPositionPX ?? 305,
        BuyBonusUISwitch.customIconPositionPY ?? 320
      );
      setPosition(this.buyBonusIcon.node, position);
      setPosition(this.buyBonusTipBtnNode, position);
    }
  }
  public showBuyBonusIcon() {
    this.buyBonusIcon.node.active = true;
    tweenNodeEx(this.buyBonusIcon.node)
      .to(0.15, {scale: 1})
      .call(() => {
        this.buyBonusIcon.node.active = true;
      })
      .start();
  }
  public hideBuyBonusIcon() {
    tweenNodeEx(this.buyBonusIcon.node)
      .to(0.15, {scale: 0})
      .call(() => {
        this.buyBonusIcon.node.active = false;
      })
      .start();
  }
  public playBuyBonusIconTween() {
    this.tweenInSpecialGame = tweenNodeEx(this.buyBonusIcon.node)
      .to(1, {scale: 1.2})
      .to(1, {scale: 1})
      .union()
      .repeatForever()
      .start();
  }
  public stopBuyBonusIconTween() {
    this.tweenInSpecialGame?.stop();
    this.tweenInSpecialGame = null;
    setScale(this.buyBonusIcon.node, 1);
  }
  public setBuyBonusIconInteractable(isInteractable: boolean) {
    this.buyBonusIcon.interactable = isInteractable;
  }
  public showPanel() {
    this.buyBonusUIRoot.active = true;
  }
  public hidePanel() {
    this.buyBonusUIRoot.active = false;
  }
  public showInfo() {
    this.infoNode.active = true;
  }
  public hideInfo() {
    this.infoNode.active = false;
  }
  public showTip() {
    this.buyBonusTip.active = true;
  }
  public hideTip() {
    this.buyBonusTip.active = false;
  }
  public showRedDot() {
    this.redDot.active = true;
  }
  public hideRedDot() {
    this.redDot.active = false;
  }
  /** 顯示ExtraBet */
  public showExtraBet() {
    this.extraBetRoot.active = true;
  }
  /** 隱藏ExtraBet */
  public hideExtraBet() {
    this.extraBetRoot.active = false;
    this.adjustTotalBetPosition();
  }
  /** 調整TotalBet節點位置 */
  public adjustTotalBetPosition() {
    setPosition(this.totalBetRoot, 0, -15);
  }
  /** 設定ExtraBetToggle */
  public setExtraBetToggle(isCheck: boolean) {
    this.extraBetToggle.isChecked = isCheck;
  }
  /** 設定押注UI類型 */
  public setBetUIType(isExtraBet: boolean) {
    if (isExtraBet) {
      this.normalTotalBetRoot.active = false;
      this.extraTotalBetRoot.active = true;
    } else {
      this.normalTotalBetRoot.active = true;
      this.extraTotalBetRoot.active = false;
    }
  }
  /** 設定押注 */
  public setBetLabel(bet: string) {
    this.betLabel.string = bet;
  }
  /** 顯示訊息 */
  public showMessage(message: string) {
    this.messageRoot.active = true;
    this.messageLabel.string = message;
  }
  /** 隱藏訊息 */
  public hideMessage() {
    this.messageRoot.active = false;
  }
  /** 設定Bet/Info顯示標題 */
  public setBetTitleDisplay() {
    const title = MultiLangHandler.getGameText(
      `SlotUI_BetTitle${PlatformData.isUseScoreBox ? 'Scorebox' : ''}`
    );
    this.betTitleLabel.string = title;
    this.infoContent1Label.string = title;
  }
  public getIsPanelOpen(): boolean {
    return this.buyBonusUIRoot.active;
  }
  public getIsExtra(): boolean {
    return this.extraBetRoot.active && this.extraBetToggle.isChecked;
  }
  public getInGameJPRoot(): Node {
    return this.jpRoot;
  }
}
