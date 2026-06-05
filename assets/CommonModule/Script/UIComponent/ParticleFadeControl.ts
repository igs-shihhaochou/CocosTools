import {
  _decorator,
  CCFloat,
  Color,
  Component,
  ParticleSystem2D,
  Tween,
  tween,
} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('ParticleFadeControl')
export class ParticleFadeControl extends Component {
  @property({type: ParticleSystem2D, displayName: '粒子節點'})
  thisParticle: ParticleSystem2D = null;
  @property({type: CCFloat, displayName: '淡入時間'})
  public fadeInTime = 0.3;
  @property({type: CCFloat, displayName: '淡出時間'})
  public fadeOutTime = 0.3;
  @property({type: CCFloat, displayName: '開始淡出時間'})
  public fadeOutStartTime = 1;

  @property(Color) oriStartColor: Color = new Color(0, 0, 0, 0);
  @property(Color) oriEndColor: Color = new Color(0, 0, 0, 0);

  protected onLoad(): void {
    if (!this.thisParticle) {
      this.thisParticle = this.getComponent(ParticleSystem2D);
    }
    this.oriStartColor = this.thisParticle.startColor.clone();
    this.oriEndColor = this.thisParticle.endColor.clone();
    console.log(
      'ParticleFadeControl onLoad',
      this.oriStartColor,
      this.oriEndColor
    );
  }
  protected onEnable(): void {
    this.thisParticle.startColor = this.getColor(this.oriStartColor, 0);
    this.thisParticle.endColor = this.oriEndColor;

    tween(this.thisParticle.startColor)
      .to(this.fadeInTime, {
        r: this.oriStartColor.r,
        g: this.oriStartColor.g,
        b: this.oriStartColor.b,
        a: this.oriStartColor.a,
      })
      .start();
    tween(this.thisParticle.endColor)
      .delay(this.fadeOutStartTime)
      .to(this.fadeOutStartTime, {
        r: this.oriEndColor.r,
        g: this.oriEndColor.g,
        b: this.oriEndColor.b,
        a: 0,
      })
      .start();
  }
  protected onDisable(): void {
    Tween.stopAllByTarget(this.thisParticle.startColor);
    Tween.stopAllByTarget(this.thisParticle.endColor);
  }

  private getColor(color: Color, alpha: number): Color {
    return new Color(color.r, color.g, color.b, alpha);
  }
}
