import {_decorator, Component, Node, Label, Prefab, instantiate} from 'cc';
import {
  setPosition,
  setSize,
} from '../../../../CommonModule/Script/Utility/NodeProperty';
import BundleManager from '../../../../CommonModule/Script/Manager/BundleManager';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';

const {ccclass, property} = _decorator;

@ccclass('BuyBonusFreeGameInfo')
export default class BuyBonusFreeGameInfo extends Component {
  @property(Node)
  private gameFrameNode: Node | null = null;
  @property(Label)
  private freeGameTypeLabel: Label | null = null;
  @property(Node)
  private animationRoot: Node | null = null;
  @property(Node)
  private entriesIconNode: Node | null = null;
  @property(Label)
  private costLabel: Label | null = null;
  @property(Label)
  private disableCostLabel: Label | null = null;
  @property(Node)
  private buyRoot: Node | null = null;
  @property(Node)
  private enableBuyRoot: Node | null = null;
  @property(Node)
  private disableBuyRoot: Node | null = null;
  private freeGameIndex = 0;
  private buyBtnCallback: Function = null;
  public async init(
    freeGameIndex: number,
    specialGameType: string,
    buyBonusTypeName: string,
    freeGameAmount: number
  ) {
    this.freeGameIndex = freeGameIndex;
    this.freeGameTypeLabel.string = specialGameType;
    this.setNodeSize(freeGameAmount);
    this.setEntriesIconDisplay();
    this.SetDemoAnimation(buyBonusTypeName, () => {}, null);
  }
  public setCost(cost: string) {
    this.costLabel.string = cost;
    this.disableCostLabel.string = cost;
  }
  public setBuyBtnCallback(callback: Function) {
    this.buyBtnCallback = callback;
  }
  /** 根據BuyBonus種類數決定節點大小 */
  public setNodeSize(count: number) {
    if (count === 1) {
      setSize(this.node, 650, 400);
      setSize(this.gameFrameNode, 480, 270);
    } else if (count === 2) {
      setSize(this.node, 330, 400);
      setSize(this.gameFrameNode, 270, 270);
    } else {
      setSize(this.node, 220, 400);
      setSize(this.gameFrameNode, 195, 270);
    }
  }
  /** 允許購買點擊 */
  public enableBuy() {
    this.enableBuyRoot.active = true;
    this.disableBuyRoot.active = false;
  }
  /** 禁止購買點擊 */
  public disableBuy() {
    this.enableBuyRoot.active = false;
    this.disableBuyRoot.active = true;
  }
  /** 設定是否顯示購買金額圖示，並調整cost label的位置 */
  public setEntriesIconDisplay() {
    if (PlatformData.isUseScoreBox) {
      this.entriesIconNode.active = true;
      setPosition(this.costLabel.node, 15, 8);
      setSize(this.costLabel.node, 140, 48);
      setPosition(this.disableCostLabel.node, 15, 8);
      setSize(this.disableCostLabel.node, 140, 48);
    } else {
      this.entriesIconNode.active = false;
      setPosition(this.costLabel.node, 0, 8);
      setSize(this.costLabel.node, 170, 48);
      setPosition(this.disableCostLabel.node, 0, 8);
      setSize(this.disableCostLabel.node, 170, 48);
    }
  }
  /** 點擊buy時，callback */
  public onClickBuyBtn() {
    if (this.buyBtnCallback !== null) {
      this.buyBtnCallback(this.freeGameIndex);
    }
  }
  /**
   * 設置展示動畫Bundle
   * @param onComplete
   * @param onError
   */
  private async SetDemoAnimation(
    name: string,
    onComplete: Function,
    onError: (err: Error) => void
  ) {
    const bundleName = 'BuyBonus';
    const bundleLang: string = null;

    //嘗試載入遊戲客製BuyBonus展示動畫
    await new Promise((resolve: Function, reject: (err: Error) => void) => {
      BundleManager.instance.loadBundleAssets(
        bundleName,
        bundleLang,
        null,
        resolve,
        reject,
        bundleName
      );
    })
      .then(() => {})
      .catch((err: Error) => {
        console.warn('[BuyBonusFreeGameInfo] SetDemoAnimation fail.', err);
        if (onError !== null) {
          onError(err);
        }
        return;
      });

    //生成動畫
    let animationPrefab: Prefab = BundleManager.instance.getAsset<Prefab>(
      bundleName,
      'Prefab/' + name,
      Prefab,
      bundleLang
    );
    if (animationPrefab === null) {
      console.warn(
        '[BuyBonusFreeGameInfo] SetDemoAnimation animationPrefab is null.'
      );
      return;
    }
    let animationNode: Node = instantiate(animationPrefab);
    this.animationRoot.addChild(animationNode);

    //完成事件
    console.log(
      '[BuyBonusFreeGameInfo] SetDemoAnimation Complete, bundle:',
      bundleName
    );
    onComplete();

    animationPrefab = undefined;
    animationNode = undefined;
  }
}
