import {
  _decorator,
  Component,
  Button,
  tween,
  Tween,
  Node,
  Animation,
  ParticleSystem2D,
} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {UserInfo} from '../../CommonModule/Script/Define/UserInfo';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {TextBox} from './TextBox';
import {setOpacity} from '../../CommonModule/Script/Utility/NodeProperty';

const {ccclass, property} = _decorator;

@ccclass
export class BetPopup extends Component {
  public closePopup: Delegate = new Delegate();
  public SetBetString: Delegate = new Delegate();

  private betList: object[] = [];

  private originalBetSetting: object = {};

  @property(Button)
  private PlusBetButton: Button = null;

  @property(Button)
  private ReduceBetButton: Button = null;

  private IsClickPlusButton = false;
  private IsClickReduceButton = false;

  private timeCount = 0;

  private IsKeepPressing = false;

  private IsExtraBet = false;
  private extraBetRatio = 1;

  private _allowLongPress = true;
  private _autoSetToMaxPlayableBet = false;

  @property(TextBox)
  private textBox_extraBet: TextBox = null;

  @property(ParticleSystem2D)
  private effect_clickExtraBet: ParticleSystem2D = null;

  @property(Node)
  private extraBet_BGnode: Node = null;

  @property(Animation)
  private extraBet_tip_animation: Animation = null;

  public addBetEvent: Delegate = new Delegate();
  public reduceBetEvent: Delegate = new Delegate();

  public set allowLongPress(option: boolean) {
    this._allowLongPress = option;
  }

  //按下-會直接幫玩家切到可以玩的最大押注
  public set autoSetToMaxPlayableBet(option: boolean) {
    this._autoSetToMaxPlayableBet = option;
  }

  public Init(
    betList: object[],
    maxLines: number,
    currentLineBet: number,
    _jpgate: number
  ) {
    if (betList === null || betList.length <= 0) return;

    this.betList = betList;

    this.SetCurrentLineBet(this.betList[this.betList.length - 1]['total_bet']);
    PlatformData.instance.isExtraBet = false;

    this.betList.forEach(element => {
      const lineBet: number = element['line_bet'];
      const totalBet: number = element['total_bet'];

      if (currentLineBet === lineBet) {
        this.SetCurrentLineBet(totalBet);
      }
    });

    this.SetChangeBetButtonEvent();
    this.HidePageView();
  }

  /** 不顯示頁面，將所有節點隱藏 */
  private HidePageView() {
    const allChildNode: Node[] = this.node.children;
    for (let i = 0; i < allChildNode.length; i++) {
      allChildNode[i].active = false;
    }
  }

  private SetCurrentLineBet(totalBet: number) {
    let betObject: object = this.betList.find(x => x['total_bet'] === totalBet);

    if (!betObject) {
      betObject = this.betList[this.betList.length - 1]; //不存在取最小的
    }

    PlatformData.instance.originalLineBet = betObject['line_bet'];
    PlatformData.instance.originalTotalBet = betObject['total_bet'];

    PlatformData.instance.currentLineBet = betObject['line_bet'];
    PlatformData.instance.currentTotalBet = betObject['total_bet'];
  }

  private OnClickCancel() {}

  private OnClickOK() {}

  private SetChangeBetButtonEvent() {
    //長按自動切換押注
    this.PlusBetButton.node.on(Node.EventType.TOUCH_START, () => {
      this.OnClickPlus();
      this.IsClickBetButton(true, 1);
    });

    this.PlusBetButton.node.on(Node.EventType.TOUCH_CANCEL, () => {
      this.IsClickBetButton(false, 1);
    });

    this.PlusBetButton.node.on(Node.EventType.TOUCH_END, () => {
      this.IsClickBetButton(false, 1);
    });

    //減低押注
    this.ReduceBetButton.node.on(Node.EventType.TOUCH_START, () => {
      this.OnClickReduce();
      this.IsClickBetButton(true, 2);
    });

    this.ReduceBetButton.node.on(Node.EventType.TOUCH_CANCEL, () => {
      this.IsClickBetButton(false, 2);
    });

    this.ReduceBetButton.node.on(Node.EventType.TOUCH_END, () => {
      this.IsClickBetButton(false, 2);
    });
  }

