import {
  _decorator,
  CCFloat,
  CCInteger,
  Component,
  director,
  Enum,
  EventHandler,
  ParticleSystem2D,
  Scheduler,
  tween,
  TweenEasing,
  UIOpacity,
  Vec2,
  Vec3,
} from 'cc';
import {setOpacity} from '../Utility/NodeProperty';
import {tweenNodeEx} from '../Utility/TweenUtil';
import {ParticleSystemReset} from './ParticleSystemReset';
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

export enum FlyMode {
  STRAIGHT,
  BEZIER,
}
export enum EasingKey {
  none = 'none',
  sineIn = 'sineIn',
  sineOut = 'sineOut',
  sineInOut = 'sineInOut',
  quadIn = 'quadIn',
  quadOut = 'quadOut',
  quadInOut = 'quadInOut',
  cubicIn = 'cubicIn',
  cubicOut = 'cubicOut',
  cubicInOut = 'cubicInOut',
  quartIn = 'quartIn',
  quartOut = 'quartOut',
  quartInOut = 'quartInOut',
  quintIn = 'quintIn',
  quintOut = 'quintOut',
  quintInOut = 'quintInOut',
  expoIn = 'expoIn',
  expoOut = 'expoOut',
  expoInOut = 'expoInOut',
  circIn = 'circIn',
  circOut = 'circOut',
  circInOut = 'circInOut',
  backIn = 'backIn',
  backOut = 'backOut',
  backInOut = 'backInOut',
  elasticIn = 'elasticIn',
  elasticOut = 'elasticOut',
  elasticInOut = 'elasticInOut',
  bounceIn = 'bounceIn',
  bounceOut = 'bounceOut',
  bounceInOut = 'bounceInOut',
}
@ccclass('RoadData')
export class RoadData {
  @property({displayName: '起始位置'})
  public startPos: Vec3 = new Vec3(0, 0, 0);
  @property({displayName: '終點位置'})
  public endPos: Vec3 = new Vec3(0, 0, 0);
  @property({type: Enum(FlyMode), displayName: '飛行方式'})
  public flyMode = FlyMode.STRAIGHT;
  @property({
    type: CCFloat,
    displayName: '  貝茲-曲線力道',
    visible: function (this: RoadData) {
      return this.flyMode === FlyMode.BEZIER;
    },
  })
  public beizerCurvature = 0.2;
  @property({
    displayName: '  貝茲-曲線反向',
    visible: function (this: RoadData) {
      return this.flyMode === FlyMode.BEZIER;
    },
  })
  public beizerNegate = true;

  @property({type: CCFloat, displayName: '飛行時間'})
  public flyTime = 0.5;
  @property({type: Enum(EasingKey), displayName: 'Ease'})
  public easingType = EasingKey.none;

  @property({displayName: '完成事件'})
  public haveFinishEvent = false;
  @property({
    type: [EventHandler],
    visible: function (this: RoadData) {
      return this.haveFinishEvent;
    },
  })
  public finishEvent: EventHandler[] = [];
}

@ccclass('RoadController')
export class RoadController extends Component {
  @property({type: [RoadData], displayName: '飛行節點'})
  public roadAry: RoadData[] = [];
  @property({displayName: '開啟時播放'})
  public enableToPlay = true;
  /*@property({type: CCFloat, displayName: '延遲播放'}) public delayToPlay = 0;*/
  @property({type: CCFloat, displayName: 'loop'}) public loopTime = 0;

  /*@property({type: Boolean, displayName: '播放'})*/
  public setPlayToggle = false;
  /*@property({type: Boolean, displayName: '停止'})*/
  public setStopToggle = false;

  @property({displayName: '需要淡入'}) public useFadeIn = false;
  @property({
    type: CCFloat,
    displayName: '物件淡入秒數',
    visible: function (this: RoadController) {
      return this.useFadeIn;
    },
  })
  public showTime = 0.3;
  @property({
    type: CCFloat,
    displayName: '物件淡入透明度',
    visible: function (this: RoadController) {
      return this.useFadeIn;
    },
  })
  public showOpencity = 255;

