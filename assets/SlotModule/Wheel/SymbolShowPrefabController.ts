/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  _decorator,
  Component,
  Node,
  Sprite,
  CCFloat,
  CCBoolean,
  Animation,
  Color,
  sp,
  Vec2,
  Vec3,
  tween,
} from 'cc';
const {ccclass, property} = _decorator;

import {WheelBlockController} from './WheelBlockController';
import {Symbol} from './Symbol';
import {ReplaceSymbolData, SymbolShowPrefabRule} from './SymbolShowPrefabRule';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import DropModule from './DropModule';
import HostSetting from '../Define/HostSetting';
import {SlotGDK} from '../Define/SlotGDK';
import {
  getAnimationTime,
  getSpineTime,
  isLastScatter,
  playAnimation,
} from './SymbolShowPrefabFunctions';
import {
  SymbolShowInfo,
  SymbolShowSetting,
  AnimationData,
  SpineData,
} from './SymbolShowPrefabDefine';
import {Dictionary} from '../../CommonModule/Script/Utility/Dictionary';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {SymbolType} from '../Define/SlotGameData';
import {
  setPosition,
  setScale,
  getWorldSpaceAR,
  getNodeSpaceAR,
  setOpacity,
  setColor,
  getSprite,
} from '../../CommonModule/Script/Utility/NodeProperty';
import NodeEx from '../../CommonModule/Script/Utility/NodeEx';
import {DebugLogSetting} from '../Define/DebugLogSetting';

/*
 * 對應WheelBlockEx客製化的Symbol表演工具
 * byYC
 */
@ccclass('SymbolShowPrefabController')
export class SymbolShowPrefabController extends Component {
  protected emptyUISpriteTform: Node | null = null; //空的Sprite物件
  protected stopWheelPlayAudioKey: string[] = []; //停輪要播放的音效(為了解決急停時所有輪同時停，一起播音效爆音的問題)
  protected symbolStopLoopPlayAudioKeyMap: Dictionary<number, number> = null; //停輪Loop要播放的音效(為了解決一起播音效爆音的問題)   Dictionary<SymbolID,AudioID>
  protected symbolShowInfoAry: SymbolShowInfo[][] = null; //Symbol表演相關資訊(包含看不見的Symbol位置)
  protected ruleBroke = false; //規則已破壞

  @property(CCFloat)
  protected stopAnimationDelay = 0.5;
  @property(CCBoolean)
  protected syncStopLoop = false; //是否要同步 loop動畫
  @property(Node)
  protected offClippingSymbolTform: Node = null; //不要被切邊的Symbol要產生的父物件
  @property(Node)
  protected symbolUpperLayer: Node = null; //讓中獎圖片往上移一層的物件
  @property(Node)
  protected animaPrefabTform: Node = null; //動畫Prefab產生的父物件
  @property(Node)
  protected symbolShinyTform: Node = null; //閃白張的父物件
  @property(SpawnPool)
  protected symbolShowSpawnPool: SpawnPool = null; //管理AnimaPrefab的Pool
  @property(SymbolShowPrefabRule)
  protected symbolShowPrefabRule: SymbolShowPrefabRule = null; //兌獎的規則
  @property(WheelBlockController)
  protected wheelBlockControllerEx: WheelBlockController = null;
  @property([SymbolShowSetting])
  public symbolShowSettingList: SymbolShowSetting[] = [];
  protected startPrewinWheelIndex = -1; //預中的第一個輪
  @property(DropModule)
  protected dropModule: DropModule = null;
  protected despawnBingoCalled = false;

  onLoad(): void {
    this.symbolStopLoopPlayAudioKeyMap = new Dictionary<number, number>();
    this.symbolStopLoopMap = new Dictionary<
      number,
      Dictionary<string, AnimationData>
    >();
    this.symbolStopLoopMapSpine = new Dictionary<
      number,
      Dictionary<string, SpineData>
    >();
    SlotGDK.instance.receiveStartGame.insert(this.init, this);
    SlotGDK.instance.eventClickChangeBet.insert(this.onChangeBet, this);

    this.wheelBlockControllerEx.eventPrepareSpin.insert(
      this.onPrepareSpin,
      this
    );
    this.wheelBlockControllerEx.eventSingleWheelStopped.insert(
      this.spawnWheelStopAnimaPrefab,
      this
    );
    this.wheelBlockControllerEx.eventShowBingo.insert(
      this.spawnBingoAnimaPrefab,
      this
    );
    this.wheelBlockControllerEx.eventStopBingo.insert(
      this.deSpawnBingoAnimaPrefab,
      this
    );
    this.wheelBlockControllerEx.eventAllStopped.insert(
      this.allWheelStopped,
      this
    );
    this.wheelBlockControllerEx.eventGetSpinRequest.insert(
      this.getSpinRequest,
      this
    );
    this.symbolShowPrefabRule.ruleBreak.insert(this.ruleBreak, this);
    if (this.dropModule) {
      this.dropModule.eventStartClear.insert(this.onPrepareSpin, this);
    }
    if (HostSetting.instance.bingo.useWheelMask) {
      if (this.symbolUpperLayer === null) {
        if (DebugLogSetting.symbolShowPrefabController) {
          console.error(
            'SymbolShowPrefabController: this.m_symbolUpperLayer is null.'
          );
        }
      }
      // if (this.m_wheelMaskController == null)
      //     console.error("SymbolShowPrefabController: this.m_wheelMaskController is null.");
    }
    const nodeList: Node[] = [];
    this.symbolShowSettingList.sort((a, b) => {
      return a.sortIndex - b.sortIndex;
    });
    this.symbolShowSettingList.forEach(setting => {
      const node: Node = new Node();
      node.name = nodeList.length.toString();
      nodeList.push(node);
      setting.animaLayer = node;
    });
    while (nodeList.length > 0) {
      const node: Node = nodeList.shift();
      node.parent = this.animaPrefabTform;
    }
    this.symbolShowSettingList.forEach(setting => {
      if (setting.offClipping) {
        const node: Node = new Node();
        node.name = nodeList.length.toString();
        nodeList.push(node);
        setting.offClippingLayer = node;
      }
    });
    while (nodeList.length > 0) {
      const node: Node = nodeList.shift();
      node.parent = this.offClippingSymbolTform;
    }
  }