  private IsClickBetButton(isClick: boolean, type: number) {
    this.timeCount = 0;
    if (isClick) {
      if (type === 1) {
        this.IsClickPlusButton = true;
      } else {
        this.IsClickReduceButton = true;
      }
    } else {
      this.IsClickPlusButton = false;
      this.IsClickReduceButton = false;
      this.IsKeepPressing = false;
    }
  }

  //當玩家長按切換押注按鈕(+-鈕)時，開始記數，超過60則切換下一段押注，之後每20切換一段
  public update(_dt): void {
    if (this._allowLongPress) {
      if (this.IsClickPlusButton) {
        this.timeCount++;

        if (this.IsKeepPressing && this.timeCount >= 10) {
          this.OnClickPlus();
          this.timeCount = 0;
        }

        if (this.timeCount >= 30) {
          this.OnClickPlus();
          this.timeCount = 0;
          this.IsKeepPressing = true;
        }
      }

      if (this.IsClickReduceButton) {
        this.timeCount++;

        if (this.IsKeepPressing && this.timeCount >= 10) {
          this.OnClickReduce();
          this.timeCount = 0;
        }

        if (this.timeCount >= 30) {
          this.OnClickReduce();
          this.timeCount = 0;
          this.IsKeepPressing = true;
        }
      }
    }
  }

  public ChangeBetByTotalBet(totalBet: number) {
    const betObject = this.betList[this.GetBetIndexByBet(totalBet)];
    this.SetBetUI(betObject);
  }

  private ChangeBet(betObject: object) {
    this.SetBetUI(betObject);

    SlotGameMediator.instance.awardController.reset();

    if (this.closePopup.length > 0) {
      this.closePopup.notify(true);
    }
  }

  private SetBetUI(betObject: object) {
    PlatformData.instance.originalLineBet = betObject['line_bet'];
    PlatformData.instance.originalTotalBet = betObject['total_bet'];

    if (PlatformData.instance.isExtraBet) {
      PlatformData.instance.currentLineBet =
        betObject['line_bet'] * this.extraBetRatio;
      PlatformData.instance.currentTotalBet =
        betObject['total_bet'] * this.extraBetRatio;
    } else {
      PlatformData.instance.currentLineBet = betObject['line_bet'];
      PlatformData.instance.currentTotalBet = betObject['total_bet'];
    }

    if (this.SetBetString.length > 0) {
      this.SetBetString.notify();
    }

    if (SlotGDK.instance.eventUpdateOddsTabel.length > 0) {
      SlotGDK.instance.eventUpdateOddsTabel.notify();
    }
  }

  private OnClickPlus() {
    //先找出現在的bet在betList中的index
    const currBetIndex: number = this.GetCurrBetIndex();

    //如果是長按狀態，最多只能自動切到最大押注
    if (currBetIndex === 0 && this.timeCount !== 0) return;

    if (currBetIndex === 0) return;

    let betObject = null;

    betObject = this.betList[currBetIndex - 1];

    const betCost: number = PlatformData.instance.isExtraBet
      ? betObject['total_bet'] * PlatformData.instance.extraBetRatio
      : betObject['total_bet'];
    if (UserInfo.instance.balance < betCost) {
      return;
    }

    if (this.addBetEvent.length) this.addBetEvent.notify();
    this.ChangeBet(betObject);
  }

