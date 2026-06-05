import {
  _decorator,
  CCInteger,
  Component,
  ParticleSystem2D,
  random,
  SpriteFrame,
} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('ParticleSystemChangeSprite')
export class ParticleSystemChangeSprite extends Component {
  @property(ParticleSystem2D)
  private particleSystem: ParticleSystem2D = null;
  @property([SpriteFrame])
  private sprites: SpriteFrame[] = [];
  @property(CCInteger)
  private fps = 30;

  private count = 0;

  protected onEnable(): void {
    this.count = Math.floor(random() * this.sprites.length);
    this.particleSystem.spriteFrame = this.sprites[this.count];
    this.particleSystem.resetSystem();
    this.changeSprite();
  }
  protected onDisable(): void {
    this.count = 0;
    this.particleSystem.stopSystem();
  }

  private async changeSprite() {
    while (this.node.active) {
      this.count++;
      if (this.count >= this.sprites.length) {
        this.count = 0;
      }
      this.particleSystem.spriteFrame = this.sprites[this.count];
      await this.waitForSeconds(1 / this.fps);
    }
  }
  waitForSeconds(sec: number) {
    return new Promise<void>(resolve => {
      setTimeout(() => resolve(), sec * 1000);
    });
  }
}
