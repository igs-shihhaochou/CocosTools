/**
 * GameInfo 系統錯誤代碼定義
 * 根據 Protocol 文檔定義
 */
export namespace GameInfoErrorCode {
  /** 成功 */
  export const SUCCESS = 0;

  /** 參數錯誤(ark_id) */
  export const INVALID_ARK_ID = -20;

  /** 查無遊戲列表 */
  export const NO_GAME_LIST = -11001;
}

/**
 * 錯誤訊息對應表
 */
export const GameInfoErrorMessages = {
  [GameInfoErrorCode.SUCCESS]: '成功',
  [GameInfoErrorCode.INVALID_ARK_ID]: 'ARK ID 參數錯誤',
  [GameInfoErrorCode.NO_GAME_LIST]: '查無遊戲列表',
};
