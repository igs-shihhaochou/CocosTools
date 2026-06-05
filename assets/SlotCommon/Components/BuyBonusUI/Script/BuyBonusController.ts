/* eslint-disable camelcase */
import {
  _decorator,
  assetManager,
  Component,
  instantiate,
  JsonAsset,
  Node,
  Prefab,
} from 'cc';
import {DEV} from 'cc/env';
import ClickLogManager, {
  ClickLogData,
} from '../../../../CommonModule/Script/Manager/ClickLogManager';
import {PlatformData} from '../../../../CommonModule/Script/Define/PlatformData';
import {UserInfo} from '../../../../CommonModule/Script/Define/UserInfo';
import InputManager from '../../../../CommonModule/Script/Manager/InputManager';
import {PlatformGDK} from '../../../../CommonModule/Script/Platform/PlatformGDK';
import Functions from '../../../../CommonModule/Script/Utility/Functions';
import EventManager from '../../../../CommonModule/Script/Manager/EventManager';
import {OrientationDefine} from '../../../../CommonModule/Script/Type/CommonDefine';
import {ReturnCommandData} from '../../../../CommonModule/Script/Network/System/BaseArkSystem';
import PlatformEventNotifier from '../../../../CommonModule/Script/Utility/PlatformEventNotifier';
import {waitForSeconds} from '../../../../CommonModule/Script/ExtraType';
import {ErrorCode} from '../../../../CommonModule/Script/Define/GlobalSetting';
import {SlotGDK} from '../../../../SlotModule/Define/SlotGDK';
import {
  SlotGameDataEx,
  SpecialGameState,
  SpecialSpinType,
  StartGameExArgs,
} from '../../../../SlotModule/Define/SlotGameData';
import BuyBonusFreeGameInfo from './BuyBonusFreeGameInfo';
import BuyBonusViewManager from './BuyBonusViewManager';
import BuyBonusSystem from './Network/BuyBonusSystem';
import {BuyBonusNetwork} from './Network/BuyBonusNetworkModule';
import {BuyBonusDataInterface} from './Network/BuyBonusDataInterface';
import {BuyBonusUISwitch} from './Define/BuyBonusUISwitch';

type TempDataType = {
  lineBet: number;
  cost: number;
  isExtraBet: boolean;
  specialGameType: string;
  buyBonusName: string;
};

const {ccclass, property} = _decorator;

/** BuyBonus支援的ClickLog */
const requestName = {
  /** 統計玩家的點擊次數 */
  buyBonus: 'BuyBonus',
};
/** BuyBonus點擊資訊 */
interface BuyBonus extends ClickLogData {
  /** 玩家暱稱 */
  Nickname?: string;
  /** 點擊的類型，範例：BuyBonus/Free Game/Feature Game */
  Type?: string;
  /** 統計間隔(秒) */
  DuringSecond?: number;
}
/** BonusType類型 */
const BONUS_TYPE = 'BuyBonus';

/** 互動鎖 holder key：面板開啟至 spin 真正進入 state machine 前持有，避免 intermission 在 BuyBonus 流程中途被誤判為可接管 */
const INTERACTION_LOCK_KEY = 'BuyBonus';

@ccclass('BuyBonusController')
export default class BuyBonusController extends Component {
  @property(BuyBonusViewManager)
  private buyBonusViewManager: BuyBonusViewManager = null;
  @property(Node)
  private freeGameRoot: Node | null = null;
  @property(Prefab)
  private freeGamePrefab: Prefab | null = null;
  private buyBonusInfoAry: BuyBonusDataInterface.SubDataStruct.BuyBonusInfo[] =
    null;
  private freeGameInfoAry: BuyBonusFreeGameInfo[] = null;
  private currentBetIndexAry: number[] = null;
  private timeLeft = 0;
  private isBuyBonusTimeEnd = false;
  private isBuyBonusEnterSG = false;
  private isRecovery = false;
  private isShowTipAfterSpecialGame = false;
  private cookieDuration = 525600; //cookie保留時間
  private cookieValue = '1'; //cookie內容
  private buyBonusTipCookieKey = 'BBFT'; // 第一次進入要顯示Tip，BuyBonusFirstTip縮寫
  private buyBonusRedDotCookieKey = 'BBFRD'; // 沒點icon前要顯示小紅點，BuyBonusFirstRedDot縮寫
  private delayShowIconTime = 2;

  /** 各按鈕點擊的次數 { buttonType:count } */
  private buttonClickCount: {[buttonType: string]: number} = {};
  /** 是否第一次點擊BuyBonus按鈕 */
  private isFirstTimeClickBuyBonus = true;
  /** 是否正在等待封包回傳 */
  private isWaitBuyBonusSpinDataReturn = false;
  /** 玩家點擊BuyBonus按鈕及購買按鈕的統計間隔(秒)，預設60秒，如GameSetting有設定則取代 */
  private buyBonusClickLogDurationSecond = 60;

