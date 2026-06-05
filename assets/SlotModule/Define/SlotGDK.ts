import {SlotGameDataEx, GamePlayMode} from './SlotGameData';
import {SlotGameMediator} from './SlotGameMediator';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {InteractionLock} from './InteractionLock';
import {LangType} from '../UIComponent/MultLang';
import {type SpriteFrame, type Vec2, type Color, type Vec3, Node} from 'cc';

export class SlotGDK {
  public static get instance(): SlotGDK {
    if (!window['slotGDK']) {
      window['slotGDK'] = new SlotGDK();
    }
    return window['slotGDK'];
  }

  public disableInGameNextFever = false;

  public isFreeSpin = false;

  public isSpecialGame = false;

  public isNowAllowPlayBGM = false;
  // Game to Platform
  public eventSceneIsReady: Delegate = new Delegate(); //場景載入完成

  public eventGameIsReady: Delegate = new Delegate();

  public eventReadyToSpin: Delegate = new Delegate(); //Game告訴平台現在目前為ReadyToSpin狀態
  public eventWaitForWheelStop: Delegate = new Delegate(); //開始旋轉後，等待停輪
  public eventWheelStop: Delegate = new Delegate(); //完成停輪
  public eventClearPreView: Delegate = new Delegate(); //清除PreView Msg
  public eventOneBingoLineShowStart: Delegate = new Delegate(); //每條線獎演出開始
  public eventOneBingoLineShowFinished: Delegate = new Delegate(); //每條線獎演出結束
  public eventShowLineBingoFrameData: Delegate = new Delegate(); //顯示Line的Bingo框資訊(lineId, symbolid, symbolCount, win)
  public eventShowWaysBingoFrameData: Delegate = new Delegate(); //顯示Ways的Bingo框資訊(waysCount, symbolid, symbolCount, win)
  public eventShowCountBingoFrameData: Delegate = new Delegate(); //顯示totalCount的Bingo框資訊(totalCount, symbolid, symbolCount, win)
  public eventShowAllBingoFrameData: Delegate = new Delegate(); //顯示全部Bingo框資訊
  public eventOnBingoAnimationStopped: Delegate = new Delegate(); //bingo動畫被呼叫停止
  public eventOnLastScatterStopCompleted: Delegate = new Delegate(); // Scatter In 動畫結束
  public eventClearBingoData: Delegate = new Delegate(); //清除兌獎資訊
  public eventShowAwardStart: Delegate = new Delegate(); //報獎開始(WinType)
  public eventShowAwardFinished: Delegate = new Delegate(); //報獎結束(WinType)
  public eventSpecialGameStarted: Delegate = new Delegate(); //開始特殊遊戲
  public eventSpecialGameEnded: Delegate = new Delegate(); //結束特殊遊戲
  public eventProcessFinish: Delegate = new Delegate(); //轉輪流程(花錢的那一手)整個結束
  public eventShowRetriggerMessage: Delegate = new Delegate(); //顯示Retrigger訊息
  public eventIsRecoveryStatus: Delegate = new Delegate(); //StartGame進去後發現需要Recovery狀態
  public sendNextFeverCmd: Delegate = new Delegate(); //送NextFever的Command
  public sendBonusNextFeverCmd: Delegate = new Delegate(); //送BonusNextFever的Command
  public sendInGameStartGameCmd: Delegate = new Delegate(); //送遊戲內的startGameCmd(與現行gdk事件脫鉤)
  public eventSendDoubleGameCmd: Delegate = new Delegate(); //送出DoubleGame的Command
  public eventSendInGameJackpotInfoCmd: Delegate = new Delegate(); //送拿inGameJp資料的Command
  public eventShowEnterSpecialGameBtn: Delegate = new Delegate(); //打開特殊遊戲開始鈕
  public eventActiveStartBtn: Delegate = new Delegate(); //開啟Start按鈕
  public eventActiveSpinBtn: Delegate = new Delegate(); //開啟Spin按鈕(要不要押暗)
  // 因應花樣舞者進選擇面板時的需求，多設定一個"隱藏"spin鈕的function 2019/12/26 玟璇
  public eventHideSpinBtn: Delegate = new Delegate(); //開啟Spin按鈕(要不要隱藏)
  // 新增ExtraBet按鈕 2021-10-25
  public eventActiveExtraBetBtn: Delegate = new Delegate(); //開啟ExtraBet按鈕
  public eventActiveFreeGameBar: Delegate = new Delegate(); //開啟FreeGame特殊按鈕

