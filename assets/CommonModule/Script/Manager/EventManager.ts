import Signal from '../Utility/Signal';

/**
 * 事件名稱列表
 * @deprecated 因此種寫法在客製參數上遺漏鍵值不好維護 請改用EventType
 */
export interface EventNameList {
  /** 事件名稱 */
  readonly [eventKeyName: string]: string;
}

/** 事件類型 */
export type EventType<T> = {
  [K in keyof T]: string;
};
/** Signal事件列表 */
type SignalEventMap<T extends EventType<Record<string, string>>> = {
  [K in keyof T]: Signal;
};

const signalListGlobalKey = 'eventManager-signalList';

const isNullEvent = <T extends EventType<Record<string, string>>>(
  eventName: T[keyof T]
): boolean => {
  const signalList = window[signalListGlobalKey] as SignalEventMap<T>;
  if (!signalList) return false;
  //檢查事件是否存在
  const isNull = !signalList[eventName];
  if (isNull) console.warn('[EventManager] %s is not found', eventName);
  return isNull;
};

export default class EventManager {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): EventManager {
    if (!window['eventManager']) {
      console.log('[EventManager] Create EventManager instance');
      window['eventManager'] = new EventManager();
    }
    return window['eventManager'];
  }

  //=======================================================
  //#endregion Singleton

  constructor() {
    this.init();
  }

  /**
   * 初始化EventManager
   */
  public init() {
    this.release();
    window[signalListGlobalKey] = {};
  }

  /**
   * 釋放EventManager資源
   */
  public release() {
    const signalList = window[signalListGlobalKey];
    if (signalList !== null) {
      let signal: Signal | null = null;
      for (const eventName in signalList) {
        signal = signalList[eventName];
        if (!signal) continue;
        signal.dispose();
        delete signalList[eventName];
      }
    }
    window[signalListGlobalKey] = null;
  }

  /**
   * 註冊事件列表
   * @param eventNameList 事件名稱列表
   */
  public registerEvents(eventNameList: EventType<Record<string, string>>) {
    const signalList = window[signalListGlobalKey];
    if (!signalList) return;
    for (const eventKeyName in eventNameList) {
      //檢查事件是否已創建
      const eventName: string = eventNameList[eventKeyName];
      const signal = signalList[eventName];
      if (signal) {
        console.warn('[EventManager] Event: %s already exists', eventName);
        continue;
      }
      signalList[eventName] = new Signal();
    }
  }

  /**
   * 移除事件列表
   * @param eventNameList 事件名稱列表
   */
  public unregisterEvents(eventNameList: EventType<Record<string, string>>) {
    const signalList = window[signalListGlobalKey];
    if (!signalList) return;
    for (const eventKeyName in eventNameList) {
      //檢查事件是否未創建
      const eventName: string = eventNameList[eventKeyName];
      const signal = signalList[eventName];
      if (!signal) {
        console.warn('[EventManager] Event: %s does not exist', eventName);
        continue;
      }
      signal.dispose();
      delete signalList[eventName];
    }
  }

  /**
   * 新增監聽事件
   * @param eventName 監聽事件的名稱
   * @param listener 監聽事件觸發的函式
   * @param context 監聽事件觸發函式的對象
   * @param args 預設附加於觸發函式的參數
   */
  public addEventListener<T extends EventType<Record<string, string>>>(
    eventName: T[keyof T],
    listener: Function,
    context?: unknown,
    ...args: unknown[]
  ) {
    const signalList = window[signalListGlobalKey];
    if (!signalList) return;
    const signal: Signal = signalList[eventName];
    //檢查事件是否存在
    if (isNullEvent(eventName)) return;
    //檢查監聽事件是否重複
    if (signal?.has(listener, context)) {
      console.warn('[EventManager] duplicate listener add to %s', eventName);
      return;
    }
    signal?.add(listener, context, 0, ...args);
  }

  /**
   * 新增單次監聽事件
   * @param eventName 監聽事件的名稱
   * @param listener 監聽事件觸發的函式
   * @param context 監聽事件觸發函式的對象
   * @param args 預設附加於觸發函式的參數
   */
  public addEventListenerOnce<T extends EventType<Record<string, string>>>(
    eventName: T[keyof T],
    listener: Function,
    context?: unknown,
    ...args: unknown[]
  ) {
    const signalList = window[signalListGlobalKey];
    if (!signalList) return;
    const signal: Signal = signalList[eventName];
    //檢查事件是否存在
    if (isNullEvent(eventName)) return;
    //檢查監聽事件是否重複
    if (signal.has(listener, context)) {
      console.warn(
        '[EventManager] duplicate listener addOnce to %s',
        eventName
      );
      return;
    }
    signal.addOnce(listener, context, 0, ...args);
  }

  /**
   * 移除監聽事件
   * @param eventName 監聽事件的名稱
   * @param listener 監聽事件觸發的函式
   * @param context 監聽事件觸發函式的對象
   */
  public removeEventListener<T extends EventType<Record<string, string>>>(
    eventName: T[keyof T],
    listener: Function,
    context?: unknown
  ) {
    const signalList = window[signalListGlobalKey];
    if (!signalList) return;
    const signal: Signal = signalList[eventName];
    //檢查事件是否存在
    if (isNullEvent(eventName)) return;
    //檢查監聽事件是否存在
    if (!signal.has(listener, context)) {
      console.warn('[EventManager] %s does not have this listener', eventName);
      return;
    }
    signal.remove(listener, context);
  }

  /**
   * 移除全部監聽事件
   * @param eventName 監聽事件的名稱
   * @param context 監聽事件觸發函式的對象
   */
  public removeAllEventListener<T extends EventType<Record<string, string>>>(
    eventName: T[keyof T],
    context?: unknown
  ) {
    const signalList = window[signalListGlobalKey];
    if (!signalList) return;
    //檢查事件是否存在
    if (isNullEvent(eventName)) return;
    signalList[eventName].removeAll(context);
  }

  /**
   * 觸發事件
   * @param eventName
   * @param params
   */
  public dispatchEvent<T extends EventType<Record<string, string>>>(
    eventName: T[keyof T],
    ...params: unknown[]
  ) {
    const signalList = window[signalListGlobalKey];
    if (!signalList) return;
    //檢查事件是否存在
    if (isNullEvent(eventName)) return;
    const signal: Signal = signalList[eventName];
    if (params.length === 0) {
      signal.dispatch();
    } else {
      signal.dispatch(...params);
    }
  }

  /**
   * 檢查事件是否被監聽
   * @param eventName 監聽事件的名稱
   */
  public hasEventListener<T extends EventType<Record<string, string>>>(
    eventName: T[keyof T]
  ): boolean {
    const signalList = window[signalListGlobalKey];
    if (!signalList) return false;
    //檢查事件是否存在
    if (isNullEvent(eventName)) return false;
    //檢查事件是否被監聽
    const hasListener: boolean = signalList[eventName].getNumListeners() !== 0;
    return hasListener;
  }
}
