import {_decorator, Component, sp} from 'cc';
import {waitForSeconds} from '../../../CommonModule/Script/ExtraType';

const {ccclass, property} = _decorator;

@ccclass('LevelAnimationArgs')
export class LevelAnimationArgs {
  @property({displayName: 'loop動畫名稱'})
  public loop = '';
  @property({displayName: 'hit動畫名稱'})
  public hit = '';
  @property({displayName: 'upgrade動畫名稱'})
  public upgrade = '';
}

@ccclass('UpgradableCollector')
export default class CollectorItem extends Component {
  protected currentLevel = 0;

  @property({
    type: [LevelAnimationArgs],
    displayName: '各階動畫名稱',
  })
  public levelAnimations: LevelAnimationArgs[] = [];

  protected start(): void {
    this.test();
  }

  private async test() {
    this.setLevel(2);
    await waitForSeconds(5);
    this.hit();
    await waitForSeconds(5);
    this.upgrade();
    await waitForSeconds(5);
    this.trigger();
  }

  public getLevel() {
    return this.currentLevel;
  }

  // 指定升階狀態
  public setLevel(level: number) {
    console.log(`[UpgradableCollector] setLevel ${level}`);
    this.currentLevel = level;
    this.playLoop();
  }

  // 被擊中但不升階
  public hit() {
    console.log(`[UpgradableCollector] hit ${this.currentLevel}`);
    this.playAnimation(
      this.levelAnimations[this.currentLevel].hit,
      false,
      () => {
        this.playLoop();
      }
    );
  }

  // 被擊中並升階
  public upgrade(increaseLevel = 1, upgradeAnim = '') {
    console.log(
      `[UpgradableCollector] upgrade ${this.currentLevel} -> ${this.currentLevel + increaseLevel}`
    );
    const animName =
      upgradeAnim !== ''
        ? upgradeAnim
        : this.levelAnimations[this.currentLevel].upgrade;
    this.playAnimation(animName, false, () => {
      this.currentLevel += increaseLevel;
      this.playLoop();
    });
  }

  // 被擊中，升滿並觸發
  public trigger(upgradeAnim = '', callBack: Function = null) {
    console.log(
      `[UpgradableCollector] trigger ${this.currentLevel} -> ${this.levelAnimations.length - 1}`
    );
    const animName =
      upgradeAnim !== ''
        ? upgradeAnim
        : this.levelAnimations[this.currentLevel].upgrade;

    this.playAnimation(animName, false, () => {
      this.currentLevel = this.levelAnimations.length - 1;
      this.playLoop();
      if (callBack) callBack();
    });
  }

  // 清空升階狀態
  public reset() {
    console.log('[UpgradableCollector] reset');
    this.currentLevel = 0;
    this.playLoop();
  }

  // 播放該階狀態
  protected playLoop() {
    this.playAnimation(this.levelAnimations[this.currentLevel].loop, true);
  }

  public playAnimation(
    animationName: string,
    isLoop: boolean,
    callback: Function = null
  ) {
    if (!animationName || animationName === '') return;
    let animaNode: sp.Skeleton = null;
    animaNode = this.node.getComponent(sp.Skeleton);
    if (!animaNode) {
      console.error('[UpgradableCollector] Requires sp.Skeleton component!');
      return;
    }
    if (callback) {
      animaNode.setCompleteListener(null);
      animaNode.setCompleteListener(() => {
        animaNode.setCompleteListener(null);
        callback();
      });
    }
    animaNode.setAnimation(0, animationName, isLoop);
  }
}
