import {_decorator, Component} from 'cc';
import {MainGameHost} from './MainGameHost';
import {SlotGameMediator} from '../Define/SlotGameMediator';

const {ccclass, property} = _decorator;

/**
 * 用於以「同節點(或場景中可取得)Component」方式注入 MainGameHost 流程行為,
 * 而不需要 extends MainGameHost。
 *
 * 子類在 onLoad 內依需求 override 對應的 protected async hook,
 * 此 base 自動將 hook 插入 MainGameHost 對應的 public Delegate,並在 onDestroy 時 remove。
 *
 * 用法:
 *   @ccclass('GxxxMainGameFlowExtension')
 *   export class GxxxMainGameFlowExtension extends MainGameFlowExtension {
 *     @property(GxxxMainGameController) mainGameController: GxxxMainGameController = null;
 *     @property(GxxxWildCtrl) wildCtrl: GxxxWildCtrl = null;
 *
 *     protected async onBeforeShowAward(): Promise<void> {
 *       await this.mainGameController.checkGoldCollect();
 *       if (this.wildCtrl.needWaitWild()) await this.wildCtrl.checkWildCollect();
 *     }
 *
 *     protected async onBeforeAfterShowAward(): Promise<void> {
 *       await this.mainGameController.checkGoldSend();
 *     }
 *   }
 *
 * 場景配置:把此元件掛在 MainGameHost 同節點上,@property host 留空則自動抓
 * SlotGameMediator.instance.mainGameHost。
 */
@ccclass('MainGameFlowExtension')
export abstract class MainGameFlowExtension extends Component {
  /** 留空則 onLoad 時自動從 SlotGameMediator 取得。 */
  @property(MainGameHost)
  protected host: MainGameHost = null;

  protected onLoad(): void {
    this.bindHooks(true);
  }

  public onDestroy(): void {
    this.bindHooks(false);
    this.host = null;
  }

  private bindHooks(insert: boolean): void {
    const host =
      this.host ??
      (this.host = SlotGameMediator.instance?.mainGameHost ?? null);
    if (!host) {
      if (insert) {
        console.warn(
          '[MainGameFlowExtension] host is null, hook 不會被註冊。' +
            '請在 @property 指定 MainGameHost 或確保 SlotGameMediator 已初始化。'
        );
      }
      return;
    }
    const op = insert ? 'insert' : 'remove';
    host.eventBeforeShowAward[op](this.onBeforeShowAward, this);
    host.eventBeforeAfterShowAward[op](this.onBeforeAfterShowAward, this);
    host.eventBeforeSpin[op](this.onBeforeSpin, this);
    host.eventBeforeReadyToSpin[op](this.onBeforeReadyToSpin, this);
  }

  /** 報獎開始前(自動暫停狀態機,可 await 動畫)。 */
  protected async onBeforeShowAward(): Promise<void> {}

  /** AfterShowAward 進入 specialGame 檢查之前(自動暫停狀態機)。 */
  protected async onBeforeAfterShowAward(): Promise<void> {}

  /** Spin 啟動之前(自動暫停狀態機,可 await 開鏡頭/UI 收合)。 */
  protected async onBeforeSpin(): Promise<void> {}

  /** ReadyToSpin 之前(自動暫停狀態機,可用於 idle 條件等待)。 */
  protected async onBeforeReadyToSpin(): Promise<void> {}
}
