export type LogoSetting = {
  GetSSOKeyInfo: {
    Enable: boolean; // 是否啟用SSOKeyInfo
    RetryTimes: number; // 重試次數
    RetryDelay: number; // 重試延遲 (秒)
  };
  EnableTryReload: boolean; // 關閉遊戲時是否嘗試重整頁面
};
