import {
  Burst,
  CCBoolean,
  CCFloat,
  Component,
  Node,
  Quat,
  Vec3,
  _decorator,
} from 'cc';
import {Particle3DBatchManager} from './Particle3DBatchManager';
import {BatchParticles} from './BatchParticles';
const {ccclass, property} = _decorator;

@ccclass('ParticleBatchNode')
export class ParticleBatchNode extends Component {
  @property(CCBoolean)
  protected loop = false;
  @property(CCFloat)
  protected duration = 5;

  @property(Node)
  //移动跟随挂点
  public target: Node | null = null;

  public id = 0;
  public mgr: Particle3DBatchManager | null = null;

  protected isInit = true;

  protected bps: BatchParticles;

  public R: Quat = new Quat();
  public T: Vec3 = new Vec3();
  public S: Vec3 = new Vec3();

  public _time = 0;
  public _curWPos: Vec3 = new Vec3();
  public _oldWPos: Vec3 = new Vec3();

  public deltaPos: Vec3 = new Vec3();
  private tmpScale: Vec3 = new Vec3();
  private _ownedParticles: any[] = [];
  private _followInited = false;

  private _prevWPos: Vec3 = new Vec3();
  private _prevWRot: Quat = new Quat();
  private _prevWScale: Vec3 = new Vec3(1, 1, 1);

  private _curWRot: Quat = new Quat();
  private _curWScale: Vec3 = new Vec3(1, 1, 1);

  private _invPrevRot: Quat = new Quat();
  private _deltaRot: Quat = new Quat();
  private _deltaScale: Vec3 = new Vec3(1, 1, 1);
  private tmp: Vec3 = new Vec3();
  protected _isEmitting = false;
  protected _emitRateTimeCounter = 0;
  protected _emitRateDistanceCounter = 0;

  protected _bursts: Array<Burst> = [];
  protected _isPlaying = true;

  public play() {
    this._isPlaying = true;
    this.bps.psys.play();
    if (this.target && this.mgr) this.target.active = true;
  }

  public stop() {
    this._isPlaying = false;
    if (this.target && this.mgr) this.target.active = false;
    // let brust = this._bursts;
    // for(let i = 0;i<brust.length;i++){
    //     brust[i].reset();
    // }
  }

  public override onEnable() {
    this._followInited = false; // 強制標記需要重新初始化座標
  }

  public clear() {
    this._isEmitting = false;
    this._emitRateTimeCounter = 0;
    this._emitRateDistanceCounter = 0;
    this._time = 0; // 重置時間軸
    this._ownedParticles.length = 0; // 徹底清空當前追蹤的粒子清單
    this._followInited = false; // 標記為未初始化，下次啟動需重新抓取座標

    if (this.mgr && this.target) {
      this.mgr.removeTarget(this.target);
      this.target = null;
    }

    this.bps.removeBatch(this);
  }

  public init(p: BatchParticles, id = 0) {
    this.id = id;
    this.bps = p;
    this.isInit = true;
    this._followInited = false; // 確保 applyLocalFollow 重新抓取首幀

    this.loop = p.psys.loop;
    this.duration = p.psys.duration;

    if (p.psys.playOnAwake) {
      this.play();
    }

    this._time = 0;
    this._isEmitting = true;
    this._emitRateTimeCounter = 0;
    this._emitRateDistanceCounter = 0;

    // 清空粒子陣列防止引用錯誤
    this._ownedParticles = [];

    const brust = p.psys.bursts;
    for (let i = 0; i < brust.length; i++) {
      let b = this._bursts[i];
      if (!b) {
        b = this._bursts[i] = new Burst();
      }

      b.time = 0;
      b.count = brust[i].count;
      b.repeatCount = brust[i].repeatCount;
      b.repeatInterval = brust[i].repeatInterval;
    }
  }

