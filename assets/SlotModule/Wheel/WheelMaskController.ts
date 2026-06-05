import {_decorator, Component, Prefab, Node, Vec2, Vec3} from 'cc';
const {ccclass, property} = _decorator;

import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {
  getWorldSpaceAR,
  getNodeSpaceAR,
} from '../../CommonModule/Script/Utility/NodeProperty';

/**
 * 線獎期間遮罩控制器。
 *
 * 預設策略 = sprite mask:`spawnMask` 從 maskPool 取出 prefab 放到對應位置,
 * `showMask` / `hideMask` 直接 active 切換。
 *
 * 多數遊戲不用 sprite mask 而是把 symbol 顏色壓暗(QinShiHuang2 /
 * BuddhaSpin 等)。為了避免每款遊戲都把這 3 支 method 全 override,
 * 本類提供 hook:
 *   - `applyMaskVisual(row, col)`  → showMask 內部呼叫
 *   - `removeMaskVisual(row, col)` → hideMask 內部呼叫
 *
 * 子類只要覆寫這兩個 hook(或同時覆寫 `spawnMask` no-op)就能換策略,
 * 不用重 implement 整個 active 切換流程。
 */
@ccclass('WheelMaskController')
export class WheelMaskController extends Component {
  @property(Prefab)
  public mask: Prefab | null = null;
  @property(SpawnPool)
  public maskPool: SpawnPool = null;
  protected maskArray: Node[][] = [];

  public init(row: number, column: number) {
    this.maskArray[row] = [];
    for (let i = 0; i < column; i++) this.maskArray[row][i] = null;
  }

  public spawnMask(row: number, column: number, wheelNode: Node) {
    if (!this.mask || !this.maskPool) return;
    this.maskArray[row][column] = this.maskPool.spawn(this.mask.data);
    this.maskArray[row][column].parent = this.node;
    this.maskArray[row][column].active = false;

    let position: Vec3 = getWorldSpaceAR(wheelNode, Vec2.ZERO);
    position = getNodeSpaceAR(this.node, position);

    this.maskArray[row][column].setPosition(position);
  }

  public showMask(row: number, column: number) {
    this.applyMaskVisual(row, column);
  }

  public hideMask(row: number, column: number) {
    this.removeMaskVisual(row, column);
  }

  /**
   * 顯示遮罩的視覺實作 hook。預設 = 把 spawn 出的 mask node 設成 active。
   * 子類可改為色彩 tween / opacity 等其他策略。
   */
  protected applyMaskVisual(row: number, column: number): void {
    if (this.maskArray?.[row]?.[column]) {
      this.maskArray[row][column].active = true;
    } else {
      console.warn('[WheelMaskController] mask node missing', row, column);
    }
  }

  /**
   * 隱藏遮罩的視覺實作 hook。預設 = 將 mask node 切回 inactive。
   */
  protected removeMaskVisual(row: number, column: number): void {
    if (this.maskArray?.[row]?.[column]) {
      this.maskArray[row][column].active = false;
    } else {
      console.warn('[WheelMaskController] mask node missing', row, column);
    }
  }
}
