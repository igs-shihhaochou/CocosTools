import {_decorator, Component, Node} from 'cc';
import {Particle3DBatchManager} from 'db://assets/CommonModule/Script/Utility/ParticleBatch/Particle3DBatchManager';
const {ccclass, property} = _decorator;

@ccclass('BatchFX')
export class BatchFX extends Component {
  @property({
    tooltip: '特效分組Key，同Key的模板會一起生成（可做複合特效）',
  })
  public fxKey = '';

  @property(Node)
  protected engineAnchor: Node | null = null;

  private fxId = -1;
  protected override onEnable() {
    if (!this.engineAnchor) return;

    // 先建立一組合批粒子（得到 id）
    this.fxId = Particle3DBatchManager.instance.addParticleWithTarget(
      this.fxKey,
      this.engineAnchor,
      true
    );
  }

  protected override onDisable() {
    if (this.fxId >= 0) {
      Particle3DBatchManager.instance.removeParticle(this.fxId);
    }
    this.fxId = -1;
  }
}
