import {_decorator, Component, CCInteger} from 'cc';
const {ccclass, property} = _decorator;

import {Symbol} from './Symbol';
import {SymbolSetting} from './SymbolSetting';
import {WheelBlockController} from './WheelBlockController';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {SymbolInfomation, SymbolPosInfo} from '../Define/SlotGameData';
import {SlotGDK} from '../Define/SlotGDK';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import Functions from '../../CommonModule/Script/Utility/Functions';

@ccclass('BigRectSymbolSetting')
class BigRectSymbolSetting {
  @property(CCInteger)
  public symbolID = 0;
  @property(CCInteger)
  public marginTop = 0;
  @property(CCInteger)
  public marginLeft = 0;
  @property(CCInteger)
  public marginRight = 0;
  @property(CCInteger)
  public marginBottom = 0;
}

class BigRectSymbolStatus {
  public symbolID = 0; // SymbolId 大於0代表有
  public needLength = 0; // 後面還需要的長度
  public symbolAry: Symbol[] = []; // 已經保留的特殊SybolEx
  public currentSymbolIndex = 0; // 目前檢查到的SymbolIndex
}

@ccclass('BigRectSymbolParser')
export class BigRectSymbolParser extends Component {
  @property([CCInteger])
  private randomSymbolAry: number[] = []; // 隨機要塞進去的Symbol
  private symbolSetting: SymbolSetting = null; // SymbolId的對應設定
  @property(WheelBlockController)
  private wheelBlockControllerEx: WheelBlockController = null; // 要處理的轉輪
  @property([BigRectSymbolSetting])
  private bigRectSymbolSettingList: BigRectSymbolSetting[] = [];
  private currentCheckBigRectSymbolStatusAry: BigRectSymbolStatus[] = []; // 正在Check的大Symbol狀態(以輪為單位生產數量，判斷目前這輪累積的大Symbol數量、Id...等資訊)
  private bigRectGroupInfo: SymbolPosInfo[][] = []; // 大Symbol群組的資料(會儲存該位置的Symbol中心點位置)
  public showBigRectSymbol: Delegate = new Delegate(); // 回傳被打開的Symbol位置

  public onLoad() {
    this.symbolSetting = SlotGameMediator.instance.symbolSetting;
    SlotGDK.instance.receiveSpinResultArgs.insert(this.init, this);
    this.wheelBlockControllerEx.eventFinished.insert(
      this.creatBigRectGroupInfo,
      this
    );
  }

