import {director, Scheduler} from 'cc';
import {Define} from './Define/GlobalSetting';

export class Queue<T> {
  private _store: T[] = [];

  front(): T {
    return this._store[0];
  }

  dequeue(): T {
    if (this._store.length <= 0) {
      console.log('Queue Element Not Exist ');
      return null;
    }

    const _value: T = this._store[0];
    this._store.shift();

    return _value;
  }

  enqueue(_Value: T) {
    this._store.push(_Value);
  }

  clear() {
    this._store = [];
  }

  get count(): number {
    return this._store.length;
  }
}

export class Delegate {
  private _callbacks = null;
  private _keys: number[] = [];
  private _stackKey = 0;

  constructor() {
    this._callbacks = [];
  }

  get length() {
    return this._callbacks.length;
  }

  insert(callback: Function, self): number {
    const check = this._callbacks.find(
      x => x.func === callback && x.owner === self
    );

    if (check) {
      if (Define.DEBUG_LOG) {
        console.error('Reregistered');
        console.error(callback);
        console.error(self);
      }
      return;
    }

    this._stackKey++;
    const obj = {func: callback, owner: self};
    this._callbacks.push(obj);
    this._keys.push(this._stackKey);

    return this._stackKey;
  }

  remove(callback: Function, self: unknown): void {
    this._callbacks = this._callbacks.filter(x => {
      return !(x.func === callback && x.owner === self);
    });
  }

  removeByID(id: number): void {
    const index = this._keys.indexOf(id);

    if (index !== -1) {
      this._keys.splice(index, 1);

      this.remove(this._callbacks[index].func, this._callbacks[index].owner);
    }
  }

  notify(...args) {
    this._callbacks.map(x => {
      x.func.bind(x.owner)(...args);
    });
  }

  notifyByID(id: number | number[], ...args: any[]): void {
    const tmpID: number[] = Array.isArray(id) ? id : [id];
    tmpID.forEach(id => {
      const index = this._keys.indexOf(id);
      if (index !== -1) {
        this._callbacks[index].func.bind(this._callbacks[index].owner)(...args);
      }
    });
  }

  clear() {
    this._callbacks = [];
    this._keys = [];
    this._stackKey = 0;
  }
}

declare const Promise;

/** 用於調度器的 target 對象 */
const schedulerTarget = {};
Scheduler.enableForTarget(schedulerTarget);

/**
 * 等待指定秒數（受 director.getScheduler().setTimeScale() 影響）
 * @param seconds 等待秒數
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

export function waitForSecondsByTimeOut(seconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}
