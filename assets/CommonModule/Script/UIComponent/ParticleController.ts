import {
  _decorator,
  Component,
  director,
  Input,
  input,
  KeyCode,
  Scheduler,
  tween,
  tweenProgress,
  Vec2,
  Vec3,
} from 'cc';
const {ccclass, property} = _decorator;

declare const Promise;

/** 用於調度器的 target 對象 */
const schedulerTarget = {};
Scheduler.enableForTarget(schedulerTarget);

/**
 * 等待指定秒數（受 director.getScheduler().setTimeScale() 影響）
 */
export function waitForSeconds(seconds: number): Promise<void> {
  return new Promise(resolve => {
    director.getScheduler().schedule(
      () => {
        resolve();
      },
      schedulerTarget,
      0, // interval
      0, // repeat (0 = 只執行一次，執行後自動移除)
      seconds, // delay
      false // paused
    );
  });
}

@ccclass('ParticleController')
export class ParticleController extends Component {
  @property({displayName: '起始位置'}) startPos: Vec3;
  @property({displayName: '結束位置'}) endpos: Vec3;
  @property({displayName: '力道'}) curvature = 0.2; //力道
  @property({displayName: '時間'}) time = 0.4;
  @property({displayName: '需要關閉'}) needClose = false;
  @property({
    displayName: '關閉延遲時間',
    visible: function (this: ParticleController) {
      return this.needClose;
    },
  })
  closeDelayTime = 0;

  onLoad() {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  onKeyDown(event) {
    const midPos = this.BezierMidPoint(
      this.startPos,
      this.endpos,
      this.curvature
    );

    switch (event.keyCode) {
      case KeyCode.KEY_A:
        this.node.active = false;
        this.node.active = true;
        this.node.position = this.startPos;
        this.play(this.startPos, midPos, this.endpos);
        break;
    }
  }

  protected play(spawnPos: Vec3, midPos: Vec3, targetPos: Vec3) {
    tween(this.node)
      .to(this.time, {
        position: tweenProgress.bezier(...[spawnPos, midPos, targetPos]),
      })
      .call(async () => {
        if (this.needClose) {
          await waitForSeconds(this.closeDelayTime);
          this.node.active = false;
          this.node.position = this.startPos;
        }
      })
      .start();
  }

  // 計算貝茲曲線的中心
  private BezierMidPoint(start: Vec3, end: Vec3, curvature: number): Vec3 {
    const jitter = new Vec2();
    const curve = new Vec3();

    jitter.x = (end.y - start.y) * curvature;
    jitter.y = (start.x - end.x) * curvature;

    const slide = jitter.y / jitter.x;

    if (slide > 0) {
      if (jitter.x < 0) {
        jitter.x *= -1;
      }

      if (jitter.y < 0) {
        jitter.y *= -1;
      }
    } else {
      if (jitter.x > 0) {
        jitter.x *= -1;
      }

      if (jitter.y < 0) {
        jitter.y *= -1;
      }
    }

    curve.x = (start.x + end.x) / 2 + jitter.x;
    curve.y = (start.y + end.y) / 2 + jitter.y;

    return curve;
  }
}
