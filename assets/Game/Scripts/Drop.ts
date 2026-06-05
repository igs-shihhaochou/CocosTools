/* eslint-disable camelcase */
import {
  _decorator,
  Component,
  Prefab,
  Vec3,
  tween,
  Node,
  UITransform,
  UIOpacity,
  sp,
} from 'cc';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {PlatformGDK} from '../../CommonModule/Script/Platform/PlatformGDK';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {
  SymbolInfomation,
  WheelBlockResultArgs,
} from '../../SlotModule/Define/SlotGameData';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import DropModule, {MainGameDropData} from '../../SlotModule/Wheel/DropModule';
import {Symbol} from '../../SlotModule/Wheel/Symbol';
import ComboPanel from './ComboPanel';
import {
  ComboInfo,
  S202_FreeGameData,
  S202_Status,
  S202_SymbolID,
} from './Define';
import S202_Symbol from './S202_Symbol';
import Score from './Score';
import {S202_DragonBallCtrl} from './S202_DragonBallCtrl';

const {ccclass, property} = _decorator;
const ROWS = 4,
  COLUMNS = 5;
const flopDuration = 0.6;
const flopGap = 0.15;
const animDuration = 2.5;
const flyDuration = 0.3;
const flyDelay = 1.5;

interface BigJokerFrame {
  position: number;
  frame: Node;
}

@ccclass
export default class Drop extends Component {
  @property({type: DropModule, displayName: '掉落模組'})
  public dropModule: DropModule = null;

  @property({type: SpawnPool, displayName: 'SpawnPool'})
  public pool: SpawnPool = null;

  @property({type: Prefab, displayName: '撲克牌牌背'})
  public cardBack: Prefab = null;

  @property({type: Prefab, displayName: '大鬼翻牌動畫'})
  public flopBigJoker: Prefab = null;

  @property({type: Prefab, displayName: '小鬼翻牌動畫'})
  public flopSmallJoker: Prefab = null;

  @property({type: Prefab, displayName: '大鬼牌尚未散播框'})
  public frameBigJoker: Prefab = null;

  @property({type: Prefab, displayName: '大鬼牌散播動畫'})
  public flySpray: Prefab = null;

  @property({type: Node, displayName: '背景壓黑'})
  public black: Node = null;

  @property({type: ComboPanel, displayName: '背景壓黑'})
  public combo: ComboPanel = null;

  @property({type: Node, displayName: '翻牌圖層'})
  public flop: Node = null;

  @property({type: Node, displayName: '飛牌圖層'})
  public fly: Node = null;

  @property({type: Node, displayName: '大鬼牌框圖層'})
  public frame: Node = null;

  @property({type: Score, displayName: '分數'})
  public score: Score = null;

  @property({type: S202_DragonBallCtrl, displayName: '龍珠控制器'})
  public dragonBallCtrl: S202_DragonBallCtrl = null;

  public bigJokerPosition: number[] = [];
  public totalWin = 0;
  public maxWinValue = 0;
  private nodeList: Node[] = [];
  private frameList: BigJokerFrame[] = [];
  private lastComboInfo: ComboInfo = null;

  protected onLoad(): void {
    SlotGDK.instance.showSpecialSymbol.insert(this.fadeInBlack, this);
    SlotGDK.instance.hideSpecialSymbol.insert(this.fadeOutBlack, this);
    SlotGDK.instance.eventSpin.insert(this.resetGameWin, this);
    SlotGDK.instance.eventSpin.insert(this.resetCombo, this);
    SlotGDK.instance.sendNextFeverCmd.insert(this.resetCombo, this);
    SlotGDK.instance.eventClickChangeBet.insert(this.resetCombo, this);
  }

  protected onDestroy(): void {
    SlotGDK.instance.showSpecialSymbol.remove(this.fadeInBlack, this);
    SlotGDK.instance.hideSpecialSymbol.remove(this.fadeOutBlack, this);
    SlotGDK.instance.eventSpin.remove(this.resetGameWin, this);
    SlotGDK.instance.eventSpin.remove(this.resetCombo, this);
    SlotGDK.instance.eventClickChangeBet.remove(this.resetCombo, this);
    SlotGDK.instance.sendNextFeverCmd.remove(this.resetCombo, this);
  }

  public resetGameWin(): void {
    this.totalWin = 0;
    this.maxWinValue = 0;
  }

