import {
  _decorator,
  Prefab,
  Animation,
  Node,
  Sprite,
  Component,
  CCInteger,
  Vec3,
} from 'cc';
const {ccclass, property} = _decorator;

import {WheelBlockController} from './WheelBlockController';
import {Symbol} from './Symbol';
import {WheelMaskController} from './WheelMaskController';
import DropModule, {EnumAnimaType} from './DropModule';
import {DropSymbolPrefab, SlotGDK} from '../Define/SlotGDK';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {ShowFrameObj} from '../Award/AwardSet';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {
  getWorldSpaceAR,
  getNodeSpaceAR,
} from '../../CommonModule/Script/Utility/NodeProperty';

// 三個 helper class 已搬至 ./DropSymbolPrefabItems.ts(為符合 <500 行)
import {
  DropAnimaPrefabArgs,
  DropSymbolShowSetting,
  DropSymbolShowInfo,
} from './DropSymbolPrefabItems';

@ccclass('DropSymbolPrefabController')
export default class DropSymbolPrefabController extends Component {
  @property(DropModule)
  protected dropModule: DropModule = null;
  @property(SpawnPool)
  protected pool: SpawnPool = null; //管理AnimaPrefab的Pool
  @property({type: Node, tooltip: '動畫Prefab的父物件'})
  protected animaRoot: Node | null = null; //動畫Prefab產生的父物件
  @property(Node)
  protected upperRoot: Node | null = null; //讓中獎圖片往上移一層的物件
  @property(Node)
  protected offClippingRoot: Node | null = null; //不要被切邊的Symbol要產生的父物件
  // @property({type: [DropSymbolShowSetting], tooltip: '對應的Symbol動畫設定'})
  @property([DropSymbolShowSetting])
  public setting: DropSymbolShowSetting[] = [];
  @property({
    type: CCInteger,
    displayName: 'AwardController 裡的 ShowFrameObj ID',
  })
  public objID = 0;
  protected info: DropSymbolShowInfo[][] = null; //要控制的symbol及相關的動畫節點資訊 包含看不見的symbol
  protected offClippingList: Sprite[] = [];
  public get awardSet(): ShowFrameObj {
    return SlotGameMediator.instance.awardController.showFrameObj[this.objID];
  }
  public get wheelBlockController(): WheelBlockController {
    return this.awardSet.wheelBlockControllerEx;
  }
  public get wheelMaskController(): WheelMaskController {
    return this.awardSet.wheelMaskControllerEx;
  }
  public getSymbol(wheelIndex: number, symbolIndex: number): Symbol {
    const symbolID: number =
      symbolIndex +
      this.wheelBlockController.wheelAry[wheelIndex].outOfTopSymbolAmount;
    return this.wheelBlockController.wheelAry[wheelIndex].getSymbolEx(symbolID);
  }
  public getSetting(symbolID: number): DropSymbolShowSetting {
    return this.setting.find(setting => {
      return setting.symbolID === symbolID;
    });
  }
  //---------------------------------------------------------------------------------------------------------------------
  protected onLoad(): void {
    SlotGDK.instance.receiveStartGame.insert(this.init, this);
    SlotGDK.instance.showSpecialSymbol.insert(this.hideOffClipping, this);
    SlotGDK.instance.hideSpecialSymbol.insert(this.showOffClipping, this);
  }
  public hideOffClipping(): void {
    this.info.forEach((infoArr: DropSymbolShowInfo[], wheelIndex: number) => {
      infoArr.forEach((info: DropSymbolShowInfo, symbolIndex: number) => {
        const oriIndex =
          symbolIndex -
          this.wheelBlockController.wheelAry[wheelIndex].outOfTopSymbolAmount;
        const symbol: Symbol = this.getSymbol(wheelIndex, oriIndex);
        const setting: DropSymbolShowSetting = this.getSetting(
          symbol.symbolInfo.symbolID
        );
        info.symbol = symbol;
        if (info.haveAnima()) {
          this.pool.despawn(info.anim);
          info.anim = null;
        }
        if (setting.isOffClipping && info.offClipping) {
          this.putOffClipping(info.offClipping);
          info.offClipping = null;
          info.symbol.node.active = true;
        }
      });
    });
  }
  protected onDestroy(): void {
    try {
      SlotGDK.event(DropSymbolPrefab.ShowAnimation).remove(
        this.showAnimation,
        this
      );
      SlotGDK.event(DropSymbolPrefab.EndAnimation).remove(
        this.endAnimation,
        this
      );
      SlotGDK.event(DropSymbolPrefab.ShowOffClipping).remove(
        this.showOffClipping,
        this
      );
      SlotGDK.event(DropSymbolPrefab.HideOffClipping).remove(
        this.hideOffClipping,
        this
      );
      SlotGDK.event(DropSymbolPrefab.ShowAllSymbol).remove(
        this.showAllSymbol,
        this
      );
      SlotGDK.instance.receiveStartGame.remove(this.init, this);
      SlotGDK.instance.showSpecialSymbol.remove(this.hideOffClipping, this);
      SlotGDK.instance.hideSpecialSymbol.remove(this.showOffClipping, this);
      this.wheelBlockController.eventPrepareSpin.remove(
        this.onPrepareSpin,
        this
      );
      this.dropModule.eventDropEnd.remove(this.showOffClipping, this);
    } catch (ex) {
      console.error('[DropSymbolPrefabController]', ex);
    }
  }
  public init(): void {
    SlotGDK.instance.receiveStartGame.remove(this.init, this);

    this.info = [];
    //初始化 info
    for (let i = 0; i < this.wheelBlockController.wheelAry.length; i++) {
      const item: DropSymbolShowInfo[] = [];
      for (
        let j = 0;
        j < this.wheelBlockController.wheelAry[i].symbolAmount;
        j++
      ) {
        item.push(new DropSymbolShowInfo());
      }
      this.info.push(item);
    }

    const nodeList: Node[] = [];
    this.setting.sort((a, b) => {
      return a.sortIndex - b.sortIndex;
    });
    this.setting.forEach(setting => {
      const node: Node = new Node();
      node.name = nodeList.length.toString();
      nodeList.push(node);
      setting.animaLayer = node;
    });
    while (nodeList.length > 0) {
      const node: Node = nodeList.shift();
      node.parent = this.animaRoot;
    }

    this.setting.forEach(setting => {
      if (setting.isOffClipping) {
        const node: Node = new Node();
        node.name = nodeList.length.toString();
        nodeList.push(node);
        setting.offClippingLayer = node;
      }
    });
    while (nodeList.length > 0) {
      const node: Node = nodeList.shift();
      node.parent = this.offClippingRoot;
    }

    this.wheelBlockController.eventPrepareSpin.insert(this.onPrepareSpin, this);
    SlotGDK.event(DropSymbolPrefab.ShowAnimation).insert(
      this.showAnimation,
      this
    );
    SlotGDK.event(DropSymbolPrefab.EndAnimation).insert(
      this.endAnimation,
      this
    );
    SlotGDK.event(DropSymbolPrefab.ShowOffClipping).insert(
      this.showOffClipping,
      this
    );
    SlotGDK.event(DropSymbolPrefab.HideOffClipping).insert(
      this.hideOffClipping,
      this
    );
    SlotGDK.event(DropSymbolPrefab.ShowAllSymbol).insert(
      this.showAllSymbol,
      this
    );

    this.dropModule.eventDropEnd.insert(this.showOffClipping, this);
  }
  /**
   * 在按下 Spin 的時候清除
   */
  protected onPrepareSpin(): void {
    console.log('[DropSymbolPrefabController] OnPrepareSpin');
    this.clearAllPrefab();
  }
  /**
   * 回收所有生成出來表演的圖片或是動畫
   */
  protected clearAllPrefab(): void {
    this.awardSet.stopAll();
    this.info.forEach((infoArr: DropSymbolShowInfo[]) => {
      infoArr.forEach((info: DropSymbolShowInfo) => {
        if (info.symbol) {
          info.symbol.show();
        }

        if (info.haveAnima()) {
          this.pool.despawn(info.anim);
        }

        if (info.offClipping) {
          this.putOffClipping(info.offClipping);
          info.offClipping = null;
        }
      });
    });
  }
  /**
   * 停輪時判斷是否將對應 Symbol 掛到上層 (依設定值)
   */
  public showOffClipping(wheelIdx: number = null) {
    this.info.forEach((infoArr: DropSymbolShowInfo[], wheelIndex: number) => {
      if (wheelIdx === null || wheelIdx === wheelIndex) {
        infoArr.forEach((info: DropSymbolShowInfo, symbolIndex: number) => {
          const {outOfTopSymbolAmount, outOfBottomSymbolAmount, symbolAmount} =
            this.wheelBlockController.wheelAry[wheelIndex];
          if (
            symbolIndex >= outOfTopSymbolAmount &&
            symbolIndex < symbolAmount - outOfBottomSymbolAmount
          ) {
            const oriIndex = symbolIndex - outOfTopSymbolAmount;
            const symbol: Symbol = this.getSymbol(wheelIndex, oriIndex);
            const setting: DropSymbolShowSetting = this.getSetting(
              symbol.symbolInfo.symbolID
            );
            info.symbol = symbol;

            if (info.haveAnima()) {
              this.pool.despawn(info.anim);
              info.anim = null;
            }
            if (setting.isOffClipping) {
              if (!info.offClipping) {
                info.symbol.hide();
                info.offClipping = this.createOffClipping(
                  symbol,
                  setting.offClippingLayer
                );
              }
            }
          }
        });
      }
    });
  }
  /**
   * 停輪時判斷是否將對應 Symbol 掛到上層 (依設定值)
   */
  public showAllSymbol() {
    this.info.forEach((infoArr: DropSymbolShowInfo[]) => {
      infoArr.forEach((info: DropSymbolShowInfo) => {
        info.active = true;
      });
    });
  }
  /**
   * 將特定 Symbol 掛到上層
   * @param symbol 特定轉輪
   */
  public createOffClipping(symbol: Symbol, layer: Node): Sprite {
    const offClipping: Sprite = this.getOffClipping();
    offClipping.node.parent = layer;
    this.align(offClipping.node, symbol.node);
    offClipping.spriteFrame = symbol.sprite.spriteFrame;
    offClipping.trim = false;
    offClipping.sizeMode = Sprite.SizeMode.RAW;
    offClipping.node.active = true;
    return offClipping;
  }
  /**
   * 將 Target 定位到 To 的位置
   * @param target 目標節點
   * @param to 定位節點
   */
  public align(target: Node, to: Node): void {
    // let pos: Vec3 = to.convertToWorldSpaceAR(Vec3.ZERO);
    const pos: Vec3 = getWorldSpaceAR(to, Vec3.ZERO);
    const position: Vec3 = getNodeSpaceAR(target.parent, pos);
    target.position = position;
  }
  /**
   * 取得一個 Sprite 供上層節點使用
   * @returns offClipping
   */
  protected getOffClipping(): Sprite {
    let offClipping: Sprite = this.offClippingList.shift();
    if (!offClipping) {
      const node = new Node();
      node.parent = this.offClippingRoot;
      offClipping = node.addComponent(Sprite);
    }
    return offClipping;
  }
  /**
   * 回收一個 Sprite
   * @param offClipping
   */
  protected putOffClipping(offClipping: Sprite): void {
    offClipping.spriteFrame = null;
    offClipping.node.active = false;
    this.offClippingList.push(offClipping);
  }
  /**
   * 表演 Symbol 動畫
   * @param bingoMap 需要表演 Symbol 的 BitMap
   * @param maskMap 需要遮罩 的 BitMap
   * @param type
   */
  protected showAnimation(
    bingoMap: Array<number[]>,
    maskMap: Array<number[]>,
    type: EnumAnimaType,
    index: number = null
  ): void {
    bingoMap.forEach((bingoArr: number[], wheelIndex: number) => {
      if (index === null || index === wheelIndex) {
        bingoArr.forEach((bingo: number, symbolIndex: number) => {
          const symbol: Symbol = this.getSymbol(wheelIndex, symbolIndex);
          const sortedIndex: number =
            symbolIndex +
            this.wheelBlockController.wheelAry[wheelIndex].outOfTopSymbolAmount;
          this.info[wheelIndex][sortedIndex].symbol = symbol;
          if (bingo === 1) {
            const setting: DropSymbolShowSetting = this.getSetting(
              symbol.symbolInfo.symbolID
            );
            if (this.info[wheelIndex][sortedIndex].haveAnima()) {
              this.pool.despawn(this.info[wheelIndex][sortedIndex].anim);
            }
            this.spawnAnimation(setting, wheelIndex, symbolIndex, type);
          }

          this.awardSet.showWheelMask(maskMap);
        });
      }
    });
  }
  public endAnimation(
    bingoMap: Array<number[]>,
    type: EnumAnimaType,
    index: number = null
  ): void {
    this.awardSet.hideWheelMask();
    if (bingoMap) {
      bingoMap.forEach((bingoArr: number[], wheelIndex: number) => {
        if (index === null || index === wheelIndex) {
          bingoArr.forEach((bingo: number, symbolIndex: number) => {
            const sortedIndex: number =
              symbolIndex +
              this.wheelBlockController.wheelAry[wheelIndex]
                .outOfTopSymbolAmount;
            if (bingo === 1) {
              if (this.info[wheelIndex][sortedIndex].haveAnima()) {
                this.pool.despawn(this.info[wheelIndex][sortedIndex].anim);
                this.info[wheelIndex][sortedIndex].anim = null;
              }
              this.info[wheelIndex][sortedIndex].symbol.show();
            }
          });
        }
      });
    } else {
      this.info.forEach((infoArr: DropSymbolShowInfo[], wheelIndex: number) => {
        if (index === null || index === wheelIndex) {
          infoArr.forEach((info: DropSymbolShowInfo) => {
            if (info.haveAnima()) {
              this.pool.despawn(info.anim);
              info.anim = null;
            }
            info.symbol.show();
          });
        }
      });
    }
  }
  protected spawnAnimation(
    setting: DropSymbolShowSetting,
    wheelIndex: number,
    symbolIndex: number,
    type: EnumAnimaType
  ) {
    const symbol: Symbol = this.getSymbol(wheelIndex, symbolIndex);
    const animArgs: DropAnimaPrefabArgs = setting.getArgs(type);
    const prefab: Prefab = animArgs.prefab;
    const sortedIndex =
      symbolIndex +
      this.wheelBlockController.wheelAry[wheelIndex].outOfTopSymbolAmount;
    if (prefab) {
      const node: Node = this.pool.spawn(prefab.data, setting.animaLayer);
      this.info[wheelIndex][sortedIndex].symbol = symbol;
      this.align(node, symbol.node);
      if (animArgs.hideSymbol) {
        symbol.hide();
      }
      const animation: Animation = node.getComponent(Animation);
      if (animation) {
        const animName: string = animArgs.animName
          ? animArgs.animName
          : animation.defaultClip.name;
        // animation.play(animName, 0);
        animation.play(animName);
      }
      this.info[wheelIndex][sortedIndex].anim = node;
    }
  }
}
