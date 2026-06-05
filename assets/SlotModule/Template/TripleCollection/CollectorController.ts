import {_decorator, Node, Prefab, Vec3, Vec2, sp} from 'cc';
import {FeatureRemote} from '../../Feature/FeatureRemote';
import {FeatureData, StartGameExArgs} from '../../Define/SlotGameData';
import {WheelBlockController} from '../../Wheel/WheelBlockController';
import CollectorItem from './CollectorItem';
import {SpawnPool} from '../../../CommonModule/Script/UIComponent/SpawnPool';
import {
  getNodeSpaceAR,
  setPosition,
  setScale,
} from '../../../CommonModule/Script/Utility/NodeProperty';
import {SlotGDK} from '../../Define/SlotGDK';
const {ccclass, property} = _decorator;

export enum CollectorProcessStatus {
  Idle,
  CollectItemFlying, // 硬幣飛到收集器
  HitReaction, // 收集器被擊中後的表演
  End, // 收集器結束表演
}

@ccclass('CollectObjController')
class CollectObjController {
  @property(SpawnPool)
  private spawnPool: SpawnPool = null;

  @property(Prefab)
  private collectObjPrefab: Prefab = null;

  public createCollectObj(
    parentTform: Node,
    posV3: Vec2 | Vec3,
    scaleV3: Vec2 | Vec3,
    skin = ''
  ): Node {
    // 生成收集物件
    const prefabTform: Node = this.spawnPool.spawn(
      this.collectObjPrefab.data,
      parentTform
    );

    const pos: Vec3 = getNodeSpaceAR(parentTform, posV3);
    setPosition(prefabTform, pos);
    setScale(prefabTform, scaleV3);

    this.setSkin(prefabTform, skin);

    return prefabTform;
  }

  public deSpawn(node: Node) {
    // 回收收集物件
    if (node && this.spawnPool) {
      this.spawnPool.despawn(node);
    }
  }

  public deSpawnAll() {
    this.spawnPool.despawnAll();
  }

  protected getSpine(node: Node) {
    return node.getComponent(sp.Skeleton);
  }

  private setSkin(node: Node, skin: string) {
    if (skin === '') return;

    const spine = this.getSpine(node);
    if (spine) {
      spine.setSkin(skin);
    }
  }
}

@ccclass('CollectorController')
export class CollectorController extends FeatureRemote {
  @property([WheelBlockController])
  public wheelBlockControllers: WheelBlockController[] = [];

  @property([CollectorItem])
  public collectorItems: CollectorItem[] = [];

  @property(CollectObjController)
  private collectObjCtrl: CollectObjController = null;

  @property(Node)
  private collectObjParent: Node = null;

  protected processStatus: CollectorProcessStatus = CollectorProcessStatus.Idle;

  protected onLoad(): void {
    SlotGDK.instance.receiveStartGame.insert(this.onReceiveStartGameData, this);

    this.wheelBlockControllers.forEach(item => {
      item.eventSingleWheelStopped.insert(this.onWheelSingleStop, this);
    });
  }

  protected onDestroy(): void {
    SlotGDK.instance.receiveStartGame.remove(this.onReceiveStartGameData, this);

    this.wheelBlockControllers.forEach(item => {
      item.eventSingleWheelStopped.remove(this.onWheelSingleStop, this);
    });
  }

  public startFeature(DataArg: FeatureData): void {
    super.startFeature(DataArg);
    this.processStatus = CollectorProcessStatus.CollectItemFlying;
    this.updateProcess();
  }

  protected updateProcess() {
    switch (this.processStatus) {
      case CollectorProcessStatus.CollectItemFlying:
        this.processStatus = CollectorProcessStatus.HitReaction;
        this.handleCollectItemFlying();
        break;
      case CollectorProcessStatus.HitReaction:
        this.processStatus = CollectorProcessStatus.End;
        this.handleHitReaction();
        break;
      case CollectorProcessStatus.End:
        this.processStatus = CollectorProcessStatus.Idle;
        this.handleFeatureEnd();
        break;
    }
  }

  // override func
  protected async onWheelSingleStop(
    _wheelCtrlIndex: number,
    _wheelIndex: number,
    _sortedSymbolAry: Symbol[]
  ) {}

  // override func
  protected onReceiveStartGameData(_args: StartGameExArgs) {}

  protected async handleCollectItemFlying() {
    this.updateProcess();
  }

  protected async handleHitReaction() {
    this.updateProcess();
  }

  protected async handleFeatureEnd() {
    this.playEnding();
  }

  public reset(index = -1) {
    // 重置收集器狀態
    if (index >= 0) this.collectorItems[index].reset();
    else {
      for (let i = 0; i < this.collectorItems.length; i++) {
        this.collectorItems[i].reset();
      }
    }
  }

  public createCollectObj(posV3: Vec2 | Vec3, scaleV3: Vec2 | Vec3, skin = '') {
    return this.collectObjCtrl.createCollectObj(
      this.collectObjParent,
      posV3,
      scaleV3,
      skin
    );
  }

  public despawnCollectObj(node: Node) {
    // 回收收集物件
    this.collectObjCtrl.deSpawn(node);
  }

  public despawnAllCollectObj() {
    // 回收所有收集物件
    this.collectObjCtrl.deSpawnAll();
  }

  public getCollectorLevel(index: number) {
    if (index < 0 || index >= this.collectorItems.length) return -1;
    return this.collectorItems[index].getLevel();
  }

  public async setCollectorLevel(index: number, level: number) {
    if (index < 0 || index >= this.collectorItems.length) return;
    this.collectorItems[index].setLevel(level);
  }
}
