import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {NumberAnimation} from '../../CommonModule/Script/UIComponent/NumberAnimation';
import {WinEffectCtrl} from '../../CommonModule/Script/Award/WinEffectCtrl';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {_decorator, Component, Prefab, director, Node} from 'cc';

const {ccclass, property} = _decorator;

enum enumJpLevel {
  Grand,
  Major,
  Minor,
}

@ccclass
export class LinkJackpotManager extends Component {
  @property([NumberAnimation])
  private linkingJpNumberAry: NumberAnimation[] = []; //LinkingJp滾錢的物件

  @property([NumberAnimation])
  private linkingJpNumberAryV: NumberAnimation[] = []; //LinkingJp滾錢的物件

  @property([Prefab])
  private jackpotBoards: Prefab[] = []; //LinkingJp報獎的物件

  @property(SpawnPool)
  private spawnPool: SpawnPool = null; //LinkingJp生成池

  private decRate = 0.8; //JP預扣的Rate

  private winInfo = null; //LinkingJp獲得資訊
  private curJackpotBoard: Node = null; //目前LinkingJp報獎物件

  private jpLevelGateAry: number[] = null; //LinkingJp各層級閥值

  private finishCallback: Function = null; //LinkingJp報獎結束CCallback

  private jpSoundID = -1; //JP報獎音效ID

  public jpClose: Delegate = new Delegate();

  public Init() {
    this.EnableLinkingJp(false);
    //Jp閥值初始化
    this.jpLevelGateAry = [];
    for (
      let i = 0, len: number = Object.keys(enumJpLevel).length * 0.5;
      i < len;
      i++
    ) {
      this.jpLevelGateAry.push(0);
    }
    this.SetLinkingJpLevel(-1);
  }

  //接收LinkingJp的資料
  public ReceiveLinkingJpData(data: JSON) {
    const jpInfoAry: [] = data['jp_info'];
    if (jpInfoAry === undefined) return;
    if (jpInfoAry.length === 0) {
      if (this.jpClose.length > 0) {
        this.jpClose.notify();
      }
      return;
    }
    //讀取Jp值與閥值
    let jpLevel = -1;
    let isShow = true;
    let jpinfo = null;
    for (let i = 0, len: number = jpInfoAry.length; i < len; i++) {
      jpinfo = jpInfoAry[i];
      if (jpinfo['game_id'] === PlatformData.gameName) {
        jpLevel = enumJpLevel[String(jpinfo['jp_type'])];
        if (jpLevel !== undefined) {
          this.SetJpValue(
            jpLevel,
            Number(jpinfo['jp_coin']),
            Number(data['sent_time_gap']) + 5
          ); //加五秒的buffer
          this.jpLevelGateAry[jpLevel] = Number(jpinfo['min_bet']);
          isShow = isShow && true;
        } else {
          //若有誤則不顯示
          isShow = isShow && false;
        }
      }
    }

    //Jp物件開關
    this.EnableLinkingJp(isShow);
    //Jp層級開關
    this.SetLinkingJpLevel(PlatformData.instance.currentTotalBet);
  }

  //開關LinkingJp物件顯示
  private EnableLinkingJp(isShow: boolean) {
    this.node.active = isShow;
  }

