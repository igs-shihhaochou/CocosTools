import {
  ActivityFWToPlatform as ATP,
  sendGameEventToPlatform,
} from '../Define/GameEventType';

export default class PlatformEventNotifier {
  public static uiVisible = false;

  public static blockActivity(option: boolean): void {
    sendGameEventToPlatform(ATP.Control.Activity, {interactable: !option});
  }
  public static purchase(): void {
    sendGameEventToPlatform(ATP.Open.Purchase);
  }
  public static profile(): void {
    sendGameEventToPlatform(ATP.Open.Profile);
  }
  public static otherProfile(obj: {
    playerPinID: string;
    winnings?: number;
    entries?: number;
  }): void {
    sendGameEventToPlatform(ATP.Open.OtherProfile, obj);
  }
  public static showAllUI(option: boolean): void {
    PlatformEventNotifier.uiVisible = option;
    const obj = {
      game: option ? '0' : '10',
      platform: option ? '10' : '0',
    };
    sendGameEventToPlatform(ATP.Control.Layer, obj);
  }
  public static spin(obj: {TotalBet: number; ExtraBet: boolean}): void {
    sendGameEventToPlatform(ATP.GameFlow.Spin, obj);
  }
  public static changeBet(
    currentLineBet: number,
    currentTotalBet: number,
    originalLineBet: number,
    originalTotalBet: number
  ): void {
    sendGameEventToPlatform(ATP.Log.ChangeBet, {
      currentLineBet: currentLineBet,
      currentTotalBet: currentTotalBet,
      originalLineBet: originalLineBet,
      originalTotalBet: originalTotalBet,
    });
  }
  public static preview(): void {
    sendGameEventToPlatform(ATP.Log.ClickPreview);
  }
  public static showPreview(): void {
    sendGameEventToPlatform(ATP.Log.ShowPreview);
  }
  public static closePreview(): void {
    sendGameEventToPlatform(ATP.Log.ClosePreview);
  }
  public static playPreview(): void {
    sendGameEventToPlatform(ATP.Log.PlayPreview);
  }
  public static info(): void {
    sendGameEventToPlatform(ATP.Log.Info);
  }
  public static loadingFinished(): void {
    sendGameEventToPlatform(ATP.GameFlow.LoadingFinish);
  }
  public static closeLoading(): void {
    sendGameEventToPlatform(ATP.GameFlow.LoadingClose);
  }
  public static setMute(option: boolean): void {
    sendGameEventToPlatform(ATP.Control.Mute, {mute: option});
  }
  public static setCursor(style: string): void {
    sendGameEventToPlatform(ATP.Control.Cursor, {style: style});
  }
  public static setStats(option: boolean): void {
    sendGameEventToPlatform(ATP.Control.Stats, {show: option});
  }
  public static changeGame(gameName: string): void {
    sendGameEventToPlatform(ATP.Control.ChangeGame, {gameName: gameName});
  }
  public static exitGame(): void {
    sendGameEventToPlatform(ATP.GameFlow.ExitGame);
  }
  public static betWait(): void {
    sendGameEventToPlatform(ATP.GameFlow.BetWait);
  }
  public static specialGame(): void {
    sendGameEventToPlatform(ATP.GameFlow.SpecialGame);
  }
  public static loadingGame(): void {
    sendGameEventToPlatform(ATP.GameFlow.LoadingStart);
  }
  public static updateAsset(obj: {
    entries?: number;
    winnings?: number;
    balance?: number;
  }): void {
    sendGameEventToPlatform(ATP.Balance.UpdateAsset, obj);
  }
  public static insufficientAmount(): void {
    sendGameEventToPlatform(ATP.Balance.InsufficientAmount, {event: 'deposit'});
  }
  public static turbo(): void {
    sendGameEventToPlatform(ATP.Log.Turbo);
  }
  public static auto(data): void {
    sendGameEventToPlatform(ATP.Log.Auto, data);
  }
  public static sendAchieveMarquee(data) {
    sendGameEventToPlatform(ATP.Log.AchieveMarquee, data);
  }
  public static gameError(errorCode: string, priority: number): void {
    sendGameEventToPlatform(ATP.Log.GameError, {
      errorCode: errorCode,
      priority: priority,
    });
  }
  public static assetMismatch(retryCount: number): void {
    sendGameEventToPlatform(ATP.Log.AssetMismatch, {retryCount: retryCount});
  }
  public static getPlayerName(): void {
    sendGameEventToPlatform(ATP.Player.GetName);
  }
  public static getAvatar(obj: {id: string; ark_id: string}): void {
    sendGameEventToPlatform(ATP.Profile.GetAvatar, obj);
  }
  public static getAvatarFrame(obj: {id: string; ark_id: string}): void {
    sendGameEventToPlatform(ATP.Profile.GetAvatarFrame, obj);
  }
  public static receiveReward(rewardType: number): void {
    sendGameEventToPlatform(ATP.Profile.ReceiveReward, {
      rewardType: rewardType,
    });
  }
  public static checkJackpot(obj: {group: string; totalBet: number}): void {
    sendGameEventToPlatform(ATP.Jackpot.Check, obj);
  }
}
