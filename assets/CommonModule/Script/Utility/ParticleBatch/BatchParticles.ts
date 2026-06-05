import {
  CCFloat,
  Component,
  Enum,
  Node,
  NodePool,
  ParticleSystem,
  Quat,
  Vec3,
  _decorator,
} from 'cc';
import {EDITOR} from 'cc/env';
import {ParticleBatchNode} from './ParticleBatchNode';
const {ccclass, executeInEditMode, property} = _decorator;

export const AlignmentSpace = Enum({
  World: 0,
  Local: 1,
  View: 2,
});

const _node_rol = new Quat();
const _world_rol = new Quat();
const RotateParticle = function (r: Vec3) {
  r.multiplyScalar(180.0 / Math.PI);
  Quat.fromEuler(_node_rol, r.x, r.y, r.z);
  Quat.multiply(_node_rol, _world_rol, _node_rol);
  Quat.toEuler(r, _node_rol, false);
  r.multiplyScalar(Math.PI / 180.0);

  return _node_rol;
};

// #region Particle callback contexts
// 補上額外欄位，方便在 callback 中使用
type SetNewParticleContext = {
  _model?: {
    addGPUParticleVertexData: (
      particle: unknown,
      particleNum: number,
      time: number
    ) => void;
  };
  _particleNum: number;
  _particleSystem: ParticleSystemEmitContext;
};

type ParticleSystemEmitContext = ParticleSystem & {
  __time: number;
  _time: number;
  _curWPos: Vec3;
  _oldWPos: Vec3;
  _isEmitting: boolean;
  _emitRateTimeCounter: number;
  _emitRateDistanceCounter: number;
  emit: (emitNum: number, dt: number) => void;
};
//#endregion

@ccclass('BatchParticles')
@executeInEditMode
export class BatchParticles extends Component {
  @property({
    tooltip: '特效分組Key，同Key的模板會一起生成（可做複合特效）',
  })
  public fxKey = '';

  @property({tooltip: '使用 World space 並模擬 Local 跟隨 (僅 CPU 粒子可用)'})
  public batchLocalFollow = false;

  @property(CCFloat)
  //最大合批缓存倍数
  protected maxBatch = 10;

  private _isInit = false;
  private _psys: ParticleSystem = null;
  public set psys(psys: ParticleSystem) {
    this._psys = psys;
  }
  public get psys() {
    if (!this._psys) {
      this._psys = this.node.getComponent(ParticleSystem);
      if (!this._psys) {
        this._psys = this.node.addComponent(ParticleSystem);
      }
    }
    return this._psys;
  }

  public initNode: Node = new Node();
  protected bnPools: NodePool = new NodePool();
  protected idNode: Map<number, ParticleBatchNode> = new Map();
  public create(id = 0): ParticleBatchNode {
    if (this.bnPools.size() > 0) {
      const node = this.bnPools.get();
      const bn = node.getComponent(ParticleBatchNode);
      bn.init(this, id);
      return bn;
    }

    const node = new Node();
    const bn = node.addComponent(ParticleBatchNode);
    bn.init(this, id);
    return bn;
  }

  public addParticle(id: number, pos: Vec3, rotate: Quat) {
    const bn = this.create(id);

    bn.node.position = pos;
    bn.node.rotation = rotate;

    this.addBatch(bn);

    return bn;
  }

  public addBatch(bn: ParticleBatchNode) {
    this.node.addChild(bn.node);
    this.idNode.set(bn.id, bn);
  }

  public removeBatch(bn: ParticleBatchNode) {
    //this.node.removeChild(bn.node);
    this.idNode.delete(bn.id);
    this.bnPools.put(bn.node);
  }

  public getBatchByID(id: number) {
    return this.idNode.get(id);
  }

  public removeBatchByID(id: number) {
    const bn = this.idNode.get(id);
    if (bn) {
      bn.stop();
      bn.clear();
      // this.removeBatch(bn);
    }
  }

  public clearAllBatch() {
    const childs = this.node.children;
    const length = childs.length - 1;
    for (let i = length; i >= 0; i--) {
      //let node = childs[i];
      const bn = childs[i].getComponent(ParticleBatchNode);
      if (bn) {
        bn.stop();
        bn.clear();
      }
      // this.bnPools.put(node);
    }
    this.psys.stop();
    this.psys.clear();
    this.idNode.clear();
  }

  protected override onDestroy() {
    this.idNode.clear();
    this.bnPools.clear();
  }

  protected override onLoad() {
    const psys = this.psys;
    if (!EDITOR) {
      if (!this._isInit) {
        this._isInit = true;
        psys.capacity *= this.maxBatch;

        const node = this.node;
        this.initNode.scale.set(node.scale);
        this.initNode.rotation.set(node.rotation);
        this.initNode.position.set(node.position);

        node.scale = Vec3.ONE;
        node.position = Vec3.ZERO;
        node.rotation = Quat.IDENTITY;
      }
    }
  }