  public resetCombo(): void {
    // this.combo.Multiple = 0;
  }

  public parseData(comboInfo: ComboInfo): void {
    MainGameDropData.instance.resultWheels =
      comboInfo.wbResult.resultAry.slice();

    comboInfo.bingo_position = [];
    for (let i = 0; i < COLUMNS; ++i) {
      const row: number[] = [];
      for (let j = 0; j < ROWS; ++j) {
        const id: number = i * ROWS + j;
        if (comboInfo.refresh_pos.indexOf(id) !== -1) {
          row.push(1);
        } else {
          row.push(0);
        }
      }
      comboInfo.bingo_position.push(row);
    }

    MainGameDropData.instance.clearSymbol = comboInfo.bingo_position;
    MainGameDropData.instance.bingoSymbol = comboInfo.bingo_position;

    MainGameDropData.instance.thisWinAmount = comboInfo.this_win_amount;
    MainGameDropData.instance.totalWinAmount +=
      MainGameDropData.instance.thisWinAmount;
  }

  public async comboFeature(data: ComboInfo[]) {
    PlatformGDK.instance.clearMessage.notify();
    for (const comboInfo of data) {
      comboInfo.wbResult = new WheelBlockResultArgs().parse(comboInfo.result);
      if (comboInfo.combo === 0) {
        this.lastComboInfo = comboInfo;
        continue;
      }
      //this.combo.fadeIn();
      //this.combo.Set(this.lastComboInfo);
      await this.playCombo(comboInfo);
      //處理龍珠的設定
      //await this.dragonBallCtrl.moveDragonBall(this.lastComboInfo.advance, combon);
      this.dragonBallCtrl.updateMultipleList(comboInfo.multiple_array);
      this.lastComboInfo = comboInfo;
      await waitForSeconds(0.3);
    }
    //TODO 目前資產同步方式不統一，所以可能需要特別修改
    PlatformGDK.instance.updatePlayerBalance.notify();
    PlatformGDK.instance.clearMessage.notify();
    //this.combo.fadeOut(0.1);
    await waitForSeconds(this.totalWin === 0 ? 0 : 0);
  }

  public async playCombo(comboInfo: ComboInfo) {
    this.parseData(comboInfo);
    this.bigJokerPosition = [];
    this.fadeInBlack();
    //this.score.value = this.lastComboInfo.this_win_amount;
    this.score.showMultipleValue(
      this.lastComboInfo.this_win_amount,
      this.lastComboInfo.bingo_multiplier
    );
    this.score.fadeIn();
    this.totalWin += this.lastComboInfo.this_win_amount;
    let showWinValue = this.totalWin;
    if (this.maxWinValue !== 0 && this.totalWin > this.maxWinValue) {
      showWinValue = this.maxWinValue;
    }
    PlatformGDK.instance.showWinMessage.notify(showWinValue);
    PlatformGDK.instance.rollGameWin.notify(showWinValue, 0.2);
    this.dragonBallCtrl.showMultipleEffect(true);
    this.playBingoAudio(comboInfo);
    await new Promise<void>((resolve, reject) => {
      this.dropModule.setClearEffect(comboInfo.bingo_position, resolve);
    });
    this.playAudio('a19');
    //this.score.fadeOut();
    this.dragonBallCtrl.showMultipleEffect(false);
    await this.dropModule.split(comboInfo.bingo_position);

    this.dropModule.updateDropInfo(
      S202_FreeGameData.Status === S202_Status.FreeGame
    );
    this.showCardBack(comboInfo);
    this.fadeOutBlack();

    await new Promise<void>((resolve, reject) => {
      this.dropModule.drop(comboInfo.bingo_position, false, false, () => {
        resolve();
      });
    });
    //表演一般combo時的龍珠特效
    await this.dragonBallCtrl.showDragonEffectAnimation(
      comboInfo,
      this.lastComboInfo.advance,
      false
    );
    await this.jokerFeature(comboInfo);
    //表演刷光的
    if (this.lastComboInfo.advance > 1) {
      await this.dragonBallCtrl.showDragonEffectAnimation(
        comboInfo,
        this.lastComboInfo.advance,
        true
      );
    }
    await this.dragonBallCtrl.moveDragonBall(
      this.lastComboInfo.advance,
      comboInfo
    );

    this.clearPool();
  }

