export class UserInfo {
  public static get instance(): UserInfo {
    if (!window['userInfo']) {
      window['userInfo'] = new UserInfo();
    }
    return window['userInfo'];
  }

  public totalWin = 0;
  public nickName = '';
  public balance = 0;
  public entries = 0;
  public winnings = 0;
  public visibleBalance = 0;
  public jpWinningValue;
}
