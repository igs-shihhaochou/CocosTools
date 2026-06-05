import {
  _decorator,
  Vec2,
  Enum,
  Component,
  Prefab,
  SpriteFrame,
  AnimationClip,
  Color,
  v2,
  Tween,
  misc,
  tween,
  Sprite,
  Node,
  CCFloat,
  CCInteger,
  Animation,
  v3,
  UIOpacity,
  CCBoolean,
} from 'cc';
import {SpawnPool} from './SpawnPool';
import {EDITOR_NOT_IN_PREVIEW} from 'cc/env';

const {ccclass, property, playOnFocus, executeInEditMode} = _decorator;

interface NodeParticle {
  node: Node;
  lifetime: number;
  gravityXY: Vec2;
  beginScale: number; //起始時的Scale
  endScale: number; //結束時的Scale
  currentLifeTime: number; //目前生存的時間
  currentGrivate: Vec2; //要移動的位移量
}

enum enumEmitNodeType {
  PREFAB,
  SPRITE_FRAME,
  SPRITE_ANIMATION,
  SPRITE_ANIMATION_CLIP,
}

// @ccclass('SpriteBlend')
// class SpriteBlend implements BlendFunc {
//   @property({type: Enum(macro.BlendFactor)})
//   public srcBlendFactor: macro.BlendFactor = macro.BlendFactor.SRC_ALPHA;
//   @property({type: Enum(macro.BlendFactor)})
//   public dstBlendFactor: macro.BlendFactor =
//     macro.BlendFactor.ONE_MINUS_SRC_ALPHA;
// }

//20190724 byYC
//20190726 新增beginScale、endScale
@ccclass('NodeParticleSystem')
@playOnFocus
@executeInEditMode
export class NodeParticleSystem extends Component {
  @property({type: CCBoolean, displayName: '預覽'})
  private set preview(bool: boolean) {
    this._preview = bool;

    if (bool) {
      this.rePlayParticleSystem();
    } else {
      this.stopParticleSystem();

      this.spawnpool?.despawnAll();
      this.spawnpool?.destroy();
      this.spawnpool = null;
      this.receiveNodeParticleListIndex = [];
      this.nodeParticleList = [];

      this.cloneNodeSource = null;

      if (this.tempSpriteNode) this.tempSpriteNode.destroy();
      this.tempSpriteNode = null;

      this.node.destroyAllChildren();
    }
  }
  private get preview(): boolean {
    return this._preview;
  }
  private _preview = false;

  @property({type: Enum(enumEmitNodeType), displayName: '發射節點類型'})
  private emitNodeType: enumEmitNodeType = enumEmitNodeType.PREFAB;

  @property({
    type: Prefab,
    displayName: 'Prefab表演物件',
    visible(this: NodeParticleSystem) {
      return this.emitNodeType === enumEmitNodeType.PREFAB;
    },
  })
  private targetNode: Prefab = null;

  //#region Sprite
  @property({
    type: SpriteFrame,
    displayName: 'Sprite Frame',
    visible(this: NodeParticleSystem) {
      return this.emitNodeType === enumEmitNodeType.SPRITE_FRAME;
    },
  })
  private targetSpriteFrame: SpriteFrame = null;
  @property({
    type: [SpriteFrame],
    displayName: 'Sprite Animation',
    visible(this: NodeParticleSystem) {
      return this.emitNodeType === enumEmitNodeType.SPRITE_ANIMATION;
    },
  })
  private targetSpriteAnimation: Array<SpriteFrame> = new Array<SpriteFrame>();
  @property({
    type: Enum(AnimationClip.WrapMode),
    displayName: 'Sprite Animation Wrap',
    visible(this: NodeParticleSystem) {
      return this.emitNodeType === enumEmitNodeType.SPRITE_ANIMATION;
    },
  })
  private spriteAnimationWrapMode: AnimationClip.WrapMode =
    AnimationClip.WrapMode.Loop;
  @property({
    displayName: 'Sprite Animation FPS',
    visible(this: NodeParticleSystem) {
      return this.emitNodeType === enumEmitNodeType.SPRITE_ANIMATION;
    },
  })
  private spriteAnimationFPS = 60;
  @property({
    type: AnimationClip,
    displayName: 'Sprite Animation Clip',
    visible(this: NodeParticleSystem) {
      return this.emitNodeType === enumEmitNodeType.SPRITE_ANIMATION_CLIP;
    },
  })
  private targetSpriteAnimationClip: AnimationClip = null;
  @property({
    displayName: 'Color',
    visible(this: NodeParticleSystem) {
      return this.isSpriteType();
    },
  })
  private targetSpriteColor: Color = new Color(255, 255, 255);
  // @property({
  //   type: SpriteBlend,
  //   displayName: 'Blend',
  //   visible(this: NodeParticleSystem) {
  //     return this.IsSpriteType();
  //   },
  // })
  // private targetSpriteBlend: SpriteBlend = new SpriteBlend();
  //#endregion

