export enum CertIdList {
  None,
  GLI,
  BMM,
  GA,
}

export enum CertAreaList {
  None,
  Malta,
  Italy,
  Greece,
  Sweden,
  Switzerland,
  UKGC,
  Ontario,
  Spain,
  Romania,
  Brazil,
  Denmark,
  Portugal,
  Netherlands,
  Germany,
}

/**
 * SwitchOff定義
 */
export enum SwitchOffKeyDefine {
  shoppingMall = 1, // 關閉內購
  smartMessage = 2, // 關閉智能訊息
  promotion = 3, // 關閉推薦收藏
  treasureChest = 4, // 關閉百寶箱ICON
  gameHistory = 5, // 關閉歷程
  featuredDisplay = 6, // 關閉特色遊玩功能
  coinAccuracy = 7, // 強制顯示小數點後兩位
  currencySymbol = 8, // 關閉幣別符號
  itemBoxImport = 9, // 背包跳轉 TODO可移除
  allChangeGameImport = 10, // 關閉遊戲跳轉
  autoPlay = 11, // 關閉自動玩
  isDelay = 12, // 是否需要延遲進入下一局，有的話要延遲 TODO可移除
  closeSpeedUp = 13, // 關閉快停
  closeBackpack = 14, // 關閉背包
  trail = 15, // 關閉洗碼(免費贈金)
  showAutoSetting = 16, // 自動玩需先開啟設定面板 (遊戲端使用)
  noSoundUnder1 = 17, // 贏分大於1倍才能有音效 (遊戲端使用)
  noQuickSpin = 18, // 禁用空白鍵、盤面的Spin功能 (遊戲端使用)
  infoOnView = 19, // 遊戲說明按鈕(?那顆)要在主畫面 (公版使用)
  showPlateformVer = 20, // 顯示平台版本號 (公版使用)
  showTime = 21, // 顯示時間 (公版使用)
  showPlayTime = 22, // 顯示遊玩時間 (公版使用)
  blockLobbyOff = 23, // 區塊鍊競猜大廳關閉(未開啟)
  noRedSpot = 24, // 贏更多不顯示紅點
  closeVip = 25, // 不顯示VIP資訊
  closeBuyBonusInfo = 26, // 不顯示內購的說明按鈕
  closeSettingInfo = 27, // 不顯示設定內說明頁按鈕 TODO可移除
  useKilo = 28, // 使用千位數縮寫
  clickAutoSetting = 29, // 送審自動玩面板選項打開 TODO暫無使用
  closeBuyBonusAdd = 30, // buybonus面板加減關閉 TODO暫無使用
  removeDecimal = 31, // 不顯示小數點
  showBuyBonusBetInfo = 32, // 開啟BuyBonus押注資訊
  closeWinTxtWithZero = 33, // 贏分為0時關閉WIN文字
  showNetWin = 34, // 顯示淨利
  closeSideFeatures = 35, // 關閉周邊機制 (送審用;buybonus不受此限制)
  realityCheck = 36, // 開啟防沉迷機制
  closeJPList = 37, // 關閉JP中獎歷史紀錄
  disableSettingInfo = 38, // 不啟用說明頁按鈕 (送審規範：Spin和FG時說明頁按鈕不可點擊)
  closeManual = 39, // 關閉特色描述 (送審規範：不顯示特色描述)
  closeHotChilli = 40, // 關閉Loading的辣椒數量
  closeFreeSpin = 41, // 關閉FreeSpin介面與按鈕
  closeTiggerRank = 42, // 關閉龍虎榜
  openTurbo = 43, // 開啟Turbo
  closeAutoShowEventWebView = 44, // 關閉自動Show活動WebView
  closeLiveBet = 45, // 關閉LiveBet
  closeYTHelpInfo = 46, // 關閉設定欄內YT說明影片
  closeYTSuggest = 47, // 關閉winmore的推薦頁面內YT說明影片
  closePlayTogether = 48, // 關閉共玩
  closeAutoShowWinmore = 49, // 關閉自動顯示winmore
  closeIntroADs = 50, // 關閉intro loading廣告頁籤
  closeOrientationNotice = 51, // 關閉直橫屏旋轉提示
  closeVolumeControl = 52, // 關閉音量控制介面
  loadLiteMode = 53, // 開啟載入小包設定
  closeAfricaLiteMode = 54, // 關閉非洲小包設定
  autoShowPayTable = 55, // 自動顯示PayTable
  showAgeLimitHint = 56, // 顯示年齡限制提示
  closeFreeSpinPauseBtn = 57, // 關閉FreeSpin暫停按鈕
  showCloseGameBtn = 58, // 開啟關閉遊戲按鈕
  showRTP = 59, // 顯示RTP
}

