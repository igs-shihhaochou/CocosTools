/** 無限重複常數 */
export const REPEAT_FOREVER = -1;

/**
 * Timer 工具類 - 替代 Cocos Scheduler
 * 使用原生 setTimeout/setInterval 實現計時功能
 */
export default class Timer {
  private static timers: Map<string, number> = new Map();
  private static intervals: Map<string, number> = new Map();
  private static repeatCounters: Map<string, number> = new Map();
  private static idCounter = 0;

  /**
   * 延遲執行一次
   * @param callback 回調函數
   * @param delay 延遲時間（秒）
   * @param key 計時器識別 key（用於後續取消）
   * @returns 計時器識別 key
   */
  public static scheduleOnce(
    callback: () => void,
    delay: number,
    key: string
  ): string {
    // 如果已存在相同 key 的計時器，先清除
    if (this.timers.has(key)) {
      window.clearTimeout(this.timers.get(key));
    }

    const timerId = window.setTimeout(() => {
      this.timers.delete(key);
      callback();
    }, delay * 1000);

    this.timers.set(key, timerId);
    return key;
  }

  /**
   * 重複執行
   * @param callback 回調函數
   * @param interval 間隔時間（秒）
   * @param key 計時器識別 key（用於後續取消）
   * @param repeat 重複次數，預設 REPEAT_FOREVER (-1) 為無限重複
   * @param delay 首次執行前的延遲時間（秒），預設 0
   * @returns 計時器識別 key
   */
  public static schedule(
    callback: () => void,
    interval: number,
    key: string,
    repeat: number = REPEAT_FOREVER,
    delay = 0
  ): string {
    // 如果已存在相同 key 的計時器，先清除
    this.unschedule(key);

    const startInterval = () => {
      if (repeat === REPEAT_FOREVER) {
        // 無限重複
        const timerId = window.setInterval(callback, interval * 1000);
        this.intervals.set(key, timerId);
      } else if (repeat > 0) {
        // 有限次數重複
        this.repeatCounters.set(key, 0);
        const timerId = window.setInterval(() => {
          const count = this.repeatCounters.get(key) || 0;
          if (count < repeat) {
            this.repeatCounters.set(key, count + 1);
            callback();
          } else {
            // 達到重複次數，自動清除
            this.unschedule(key);
          }
        }, interval * 1000);
        this.intervals.set(key, timerId);
      }
    };

    if (delay > 0) {
      // 有延遲，先用 setTimeout 等待
      const delayTimerId = window.setTimeout(() => {
        this.timers.delete(key + '_delay');
        startInterval();
      }, delay * 1000);
      this.timers.set(key + '_delay', delayTimerId);
    } else {
      // 無延遲，直接開始
      startInterval();
    }

    return key;
  }

  /**
   * 取消單個計時器
   * @param key 計時器識別 key
   */
  public static unschedule(key: string): void {
    // 清除延遲啟動的 timer
    const delayKey = key + '_delay';
    if (this.timers.has(delayKey)) {
      window.clearTimeout(this.timers.get(delayKey));
      this.timers.delete(delayKey);
    }
    if (this.timers.has(key)) {
      window.clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    if (this.intervals.has(key)) {
      window.clearInterval(this.intervals.get(key));
      this.intervals.delete(key);
    }
    // 清除重複計數器
    this.repeatCounters.delete(key);
  }

  /**
   * 清除指定前綴的所有計時器
   * @param prefix 計時器 key 前綴
   */
  public static unscheduleAllCallbacks(prefix: string): void {
    this.timers.forEach((timerId, key) => {
      if (key.startsWith(prefix)) {
        window.clearTimeout(timerId);
        this.timers.delete(key);
      }
    });
    this.intervals.forEach((timerId, key) => {
      if (key.startsWith(prefix)) {
        window.clearInterval(timerId);
        this.intervals.delete(key);
      }
    });
    this.repeatCounters.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.repeatCounters.delete(key);
      }
    });
  }

  /**
   * 清除所有計時器
   */
  public static clearAll(): void {
    this.timers.forEach(timerId => {
      window.clearTimeout(timerId);
    });
    this.timers.clear();

    this.intervals.forEach(timerId => {
      window.clearInterval(timerId);
    });
    this.intervals.clear();

    this.repeatCounters.clear();
  }

  /**
   * 檢查計時器是否存在
   * @param key 計時器識別 key
   */
  public static has(key: string): boolean {
    return this.timers.has(key) || this.intervals.has(key);
  }
}
