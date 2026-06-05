import {
  _decorator,
  Component,
  Prefab,
  CCFloat,
  Node,
  Vec2,
  Vec3,
  tween,
} from 'cc';
const {ccclass, property} = _decorator;

import {WheelBlockController} from '../Wheel/WheelBlockController';
import HostSetting from '../Define/HostSetting';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import NodeEx from '../../CommonModule/Script/Utility/NodeEx';
import {
  getNodeSpaceAR,
  getWorldSpaceAR,
  setOpacity,
  setScale,
} from '../../CommonModule/Script/Utility/NodeProperty';

@ccclass('FrameController')
export class FrameController extends Component {
  @property(Prefab)
  protected bingoFramePrefab: Prefab | null = null;
  @property(SpawnPool)
  protected bingoFramePool: SpawnPool = null;
  protected wheelBlocksCtrl: WheelBlockController = null;
  protected frameScale = 1;

  ///fast spin時的報線獎速度
  @property(CCFloat)
  protected fastShowBingoLineTime = 1;

  public init(wheelBlockCtrl: WheelBlockController) {
    this.wheelBlocksCtrl = wheelBlockCtrl;
    this.frameScale = wheelBlockCtrl.node.scale.x;
  }

  public showBingoFrame(positionList: number[][]) {
    for (let wheelIndex = 0; wheelIndex < positionList.length; wheelIndex++) {
      for (
        let frameIndex = 0;
        frameIndex < positionList[wheelIndex].length;
        frameIndex++
      ) {
        if (positionList[wheelIndex][frameIndex] > 0) {
          this.showBingoSymbolFrame(wheelIndex, frameIndex);
        }
      }
    }
  }

  protected showBingoSymbolFrame(wheelIndex: number, frameIndex: number) {
    const spawnBingoFrameNode: Node = this.bingoFramePool.spawn(
      this.bingoFramePrefab.data
    );
    spawnBingoFrameNode.parent = this.node;
    spawnBingoFrameNode.active = true;
    spawnBingoFrameNode.setSiblingIndex(
      wheelIndex * this.wheelBlocksCtrl.wheelAry[0].symbolAmount
    );
    if (HostSetting.instance.bingo.useWheelMask) {
      const spawnBingoFrameNodeEx: NodeEx = new NodeEx(spawnBingoFrameNode);
      setOpacity(spawnBingoFrameNode, 0);
      tween(spawnBingoFrameNodeEx)
        .to(0.65, {opacity: 255})
        .delay(0.5)
        .to(0.65, {opacity: 0})
        .delay(0.2)
        .start();
    }
    const targetSymbolNode: Node =
      this.wheelBlocksCtrl.getSymbolTransByVisibleSortedIndex(
        wheelIndex,
        frameIndex
      );
    setScale(spawnBingoFrameNode, this.frameScale);
    const pos: Vec3 = getNodeSpaceAR(
      this.node,
      getWorldSpaceAR(targetSymbolNode, Vec2.ZERO)
    );
    spawnBingoFrameNode.setPosition(pos);
  }

  public hideBingoFrame() {
    this.bingoFramePool.despawnAll();
  }
}
