export default class SourceLocker {
  /** 鎖名 */
  private name = '';
  /** 來源集合 */
  private sourceCollection: Set<string | Object> = null;
  /**
   * 建構SourceLocker
   * @param name SourceLocker識別名
   * @param lockSource 預設鎖定來源
   */
  constructor(name: string, ...lockSource: Array<string | Object>) {
    this.name = name;
    this.sourceCollection = new Set<string | Object>();
    for (const source of lockSource) {
      this.setLock(true, source);
    }
  }
  /**
   * 釋放SourceLocker資源
   */
  public release() {
    this.sourceCollection = null;
  }
  /**
   * 設置上鎖狀態
   * @param isLock
   * @param source
   */
  public setLock(isLock: boolean, source: string | Object) {
    if (!this.sourceCollection) return;
    if (isLock) {
      if (this.sourceCollection.has(source)) {
        console.warn(
          `[SourceLocker] SetLock ${this.name} Source Locked:`,
          source
        );
        return;
      }
      this.sourceCollection.add(source);
    } else {
      if (!this.sourceCollection.has(source)) {
        console.warn(
          `[SourceLocker] SetLock ${this.name} Source Unlocked:`,
          source
        );
        return;
      }
      this.sourceCollection.delete(source);
    }
  }
  /**
   * 強制解鎖
   */
  public forceUnlock() {
    if (this.sourceCollection === null) return;

    console.warn(`[SourceLocker] ForceUnlock ${this.name}`);

    this.sourceCollection.clear();
  }
  //    /** 是否為上鎖狀態 */
  public get isLock(): boolean {
    return this.sourceCollection?.size > 0;
  }
}
