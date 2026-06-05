export class Define {
  public static DEBUG_LOG: Boolean = true;
  public static DEBUG_MODE: Boolean = true;
}

export class TimeManager {
  public static FixedTimestep: number = 1 / 60;
}

export class ScreenSize {
  public static Width = 1280;
  public static Height = 720;
}

export class ErrorCode {
  public static INSUFFICIENT_AMOUNT = 2001; //餘額不足
  public static INSUFFICIENT_AMOUNT_STORE = 2030; //餘額不足,顯示去商城購買提示(Joya)
  public static UNKNOWN = 255; //網路不穩
  public static HTML5_WEBGL_NOT_SUPPORT = 50001; //不支援WebGL的瀏覽器遊玩有Spine或Shader得遊戲
  public static MAINTENANCE = 254; //請重新登入遊戲(Server關閉或沒有Wifi)
  public static LOGINFAILED_VERIFY_FAILED = 100; //Token失效
  public static TOO_MUCH_BALANCE = 2031; //超過最大金額
  public static INSUFFICIENT_AMOUNT_PURCHASE = 2032; //餘額不足,顯示去購買提示(SS)
  public static INSUFFICIENT_AMOUNT_DONATE = 2033; //餘額不足,顯示去購買提示(SS)
}

export class SystemObj {
  public static waitForSeconds: number[] = []; //儲存WaitforSeconds物件的陣列
}