  public eventActiveWheelBtn: Delegate = new Delegate(); //開啟盤面點擊按鈕

  public eventSetFreeGameBarPosition: Delegate = new Delegate(); //設定特殊遊戲FreeGameBar位置
  public eventSetFreeGameBarSpinTimes: Delegate = new Delegate(); //設定特殊遊戲還剩幾次的表現
  public eventSetFreeGameBarText: Delegate = new Delegate(); //設定特殊遊戲FreeGameBar改變文字的表現
  public eventShowWinAnimCount: Delegate = new Delegate(); //中獎框流程滾錢開始(通常用於平台下方bar滾錢使用) 不歸零版本
  public eventShowThisWin: Delegate = new Delegate(); //顯示本次贏分
  public eventStartShowWinEffect: Delegate = new Delegate();
  public eventActiveTakeBtn: Delegate = new Delegate(); //開關略過大獎表演按鈕
  public eventSpin: Delegate = new Delegate(); //平台發出spin的事件
  public eventUpdateOddsTabel: Delegate = new Delegate();
  public eventClickChangeBet: Delegate = new Delegate(); //平台按下切換BET按鈕
  public eventClickExtraBet: Delegate = new Delegate(); //平台按下切換Extra BET按鈕 2021/10/19
  public eventClickStop: Delegate = new Delegate(); //平台按下停止按鈕
  public eventClickSpGameStartBtn: Delegate = new Delegate(); //平台按下特殊遊戲開始鈕
  public eventClickSkipButton: Delegate = new Delegate(); //平台按下中獎表演略過鈕
  public eventClickInfoBtn: Delegate = new Delegate(); //平台按下info頁按鈕
  public fastSpin = false; //開關快速旋轉功能
  public eventActiveAutoSpin: Delegate = new Delegate(); //開關AutoSpin功能
  public eventStopAutoSpin: Delegate = new Delegate(); // 關閉AutoSpin功能
  public eventSetStartGameData: Delegate = new Delegate();
  public eventForceStopBigWinEffect: Delegate = new Delegate(); //平台直接略過bigwin以上報獎面板(贏分已到目標值)
  public eventSetInGameJackpotData: Delegate = new Delegate(); //拿inGameJp資料的Command
  // Event_SetDoubleGameCmd
  public eventSetDoubleGameData: Delegate = new Delegate(); //拿DoubleGame資料的Command
  public eventPlayRetriggerEffect: Delegate = new Delegate(); //播放Retrigger特效
  public eventPlayFlyToBottomBarEffect: Delegate = new Delegate();
  public eventBlockAllBtn: Delegate = new Delegate(); //Block所有的按鈕功能
  /**
   * 玩家互動鎖：任何外部 feature（BuyBonus 面板、道具卡等）在開始互動時 acquire、結束時 release。
   * MainGameHost 會用 `nowGameStatus === ReadyToSpin && !interactionLock.isBusy` 判定 idle，
   * 確保 intermission 等活動事件不會在玩家互動中途被「誤判為可接管」。
   */
  public readonly interactionLock: InteractionLock = new InteractionLock();
  public eventShowExtraBetPopup: Delegate = new Delegate(); //顯示ExtraBet教學視窗
  public eventCloseExtraBetPopup: Delegate = new Delegate(); //關閉ExtraBet教學視窗
  public eventBlockActivityBtn: Delegate = new Delegate(); //阻擋slot功能按鈕 (例如BuyBonus)
  public eventShowTopBar: Delegate = new Delegate(); //開關TopBar
  public eventShowStopBtn: Delegate = new Delegate(); //開起Stop按鈕
  public eventPlayBgm: Delegate = new Delegate(); //播放遊戲BGM
  public eventClearBetAudio: Delegate = new Delegate(); //清除Bet切換音效
  public eventBlockSpinBtn: Delegate = new Delegate(); //阻擋Spin按鈕
  //Auto Select Timer
  public eventIniAutoSelectSetting: Delegate = new Delegate();
  public eventStartAutoSelectTimer: Delegate = new Delegate();
  public eventStopAutoSelectTimer: Delegate = new Delegate();
  public eventSetCanChangeBet: Delegate = new Delegate(); //阻擋切換Bet按鈕
  public eventAutoSpin: Delegate = new Delegate(); //Auto執行的事件
  // OpeningAnim Start
  public eventOnOpeningStart: Delegate = new Delegate();
  // OpeningAnim Finished
  public eventOnOpeningFinished: Delegate = new Delegate();

