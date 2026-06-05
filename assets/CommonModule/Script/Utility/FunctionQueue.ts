import {log} from 'cc';

export class FunctionQueue {
  private funcs: ((param?: any) => void)[] = [];

  /**
   * 將一個函式加入執行佇列中
   * @param func 要加入佇列的函式，函式可接受一個可選參數
   */
  public enqueue(func: (param?: any) => void): void {
    this.funcs.push(func);
  }

  /**
   * 執行佇列中的函數，並將參數傳入各個函數中
   * @param param 可選的參數，會傳遞給佇列中的每個函數
   */
  public invoke(param?: any): void {
    if (this.funcs.length > 0) {
      const func = this.funcs.shift();
      if (func) {
        func(param);
        // 執行直到佇列清空
        this.invoke(param);
      }
    } else {
      log('the funcs queue is clear');
    }
  }
}
