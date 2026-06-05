import {
  Component,
  instantiate,
  Node,
  NodePool,
  Prefab,
  Quat,
  Vec3,
  _decorator,
} from 'cc';
import {EDITOR} from 'cc/env';
import {ParticleBatchNode} from './ParticleBatchNode';
import {BatchParticles} from './BatchParticles';
const {ccclass, property} = _decorator;

@ccclass('Particle3DBatchManager')
export class Particle3DBatchManager extends Component {
  //#region Singleton
  //=======================================================
  public static get instance() {
    return this.instanceInternal;
  }
  protected static instanceInternal: Particle3DBatchManager = null;
  //=======================================================
  //#endregion Singleton

  @property(Prefab)
  //跟随挂点,可以是节点,模型,特效
  protected target: Prefab | null = null;

  protected targetNode: Node;
  protected targetPool: NodePool = new NodePool();

  protected id = 0;
  protected ps: Array<BatchParticles> = [];

  private psByKey: Map<string, BatchParticles[]> = new Map();
  private id2Key: Map<number, string> = new Map();
  private id2Target: Map<number, Node | null> = new Map();

  protected override onLoad() {
    if (Particle3DBatchManager.instanceInternal != null) {
      this.node.destroy();
      return;
    }
    Particle3DBatchManager.instanceInternal = this;
  }

  protected override start() {
    if (EDITOR) return;

    this.ps = this.node.getComponentsInChildren(BatchParticles);

    for (const bp of this.ps) {
      const key = bp.fxKey || 'default';
      let arr = this.psByKey.get(key);
      if (!arr) this.psByKey.set(key, (arr = []));
      arr.push(bp);
    }

    console.log('[Particle3DBatchManager] [start]', this.psByKey);

    let targetNode = this.node.getChildByName('target');
    if (!targetNode) {
      targetNode = new Node('target');
      this.node.addChild(targetNode);
    }
    this.targetNode = targetNode;
  }

  public override onDestroy() {
    this.clearAll();
    this.ps.length = 0;
    this.targetPool.clear();

    if (Particle3DBatchManager.instanceInternal === this)
      Particle3DBatchManager.instanceInternal = null;
  }

  public addTarget() {
    if (this.target) {
      if (this.targetPool.size() > 0) {
        const node = this.targetPool.get();
        this.targetNode.addChild(node);
        return node;
      }

      const node = instantiate(this.target);
      this.targetNode.addChild(node);
      return node;
    }

    return null;
  }

  public addParticleWithTarget(key: string, target: Node, isPlay = true) {
    const group = this.psByKey.get(key);
    if (!group || group.length === 0) {
      console.warn(`[BatchMgr] fxKey not found: ${key}`);
      return -1;
    }

    const id = this.id++;
    this.id2Key.set(id, key);
    this.id2Target.set(id, target);

    for (const bp of group) {
      const bt = bp.create(id);
      bp.addBatch(bt);

      bt.target = target;
      bt.mgr = null; // 重要：表示 target 不是 mgr 自己生成的（不要回收/不要控制 active）

      if (isPlay) bt.play();
    }
    return id;
  }

  public getTarget(id: number) {
    return this.id2Target.get(id) ?? null;

    // if (this.ps.length > 0) {
    //   const bn = this.ps[0].getBatchByID(id);
    //   if (bn) {
    //     return bn.target;
    //   }
    // }

    // return null;
  }

  public removeTarget(node: Node) {
    if (this.target) {
      this.targetPool.put(node);
    } else {
      node.removeFromParent();
    }
  }

  public addParticle(
    pos: Vec3 = Vec3.ZERO,
    rotate: Quat = Quat.IDENTITY,
    isPlay = true
  ) {
    const ps = this.ps;
    const len = ps.length;

    const id = this.id++;
    const target = this.addTarget();
    for (let i = 0; i < len; i++) {
      //let bt = ps[i].addParticle(id, pos, rotate);
      const bt = ps[i].create(id);
      ps[i].addBatch(bt);

      if (target) {
        target.position = pos;
        target.rotation = rotate;
      } else {
        bt.node.position = pos;
        bt.node.rotation = rotate;
      }

      bt.target = target;
      bt.mgr = this;

      if (isPlay) bt.play();
    }

    return id;
  }

  /** [PERF] 可傳入 out 陣列復用，避免高頻呼叫時每次 new Array */
  public getParticle(id: number, out?: ParticleBatchNode[]) {
    const ps = this.ps;
    const len = ps.length;
    const result = out ?? [];
    result.length = 0;
    for (let i = 0; i < len; i++) {
      const bp = ps[i].getBatchByID(id);
      if (bp) {
        result.push(bp);
      }
    }
    return result;
  }

  public removeParticle(id: number) {
    // const ps = this.ps;
    // const len = ps.length;
    // for (let i = 0; i < len; i++) {
    //   ps[i].removeBatchByID(id);
    // }
    const key = this.id2Key.get(id);
    const group = key ? this.psByKey.get(key) : null;
    const list = group ?? this.ps; // fallback

    for (const bp of list) bp.removeBatchByID(id);

    this.id2Key.delete(id);
    this.id2Target.delete(id);
  }

  public play(id: number) {
    const ps = this.ps;
    const len = ps.length;
    for (let i = 0; i < len; i++) {
      const bp = ps[i].getBatchByID(id);
      if (bp) {
        bp.play();
      }
    }
  }

  public stop(id: number) {
    const ps = this.ps;
    const len = ps.length;
    for (let i = 0; i < len; i++) {
      const bp = ps[i].getBatchByID(id);
      if (bp) {
        bp.stop();
      }
    }
  }

  public clear(id: number) {
    const ps = this.ps;
    const len = ps.length;
    for (let i = 0; i < len; i++) {
      const bp = ps[i].getBatchByID(id);
      if (bp) {
        bp.clear();
      }
    }
  }

  public clearAll() {
    const ps = this.ps;
    const len = ps.length;
    for (let i = 0; i < len; i++) {
      ps[i].clearAllBatch();
    }
  }
}