  /** START_GAME 的 Request 進來後 */
  public receiveStartGame: Delegate = new Delegate();
  /** Spin的Request進來後 */
  public receiveSpinData: Delegate = new Delegate();
  /** 獲得 SPIN ResultArgs後 */
  public receiveSpinResultArgs: Delegate = new Delegate();
  /** Fever的Request進來後 */
  public receiveFeverData: Delegate = new Delegate();
  /** 獲得 SG Request後可以獲得額外資料*/
  public receiveFeverGameDetail: Delegate = new Delegate();
  /** DoubleGame的Request進來後 */
  public receiveDoubleGameData: Delegate = new Delegate();

  /** Scatter 表演 */
  public showSpecialSymbol: Delegate = new Delegate();
  /** Scatter 表演 */
  public hideSpecialSymbol: Delegate = new Delegate();
  /** 將同步完的資產中部分贏分延後加入顯示 */
  public postponeWin: Delegate = new Delegate();
  /** 加入延後顯示的贏分 */
  public addPostponeWin: Delegate = new Delegate();

  public eventBeforeLoadingClose: Delegate = new Delegate();

  public eventGameStateChanged: Delegate = new Delegate(); //遊戲狀態改變

  /** 特殊方式觸發spin(BuyBonus、道具卡) */
  public eventTriggerSpecialSpin: Delegate = new Delegate();

  /** BuyBonus事件 */
  public eventPlayBuyBonusEffect: Delegate = new Delegate(); //播放BuyBonus特效
  public eventTransitionToBuyBonusState: Delegate = new Delegate(); //遊戲內累積類狀態轉換至BuyBonus新數值
  public eventBuyBonusSetInGameJpUI: Delegate = new Delegate(); //設定 InGameJP 節點階層
  public eventBuyBonusChangeBet: Delegate = new Delegate(); //BuyBonus介面內切換Bet
  public eventBuyBonusPanelClose: Delegate = new Delegate(); //關閉BuyBonus介面

  /** 道具卡相關事件 */
  public eventPlayItemEffect: Delegate = new Delegate(); //播放新世界道具卡轉場特效

  /** 檢查是否達到最大贏分 arg0: data, arg1: callback */
  public eventCheckMaxWin: Delegate = new Delegate();

  /** 顯示自定義最大贏分面板 arg0: value, arg1: callback */
  public eventShowCustomMaxWin: Delegate = new Delegate();

  public getWinType: Function = null;
  /** 廣播載入的下bar
   * @param bottomBar
   */
  public eventBottomBarLoaded: Delegate = new Delegate();

  /** SlotDownBar GameWin Label node */
  public bottomBarGameWinLabelNode: Node = null;

  /** SlotDownBar Total Free Spin Label node */
  public totalFreeSpinLabelNode: Node = null;

