import {
  _decorator,
  Component,
  Prefab,
  sp,
  Tween,
  tween,
  Node,
  UIOpacity,
  UITransform,
  Vec3,
} from 'cc';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {StartGameExArgs} from '../../SlotModule/Define/SlotGameData';
import {S202_DragonBall} from './S202_DragonBall';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {ComboInfo} from './Define';
import S202_Symbol from './S202_Symbol';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {Symbol} from '../../SlotModule/Wheel/Symbol';
const {ccclass, property} = _decorator;

@ccclass('S202_DragonBallCtrl')
export class S202_DragonBallCtrl extends Component {
  @property([S202_DragonBall])
  private dragonBallList: S202_DragonBall[] = [];
  @property(UIOpacity)
  private dragonBallOpacityList: UIOpacity[] = [];

  @property(sp.Skeleton)
  private dragonBallSkeleton: sp.Skeleton = null;
  //珠子上的特效
  @property(sp.Skeleton)
  private multipleEffectSkeleton: sp.Skeleton = null;
  @property(S202_DragonBall)
  private mainMultipleBall: S202_DragonBall = null;
  @property(sp.Skeleton)
  private moveExpendSkeleton: sp.Skeleton = null;
  @property(sp.Skeleton)
  private headSkeleton: sp.Skeleton = null;
  @property(SpawnPool)
  private goldenEffectPool: SpawnPool = null;
  @property(Prefab)
  private goldenEffectPrefab: Prefab = null;
  @property(Node)
  private goldenEffectNode: Node = null;

  private isFreeGame: boolean = false;

  private isShowSpinMultiple: boolean = false;

  private multipleList: number[] = [];

  public curMainMultiple: number = 1;

  protected onLoad(): void {
    SlotGDK.instance.receiveStartGame.insert(this.onStartGame, this);
    SlotGDK.instance.receiveSpinData.insert(this.onSpinData, this);
    SlotGDK.instance.receiveFeverData.insert(this.onFeverGameData, this);
    SlotGDK.instance.eventSpin.insert(this.onSpin, this);
  }
  protected onDestroy(): void {
    SlotGDK.instance.receiveStartGame.remove(this.onStartGame, this);
    SlotGDK.instance.receiveSpinData.remove(this.onSpinData, this);
    SlotGDK.instance.receiveFeverData.remove(this.onFeverGameData, this);
    SlotGDK.instance.eventSpin.remove(this.onSpin, this);
    this.unscheduleAllCallbacks();
  }

  protected start(): void {
    this.init();
    this.resetDragonBall();
  }

  public init(isFreeGame: boolean = false) {
    this.isFreeGame = isFreeGame;
    this.curMainMultiple = 1;
    this.isShowSpinMultiple = true;
    this.isFreeGame = isFreeGame;
    this.setSkin(isFreeGame);
    //this.resetDragonBall();
  }

  private resetDragonBall(): void {
    for (let i = 0; i < this.dragonBallList.length; i++) {
      this.dragonBallList[i].init();
    }
    this.mainMultipleBall.init();
    this.mainMultipleBall.setMainBall(this.curMainMultiple, this.isFreeGame);
  }

  private onStartGame(startGameData: StartGameExArgs = null): void {
    this.setDragonBall(startGameData.extraInfo['ComboMultipleAddList']);
    this.setMainMultipleBall(
      startGameData.extraInfo['ComboMultipleAddList'][0]
    );
  }

  private async onSpin(): Promise<void> {
    this.dragonBallSkeleton.setAnimation(0, 'StoneSlabRefresh_1', false);
    this.multipleEffectSkeleton.setAnimation(0, 'StoneSlabRefresh_1', false);
    this.dragonBallSkeleton.timeScale = 3;
    this.curMainMultiple = 1;
    this.mainMultipleBall.init();
    this.isShowSpinMultiple = false;

    await Promise.all(
      this.dragonBallOpacityList.map(dragonBall => {
        if (dragonBall === null) return Promise.resolve();
        // 防止連續 spin 時舊 tween 與新 tween 疊加搶同一個 opacity
        Tween.stopAllByTarget(dragonBall);
        return new Promise<void>(resolve => {
          tween(dragonBall)
            .to(0.3, {opacity: 0})
            .call(() => resolve())
            .start();
        });
      })
    );

    // 元件已被銷毀（場景切換等）就不要再動 state，避免在無效物件上寫入
    if (!this.isValid) return;

    this.isShowSpinMultiple = true;
  }