  private buyBonusOriLineBet = 0;
  private buyBonusOriTotalBet = 0;

  get currentBalance() {
    if (PlatformData.isUseScoreBox) {
      return UserInfo.instance.entries;
    } else {
      return UserInfo.instance.balance;
    }
  }

  public get BuyBonusSystem(): BuyBonusSystem {
    return this.buyBonusSystem;
  }
  private buyBonusSystem: BuyBonusSystem = null;
  private tempData: TempDataType = null;

  private isGameSpinning = false;

  onLoad() {
    this.buyBonusInfoAry = [];
    this.freeGameInfoAry = [];
    this.currentBetIndexAry = [];
    this.timeLeft = 0;
    this.buttonClickCount = {};

    this.initBuyBonusConfig();
  }
  async start() {
    this.buyBonusTipCookieKey =
      PlatformData.nickName + this.buyBonusTipCookieKey;
    this.buyBonusRedDotCookieKey =
      PlatformData.gameName + this.buyBonusRedDotCookieKey;
    this.buyBonusViewManager.resetUI();
    await this.checkIsGameRecovery();
    this.login();
    this.setEventListener(true);
    this.sendGetBuyBonusInfo();
  }
  onDestroy() {
    SlotGDK.instance.eventBlockActivityBtn.remove(this.blockActivityBtn, this);
    SlotGDK.instance.eventReadyToSpin.remove(this.onReadyToSpin, this);
    SlotGDK.instance.eventSpin.remove(this.onSpin, this);
    SlotGDK.instance.eventSpecialGameStarted.remove(
      this.onSpecialGameStarted,
      this
    );
    SlotGDK.instance.eventSpecialGameEnded.remove(
      this.onSpecialGameEnded,
      this
    );
    SlotGDK.instance.eventReadyToSpin.remove(this.onReadyToSpinAfterSG, this);
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.onOrientationChange,
      this
    );
    this.setEventListener(false);
    this.release();
    // 保底：面板意外被銷毀時（如場景切換）避免互動鎖洩漏
    SlotGDK.instance.interactionLock.release(INTERACTION_LOCK_KEY);
  }

  public syncData(platformData, slotGameDataEx) {
    Object.keys(PlatformData).forEach(key => {
      PlatformData[key] = platformData[key];
    });
    Object.keys(SlotGameDataEx).forEach(key => {
      SlotGameDataEx[key] = slotGameDataEx[key];
    });
  }
  private setEventListener(isAdd: boolean) {
    if (isAdd) {
      const cmdProtocol = this.buyBonusSystem.getCommandProtocol();
      this.buyBonusSystem.addEventListener(
        BuyBonusNetwork.BuyBonusSystem.BuyBonusEvent.NETWORK_ERROR,
        this.HandleNetworkError,
        this
      );
      this.buyBonusSystem.addEventListener(
        cmdProtocol.GetInfo,
        this.recieveGetInfoData,
        this
      );
      this.buyBonusSystem.addEventListener(
        cmdProtocol.BonusSpin,
        this.recieveBonusSpinData,
        this
      );
    } else {
      const cmdProtocol = this.buyBonusSystem.getCommandProtocol();
      this.buyBonusSystem.removeEventListener(
        BuyBonusNetwork.BuyBonusSystem.BuyBonusEvent.NETWORK_ERROR,
        this.HandleNetworkError,
        this
      );
      this.buyBonusSystem.removeEventListener(
        cmdProtocol.GetInfo,
        this.recieveGetInfoData,
        this
      );
      this.buyBonusSystem.removeEventListener(
        cmdProtocol.BonusSpin,
        this.recieveBonusSpinData,
        this
      );
    }
  }
  private login() {
    //建立system
    this.buyBonusSystem = new BuyBonusSystem();
    //網路層連接
    this.buyBonusSystem.setupHttpClient(PlatformData.instance.arkClient);
  }
  private release() {
    if (this.buyBonusSystem) {
      this.buyBonusSystem.release();
    }
    this.buyBonusSystem = null;
  }
  /** 確認遊戲是否為Recovery */
  private async checkIsGameRecovery() {
    console.log(
      '[checkIsGameRecovery] SlotGameDataEx.instance.startGameData',
      SlotGameDataEx.instance.startGameData
    );

    while (!SlotGameDataEx.instance.startGameData) {
      await waitForSeconds(0.1);
    }

    const data = new StartGameExArgs().parse(
      SlotGameDataEx.instance.startGameData
    );
    console.log('[checkIsGameRecovery] data', data.gameStatusData.sgState);
    if (data.gameStatusData.sgState !== SpecialGameState.NO_SG) {
      this.onRecoverStatus();
    }

    // if (SlotGameDataEx.instance.startGameData) {
    //   const data = new StartGameExArgs().parse(SlotGameDataEx.instance.startGameData);
    //   console.log('[checkIsGameRecovery] data', data.gameStatusData.sgState);
    //   if (data.gameStatusData.sgState !== SpecialGameState.NO_SG) {
    //     this.onRecoverStatus();
    //   }
    // }
  }
  private sendGetBuyBonusInfo() {
    this.sendGetInfoCmd();
  }
  private receiveBuyBonusInfoData(data) {
    const dataJson: JSON = data;
    this.init(dataJson);
  }
  private init(buyBonusJsonData: JSON) {
    const buyBonusInfoData: BuyBonusDataInterface.S2C_GetInfo =
      buyBonusJsonData as BuyBonusDataInterface.S2C_GetInfo;
    PlatformData.licenseSetting.buyBonusDataList = buyBonusInfoData.DataList;
    this.buyBonusInfoAry = buyBonusInfoData.DataList;
    if (this.buyBonusInfoAry.length === 0) return;
    //如GameSetting有設定clicklog間隔時間，則取代預設值
    if (PlatformData.gameSetting.BuyBonusClickLogDuration)
      this.buyBonusClickLogDurationSecond = PlatformData.gameSetting
        .BuyBonusClickLogDuration as number;
    this.adjustUI(PlatformData.isLandscape);
    this.buyBonusViewManager.init();
    this.createFreeGameInfo();
    this.buyBonusViewManager.setBetUIType(
      this.buyBonusViewManager.getIsExtra()
    );
    if (BuyBonusUISwitch.customMessage) {
      this.buyBonusViewManager.showMessage(BuyBonusUISwitch.customMessage);
    }
    this.timeLeft = this.buyBonusInfoAry[0].CountdownTs;
    this.startTimeCount();
    this.scheduleOnce(() => {
      if (this.isRecovery) return;
      this.showBuyBonusIcon();
      this.checkTip();
    }, this.delayShowIconTime);
    SlotGDK.instance.eventBlockActivityBtn.insert(this.blockActivityBtn, this);
    SlotGDK.instance.eventReadyToSpin.insert(this.onReadyToSpin, this);
    SlotGDK.instance.eventSpin.insert(this.onSpin, this);
    SlotGDK.instance.eventSpecialGameStarted.insert(
      this.onSpecialGameStarted,
      this
    );
    SlotGDK.instance.eventSpecialGameEnded.insert(
      this.onSpecialGameEnded,
      this
    );
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.ORIENTATION_CHANGE,
      this.onOrientationChange,
      this
    );
    SlotGDK.instance.eventStopAutoSpin.insert(this.onStopAutoSpin, this);
  }

  private onStopAutoSpin() {
    this.isGameSpinning = false;
    this.buyBonusViewManager.setBuyBonusIconInteractable(true);
  }

  private onOrientationChange(
    orientation: OrientationDefine.OrientationType
  ): void {
    if (orientation === null) return;
    if (orientation === OrientationDefine.OrientationType.LANDSCAPE) {
      this.adjustUI(true);
    } else {
      this.adjustUI(false);
    }
  }
  private adjustUI(isLandscape = true) {
    this.buyBonusViewManager.adjustUI(isLandscape);
  }
  private blockActivityBtn(isBlock: boolean) {
    if (this.isGameSpinning) return;
    this.buyBonusViewManager.setBuyBonusIconInteractable(
      !isBlock && !SlotGDK.instance.isFreeSpin
    );
  }
  private onReadyToSpin() {
    if (!PlatformData.instance.autospin) {
      this.isGameSpinning = false;
      this.buyBonusViewManager.setBuyBonusIconInteractable(true);
    }
  }
  private onSpin() {
    this.isGameSpinning = true;
    this.buyBonusViewManager.setBuyBonusIconInteractable(false);
    // spin 已送入 state machine（nowGameStatus 即將離開 ReadyToSpin），
    // BuyBonus 對 idle 的持有可以釋放，後續由 state 接管
    SlotGDK.instance.interactionLock.release(INTERACTION_LOCK_KEY);
  }
  private onRecoverStatus(): void {
    this.isRecovery = true;
    this.isShowTipAfterSpecialGame = true;
  }
  /** 開始BuyBonusSpin流程 */
  private startBuyBonusSpinProcess() {
    this.isBuyBonusEnterSG = true;
    PlatformData.instance.isBonusPlay = true;
    PlatformData.instance.bonusType = 'BuyBonus';
    this.closeBuyBonus(true);
    if (BuyBonusUISwitch.showIconInBuyBonusGame) {
      this.buyBonusViewManager.playBuyBonusIconTween();
    }
    SlotGDK.instance.eventReadyToSpin.insert(this.onReadyToSpinAfterSG, this);
  }
  //進入免費遊戲，根據客製化設定，隱藏BuyBonus按鈕or按鈕呼吸光特效
  private onSpecialGameStarted() {
    if (!this.isBuyBonusEnterSG || !BuyBonusUISwitch.showIconInBuyBonusGame) {
      this.buyBonusViewManager.hideBuyBonusIcon();
    }
  }
  //免費遊戲結束，顯示BuyBonus按鈕
  private onSpecialGameEnded(): void {
    if (BuyBonusUISwitch.showIconInBuyBonusGame) {
      this.buyBonusViewManager.stopBuyBonusIconTween();
    }
    this.showBuyBonusIcon();
    //如為Recovery進入遊戲，判斷是否開啟教學
    if (this.isShowTipAfterSpecialGame) {
      this.checkTip();
    }
  }
  //BuyBonus結束後，可以進行Spin狀態時自動跳出面板
  private onReadyToSpinAfterSG(): void {
    if (this.isBuyBonusEnterSG) {
      this.isBuyBonusEnterSG = false;
      PlatformData.instance.isBonusPlay = false;
      PlatformData.instance.bonusType = '';
      if (BuyBonusUISwitch.showPanelAfterBuyBonusGame) this.showBuyBonus();
      SlotGDK.instance.eventReadyToSpin.remove(this.onReadyToSpinAfterSG, this);
    }
    this.showBuyBonusIcon();
  }
  private createFreeGameInfo() {
    for (let i = 0; i < this.buyBonusInfoAry.length; i++) {
      const newFreeGameNode: Node = instantiate(this.freeGamePrefab);
      newFreeGameNode.setParent(this.freeGameRoot);
      const specialGameType: string = this.buyBonusInfoAry[i].SpecialGameType
        ? this.buyBonusInfoAry[i].SpecialGameType
        : 'FREE GAME';
      const newFreeGameInfo: BuyBonusFreeGameInfo =
        newFreeGameNode.getComponent(BuyBonusFreeGameInfo);
      newFreeGameInfo.init(
        i,
        specialGameType,
        specialGameType,
        this.buyBonusInfoAry.length
      );
      const showExtraBetBtn: boolean =
        this.buyBonusInfoAry[i].BetMode[0] ===
        this.buyBonusInfoAry[i].BetMode[1];
      if (showExtraBetBtn) {
        this.buyBonusViewManager.showExtraBet();
      } else {
        this.buyBonusViewManager.hideExtraBet();
      }
      this.buyBonusViewManager.setExtraBetToggle(
        PlatformData.instance.isExtraBet
      );
      newFreeGameInfo.setBuyBtnCallback(this.onClickBuyBonusSpin.bind(this));
      this.freeGameInfoAry.push(newFreeGameInfo);
      this.currentBetIndexAry.push(0);
    }
    //設置按鈕上的游標狀態
    InputManager.instance.setButtonsCursor(this.freeGameRoot);
  }
  //根據玩家目前押注段及ExtraBet開啟狀態，變更開啟BuyBonus面板時顯示的預設參數
  private showFreeGameInfo() {
    this.buyBonusViewManager.setExtraBetToggle(
      PlatformData.instance.isExtraBet
    );
    for (let i = 0; i < this.buyBonusInfoAry.length; i++) {
      this.currentBetIndexAry[i] = this.buyBonusInfoAry[i].BetList.length - 1;
      const currentLineBet = PlatformData.instance.originalLineBet;
      for (let j = 0; j < this.buyBonusInfoAry[i].BetList.length; j++) {
        const betData = this.buyBonusInfoAry[i].BetList[j];
        if (currentLineBet === betData.LineBet) {
          this.currentBetIndexAry[i] = j;
        }
      }
      this.setFreeGameInfo(i);
    }
  }
  private setFreeGameInfo(freeGameIndex: number) {
    const betData =
      this.buyBonusInfoAry[freeGameIndex].BetList[
        this.currentBetIndexAry[freeGameIndex]
      ];
    const isExtra: boolean = this.buyBonusViewManager.getIsExtra();
    const betlines: number = this.buyBonusInfoAry[freeGameIndex].BetLines;
    const currentTotalBet: number = isExtra
      ? betData.LineBet * betlines * PlatformData.instance.extraBetRatio
      : betData.LineBet * betlines;
    const currentCost: number = isExtra
      ? betData.LineBet * betlines * betData.ExtraCostMulti
      : betData.LineBet * betlines * betData.CostMulti;
    const currentTotalBetStr: string = Functions.numberFormat(
      currentTotalBet,
      Functions.getAdaptiveDecimalPlaces(
        currentTotalBet,
        PlatformData.currencyRatio,
        PlatformData.decimalPlaces
      ),
      true,
      '',
      PlatformData.currencyRatio
    );
    const currentCostStr: string = Functions.numberFormat(
      currentCost,
      Functions.getAdaptiveDecimalPlaces(
        currentCost,
        PlatformData.currencyRatio,
        PlatformData.decimalPlaces
      ),
      true,
      '',
      PlatformData.currencyRatio
    );
    this.freeGameInfoAry[freeGameIndex].setCost(currentCostStr);
    this.buyBonusViewManager.setBetLabel(currentTotalBetStr);

    console.log(
      '[setFreeGameInfo] check currentBalance init',
      freeGameIndex,
      currentCost,
      this.currentBalance
    );

    if (!this.currentBalance || currentCost > this.currentBalance) {
      this.freeGameInfoAry[freeGameIndex].disableBuy();
    } else {
      this.freeGameInfoAry[freeGameIndex].enableBuy();
    }

    this.changeBuyBonusBet(betData.LineBet * betlines, betData.LineBet);
  }
  /** 切換下一個押注段 */
  private nextBet(freeGameIndex: number) {
    if (
      this.currentBetIndexAry[freeGameIndex] ===
      this.buyBonusInfoAry[freeGameIndex].BetList.length - 1
    )
      return;
    this.currentBetIndexAry[freeGameIndex]++;
    this.setFreeGameInfo(freeGameIndex);
  }
  /** 切換上一個押注段 */
  private preBet(freeGameIndex: number) {
    if (this.currentBetIndexAry[freeGameIndex] === 0) return;
    this.currentBetIndexAry[freeGameIndex]--;
    this.setFreeGameInfo(freeGameIndex);
  }
  /** 切換ExtraBet開關 */
  private extraBetToggleChange(freeGameIndex: number) {
    this.buyBonusViewManager.setBetUIType(
      this.buyBonusViewManager.getIsExtra()
    );
    this.setFreeGameInfo(freeGameIndex);
  }
  /** 先確認還在期限內才開啟 */
  private showBuyBonusIcon() {
    if (this.isBuyBonusTimeEnd) return;
    this.buyBonusViewManager.showBuyBonusIcon();
  }
  /** 開啟BuyBonus介面，先確認還在期限內才開啟 */
  private showBuyBonus() {
    if (this.isBuyBonusTimeEnd) return;
    SlotGDK.instance.interactionLock.acquire(INTERACTION_LOCK_KEY);
    this.closeTip();
    this.closeRedDot();
    this.buyBonusViewManager.showPanel();
    this.showFreeGameInfo();

    // 記錄原本的押注值
    this.buyBonusOriLineBet = PlatformData.instance.originalLineBet;
    this.buyBonusOriTotalBet = PlatformData.instance.originalTotalBet;

    // InGameJP放到BuyBonus階層
    if (SlotGDK.instance.eventBuyBonusSetInGameJpUI.length > 0) {
      SlotGDK.instance.eventBuyBonusSetInGameJpUI.notify(
        this.buyBonusViewManager.getInGameJPRoot()
      );
    }

    // 隱藏平台上Bar(SS)
    PlatformEventNotifier.showAllUI(false);
  }
  /** 關閉BuyBonus介面，如無購買則須恢復原押注段 */
  private closeBuyBonus(isStartBuyBonusSpin = false) {
    this.isWaitBuyBonusSpinDataReturn = false;
    this.buyBonusViewManager.hidePanel();

    if (!isStartBuyBonusSpin) {
      // 關閉BuyBonus時，恢復原本的押注值
      this.changeBuyBonusBet(this.buyBonusOriTotalBet, this.buyBonusOriLineBet);
      // 使用者取消面板 → 立即釋放互動鎖；若要起 spin 則保持鎖住直到 onSpin 真正進入 state machine
      SlotGDK.instance.interactionLock.release(INTERACTION_LOCK_KEY);
    }

    // InGameJP放回原本階層
    if (SlotGDK.instance.eventBuyBonusPanelClose.length > 0) {
      SlotGDK.instance.eventBuyBonusPanelClose.notify();
    }

    // 顯示平台上Bar(SS)
    PlatformEventNotifier.showAllUI(true);
  }
  /** 當 BuyBonus BET 切換 JP 需要跟著切換 */
  private changeBuyBonusBet(totlBet: number, lineBet: number) {
    PlatformData.instance.originalLineBet = lineBet;
    PlatformData.instance.originalTotalBet = totlBet;
    if (SlotGDK.instance.eventBuyBonusChangeBet.length > 0) {
      SlotGDK.instance.eventBuyBonusChangeBet.notify(
        PlatformData.instance.originalLineBet,
        PlatformData.instance.originalTotalBet
      );
    }
  }
  /** 根據cookie判斷是否開啟教學 */
  private checkTip() {
    if (this.isBuyBonusTimeEnd) return;
    const buyBonusTipCookie: string = Functions.getCookie(
      this.buyBonusTipCookieKey
    );
    if (buyBonusTipCookie === null || buyBonusTipCookie !== this.cookieValue) {
      this.buyBonusViewManager.showTip();
    } else {
      this.checkRedDot();
    }
  }
  private closeTip() {
    Functions.setCookie(
      this.buyBonusTipCookieKey,
      this.cookieValue,
      this.cookieDuration
    );
    this.buyBonusViewManager.hideTip();
    this.checkRedDot();
  }
  /** 根據cookie判斷是否開啟紅點 */
  private checkRedDot() {
    const buyBonusRedDotCookie: string = Functions.getCookie(
      this.buyBonusRedDotCookieKey
    );
    if (
      buyBonusRedDotCookie === null ||
      buyBonusRedDotCookie !== this.cookieValue
    ) {
      this.buyBonusViewManager.showRedDot();
    }
  }
  private closeRedDot() {
    Functions.setCookie(
      this.buyBonusRedDotCookieKey,
      this.cookieValue,
      this.cookieDuration
    );
    this.buyBonusViewManager.hideRedDot();
  }
  /** 時間結束，關閉BuyBonus按鈕；如正開啟面板，則關閉面板並跳出訊息視窗 */
  private endBuyBonus() {
    if (this.buyBonusViewManager.getIsPanelOpen()) {
      //經編導確認後不會再出現此case 20250213 by kyy
      PlatformGDK.instance.showPopUpMessage.notify('BuyBonus_TimeUp');
      this.closeBuyBonus();
    }
    this.buyBonusViewManager.hideBuyBonusIcon();
    this.isBuyBonusTimeEnd = true;
  }
  /** 接到CountdownTs後開始時間倒數 */
  private startTimeCount(): void {
    if (this.timeLeft > 0) {
      this.schedule(this.timeLeftupdate, 1);
    } else {
      this.unschedule(this.timeLeftupdate);
    }
  }
  /**
   * 每秒減一
   */
  private timeLeftupdate() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
    } else {
      this.unschedule(this.timeLeftupdate);
      this.endBuyBonus();
    }
  }
  // ---- [按鈕事件] ----
  /** 點擊+時，callback */
  public onClickPlusBtn() {
    for (let i = 0; i < this.currentBetIndexAry.length; i++) {
      this.nextBet(i);
    }
  }
  /** 點擊-時，callback */
  public onClickReduceBtn() {
    for (let i = 0; i < this.currentBetIndexAry.length; i++) {
      this.preBet(i);
    }
  }
  /** 點擊extraBet勾選時，callback */
  public onClickExtraBet() {
    for (let i = 0; i < this.currentBetIndexAry.length; i++) {
      this.extraBetToggleChange(i);
    }
  }
  private onClickBuyBonus() {
    this.showBuyBonus();
    if (this.isFirstTimeClickBuyBonus) {
      this.isFirstTimeClickBuyBonus = false;
      this.startRecordClickLog();
    } else {
      this.addBuyBonusClickCount('BuyBonus');
    }
  }
  private onClickClose() {
    this.closeBuyBonus();
  }
  private onClickInfo() {
    this.buyBonusViewManager.showInfo();
  }
  private onClickCloseInfo() {
    this.buyBonusViewManager.hideInfo();
  }
  private onClickCloseTip() {
    this.closeTip();
  }
  private onClickBuyBonusSpin(freeGameIndex: number) {
    if (this.checkTooMuchCoin()) return;
    //防止重複點擊
    if (this.isWaitBuyBonusSpinDataReturn) return;
    this.isWaitBuyBonusSpinDataReturn = true;
    this.sendBonusSpinCmd(
      this.getSelectLineBet(freeGameIndex),
      this.getSelectCost(freeGameIndex),
      this.getIsExtra(),
      this.getSpecialGameID(freeGameIndex),
      this.getBuyBonusName(freeGameIndex)
    );
    EventManager.instance.dispatchEvent(
      PlatformData.gameEventName.CHANGE_GAME_BET,
      this.getSelectLineBet(freeGameIndex),
      this.getIsExtra()
    );
    this.addBuyBonusClickCount(
      this.buyBonusInfoAry[freeGameIndex].SpecialGameType
    );
  }
  // ---- [取得參數] ----
  public getIsExtra(): boolean {
    return this.buyBonusViewManager.getIsExtra();
  }
  public getSelectLineBet(freeGameIndex: number): number {
    return this.buyBonusInfoAry[freeGameIndex].BetList[
      this.currentBetIndexAry[freeGameIndex]
    ].LineBet;
  }
  public getSelectTotalBet(freeGameIndex: number): number {
    return (
      this.buyBonusInfoAry[freeGameIndex].BetList[
        this.currentBetIndexAry[freeGameIndex]
      ].LineBet * this.buyBonusInfoAry[freeGameIndex].BetLines
    );
  }
  public getSelectCost(freeGameIndex: number): number {
    const betData: BuyBonusDataInterface.SubDataStruct.BuyBonusBetData =
      this.buyBonusInfoAry[freeGameIndex].BetList[
        this.currentBetIndexAry[freeGameIndex]
      ];
    return this.getIsExtra()
      ? betData.ExtraCostMulti * this.getSelectTotalBet(freeGameIndex)
      : betData.CostMulti * this.getSelectTotalBet(freeGameIndex);
  }
  public getSpecialGameID(freeGameIndex: number): string {
    return this.buyBonusInfoAry[freeGameIndex].SpecialGame;
  }
  public getBuyBonusName(freeGameIndex: number): string {
    return this.buyBonusInfoAry[freeGameIndex].Name;
  }
  //#region 紀錄及傳送封包給ClickLogManager
  //==================================================================================
  /**
   * 開始紀錄玩家點擊次數，每次進遊戲後，第1次點擊Buy Bonus Icon時，會發送1次Click Log
   */
  private startRecordClickLog() {
    //初始化點擊次數
    this.initBuyBonusClickCount();
    this.addBuyBonusClickCount('BuyBonus');
    //第1次點擊Buy Bonus Icon時直接發送Click Log，並開始計時
    this.onRecordClickLogDurationEnd();
    this.schedule(
      this.onRecordClickLogDurationEnd,
      this.buyBonusClickLogDurationSecond
    );
  }
  /**
   * 初始化玩家的點擊次數
   */
  private initBuyBonusClickCount() {
    this.buttonClickCount['BuyBonus'] = 0;
    for (let i = 0; i < this.buyBonusInfoAry.length; i++) {
      const specialGameType: string = this.buyBonusInfoAry[i].SpecialGameType
        ? this.buyBonusInfoAry[i].SpecialGameType
        : 'FREE GAME';
      this.buttonClickCount[specialGameType] = 0;
    }
  }
  /**
   * 紀錄玩家的點擊次數
   * @param buttonType 按鈕類型
   */
  private addBuyBonusClickCount(buttonType: string) {
    if (this.buttonClickCount[buttonType] === null) {
      this.buttonClickCount[buttonType] = 0;
    }
    this.buttonClickCount[buttonType]++;
  }
  /**
   * 紀錄點擊次數的計時器結束
   */
  private onRecordClickLogDurationEnd() {
    //如果次數不為0，發送點擊次數
    Object.keys(this.buttonClickCount).forEach((buttonType: string) => {
      if (this.buttonClickCount[buttonType] !== 0) {
        // this.sendBuyBonusClickLog(
        //   buttonType,
        //   this.buttonClickCount[buttonType]
        // );
      }
    });
    //初始化點擊次數
    this.initBuyBonusClickCount();
    //如果BuyBonus功能結束，取消計時
    if (this.isBuyBonusTimeEnd) {
      this.unschedule(this.onRecordClickLogDurationEnd);
    }
  }
  /**
   * 傳送玩家的點擊次數記錄
   */
  private sendBuyBonusClickLog(type: string, count: number) {
    const data: BuyBonus = {
      Nickname: PlatformData.nickName,
      Type: type,
      DuringSecond: this.buyBonusClickLogDurationSecond,
    };
    ClickLogManager.instance.addClickLog(
      requestName.buyBonus,
      PlatformData.gameName,
      PlatformData.gameName,
      '',
      count,
      data
    );
  }
  //==================================================================================
  //#endregion 紀錄及傳送封包給ClickLogManager

  //#region 網路串接
  //==================================================================================
  /** 發送BuyBonus清單請求 */
  private sendGetInfoCmd() {
    const cmdData: BuyBonusDataInterface.C2S_GetInfo = {};
    cmdData.BonusType = BONUS_TYPE;
    cmdData.GameName = PlatformData.gameName;

    this.buyBonusSystem.SendGetInfo(cmdData);
  }
  private recieveGetInfoData(result: number, retCmdData: ReturnCommandData) {
    const code: number = retCmdData.cmd_data.Code as number;
    if (code === 0) {
      const data: BuyBonusDataInterface.S2C_GetInfo =
        retCmdData.cmd_data as BuyBonusDataInterface.S2C_GetInfo;
      if (data) {
        this.receiveBuyBonusInfoData(data);
      }
    } else {
      /* empty */
    }
  }
  /* 發送BuyBonusSpin請求 */
  private sendBonusSpinCmd(
    lineBet: number,
    cost: number,
    isExtraBet: boolean,
    specialGameType: string,
    buyBonusName: string
  ) {
    this.tempData = {
      lineBet,
      cost,
      isExtraBet,
      specialGameType,
      buyBonusName,
    };
    const cmdData: BuyBonusDataInterface.C2S_BonusSpin = {};
    cmdData.GameName = PlatformData.gameName;
    cmdData.Name = buyBonusName;
    cmdData.SpecialGame = specialGameType;
    cmdData.ExtraBet = isExtraBet;
    cmdData.Bet = lineBet;
    cmdData.BonusType = BONUS_TYPE;

    const commonData: JSON = JSON.parse(
      JSON.stringify(PlatformData.instance.commandData)
    );

    const mergedData = Object.assign({}, cmdData as JSON, commonData);

    console.log('[sendBonusSpinCmd]', mergedData, commonData);
    //Client 先假扣
    PlatformGDK.instance.updatePlayerBalance.notify(this.currentBalance - cost);

    //顯示Loading
    PlatformGDK.instance.openLoadingPage.notify(this);

    this.buyBonusSystem.SendBonusSpin(mergedData);
  }
  private recieveBonusSpinData(result: number, retCmdData: ReturnCommandData) {
    const code: number = retCmdData.cmd_data.Code as number;
    if (code === 0) {
      const data = retCmdData.cmd_data;
      if (data) {
        const spinData = {
          cmd_data: JSON.parse(JSON.stringify(data)),
        };

        PlatformGDK.instance.closeLoadingPage.notify(this);
        this.startBuyBonusSpinProcess();

        const callback = () => {
          //轉場動畫結束後，將BuyBonusSpin資料傳給eventTriggerSpecialSpin
          if (SlotGDK.instance.eventTriggerSpecialSpin.length > 0) {
            SlotGDK.instance.eventTriggerSpecialSpin.notify(
              SpecialSpinType.BUYBONUS,
              spinData,
              this.tempData.cost
            );
          }
        };

        //BuyBonus表演特效
        if (SlotGDK.instance.eventPlayBuyBonusEffect.length > 0) {
          SlotGDK.instance.eventPlayBuyBonusEffect.notify(callback);
        } else {
          callback();
        }

        //累積類遊戲，數值轉換至BuyBonus狀態
        if (SlotGDK.instance.eventTransitionToBuyBonusState.length > 0) {
          SlotGDK.instance.eventTransitionToBuyBonusState.notify();
        }
      }
    } else {
      const {lineBet, cost, isExtraBet, specialGameType, buyBonusName} =
        this.tempData;
      switch (code) {
        case 0:
          break;
        case -200046:
          //check cmd 失敗
          this.sendBonusSpinCmd(
            lineBet,
            cost,
            isExtraBet,
            specialGameType,
            buyBonusName
          );
          return;
        default:
          PlatformGDK.instance.showPopUpMessageByErrorCode.notify(code);
          return;
      }
      PlatformGDK.instance.closeLoadingPage.notify(this);
      let errorData = PlatformData.instance.errorCodeDic.getValue(code);
      if (!errorData)
        errorData = PlatformData.instance.errorCodeDic.getValue(0);
      PlatformGDK.instance.showPopUpMessage.notify(errorData, code.toString());
    }
  }

  /**
   * 網路錯誤處理
   */
  private HandleNetworkError() {}

  //==================================================================================
  //#endregion 網路串接

  //#region 讀取客製化設定檔
  //==================================================================================
  private async initBuyBonusConfig() {
    if (!DEV) {
      try {
        await Promise.all([this.loadUISwitchConfig()]);
      } catch (err) {
        console.warn(err);
      }
    }
  }
  private async loadUISwitchConfig() {
    const url = `${PlatformData.gameConfig.RemoteResources}Common/BuyBonusUI/BuyBonusUISwitchConfig.json`;
    this.initBuyBonusUISwitch(await this.loadJsonConfig(url));
  }
  private initBuyBonusUISwitch(data: JsonAsset) {
    const config = data.json;
    Object.keys(BuyBonusUISwitch).forEach(key => {
      BuyBonusUISwitch[key] = config[key] ?? BuyBonusUISwitch[key];
    });
    this.buyBonusViewManager.setBetTitleDisplay();
  }
  private loadJsonConfig(url: string) {
    return new Promise<JsonAsset>((resolve, reject) => {
      console.log('[BuyBonusController]loadJsonConfig');
      assetManager.loadRemote<JsonAsset>(`${url}`, (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log('[BuyBonusController]loadJsonConfig', data);
          resolve(data);
        }
      });
    });
  }
  //==================================================================================
  //#endregion 讀取客製化設定檔

  protected get tooMuchCoin(): boolean {
    const asset = PlatformData.isUseScoreBox
      ? UserInfo.instance.entries + UserInfo.instance.winnings
      : UserInfo.instance.balance;
    return (
      PlatformData.instance.maxBalance < asset &&
      PlatformData.instance.maxBalance > 0
    );
  }

  protected checkTooMuchCoin() {
    if (this.tooMuchCoin) {
      const text = PlatformData.instance.errorCodeDic.getValue(
        ErrorCode.TOO_MUCH_BALANCE
      );
      const subText = ErrorCode.TOO_MUCH_BALANCE.toString();
      PlatformGDK.instance.showPopUpMessage.notify(text, subText);
      return true;
    }
    return false;
  }
}