  /** SlotDownBar Spin Btn Node */
  public bottomBarSpinBtnNode: Node = null;

  /** SlotDownBar Stop Auto Btn Node */
  public bottomBarStopAutoBtnNode: Node = null;

  /** BuyBonus Btn Node */
  public buyBonusBtnNode: Node = null;

  /** OpeningAnim Finished */
  public openingAnimFinished = false;

  public onLoad() {
    if (SlotGDK.instance === null) {
      window['slotGDK'] = this;
    }
  }
  public onDestroy() {
    window['slotGDK'] = null;
  }

  /** 遊戲模組初始化(必做) */
  public initGame(): void {
    if (SlotGameMediator.instance.mainGameHost !== null) {
      SlotGameMediator.instance.mainGameHost.init();
    }
  }

  /** 設置使用語言 */
  public setUsingLanguage(_sLang: string): void {
    _sLang = (_sLang ?? '').trim().toLowerCase();
    switch (_sLang) {
      case 'en':
      case 'en-us':
        SlotGameDataEx.instance.usingLanguageType = LangType.en;
        break;
      case 'chs':
      case 'zh-cn':
        SlotGameDataEx.instance.usingLanguageType = LangType.chs;
        break;
      case 'ms':
      case 'ms-my':
        SlotGameDataEx.instance.usingLanguageType = LangType.ms;
        break;
      case 'th':
      case 'th-th':
        SlotGameDataEx.instance.usingLanguageType = LangType.th;
        break;
      case 'vi':
      case 'vi-vn':
        SlotGameDataEx.instance.usingLanguageType = LangType.vi;
        break;
      case 'id':
      case 'id-id':
        SlotGameDataEx.instance.usingLanguageType = LangType.id;
        break;
      case 'my':
      case 'my-mm':
        SlotGameDataEx.instance.usingLanguageType = LangType.my;
        break;
      case 'es':
      case 'es-es':
        SlotGameDataEx.instance.usingLanguageType = LangType.es;
        break;
      case 'pt':
      case 'pt-br':
        SlotGameDataEx.instance.usingLanguageType = LangType.pt;
        break;
      case 'it':
      case 'it-it':
        SlotGameDataEx.instance.usingLanguageType = LangType.it;
        break;
      case 'sv':
      case 'sv-se':
        SlotGameDataEx.instance.usingLanguageType = LangType.sv;
        break;
      case 'ro':
      case 'ro-ro':
        SlotGameDataEx.instance.usingLanguageType = LangType.ro;
        break;
      case 'gr':
      case 'gr-gr':
        SlotGameDataEx.instance.usingLanguageType = LangType.gr;
        break;
      case 'fr':
      case 'fr-fr':
        SlotGameDataEx.instance.usingLanguageType = LangType.fr;
        break;
      case 'zh-tw':
      case 'zhtw':
      case 'cht':
        SlotGameDataEx.instance.usingLanguageType = LangType.zh;
        break;
      case 'ja':
      case 'ja-jp':
        SlotGameDataEx.instance.usingLanguageType = LangType.ja;
        break;
      case 'ko':
      case 'ko-kr':
        SlotGameDataEx.instance.usingLanguageType = LangType.ko;
        break;
      case 'hi':
      case 'hi-in':
        SlotGameDataEx.instance.usingLanguageType = LangType.hi;
        break;
      case 'ta':
      case 'ta-in':
        SlotGameDataEx.instance.usingLanguageType = LangType.ta;
        break;
      case 'bn':
      case 'bn-in':
        SlotGameDataEx.instance.usingLanguageType = LangType.bn;
        break;
      case 'ur':
      case 'ur-in':
        SlotGameDataEx.instance.usingLanguageType = LangType.ur;
        break;
      case 'de':
      case 'de-de':
        SlotGameDataEx.instance.usingLanguageType = LangType.de;
        break;
      case 'nl':
      case 'nl-nl':
        SlotGameDataEx.instance.usingLanguageType = LangType.nl;
        break;
      case 'da':
      case 'da-dk':
        SlotGameDataEx.instance.usingLanguageType = LangType.da;
        break;
      case 'tr':
      case 'tr-tr':
        SlotGameDataEx.instance.usingLanguageType = LangType.tr;
        break;
      case 'ru':
      case 'ru-ru':
        SlotGameDataEx.instance.usingLanguageType = LangType.ru;
        break;
      default:
        SlotGameDataEx.instance.usingLanguageType = LangType.en;
        break;
    }
  }