  private async onFeverGameData(rawData: JSON): Promise<void> {
    //如果sg_state為init則不執行
    if (rawData?.['data']?.['sg_state'] === 1) {
      return;
    }
    await this.onSpin();
    this.isShowSpinMultiple = true;
    const multipleList = this.extractFeverMultipleArray(rawData);
    this.updateMultipleList(multipleList);
    this.dragonBallSkeleton.setAnimation(0, 'StoneSlabRefresh_2', false);
    this.dragonBallSkeleton.timeScale = 2;
    for (let i = 0; i < this.dragonBallList.length; i++) {
      this.dragonBallList[i].getComponent(UIOpacity).opacity = 255;
    }
    this.setMultipleBall(multipleList);
  }

  private onSpinData(rawData: JSON): void {
    //等待isShowSpinMultiple 為true後再執行
    if (!this.isShowSpinMultiple) {
      this.scheduleOnce(() => {
        this.onSpinData(rawData);
      }, 0.1);
      return;
    }
    const multipleList = this.extractMultipleArray(rawData);
    this.updateMultipleList(multipleList);
    this.dragonBallSkeleton.setAnimation(0, 'StoneSlabRefresh_2', false);
    this.dragonBallSkeleton.timeScale = 3;
    for (let i = 0; i < this.dragonBallList.length; i++) {
      this.dragonBallList[i].getComponent(UIOpacity).opacity = 255;
    }
    this.setMultipleBall(multipleList);
  }

  public showOnSpinMultiple(multipleList: number[]): void {
    this.setMultipleBall(multipleList);
    this.dragonBallSkeleton.setAnimation(0, 'StoneTabletPromotion', false);
  }

  public setSkin(isFreeGame: boolean): void {
    this.dragonBallSkeleton.setSkin(this.isFreeGame ? 'FG' : 'MG');
    this.headSkeleton.setSkin(this.isFreeGame ? 'FG' : 'MG');
    this.mainMultipleBall.setMainBall(this.curMainMultiple, this.isFreeGame);
  }

  public setDragonBall(ballList: number[]): void {
    // 從第二個開始設定，第一個是主倍數
    for (let i = 1; i < ballList.length; i++) {
      if (i > this.dragonBallList.length) break;
      this.dragonBallList[i - 1].setDragonBall(ballList[i]);
    }
  }

  public setMainMultipleBall(multiple: number): void {
    this.mainMultipleBall.setMainBall(multiple, false);
  }

  public setMultipleBall(multipleList: number[]): void {
    for (let i = 1; i < multipleList.length; i++) {
      if (i > this.dragonBallList.length) break;
      this.dragonBallList[i - 1].setDragonBall(multipleList[i]);
    }
  }

  /**
   * 從 cmd_data 沿著
   *   data → wheel_blocks[0] → feature_wheels.End[0] → combo_info[0] → multiple_array
   * 安全取出龍珠倍率陣列；任何一層缺少或型別不對都回傳 null
   */
  private extractMultipleArray(rawData: JSON): number[] | null {
    const data = rawData?.['data'];
    if (!data) return null;

    const wheelBlocks = data['wheel_blocks'];
    if (!Array.isArray(wheelBlocks) || wheelBlocks.length === 0) return null;

    return this.extractMultipleArrayFromWheelBlock(wheelBlocks[0]);
  }

  /**
   * 從 fever 封包沿著
   *   data → sg_map → result → feature_wheels.End[0] → combo_info[0] → multiple_array
   * 安全取出龍珠倍率陣列；任何一層缺少或型別不對都回傳 null
   */
  private extractFeverMultipleArray(rawData: JSON): number[] | null {
    const result = rawData?.['data']?.['sg_map']?.['result'];
    if (!result) return null;

    return this.extractMultipleArrayFromWheelBlock(result);
  }