  public clearPool(): void {
    while (this.nodeList.length) {
      const node = this.nodeList.pop();
      this.pool.despawn(node);
    }
  }

  public async showCardBack(comboInfo: ComboInfo) {
    for (const position of comboInfo.refresh_pos) {
      const symbol: Symbol = this.Symbol(position);
      if (
        S202_Symbol.isGolden(
          this.lastComboInfo.wbResult.resultAry[Math.floor(position / 4)][
            position % 4
          ]
        )
      ) {
        const node = this.Spawn(
          this.cardBack,
          symbol.node.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO)
        );
        this.nodeList.push(node);
        comboInfo.bingo_position[Math.floor(position / 4)][position % 4] = 0;
        symbol.hide();
      }
    }
  }

  public async playBingoAudio(comboInfo: ComboInfo): Promise<void> {
    await waitForSeconds(0.2);
    const symbolIDList: number[] = [];
    comboInfo.bingo_position[0].forEach((bingo, index) => {
      const symbolID =
        bingo === 1 ? this.lastComboInfo.wbResult.resultAry[0][index] : -1;
      if (
        symbolID >= S202_SymbolID.Ace &&
        symbolIDList.indexOf(symbolID % 10) === -1
      ) {
        symbolIDList.push(symbolID % 10);
      }
    });
    symbolIDList.sort((a, b) => {
      return a - b;
    });
    if (symbolIDList.length >= 3) {
      const random: number = Math.random();
      if (random <= 1 / 3) {
        this.playAudio('sound09');
      } else if (random <= 2 / 3) {
        this.playAudio('sound10');
      } else {
        this.playAudio('sound11');
      }

      if (this.lastComboInfo.combo_multiple > 1) {
        this.playAudio('Rate' + this.lastComboInfo.combo_multiple, 0.5);
      }
    } else {
      symbolIDList.forEach((symbolID, index) => {
        this.playAudio('sound0' + (symbolID + 1), index * 0.5);
      });

      if (this.lastComboInfo.combo_multiple > 1) {
        this.playAudio(
          'Rate' + this.lastComboInfo.combo_multiple,
          symbolIDList.length * 0.5
        );
      }
    }
    let hasJokerWin = false;
    comboInfo.bingo_position.forEach((bingoArr, wheelIndex) => {
      comboInfo.bingo_position[wheelIndex].forEach((bingo, index) => {
        const symbolID: number =
          this.lastComboInfo.wbResult.resultAry[wheelIndex][index];
        if (S202_Symbol.isJoker(symbolID)) {
          hasJokerWin = true;
        }
      });
    });
    if (hasJokerWin) {
      this.playAudio('a20');
    }
  }

  public async playAudio(name: string, delay = 0): Promise<void> {
    if (delay > 0) {
      await waitForSeconds(delay);
    }
    // SlotGDK.function(Audio.Play)(name);
    SlotGameMediator.instance.audioManager.play(name);
  }

  public async jokerFeature(comboInfo: ComboInfo) {
    this.clearPool();
    await this.jokerFlop(comboInfo);
    await this.sprayBigJoker(comboInfo);
  }

  public async jokerFlop(comboInfo: ComboInfo) {
    let isPlay = false;
    for (const position of comboInfo.refresh_pos) {
      if (
        S202_Symbol.isGolden(
          this.lastComboInfo.wbResult.resultAry[Math.floor(position / 4)][
            position % 4
          ]
        )
      ) {
        this.playFlop(comboInfo, position);
        isPlay = true;
      }
    }
    if (isPlay) {
      this.playAudio('a12');
      await waitForSeconds(flopDuration);
    }
  }

  public async playFlop(comboInfo: ComboInfo, position: number) {
    const symbol: Symbol = this.Symbol(position);
    let node: Node = null;
    comboInfo.bingo_position[Math.floor(position / 4)][position % 4] = 0;
    const isBigSymbol = S202_Symbol.isBigJoker(
      comboInfo.wbResult.resultAry[Math.floor(position / 4)][position % 4]
    );

    //小鬼牌
    node = this.Spawn(
      isBigSymbol ? this.flopBigJoker : this.flopSmallJoker,
      symbol.node.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO),
      this.flop
    );
    const jokerSpine = node.getComponentInChildren(sp.Skeleton);
    jokerSpine.setAnimation(0, 'In', false);
    await waitForSeconds(flopDuration);
    this.setSymbol(
      position,
      isBigSymbol ? S202_SymbolID.BigJoker : S202_SymbolID.SmallJoker
    );

    this.nodeList.push(node);
  }

  public Spawn(
    prefab: Prefab,
    position: Vec3,
    layer: Node = this.pool.node
  ): Node {
    const node: Node = this.pool.spawn(prefab.data, layer);
    node.position = node.parent
      .getComponent(UITransform)
      .convertToNodeSpaceAR(position);
    return node;
  }

  public async sprayBigJoker(comboInfo: ComboInfo) {
    for (const position of this.bigJokerPosition) {
      const index = this.frameList.findIndex(frame => {
        return frame.position === position;
      });
      const frame = this.frameList.splice(index, 1);
      this.pool.despawn(frame[0].frame);
      this.playAudio('a21', 0.2);
      this.Spray(position, position, false);
      if (
        comboInfo.extra_wild_info &&
        comboInfo.extra_wild_info.hasOwnProperty(position)
      ) {
        const wildInfo: number[] = comboInfo.extra_wild_info[position];
        for (const wild of wildInfo) {
          this.Spray(position, wild, true);
          await waitForSeconds(flopGap);
        }
      }

      await waitForSeconds(animDuration - flopGap);
    }
  }

  public Spray(from: number, to: number, needAudio = false): void {
    //大鬼牌 擴展
    const node: Node = this.Spawn(
      this.flySpray,
      this.Symbol(from)
        .node.getComponent(UITransform)
        .convertToWorldSpaceAR(Vec3.ZERO),
      this.fly
    );
    const endPosition: Vec3 = node.parent
      .getComponent(UITransform)
      .convertToNodeSpaceAR(
        this.Symbol(to)
          .node.getComponent(UITransform)
          .convertToWorldSpaceAR(Vec3.ZERO)
      );
    // this.nodeList.push(node);
    if (needAudio) {
      const delay = 1;
      this.playAudio('a22', delay + flyDuration);
      node.getComponent(UIOpacity).opacity = 0;
      tween<Node>(node)
        .delay(delay)
        .parallel(
          tween<Node>().call(() => {
            tween<UIOpacity>(node.getComponent(UIOpacity))
              .to(flyDuration, {opacity: 255})
              .start();
          }),
          tween<Node>().to(
            flyDuration,
            {
              position: endPosition,
            },
            {
              easing: 'cubicIn',
            }
          )
        )
        .call(() => {
          this.setSymbol(to, S202_SymbolID.BigJoker);
          node.parent = this.pool.node;
          this.pool.despawn(node);
        })
        .start();
    } else {
      const spine = node.getComponentInChildren(sp.Skeleton);
      spine.setAnimation(0, 'Trigger', false);
      tween<Node>(node)
        .delay(flyDelay)
        .call(() => {
          tween<UIOpacity>(node.getComponent(UIOpacity))
            .to(0, {opacity: 255})
            .start();
        })
        .to(flyDuration, {position: endPosition}, {easing: 'cubicIn'})
        .call(() => {
          this.setSymbol(to, S202_SymbolID.BigJoker);
          node.parent = this.pool.node;
          this.pool.despawn(node);
        })
        .start();
    }
  }

  public Symbol(position: number): Symbol {
    const wheelID: number = Math.floor(position / 4);
    const column: number = position % 4;
    const symbol: Symbol =
      this.dropModule.wheelBlockController.wheelAry[wheelID].symbolAry[column];
    return symbol;
  }

  public setSymbol(position: number, symbolID: number): void {
    const wheelID: number = Math.floor(position / 4);
    const column: number = position % 4;
    const symbol: Symbol =
      this.dropModule.wheelBlockController.wheelAry[wheelID].symbolAry[column];
    const info: SymbolInfomation =
      SlotGameMediator.instance.symbolSetting.createSymbolInfo(symbolID);
    MainGameDropData.instance.resultWheels[wheelID][column] = symbolID;
    symbol.changeSymbol(info);
    symbol.show();
    symbol.node.getComponent(UIOpacity).opacity = 255;
  }

  public fadeInBlack(): void {
    tween<UIOpacity>(this.black.getComponent(UIOpacity))
      .to(0.2, {opacity: 180})
      .start();
  }
  public fadeOutBlack(): void {
    tween<UIOpacity>(this.black.getComponent(UIOpacity))
      .to(0.2, {opacity: 0})
      .start();
  }
}