  public begin(dt: number) {
    if (this._isPlaying) {
      this._time += dt;

      const psys = this.bps.psys;
      // const initNode = this.bps.initNode;
      // const S = this.S,
      //   R = this.R,
      //   T = this.T;
      const node = this.target ? this.target : this.node;

      // 注意：不在此设置 psys.node，因为 _emit() 会负责切换粒子系统的节点
      // 只维护循环状态和时间数据
      psys.loop = this.loop;
      psys.duration = this.duration;

      node.updateWorldTransform();
      node.getWorldPosition(this._curWPos);

      if (this.isInit) {
        this.isInit = false;
        node.getWorldPosition(this._oldWPos);
      }

      // 計算這一幀的位移增量
      Vec3.subtract(this.deltaPos, this._curWPos, this._oldWPos);
      this._oldWPos.set(this._curWPos);

      psys['_time'] = this._time;
      psys['_curWPos'].set(this._curWPos);
      psys['_oldWPos'].set(this._oldWPos);
      psys['_isEmitting'] = this._isEmitting;
      psys['_emitRateTimeCounter'] = this._emitRateTimeCounter;
      psys['_emitRateDistanceCounter'] = this._emitRateDistanceCounter;

      const b = psys.bursts;
      const a = this._bursts;
      for (let i = 0; i < b.length; i++) {
        b[i] = a[i];
      }

      return true;
    }

    return false;
  }

  public end() {
    const psys = this.bps.psys;
    this._time = psys['_time'];
    this._curWPos.set(psys['_curWPos']);
    this._oldWPos.set(psys['_oldWPos']);
    this._isEmitting = psys['_isEmitting'];
    this._emitRateTimeCounter = psys['_emitRateTimeCounter'];
    this._emitRateDistanceCounter = psys['_emitRateDistanceCounter'];

    // const node = this.target ? this.target : this.node;
    // node.setRTS(this.R, this.T, this.S);

    if (!this._isEmitting) {
      this.stop();
      this.clear();
      return true;
    }
    return false;
  }

  public registerParticle(p: any) {
    if (!this._ownedParticles) this._ownedParticles = [];
    this._ownedParticles.push(p);
  }

  public applyLocalFollow() {
    const follow = this.target ?? this.node;

    if (!follow) return;

    follow.getWorldPosition(this._curWPos);
    follow.getWorldRotation(this._curWRot);
    follow.getWorldScale(this._curWScale);

    if (!this._followInited) {
      this._followInited = true;
      this._prevWPos.set(this._curWPos);
      this._prevWRot.set(this._curWRot);
      this._prevWScale.set(this._curWScale);
      return;
    }

    Quat.invert(this._invPrevRot, this._prevWRot);
    Quat.multiply(this._deltaRot, this._curWRot, this._invPrevRot);

    this._deltaScale.set(
      this._prevWScale.x !== 0 ? this._curWScale.x / this._prevWScale.x : 1,
      this._prevWScale.y !== 0 ? this._curWScale.y / this._prevWScale.y : 1,
      this._prevWScale.z !== 0 ? this._curWScale.z / this._prevWScale.z : 1
    );

    for (let i = this._ownedParticles.length - 1; i >= 0; i--) {
      const p = this._ownedParticles[i];

      const life = p.remainingLifetime ?? p['_remainingLifetime'];
      if (life !== undefined && life <= 0) {
        this._ownedParticles.splice(i, 1);
        continue;
      }

      const pos: Vec3 = p.position ?? p['_position'];
      if (!pos) continue;

      Vec3.subtract(this.tmp, pos, this._prevWPos);
      Vec3.transformQuat(this.tmp, this.tmp, this._deltaRot);

      this.tmp.x *= this._deltaScale.x;
      this.tmp.y *= this._deltaScale.y;
      this.tmp.z *= this._deltaScale.z;

      Vec3.add(pos, this._curWPos, this.tmp);

      const vel: Vec3 = p.velocity ?? p['_velocity'];
      if (vel) {
        Vec3.transformQuat(vel, vel, this._deltaRot);
        vel.x *= this._deltaScale.x;
        vel.y *= this._deltaScale.y;
        vel.z *= this._deltaScale.z;
      }
    }

    this._prevWPos.set(this._curWPos);
    this._prevWRot.set(this._curWRot);
    this._prevWScale.set(this._curWScale);
  }
}