export enum CLIENTMODE_ID {
  maxRound = 1, //自動玩最大局數
  delayTime = 2, //每局間隔時間
  roundBtn = 3, //自動玩局數快捷
  realityCheckInterval = 6, //防沉迷機制時間
  idleTime = 8, //閒置時間
}

export interface IClientMode {
  eventId: number;
  value: any[];
}

/**
 * 認證要啟用的SwitchOff定義
 * @param certId 認證機構
 * @param certArea 認證地區
 */
export function GetSetting(certId: number, certArea: number): number[] {
  if (certId === 0 || certArea === 0) return [];

  // 只要是送審環境就是全關的功能
  const switchOffList = [
    SwitchOffKeyDefine.smartMessage, // 關閉智能訊息
    SwitchOffKeyDefine.showAutoSetting, // 自動玩需先開啟設定面板
    SwitchOffKeyDefine.showPlateformVer, // 顯示平台版本號
    SwitchOffKeyDefine.showTime, // 顯示時間
    SwitchOffKeyDefine.showPlayTime, // 顯示遊玩時間
    SwitchOffKeyDefine.closeBuyBonusInfo, // 不顯示內購的說明按鈕
    SwitchOffKeyDefine.showBuyBonusBetInfo, // 開啟BuyBonus押注資訊
    SwitchOffKeyDefine.closeWinTxtWithZero, // 贏分為0時關閉WIN文字
    SwitchOffKeyDefine.showRTP, // 顯示RTP
  ];

  switch (certArea) {
    // 內購關閉、禁止假贏表演、禁止快停、禁止自動玩  包含全部的UKGC、加拿大Ontario
    case CertAreaList.UKGC:
    case CertAreaList.Ontario: {
      switchOffList.push(
        SwitchOffKeyDefine.autoPlay,
        SwitchOffKeyDefine.shoppingMall,
        SwitchOffKeyDefine.closeSpeedUp,
        SwitchOffKeyDefine.noSoundUnder1,
        SwitchOffKeyDefine.noQuickSpin
      );
      break;
    }

    //禁止快停
    case CertAreaList.Sweden:
    case CertAreaList.Greece:
    case CertAreaList.Spain: {
      switchOffList.push(SwitchOffKeyDefine.closeSpeedUp);
      break;
    }

    // 進遊戲後主動跳出賠付表、顯示年齡限制提示  包含全部的巴西
    case CertAreaList.Brazil: {
      switchOffList.push(
        SwitchOffKeyDefine.autoShowPayTable,
        SwitchOffKeyDefine.showAgeLimitHint
      );
      break;
    }
  }

  // GLI義大利禁止自動玩(二組特規)
  if (certId === CertIdList.GLI && certArea === CertAreaList.Italy)
    switchOffList.push(SwitchOffKeyDefine.autoPlay);

  // 淨額跟防沉迷  包含全部的GA
  switch (certId) {
    case CertIdList.GA: {
      switchOffList.push(SwitchOffKeyDefine.showNetWin);
      switchOffList.push(SwitchOffKeyDefine.infoOnView);
    }
  }

  // 幫助頁按紐外顯  包含全部的Malta
  switch (certArea) {
    case CertAreaList.Malta: {
      // switchOffList.push(SwitchOffKeyDefine.infoOnView);
      break;
    }
  }

  // 禁止多人共玩
  switch (certArea) {
    case CertAreaList.Brazil: {
      switchOffList.push(SwitchOffKeyDefine.closePlayTogether);
      break;
    }
  }
  // 防沉迷機制
  switch (certArea) {
    case CertAreaList.UKGC:
    case CertAreaList.Romania:
    case CertAreaList.Ontario: {
      switchOffList.push(SwitchOffKeyDefine.realityCheck);
      break;
    }
  }

  return switchOffList;
}

