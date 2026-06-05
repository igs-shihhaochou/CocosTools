import {Node} from 'cc';
import {SpecialGameBase} from '../SpecialGameBase';
import FSM from './FSM';
import StateBase from './StateBase';

export default abstract class FGBase extends SpecialGameBase {
  /** 流程狀態機 */
  _fsm: FSM;

  /** playFreeGameBgmOnce 用的旗標 */
  private _hasPlayedFreeGameBgm = false;

  constructor() {
    super();
    this._fsm = new FSM();
  }

  /**
   * 從MainGame進入FreeGame
   * @param jsonData MainGame當次的封包
   * @param totalTimes 次數
   */
  public abstract enterSpecialGameOpening(jsonData: JSON, totalTimes: number);

  /**
   * 從Recovery進入FreeGame
   * 必須實做
   */
  public recovery(_jsonData: JSON): void {}

  /**
   * FreeGame中的封包接收
   * 必須實做
   */
  public getRequest(_jsonData: JSON): void {}

  /**
   * SendFeverCommand的public接口
   * @param jsonData
   */
  public sendCommand(jsonData: JSON): void {
    this.sendFeverCommand(jsonData);
  }

  /**
   * FinishEnterGameOpening的public接口
   * 在FreeGame初始化完畢後呼叫
   */
  public toStartGame() {
    this.finishEnterGameOpening();
  }

  /**
   * FinishedDoAfterProcess的public接口
   * 在FreeGame該回合結束後呼叫
   */
  public toNextTurn() {
    this.finishedDoAfterProcess();
  }

  /**
   * FinishedToShowAward的public接口
   * 在FreeGame開始報獎時呼叫
   */
  public toShowAward() {
    this.finishedToShowAward();
  }

  /**
   * FinishSpecialGame的public接口
   * 在想結束FreeGame結束回到MainGame時呼叫
   */
  public toEndGame(totalwin: number) {
    this.finishSpecialGame(totalwin);
  }

  /**
   * FinishRecovery的public接口
   * 在結束FinishRecovery時呼叫
   */
  public toFinishRecovery() {
    this.finishRecovery();
  }

  /**
   * SG這個回合需要幹的事情，例如轉動轉輪並發送NextFever的Command給Server
   * 每個Fever Turn都會觸發一次(收到封包)
   * 空函式，不使用
   */
  public doProcess() {}

  /**
   * 結束報獎後，SG要幹的事情，並且確認SG是不是該結束了，結束的話請跑結束表演流程並傳FinishSpecialGame()，否則呼叫Event_AfterShowAwardFinished
   * 空函式，不使用
   */
  public doAfterShowAward() {}

  /**
   * 將 Node 陣列依序註冊為 FSM state(各 Node 必須掛 StateBase 衍生組件)。
   * 用於取代各遊戲 FreeGame.start() 中重複出現的:
   *   for (let i = 0; i < this.states.length; i++)
   *     this._fsm.addState(i, this.states[i].getComponent(StateBase), this);
   */
  protected registerStateNodes(nodes: Node[]): void {
    if (!nodes) return;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node) continue;
      const state = node.getComponent(StateBase);
      if (state) this._fsm.addState(i, state, this);
    }
  }

  /**
   * 同回合首次呼叫時執行 playFn,之後同實例呼叫不再觸發。
   * 用於取代各遊戲 FreeGame 中:
   *   private firstIn = false;
   *   private PlayBGM() { if (!this.firstIn) { this.firstIn = true; AudioCtrl.playFreeGameBGM(); } }
   *
   * 進入 SG opening 時(prepareEnterSpecialGameOpeningState)會自動 reset。
   */
  protected playFreeGameBgmOnce(playFn: () => void): void {
    if (this._hasPlayedFreeGameBgm) return;
    this._hasPlayedFreeGameBgm = true;
    playFn?.();
  }

  /** 強制 reset playFreeGameBgmOnce 旗標。一般情況不用手動呼叫。 */
  protected resetFreeGameBgmOnceFlag(): void {
    this._hasPlayedFreeGameBgm = false;
  }

  /**
   * enterSpecialGameOpening 起手通用 reset:
   *   - this.isExecuting = true (子類進入 SG 必設)
   *   - reset playFreeGameBgmOnce 旗標
   *   - 呼叫 sendCommand(null) (取得初始資料)
   *
   * 取代各遊戲 enterSpecialGameOpening 開頭重複的:
   *   this.firstIn = false;
   *   this.openingShowed = false;
   *   this.isExecuting = true;
   *   this.sendCommand(null);
   *
   * 子類若不需要 sendInitCommand 可帶 false。
   */
  protected prepareEnterSpecialGameOpeningState(sendInitCommand = true): void {
    this.isExecuting = true;
    this.resetFreeGameBgmOnceFlag();
    if (sendInitCommand) this.sendCommand(null);
  }
}
