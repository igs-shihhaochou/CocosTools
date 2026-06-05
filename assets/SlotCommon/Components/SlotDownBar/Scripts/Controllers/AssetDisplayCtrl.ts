import {_decorator, Component, Node} from 'cc';
import {NumberAnimation} from '../../../../../CommonModule/Script/UIComponent/NumberAnimation';
import {UserInfo} from '../../../../../CommonModule/Script/Define/UserInfo';
import {PlatformGDK} from '../../../../../CommonModule/Script/Platform/PlatformGDK';
import {tweenNodeEx} from '../../../../../CommonModule/Script/Utility/TweenUtil';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import PlatformEventNotifier from '../../../../../CommonModule/Script/Utility/PlatformEventNotifier';

const {ccclass, property} = _decorator;

@ccclass('AssetDisplayCtrl')
export class AssetDisplayCtrl extends Component {
  @property(NumberAnimation)
  private credits: NumberAnimation = null;
  @property(NumberAnimation)
  private entries: NumberAnimation = null;
  @property(NumberAnimation)
  private winnings: NumberAnimation = null;
  @property(Node)
  private creditRoot: Node = null;
  @property(Node)
  private entriesRoot: Node = null;

  private get currentBalance() {
    if (!PlatformData.isUseScoreBox) {
      return this.credits.currentNumber;
    } else {
      return this.winnings.currentNumber;
    }
  }

  public init() {
    this.creditRoot.active = !PlatformData.isUseScoreBox;
    this.entriesRoot.active = PlatformData.isUseScoreBox;
    if (PlatformData.useCert) {
      this.credits.setIsMoney(true);
    }
  }

  protected onLoad(): void {
    this.registerEvent(true);
  }

  protected onDestroy(): void {
    this.registerEvent(false);
  }

  private registerEvent(option: boolean) {
    const func = option ? 'insert' : 'remove';
    PlatformGDK.instance.updatePlayerBalance[func](
      this.updatePlayerBalance,
      this
    );
    PlatformGDK.instance.addPlayerBalance[func](this.addBalance, this);
  }

  public updatePlayerBalance(coin: number = null) {
    if (!PlatformData.isUseScoreBox) {
      UserInfo.instance.visibleBalance = coin ?? UserInfo.instance.balance;
      this.credits.setNumberToStop(UserInfo.instance.visibleBalance);
      PlatformEventNotifier.updateAsset({
        balance: UserInfo.instance.visibleBalance,
      });
    } else if (PlatformData.isUseScoreBox) {
      UserInfo.instance.entries = coin ?? UserInfo.instance.entries;
      this.updateEntries();
      this.updateWinnings();
      PlatformEventNotifier.updateAsset({
        entries: UserInfo.instance.entries,
        winnings: UserInfo.instance.winnings,
      });
    }
  }

  public addBalance(winValue = 0) {
    if (!PlatformData.isUseScoreBox) {
      UserInfo.instance.visibleBalance += winValue;
      this.credits.setNumberToStop(UserInfo.instance.visibleBalance);
      PlatformEventNotifier.updateAsset({
        balance: UserInfo.instance.visibleBalance,
      });
    } else if (PlatformData.isUseScoreBox) {
      const addBalance: number = this.currentBalance + winValue;

      const showValue: number = Math.min(
        UserInfo.instance.winnings,
        addBalance
      );
      this.updateWinnings(showValue);
      PlatformEventNotifier.updateAsset({
        winnings: UserInfo.instance.winnings,
      });
    }
  }

  public updateEntries(val: number = null) {
    const updateVal = val ?? UserInfo.instance.entries;
    console.log('AssetDisplayCtrl.updateEntries', updateVal);
    if (this.entries.currentNumber === updateVal) return;
    this.entries.setCurrentNumber(updateVal);
    PlatformEventNotifier.updateAsset({
      entries: updateVal,
    });
  }

  public updateWinnings(val: number = null) {
    const updateVal = val ?? UserInfo.instance.winnings;
    if (this.winnings.currentNumber === updateVal) return;
    console.log('AssetDisplayCtrl.updateWinnings', updateVal);
    this.winnings.setCurrentNumber(updateVal);
    PlatformEventNotifier.updateAsset({
      winnings: updateVal,
    });
    tweenNodeEx(this.winnings.node)
      .to(0.05, {scale: 1.5})
      .to(0.05, {scale: 1})
      .start();
  }

  public onSpinStart() {
    const {currentTotalBet, linkingJpBet} = PlatformData.instance;
    if (!PlatformData.isUseScoreBox) {
      this.credits.setNumberToStop(
        UserInfo.instance.balance - currentTotalBet - linkingJpBet
      );
      UserInfo.instance.visibleBalance =
        UserInfo.instance.balance - currentTotalBet - linkingJpBet;
    } else if (PlatformData.isUseScoreBox) {
      this.updateEntries(
        UserInfo.instance.entries - currentTotalBet - linkingJpBet
      );
    }
  }
}
