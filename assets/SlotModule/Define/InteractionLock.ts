import {Delegate} from '../../CommonModule/Script/ExtraType';

/**
 * 玩家互動鎖：以「持有者 (holder key)」集合表示「遊戲是否處於可被 intermission 等外部事件安全接管的狀態」。
 *
 * 用途：`MainGameHost.nowGameStatus === ReadyToSpin` 只能表達 state machine 層級的閒置，
 * 但 BuyBonus 面板、道具卡、商店等 feature 打開時玩家其實不 idle。
 * 任何 feature 在開始互動時 `acquire(key)`、結束時 `release(key)`，
 * MainGameHost 就能以 `nowGameStatus === ReadyToSpin && !interactionLock.isBusy` 作為真正的 idle 判定。
 *
 * 使用守則：
 *  - 誰 acquire 誰 release。務必在 onDisable / onDestroy 做保底 release，避免洩漏。
 *  - 同一 key 重複 acquire 等冪（Set 語意），不會累積；但重複 release 仍只需一次。
 *  - 不要用來阻擋 feature 自己的 UI，鎖只記錄「目前忙」；feature 該不該打開是 feature 自己的邏輯。
 */
export class InteractionLock {
  private holders: Set<string> = new Set();

  /** isBusy 由 false→true 或 true→false 時廣播 (isBusy: boolean) */
  public readonly eventChanged: Delegate = new Delegate();

  /** 註冊一名持有者 */
  public acquire(key: string): void {
    if (!key) return;
    const was = this.isBusy;
    this.holders.add(key);
    if (!was && this.isBusy) {
      this.eventChanged.notify(true);
    }
  }

  /** 釋放一名持有者 */
  public release(key: string): void {
    if (!key) return;
    if (!this.holders.has(key)) return;
    const was = this.isBusy;
    this.holders.delete(key);
    if (was && !this.isBusy) {
      this.eventChanged.notify(false);
    }
  }

  /** 是否有任何持有者尚未釋放 */
  public get isBusy(): boolean {
    return this.holders.size > 0;
  }

  /** 目前有哪些 holder（debug 用：intermission 沒來時印 log 快速定位誰忘了 release） */
  public get debugHolders(): string[] {
    return [...this.holders];
  }

  /** 強制清空（場景重置等非常情況使用） */
  public reset(): void {
    if (!this.isBusy) return;
    this.holders.clear();
    this.eventChanged.notify(false);
  }
}
