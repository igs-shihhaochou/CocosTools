import {_decorator, Component, ParticleSystem2D} from 'cc';

const {ccclass} = _decorator;

@ccclass
export class EnableToPlayParticle extends Component {
  private particleSystem: ParticleSystem2D = null;

  ///物件被產生自動抓
  public onLoad() {
    this.particleSystem = this.getComponent<ParticleSystem2D>(ParticleSystem2D);
  }

  protected onDestroy(): void {
    this.particleSystem = null;
  }

  ///物件被打開時
  public onEnable() {
    if (this.particleSystem) {
      this.particleSystem.resetSystem();
    }
  }

  protected onDisable(): void {
    if (this.particleSystem) {
      this.particleSystem.stopSystem();
    }
  }
}
