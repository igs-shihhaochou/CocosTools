// /**Finite State Machine*/

import FGBase from './FGBase';
import StateBase from './StateBase';

export default class FSM {
  /**目前的State,-1代表沒有 */
  private _currentState = 0;
  /**目前使用的State物件 */
  private activeState: StateBase = null;
  /**State物件列表 */
  private stateList: Array<StateBase> = null;
  /**StateID列表 */
  private stateIDList: Array<number> = null;
  /**State列表長度 */
  private stateListLength = 0;
  constructor() {
    this._currentState = -1;
    this.stateList = [];
    this.stateIDList = [];
    this.stateListLength = 0;
  }

  /**取得當前狀態機狀態 */
  get currentState(): number {
    return this._currentState;
  }

  /**動態新增新的State */
  addState(stateID: number, state: StateBase, fg: FGBase): boolean {
    if (this.stateList[stateID]) {
      console.error('This stateID have state already!');
      return false;
    }
    this.stateIDList[this.stateListLength++] = stateID;
    this.stateList[stateID] = state;
    state.onLoadInit(this, fg);
    return true;
  }

  /**釋放FSM資源 */
  release() {
    if (this.activeState !== null) this.activeState.onQuitState();
    this.activeState = null;
    for (let i = 0; i < this.stateListLength; i++) {
      this.stateList[this.stateIDList[i]] = null;
    }
    this.stateList = null;
    this.stateIDList = null;
    this.stateListLength = 0;
  }

  /**
   * FSM的更新 更新目前啟動的State
   * @param dt 更新間格時間(毫秒)
   */
  update(dt: number) {
    if (this.activeState !== null) {
      this.activeState.update(dt);
    }
  }

  /**
   * 設定FSM的State
   * @param stateid 要設定的StateID
   */
  setState(stateid) {
    if (this.currentState === stateid) {
      console.log('[FSM] Transit to same state do nothing.');
      return;
    }
    //如果當前State存在 釋放當前State
    if (this.activeState !== null) {
      this.activeState.onQuitState();
      this.activeState.isActive = false;
      this.activeState = null;
      this._currentState = -1;
    }
    //如果當前Scene存在 釋放當前Scene 之後重設當前Scene
    //確認要轉換的State存在於m_StateList
    if (this.stateList[stateid] !== undefined) {
      this._currentState = stateid;
      this.activeState = this.stateList[stateid as number];
      this.activeState.isActive = true;
      console.log('[FSM] Transit to ' + this.activeState.constructor.name);
      this.activeState.onEnterState();
    } else {
      console.error('[FSM] Transit is failed ' + stateid.toString());
    }
  }
}
