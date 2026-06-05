import {_decorator, Component, ParticleSystem, ParticleSystem2D} from 'cc';
const {ccclass, menu} = _decorator;

@ccclass('AutoResetParticle')
@menu('0_Common/Game/Component/AutoResetParticle')
export default class AutoResetParticle extends Component {
  private particleSystem: ParticleSystem = null;
  private particleSystem2D: ParticleSystem2D = null;
  onEnable() {
    if (!this.particleSystem)
      this.particleSystem = this.getComponent(ParticleSystem);

    if (!this.particleSystem2D)
      this.particleSystem2D = this.getComponent(ParticleSystem2D);

    this.particleSystem?.stop();
    this.particleSystem?.play();
    this.particleSystem2D?.resetSystem();
  }
  onDisable() {
    this.particleSystem?.stop();
    this.particleSystem2D?.stopSystem();
  }
}
