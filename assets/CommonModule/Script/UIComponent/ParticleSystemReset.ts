import {_decorator, Component, ParticleSystem2D} from 'cc';

const {ccclass, property} = _decorator;

@ccclass('ParticleSystemReset')
export class ParticleSystemReset extends Component {
  @property(ParticleSystem2D)
  public particle: ParticleSystem2D | null = null;

  protected onLoad(): void {
    if (this.particle === null) {
      this.particle = this.getComponent(ParticleSystem2D);
    }
  }

  protected onDestroy(): void {
    this.particle = null;
  }

  protected onDisable(): void {
    this.particle.resetSystem();
    this.particle.stopSystem();
  }

  protected onEnable(): void {
    this.particle.resetSystem();
  }
}