  @property({displayName: '需要淡出'})
  public useFadeOut = false;
  @property({
    type: CCFloat,
    displayName: '物件淡出秒數',
    visible: function (this: RoadController) {
      return this.useFadeOut;
    },
  })
  public hideTime = 0.3;
  @property({
    type: CCFloat,
    displayName: '物件開始淡出秒數',
    visible: function (this: RoadController) {
      return this.useFadeOut;
    },
  })
  public startHideTime = 5;
  @property({
    type: CCInteger,
    displayName: '物件淡出透明度',
    visible: function (this: RoadController) {
      return this.useFadeOut;
    },
  })
  public hideOpencity = 0;

  @property({displayName: '自動加入particleReset'})
  public autoAddParticleReset = true;

  @property({displayName: '開始事件'})
  public haveStartEvent = false;
  @property({
    type: [EventHandler],
    visible: function (this: RoadController) {
      return this.haveStartEvent;
    },
  })
  public startEvent: EventHandler[] = [];

  @property({displayName: '結束事件'})
  public haveEndEvent = false;
  @property({
    type: [EventHandler],
    visible: function (this: RoadController) {
      return this.haveEndEvent;
    },
  })
  public endEvent: EventHandler[] = [];

  @property({displayName: '暫停事件'})
  public haveStopEvent = false;
  @property({
    type: [EventHandler],
    visible: function (this: RoadController) {
      return this.haveStopEvent;
    },
  })
  public stopEvent: EventHandler[] = [];

  public isPlay = false;
  startTween = null;
  delayTween = null;
  loopTween = null;
  moveTween = null;
  fadeInTween = null;
  fadeOutTween = null;

  protected onLoad(): void {
    if (this.getComponent(UIOpacity) === null) {
      this.node.addComponent(UIOpacity);
    }

    if (this.autoAddParticleReset) {
      this.node.children.forEach(child => {
        if (
          child.getComponent(ParticleSystem2D) !== null &&
          child.getComponent(ParticleSystemReset) === null
        ) {
          child.addComponent(ParticleSystemReset);
        }
      });
    }
  }
  protected onEnable(): void {
    if (this.enableToPlay) {
      this.setPlayToggle = true;
    }
  }
  protected onDisable(): void {
    this.isPlay = false;
    this.stopAllTween();
    /*this.node.children.forEach(child => {
      child.active = false;
    });*/
  }

  public async playEffectRoad() {
    if (this.roadAry.length === 0) {
      console.warn('No road data available to play.');
      return;
    }
    this.isPlay = true;

    //開始事件
    if (this.haveStartEvent && this.startEvent) {
      EventHandler.emitEvents(this.startEvent);
    }

    //延遲開始
    /*if (this.delayToPlay > 0) {
      await waitForSeconds(this.delayToPlay);
    }*/

    //設定Loop
    if (this.loopTime > 0) {
      this.loopTween = this.scheduleOnce(() => {
        this.stopEffectRoad();
      }, this.loopTime);
    }

    //設定FadeOut
    if (this.useFadeOut) {
      this.fadeOutTween = this.scheduleOnce(() => {
        this.setFadeOut();
      }, this.startHideTime);
    }

    //開始路徑移動
    if (this.isPlay) {
      /*this.node.children.forEach(child => {
        child.active = true;
      });*/
      //fadeIn
      if (this.useFadeIn) {
        setOpacity(this.node, 0);
        this.fadeInTween = tweenNodeEx(this.node)
          .to(this.showTime, {opacity: this.showOpencity})
          .start();
      } else {
        setOpacity(this.node, 255);
      }

      this.node.setPosition(this.roadAry[0].startPos);
      while (this.isPlay) {
        for (let i = 0; i < this.roadAry.length; i++) {
          if (!this.isPlay) break;
          const startPos = this.roadAry[i].startPos;
          const endPos = this.roadAry[i].endPos;
          const time = this.roadAry[i].flyTime;
          const ease = this.roadAry[i].easingType;
          const tweenOptions = this.buildTweenOptions(ease);
          if (this.roadAry[i].flyMode === FlyMode.BEZIER) {
            const midPos = this.getMidPos(i);
            this.moveTween = this.createBezierTween(
              startPos,
              midPos,
              endPos,
              time,
              tweenOptions?.easing
            );
          }
          if (this.roadAry[i].flyMode === FlyMode.STRAIGHT) {
            this.moveTween = tween(this.node)
              .to(
                time,
                {
                  position: endPos,
                },
                tweenOptions
              )
              .start();
          }

          await waitForSeconds(time);

          if (this.roadAry[i].haveFinishEvent && this.roadAry[i].finishEvent) {
            EventHandler.emitEvents(this.roadAry[i].finishEvent);
          }
        }
        if (this.loopTime === 0) {
          break;
        }
      }
    }
    //結束事件
    if (this.haveEndEvent && this.endEvent) {
      EventHandler.emitEvents(this.endEvent);
    }

    this.stopEffectRoad();
  }
  public async stopEffectRoad() {
    if (!this.isPlay) return;
    this.isPlay = false;

    this.stopAllTween();
    /*this.node.children.forEach(child => {
      child.active = false;
    });*/
    this.node.active = false;
  }