  /**
   * 從 wheel_block / result 物件取出 multiple_array
   * 路徑：feature_wheels.End[0] → combo_info[0] → multiple_array
   */
  private extractMultipleArrayFromWheelBlock(
    wheelBlock: JSON
  ): number[] | null {
    const featureWheels = wheelBlock?.['feature_wheels'];
    if (!featureWheels) return null;

    const endList = featureWheels['End'];
    if (!Array.isArray(endList) || endList.length === 0) return null;

    const comboInfoList = endList[0]?.['combo_info'];
    if (!Array.isArray(comboInfoList) || comboInfoList.length === 0) {
      return null;
    }

    const multipleArray = comboInfoList[0]?.['multiple_array'];
    if (!Array.isArray(multipleArray) || multipleArray.length === 0) {
      return null;
    }

    return multipleArray;
  }

  public updateMultipleList(multipleList: number[]): void {
    this.multipleList = multipleList;
  }

  /**
   * 播放 moveExpend 的 In → Loop → Out 序列，等到 Out 撥完才 resolve
   */
  private playMoveExpendAnimation(moveCount: number): Promise<void> {
    return new Promise<void>(resolve => {
      this.moveExpendSkeleton.timeScale = 1;
      this.moveExpendSkeleton.setCompleteListener(async trackEntry => {
        if (trackEntry?.animation?.name !== 'Out') return;
        this.moveExpendSkeleton.setCompleteListener(null);
        //await waitForSeconds(0.5);
        resolve();
      });
      this.moveExpendSkeleton.setAnimation(0, 'In', false);
      this.moveExpendSkeleton.addAnimation(0, 'Out', false);
    });
  }

  private async playDragonBallExpendAnimation(
    moveCount: number
  ): Promise<void> {
    //if (moveCount == 0) return;
    if (moveCount == 1) {
      this.dragonBallList[0].showMultipleEffect();
      return;
    }
    await waitForSeconds(0.3);
    for (let i = 1; i < moveCount; i++) {
      this.dragonBallList[i].showMultipleEffect();
      await waitForSeconds(0.1);
    }
  }

  private playMoveExpendOutAnimation(): void {
    this.moveExpendSkeleton.setCompleteListener(trackEntry => {
      if (trackEntry?.animation?.name !== 'Out') return;
      this.moveExpendSkeleton.setCompleteListener(null);
    });
    this.moveExpendSkeleton.timeScale = 1;
    this.moveExpendSkeleton.setAnimation(0, 'Out', false);
  }

  public async showDragonEffectAnimation(
    comboInfo: ComboInfo,
    moveCount: number,
    isGolden: boolean
  ): Promise<void> {
    //乘倍珠子外框動畫

    if (moveCount > 1 && isGolden) {
      //用result判斷是不是金色wild是的話需要飛特效上去
      await this.playGoldenEffect(comboInfo);
      this.playDragonBallExpendAnimation(moveCount);
      await this.playMoveExpendAnimation(moveCount);
    } else if (moveCount >= 1 && !isGolden) {
      this.playDragonBallExpendAnimation(1);
      await waitForSeconds(1);
    }
  }

  public async moveDragonBall(
    moveCount: number,
    comboInfo: ComboInfo
  ): Promise<void> {
    for (let i = 1; i <= moveCount; i++) {
      this.dragonBallSkeleton.timeScale = 1;
      this.dragonBallSkeleton.setAnimation(0, 'StoneTabletPromotion', false);
      this.curMainMultiple += this.dragonBallList[0].multiple;
      //await waitForSeconds(0.1);
      //更新主倍數
      this.scheduleOnce(() => {
        this.mainMultipleBall.setMainBall(
          this.curMainMultiple,
          this.isFreeGame
        );
      }, 0.45);

      this.headSkeleton.setAnimation(0, 'StoneTabletPromotion', false);
      this.headSkeleton.timeScale = 1;
      this.multipleEffectSkeleton.node.active = true;
      this.multipleEffectSkeleton.setAnimation(
        0,
        'StoneTabletPromotion',
        false
      );
      this.multipleEffectSkeleton.timeScale = 1;
      await waitForSeconds(0.5);
      this.dragonBallList[moveCount - i].hideMultipleEffect();
      await waitForSeconds(0.5);

      //更新龍珠倍數
      for (let j = 0; j < this.dragonBallList.length; j++) {
        if (j + i + 1 >= this.multipleList.length) continue;
        const multiple = this.multipleList[j + i + 1];
        this.dragonBallList[j].setDragonBall(multiple);
      }

      this.dragonBallSkeleton.setAnimation(0, '1X_Loop', true);

      //await waitForSeconds(0.5);
    }
    if (moveCount > 1) {
      //this.playMoveExpendOutAnimation();
    }
    this.dragonBallSkeleton.setAnimation(0, '1X_Loop', true);
  }

