/** Web Worker 資訊 */
/** 觸發來源 */
/** Web Worker */

interface WorkerInfo {
  Trigger: string | Object;
  Worker: Worker;
}

export default class WebWorkerManager {
  //#region Singleton
  //==================================================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): WebWorkerManager {
    if (WebWorkerManager._instance === null) {
      WebWorkerManager._instance = new WebWorkerManager();
    }
    return WebWorkerManager._instance;
  }
  /** Instance 實體 */
  private static _instance: WebWorkerManager = null;
  //==================================================================================
  //#endregion Singleton
  /** Web Worker 列表 */
  private workerList: Array<WorkerInfo> = null;
  constructor() {
    this.init();
  }
  /**
   * 初始化WebWorkerManager
   */
  public init() {
    this.release();
    console.warn('[WebWorkerManager] Init Web Worker:', !!window.Worker);
    this.workerList = new Array<WorkerInfo>();
  }
  /**
   * 釋放WebWorkerManager資源
   */
  public release() {
    console.warn('[WebWorkerManager] Release');
    if (this.workerList !== null) {
      let workerInfo: WorkerInfo = null;
      for (let i = 0, len: number = this.workerList.length; i < len; i++) {
        workerInfo = this.workerList[i];
        workerInfo.Trigger = undefined;
        if (workerInfo.Worker) workerInfo.Worker.terminate();
        workerInfo.Worker = undefined;
      }
      workerInfo = undefined;
      this.workerList.length = 0;
    }
    this.workerList = null;
  }
  /**
   * 創建UpdateWorker
   * @param trigger 觸發來源
   * @param updateContent 更新內容
   * @param updateInterval 更新間隔 (預設 33ms)
   */
  public createUpdateWorker(
    trigger: string | Object,
    updateContent: Function,
    updateInterval = 33
  ) {
    if (!window.Worker) return;
    //default
    if (updateInterval === null || isNaN(updateInterval)) updateInterval = 33;
    //關閉UpdateWorker 避免重複建立
    this.closeUpdateWorker(trigger);
    console.warn(
      `[WebWorkerManager] CreateUpdateWorker ${new Date().toLocaleString()}.${new Date().getMilliseconds()} by`,
      trigger
    );
    //更新鍵
    let updateKey = '';
    if (typeof trigger === 'string') {
      updateKey = 'UW_' + trigger;
    } else {
      updateKey = `UW_${Date.now()}_${this.workerList.length}`;
    }
    //定時觸發腳本
    const script = `
    (() => {
    setInterval(() => {
    self.postMessage("${updateKey}");
    }, ${updateInterval});
    })();`;
    //創建URL物件對象
    const blob = new Blob([script], {type: 'text/javascript'});
    const workerURL: string = URL.createObjectURL(blob);
    //創建WebWorker
    const worker: Worker = new Worker(workerURL);
    worker.onmessage = (event: MessageEvent) => {
      if (event.data === updateKey) updateContent();
    };
    //釋放URL物件對象
    URL.revokeObjectURL(workerURL);
    //記錄WorkerInfo
    this.workerList.push({
      Trigger: trigger,
      Worker: worker,
    });
  }
  /**
   * 關閉UpdateWorker
   * @param trigger 觸發來源
   */
  public closeUpdateWorker(trigger: string | Object) {
    console.warn(
      `[WebWorkerManager] CloseUpdateWorker ${new Date().toLocaleString()}.${new Date().getMilliseconds()} by`,
      trigger
    );
    this.removeWorkerInfo(trigger);
  }
  /**
   * 移除WorkerInfo
   * @param trigger 觸發來源
   */
  private removeWorkerInfo(trigger: string | Object) {
    let workerInfo: WorkerInfo = null;
    for (let i = 0; i < this.workerList.length; i++) {
      workerInfo = this.workerList[i];
      if (workerInfo.Trigger === trigger) {
        workerInfo.Trigger = undefined;
        if (workerInfo.Worker) workerInfo.Worker.terminate();
        workerInfo.Worker = undefined;
        this.workerList.splice(i, 1);
        break;
      }
    }
  }
  /**
   * 依觸發來源取得WorkerInfo
   * @param trigger 觸發來源
   */
  private getWorkerInfo(trigger: string | Object): WorkerInfo {
    let workerInfo: WorkerInfo = null;
    for (let i = 0; i < this.workerList.length; i++) {
      workerInfo = this.workerList[i];
      if (workerInfo.Trigger === trigger) return workerInfo;
    }
    return null;
  }
}
