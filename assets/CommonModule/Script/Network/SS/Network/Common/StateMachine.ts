import {Signal} from './Signal';

export class StateMachine<StateEnum> {
  /**目前狀態*/
  public Current: StateEnum;
  /**上次狀態*/
  public Last: StateEnum;
  /**每次轉移(Transition)狀態要觸發的事件集合(Signal), 呼叫時參數(last: StateEnum, current: StateEnum)*/
  public OnEntryAction: Signal = new Signal();
  /**每次狀態變更(Changed)要觸發的事件集合(Signal), 狀態變更(Changed)意指當Transition時State.Last != State.Current, 呼叫時參數(last: StateEnum, current: StateEnum)*/
  public OnChangedAction: Signal = new Signal();
  /**
   * StateMachine建構式
   */
  constructor() {}
  /**
   * 釋放StateMachine資源
   */
  public Release() {
    this.OnEntryAction.removeAll();
    this.OnEntryAction = null;
    this.OnChangedAction.removeAll();
    this.OnChangedAction = null;
  }
  /**
   * 從目前狀態轉移到下一個狀態, 會觸發註冊的OnEntryAction()
   * @param state 要轉移的下一個狀態
   */
  public Transition(state: StateEnum) {
    this.Last = this.Current;
    this.Current = state;
    this.OnEntryAction.dispatch(this.Last, this.Current);
    if (this.Current !== this.Last) {
      this.OnChangedAction.dispatch(this.Last, this.Current);
    }
  }
}