  private async playGoldenEffect(comboInfo: ComboInfo): Promise<void> {
    for (const position of comboInfo.refresh_pos) {
      const wheelIndex = Math.floor(position / 4);
      const symbolIndex = position % 4;
      const symbolID = comboInfo.wbResult.resultAry[wheelIndex][symbolIndex];
      if (S202_Symbol.isBigJoker(symbolID)) {
        const symbol: Symbol =
          SlotGameMediator.instance.wheelsManager.wheelControllerList[0]
            .wheelBlock.wheelAry[wheelIndex].symbolAry[symbolIndex];
        //播放金色特效
        const goldenEffect = this.goldenEffectPool.spawn(
          this.goldenEffectPrefab.data,
          this.goldenEffectNode
        );

        // 先取 symbol 世界座標，再轉成特效父節點的本地座標
        const symbolWorldPos = symbol.node
          .getComponent(UITransform)
          .convertToWorldSpaceAR(Vec3.ZERO);
        const totalMultiplePos = this.mainMultipleBall.node
          .getComponent(UITransform)
          .convertToWorldSpaceAR(Vec3.ZERO);
        //播放金色特效
        const effectSkel = goldenEffect.getComponent(sp.Skeleton);
        effectSkel.node.setWorldPosition(symbolWorldPos);
        this.setBoneToSymbolWorldPos(
          goldenEffect,
          effectSkel,
          'Start',
          symbolWorldPos
        );
        //終點位置改成總倍數那個物件
        this.setBoneToSymbolWorldPos(
          goldenEffect,
          effectSkel,
          'End',
          totalMultiplePos
        );
        //起點位置改成symbol的位置
        this.setBoneToSymbolWorldPos(
          goldenEffect,
          effectSkel,
          'shuziGlow',
          symbolWorldPos
        );

        effectSkel.setAnimation(0, 'Wild_Trail', true);
        effectSkel.setCompleteListener(trackEntry => {
          if (trackEntry?.animation?.name !== 'Wild_Trail') return;
          effectSkel.setCompleteListener(null);
          this.goldenEffectPool.despawn(goldenEffect);
        });

        /*
        effectSkel.addAnimation(0, 'Wild_Hit', false);
        effectSkel.setCompleteListener(trackEntry => {
          if (trackEntry?.animation?.name !== 'Wild_Hit') return;
          effectSkel.setCompleteListener(null);
          this.goldenEffectPool.despawn(goldenEffect);
        });
        */
      }
    }
    await waitForSeconds(0.4);
  }

  private setBoneToSymbolWorldPos(
    effectNode: Node,
    effectSkel: sp.Skeleton,
    boneName: string,
    targetWorldPos: Vec3
  ): void {
    const skeleton = effectSkel?._skeleton;
    const targetBone = skeleton?.findBone(boneName);
    const effectTransform = effectNode.getComponent(UITransform);
    if (!targetBone || !effectTransform) return;

    // 轉成 skeleton 節點本地座標，再反解成 bone local 座標
    const targetLocalPos = effectTransform.convertToNodeSpaceAR(targetWorldPos);
    const parentBone = targetBone.parent as any;
    if (!parentBone) {
      targetBone.x = targetLocalPos.x;
      targetBone.y = targetLocalPos.y;
      skeleton.updateWorldTransform();
      return;
    }

    const dx = targetLocalPos.x - parentBone.worldX;
    const dy = targetLocalPos.y - parentBone.worldY;
    const invDet =
      1 / (parentBone.a * parentBone.d - parentBone.b * parentBone.c);
    targetBone.x = (dx * parentBone.d - dy * parentBone.b) * invDet;
    targetBone.y = (dy * parentBone.a - dx * parentBone.c) * invDet;
    skeleton.updateWorldTransform();
  }

  public showMultipleEffect(isShow: boolean): void {
    this.multipleEffectSkeleton.node.active = isShow;
    if (isShow) {
      this.multipleEffectSkeleton.setAnimation(0, '1X_Loop', true);
    }
  }
}
