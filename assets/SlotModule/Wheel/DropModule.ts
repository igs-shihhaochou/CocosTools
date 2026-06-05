import {
  _decorator,
  Component,
  CCFloat,
  Enum,
  Node,
  Vec2,
  Vec3,
  CCString,
} from 'cc';
const {ccclass, property} = _decorator;

import {WheelBlockResultArgs, WheelDropInfo} from '../Define/SlotGameData';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {WheelBlockController} from './WheelBlockController';
import {DropSymbolNodeMember} from './DropModuleData';
import {Delegate, waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {DropSymbolPrefab, SlotGDK} from '../Define/SlotGDK';
import {Dictionary} from '../../CommonModule/Script/Utility/Dictionary';
import {safeTween} from '../../CommonModule/Script/Utility/NodeEx';
import {
  singleWheelDropingAsyncImpl,
  singleWheelDropingImpl,
} from './DropModuleDroping';
import {
  getClearSymbolImpl,
  getBingoSymbolImpl,
  getResultWheelImpl,
} from './DropModuleParse';
import {
  setOpacity,
  getHeight,
} from '../../CommonModule/Script/Utility/NodeProperty';
/**
 * 會產生Prefab的類型
 */
export enum EnumAnimaType {
  EnumWheelStop, //停輪時表演
  EnumBingo, //中獎時
  EnumSplit, //切開
  EnumWheelStopLoop, //停輪時表演
}

export enum DropMode {
  followUp,
  takeEmptySpot,
}

@ccclass('MainGameDropData')
export class MainGameDropData {
  private static _instance: MainGameDropData;
  public static get instance(): MainGameDropData {
    if (!MainGameDropData._instance) {
      MainGameDropData._instance = new MainGameDropData();
    }
    return MainGameDropData._instance;
  }
  public wheelResultArgs: WheelBlockResultArgs;
  public resultWheels: number[][]; //結果盤面
  public clearSymbol: number[][] = []; //對中 要消失的symbol
  public bingoSymbol: number[][] = []; //對中 要消失的symbol
  public nextSgId: number; //下一個要進入的特殊遊戲
  public thisWinAmount: number; //此combo贏分
  public totalWinAmount: number; //此手總贏分
  public winType: number; //報獎類型
  public multiplier = 1;
  public additionalWin = 0;
}

@ccclass('DropModule')
export default class DropModule extends Component {
  public eventStartClear: Delegate = new Delegate();
  public eventDropEnd: Delegate = new Delegate();
  public eventDropModuleInit: Delegate = new Delegate();
  @property(WheelBlockController)
  public wheelBlockController: WheelBlockController = null;
  @property(CCString)
  private splitAudioName = '';
  @property(CCString)
  private bingoAudioName = '';
  @property(CCString)
  /** @internal — 給 helper 用 */
  public wheelStopAudioName = '';
  /** @internal — 給 helper 用 */
  public dropInfo: WheelDropInfo = null;
  @property({type: CCFloat, displayName: '消除動畫時長'})
  private splitTime = 0.63; //split動畫時間
  @property({type: CCFloat, displayName: '中獎動畫時長'})
  private bingoTime = 1; //bingo動畫時間
  @property(CCFloat)
  private wheelGapTime = 0.2; //每一輪掉落的間隔時間
  @property(CCFloat)
  private fastWheelGapTime = 0.2; //每一輪掉落的間隔時間
  @property({type: Enum(DropMode), displayName: '掉落消去模式'})
  private dropMode: DropMode = DropMode.followUp;
  public isSG = false;
  /** @internal — 給 helper 用 */
  public displaySymbolNodes: Node[][] = [];
  /** @internal — 給 helper 用 */
  public symbolMembers: DropSymbolNodeMember[][] = [];
  /** @internal — 給 helper 用 */
  public singleDropSymbolMembers: Dictionary<number, DropSymbolNodeMember[]> =
    null;
  private symbolHeight = 0;
  /** @internal — 給 helper 用 */
  public resultWheel: number[][] = [];
  /**初始化參數 */
  public start(): void {
    this.singleDropSymbolMembers = new Dictionary<
      number,
      DropSymbolNodeMember[]
    >();
    //初始化
    if (this.wheelBlockController) {
      for (let i = 0; i < this.wheelBlockController.wheelAry.length; i++) {
        this.displaySymbolNodes.push([]);
        for (
          let j = 0;
          j < this.wheelBlockController.wheelAry[i].symbolAry.length;
          j++
        ) {
          //將可視範圍內的資料塞進去
          if (
            j >= this.wheelBlockController.wheelAry[i].outOfTopSymbolAmount &&
            j <
              this.wheelBlockController.wheelAry[i].symbolAry.length -
                this.wheelBlockController.wheelAry[i].outOfBottomSymbolAmount
          ) {
            this.displaySymbolNodes[i].push(
              this.wheelBlockController.wheelAry[i].symbolAry[j].node
            );
          }
        }
      }
    }

    if (this.eventDropModuleInit.length > 0) {
      this.eventDropModuleInit.notify();
    }
  }
  /*-------------------------------------------------------------------------------------*/
  //--提供出來呼叫的function--//
  public initData(): void {
    console.log('InitData');
    MainGameDropData.instance.thisWinAmount = 0;
    MainGameDropData.instance.totalWinAmount = 0;
    MainGameDropData.instance.multiplier = 1;
  }
  /**
   * 解析Server傳來的Feature資料
   * @param comboID 第幾個combo
   * @param jsonData Feature資料
   */
  public parseData(comboID: number, jsonData: JSON): void {
    // console.log("%cParseData:" + "%c 第" + comboID + "個combo", "background: #444; color: #bada55; padding: 2px; border-radius:2px", "color:#20A4F3");
    MainGameDropData.instance.clearSymbol = this.getClearSymbol(jsonData);
    MainGameDropData.instance.bingoSymbol = this.getBingoSymbol(jsonData);
    MainGameDropData.instance.resultWheels = this.getResultWheel(jsonData);
    MainGameDropData.instance.thisWinAmount = jsonData['Win'];
    MainGameDropData.instance.totalWinAmount +=
      MainGameDropData.instance.thisWinAmount;
  }
  /**
   * 設定清除的特效(抓Animation並撥放)
   * @param dropDataInfo 表演消失的Symbol
   * @param finishCallBack 結束的CB
   */
  public setClearEffect(
    dropDataInfo: number[][],
    finishCallBack: Function,
    clearSymbol = true
  ): void {
    console.log('SetClearEffect');
    //清除SymbolShowPrefab的全部Prefab(中獎框)
    if (this.eventStartClear.length > 0) {
      this.eventStartClear.notify();
    }
    //通知SymbolShowPrefab
    SlotGDK.event(DropSymbolPrefab.ShowAnimation).notify(
      dropDataInfo,
      dropDataInfo,
      EnumAnimaType.EnumBingo
    );
    SlotGameMediator.instance.audioManager.play(this.bingoAudioName);
    //表演symbol呼吸 喘一下
    safeTween(this)
      .call(() => {
        if (clearSymbol) {
          this.symbolBreath(dropDataInfo);
        }
      })
      .delay(this.bingoTime)
      .call(() => {
        SlotGDK.event(DropSymbolPrefab.EndAnimation).notify(
          dropDataInfo,
          EnumAnimaType.EnumBingo
        );
        if (finishCallBack) {
          finishCallBack();
        }
      })
      .start();
  }
  /**
   * 掉落表演
   * @param dropVal 需要掉落的Symbol
   * @param resultData 最後停輪的盤面
   * @param prewin 是否是Prewin狀態
   * @param startCallBack 開始的CB
   * @param finishCallBack 結束的CB
   */
  public async splitAndDrop(
    dropVal: number[][],
    prewin: boolean,
    firstPrewin: boolean,
    finishCallBack: Function
  ) {
    this.split(dropVal);
    //休息一下再繼續掉落
    if (firstPrewin) await waitForSeconds(1.1);
    else await waitForSeconds(0.3);
    this.drop(dropVal, prewin, firstPrewin, finishCallBack);
  }
  /**
   * 更新掉落消去的 Tempo 模式 (一般或加速)
   * 若在 FreeGame 中應採用一般模
   */
  public updateDropInfo(isSG: boolean = undefined): void {
    if (isSG) {
      this.isSG = isSG;
    }

    if (SlotGDK.instance.fastSpin && this.isSG === false) {
      this.dropInfo =
        this.wheelBlockController.nowDropSetting.fastWheelDropInfo;
    } else {
      this.dropInfo =
        this.wheelBlockController.nowDropSetting.normalWheelDropInfo;
    }
  }
  /**
   * 消除表演
   * @param dropVal 需要消除的Symbol
   */
  public async split(dropVal: number[][]) {
    //disable symbol sprite and wait for drop
    for (let i = 0; i < dropVal.length; i++) {
      for (let j = 0; j < dropVal[i].length; j++) {
        if (dropVal[i][j] === 1) {
          const symbolNode = this.displaySymbolNodes[i][j];
          setOpacity(symbolNode, 0);
        }
      }
    }

    SlotGDK.event(DropSymbolPrefab.ShowAnimation).notify(
      dropVal,
      dropVal,
      EnumAnimaType.EnumSplit
    );
    SlotGameMediator.instance.audioManager.play(this.splitAudioName);

    await waitForSeconds(this.splitTime); //等待砍牌動畫表演結束

    //關閉砍牌表演
    SlotGDK.event(DropSymbolPrefab.EndAnimation).notify(
      dropVal,
      EnumAnimaType.EnumSplit
    );
  }
  public async splitSingle(dropVal: number[][], i: number) {
    //disable symbol sprite and wait for drop
    let count = 0;
    for (let j = 0; j < dropVal[i].length; j++) {
      if (dropVal[i][j] === 1) {
        const symbolNode = this.displaySymbolNodes[i][j];
        setOpacity(symbolNode, 0);
        count++;
      }
    }
    if (count > 0) {
      SlotGameMediator.instance.audioManager.play(this.splitAudioName);
    }
    SlotGDK.event(DropSymbolPrefab.ShowAnimation).notify(
      dropVal,
      dropVal,
      EnumAnimaType.EnumSplit,
      i
    );
    await waitForSeconds(this.splitTime); //等待砍牌動畫表演結束
    //關閉砍牌表演
    SlotGDK.event(DropSymbolPrefab.EndAnimation).notify(
      dropVal,
      EnumAnimaType.EnumSplit,
      i
    );
  }
  private initResultWheel(dropVal: number[][]) {
    if (this.resultWheel.length <= 0) {
      dropVal.forEach((resultArr, wheelIndex) => {
        this.resultWheel.push([]);
        resultArr.forEach(() => {
          this.resultWheel[wheelIndex].push(0);
        });
      });
    } else {
      this.resultWheel.forEach((resultArr, wheelIndex) => {
        resultArr.forEach((result, symbolIndex) => {
          this.resultWheel[wheelIndex][symbolIndex] = 0;
        });
      });
    }
  }
  /**
   * 掉落表演
   * @param dropVal 需要掉落的Symbol
   * @param resultData 最後停輪的盤面
   * @param prewin 是否是Prewin狀態
   * @param startCallBack 開始的CB
   * @param finishCallBack 結束的CB
   */
  public async drop(
    dropVal: number[][],
    prewin: boolean,
    firstPrewin: boolean,
    finishCallBack: Function
  ) {
    this.initResultWheel(dropVal);
    //記住掉落前的資訊
    this.dropInit();
    this.setDropSymbolPos(dropVal);
    this.wheelBlockController.setWheelData(
      null,
      MainGameDropData.instance.resultWheels
    );
    this.resetSymbol(dropVal);

    this.symbolDroping(dropVal, prewin, () => {
      this.resetSymbol(dropVal);
      if (finishCallBack) {
        finishCallBack();
      }
    });
  }
  /*-------------------------------------------------------------------------------------*/
  //--自己會用到的function--//
  /**
   * 將symbol重置,打開sprite
   */
  private resetSymbol(dropVal: number[][]) {
    console.log('ResetSymbol');
    for (let i = 0; i < this.displaySymbolNodes.length; i++) {
      for (let j = 0; j < this.displaySymbolNodes[i].length; j++) {
        if (dropVal[i][j] !== 0) {
          setOpacity(this.displaySymbolNodes[i][j], 255);
          this.displaySymbolNodes[i][j].active = true;
        }
      }
    }
  }
  /**
   * 將symbol重置,打開sprite
   */
  private resetSymbolSingle(i: number) {
    for (let j = 0; j < this.displaySymbolNodes[i].length; j++) {
      setOpacity(this.displaySymbolNodes[i][j], 255);
      this.displaySymbolNodes[i][j].active = true;
    }
  }
  /**
   * 掉落前的初始化,記住原先的資訊
   */
  private dropInit(): void {
    this.symbolMembers = [];
    if (this.wheelBlockController.wheelAry.length >= 2) {
      this.symbolHeight =
        this.displaySymbolNodes[0][0].position.y -
        this.displaySymbolNodes[0][1].position.y;
    } else {
      this.symbolHeight = getHeight(this.displaySymbolNodes[0][0]);
    }
    console.log('SymbolHeight:' + this.symbolHeight);
    for (let i = 0; i < this.displaySymbolNodes.length; i++) {
      this.symbolMembers.push([]);
      for (let j = 0; j < this.displaySymbolNodes[i].length; j++) {
        const nodeMember = new DropSymbolNodeMember();
        const symbolNode = this.displaySymbolNodes[i][j];
        const symbolPos = symbolNode.position;
        nodeMember.showSymbolNode = symbolNode;
        nodeMember.originalPosition = new Vec2(symbolPos.x, symbolPos.y);
        nodeMember.endPosition = new Vec2(symbolPos.x, symbolPos.y);
        this.symbolMembers[i].push(nodeMember);
      }
    }
  }
  /**
   * 掉落前的初始化,記住原先的資訊
   */
  private singleDropInit(wheelIndex: number): void {
    const symbolMembers = [];
    if (this.singleDropSymbolMembers.getValue(wheelIndex) === null)
      this.singleDropSymbolMembers.add(wheelIndex, []);
    if (this.wheelBlockController.wheelAry.length >= 2) {
      this.symbolHeight =
        this.displaySymbolNodes[wheelIndex][0].position.y -
        this.displaySymbolNodes[wheelIndex][1].position.y;
    } else {
      this.symbolHeight = getHeight(this.displaySymbolNodes[wheelIndex][0]);
    }
    for (let j = 0; j < this.displaySymbolNodes[wheelIndex].length; j++) {
      const nodeMember = new DropSymbolNodeMember();
      const symbolNode = this.displaySymbolNodes[wheelIndex][j];
      const symbolPos = symbolNode.position;
      nodeMember.showSymbolNode = symbolNode;
      nodeMember.originalPosition = new Vec2(symbolPos.x, symbolPos.y);
      nodeMember.endPosition = new Vec2(symbolPos.x, symbolPos.y);
      symbolMembers.push(nodeMember);
    }
    this.singleDropSymbolMembers.changeValueForKey(wheelIndex, symbolMembers);
  }
  /**
   * 根據要消失的位置做symbol縮小的表演
   * @param dropDataInfo 消失的位置(每個bingo整理起來的資料)
   */
  private symbolBreath(dropDataInfo: number[][]): void {
    for (let i = 0; i < dropDataInfo.length; i++) {
      for (let j = 0; j < dropDataInfo[i].length; j++) {
        if (dropDataInfo[i][j] === 1) {
          const symbolNode = this.displaySymbolNodes[i][j];
          safeTween(symbolNode)
            .call(() => {
              setOpacity(symbolNode, 0);
            })
            .start();
        }
      }
    }
  }
  /**
   * 檢查symbol消失後 要移到哪個初始位置
   * @param dropVals 消失位置資訊
   */
  private setSingleDropSymbolPos(dropVals: number[][], i: number): void {
    const dropSymbolShiftPos: number[][] = [];
    for (let columnIndex = 0; columnIndex < dropVals.length; columnIndex++) {
      console.log('%cSetRowSymbolPos:' + columnIndex, 'color:#20A4F3');
      dropSymbolShiftPos.push(this.setRowSymbolPos(dropVals[columnIndex]));
    }
    //let symbolHeight = this.displaySymbolNodes[0][0].position.y - this.displaySymbolNodes[0][1].position.y;
    for (let j = 0; j < this.displaySymbolNodes[i].length; j++) {
      const x = this.displaySymbolNodes[i][j].position.x;
      const shift =
        dropSymbolShiftPos[i][j] > 0
          ? dropSymbolShiftPos[i][j] * this.symbolHeight
          : 0;
      const y = this.displaySymbolNodes[i][j].position.y + shift;
      this.displaySymbolNodes[i][j].position = new Vec3(x, y, 0);
    }
  }
  /**
   * 檢查symbol消失後 要移到哪個初始位置
   * @param dropVals 消失位置資訊
   */
  private setDropSymbolPos(dropVals: number[][]): void {
    const dropSymbolShiftPos: number[][] = [];
    for (let columnIndex = 0; columnIndex < dropVals.length; columnIndex++) {
      console.log('%cSetRowSymbolPos:' + columnIndex, 'color:#20A4F3');
      dropSymbolShiftPos.push(this.setRowSymbolPos(dropVals[columnIndex]));
    }
    //let symbolHeight = this.displaySymbolNodes[0][0].position.y - this.displaySymbolNodes[0][1].position.y;
    for (let i = 0; i < this.displaySymbolNodes.length; i++) {
      for (let j = 0; j < this.displaySymbolNodes[i].length; j++) {
        const x = this.displaySymbolNodes[i][j].position.x;
        const shift =
          dropSymbolShiftPos[i][j] > 0
            ? dropSymbolShiftPos[i][j] * this.symbolHeight
            : 0;
        const y = this.displaySymbolNodes[i][j].position.y + shift;
        this.displaySymbolNodes[i][j].position = new Vec3(x, y, 0);
      }
    }
  }
  /**
   * 將每欄的symbol設定到移動起點
   * @param columnVals 這一欄的資料
   * @returns 該位移的數量
   */
  private setRowSymbolPos(columnVals: number[]): number[] {
    switch (this.dropMode) {
      case DropMode.followUp:
        return this.setFollowUpRowSymbolPos(columnVals);
      case DropMode.takeEmptySpot:
        return this.setTakeEmptySpotRowSymbolPos(columnVals);
    }
  }
  private setFollowUpRowSymbolPos(columnVals: number[]): number[] {
    const temp: number[] = []; //實際的symbol移動的位置
    const shiftPos: number[] = []; //要移動到哪個index
    let clearCount = 0; //要在陣列後面補幾顆
    //先遍歷陣列,看要在後面補幾顆
    for (let i = 0; i < columnVals.length; i++) {
      if (columnVals[i] === 1) {
        //如果是消失格
        clearCount++;
        shiftPos.unshift(0 - clearCount);
      } else {
        shiftPos.push(i);
      }
    }
    //再計算需要位移幾格
    for (let i = 0; i < columnVals.length; i++) {
      temp.push(i - shiftPos[i]);
    }
    return temp;
  }
  private setTakeEmptySpotRowSymbolPos(columnVals: number[]): number[] {
    const temp: number[] = []; //實際的symbol移動的位置

    //先遍歷陣列,看要在後面補幾顆
    for (let i = 0; i < columnVals.length; i++) {
      if (columnVals[i] === 1) {
        //如果是消失格
        temp.push(columnVals.length);
      } else {
        temp.push(0);
      }
    }
    return temp;
  }

  /**
   * 將symbol移動到指定位置
   */
  private async symbolDroping(
    dropVal: number[][],
    prewin: boolean,
    finishCallBack: Function
  ) {
    console.log('%cSymbolDroping', 'color:#20A4F3');

    //做prewin的時候不會有Mask
    const maskAry: number[][] = [];
    for (let m = 0; m < this.displaySymbolNodes.length; m++) {
      maskAry.push([]);
      for (let n = 0; n < this.displaySymbolNodes[m].length; n++) {
        maskAry[m].push(1);
      }
    }

    for (let i = 0; i < this.displaySymbolNodes.length; i++) {
      const drop: number[][] = [];
      dropVal.forEach((wheel, wheelIndex) => {
        drop.push([]);
        if (wheelIndex === i) {
          wheel.forEach(symbol => {
            drop[wheelIndex].push(symbol);
          });
        } else {
          wheel.forEach(() => {
            drop[wheelIndex].push(0);
          });
        }
      });
      this.singleWheelDroping(i, prewin, drop, maskAry, finishCallBack);
      await waitForSeconds(
        SlotGDK.instance.fastSpin && this.isSG === false
          ? this.fastWheelGapTime
          : this.wheelGapTime
      ); //一輪與一輪之間的間隔時間
    }
  }

  private getSingleResultWheel(idx: number) {
    const res = [];
    this.wheelBlockController.wheelAry.forEach(wheel => {
      const temp = [];
      wheel.symbolAry.forEach(symbol => {
        temp.push(symbol.symbolInfo.symbolID);
      });
      res.push(temp);
    });
    res[idx] = MainGameDropData.instance.resultWheels[idx];
    return res;
  }

  public dropSingleWheel(
    dropVal: number[][],
    index: number,
    prewin: boolean,
    finishCallBack: Function
  ) {
    this.singleDropInit(index);
    this.setSingleDropSymbolPos(dropVal, index);
    const singleResultWheel = this.getSingleResultWheel(index);
    this.wheelBlockController.setWheelData(null, singleResultWheel);
    this.resetSymbolSingle(index);
    //做prewin的時候不會有Mask
    const maskAry: number[][] = [];
    for (let m = 0; m < this.displaySymbolNodes.length; m++) {
      maskAry.push([]);
      for (let n = 0; n < this.displaySymbolNodes[m].length; n++) {
        maskAry[m].push(1);
      }
    }
    const drop: number[][] = [];
    dropVal.forEach((wheel, wheelIndex) => {
      drop.push([]);
      if (wheelIndex === index) {
        wheel.forEach(symbol => {
          drop[wheelIndex].push(symbol);
        });
      } else {
        wheel.forEach(() => {
          drop[wheelIndex].push(0);
        });
      }
    });
    this.singleWheelDropingAsync(
      index,
      prewin,
      drop,
      maskAry,
      singleResultWheel,
      finishCallBack
    );
  }

  /** @internal — body 委派至 DropModuleDroping helper */
  private singleWheelDropingAsync(
    i: number,
    prewin: boolean,
    dropAry: number[][],
    maskAry: number[][],
    resultWheel: number[][],
    finishCallBack: Function
  ): Promise<void> {
    return singleWheelDropingAsyncImpl(
      this,
      i,
      prewin,
      dropAry,
      maskAry,
      resultWheel,
      finishCallBack
    );
  }

  /** @internal — body 委派至 DropModuleDroping helper */
  private singleWheelDroping(
    i: number,
    prewin: boolean,
    dropAry: number[][],
    maskAry: number[][],
    finishCallBack: Function
  ): Promise<void> {
    return singleWheelDropingImpl(
      this,
      i,
      prewin,
      dropAry,
      maskAry,
      finishCallBack
    );
  }

  /*-------------------------------------------------------------------------------------*/
  // Server JSON 解析委派至 DropModuleParse helper
  private getClearSymbol(comboData: JSON): number[][] {
    return getClearSymbolImpl(comboData);
  }

  private getBingoSymbol(comboData: JSON): number[][] {
    return getBingoSymbolImpl(comboData);
  }

  private getResultWheel(comboData: JSON): number[][] {
    return getResultWheelImpl(comboData);
  }
}
