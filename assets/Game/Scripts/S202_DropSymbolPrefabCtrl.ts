import {EnumAnimaType} from '../../SlotModule/Wheel/DropModule';
import DropSymbolPrefabController from '../../SlotModule/Wheel/DropSymbolPrefabController';
import {Symbol} from '../../SlotModule/Wheel/Symbol';
import {
  _decorator,
  Node,
  Animation,
  CCFloat,
  Enum,
  Prefab,
  Sprite,
  sp,
} from 'cc';
const {ccclass, property} = _decorator;

type SpawnAnimationSetting = Parameters<
  DropSymbolPrefabController['spawnAnimation']
>[0];

@ccclass
export default class S202_DropSymbolPrefabCtrl extends DropSymbolPrefabController {
  protected spawnAnimation(
    setting: SpawnAnimationSetting,
    wheelIndex: number,
    symbolIndex: number,
    type: EnumAnimaType
  ) {
    const symbol: Symbol = this.getSymbol(wheelIndex, symbolIndex);
    const animArgs = setting.getArgs(type);
    const prefab: Prefab = animArgs.prefab;
    const sortedIndex =
      symbolIndex +
      this.wheelBlockController.wheelAry[wheelIndex].outOfTopSymbolAmount;
    if (prefab) {
      const node: Node = this.pool.spawn(prefab.data, setting.animaLayer);
      this.info[wheelIndex][sortedIndex].symbol = symbol;
      this.align(node, symbol.node);
      if (animArgs.hideSymbol) {
        symbol.hide();
      }
      // 2025.04.16
      // 改成播放Prefab中所有動畫
      const spinAnim: sp.Skeleton = node.getComponent(sp.Skeleton);

      if (spinAnim) {
        // pool 復用時把所有殘留狀態清乾淨，確保從第 0 幀重新開始
        spinAnim.clearTracks();
        spinAnim.setToSetupPose();
        spinAnim.timeScale = 1;
        spinAnim.setCompleteListener(null);
        spinAnim.setAnimation(0, animArgs.animName, false);
        // 立刻 apply 第 0 幀，避免渲染到上一次殘留的姿勢
        spinAnim.updateAnimation(0);
      }

      this.info[wheelIndex][sortedIndex].anim = node;
    }
  }
}