  public getSlotSpriteFrame(symbolid: number): SpriteFrame {
    return SlotGameMediator.instance.symbolSetting.getSpriteFramebyId(symbolid);
  }

  /**  Sets position and scale rect. x,y = move pos, w,h = scale x,y */
  public setScreenOption(_OffsetV2: Vec2, _fScale: number): void {
    SlotGameDataEx.instance.screenOffsetV2 = _OffsetV2;
    SlotGameDataEx.instance.screenScale = _fScale;
  }

  public setBottomBarInfo(
    bottomBarName: string,
    panelDepth: number,
    coinPosV3: Vec3,
    spinBtnPosV3: Vec3
  ): void {
    SlotGameDataEx.instance.bottomBarName = bottomBarName;
    SlotGameDataEx.instance.bottomPanelDepth = panelDepth;
    SlotGameDataEx.instance.bottomCoinNumberPosV3 = coinPosV3;
    SlotGameDataEx.instance.bottomSpinBtnPosV3 = spinBtnPosV3;
  }

  /**
   * 塞 StartGame 賮料
   * @param _DataJson StartGame 賮料
   * */
  public setStartGameData(_DataJson: JSON): void {
    SlotGameDataEx.instance.startGameData = this.parseDataKey(_DataJson);
  }

  /**
   * 塞 Spin 賮料
   * @param _DataJson Spin 賮料
   * */
  public setSpinData(_DataJson: JSON): void {
    if (!this.checkMainGameHostExist()) return;
    if (SlotGameMediator.instance.mainGameHost !== null) {
      const data = this.parseDataKey(_DataJson);
      SlotGameDataEx.instance.spinData = data;
      SlotGameMediator.instance.mainGameHost.setSpinData(data);
    }
  }

  /**
   * 塞 Fever 賮料
   * @param _DataJson Fever 賮料
   * */
  public setNextFeverData(_DataJson: JSON): void {
    if (!this.checkMainGameHostExist()) return;
    if (SlotGameMediator.instance.mainGameHost !== null) {
      const data = this.parseDataKey(_DataJson);
      SlotGameDataEx.instance.nextFeverData = data;
      SlotGameMediator.instance.mainGameHost.setFeverGameData(data);
    }
  }

  /** 和Sever要inGameJp賮料 */
  public sendInGameJackpotData(): void {
    if (this.eventSendInGameJackpotInfoCmd.length > 0) {
      this.eventSendInGameJackpotInfoCmd.notify();
    }
  }

  /** 塞inGameJp賮料 */
  public setInGameJackpotData(_DataJson: JSON, duration: number): void {
    if (this.eventSetInGameJackpotData.length > 0) {
      SlotGameDataEx.instance.inGameJPData = this.parseDataKey(_DataJson);
      this.eventSetInGameJackpotData.notify(
        this.parseDataKey(_DataJson),
        duration
      );
    }
  }

  /** 和Sever要DoubleGame賮料 */
  public sendDoubleGameData(data): void {
    if (this.eventSendDoubleGameCmd.length > 0) {
      this.eventSendDoubleGameCmd.notify(data);
    }
  }

  /** b塞DoubleGame賮料 */
  public setDoubleGameData(_DataJson: JSON): void {
    if (this.eventSetDoubleGameData.length > 0) {
      this.eventSetDoubleGameData.notify(this.parseDataKey(_DataJson));
    }
  }