  private OnClickReduce() {
    //先找出現在的bet在betList中的index
    let currBetIndex: number = this.GetCurrBetIndex();

    //資產不夠玩任何押注段時 按按鈕無效
    if (this.CanNotPlayAnyBet) return;
    //如果是長按狀態，最多只能自動切到最小押注
    if (currBetIndex === this.betList.length - 1 && this.timeCount !== 0)
      return;

    if (currBetIndex === this.betList.length - 1) return;

    if (this._autoSetToMaxPlayableBet && !this.CanPlayerPlay) {
      currBetIndex = this.GetMaxPlayableBetIndex()
        ? this.GetMaxPlayableBetIndex() - 1
        : currBetIndex;
    }

    let betObject = null;

    betObject = this.betList[currBetIndex + 1];

    if (this.reduceBetEvent.length) this.reduceBetEvent.notify();
    this.ChangeBet(betObject);
  }

  private OnClickMax() {
    const betObject = this.betList[0];

    this.ChangeBet(betObject);
  }

  private GetCurrBetIndex() {
    for (let i = 0; i < this.betList.length; i++) {
      if (
        this.betList[i]['total_bet'] === PlatformData.instance.originalTotalBet
      ) {
        return i;
      }
    }
    return null;
  }

  private GetBetIndexByBet(bet: number) {
    for (let i = 0; i < this.betList.length; i++) {
      if (this.betList[i]['total_bet'] === bet) {
        return i;
      }
    }
    return 0;
  }

  public SetAllBetUI(isExtraBet: boolean) {
    this.SetExtraUI(isExtraBet);

    const betObject =
      this.betList[
        this.GetBetIndexByBet(PlatformData.instance.currentTotalBet)
      ];
    this.SetBetUI(betObject);
  }

  // 2021/10/18 新增ExtraBet功能
  public SetExtraBet(changeSetting: boolean) {
    const currBetIndex: number = this.GetCurrBetIndex();
    const betObject: object = this.betList[currBetIndex];

    this.SetExtraUI(changeSetting);

    this.ChangeBet(betObject);
  }

  public SetExtraUI(changeSetting: boolean) {
    this.IsExtraBet = changeSetting;

    this.textBox_extraBet.setSelection(this.IsExtraBet);

    //特效表演
    if (this.IsExtraBet) {
      this.effect_clickExtraBet.resetSystem();
      this.extraBet_BGnode.active = true;
      tween(this)
        .tag(1)
        .delay(0.2)
        .call(() => {
          this.extraBet_tip_animation.play();
        })
        .start();
    } else {
      this.extraBet_BGnode.active = false;

      Tween.stopAllByTag(1);
      this.extraBet_tip_animation.stop();
      setOpacity(this.extraBet_tip_animation.node, 0);
    }
  }

  public SetExtraBetRatio(ratio: number) {
    this.extraBetRatio = ratio;
    PlatformData.instance.extraBetRatio = ratio;
  }

  public get CanNotPlayAnyBet() {
    const {betList} = PlatformData.instance;
    const {balance} = UserInfo.instance;
    for (let i = 0; i < betList.length; i++) {
      if (betList[i]['total_bet'] <= balance) {
        return false;
      }
    }
    return true;
  }

  public GetMaxPlayableBetIndex() {
    if (this.CanNotPlayAnyBet) {
      return null;
    }
    const {betList} = PlatformData.instance;
    const {balance} = UserInfo.instance;
    const playableBets: number[] = [];
    const ratio = this.IsExtraBet ? this.extraBetRatio : 1;
    for (let i = 0; i < betList.length; i++) {
      const totalBet = betList[i]['total_bet'];
      if (totalBet * ratio <= balance) {
        playableBets.push(totalBet);
      }
    }
    const maxPlayableBet = Math.max(...playableBets);
    for (let i = 0; i < this.betList.length; i++) {
      if (this.betList[i]['total_bet'] === maxPlayableBet) {
        return i;
      }
    }
    return null;
  }

  public get CanPlayerPlay() {
    const {balance} = UserInfo.instance;
    const {currentTotalBet} = PlatformData.instance;
    return balance >= currentTotalBet;
  }
}
