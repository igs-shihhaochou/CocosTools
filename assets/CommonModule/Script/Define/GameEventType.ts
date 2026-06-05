enum Control {
  /**
   * 調整圖層(z-index)
   * @param {string} platform
   * @param {string} game
   */
  Layer = 'Control.Layer',
  /**
   * 調整圖層(z-index)
   * @param {string} active
   * @param {string} interactable
   */
  Activity = 'Control.Activity',
  /**
   * 音效設定
   * @param {boolean} mute
   */
  Mute = 'Control.Mute',
  /**
   * 游標設定
   * @param {string} style
   */
  Cursor = 'Control.Cursor',
  /**
   * Debug資訊顯示
   * @param {boolean} show
   */
  Stats = 'Control.Stats',
  /**
   * 切換/跳轉遊戲
   * @param {string} gameName
   */
  ChangeGame = 'Control.ChangeGame',
}

enum Open {
  /**
   * 開啟 Purcahse 頁面
   */
  Purchase = 'Open.Purchase',
  /**
   * 開啟 Profile 頁面
   */
  Profile = 'Open.Profile',
  /**
   * 開啟 他家Profile 頁面
   * @param {string} playerPinID
   * @param {number} winnings
   * @param {number} entries
   */
  OtherProfile = 'Open.OtherProfile',
}

enum GameFlow {
  /**
   * 玩家開始載入遊戲
   */
  LoadingStart = 'GameFlow.LoadingStart',
  /**
   * 玩家開始載入遊戲
   */
  LoadingFinish = 'Log.LoadingFinish',
  /**
   * 玩家載入完成，Loading 頁面關閉
   */
  LoadingClose = 'Log.LoadingClose',
  /**
   * 玩家回到 IDLE
   */
  BetWait = 'GameFlow.BetWait',
  /**
   * 玩家按下遊玩按鈕
   */
  Spin = 'GameFlow.Spin',
  /**
   * 玩家進入特殊遊戲
   */
  SpecialGame = 'GameFlow.SpecialGame',
  /**
   * 紀錄玩家離開遊戲
   */
  ExitGame = 'Log.ExitGame',
}

enum Log {
  /**
   * 紀錄玩家切押資訊
   * @param {number} currentLineBet
   * @param {number} currentTotalBet
   * @param {number} originalLineBet
   * @param {number} originalTotalBet
   */
  ChangeBet = 'Log.ChangeBet',
  /**
   * 紀錄玩家點擊 Preview
   */
  ClickPreview = 'Log.ClickPreview',
  /**
   * 紀錄玩家開啟 Preview
   */
  ShowPreview = 'Log.ShowPreview',
  /**
   * 紀錄玩家關閉 Preview
   */
  ClosePreview = 'Log.ClosePreview',
  /**
   * 紀錄玩家在 Preview 點擊遊玩
   */
  PlayPreview = 'Log.PlayPreview',
  /**
   * 紀錄玩家開啟 Info
   */
  Info = 'Log.Info',
  /**
   * 記錄玩家按下Turbo
   */
  Turbo = 'Log.Turbo',
  /**
   * 紀錄玩家使用AutoSpin遊玩
   * @param {number} numberOfSpin // -1:無限次
   * @param {boolean} stopOnSpecialFeatureWin
   * @param {number} singleWinExceeds  //超過N倍停止
   * @param {number} takeProfitLimit //淨利達到N停止
   * @param {number} takeLossLimit //淨損達到N停止
   */
  Auto = 'Log.AutoSpin',
  /**
   * 紀錄遊戲送出的跑馬燈資訊
   * @param {JSON} data
   */
  AchieveMarquee = 'Log.AchieveMarquee',
  /**
   * 紀錄遊戲發生錯誤
   * @param {string} errorCode 錯誤代碼
   * @param {number} priority 錯誤優先級
   */
  GameError = 'Log.GameError',
  /**
   * 紀錄平台和遊戲內資產不一致的資訊
   * @param {number} retryCount 跟遊戲重拿資產次數
   */
  AssetMismatch = 'Log.AssetMismatch',
}

enum Balance {
  /**
   * 更新玩家資產
   * @param {number} balance
   * @param {number} entries
   * @param {number} winnings
   */
  UpdateAsset = 'Balance.UpdateAsset',
  /**
   * 更新玩家 Balance (NoScoreBox-Balance)
   * @param {number} balance
   */
  UpdateBalance = 'Balance.UpdateBalance',
  /**
   * 更新玩家 Entries (ScoreBox-Entries)
   * @param {number} entries
   */
  UpdateEntries = 'Balance.UpdateEntries',
  /**
   * 更新玩家 Winnings (ScoreBox-Winnings)
   * @param {number} winnings
   */
  UpdateWinnings = 'Balance.UpdateWinnings',
  /**
   * 通知平台玩家資產不足（玩家確認資產不足提示後）
   */
  InsufficientAmount = 'Balance.InsufficientAmount',
}