  /**
   * 設定是否靜音
   * @param _bMuted set true to mute.
   */
  public setMuted(_bMuted: boolean): void {
    if (!this.checkMainGameHostExist()) {
      return;
    }

    //// SlotAudioManager待重構
    if (SlotGameMediator.instance.audioManager !== null) {
      SlotGameMediator.instance.audioManager.setGameMute(_bMuted);
    }
  }

  // /**
  //  * Sets the sound volume. (目前無用)
  //  * @param volume Volume
  //  */
  // public setSoundVolume(volume: number): void {}

  /** 壓低MainGameBGM音量 */
  public setMainGameBGMToLower() {
    SlotGameMediator.instance.mainGameHost.fadeOutMainGameBGM();
  }

  // /** 控制BottomBar Enable(可不可以操作)  (目前無用)*/
  // public setInputEnabled(enabled: boolean): void {
  //   if (!this.checkMainGameHostExist()) {
  //     return;
  //   }
  // }

  /**
   * 控制轉輪流程暫停
   * @param _bIsWaiting set true to stall game.
   */
  public setProcessToWaiting(_bIsWaiting: boolean): void {
    if (!this.checkMainGameHostExist()) {
      return;
    }

    if (SlotGameMediator.instance.mainGameHost !== null) {
      SlotGameMediator.instance.mainGameHost.setStopProcess(_bIsWaiting);
    }
  }

  /** 更新 Bet賮料  (目前無用) */
  public setBetInfo(
    _iLinesOrCost: number,
    _dBetValue: number,
    _dTotalBetValue: number,
    _BetTextColor: Color
  ): void {
    SlotGameDataEx.instance.isLinesOrCost = _iLinesOrCost;
    SlotGameDataEx.instance.betValue = _dBetValue;
    SlotGameDataEx.instance.totalBetValue = _dTotalBetValue;
    SlotGameDataEx.instance.betTextColor = _BetTextColor;
  }
  /** 關閉報獎 */
  public hideAllAward(): void {
    if (SlotGameMediator.instance.awardController !== null) {
      SlotGameMediator.instance.awardController.hideAllAward();
    } else {
      if (Define.DEBUG_LOG) {
        console.error('[SlotGDK] [HideAllAward] AwardController is null !!');
      }
    }
  }

  /** 關閉中獎特效 (垃圾話 or BigWin...) */
  public closeAwardWinEffect(): void {
    if (SlotGameMediator.instance.awardController !== null) {
      SlotGameMediator.instance.awardController.resetWinEffect();
    } else {
      if (Define.DEBUG_LOG) {
        console.error('[SlotGDK] [HideAllAward] AwardControlleris null !!');
      }
    }
  }

  public getPlayMode(): GamePlayMode {
    if (SlotGameMediator.instance.mainGameHost !== null) {
      return SlotGameMediator.instance.mainGameHost.getNowPlayMode();
    } else {
      return GamePlayMode.None;
    }
  }

  public isReadyToEnterSG(): boolean {
    return SlotGameMediator.instance.mainGameHost.isReadyToEnterSG();
  }

  public isItemAward(): boolean {
    return SlotGameDataEx.instance.isItemAwarding;
  }

  /**
   * 判斷MainGameHostEx存不存在
   * @returns true if main game host exist was checked
   */
  private checkMainGameHostExist(): boolean {
    if (SlotGameMediator.instance.mainGameHost === null) {
      if (Define.DEBUG_LOG) {
        console.error(
          '[SlotGDK] [CheckMainGameHostExist] MainGameHost not found'
        );
      }
      return false;
    }
    return true;
  }

  private parseDataKey(_Json: JSON): JSON {
    if (_Json.hasOwnProperty('data')) {
      const _DataJson: JSON = _Json['data'];
      return _DataJson;
    }
    return null;
  }

  // public setDynamicUIDepthMax(
  //   iDepth: number,
  //   WinTypeAbove: WinType = WinType.NoWin
  // ): void {}

  private listDelegate: Delegate[] = [];

