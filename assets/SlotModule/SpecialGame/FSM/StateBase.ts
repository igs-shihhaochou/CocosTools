import {Component} from 'cc';
import FGBase from './FGBase';
import FSM from './FSM';

export default abstract class StateBase extends Component {
  /**狀態機實體 */
  protected _fsm: FSM = null;
  /**狀態機編號 */
  public abstract state;
  /**狀態機是否啟動 */
  public isActive = false;
  /** FreeGame本體 */
  public freegame: FGBase = null;

  /**初始化主狀態機 */
  public onLoadInit(fsm: FSM, fg: FGBase) {
    this._fsm = fsm;
    this.freegame = fg;
  }

  /**進入state */
  public abstract onEnterState();
  /**離開state */
  public abstract onQuitState();
  /**更新狀態機 */
  public abstract update(dt: number);
}