  //顯示Jackpot報獎
  //回傳2參數: JP贏分, JP滾動時間
  public ShowJackpotBoard(
    skipCallback?: Function,
    skipTarget?,
    endCallback?: Function,
    endTarget?
  ): number[] {
    if (this.winInfo === null) return null;
    const jpLevel: number = enumJpLevel[String(this.winInfo['jp_type'])];
    const jpWin = Number(this.winInfo['jp_coin']);
    if (jpLevel === undefined) return null;
    if (
      this.linkingJpNumberAry[jpLevel] === undefined ||
      this.linkingJpNumberAryV[jpLevel] === undefined ||
      this.jackpotBoards[jpLevel] === undefined
    ) {
      if (Define.DEBUG_LOG) {
        console.log(
          '[LinkingJackpot]ShowJackpotBoard: linkingJpNumberAry or jackpotBoards index ' +
            jpLevel +
            ' was not found'
        );
      }
      return null;
    }

    //生成報獎
    this.curJackpotBoard = this.spawnPool.spawn(
      this.jackpotBoards[jpLevel].data,
      director.getScene()
    );
    const winCtrl: WinEffectCtrl =
      this.curJackpotBoard.getComponent<WinEffectCtrl>(WinEffectCtrl);
    //按鈕顯示切換事件
    const buttonChange: Function = () => {
      if (winCtrl.skipButton === null || winCtrl.confirmButton === null) return;
      winCtrl.skipButton.node.active = false;
      winCtrl.confirmButton.node.active = true;
    };
    //播放報獎
    const level: number = Object.keys(enumJpLevel).length * 0.5 - jpLevel - 1; ////jpLevel的反向
    const showDuration: number = 5 * Math.pow(2, level);
    winCtrl.playEffect(jpWin, showDuration, buttonChange, this);

    //設置Skip按鈕
    if (winCtrl.skipButton !== null) {
      winCtrl.skipButton.node.active = false;
      //註冊TOUCH_END事件
      winCtrl.skipButton.node.once(
        Node.EventType.TOUCH_END,
        () => {
          if (!winCtrl.skipButton.interactable) return;
          //略過滾動效果
          if (skipCallback !== null) skipCallback.bind(skipTarget)();
          winCtrl.forceSkipEffect();
        },
        this
      );
      //延遲後顯示按鈕
      this.scheduleOnce(
        () => {
          winCtrl.skipButton.node.active = true;
        },
        1 + 2 * level
      );
    }
    //設置Confirm按鈕
    if (winCtrl.confirmButton !== null) {
      winCtrl.confirmButton.node.active = false;
      //註冊TOUCH_END事件
      winCtrl.confirmButton.node.once(
        Node.EventType.TOUCH_END,
        () => {
          if (!winCtrl.confirmButton.interactable) return;
          //關閉報獎畫面
          this.CloseJackpotBoard();
        },
        this
      );
    }
    //結束事件
    if (endCallback !== null) this.finishCallback = endCallback.bind(endTarget);

    //BGM音量降低
    SlotGDK.instance.setMainGameBGMToLower();
    //播放報獎音樂
    this.jpSoundID = SlotGameMediator.instance.audioManager.play(
      'Jp_Award',
      true,
      1
    );

    const retArg: number[] = [jpWin, showDuration];
    return retArg;
  }

  //關閉Jackpot報獎畫面
  public CloseJackpotBoard() {
    if (this.winInfo === null || this.curJackpotBoard === null) return;

    this.spawnPool.despawn(this.curJackpotBoard);

    this.winInfo = null;
    this.curJackpotBoard = null;

    if (this.finishCallback !== null) this.finishCallback();
    this.finishCallback = null;

    if (this.jpSoundID !== -1)
      ////停止報獎音樂
      SlotGameMediator.instance.audioManager.stop(this.jpSoundID);
  }

  //設置Jackpot獲得資訊
  public SetJackpotWinInfo(winInfo) {
    this.winInfo = winInfo;
  }

  //設定LinkingJp滾錢的值
  private SetJpValue(jpLevel: number, jpValue: number, duration: number) {
    if (
      this.linkingJpNumberAry[jpLevel] === undefined ||
      this.linkingJpNumberAryV[jpLevel] === undefined
    ) {
      if (Define.DEBUG_LOG) {
        console.log(
          '[LinkingJackpot]SetJpValue: linkingJpNumberAry index ' +
            jpLevel +
            ' was not found'
        );
      }
      return;
    }

    if (
      this.linkingJpNumberAry[jpLevel].getTargetNumber() > jpValue ||
      this.linkingJpNumberAry[jpLevel].getTargetNumber() === 0
    ) {
      this.linkingJpNumberAry[jpLevel].setNumberToStop(jpValue * this.decRate);
    }

    if (
      this.linkingJpNumberAryV[jpLevel].getTargetNumber() > jpValue ||
      this.linkingJpNumberAryV[jpLevel].getTargetNumber() === 0
    ) {
      this.linkingJpNumberAryV[jpLevel].setNumberToStop(jpValue * this.decRate);
    }

    this.linkingJpNumberAry[jpLevel].setTargetNumberAnimationEx(
      jpValue,
      duration
    );
    this.linkingJpNumberAryV[jpLevel].setTargetNumberAnimationEx(
      jpValue,
      duration
    );
  }

  //設置LinkingJp顯示的獎項層級
  public SetLinkingJpLevel(bet: number) {
    //TODO: 獎項啟用與非啟用的顯示效果
    for (let i = 0, len: number = this.jpLevelGateAry.length; i < len; i++) {
      if (bet >= this.jpLevelGateAry[i]) {
        //啟用
      } else {
        //非啟用
      }
    }
  }
}