enum Interrupt {
  /**
   * 中斷遊戲
   */
  Play = 'Interrupt.Play',
  /**
   * 呼叫離開遊戲
   */
  Leave = 'Interrupt.Leave',
  /**
   * 網頁刷新
   */
  Refresh = 'Interrupt.Refresh',
}

enum Player {
  // === 請求事件 (遊戲 → 平台) ===
  /**
   * 取玩家名稱
   */
  GetName = 'Player.GetName',
  // === 回應事件 (平台 → 遊戲) ===
  /**
   * 更新玩家名稱
   * @param {string} playerName
   */
  UpdateName = 'Player.UpdateName',
}

enum Profile {
  // === 請求事件 (遊戲 → 平台) ===
  /**
   * 請求取得玩家頭像
   * @param {string} id  頭像id
   * @param {string} ark_id  玩家ark_id
   */
  GetAvatar = 'Profile.GetAvatar',
  /**
   * 請求取得玩家頭像框
   * @param {string} id  頭像框id
   * @param {string} ark_id  玩家ark_id
   */
  GetAvatarFrame = 'Profile.GetAvatarFrame',
  /**
   * 收到破紀錄資料
   * @param {number} rewardType
   */
  ReceiveReward = 'Profile.ReceiveReward',

  // === 回應事件 (平台 → 遊戲) ===
  /**
   * 玩家頭像載入完成 (回應 GetAvatar)
   * @param {string} base64Data  頭像base64數據 (data:image/png;base64,...)
   * @param {string} ark_id  玩家ark_id
   */
  AvatarLoaded = 'Profile.AvatarLoaded',
  /**
   * 玩家頭像框載入完成 (回應 GetAvatarFrame)
   * @param {string} base64Data  頭像框base64數據 (data:image/png;base64,...)
   * @param {string} ark_id  玩家ark_id
   */
  AvatarFrameLoaded = 'Profile.AvatarFrameLoaded',
  /**
   * 更新玩家暱稱
   * @param {string} nickname  玩家暱稱
   * @param {string} ark_id  玩家ark_id
   */
  UpdateNickname = 'Profile.UpdateNickname',
}

enum Jackpot {
  // === 回應事件 (遊戲 → 平台) ===
  /**
   * 檢查是否為候選人，若是則平台送出JP請求封包
   * @param {string} group JP類型
   * @param {number} totalBet TotoalBet但不含JPBet
   */
  Check = 'Jackpot.Check',
  // === 通知事件 (平台 → 遊戲) ===
  /**
   * 收到中獎候選訊號，平台需跟遊戲取bet
   * @param {string} group JP類型
   */
  Candidate = 'Jackpot.Candidate',
  /**
   * 中獎通知
   * @param {number} winValue 中獎金額
   */
  Win = 'Jackpot.Win',
}

export const ActivityFWToPlatform = {
  /**
   * 控制平台端活動與行為 (未來逐步淘汰)
   */
  Control,
  /**
   * 通知平台端玩家資產變動
   */
  Balance,
  /**
   * 紀錄玩家遊玩事件 (Optional)
   */
  Log,
  /**
   * 通知平台端開啟頁面
   */
  Open,
  /**
   * 通知平台端遊戲流程
   */
  GameFlow,
  /**
   * 跟平台端取玩家資料
   */
  Player: {
    /** 'Player.GetName' */
    GetName: Player.GetName,
  },
  /**
   * 跟平台端取得Profile資訊
   */
  Profile: {
    /** 'Profile.GetAvatar' */
    GetAvatar: Profile.GetAvatar,
    /** 'Profile.GetAvatarFrame' */
    GetAvatarFrame: Profile.GetAvatarFrame,
    /** 'Profile.ReceiveReward' */
    ReceiveReward: Profile.ReceiveReward,
  },
  /**
   * 通知平台端JP資訊
   */
  Jackpot: {
    /** 'Jackpot.Check' */
    Check: Jackpot.Check,
  },
};

export const ActivityFWToGame = {
  /**
   * 通知遊戲端玩家資產變動
   */
  Balance,
  /**
   * 通知遊戲端平台發生錯誤
   */
  Interrupt,
  /**
   * 給遊戲端玩家資料
   */
  Player: {
    /** 'Player.UpdateName' */
    UpdateName: Player.UpdateName,
  },
  /**
   * 給遊戲端Profile資料
   */
  Profile: {
    /** 'Profile.AvatarLoaded' */
    AvatarLoaded: Profile.AvatarLoaded,
    /** 'Profile.AvatarFrameLoaded' */
    AvatarFrameLoaded: Profile.AvatarFrameLoaded,
    /** 'Profile.UpdateNickname' */
    UpdateNickname: Profile.UpdateNickname,
  },
  /**
   * 通知遊戲端JP資訊
   */
  Jackpot: {
    /** 'Jackpot.Candidate' */
    Candidate: Jackpot.Candidate,
    /** 'Jackpot.Win' */
    Win: Jackpot.Win,
  },
};

export const sendGameEventToPlatform = (name: string, args?) => {
  window.parent.postMessage({name, ...args, type: 'act-fw', from: 'game'}, '*');
};