  public onDestroy(): void {
    this.symbolShowInfoAry = null;
    SlotGDK.instance.receiveStartGame.remove(this.init, this);
    SlotGDK.instance.eventClickChangeBet.remove(this.onChangeBet, this);
    if (this.wheelBlockControllerEx) {
      const {
        eventPrepareSpin,
        eventSingleWheelStopped,
        eventShowBingo,
        eventStopBingo,
        eventAllStopped,
        eventGetSpinRequest,
      } = this.wheelBlockControllerEx;
      if (eventPrepareSpin) eventPrepareSpin.remove(this.onPrepareSpin, this);
      if (eventSingleWheelStopped)
        eventSingleWheelStopped.remove(this.spawnWheelStopAnimaPrefab, this);
      if (eventShowBingo)
        eventShowBingo.remove(this.spawnBingoAnimaPrefab, this);
      if (eventStopBingo)
        eventStopBingo.remove(this.deSpawnBingoAnimaPrefab, this);
      if (eventAllStopped) eventAllStopped.remove(this.allWheelStopped, this);
      if (eventGetSpinRequest)
        eventGetSpinRequest.remove(this.getSpinRequest, this);
    }
    if (this.symbolShowPrefabRule && this.symbolShowPrefabRule.ruleBreak) {
      this.symbolShowPrefabRule.ruleBreak.remove(this.ruleBreak, this);
    }
    if (this.dropModule) {
      this.dropModule.eventStartClear.remove(this.onPrepareSpin, this);
    }
    this.deInitialFinish();
  }