  protected update(): void {
    if (this.setPlayToggle) {
      this.setPlayToggle = false;
      this.startTween = this.playEffectRoad();
    }
    if (this.setStopToggle) {
      this.setStopToggle = false;

      //暫停事件
      if (this.haveStopEvent && this.stopEvent) {
        EventHandler.emitEvents(this.stopEvent);
      }

      this.stopEffectRoad();
    }
  }

  public stopAllTween() {
    this.stopTweenLike(this.startTween);
    this.stopTweenLike(this.delayTween);
    this.stopTweenLike(this.loopTween);
    this.stopTweenLike(this.moveTween);
    this.stopTweenLike(this.fadeInTween);
    this.stopTweenLike(this.fadeOutTween);
  }

  public stopTweenLike(
    target: {stopAllTween?: () => void; stop?: () => void} | null | undefined
  ) {
    if (!target) {
      return;
    }

    if (typeof target.stopAllTween === 'function') {
      target.stopAllTween();
      return;
    }

    if (typeof target.stop === 'function') {
      target.stop();
    }
  }

  public buildTweenOptions(ease: EasingKey) {
    if (!ease || ease === EasingKey.none) {
      return undefined;
    }

    return {easing: ease as TweenEasing};
  }

  public createBezierTween(
    startPos: Vec3,
    midPos: Vec3,
    endPos: Vec3,
    duration: number,
    easing?: TweenEasing
  ) {
    const progressData = {t: 0};
    const options: {
      easing?: TweenEasing;
      onUpdate: (target: {t: number}) => void;
    } = {
      onUpdate: (target: {t: number}) => {
        const pos = this.getQuadraticBezierPoint(
          startPos,
          midPos,
          endPos,
          target.t
        );
        this.node.setPosition(pos);
      },
    };

    if (easing) {
      options.easing = easing;
    }

    return tween(progressData)
      .to(duration, {t: 1}, options)
      .call(() => {
        this.node.setPosition(endPos);
      })
      .start();
  }

  public getQuadraticBezierPoint(
    start: Vec3,
    control: Vec3,
    end: Vec3,
    t: number
  ): Vec3 {
    const oneMinusT = 1 - t;
    const tt = t * t;
    const oneMinusT2 = oneMinusT * oneMinusT;

    const x = oneMinusT2 * start.x + 2 * oneMinusT * t * control.x + tt * end.x;
    const y = oneMinusT2 * start.y + 2 * oneMinusT * t * control.y + tt * end.y;
    const z = oneMinusT2 * start.z + 2 * oneMinusT * t * control.z + tt * end.z;

    return new Vec3(x, y, z);
  }

  public setFadeOut() {
    tweenNodeEx(this.node)
      .to(this.hideTime, {opacity: this.hideOpencity})
      .start();
  }

  public getMidPos(RoadAryIndex): Vec3 {
    return this.BezierMidPoint(
      this.roadAry[RoadAryIndex].startPos,
      this.roadAry[RoadAryIndex].endPos,
      this.roadAry[RoadAryIndex].beizerCurvature,
      this.roadAry[RoadAryIndex].beizerNegate
    );
  }

  // 計算貝茲曲線的中心
  public BezierMidPoint(
    start: Vec3,
    end: Vec3,
    curvature: number,
    needNegate: Boolean
  ): Vec3 {
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
    if (needNegate) {
      jitter.x *= -1;
      jitter.y *= -1;
    }

    curve.x = (start.x + end.x) / 2 + jitter.x;
    curve.y = (start.y + end.y) / 2 + jitter.y;

    return curve;
  }

  public test(event: Event, CustomEventData) {
    console.log('test', CustomEventData.data);
  }
}
