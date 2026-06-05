import {_decorator, Component, Layout, Prefab, instantiate, CCString} from 'cc';
import {PlatformData} from '../../../CommonModule/Script/Define/PlatformData';
import Functions from '../../../CommonModule/Script/Utility/Functions';
import {BingoArgs, SlotGameDataEx} from '../../Define/SlotGameData';
import {SlotGDK} from '../../Define/SlotGDK';
import {SymbolSetting} from '../../Wheel/SymbolSetting';
import OddsLabel from './OddsLabel';
import OddsTableItem from './OddsTableItem';

const {ccclass, property} = _decorator;

@ccclass
export class OddsTableController extends Component {
  @property(SymbolSetting)
  private symbolSetting: SymbolSetting = null;
  @property([Layout])
  private rows: Layout[] = [];
  @property(Prefab)
  private oddsItemPrefab: Prefab = null;
  @property(Prefab)
  private oddsLabelPrefab: Prefab = null;
  @property([CCString])
  private inputSymbolSeq: string[] = [];

  private symbolSeq = [];
  private valOddsBase: number[][];
  public oddsTableItems: OddsTableItem[] = [];

  async parseInputSymbol() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.inputSymbolSeq.forEach(str => {
          const arr = str.split(',');
          const nums = [];
          arr.forEach(numStr => {
            nums.push(parseInt(numStr));
          });
          this.symbolSeq.push(nums);
          resolve();
        });
      } catch {
        reject();
        console.error('OddsTableController:inputSymbolSeq parse failed');
      }
    });
  }

  async onLoad() {
    await this.parseInputSymbol();
    this.initOddsTable();
    SlotGDK.instance.eventOnBingoAnimationStopped.insert(
      this.resetAllOddsItemsAnime,
      this
    );
    SlotGDK.instance.eventShowAllBingoFrameData.insert(
      this.allSymbolBingoOddsAnim,
      this
    );
    SlotGDK.instance.eventShowLineBingoFrameData.insert(
      this.lineSymbolBingoOddsAnim,
      this
    );
    SlotGDK.instance.eventSpecialGameStarted.insert(
      this.resetAllOddsItemsAnime,
      this
    );
    SlotGDK.instance.eventClearBingoData.insert(
      this.resetAllOddsItemsAnime,
      this
    );
    SlotGDK.instance.eventSetStartGameData.insert(
      this.receiveStartGameData,
      this
    );
    SlotGDK.instance.eventUpdateOddsTabel.insert(this.setOddsValues, this);
  }
  onDestroy() {
    SlotGDK.instance.eventOnBingoAnimationStopped.remove(
      this.resetAllOddsItemsAnime,
      this
    );
    SlotGDK.instance.eventShowAllBingoFrameData.remove(
      this.allSymbolBingoOddsAnim,
      this
    );
    SlotGDK.instance.eventShowLineBingoFrameData.remove(
      this.lineSymbolBingoOddsAnim,
      this
    );
    SlotGDK.instance.eventSpecialGameStarted.remove(
      this.resetAllOddsItemsAnime,
      this
    );
    SlotGDK.instance.eventClearBingoData.remove(
      this.resetAllOddsItemsAnime,
      this
    );
    SlotGDK.instance.eventSetStartGameData.remove(
      this.receiveStartGameData,
      this
    );
    SlotGDK.instance.eventUpdateOddsTabel.remove(this.setOddsValues, this);
  }

  private initOddsTable() {
    this.symbolSeq.forEach((row, index) => {
      row.forEach(id => {
        const oddsItem = instantiate(this.oddsItemPrefab);
        const controller = oddsItem.getComponent(OddsTableItem);
        controller.symbolSprite.spriteFrame =
          this.symbolSetting.getSpriteFramebyId(id);
        controller.symbolID = id;
        for (let i = 0; i < 3; i++) {
          const oddsLabel = instantiate(this.oddsLabelPrefab);
          const oddsLabelCtrl = oddsLabel.getComponent(OddsLabel);
          oddsLabel.setParent(controller.oddsLabelLayout);
          controller.oddsLabels.push(oddsLabelCtrl);
        }
        oddsItem.setParent(this.rows[index].node);
        this.oddsTableItems.push(controller);
      });
    });
  }

  // 初始設定odds 資料
  receiveStartGameData() {
    const jsonData = SlotGameDataEx.instance.startGameData;
    if (jsonData === undefined) return;
    if (jsonData.hasOwnProperty('odds')) {
      this.valOddsBase = jsonData['odds'];
    }
    console.log(
      'OddsTableController - ODDSDATA:',
      this.valOddsBase,
      PlatformData.instance.originalLineBet
    );
    this.setOddsValues();
  }

  //改變odds的值
  public setOddsValues() {
    const oddsBet = PlatformData.instance.originalLineBet;
    console.log('OddsTableController - SETODDS');
    try {
      const oddsBetOffset = 2; // 封包給的是 5個item的 odds array 所以需要offset
      if (this.valOddsBase) {
        for (const symbolId in this.valOddsBase) {
          // search odds item by symbol id
          const oddsItem: OddsTableItem = this.oddsTableItems.find(
            searchOddsItem => searchOddsItem.symbolID.toString() === symbolId
          );
          if (oddsItem)
            for (let i = 0; i < oddsItem.oddsLabels.length; i++) {
              // need to multiply by the bet and odds base
              const oddsLength = this.valOddsBase[symbolId].length;
              // oddsItem.oddsLabels[i].setLabelValue(this.valOddsBase[symbolId][oddsLength - i - oddsBetOffset + 1] * oddsBet);
              oddsItem.oddsLabels[i].setLabelValue(
                Functions.getValueByRatio(
                  this.valOddsBase[symbolId][
                    oddsLength - i - oddsBetOffset + 1
                  ] * oddsBet,
                  PlatformData.currencyRatio
                )
              );
            }
        }
      }
    } catch (err) {
      console.error('OddsTableController:', err);
    }
  }

  //單線報獎symbol的動畫
  public lineSymbolBingoOddsAnim(
    lineId,
    symbolId,
    symbolCount,
    _multiplier,
    _win
  ) {
    this.resetAllOddsItemsAnime();
    this.setAllMasks(true);
    const oddsItem: OddsTableItem = this.oddsTableItems.find(
      searchOddsItem => searchOddsItem.symbolID.toString() === symbolId
    );
    if (oddsItem && symbolCount >= 3) {
      oddsItem.playSymbolBingoAnimation();
      oddsItem.setMask(false);
      // play the label animation
      const label = oddsItem.oddsLabels[5 - symbolCount];
      label.setMask(false);
      label.playOddsLabelBingoAnime();
    } else {
      console.error('SymbolCount less than 3');
    }
  }

  private setAllMasks(active: boolean) {
    this.oddsTableItems.forEach(item => {
      item.setMask(active);
      item.oddsLabels.forEach(label => {
        label.setMask(active);
      });
    });
  }

  public allSymbolBingoOddsAnim(winnings: number, bingoArgs: BingoArgs[]) {
    this.resetAllOddsItemsAnime();
    this.setAllMasks(true);
    try {
      if (bingoArgs === undefined) {
        throw 'bingoArgs is undefined';
      }
      bingoArgs.map(bingoArg => {
        const {symbolCount, symbolId} = bingoArg;
        // search odds item by symbol id
        const oddsItem: OddsTableItem = this.oddsTableItems.find(
          searchOddsItem => searchOddsItem.symbolID === symbolId
        );
        if (oddsItem) {
          oddsItem.playSymbolBingoAnimation();
          oddsItem.setMask(false);

          // play the label animation
          oddsItem.oddsLabels[5 - symbolCount].playOddsLabelBingoAnime();
          oddsItem.oddsLabels[5 - symbolCount].setMask(false);
        }
      });
    } catch (err) {
      console.error('OddsTableController-ODDS:', bingoArgs, err);
    }
  }

  // reset all odds item animation
  public resetAllOddsItemsAnime() {
    this.oddsTableItems.forEach(item => {
      // stop symbol animation
      item.stopSymbolBingoAnimation();

      // stop label animation
      item.oddsLabels.forEach(label => {
        label.stopOddsLabelBingoAnime();
      });
    });
    this.setAllMasks(false);
  }
}
