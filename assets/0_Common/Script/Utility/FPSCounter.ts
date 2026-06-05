import {Director, director, game} from 'cc';
import Signal from '../../../CommonModule/Script/Utility/Signal';

export default class FPSCounter {
  //CB
  private onAverageFPS: Signal = null;
  private onTimeOut: Signal = null;
  //時間計算
  private timeCount = 0;
  private averageTimeCount = 0;
  private totalTimeCount = 0;
  //FPS計算
  private frameCounter = 0;
  private fps = 0;
  private totalFPS = 0;
  //設定值
  private averageSec = 1;
  private timeout = -1;

  /**
   *
   * @param averageSec 取幾秒平均(以1秒為單位)，預設1 (等於FPS)
   * @param timeout 偵測幾秒停止(以1秒為單位)，預設-1 (不停)
   * @param averageFpsCb 回傳每次的平均FPS值
   * @param timeoutCb 回傳偵測結束
   */
  constructor(
    averageSec = 1,
    timeout = -1,
    averageFpsCb?: Function,
    timeoutCb?: Function
  ) {
    if (timeout < 1 && timeout !== -1) {
      console.error(
        '[FPSCounter] timeout should = -1 or >= 1. (' + timeout + ')'
      );
      return;
    }
    if (averageSec < 1) {
      console.error(
        '[FPSCounter] averageSec should >= 1. (' + averageSec + ')'
      );
      return;
    }

    if (averageFpsCb) {
      if (this.onAverageFPS === null) this.onAverageFPS = new Signal();
      this.onAverageFPS.add(averageFpsCb);
    }
    if (timeoutCb) {
      if (this.onTimeOut === null) this.onTimeOut = new Signal();
      this.onTimeOut.add(timeoutCb);
    }
    this.averageSec = averageSec;
    this.timeout = timeout;

    this.startFPSCounter();
  }

  /**
   * 開始計算平均FPS
   */
  private startFPSCounter() {
    this.timeCount = 0;
    this.frameCounter = 0;
    this.totalFPS = 0;
    this.averageTimeCount = 0;
    director.on(Director.EVENT_AFTER_UPDATE, this.onFrameUpdate, this);
  }

  /**
   * FPS計算
   */
  private onFrameUpdate() {
    const deltaTime: number = game.deltaTime;
    //計算dt
    this.timeCount += deltaTime;
    //計算FPS
    this.frameCounter++;

    //記錄每秒FPS均值
    if (this.timeCount >= 1) {
      this.fps = this.frameCounter / this.timeCount;
      this.totalTimeCount += this.timeCount;

      if (this.averageSec > 1) {
        this.totalFPS += this.fps;
        this.averageTimeCount += this.timeCount;

        if (this.averageTimeCount >= this.averageSec) {
          const averageFPS: number = this.totalFPS / this.averageTimeCount;

          this.totalFPS = 0;
          this.averageTimeCount = 0;

          if (this.onAverageFPS) {
            this.onAverageFPS.dispatch(averageFPS);
          }
        }
      } else if (this.averageSec === 1) {
        if (this.onAverageFPS) {
          this.onAverageFPS.dispatch(this.fps);
        }
      }

      this.timeCount = 0;
      this.frameCounter = 0;

      if (this.timeout !== -1 && this.totalTimeCount >= this.timeout) {
        if (this.onTimeOut) {
          this.onTimeOut.dispatch();
        }

        this.stopFPSCounter();
      }
    }
  }

  /**
   * 停止計算平均FPS
   */
  private stopFPSCounter() {
    director.off(Director.EVENT_AFTER_UPDATE, this.onFrameUpdate, this);
    this.timeCount = 0;
    this.averageTimeCount = 0;
    this.totalTimeCount = 0;
    this.frameCounter = 0;
    this.fps = 0;
    this.totalFPS = 0;
    if (this.onAverageFPS !== null) this.onAverageFPS.dispose();
    this.onAverageFPS = null;
    if (this.onTimeOut !== null) this.onTimeOut.dispose();
    this.onTimeOut = null;
    this.averageSec = 1;
    this.timeout = -1;
  }

  /**
   * 停止
   */
  public release() {
    if (this.onTimeOut) {
      this.onTimeOut.dispatch();
    }
    this.stopFPSCounter();
  }
}
