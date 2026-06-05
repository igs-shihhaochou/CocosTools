export type LicenseSetting = {
  showGameName: boolean; //顯示遊戲名稱
  showTime: boolean; //顯示時間
  showPlayTime: boolean; //顯示遊玩時間
  showNetWin: boolean; //顯示淨贏
  showFullScreenBtn: boolean; //顯示全螢幕按鈕
  showHomeBtn: boolean; //顯示首頁按鈕
  infoOnView: boolean; //遊戲畫面中顯示info按鈕
  closeWinTxtWithZero: boolean; //贏分為0時關閉WIN文字
  showMaxBet: boolean; //顯示最大押注按鈕
  showCurrencySymbol: boolean; //顯示貨幣符號
  showCurrencySymbolBet: boolean; //顯示押注金額的貨幣符號
  showCurrencySymbolWin: boolean; //顯示贏分的貨幣符號
  enablePlatformJP: boolean; //啟用平台JP
  infoMaxPayout: number; //最大派彩
  infoMaxWinOdds: number; //最大贏分倍率
  infoMinBet: number; //最小押注
  infoMaxBet: number; //最大押注
  currencySymbol: string; //貨幣符號
  showTurboBtn: boolean; //顯示加速按鈕
  showAutoBtn: boolean; //顯示自動按鈕
  oddsInfo: []; //賠率資訊,
  logShowEndBalance: boolean; //遊戲log是否顯示結算金額
  // New entries from switchOffDefine
  showAutoSetting: boolean; //自動玩需先開啟設定面板
  noQuickSpin: boolean; //禁用空白鍵、盤面的Spin功能
  showPlateformVer: boolean; //顯示平台版本號
  blockLobbyOff: boolean; //區塊鍊競猜大廳關閉(未開啟)
  noRedSpot: boolean; //贏更多不顯示紅點
  closeVip: boolean; //不顯示VIP資訊
  closeBuyBonusInfo: boolean; //不顯示內購的說明按鈕
  closeSettingInfo: boolean; //不顯示設定內說明頁按鈕 TODO可移除
  useKilo: boolean; //使用千位數縮寫
  clickAutoSetting: boolean; //送審自動玩面板選項打開 TODO暫無使用
  closeBuyBonusAdd: boolean; //buybonus面板加減關閉 TODO暫無使用
  removeDecimal: boolean; //不顯示小數點
  showBuyBonusBetInfo: boolean; //開啟BuyBonus押注資訊
  closeSideFeatures: boolean; //關閉周邊機制 (送審用;buybonus不受此限制)
  realityCheck: boolean; //開啟防沉迷機制 TODO暫無使用
  closeJPList: boolean; //關閉JP中獎歷史紀錄
  disableSettingInfo: boolean; //不啟用說明頁按鈕 (送審規範：Spin和FG時說明頁按鈕不可點擊)
  closeManual: boolean; //關閉特色描述 (送審規範：不顯示特色描述)
  closeHotChilli: boolean; //關閉Loading的辣椒數量
  closeFreeSpin: boolean; //關閉FreeSpin介面與按鈕
  closeTiggerRank: boolean; //關閉龍虎榜
  openTurbo: boolean; //開啟Turbo
  closeAutoShowEventWebView: boolean; //關閉自動Show活動WebView
  showBtnInfo: boolean; // 顯示Button資訊 (GD不顯示),
  showBetInfo: boolean; // 顯示最大bet/最小bet/maxPayout/maxOdds資訊(送審用,其餘不顯示Ｆ)
  extraInfo?; //額外資訊
  rtp?: number; //RTP
  infoMaxLines?: number; //最大線數
  autoShowPayTable?: boolean; //自動顯示PayTable
  noSoundUnder1?: boolean; //贏分大於1倍才能有音效 (遊戲端使用)
  isDelay?: boolean; //是否需要延遲進入下一局，有的話要延遲
  autoPlay?: boolean; //關閉自動玩 (true:關閉, false:開啟)
  closeSpeedUp?: boolean; // 關閉快停 (true:關閉, false:開啟)
  probId?: string; //機率ID
  socialAPI?: boolean; //北美API，顯示特製UI、Info、禁字調整
  extraBetRtp?: number; //額外押注RTP,
  buyBonusDataList?: any[]; //BuyBonus資料列表
};

const defaultLicenseSetting: LicenseSetting = {
  showGameName: false,
  showTime: false,
  showPlayTime: false,
  showNetWin: false,
  showFullScreenBtn: false,
  showHomeBtn: false,
  infoOnView: false,
  closeWinTxtWithZero: false,
  showMaxBet: false,
  showCurrencySymbol: true,
  showCurrencySymbolBet: true,
  showCurrencySymbolWin: true,
  enablePlatformJP: false,
  infoMaxPayout: 80,
  infoMaxWinOdds: 80,
  infoMinBet: 80,
  infoMaxBet: 80,
  currencySymbol: null,
  showTurboBtn: true,
  showAutoBtn: true,
  oddsInfo: [],
  logShowEndBalance: true,
  autoPlay: false,
  isDelay: false,
  closeSpeedUp: false,
  showAutoSetting: false,
  noSoundUnder1: false,
  noQuickSpin: false,
  showPlateformVer: false,
  blockLobbyOff: false,
  noRedSpot: false,
  closeVip: false,
  closeBuyBonusInfo: false,
  closeSettingInfo: false,
  useKilo: false,
  clickAutoSetting: false,
  closeBuyBonusAdd: false,
  removeDecimal: false,
  showBuyBonusBetInfo: false,
  closeSideFeatures: false,
  realityCheck: false,
  closeJPList: false,
  disableSettingInfo: false,
  closeManual: false,
  closeHotChilli: false,
  closeFreeSpin: false,
  closeTiggerRank: false,
  openTurbo: false,
  closeAutoShowEventWebView: false,
  autoShowPayTable: false,
  showBtnInfo: true,
  showBetInfo: true,
};

export type LicenseClientModeSetting = {
  maxRound?: number[]; //自動玩最大局數
  delayTime?: number[]; //每局間隔時間
  roundBtn?: any[]; //自動玩局數快捷
  realityCheckInterval?: number[]; //防沉迷機制時間
  idleTime?: number[]; //閒置時間
};

const defaultLicenseClientModeSetting: LicenseClientModeSetting = {
  maxRound: [],
  delayTime: [],
  roundBtn: [],
  realityCheckInterval: [],
  idleTime: [],
};

export {defaultLicenseSetting, defaultLicenseClientModeSetting};