  private listFunction: Function[] = [];

  /**
   * 取得一個事件來註冊或呼叫
   * @param index 事件名稱 (若是多模組公用請在 EventSystem 下方新增 Global 變數)
   * @returns Delegate
   */
  public static event(index: string): Delegate {
    if (SlotGDK.instance.listDelegate[index]) {
      return SlotGDK.instance.listDelegate[index];
    } else {
      SlotGDK.instance.listDelegate[index] = new Delegate();
      return SlotGDK.instance.listDelegate[index];
    }
  }

  /**
   * 取得一個 Function
   * @param index 提供者註冊的 Function 名稱 (若是多模組公用請使用 EventSystem 下方 Global 變數)
   * @returns Function
   */
  public static function(index: string) {
    if (SlotGDK.instance.listFunction[index]) {
      return SlotGDK.instance.listFunction[index];
    } else {
      return () => {
        console.warn("There is no Function registered named '" + index + "'");
      };
    }
  }

  /**
   * 註冊一個 Function
   * @param index 要註冊的 Function 名稱 (若是多模組公用請在 EventSystem 下方新增 Global 變數)
   * @param callBack 要註冊的 Function
   */
  public static registerFunction(index: string, callBack: Function): void {
    if (SlotGDK.instance.listFunction[index]) {
      console.warn(
        "There is already a Function registered named '" +
          index +
          "'\n System will cancell the registration!"
      );
    } else {
      SlotGDK.instance.listFunction[index] = new Function();
      SlotGDK.instance.listFunction[index] = callBack;
    }
  }

  public static unregisterFunction(index: string): void {
    if (SlotGDK.instance.listFunction[index]) {
      SlotGDK.instance.listFunction[index] = null;
    } else {
      console.warn(
        "There is no Function registered named '" +
          index +
          "'\n System will do Nothing!"
      );
    }
  }

  public static destroy(): void {
    for (let i of SlotGDK.instance.listDelegate) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      i = null;
    }
    SlotGDK.instance.listDelegate = null;

    for (let i of SlotGDK.instance.listFunction) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      i = null;
    }
    SlotGDK.instance.listFunction = null;
  }

  public betNumberNode: Node = null;
}

export enum Audio {
  /**
   * [Function] 撥放指定名稱音效
   * @param name 音效設定名稱
   * @returns 音效撥放 ID (number)
   */
  Play = '[Audio]_Play',
  /**
   * [Event] 停止指定音效
   * @param audioID 音效撥放 ID
   */
  Stop = '[Audio]_Stop',
}

export enum DropRule {
  /**
   * [Event] 讓 Rule 進行檢查
   * @param wheelIndex 要更新的 Wheel Index
   * @param wheelResult Wheel 結果 number[][]
   */
  SingleWheel = '[Drop]_SingleWheel',
}

/** 接受 Prefab 的 Symbol */
export enum DropSymbolPrefab {
  /**
   * [Event] 撥放動畫
   * @param bingoMap 要撥放中獎的位置 BitMap number[][]
   * @param maskMap 要撥放遮罩的位置 BitMap number[][]
   * @param type 動畫種類 enumAnimaType
   */
  ShowAnimation = '[Drop]_ShowAnimation',

  /**
   * [Event] 停止動畫
   * @param bingoMap 要停止中獎的位置 BitMap number[][]
   * @param type 動畫種類 enumAnimaType
   */
  EndAnimation = '[Drop]_EndAnimation',

  /**
   * [Event] 根據當前停輪牌面,生成轉輪框上層的 Symbol
   */
  ShowOffClipping = '[Drop]_ShowOffClipping',

  /**
   * [Event] 根據當前停輪牌面,生成轉輪框上層的 Symbol
   */
  HideOffClipping = '[Drop]_HideOffClipping',

  /**
   * [Event] 將所有 Symbol 開啟
   */
  ShowAllSymbol = '[Drop]_ShowAllSymbol',
}