  //#region TweenModule
  @property({
    displayName: 'Tween Module',
    visible(this: NodeParticleSystem) {
      return this.isSpriteType();
    },
  })
  private spriteTweenModule = false;
  @property({
    displayName: 'Start Color',
    visible(this: NodeParticleSystem) {
      return this.isSpriteType() && this.spriteTweenModule;
    },
  })
  private startColor: Color = new Color(255, 255, 255);
  @property({
    displayName: 'Start Color Var',
    visible(this: NodeParticleSystem) {
      return this.isSpriteType() && this.spriteTweenModule;
    },
  })
  private startColorVar: Color = new Color(0, 0, 0, 0);
  @property({
    displayName: 'End Color',
    visible(this: NodeParticleSystem) {
      return this.isSpriteType() && this.spriteTweenModule;
    },
  })
  private endColor: Color = new Color(255, 255, 255);
  @property({
    displayName: 'End Color Var',
    visible(this: NodeParticleSystem) {
      return this.isSpriteType() && this.spriteTweenModule;
    },
  })
  private endColorVar: Color = new Color(0, 0, 0, 0);
  //#endregion

  @property({displayName: '隨機旋轉角度'})
  private randomRotation = false;

  @property({displayName: '開啟物件時播放'})
  private enableToPlay = true;

  @property({type: CCFloat, displayName: '表演持續時間'})
  private duration = -1; //播放時間長度 -1: Forever

  @property({type: CCFloat, displayName: '粒子生存時間'})
  private lifetime = 1;

  @property({
    type: CCFloat,
    displayName: '粒子生存時間浮動值',
    tooltip: '粒子生存時間 ± 粒子生存時間浮動值',
  })
  private lifetimeRandomRange = 0;

  @property({type: CCInteger, displayName: '每秒發射數量'})
  public emissionRate = 10;

  @property({displayName: '發射範圍'})
  public emitArea: Vec2 = v2();

  @property({type: CCFloat, displayName: '移動速度'})
  public speed = 10;

  @property({
    type: CCFloat,
    displayName: '移動速度浮動值',
    tooltip: '移動速度 ± 移動速度浮動值',
  })
  public speedRamdomRange = 0; //移動速度浮動範圍

  @property({displayName: '發射角度'})
  private angle = 90;

  @property({
    displayName: '發射角度浮動值',
    tooltip: '發射角度 ± 發射角度浮動值',
  })
  private angleRandomRange = 0;

  @property({displayName: '重力方向'})
  public gravityXY: Vec2 = v2(0, 1);

  @property({displayName: '起始Scale'})
  private beginScale = 1;

  @property({displayName: '結束Scale'})
  private endScale = 1;

  //#region Public Property (避免影響原專案已設定的上方屬性)
  /** 表演物件 */
  public get TargetNode(): Prefab {
    return this.targetNode;
  }
  /** 隨機隨轉角度 */
  public get RandomRotation(): boolean {
    return this.randomRotation;
  }
  /** 開啟物件時播放 */
  public get EnableToPlay(): boolean {
    return this.enableToPlay;
  }
  /** 播放時間長度 -1: Forever */
  public get Duration(): number {
    return this.duration;
  }
  /** 生存時間 */
  public get Lifetime(): number {
    return this.lifetime;
  }
  /** 生存時間浮動值 */
  public get LifetimeRandomRange(): number {
    return this.lifetimeRandomRange;
  }
  /** 每秒發射數量 */
  public get EmissionRate(): number {
    return this.emissionRate;
  }
  /** 發射範圍 */
  public get EmitArea(): Vec2 {
    return this.emitArea;
  }
  /** 移動速度 */
  public get Speed(): number {
    return this.speed;
  }
  /** 發射角度 */
  public get Angle(): number {
    return this.angle;
  }
  /** 發射角度浮動值 */
  public get AngleRandomRange(): number {
    return this.angleRandomRange;
  }
  /** 重力方向 */
  public get GravityXY(): Vec2 {
    return this.gravityXY;
  }
  /** 起始時的Scale */
  public get BeginScale(): number {
    return this.beginScale;
  }
  /** 結束時的Scale */
  public get EndScale(): number {
    return this.endScale;
  }
  //#endregion public property