  public onDestroy() {
    this.symbolSetting = null;
    if (SlotGDK.instance.receiveSpinResultArgs) {
      SlotGDK.instance.receiveSpinResultArgs.remove(this.init, this);
    }
    if (this.wheelBlockControllerEx.eventFinished)
      this.wheelBlockControllerEx.eventFinished.remove(
        this.creatBigRectGroupInfo,
        this
      );
    if (this.wheelBlockControllerEx.wheelAry) {
      for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
        if (this.wheelBlockControllerEx.wheelAry[i].eventSymbolChanged)
          this.wheelBlockControllerEx.wheelAry[i].eventSymbolChanged.remove(
            this.onSymbolChange,
            this
          );
      }
    }
  }

  private init(_args = null) {
    if (this.currentCheckBigRectSymbolStatusAry.length !== 0) return; // 有東西代表初始化過了
    // 初始化紀錄轉輪大Symbol狀態資料
    for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
      this.currentCheckBigRectSymbolStatusAry.push(new BigRectSymbolStatus());
    }
    // 初始化大Symbol群組的資料
    for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
      const symbolPosInfo: SymbolPosInfo[] = [];
      for (
        let j = 0;
        j < this.wheelBlockControllerEx.wheelAry[i].symbolAry.length;
        j++
      ) {
        symbolPosInfo.push(new SymbolPosInfo());
      }
      this.bigRectGroupInfo.push(symbolPosInfo);
    }
    // 註冊SymbolChange
    for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
      this.wheelBlockControllerEx.wheelAry[i].eventSymbolChanged.insert(
        this.onSymbolChange,
        this
      );
    }
    this.initCurrentWheelBlockSymbol();
  }

  /// <summary>
  /// 開出去給需要的人初始化盤面
  /// </summary>
  public initCurrentWheelBlockSymbol() {
    if (Define.DEBUG_LOG) {
      console.log('BigRectSymbolParser Init');
    }
    if (this.currentCheckBigRectSymbolStatusAry.length === 0) {
      this.init(null);
      return;
    }
    this.resetAllCheckStatus();
    // 抓所有輪子中最大的長度
    let maxSymbolCount = 0;
    for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
      maxSymbolCount = Math.max(
        maxSymbolCount,
        this.wheelBlockControllerEx.wheelAry[i].symbolAry.length
      );
    }
    // 從下至上，左至右 塞入判斷
    for (let i: number = maxSymbolCount; i >= 0; i--) {
      for (let j = 0; j < this.wheelBlockControllerEx.wheelAry.length; j++) {
        if (i >= this.wheelBlockControllerEx.wheelAry[j].symbolAry.length) {
          continue;
        }
        this.symbolChangeCheck(
          j,
          this.wheelBlockControllerEx.wheelAry[j].symbolAry[i],
          false
        );
      }
    }
  }

  /// <summary>
  /// 取得當前大Symbol群組的資料
  /// 對應轉輪牌面被隱藏的Symbol位置會帶SymbolPosInfo資訊指向有打開的那格大Symbol位置    *資料格式為二維陣列
  /// </summary>
  /// <returns>The big rect group data.</returns>
  public getBigRectGroupData(): SymbolPosInfo[][] {
    return this.bigRectGroupInfo;
  }

  /// <summary>
  /// 取得當前Symbol群組的資料
  /// 對應轉輪牌面被隱藏的Symbol位置會帶SymbolPosInfo資訊指向有打開的那格大Symbol位置
  /// </summary>
  /// <returns>The big rect group data.</returns>
  public getTargetBigRectGroupData(
    wheelIndex: number,
    symbolIndex: number
  ): SymbolPosInfo {
    return this.bigRectGroupInfo[wheelIndex][symbolIndex];
  }

  /// <summary>
  /// 製作BigRectGroupInfo資訊
  /// </summary>
  /// <param name="ctrlIndex">I ctrl index.</param>
  public creatBigRectGroupInfo(_ctrlIndex: number) {
    // 初始化
    if (this.bigRectGroupInfo.length === 0) return;
    for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
      for (
        let j = 0;
        j < this.wheelBlockControllerEx.wheelAry[i].symbolAry.length;
        j++
      ) {
        this.bigRectGroupInfo[i][j].reset();
      }
    }
    for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
      for (
        let j = 0;
        j < this.wheelBlockControllerEx.wheelAry[i].symbolAry.length;
        j++
      ) {
        const symbol: Symbol =
          this.wheelBlockControllerEx.wheelAry[i].symbolAry[j];
        // 找有被打開的大Symbol就是中心點
        if (symbol.getActive()) {
          const bigRectSymbolSetting: BigRectSymbolSetting =
            this.bigRectSymbolSettingList.find(
              searchBigRectSymbolSetting =>
                searchBigRectSymbolSetting.symbolID ===
                symbol.symbolInfo.symbolID
            ); // 找當前有沒有對應的ID
          if (bigRectSymbolSetting) {
            for (
              let k: number = -bigRectSymbolSetting.marginLeft;
              k <= bigRectSymbolSetting.marginRight;
              k++
            ) {
              for (
                let l: number = -bigRectSymbolSetting.marginTop;
                l <= bigRectSymbolSetting.marginBottom;
                l++
              ) {
                if (
                  !Functions.checkOutOfRange(
                    0,
                    this.wheelBlockControllerEx.wheelAry[i].symbolAry.length -
                      1,
                    l + j
                  )
                ) {
                  this.bigRectGroupInfo[k + i][l + j].wheelIndex = i;
                  this.bigRectGroupInfo[k + i][l + j].sortIndex = j;
                }
              }
            }
          } else {
            this.bigRectGroupInfo[i][j].wheelIndex = i;
            this.bigRectGroupInfo[i][j].sortIndex = j;
          }
        } else if (
          this.bigRectGroupInfo[i][j].wheelIndex === -1 &&
          this.bigRectGroupInfo[i][j].sortIndex === -1
        ) {
          this.bigRectGroupInfo[i][j].wheelIndex = i;
          this.bigRectGroupInfo[i][j].sortIndex = j;
        }
      }
    }
  }

  private onSymbolChange(wheelIndex: number, symbolAry: Symbol) {
    this.symbolChangeCheck(wheelIndex, symbolAry[0], true);
  }

  private symbolChangeCheck(wheelIndex: number, symbol: Symbol, isRotate) {
    const currentWheelBigRectSymbolStatus: BigRectSymbolStatus =
      this.currentCheckBigRectSymbolStatusAry[wheelIndex];
    // 判斷有沒有正在Check的Symbol
    if (currentWheelBigRectSymbolStatus.symbolID > 0) {
      if (isRotate) {
        currentWheelBigRectSymbolStatus.currentSymbolIndex++;
        currentWheelBigRectSymbolStatus.symbolAry.unshift(
          this.wheelBlockControllerEx.wheelAry[wheelIndex].symbolAry[
            currentWheelBigRectSymbolStatus.currentSymbolIndex
          ]
        );
        currentWheelBigRectSymbolStatus.symbolAry.pop();
      }
      // 如果有正在Check的話看是不是一樣的
      if (
        currentWheelBigRectSymbolStatus.symbolID === symbol.symbolInfo.symbolID
      ) {
        // 加入正在Check的陣列並Hide掉
        currentWheelBigRectSymbolStatus.needLength--;
        // currentWheelBigRectSymbolStatus.currentSymbolIndex++;
        currentWheelBigRectSymbolStatus.symbolAry.push(symbol);
        symbol.hide();
        // 有可能湊成大矩形了檢查一下
        if (this.checkSymbolMergerBigSymbolRect(wheelIndex)) {
          // 找中心點顯示&重置組合成大Symbol範圍內的CheckState
          this.showCenterPointBigRectSymbol(
            currentWheelBigRectSymbolStatus.symbolID
          );
        }
      } else {
        // 目前存的Symbol全部打成隨機Symbol
        this.randomChangeToCurrentCheckSymbol(wheelIndex);
        // 重置要Check的Array
        this.resetCurrentCheckStatus(wheelIndex);
        // 判斷是不是大Symbol ，是的話塞進當前要判斷的BigSymbol資料內
        this.checkToAddBigRectSymbolSetting(
          currentWheelBigRectSymbolStatus,
          symbol
        );
      }
    } else {
      // 判斷是不是大Symbol ，是的話塞進當前要判斷的BigSymbol資料內
      this.checkToAddBigRectSymbolSetting(
        currentWheelBigRectSymbolStatus,
        symbol
      );
    }
  }

  private resetCurrentCheckStatus(wheelIndex: number) {
    this.currentCheckBigRectSymbolStatusAry[wheelIndex].needLength = 0;
    this.currentCheckBigRectSymbolStatusAry[wheelIndex].symbolID = 0;
    this.currentCheckBigRectSymbolStatusAry[wheelIndex].symbolAry = [];
  }

  private resetAllCheckStatus() {
    for (let i = 0; i < this.currentCheckBigRectSymbolStatusAry.length; i++) {
      this.currentCheckBigRectSymbolStatusAry[i].needLength = 0;
      this.currentCheckBigRectSymbolStatusAry[i].symbolID = 0;
      this.currentCheckBigRectSymbolStatusAry[i].symbolAry = [];
    }
  }

  private checkToAddBigRectSymbolSetting(
    currentWheelBigRectSymbolStatus: BigRectSymbolStatus,
    symbol: Symbol
  ) {
    const bigRectSymbolSetting: BigRectSymbolSetting =
      this.bigRectSymbolSettingList.find(
        searchBigRectSymbolSetting =>
          searchBigRectSymbolSetting.symbolID === symbol.symbolInfo.symbolID
      ); // 找當前有沒有對應的ID
    if (bigRectSymbolSetting) {
      currentWheelBigRectSymbolStatus.symbolID = symbol.symbolInfo.symbolID;
      currentWheelBigRectSymbolStatus.needLength =
        bigRectSymbolSetting.marginTop + bigRectSymbolSetting.marginBottom; // 沒有特別+1，因為目前轉到的這顆要累積扣掉
      currentWheelBigRectSymbolStatus.symbolAry.unshift(symbol);
      currentWheelBigRectSymbolStatus.currentSymbolIndex = symbol.symbolIndex;
      symbol.hide();
    } else {
      // 有可能原本是關掉的要打開
      symbol.show();
    }
  }

  private checkSymbolMergerBigSymbolRect(wheelIndex: number): boolean {
    if (this.currentCheckBigRectSymbolStatusAry[wheelIndex].needLength !== 0) {
      return false;
    }
    return true;
  }

  //找出中心點顯示大Symbol (有湊大Symbol條件的的輪才會進入此function)
  private showCenterPointBigRectSymbol(symbolId: number) {
    const wheelLength: number = this.currentCheckBigRectSymbolStatusAry.length;

    const bigRectSymbolSetting: BigRectSymbolSetting =
      this.bigRectSymbolSettingList.find(
        searchBigRectSymbolSetting =>
          searchBigRectSymbolSetting.symbolID === symbolId
      ); //找當前有沒有對應的ID

    let bigRectSymbolStatus: BigRectSymbolStatus = null;

    //從最左邊的輪開始跑
    for (let i = 0; i < wheelLength; i++) {
      bigRectSymbolStatus = this.currentCheckBigRectSymbolStatusAry[i];

      //判斷目前這輪是不是要判斷的Id
      if (bigRectSymbolStatus.symbolID === symbolId) {
        //判斷左右有沒有超出索引直
        if (
          !Functions.checkOutOfRange(
            0,
            wheelLength,
            i - bigRectSymbolSetting.marginLeft
          ) &&
          !Functions.checkOutOfRange(
            0,
            wheelLength,
            i + bigRectSymbolSetting.marginRight
          )
        ) {
          //判斷左右輪是不是要判斷的Id，是的話就抓到中間的輪了
          if (
            this.currentCheckBigRectSymbolStatusAry[
              i - bigRectSymbolSetting.marginLeft
            ].symbolID === symbolId &&
            this.currentCheckBigRectSymbolStatusAry[
              i + bigRectSymbolSetting.marginRight
            ].symbolID === symbolId
          ) {
            let isMergerBigRectSymbol = true;

            //抓到中間輪後，右半邊的輪也判斷一下有沒有都符合收集到的條件
            for (let j = 1; j <= bigRectSymbolSetting.marginRight; j++) {
              //只要有一個沒有收集滿就不要顯示大Symbol了
              if (!this.checkSymbolMergerBigSymbolRect(i + j)) {
                isMergerBigRectSymbol = false;
              }
            }

            if (isMergerBigRectSymbol) {
              //抓大Symbol中心點
              for (let j = 0; j < bigRectSymbolStatus.symbolAry.length; j++) {
                //判斷上下有沒有超出索引直 都符合的就是中心點
                if (
                  !Functions.checkOutOfRange(
                    0,
                    bigRectSymbolStatus.symbolAry.length,
                    j + bigRectSymbolSetting.marginTop
                  ) &&
                  !Functions.checkOutOfRange(
                    0,
                    bigRectSymbolStatus.symbolAry.length,
                    j - bigRectSymbolSetting.marginBottom
                  )
                ) {
                  //Show出中間的那個Symbol
                  bigRectSymbolStatus.symbolAry[j].show();

                  if (this.showBigRectSymbol) {
                    this.showBigRectSymbol.notify(
                      bigRectSymbolStatus.symbolAry[j]
                    );
                  }

                  //重置被組合成大Symbol範圍內的CheckState(有可能左右設定2，但中間的1也要設定，所以寫成迴圈)
                  this.resetCurrentCheckStatus(i);

                  for (let k = 1; k <= bigRectSymbolSetting.marginLeft; k++) {
                    this.resetCurrentCheckStatus(i - k);
                  }
                  for (let k = 1; k <= bigRectSymbolSetting.marginRight; k++) {
                    this.resetCurrentCheckStatus(i + k);
                  }

                  return;
                }
              }
            }
          }
        }
      }
    }
  }

  private randomChangeToCurrentCheckSymbol(iWheelIndex: number) {
    if (this.randomSymbolAry.length > 0) {
      // 完全打亂
      let symbolInfo: SymbolInfomation = null;
      for (
        let j = 0;
        j <
        this.currentCheckBigRectSymbolStatusAry[iWheelIndex].symbolAry.length;
        j++
      ) {
        symbolInfo = this.symbolSetting.createSymbolInfo(
          this.randomSymbolAry[
            Math.floor(Math.random() * Math.floor(this.randomSymbolAry.length))
          ]
        );
        const symbol: Symbol =
          this.currentCheckBigRectSymbolStatusAry[iWheelIndex].symbolAry[j];
        symbol.changeSymbol(symbolInfo);
        symbol.show();
      }
    }
  }
}