  protected override start() {
    if (EDITOR) return;

    // 強制使用 World 模式，並透過 `batchLocalFollow` 模擬 Local 行為
    this.psys.simulationSpace = 0;
    const batchLocalFollow = this.batchLocalFollow;
    // let renderer = this.psys.renderer;
    if (this.psys.renderer.useGPU) {
      this.psys.processor.setNewParticle = function (
        this: SetNewParticleContext,
        p
      ) {
        const renderer = p.particleSystem.renderer;

        const targetScale = p.particleSystem.node.scale;

        if (renderer.alignSpace !== AlignmentSpace.View) {
          RotateParticle(p.rotation);
        }

        p.startSize.x *= targetScale.x;
        p.startSize.y *= targetScale.y;
        p.startSize.z *= targetScale.z;

        this._model!.addGPUParticleVertexData(
          p,
          this._particleNum,
          this._particleSystem.__time
        );
        this._particleNum++;
        try {
          const node = p.particleSystem.node;
          const bn = node && (node as any)['_batchNode'];
          if (bn && bn.registerParticle) bn.registerParticle(p);
        } catch (e) {
          // ignore
        }
      };
    } else {
      this.psys.processor.setNewParticle = function (p) {
        const renderer = p.particleSystem.renderer;
        const targetScale = p.particleSystem.node.worldScale;

        if (renderer.alignSpace !== AlignmentSpace.View) {
          const rol = RotateParticle(p.rotation);
          if (!p.startRotated) {
            p.startRotated = true;
            p.startRotation.set(rol);
          }
        }
        p.startSize.x *= targetScale.x;
        p.startSize.y *= targetScale.y;
        p.startSize.z *= targetScale.z;
        try {
          const node = p.particleSystem.node;
          const bn = node && (node as any)['_batchNode'];
          if (bn && bn.registerParticle) bn.registerParticle(p);
        } catch (e) {
          // ignore
        }
      };
    }

    this.psys['_emit'] = function (this: ParticleSystemEmitContext, dt) {
      const node = this.node;
      const loop = this.loop;
      this.__time = this._time;
      const duration = this.duration;

      const childs = this.node.children;
      for (let i = 0; i < childs.length; i++) {
        const bn = childs[i].getComponent(ParticleBatchNode);
        if (!bn?.begin(dt)) continue;

        // 將當前 batch node 關聯到當前的發射 Node，供 setNewParticle 使用
        const targetNode = bn.target ? bn.target : bn.node;
        (targetNode as any)['_batchNode'] = bn;

        // 臨時改變粒子系統的節點為 targetNode，以正確計算粒子世界位置
        this.node = targetNode;
        if (batchLocalFollow) targetNode.updateWorldTransform();

        // 同步粒子系統狀態（來自 ParticleBatchNode）
        this.__time = bn._time;
        this._curWPos = (bn as any)._curWPos;
        this._oldWPos = (bn as any)._oldWPos;

        // try {
        switch (this.renderer.alignSpace) {
          case 0:
            this.node.getWorldRotation(_world_rol);
            break;
          case 1:
            this.node.getRotation(_world_rol);
            break;
        }

        const startDelay = this.startDelay.evaluate(0, 1)!;
        if (this._time > startDelay) {
          if (this._time > this.duration + startDelay) {
            if (!this.loop) {
              this._isEmitting = false;
              if (bn.end()) i--;
              continue;
            }
          }

          // emit by rateOverTime
          this._emitRateTimeCounter +=
            this.rateOverTime.evaluate(this._time / this.duration, 1)! * dt;
          if (this._emitRateTimeCounter > 1 && this._isEmitting) {
            const emitNum = Math.floor(this._emitRateTimeCounter);
            this._emitRateTimeCounter -= emitNum;
            this.emit(emitNum, dt);
          }

          // emit by rateOverDistance
          this.node.getWorldPosition(this._curWPos);
          const distance = Vec3.distance(this._curWPos, this._oldWPos);
          Vec3.copy(this._oldWPos, this._curWPos);
          this._emitRateDistanceCounter +=
            distance *
            this.rateOverDistance.evaluate(this._time / this.duration, 1)!;

          if (this._emitRateDistanceCounter > 1 && this._isEmitting) {
            const emitNum = Math.floor(this._emitRateDistanceCounter);
            this._emitRateDistanceCounter -= emitNum;
            this.emit(emitNum, dt);
          }

          // bursts
          for (const burst of this.bursts) {
            burst.update(this, dt);
          }
        }

        // 如果需要模擬 Local 行為，在 emit 之後套用本地跟隨
        if (batchLocalFollow) {
          bn.applyLocalFollow();
        }
        // } finally {
        // 清除 targetNode 上的關聯，確保下一個 bn 不會誤用
        // try {
        delete (targetNode as any)['_batchNode'];
        // } catch (e) {
        // (targetNode as any)['_batchNode'] = null;
        // }
        // }

        if (bn.end()) i--;
      }

      this.node = node;
      this.loop = loop;
      this._time = this.__time;
      this.duration = duration;
    };
  }
}