export function GetClientMode(certId: number, certArea: number): IClientMode[] {
  if (certId === 0 || certArea === 0) return [];

  const clientMode: IClientMode[] = [];

  // MAX_ROUND = 1 自動玩最大局數
  let maxRound = 0;
  switch (certArea) {
    case CertAreaList.Spain:
      maxRound = 100;
      break;
  }
  if (maxRound > 0) {
    clientMode.push({eventId: CLIENTMODE_ID.maxRound, value: [maxRound]});
  }

  // DELAY_TIME = 2 每局間隔時間
  let delayTime = 0;
  switch (certArea) {
    case CertAreaList.Greece:
      delayTime = 2;
      break;
    case CertAreaList.Sweden:
      delayTime = 3;
      break;
    case CertAreaList.UKGC:
      delayTime = 3;
      break;
    case CertAreaList.Ontario:
      delayTime = 3;
      break;
    case CertAreaList.Spain:
      delayTime = 3;
      break;
    case CertAreaList.Portugal:
      delayTime = 3;
      break;
  }
  if (delayTime > 0) {
    clientMode.push({eventId: CLIENTMODE_ID.delayTime, value: [delayTime]});
  }

  // ROUND_BTN = 3 自動玩局數快捷
  let roundBtn = [];
  switch (certArea) {
    case CertAreaList.Spain:
      roundBtn = [25, 50, 75, 100];
      break;
  }
  if (roundBtn.length > 0) {
    clientMode.push({eventId: CLIENTMODE_ID.roundBtn, value: roundBtn});
  }

  // REALITY_CHECK_INTERVAL = 6 防沉迷機制時間
  let realityCheckInterval = 0;
  switch (certArea) {
    case CertAreaList.UKGC:
      realityCheckInterval = 1800;
      break;
    case CertAreaList.Romania:
      realityCheckInterval = 3600;
      break;
    case CertAreaList.Ontario:
      realityCheckInterval = 1800;
      break;
  }
  if (realityCheckInterval > 0) {
    clientMode.push({
      eventId: CLIENTMODE_ID.realityCheckInterval,
      value: [realityCheckInterval],
    });
  }

  // IDLE_TIME = 8 閒置時間
  let idleTime = 0;
  switch (certArea) {
    case CertAreaList.Ontario:
      idleTime = 120;
      break;
    case CertAreaList.Spain:
      idleTime = 120;
      break;
    case CertAreaList.Brazil:
      idleTime = 120;
      break;
  }
  if (idleTime > 0) {
    clientMode.push({eventId: CLIENTMODE_ID.idleTime, value: [idleTime]});
  }

  return clientMode;
}

/**
 * 判斷是否是GLI環境
 * @param certId 認證機構
 */
export function isGLI(certId: number): boolean {
  return certId === CertIdList.GLI;
}

/**
 * 判斷是否是GA環境
 * @param certId 認證機構
 */
export function isGA(certId: number): boolean {
  return certId === CertIdList.GA;
}

/**
 * 取得地區最大Bet
 * 回傳值的幣別為正在使用的幣別，比如玩家登入幣別是美元，回傳20就代表20美元
 * @param certArea 認證地區
 */
export function getMaxBet(certArea: number): number {
  switch (certArea) {
    case CertAreaList.Greece:
      return 20;
  }

  return Number.MAX_SAFE_INTEGER;
}