  //初始化
  public init(): void {
    if (DebugLogSetting.symbolShowPrefabController && Define.DEBUG_LOG) {
      console.log('symbolshowprefabcontrollerex Init');
    }
    this.symbolShowInfoAry = [];
    // 先用push初始化 m_symbolShowInfoAry
    for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
      const item: SymbolShowInfo[] = [];
      for (
        let j = 0;
        j < this.wheelBlockControllerEx.wheelAry[i].symbolAmount;
        j++
      ) {
        item.push(new SymbolShowInfo());
      }
      this.symbolShowInfoAry.push(item);
    }
    //生出一個空的SpritePrefab
    if (this.emptyUISpriteTform === null) {
      this.emptyUISpriteTform = new Node();
      this.emptyUISpriteTform.parent = this.node;
      setPosition(this.emptyUISpriteTform, Vec2.ZERO);
      setScale(this.emptyUISpriteTform, Vec2.ONE);
      this.emptyUISpriteTform.addComponent(Sprite);
      this.emptyUISpriteTform.name = 'OffClippingPrefab';
    }
    this.setCurrentResultInfo();
    this.initialFinish();
  }

  // onChangeBet
  public onChangeBet() {
    if (!this.symbolShowInfoAry || this.symbolShowInfoAry.length === 0) return;

    this.clearAllPrefab();
    SlotGameMediator.instance.awardController.reset();
  }

  //準備Spin
  protected onPrepareSpin(): void {
    if (HostSetting.instance.bingo.useBingoFrame)
      this.startPrewinWheelIndex = -1;
    this.symbolShowPrefabRule.reset();
    this.symbolStopLoopMap = new Dictionary<
      number,
      Dictionary<string, AnimationData>
    >();
    this.symbolStopLoopMapSpine = new Dictionary<
      number,
      Dictionary<string, SpineData>
    >();
    this.clearAllPrefab();
    this.onPrepareSpinFinish();
    this.despawnBingoCalled = false;
    this.ruleBroke = false;
  }

  protected getSpinRequest() {
    if (!HostSetting.instance.bingo.useBingoFrame) {
      return;
    }
    if (
      this.wheelBlockControllerEx.prewinAry &&
      this.wheelBlockControllerEx.prewinAry.length > 0
    )
      this.startPrewinWheelIndex =
        this.wheelBlockControllerEx.prewinAry.indexOf(1);
  }

  //    //閃白張
  protected showShinySymbol(
    _symbolShowSetting: SymbolShowSetting,
    _symbolEx: Symbol
  ) {
    const _shinyPrefabTform: Node = this.createPrefab(
      _symbolShowSetting.symbolShinyPrefabTform.data,
      this.symbolShinyTform,
      getWorldSpaceAR(_symbolEx.node),
      Vec2.ONE
    );
    const _shinyPrefabTformEx: NodeEx = new NodeEx(_shinyPrefabTform);
    //Alpha 0.3秒從1Tween到0自動Despawn
    if (_shinyPrefabTform) {
      setOpacity(_shinyPrefabTform, 255);
      tween(_shinyPrefabTformEx)
        .to(0.6, {opacity: 0}) // Fade out over 0.6 seconds
        .call(() => {
          if (this.symbolShowSpawnPool.isSpawned(_shinyPrefabTform))
            this.symbolShowSpawnPool.despawn(_shinyPrefabTform);
        })
        .start(); // Start the tween
    } else {
      if (this.symbolShowSpawnPool.isSpawned(_shinyPrefabTform))
        this.symbolShowSpawnPool.despawn(_shinyPrefabTform);
    }
  }

  //播放停輪音效
  protected playSymbolStopAudio(
    symbolShowSetting: SymbolShowSetting,
    replaceData: ReplaceSymbolData = null
  ) {
    const {audioKey} = symbolShowSetting.wheelStopAnimaPrefabArgs;
    if (replaceData) {
      const {_isPlayReplaceSymbolAudio, _replaceSymbolId} = replaceData;
      //看要不要播放取代Symbol停輪音效
      if (_isPlayReplaceSymbolAudio) {
        const replaceSymbolShowSetting: SymbolShowSetting =
          this.symbolShowSettingList.find(
            searchSymbolShowSetting =>
              searchSymbolShowSetting.symbolID === _replaceSymbolId
          );
        if (replaceSymbolShowSetting.wheelStopAnimaPrefabArgs.audioKey !== '') {
          this.addStopWheelTempAudio(
            replaceSymbolShowSetting.wheelStopAnimaPrefabArgs.audioKey
          );
          return;
        }
      }
    }
    //撥放音效
    if (audioKey !== '' && audioKey !== undefined) {
      this.addStopWheelTempAudio(audioKey);
    }
  }

  //單輪停止
  protected spawnWheelStopAnimaPrefab(
    wheelCtrlIndex: number,
    wheelIndex: number,
    sortedSymbolAry: Symbol[]
  ): void {
    const count: number =
      this.wheelBlockControllerEx.wheelAry[wheelIndex].visibleSymbolAmount +
      this.wheelBlockControllerEx.wheelAry[wheelIndex].outOfTopSymbolAmount;
    //先做出結果盤面的資料給rule
    const symbolIdList: number[] = [];
    for (
      let i: number =
        this.wheelBlockControllerEx.wheelAry[wheelIndex].outOfTopSymbolAmount;
      i < count;
      i++
    ) {
      symbolIdList.push(sortedSymbolAry[i].symbolInfo.symbolID);
    }
    this.symbolShowPrefabRule.setSingleWheelData(wheelIndex, symbolIdList);
    //只跑顯示在畫面上的Symbol
    for (
      let i: number =
        this.wheelBlockControllerEx.wheelAry[wheelIndex].outOfTopSymbolAmount;
      i < count;
      i++
    ) {
      const symbolEx: Symbol = sortedSymbolAry[i];
      if (!symbolEx.node.active) continue;
      // Hook:子類想在每顆 symbol 停下時做 feature-value 疊加 / 自訂 UI
      // (例如顯示 mystery_value、symbol 套色)時 override 此 hook,
      // 不必整支 spawnWheelStopAnimaPrefab override。
      this.onSymbolStopAnimSpawned(wheelIndex, i, symbolEx);
      const symbolShowSetting: SymbolShowSetting =
        this.symbolShowSettingList.find(
          searchSymbolShowSetting =>
            searchSymbolShowSetting.symbolID === symbolEx.symbolInfo.symbolID
        );
      if (HostSetting.instance.bingo.useWheelMask)
        this.symbolShowInfoAry[wheelIndex][i].symbolEx = symbolEx;
      if (symbolShowSetting) {
        const {
          offClipping,
          symbolID,
          symbolShinyPrefabTform,
          wheelStopAnimaPrefabArgs,
          symbolStopLoopAnimaPrefabArgs,
        } = symbolShowSetting;
        //有設定的話就塞進去
        if (HostSetting.instance.bingo.useBingoFrame)
          this.symbolShowInfoAry[wheelIndex][i].symbolEx = symbolEx;
        //判斷要不要顯示去除Clipping的圖片
        if (offClipping) {
          this.createOffClippingTform(
            symbolEx,
            symbolShowSetting.offClippingLayer,
            wheelIndex,
            i
          );
        }
        //不撥放動畫就直接跳下一個
        if (
          !this.symbolShowPrefabRule.checkSymbolShow(
            wheelIndex,
            symbolEx.symbolInfo.symbolID
          )
        )
          continue;
        //判斷是不是被取代的Symbol
        const replaceData: ReplaceSymbolData =
          this.symbolShowPrefabRule.getReplaceSymbolData(symbolID);

        const enterSG =
          SlotGameMediator.instance.mainGameHost.isReadyToEnterSG();

        //閃白張 (急停&沒有Prewin&沒有閃白張的圖片)
        if (
          (symbolShinyPrefabTform &&
            this.wheelBlockControllerEx.isDoQuickStop &&
            !this.wheelBlockControllerEx.isPrewin &&
            !enterSG) ||
          (symbolShinyPrefabTform &&
            wheelStopAnimaPrefabArgs.animaPrefabTform === null)
        ) {
          this.showShinySymbol(symbolShowSetting, symbolEx);
          //播放停輪symbol音效
          this.playSymbolStopAudio(symbolShowSetting, replaceData);
        }
        //播放停輪動畫
        else {
          const playStopLoopAnimation = async () => {
            if (this.ruleBroke) return;
            //若有StopLoop就撥
            const enterSG =
              SlotGameMediator.instance.mainGameHost.isReadyToEnterSG();
            let _isLastScatter = false;
            const {symbolID, type} = symbolEx.symbolInfo;
            const isScatter = type === SymbolType.Scatter;
            //是scatter symbol才進行此判斷
            if (isScatter) {
              const id: number[] = [symbolID];
              const replaceData =
                this.symbolShowPrefabRule.replaceSymbolIdList.find(
                  x => x.searchSymbolId === symbolID
                );
              let rule = this.symbolShowPrefabRule.specialSymbolRuleList.find(
                specialSymbolRule => specialSymbolRule.symbolId === symbolID
              );
              if (replaceData) {
                rule = this.symbolShowPrefabRule.specialSymbolRuleList.find(
                  specialSymbolRule =>
                    specialSymbolRule.symbolId === replaceData.replaceSymbolId
                );
                id.push(replaceData.replaceSymbolId);
              }
              //找對應symbol id的rule

              if (rule) {
                const {needAmount} = rule;
                _isLastScatter = isLastScatter(
                  this.wheelBlockControllerEx,
                  wheelIndex,
                  i,
                  needAmount,
                  symbolID,
                  id
                );
              }
            }
            if (symbolStopLoopAnimaPrefabArgs.animaPrefabTform) {
              if (
                this.symbolShowInfoAry[wheelIndex][i].wheelStopAnimaPrefabTform
              ) {
                //若despawnBingo未觸發，則播stoploop
                //若有Stop動畫則等待一下再撥StopLoop
                await waitForSeconds(this.stopAnimationDelay);
                if (!enterSG || (enterSG && !_isLastScatter)) {
                  //隱藏Stop動畫並不顯示底圖
                  this.hideStopAnimaPrefab(wheelIndex, i, false);
                  if (!this.ruleBroke)
                    this.spawnSymbolStopLoopAnimaPrefab(
                      wheelIndex,
                      i,
                      symbolEx
                    );
                } else {
                  //隱藏動畫並顯示底圖
                  this.hideAllAnima();
                  if (_isLastScatter)
                    if (
                      SlotGDK.instance.eventOnLastScatterStopCompleted.length
                    ) {
                      SlotGDK.instance.eventOnLastScatterStopCompleted.notify();
                    }
                }
              }
            }
            //若無StopLoop則隱藏animation並顯示底圖
            else if (wheelStopAnimaPrefabArgs.animaPrefabTform) {
              if (_isLastScatter) {
                if (SlotGDK.instance.eventOnLastScatterStopCompleted.length) {
                  SlotGDK.instance.eventOnLastScatterStopCompleted.notify();
                }
              }
              this.hideStopAnimaPrefab(wheelIndex, i, true);
            }
          };
          const {animaPrefabTform, isSpine, animationName, isLoop} =
            wheelStopAnimaPrefabArgs;
          if (animaPrefabTform) {
            const _animaPrefabTform: Node = this.createPrefab(
              animaPrefabTform.data,
              symbolShowSetting.animaLayer,
              getWorldSpaceAR(symbolEx.node, Vec2.ZERO),
              Vec2.ONE
            );
            //隱藏Symbol
            this.showAnima(wheelIndex, i);
            //塞入動畫Node
            this.symbolShowInfoAry[wheelIndex][i].wheelStopAnimaPrefabTform =
              _animaPrefabTform;
            //播動畫
            playAnimation(
              _animaPrefabTform,
              animationName,
              isSpine,
              isLoop,
              this.ruleBroke ? null : playStopLoopAnimation
            );
            //動畫開始的function
            this.playWheelStopAnimaPrefab(
              symbolEx.symbolInfo.symbolID,
              _animaPrefabTform,
              wheelIndex,
              i
            );
            //播放停輪symbol音效
            this.playSymbolStopAudio(symbolShowSetting, replaceData);
          } else {
            //沒有設定就直接播StopLoop
            playStopLoopAnimation();
          }
        }
      }
    }
    //        //2020/09/10 如果是急停，則全部輪音效一起播放(防止爆音)
    if (!PlatformData.instance.fastspin) {
      this.playAllStopWheelTempAudio(); //播放所有音效且清空暫存的音效
    }
    //        //2020/10/7 如果是PreWin則直接播放
    else if (this.wheelBlockControllerEx.isPrewin) {
      this.playAllStopWheelTempAudio(); //播放所有音效且清空暫存的音效
    } else {
      if (wheelIndex === this.wheelBlockControllerEx.wheelAry.length - 1)
        this.playAllStopWheelTempAudio(); //播放所有音效且清空暫存的音效
    }
  }

  /**
   * 每個 symbol 停下時觸發的 hook(在 spawnWheelStopAnimaPrefab 內部 loop 中呼叫)。
   * 預設空實作。子類想在 symbol 停下當刻做額外處理(feature value 顯示、
   * 換色、播音效等)就 override 此 hook,不必整支 spawn 流程重寫。
   */
  protected onSymbolStopAnimSpawned(
    _wheelIndex: number,
    _sortedIndex: number,
    _symbolEx: Symbol
  ): void {
    // 預設空實作
  }

  protected hideStopLoopSymbol() {
    for (let i = 0; i < this.symbolShowInfoAry.length; i++) {
      for (let j = 0; j < this.symbolShowInfoAry[i].length; j++) {
        if (this.symbolShowInfoAry[i][j].symbolStopLoopAnimaPrefabTform) {
          this.symbolShowInfoAry[i][j].symbolEx.hide();
        }
      }
    }
  }

  protected spawnSymbolStopLoopAnimaPrefab(
    wheelIndex: number,
    sortedIndex: number,
    symbolEx: Symbol,
    callback = () => {}
  ): void {
    const symbolShowSetting: SymbolShowSetting =
      this.symbolShowSettingList.find(
        searchSymbolShowSetting =>
          searchSymbolShowSetting.symbolID === symbolEx.symbolInfo.symbolID
      );
    const {animaPrefabTform, isSpine, isLoop, animationName, audioKey} =
      symbolShowSetting.symbolStopLoopAnimaPrefabArgs;
    if (animaPrefabTform) {
      this.hideSymbol(wheelIndex, sortedIndex);
      const stopLoopTform: Node = this.createPrefab(
        animaPrefabTform.data,
        symbolShowSetting.animaLayer,
        getWorldSpaceAR(symbolEx.node, Vec2.ZERO),
        Vec2.ONE
      );
      this.symbolShowInfoAry[wheelIndex][
        sortedIndex
      ].symbolStopLoopAnimaPrefabTform = stopLoopTform;
      if (isSpine) {
        const stopLoopSpine: sp.Skeleton = stopLoopTform.getComponent(
          sp.Skeleton
        );
        this.playSymbolStopLoopSpine(
          wheelIndex,
          sortedIndex,
          stopLoopSpine,
          isLoop,
          audioKey,
          symbolEx,
          animationName,
          callback
        );
      } else {
        const stopLoopAnimation: Animation =
          stopLoopTform.getComponent(Animation);
        this.playAllSymbolStopLoop(
          wheelIndex,
          sortedIndex,
          stopLoopAnimation,
          isLoop,
          audioKey,
          symbolEx,
          animationName,
          callback
        );
      }
    }
  }

  //Key:SymbolID   Value: Dictionary<WeelIndex_SortedIndex,animation>
  protected symbolStopLoopMap: Dictionary<
    number,
    Dictionary<string, AnimationData>
  > = null;

  protected playAllSymbolStopLoop(
    wheelIndex: number,
    sortedIndex: number,
    animation: Animation,
    isLoop: boolean,
    audioKey: string,
    symbolEx: Symbol,
    animationName: string,
    callback = () => {}
  ) {
    let animMap: Dictionary<string, AnimationData> = null;
    const {symbolID} = symbolEx.symbolInfo;
    const animationData: AnimationData = {
      animation,
      name: animationName,
      isLoop,
    };
    if (this.symbolStopLoopMap.containsKey(symbolID)) {
      animMap = this.symbolStopLoopMap.getValue(symbolID);
      if (animMap.containsKey(wheelIndex + '_' + sortedIndex)) {
        animMap.changeValueForKey(
          wheelIndex + '_' + sortedIndex,
          animationData
        );
      } else {
        animMap.add(wheelIndex + '_' + sortedIndex, animationData);
      }
      this.symbolStopLoopMap.changeValueForKey(symbolID, animMap);
      let time = 0;
      //取得第一個播放loop的動畫時間
      if (this.syncStopLoop) {
        const {animation, name} = animMap.values()[0];
        time = getAnimationTime(animation as unknown as Animation, name);
      }
      playAnimation(
        animation.node,
        animationName,
        false,
        isLoop,
        callback,
        time
      );
    } else {
      animMap = new Dictionary<string, AnimationData>();
      animMap.add(wheelIndex + '_' + sortedIndex, animationData);
      this.symbolStopLoopMap.add(symbolID, animMap);
      playAnimation(animation.node, animationName, false, isLoop);
      if (audioKey !== undefined && audioKey !== '') {
        this.playSymbolStopLoopAudio(symbolID, audioKey);
      }
    }
  }

  protected symbolStopLoopMapSpine: Dictionary<
    number,
    Dictionary<string, SpineData>
  > = null;
  protected playSymbolStopLoopSpine(
    wheelIndex: number,
    sortedIndex: number,
    spine: sp.Skeleton,
    isLoop: boolean,
    audioKey: string,
    symbolEx: Symbol,
    animationName: string,
    callback = () => {}
  ) {
    let animMap: Dictionary<string, SpineData> = null;
    const {symbolID} = symbolEx.symbolInfo;
    const spineData = {
      spine,
      name: animationName,
      isLoop,
    };

    if (this.symbolStopLoopMapSpine.containsKey(symbolID)) {
      animMap = this.symbolStopLoopMapSpine.getValue(symbolID);
      if (animMap.containsKey(wheelIndex + '_' + sortedIndex)) {
        animMap.changeValueForKey(wheelIndex + '_' + sortedIndex, spineData);
      } else {
        animMap.add(wheelIndex + '_' + sortedIndex, spineData);
      }
      this.symbolStopLoopMapSpine.changeValueForKey(symbolID, animMap);
      let time = 0;
      //取得第一個播放loop的動畫時間
      if (this.syncStopLoop) {
        const {spine} = animMap.values()[0];
        time = getSpineTime(spine as unknown as sp.Skeleton);
      }
      playAnimation(spine.node, animationName, true, isLoop, callback, time);
    } else {
      animMap = new Dictionary<string, SpineData>();
      animMap.add(wheelIndex + '_' + sortedIndex, spineData);
      this.symbolStopLoopMapSpine.add(symbolID, animMap);
      playAnimation(spine.node, animationName, true, isLoop);
      if (audioKey !== undefined && audioKey !== '') {
        this.playSymbolStopLoopAudio(symbolID, audioKey);
      }
    }
  }

  protected playAllSymbolStopLoopAnimBySymbolID(id: number) {
    if (this.symbolStopLoopMap.containsKey(id)) {
      const animArray: AnimationData[] = this.symbolStopLoopMap
        .getValue(id)
        .values();
      for (let i = 0; i < animArray.length; i++) {
        const {animation, name} = animArray[i];
        if (i === 0) {
          animation.once(Animation.EventType.LASTFRAME, () => {
            //藉由第一個Symbol控制大家播放
            this.playAllSymbolStopLoopAnimBySymbolID(id);
          });
        }
        if (name !== '') animation.play(name);
        else {
          animation.play();
        }
      }
    }
  }

  //所有輪停止後
  protected allWheelStopped(): void {
    if (!HostSetting.instance.bingo.useBingoFrame) {
      return;
    }
  }

  //某個SymbolId規則中途不符合就把前面正在撥放的動畫都關掉
  protected ruleBreak(symbolId: number): void {
    for (let i = 0; i < this.symbolShowInfoAry.length; i++) {
      for (let j = 0; j < this.symbolShowInfoAry[i].length; j++) {
        if (
          this.symbolShowInfoAry[i][j].symbolEx &&
          this.symbolShowInfoAry[i][j].symbolEx.symbolInfo.symbolID === symbolId
        ) {
          this.hideAnimaPrefab(i, j);
        }
      }
    }
    this.ruleBroke = true;
  }

  //表演Bingo動畫
  protected async spawnBingoAnimaPrefab(
    symbolList: number[][],
    isShowSGBingo: boolean
  ) {
    this.hideAllAnima();
    let playBingoAudioKey = '';
    for (let i = 0; i < symbolList.length; i++) {
      for (let j = 0; j < symbolList[i].length; j++) {
        const sortedIndex: number =
          j + this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount;
        const symbolEx: Symbol =
          this.wheelBlockControllerEx.wheelAry[i].getSymbolEx(sortedIndex);
        const symbolShowInfo: SymbolShowInfo =
          this.symbolShowInfoAry[i][sortedIndex];
        const displayNode: Node = symbolShowInfo.getDisplayNode();
        //隱藏loop動畫
        //20221203 針對未轉的wheel也可以做symbolbingo動畫
        if (HostSetting.instance.bingo.useWheelMask)
          this.symbolShowInfoAry[i][sortedIndex].symbolEx = symbolEx;
        if (symbolShowInfo.symbolUpperLayerPrefabTform) {
          this.hideUpperPrefab(i, sortedIndex);
        }
        if (symbolList[i][j] === 1) {
          if (
            HostSetting.instance.bingo.useBingoFrame &&
            !symbolShowInfo.activeSelf()
          ) {
            continue;
          }
          const symbolShowSetting: SymbolShowSetting =
            this.symbolShowSettingList.find(
              searchSymbolShowSetting =>
                searchSymbolShowSetting.symbolID ===
                symbolEx.symbolInfo.symbolID
            );
          this.hideAnimaPrefab(i, sortedIndex);
          if (symbolShowSetting) {
            const {animaPrefabTform, isSpine, animationName, isLoop} =
              symbolShowSetting.bingoAnimaPrefabArgs;
            if (animaPrefabTform) {
              const _animaPrefabTform: Node = this.createPrefab(
                animaPrefabTform.data,
                symbolShowSetting.animaLayer,
                getWorldSpaceAR(symbolEx.node, Vec2.ZERO),
                Vec2.ONE
              );
              this.showAnima(i, sortedIndex);
              //播動畫
              playAnimation(_animaPrefabTform, animationName, isSpine, isLoop);
              if (HostSetting.instance.bingo.useBingoFrame) {
                this.symbolShowInfoAry[i][sortedIndex].bingoAnimaPrefabTform =
                  _animaPrefabTform;
              } else {
                symbolShowInfo.bingoAnimaPrefabTform = _animaPrefabTform;
              }
              this.playBingoAnimaPrefab(
                symbolEx.symbolInfo.symbolID,
                _animaPrefabTform,
                i,
                sortedIndex
              );
            }
            //撥放音效
            if (symbolShowSetting.bingoAnimaPrefabArgs.audioKey !== '') {
              playBingoAudioKey =
                symbolShowSetting.bingoAnimaPrefabArgs.audioKey;
            }
            if (HostSetting.instance.bingo.useWheelMask) {
              //中獎圖騰不壓黑(播放動畫的圖騰)
              if (displayNode) {
                setColor(displayNode, Color.WHITE);
                //_displayNode.color = Color.WHITE;
              }
            }
          } else if (HostSetting.instance.bingo.useWheelMask) {
            //中獎圖騰不壓黑(不播放動畫的圖騰)
            if (displayNode) {
              setColor(displayNode, Color.WHITE);
              // _displayNode.color = Color.WHITE;
            }
            this.moveSymbolToUpperLayer(symbolEx, i, sortedIndex);
          }
        } else if (HostSetting.instance.bingo.useWheelMask) {
          //沒中獎圖騰壓黑，有播放動畫的也停止播放
          if (symbolShowInfo.offClippingTform) {
            symbolShowInfo.offClippingTform.active = false;
          }
          if (symbolShowInfo.symbolEx) {
            symbolShowInfo.symbolEx.show();
          }
          this.hideAnimaPrefab(i, sortedIndex);
        }
      }
    }
    if (playBingoAudioKey !== '') {
      //2020/9/10 如果正在報大獎就不播放Symbol兌獎音效
      if (
        !SlotGameMediator.instance.awardController.getIsShowBingoWinEnd() &&
        !isShowSGBingo
      )
        return;
      SlotGameMediator.instance.audioManager.play(playBingoAudioKey);
    }
  }

  //Bingo框消失
  protected async deSpawnBingoAnimaPrefab(
    symbolList: number[][],
    isShowSGBingo: boolean
  ) {
    //_SymbolList為null代表全部都要停止(還在播放兌獎框就Spin時會觸發)*null時處理包含看不見的部份，有資料時只有牌面資訊所以不用同一個迴圈處理
    if (
      SlotGameMediator.instance.mainGameHost.isReadyToEnterSG() &&
      !this.despawnBingoCalled
    ) {
      this.despawnBingoCalled = true;
      this.afterDespawnAllBingoPrefabs();
    }
    if (symbolList === null || symbolList.length === 0) {
      this.hideAllAnima();
      this.showOffClippingSymbol();
    } else {
      for (let i = 0; i < symbolList.length; i++) {
        for (let j = 0; j < symbolList[i].length; j++) {
          let sortedIndex = 0;
          if (HostSetting.instance.bingo.useWheelMask) {
            sortedIndex =
              j + this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount;
          }
          if (symbolList[i][j] === 1) {
            if (HostSetting.instance.bingo.useBingoFrame) {
              this.hideAnimaPrefab(
                i,
                j + this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount
              );
            } else {
              this.hideAnimaPrefab(i, sortedIndex);
            }
          }
          // if (HostSetting.Instance.bingo.useWheelMask) {
          //     let _DisplayNode: Node = this.m_symbolShowInfoAry[i][_iSortedIndex].GetDisplayNode();
          //     if (_DisplayNode) {
          //         _DisplayNode.color = Color.WHITE;
          //     }
          // }
        }
      }
    }
    this.afterDespawnAllBingoPrefabs();
  }

  /// <summary> 取得指定的SymbolShowInfo物件 </summary>
  protected getTargetSymbolShowInfo(
    wheelIndex: number,
    symbolIndex: number
  ): SymbolShowInfo {
    if (wheelIndex > this.symbolShowInfoAry.length) return null;
    if (symbolIndex > this.symbolShowInfoAry[wheelIndex].length) return null;
    return this.symbolShowInfoAry[wheelIndex][symbolIndex];
  }

  protected moveSymbolToUpperLayer(
    symbolEx: Symbol,
    wheelIndex: number,
    sortedIndex: number
  ): void {
    //生出相同的Symbol在上層
    const upperUISpriteTform: Node = this.createPrefab(
      this.emptyUISpriteTform,
      this.symbolUpperLayer,
      getWorldSpaceAR(symbolEx.node, Vec2.ZERO),
      Vec2.ONE
    );
    setColor(upperUISpriteTform, Color.WHITE);
    const upperUISprite: Sprite = getSprite(upperUISpriteTform);
    if (upperUISprite) {
      upperUISprite.spriteFrame = symbolEx.sprite.spriteFrame;
      upperUISprite.trim = false;
      upperUISprite.sizeMode = Sprite.SizeMode.RAW;
    }
    this.getOffClippingTform(
      symbolEx.symbolInfo.symbolID,
      upperUISpriteTform,
      wheelIndex,
      sortedIndex
    );
    if (this.symbolShowInfoAry[wheelIndex][sortedIndex].symbolEx)
      this.symbolShowInfoAry[wheelIndex][sortedIndex].symbolEx.hide();
    this.symbolShowInfoAry[wheelIndex][
      sortedIndex
    ].symbolUpperLayerPrefabTform = upperUISpriteTform;
  }

  //創建OffClipping物件
  protected createOffClippingTform(
    symbolEx: Symbol,
    layer: Node,
    wheelIndex: number,
    sortedIndex: number
  ): void {
    //生出相同的Symbol在上層
    const offClippingUISpriteTform: Node = this.createPrefab(
      this.emptyUISpriteTform,
      layer,
      getWorldSpaceAR(symbolEx.node, Vec2.ZERO),
      Vec2.ONE
    );
    if (HostSetting.instance.bingo.useWheelMask)
      setColor(offClippingUISpriteTform, Color.WHITE);
    const offClippingUISprite: Sprite = getSprite(offClippingUISpriteTform);
    if (offClippingUISprite) {
      offClippingUISprite.spriteFrame = symbolEx.sprite.spriteFrame;
      offClippingUISprite.trim = false;
      offClippingUISprite.sizeMode = Sprite.SizeMode.RAW;
    }
    this.getOffClippingTform(
      symbolEx.symbolInfo.symbolID,
      offClippingUISpriteTform,
      wheelIndex,
      sortedIndex
    );
    this.symbolShowInfoAry[wheelIndex][sortedIndex].symbolEx.hide();
    this.symbolShowInfoAry[wheelIndex][sortedIndex].offClippingTform =
      offClippingUISpriteTform;
  }

  protected hideUpperPrefab(wheelIndex: number, sortedIndex: number): void {
    const symbolShowInfo: SymbolShowInfo =
      this.symbolShowInfoAry[wheelIndex][sortedIndex];
    if (symbolShowInfo.haveUpperPrefabTform()) {
      if (symbolShowInfo.symbolUpperLayerPrefabTform) {
        this.symbolShowSpawnPool.despawn(
          symbolShowInfo.symbolUpperLayerPrefabTform
        );
        symbolShowInfo.symbolUpperLayerPrefabTform = null;
      }
      //打開靜態圖片
      if (symbolShowInfo.symbolEx) {
        symbolShowInfo.symbolEx.show();
      }
    }
  }

  //隱藏AnimaPrefab ,打開靜態圖片
  protected hideAnimaPrefab(
    wheelIndex: number,
    sortedIndex: number,
    showSymbol = true
  ): void {
    const symbolShowInfo: SymbolShowInfo =
      this.symbolShowInfoAry[wheelIndex][sortedIndex];
    if (symbolShowInfo.haveAnimaPrefabTform()) {
      this.hideStopAnimaPrefab(wheelIndex, sortedIndex, showSymbol);
      this.hideStopLoopAnimaPrefab(wheelIndex, sortedIndex, showSymbol);
      this.hideBingoAnimaPrefab(wheelIndex, sortedIndex, showSymbol);
    }
  }

  protected showSymbol(symbolShowInfo: SymbolShowInfo) {
    if (symbolShowInfo.offClippingTform) {
      symbolShowInfo.offClippingTform.active = true;
    } else if (symbolShowInfo.symbolEx) {
      symbolShowInfo.symbolEx.show();
    }
  }

  protected hideStopAnimaPrefab(
    wheelIndex: number,
    sortedIndex: number,
    showSymbol = false
  ) {
    const symbolShowInfo: SymbolShowInfo =
      this.symbolShowInfoAry[wheelIndex][sortedIndex];
    if (symbolShowInfo.wheelStopAnimaPrefabTform) {
      this.symbolShowSpawnPool.despawn(
        symbolShowInfo.wheelStopAnimaPrefabTform
      );
      this.stopWheelStopAnimaPrefab(
        symbolShowInfo.symbolEx.symbolInfo.symbolID,
        symbolShowInfo.wheelStopAnimaPrefabTform,
        wheelIndex,
        sortedIndex
      );
      symbolShowInfo.wheelStopAnimaPrefabTform = null;
      if (showSymbol) {
        this.showSymbol(symbolShowInfo);
      } else {
        this.hideSymbol(wheelIndex, sortedIndex);
      }
    }
  }

  protected hideAllAnima() {
    for (let i = 0; i < this.symbolShowInfoAry.length; i++) {
      for (let j = 0; j < this.symbolShowInfoAry[i].length; j++) {
        this.hideAnimaPrefab(i, j);
      }
    }
  }

  protected hideStopLoopAnimaPrefab(
    wheelIndex: number,
    sortedIndex: number,
    showSymbol = false
  ) {
    const symbolShowInfo: SymbolShowInfo =
      this.symbolShowInfoAry[wheelIndex][sortedIndex];
    if (symbolShowInfo.symbolStopLoopAnimaPrefabTform) {
      this.symbolShowSpawnPool.despawn(
        symbolShowInfo.symbolStopLoopAnimaPrefabTform
      );
      if (
        this.symbolStopLoopMap.containsKey(
          symbolShowInfo.symbolEx.symbolInfo.symbolID
        )
      ) {
        //移除已存的動畫物件列表
        const animMap: Dictionary<string, AnimationData> =
          this.symbolStopLoopMap.getValue(
            symbolShowInfo.symbolEx.symbolInfo.symbolID
          );
        if (animMap) {
          animMap.remove(wheelIndex + '_' + sortedIndex);
          if (animMap.count() === 0) {
            this.symbolStopLoopMap.remove(
              symbolShowInfo.symbolEx.symbolInfo.symbolID
            );
          } else {
            this.symbolStopLoopMap.changeValueForKey(
              symbolShowInfo.symbolEx.symbolInfo.symbolID,
              animMap
            );
          }
        }
        const spineAnimMap: Dictionary<string, SpineData> =
          this.symbolStopLoopMapSpine.getValue(
            symbolShowInfo.symbolEx.symbolInfo.symbolID
          );
        if (spineAnimMap) {
          spineAnimMap.remove(wheelIndex + '_' + sortedIndex);
          if (spineAnimMap.count() === 0) {
            this.symbolStopLoopMapSpine.remove(
              symbolShowInfo.symbolEx.symbolInfo.symbolID
            );
          } else {
            this.symbolStopLoopMapSpine.changeValueForKey(
              symbolShowInfo.symbolEx.symbolInfo.symbolID,
              spineAnimMap
            );
          }
        }
      }
      this.stopSymbolStopLoopAudio(symbolShowInfo.symbolEx.symbolInfo.symbolID);
      symbolShowInfo.symbolStopLoopAnimaPrefabTform = null;
      if (showSymbol) {
        this.showSymbol(symbolShowInfo);
      } else {
        this.hideSymbol(wheelIndex, sortedIndex);
      }
    }
  }

  protected hideBingoAnimaPrefab(
    wheelIndex: number,
    sortedIndex: number,
    showSymbol = false
  ) {
    const symbolShowInfo: SymbolShowInfo =
      this.symbolShowInfoAry[wheelIndex][sortedIndex];
    if (symbolShowInfo.bingoAnimaPrefabTform) {
      this.symbolShowSpawnPool.despawn(symbolShowInfo.bingoAnimaPrefabTform);
      this.stopBingoAnimaPrefab(
        symbolShowInfo.symbolEx.symbolInfo.symbolID,
        symbolShowInfo.bingoAnimaPrefabTform,
        wheelIndex,
        sortedIndex
      );
      symbolShowInfo.bingoAnimaPrefabTform = null;
      if (showSymbol) {
        this.showSymbol(symbolShowInfo);
      } else {
        this.hideSymbol(wheelIndex, sortedIndex);
      }
    }
  }

  //創建prefab
  protected createPrefab(
    createPrefabTform: Node,
    parentTform: Node,
    posV3: Vec2 | Vec3,
    scaleV3: Vec2
  ): Node {
    const prefabTform: Node = this.symbolShowSpawnPool.spawn(
      createPrefabTform,
      parentTform
    );
    const pos: Vec3 = getNodeSpaceAR(parentTform, posV3);
    setPosition(prefabTform, pos);
    setScale(parentTform, scaleV3);
    return prefabTform;
  }

  //表演動畫(隱藏所有的靜態圖片)
  protected showAnima(wheelIndex: number, sortedIndex: number): void {
    const symbolShowInfo: SymbolShowInfo =
      this.symbolShowInfoAry[wheelIndex][sortedIndex];
    if (symbolShowInfo.offClippingTform) {
      symbolShowInfo.offClippingTform.active = false;
    }
    if (symbolShowInfo.symbolEx) {
      symbolShowInfo.symbolEx.hide();
    }
  }

  //新增要播放的停輪音效
  protected addStopWheelTempAudio(audioKey: string): void {
    if (
      this.stopWheelPlayAudioKey.findIndex(key => {
        return key === audioKey;
      }) === -1
    ) {
      this.stopWheelPlayAudioKey.push(audioKey);
    }
  }

  //播放&清空目前所有存起來的停輪音效
  protected playAllStopWheelTempAudio(): void {
    for (let i = 0; i < this.stopWheelPlayAudioKey.length; i++) {
      SlotGameMediator.instance.audioManager.play(
        this.stopWheelPlayAudioKey[i]
      );
    }
    this.stopWheelPlayAudioKey = [];
  }

  protected playSymbolStopLoopAudio(symbolID: number, audioKey: string): void {
    const audioID = SlotGameMediator.instance.audioManager.play(audioKey);
    if (this.symbolStopLoopPlayAudioKeyMap.containsKey(symbolID)) {
      this.symbolStopLoopPlayAudioKeyMap.changeValueForKey(symbolID, audioID);
    } else {
      this.symbolStopLoopPlayAudioKeyMap.add(symbolID, audioID);
    }
  }

  protected stopSymbolStopLoopAudio(symbolID: number) {
    if (this.symbolStopLoopPlayAudioKeyMap.containsKey(symbolID)) {
      SlotGameMediator.instance.audioManager.stop(
        this.symbolStopLoopPlayAudioKeyMap.getValue(symbolID)
      );
      this.symbolStopLoopPlayAudioKeyMap.remove(symbolID);
    }
  }

  /// <summary> 依照特殊需求，額外塞入SymbolEx </summary>
  public setTargetSymbolInfo(
    wheelIndex: number,
    symbolIndex: number,
    symbol: Symbol
  ): void {
    // if (Define.DEBUG_LOG) {
    // console.log("[symbolshowprefabcontrollerex] SetTargetSymbolShowInfo(" + wheelIndex + "," + symbolIndex + " | ID = " + symbol.symbolInfo.symbolID + ")");
    // }
    const info: SymbolShowInfo = this.getTargetSymbolShowInfo(
      wheelIndex,
      symbolIndex
    );
    if (info.offClippingTform) {
      this.symbolShowSpawnPool.despawn(info.offClippingTform);
      info.offClippingTform = null;
    }
    const symbolShowSetting: SymbolShowSetting =
      this.symbolShowSettingList.find(
        searchSymbolShowSetting =>
          searchSymbolShowSetting.symbolID === symbol.symbolInfo.symbolID
      );
    if (symbolShowSetting) {
      //有設定的話就塞進去
      this.symbolShowInfoAry[wheelIndex][symbolIndex].symbolEx = symbol;
      //判斷要不要顯示去除Clipping的圖片
      if (symbolShowSetting.offClipping) {
        this.createOffClippingTform(
          symbol,
          symbolShowSetting.offClippingLayer,
          wheelIndex,
          symbolIndex
        );
      } else {
        symbol.show();
      }
    }
  }

  //刪除指定位置的Symbol動畫
  public removeTargetSymbolInfo(wheelIndex: number, symbolIndex: number) {
    this.symbolShowInfoAry[wheelIndex][symbolIndex].reset();
  }

  /// <summary> 幫助在場上的所有Setting的Symbol建立Offclipping </summary>
  public setCurrentResultInfo(): void {
    try {
      for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
        const count: number =
          this.wheelBlockControllerEx.wheelAry[i].visibleSymbolAmount +
          this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount;
        for (
          let j: number =
            this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount;
          j < count;
          j++
        ) {
          const symbolEx: Symbol =
            this.wheelBlockControllerEx.wheelAry[i].getSymbolEx(j);
          if (!symbolEx.node.active) continue;
          if (symbolEx.symbolInfo) {
            const symbolShowSetting: SymbolShowSetting =
              this.symbolShowSettingList.find(
                searchSymbolShowSetting =>
                  searchSymbolShowSetting.symbolID ===
                  symbolEx.symbolInfo.symbolID
              );
            if (symbolShowSetting) {
              this.symbolShowInfoAry[i][j].symbolEx = symbolEx;
              if (symbolShowSetting.offClipping) {
                this.createOffClippingTform(
                  symbolEx,
                  symbolShowSetting.offClippingLayer,
                  i,
                  j
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('SymbolShowPrefabController:', error);
    }
  }

  /// <summary> 隱藏指定的Symbol(包含offclipping) </summary>
  public hideSymbol(wheelIndex: number, sortedIndex: number): void {
    const symbolShowInfo: SymbolShowInfo =
      this.symbolShowInfoAry[wheelIndex][sortedIndex];
    if (symbolShowInfo.offClippingTform) {
      symbolShowInfo.offClippingTform.active = false;
    }
    if (symbolShowInfo.symbolEx) {
      symbolShowInfo.symbolEx.hide();
    }
  }
  /// <summary> 隱藏所有的Symbol(包含offclipping) </summary>
  public hideAllSymbol(): void {
    if (DebugLogSetting.symbolShowPrefabController && Define.DEBUG_LOG) {
      console.log('[symbolshowprefabcontrollerex] HideAllPrefab()');
    }
    let symbolShowInfo: SymbolShowInfo = null;
    for (let i = 0; i < this.symbolShowInfoAry.length; i++) {
      for (let j = 0; j < this.symbolShowInfoAry[i].length; j++) {
        symbolShowInfo = this.symbolShowInfoAry[i][j];
        if (symbolShowInfo.symbolEx) {
          if (symbolShowInfo.offClippingTform) {
            symbolShowInfo.offClippingTform.active = false;
          }
          if (symbolShowInfo.symbolEx) {
            symbolShowInfo.symbolEx.hide();
          }
        }
      }
    }
  }

  public hideOffClippingSymbol(symbolList: number[][]): void {
    if (DebugLogSetting.symbolShowPrefabController && Define.DEBUG_LOG) {
      console.log('[SymbolShowPrefabController] [HideOffClippingSymbol]');
    }
    if (this.despawnBingoCalled) {
      return;
    }
    for (let i = 0; i < symbolList.length; i++) {
      for (let j = 0; j < symbolList[i].length; j++) {
        const sortedIndex: number =
          j + this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount;
        let symbolShowInfo: SymbolShowInfo = null;
        this.hideStopLoopAnimaPrefab(i, sortedIndex);
        symbolShowInfo = this.symbolShowInfoAry[i][sortedIndex];
        if (symbolList[i][j] !== 1 && symbolShowInfo.symbolEx) {
          if (symbolShowInfo.offClippingTform) {
            symbolShowInfo.offClippingTform.active = false;
          }
          if (symbolShowInfo.symbolEx) {
            symbolShowInfo.symbolEx.show();
          }
        }
      }
    }
  }

  public showOffClippingSymbol(): void {
    if (DebugLogSetting.symbolShowPrefabController && Define.DEBUG_LOG) {
      console.log('[SymbolShowPrefabController] [showOffClippingSymbol]');
    }
    for (let i = 0; i < this.wheelBlockControllerEx.wheelAry.length; i++) {
      for (
        let j = 0;
        j < this.wheelBlockControllerEx.wheelAry[i].symbolAmount;
        j++
      ) {
        const sortedIndex: number =
          j + this.wheelBlockControllerEx.wheelAry[i].outOfTopSymbolAmount;
        let symbolShowInfo: SymbolShowInfo = null;
        symbolShowInfo = this.symbolShowInfoAry[i][sortedIndex];
        if (symbolShowInfo && symbolShowInfo.symbolEx) {
          // this.hideAnimaPrefab(i, sortedIndex);
          if (symbolShowInfo.offClippingTform) {
            symbolShowInfo.offClippingTform.active = true;
            if (symbolShowInfo.symbolEx) {
              symbolShowInfo.symbolEx.hide();
            }
          } else {
            if (symbolShowInfo.symbolEx) {
              if (symbolShowInfo.symbolEx.symbolInfo.type)
                symbolShowInfo.symbolEx.show();
            }
          }
        }
      }
    }
  }

  /// <summary> 清除所有的Prefab 打開Symbol </summary>
  protected clearAllPrefab(): void {
    if (DebugLogSetting.symbolShowPrefabController && Define.DEBUG_LOG) {
      console.log('[symbolshowprefabcontrollerex] ClearAllPrefab()');
    }
    let symbolShowInfo: SymbolShowInfo = null;
    for (let i = 0; i < this.symbolShowInfoAry.length; i++) {
      for (let j = 0; j < this.symbolShowInfoAry[i].length; j++) {
        symbolShowInfo = this.symbolShowInfoAry[i][j];
        if (HostSetting.instance.bingo.useWheelMask) {
          const displayNode: Node =
            this.symbolShowInfoAry[i][j].getDisplayNode();
          if (displayNode) {
            setScale(displayNode, 1);
            setColor(displayNode, Color.WHITE);
          }
        }
        if (symbolShowInfo.symbolEx) {
          this.hideAnimaPrefab(i, j);
          symbolShowInfo.symbolEx.show();
          symbolShowInfo.reset();
        }
      }
    }
    this.symbolShowSpawnPool.despawnAll();
    this.afterHideAllPrefab();
  }

  ///#region virtual Function

  /// <summary>
  /// Init完後
  /// </summary>
  protected initialFinish(): void {}

  /// <summary>
  /// OnDestroy後
  /// </summary>
  protected deInitialFinish(): void {}

  /// <summary>
  /// PrepareSpin後
  /// </summary>
  protected onPrepareSpinFinish(): void {}

  /// <summary>
  /// 取得OffClipping的物件
  /// </summary>
  public getOffClippingTform(
    symbolId: number,
    prefabTform: Node,
    wheelIndex: number,
    sortedIndex: number
  ): void {}

  /// <summary>
  /// 撥放停輪動畫的物件
  /// </summary>
  public playWheelStopAnimaPrefab(
    symbolId: number,
    prefabTform: Node,
    wheelIndex: number,
    sortedIndex: number
  ): void {}

  /// <summary>
  /// 撥放Bingo動畫的物件
  /// </summary>
  public playBingoAnimaPrefab(
    symbolId: number,
    prefabTform: Node,
    wheelIndex: number,
    sortedIndex: number
  ): void {}

  /// <summary>
  /// 停止停輪動畫的物件
  /// </summary>
  public stopWheelStopAnimaPrefab(
    symbolId: number,
    prefabTform: Node,
    wheelIndex: number,
    sortedIndex: number
  ): void {}

  /// <summary>
  /// 停止Bingo動畫的物件
  /// </summary>
  public stopBingoAnimaPrefab(
    symbolId: number,
    prefabTform: Node,
    wheelIndex: number,
    sortedIndex: number
  ): void {}

  /// <summary>
  /// 停止所有Bingo動畫的物件後
  /// </summary>
  protected afterDespawnAllBingoPrefabs(): void {}

  /// <summary>
  /// 隱藏所有的Prefab後
  /// </summary>
  protected afterHideAllPrefab(): void {}
}
