import {
  _decorator,
  CCFloat,
  Component,
  ParticleSystem2D,
  Tween,
  tween,
} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('ParticleSizeControl')
export class ParticleSizeControl extends Component {
  @property({type: ParticleSystem2D, displayName: '粒子節點'})
  thisParticle: ParticleSystem2D = null;
  @property({type: CCFloat, displayName: '淡入時間'})
  public fadeInTime = 0.3;
  @property({type: CCFloat, displayName: '淡出時間'})
  public fadeOutTime = 0.3;
  @property({type: CCFloat, displayName: '開始淡出時間'})
  public fadeOutStartTime = 1;
  @property({type: CCFloat, displayName: '物件最大大小'})
  public maxSize = 5;

  private startSizeData = {value: 0};
  private endSizeData = {value: 0};

  protected onLoad(): void {
    if (!this.thisParticle) {
      this.thisParticle = this.getComponent(ParticleSystem2D);
    }
  }
  protected onEnable(): void {
    this.thisParticle.startSize = 0;
    this.thisParticle.endSize = this.maxSize;
    this.startSizeData.value = 0;
    this.endSizeData.value = this.maxSize;

    tween(this.startSizeData)
      .to(
        this.fadeInTime,
        {
          value: this.maxSize,
        },
        {
          onUpdate: () => {
            this.thisParticle.startSize = this.startSizeData.value;
          },
        }
      )
      .start();

    tween(this.endSizeData)
      .delay(this.fadeOutStartTime)
      .to(
        this.fadeOutTime,
        {
          value: 0,
        },
        {
          onUpdate: () => {
            this.thisParticle.endSize = this.endSizeData.value;
          },
        }
      )
      .start();
  }
  protected onDisable(): void {
    Tween.stopAllByTarget(this.startSizeData);
    Tween.stopAllByTarget(this.endSizeData);
  }
}
