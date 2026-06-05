import {_decorator, Component, CCInteger, CCBoolean} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {StartGameExArgs, WinType} from '../../SlotModule/Define/SlotGameData';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {PlatformGDK} from '../../CommonModule/Script/Platform/PlatformGDK';

const {ccclass, property} = _decorator;

@ccclass
export default class WinTypeManager extends Component {
  private winTypeAry: number[] = [-1, 0, 1, 5, 10, 25, 50, 100];

  @property(CCBoolean)
  private defaultSpecialWin = false;

  @property(CCBoolean)
  private useCustom = false;

  @property({
    type: [CCInteger],
    visible: function (this: WinTypeManager) {
      return this.useCustom;
    },
  })
  private customWinTypeAry: number[] = [-1, 0, 1, 5, 10, 25, 50, 100];

  protected onLoad(): void {
    SlotGDK.instance.receiveStartGame.insert(this.SetupWinTypeAry, this);
    SlotGDK.instance.getWinType = totalWin => {
      return this.GetWinType(totalWin);
    };
    PlatformGDK.instance.getWinType = totalWin => {
      return this.GetWinType(totalWin);
    };
  }

  protected onDestroy(): void {
    SlotGDK.instance.getWinType = null;
  }

  private SetupWinTypeAry(_Args: StartGameExArgs = null): void {
    this.winTypeAry = _Args.winType;
  }

  public GetWinType(totalWin: number): WinType {
    let winType = WinType.NoWin;

    const multiple = totalWin / PlatformData.instance.originalTotalBet;

    const winTypeArray = this.useCustom
      ? this.customWinTypeAry
      : this.winTypeAry;

    if (totalWin <= 0) {
      winType = WinType.NoWin;
    } else {
      if (multiple < winTypeArray[4]) {
        winType = this.defaultSpecialWin
          ? WinType.SpecialWin
          : WinType.NormalWin;
      } else if (multiple >= winTypeArray[4] && multiple < winTypeArray[5]) {
        winType = WinType.BigWin;
      } else if (multiple >= winTypeArray[5] && multiple < winTypeArray[6]) {
        winType = WinType.MegaWin;
      } else if (multiple >= winTypeArray[6]) {
        winType = WinType.SuperWin;
      }
    }
    return winType;
  }
}