  private receiveNodeParticleListIndex: number[] = []; //要回收nodeParticle的Index

  private spawnpool: SpawnPool = null; //物件生成器

  private nodeParticleList: NodeParticle[] = []; //特效物件

  private cloneNodeSource: Node = null;

  private tempSpriteNode: Node = null;

  onLoad() {
    //編輯模式且非預覽模式則略過
    if (EDITOR_NOT_IN_PREVIEW && !this.preview) return;

    if (!this.spawnpool) this.spawnpool = this.addComponent(SpawnPool);
  }

  onEnable() {
    //編輯模式且非預覽模式則略過
    if (EDITOR_NOT_IN_PREVIEW && !this.preview) return;

    if (
      !this.targetNode &&
      !this.targetSpriteFrame &&
      (!this.targetSpriteAnimation ||
        this.targetSpriteAnimation.length === 0) &&
      !this.targetSpriteAnimationClip
    ) {
      console.warn(
        '[NodeParticleSystem] TargetPrefab / TargetSpriteFrame / TargetSpriteAnimation / TargetSpriteAnimationClip Not Found.'
      );
      return;
    }

    //沒有設定enableToPlay直接跳掉
    if (!this.enableToPlay) return;

    this.rePlayParticleSystem();
  }

  onDisable() {
    //編輯模式且非預覽模式則略過
    if (EDITOR_NOT_IN_PREVIEW && !this.preview) return;

    this.spawnpool?.despawnAll();
    this.nodeParticleList = [];
  }

  onDestroy() {
    this.receiveNodeParticleListIndex = null;

    if (this.spawnpool) this.spawnpool.despawnAll();
    this.spawnpool = null;

    this.nodeParticleList = null;

    this.cloneNodeSource = null;

    if (this.tempSpriteNode) this.tempSpriteNode.destroy();
    this.tempSpriteNode = null;
  }

  update(dt) {
    //編輯模式且非預覽模式則略過
    if (EDITOR_NOT_IN_PREVIEW && !this.preview) return;

    this.nodeParticleList.forEach((element, index) => {
      element.currentLifeTime += dt;

      //超過生存時間就記錄起來
      if (element.currentLifeTime >= element.lifetime) {
        element.currentLifeTime = element.lifetime; //確保最後一次進入時是lifetime
        this.receiveNodeParticleListIndex.push(index);
      }

      //計算這一個Frame要更新的重力
      const updateGrivate: Vec2 = v2(
        element.gravityXY.x * dt,
        element.gravityXY.y * dt
      );

      //計算出這個Frame要更新的位移量
      element.currentGrivate = v2(
        element.currentGrivate.x + updateGrivate.x,
        element.currentGrivate.y + updateGrivate.y
      );

      //更新Position
      element.node.setPosition(
        v3(
          element.node.position.x + element.currentGrivate.x * dt,
          element.node.position.y + element.currentGrivate.y * dt
        )
      );

      //更新Scale(如果不需要變動就不進入計算)
      if (element.beginScale !== element.endScale) {
        const timeRate: number = element.currentLifeTime / element.lifetime; //經過時間的比例 0~1

        const scale: number =
          (element.endScale - element.beginScale) * timeRate +
          element.beginScale;

        element.node.setScale(v3(scale, scale, scale));
      }
    });

    //將有記錄起來的位置回收
    if (this.receiveNodeParticleListIndex.length > 0) {
      for (let i = this.receiveNodeParticleListIndex.length - 1; i >= 0; i--) {
        const element = this.receiveNodeParticleListIndex[i];

        this.spawnpool.despawn(this.nodeParticleList[element].node);

        this.nodeParticleList.splice(element, 1);
      }

      this.receiveNodeParticleListIndex = [];
    }
  }

