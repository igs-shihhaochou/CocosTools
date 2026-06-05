import Signal from '../../../CommonModule/Script/Utility/Signal';

/**
 * 透過自定義的StateEnum建立狀態機
 */
export default class StateMachine<T> {
  /**目前狀態*/
  public current: T = null;
  /**上次狀態*/
  public last: T = null;
  /**每次轉移(Transition)狀態要觸發的事件集合(Signal)*/
  public onEntryAction: Signal = null;
  /**
   * StateMachine建構式
   */
  constructor() {
    this.onEntryAction = new Signal();
  }
  /**
   * 釋放StateMachine資源
   */
  public release() {
    if (this.onEntryAction !== null) this.onEntryAction.dispose();
    this.onEntryAction = null;
  }
  /**
   * 從目前狀態轉移到下一個狀態, 會觸發註冊的OnEntryAction()
   * @param state 要轉移的下一個狀態
   */
  public transition(state: T) {
    this.last = this.current;
    this.current = state;
    this.onEntryAction.dispatch();
  }
}
