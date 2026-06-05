import {_decorator, Component} from 'cc';
import {SpecialGameAgent} from './SpecialGameAgent';
import {SpecialGameBase} from './SpecialGameBase';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {GameStatusArgs, SpecialGameEnterTiming} from '../Define/SlotGameData';

const {ccclass, property} = _decorator;

/**
 * 用於以「同節點 Component」方式注入 SpecialGameAgent 行為,
 * 而不需要 extends SpecialGameAgent。
 *
 * 子類在需要的 hook override:
 *   - handleCustomSetRecovery(data) — 取代各遊戲 override setRecovery 處理 INIT/last_sg_id 等特例。
 *     回傳 SpecialGameEnterTiming 表示已處理,回傳 undefined 走預設流程。
 *   - onAfterSetRecovery(data, result) — 補充處理(無 return)
 *   - onAfterProcessExecutingRemote(specialGameID, data) — 處理跨 SG 跳轉檢查
 *   - onAfterFinished(remote) — finished 後追加 cleanup
 *
 * Extension 透過 `agent.findSpecialGameRemoteByID()` / `getSpecialGameList()` /
 * `pushSpecialGameID()` 等公開 API 操作 agent 內部狀態,免 @ts-ignore。
 */
@ccclass('SpecialGameAgentFlowExtension')
export abstract class SpecialGameAgentFlowExtension extends Component {
  /** 留空則 onLoad 時自動從 SlotGameMediator 取得。 */
  @property(SpecialGameAgent)
  protected agent: SpecialGameAgent = null;

  protected onLoad(): void {
    this.bindAgent(true);
  }

  public onDestroy(): void {
    this.bindAgent(false);
    this.agent = null;
  }

  private bindAgent(insert: boolean): void {
    const agent =
      this.agent ??
      (this.agent = SlotGameMediator.instance?.specialGameAgent ?? null);
    if (!agent) {
      if (insert) {
        console.warn(
          '[SpecialGameAgentFlowExtension] agent 為 null,hook 不會被註冊。' +
            '請在 @property 指定 SpecialGameAgent 或確認 SlotGameMediator 已初始化。'
        );
      }
      return;
    }
    if (insert) {
      // setRecovery 的 customHandler 是單一函式指標,後設定者覆蓋。
      // 多 extension 場景請改用 eventAfterSetRecovery 或自行協調。
      if (this.shouldHandleCustomSetRecovery()) {
        agent.customSetRecoveryHandler = this._boundCustomSetRecovery;
      }
      agent.eventAfterSetRecovery.insert(this.onAfterSetRecovery, this);
      agent.eventAfterProcessExecutingRemote.insert(
        this.onAfterProcessExecutingRemote,
        this
      );
      agent.eventAfterFinished.insert(this.onAfterFinished, this);
    } else {
      // 只有當 agent.customSetRecoveryHandler 仍然是「我們自己 onLoad 時 set 的那一個 closure」
      // 才清除,避免把別人後來覆蓋的 handler 誤殺。
      if (
        this.shouldHandleCustomSetRecovery() &&
        agent.customSetRecoveryHandler === this._boundCustomSetRecovery
      ) {
        agent.customSetRecoveryHandler = null;
      }
      agent.eventAfterSetRecovery.remove(this.onAfterSetRecovery, this);
      agent.eventAfterProcessExecutingRemote.remove(
        this.onAfterProcessExecutingRemote,
        this
      );
      agent.eventAfterFinished.remove(this.onAfterFinished, this);
    }
  }

  /**
   * 預先綁定的 setRecovery handler closure(class field 初始化只跑一次,
   * 兩次 onLoad / onDestroy 之間 reference identity 維持穩定)。
   * onLoad 把這個 closure assign 給 agent.customSetRecoveryHandler,
   * onDestroy 比對 reference 是否仍是這一個來決定是否安全清除。
   */
  private _boundCustomSetRecovery: (
    data: GameStatusArgs
  ) => SpecialGameEnterTiming | undefined = data =>
    this.handleCustomSetRecovery(data);

  /**
   * 若子類要 override setRecovery 行為,回傳 true 並 override handleCustomSetRecovery。
   * 預設 false,代表只用 eventAfter* hook 不攔截 setRecovery。
   */
  protected shouldHandleCustomSetRecovery(): boolean {
    return false;
  }

  /**
   * 自訂 setRecovery。回傳 SpecialGameEnterTiming 表示已處理(直接以該值返回),
   * 回傳 undefined 表示放行給 SpecialGameAgent 預設流程。
   */
  protected handleCustomSetRecovery(
    _data: GameStatusArgs
  ): SpecialGameEnterTiming | undefined {
    return undefined;
  }

  /** setRecovery 完成後(自訂 / 預設皆會觸發)。 */
  protected onAfterSetRecovery(
    _data: GameStatusArgs,
    _result: SpecialGameEnterTiming
  ): void {}

  /** processExecutingRemote 之後(可在此檢查跨 SG 跳轉)。 */
  protected onAfterProcessExecutingRemote(
    _specialGameID: number,
    _data: JSON
  ): void {}

  /** finished 之後(可在此補 cleanup,例如送 hideFreeGameBar 訊號)。 */
  protected onAfterFinished(_remote: SpecialGameBase): void {}
}