  /**
   * 重新播放粒子特效
   */
  public rePlayParticleSystem() {
    //生成物件池
    if (!this.spawnpool) this.spawnpool = this.addComponent(SpawnPool);
    //指定型態處理
    switch (this.emitNodeType) {
      case enumEmitNodeType.PREFAB:
        if (this.targetNode) {
          this.cloneNodeSource = this.targetNode.data;
        }
        break;
      case enumEmitNodeType.SPRITE_FRAME:
        if (this.targetSpriteFrame) {
          this.cloneNodeSource = this.createTempSpriteNode(
            this.targetSpriteFrame.name + '_clone',
            this.targetSpriteFrame
          );
        }
        break;
      case enumEmitNodeType.SPRITE_ANIMATION:
        if (
          this.targetSpriteAnimation &&
          this.targetSpriteAnimation.length > 0
        ) {
          const spriteFrame: SpriteFrame = this.targetSpriteAnimation[0];
          this.cloneNodeSource = this.createTempSpriteNode(
            spriteFrame.name + '_clone',
            spriteFrame
          );
          //附加Animation
          const animation: Animation =
            this.cloneNodeSource.addComponent(Animation);
          const clip: AnimationClip = AnimationClip.createWithSpriteFrames(
            this.targetSpriteAnimation,
            this.spriteAnimationFPS
          );
          clip.name = 'SpriteAnimationClip';
          clip.wrapMode = this.spriteAnimationWrapMode;
          animation.addClip(clip);
        }
        break;
      case enumEmitNodeType.SPRITE_ANIMATION_CLIP:
        if (this.targetSpriteAnimationClip) {
          this.cloneNodeSource = this.createTempSpriteNode(
            this.targetSpriteAnimationClip.name + '_clone'
          );
          //附加Animation
          const animation: Animation =
            this.cloneNodeSource.addComponent(Animation);
          animation.addClip(this.targetSpriteAnimationClip);
        }
        break;
    }

    if (!this.cloneNodeSource) {
      console.warn(
        '[NodeParticleSystem] RePlayParticleSystem cloneNodeSource is null.'
      );
      return;
    }

    const eps: number = 1 / this.emissionRate;

    this.unscheduleAllCallbacks();

    //大於0代表有設定持續時間
    if (this.duration > 0) {
      const emitTimes: number = this.duration / eps;
      this.schedule(this.emitNode, eps, emitTimes);
    } else {
      this.schedule(this.emitNode, eps);
    }
  }

  //停止粒子特效
  public stopParticleSystem() {
    this.unscheduleAllCallbacks();
  }

  public resetAll() {
    this.spawnpool.despawnAll();
    this.nodeParticleList = [];
    this.receiveNodeParticleListIndex = [];
  }

