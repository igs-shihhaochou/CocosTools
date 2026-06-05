export class Delegate<T extends Function> {
  private keys: number[] = [];
  private funcs: T[] = [];
  private stackKey = 0;

  constructor() {}

  /**
    加入訂閱Callback
	*/
  public AddListener(func: T): number {
    this.stackKey++;

    this.keys.push(this.stackKey);
    this.funcs.push(func);
    return this.stackKey;
  }
  /**
    移除訂閱Callback
	*/
  public RemoveListener(func: T): boolean {
    const index = this.funcs.indexOf(func);
    if (index !== -1) {
      this.keys.splice(index, 1);
      this.funcs.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }
  /**
    移除訂閱Callback
	*/
  public RemoveListenerByID(id: number): boolean {
    const index = this.keys.indexOf(id);
    if (index !== -1) {
      this.keys.splice(index, 1);
      this.funcs.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }
  /**
    移除所有訂閱Callback
	*/
  public RemoveAllListener(): void {
    this.keys = [];
    this.funcs = [];
    this.stackKey = 0;
  }
  /**
    設定Callback(清除所有先前註冊的Callback)
	*/
  public SetListener(func: T): number {
    this.RemoveAllListener();

    return this.AddListener(func);
  }
  /**
    廣播觸發事件
	*/
  public Broadcast(...args: []): void {
    let tmpFuncs = Object.assign([], this.funcs);

    for (let i = 0; i < tmpFuncs.length; i++) {
      tmpFuncs[i](...args);
    }

    tmpFuncs = null;
  }
  /**
    根據Id觸發事件
	*/
  public BroadcastByID(id: number | number[], ...args: []): void {
    const tmpID: number[] = Array.isArray(id) ? id : [id];
    tmpID.forEach(id => {
      const index = this.keys.indexOf(id);
      if (index !== -1) this.funcs[index](...args);
    });
  }
  /**
    檢查是否正在訂閱中
    @param key 訂閱者的索引值
	*/
  public ContainsListener(key: number): boolean {
    if (this.keys.indexOf(key) === -1) {
      return false;
    }
    return true;
  }
  /**
    取得註冊數量
    */
  public GetListenerCount() {
    return this.keys.length;
  }
}
