export default class GameErrorCode {
  //#region HTML5 Message
  //=======================================================
  /** Token 無效 */
  public static LOGINFAILED_VERIFY_FAILED = 100;
  /** 瀏覽器錯誤 */
  public static HTML5_BROWSER_ERROR = 50000;
  /** 不支援WebGL */
  public static HTML5_WEBGL_NOT_SUPPORT = 50001;
  /** 遊戲異常 */
  public static HTML5_GAME_ERROR = 50002;
  /** 請重新登入遊戲 (Server關閉或沒有網路) */
  public static MAINTENANCE = 254;
  /** 網路不穩 */
  public static UNKNOWN = 255;
  //=======================================================
  //#endregion HTML5 Message

  //#region Server Message
  //=======================================================
  /** SSOLogin Data錯誤 */
  public static SSOLOGIN_DATA_ERROR = 200001;
  /** Token Data錯誤 */
  public static TOKEN_DATA_ERROR = 200002;
  /** Token 資產獲取錯誤 */
  public static TOKEN_GET_BALANCE_ERROR = 200003;
  /** 跳轉錯誤 */
  public static REDIRECT_ERROR = 200004;

  /** 注單格式錯誤 */
  public static BET_DATA_ERROR = 200005;
  /** 遊戲未開放 */
  public static GAME_CLOSED = 200006;
  /** 商戶未開放 */
  public static AGENT_CLOSED = 200007;
  /** 玩家未在線 */
  public static PLAYER_NOT_FOUND = 200008;
  /** 找不到總代理 */
  public static USERAPI_NOT_FOUND = 200009;
  /** 注單號重複 */
  public static BET_NUMBER_DUPLICATE = 200010;
  /** 注單金額異常 */
  public static BET_AMOUNT_ERROR = 200011;
  /** 餘額不足 */
  public static BET_BALANCE_INSUFFICIENT = 200012;
  /** 其他錯誤 */
  public static BET_OTHER_ERROR = 200013;
  /** 錢包種類異常 */
  public static WALLET_TYPE_ERROR = 200014;
  /** 餘額更新失敗 */
  public static UPDATE_BALANCE_FAILED = 200015;

  //=======================================================
  //#endregion Server Message

  //#region Client Message
  //=======================================================
  /** 餘額不足 */
  public static INSUFFICIENT_AMOUNT = 2001;
  /** 餘額不足,顯示去商城購買提示(Dara) */
  public static INSUFFICIENT_AMOUNT_STORE = 2040;
  /** 超過最大金額 */
  public static TOO_MUCH_BALANCE = 2041;
  /** 餘額不足,顯示去購買提示(SS) */
  public static INSUFFICIENT_AMOUNT_PURCHASE = 2042;
  /** 餘額不足,顯示去購買提示(SS) */
  public static INSUFFICIENT_AMOUNT_DONATE = 2043;
  /** 退出確認 */
  public static WANT_QUIT = 2003;
  /** 閒置逾時 */
  public static IDLE_TIMEOUT = 2004;
  /** 餘額達封頂限制 */
  public static EXPIRE_MAX_CREDIT = 2006;
  /** 對押行為 */
  public static HEDGE_BETTING = 2030;
  /** 儲值 */
  public static LOBBY_DEPOSIT = 3007;
  /** 提領 */
  public static LOBBY_CASH_OUT = 3008;
  /** 閒置過久提醒 */
  public static CLIENT_WARNING_IDLE_TOO_LONG = 9101;
  /** 載入檔錯誤 */
  public static LOADER_FAILED = 100104;
  //=======================================================
  //#endregion Client Message

  /** ErrorCode 內容 */
  private static Content: MessageDictionary = null;

  /**
   * 設置ErrorCode內容
   * @param errorCode
   */
  public static SetErrorCode(errorCode: JSON) {
    try {
      GameErrorCode.Content = JSON.parse(JSON.stringify(errorCode));
    } catch (err) {
      console.error('[GameErrorCode] SetErrorCode Error.', err);
    }
  }

  /**
   * 從ErrorCode獲得訊息 後面不定參數根據字串的%s#自動替代
   * @param code Error code
   * @param args Subsequences beginning with %s#
   */
  public static GetMessage(code: string | number, ...args): string {
    const key: string = code.toString();
    let result = 'Undefined.';

    const gameErrorCode: Message = GameErrorCode.Content[key];
    try {
      if (gameErrorCode !== undefined && gameErrorCode.TEXT !== undefined) {
        result = gameErrorCode.TEXT;
      } else {
        result = GameErrorCode.Content[GameErrorCode.UNKNOWN].TEXT;
        console.error('[GameErrorCode] GetMessage Undefined.');
      }
    } catch (err) {
      console.error('[GameErrorCode] GetMessage error.', err);
    }

    result = result.format(...args);

    return result;
  }
}

interface MessageDictionary {
  [Code: string]: Message;
}

interface Message {
  NAME: string;
  TEXT: string;
}

export enum ErrorCodeMapping {
  S006 = 9104, // 閒置逾時
  S020 = 9105, // 桌位已滿
  S021 = GameErrorCode.UNKNOWN, // 取得玩家遊戲桌號錯誤
  S022 = GameErrorCode.UNKNOWN, // 玩家已在桌上
  S023 = 9105, // 座位已有人
  S040 = GameErrorCode.UNKNOWN, // 平台拒絕
  S041 = GameErrorCode.UNKNOWN, // 向平台取 Info 失敗 (GetInfo)
  S042 = GameErrorCode.UNKNOWN, // 向平台取資產失敗 (GetAsset)
  S043 = GameErrorCode.UNKNOWN, // 向平台取商戶失敗 (GetMerchantSeat)
  S044 = GameErrorCode.UNKNOWN, // 向平台注單失敗 (PostPlayResult)
}