  /**
   * 發射出物件
   */
  private emitNode() {
    if (!this.spawnpool) this.spawnpool = this.addComponent(SpawnPool);

    if (!this.cloneNodeSource) {
      console.warn('[NodeParticleSystem] EmitNode cloneNodeSource is null.');
      return;
    }

    //產生物件 給予生成位置
    const particleNode: Node = this.spawnpool.spawn(this.cloneNodeSource);
    particleNode.parent = this.node;
    particleNode.layer = this.node.layer;
    const createPosX: number = (Math.random() - 0.5) * 2 * this.emitArea.x;
    const createPosY: number = (Math.random() - 0.5) * 2 * this.emitArea.y;
    particleNode.setPosition(v3(createPosX, createPosY));
    particleNode.setScale(
      v3(this.beginScale, this.beginScale, this.beginScale)
    );

    //隨機旋轉角度
    if (this.randomRotation) particleNode.angle = Math.random() * 360;

    //角度轉向量,亂數取-1~1乘上亂數範圍
    const radian: number =
      ((this.angle + (Math.random() - 0.5) * 2 * this.angleRandomRange) *
        Math.PI) /
      180.0;
    const randomDirection: Vec2 = v2(Math.cos(radian), Math.sin(radian));

    //亂數產生生存時間
    const particleLifetime: number =
      this.lifetime + (Math.random() - 0.5) * 2 * this.lifetimeRandomRange;
    const particleSpeed: number =
      this.speed + (Math.random() - 0.5) * 2 * this.speedRamdomRange;

    //SPRITE 補間動畫
    if (this.isSpriteType()) {
      if (
        this.emitNodeType === enumEmitNodeType.SPRITE_ANIMATION ||
        this.emitNodeType === enumEmitNodeType.SPRITE_ANIMATION_CLIP
      ) {
        //隨機起始影格
        //TODO: 優化設定方式 降低取用次數
        const animation: Animation = particleNode.getComponent(Animation);
        const clip: AnimationClip = animation.clips[0];
        animation.play(clip.name);
        const state = animation.getState(clip.name);
        state.setTime(Math.random() * clip.duration);
      }
      //補間動畫模組
      if (this.spriteTweenModule) {
        Tween.stopAllByTarget(particleNode);

        const startColor: Color = new Color();
        startColor.r = misc.clampf(
          this.startColor.r + this.startColorVar.r * (Math.random() - 0.5) * 2,
          0,
          255
        );
        startColor.g = misc.clampf(
          this.startColor.g + this.startColorVar.g * (Math.random() - 0.5) * 2,
          0,
          255
        );
        startColor.b = misc.clampf(
          this.startColor.b + this.startColorVar.b * (Math.random() - 0.5) * 2,
          0,
          255
        );
        const startColorAlpha: number = misc.clampf(
          this.startColor.a + this.startColorVar.a * (Math.random() - 0.5) * 2,
          0,
          255
        );

        const endColor: Color = new Color();
        endColor.r = misc.clampf(
          this.endColor.r + this.endColorVar.r * (Math.random() - 0.5) * 2,
          0,
          255
        );
        endColor.g = misc.clampf(
          this.endColor.g + this.endColorVar.g * (Math.random() - 0.5) * 2,
          0,
          255
        );
        endColor.b = misc.clampf(
          this.endColor.b + this.endColorVar.b * (Math.random() - 0.5) * 2,
          0,
          255
        );
        const endColorAlpha: number = misc.clampf(
          this.endColor.a + this.endColorVar.a * (Math.random() - 0.5) * 2,
          0,
          255
        );
        particleNode.getComponent(Sprite).color = startColor;
        particleNode.getComponent(UIOpacity).opacity = startColorAlpha;

        tween(particleNode.getComponent(Sprite))
          .to(particleLifetime, {color: endColor})
          .start();
        tween(particleNode.getComponent(UIOpacity))
          .to(particleLifetime, {opacity: endColorAlpha})
          .start();
      }
    }

    const nodeParticle: NodeParticle = {
      node: particleNode,
      lifetime: particleLifetime,
      gravityXY: this.gravityXY,
      beginScale: this.beginScale,
      endScale: this.endScale,
      currentLifeTime: 0,
      currentGrivate: v2(
        randomDirection.x * particleSpeed,
        randomDirection.y * particleSpeed
      ),
    };

    this.nodeParticleList.push(nodeParticle);
  }

  /**
   * 建立暫存Sprite節點
   * @param name
   * @param source
   */
  private createTempSpriteNode(name?: string, source?: SpriteFrame): Node {
    if (this.tempSpriteNode) this.tempSpriteNode.destroy();

    //Node
    this.tempSpriteNode = new Node();
    if (name && name !== '') this.tempSpriteNode.name = name;
    const sprite: Sprite = this.tempSpriteNode.addComponent(Sprite);
    const uiOpacity = this.tempSpriteNode.addComponent(UIOpacity);
    sprite.color = new Color(
      this.targetSpriteColor.r,
      this.targetSpriteColor.g,
      this.targetSpriteColor.b
    );
    uiOpacity.opacity = this.targetSpriteColor.a;
    //Sprite
    sprite.sizeMode = Sprite.SizeMode.RAW;
    sprite.trim = false;
    if (source) sprite.spriteFrame = source;
    // sprite.dstBlendFactor = this.targetSpriteBlend.dstBlendFactor;
    // sprite.srcBlendFactor = this.targetSpriteBlend.srcBlendFactor;

    return this.tempSpriteNode;
  }

  /**
   * 是否為Sprite類型
   */
  private isSpriteType(): boolean {
    return (
      this.emitNodeType === enumEmitNodeType.SPRITE_FRAME ||
      this.emitNodeType === enumEmitNodeType.SPRITE_ANIMATION ||
      this.emitNodeType === enumEmitNodeType.SPRITE_ANIMATION_CLIP
    );
  }
}
