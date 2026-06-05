import {BetPopup} from './BetPopup';
import {MarqueesUI} from './MarqueesUI';
import {LinkJackpotManager} from './LinkJackpotManager';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import {GamePlayMode} from '../../SlotModule/Define/SlotGameData';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {AutospinPopup} from './AutospinPopup';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {NumberAnimation} from '../../CommonModule/Script/UIComponent/NumberAnimation';
import Functions from '../../CommonModule/Script/Utility/Functions';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {SystemMessageUI} from './UIComponent/SystemMessageUI';
import RemoteSharedImage from '../../CommonModule/Script/UIComponent/RemoteSharedImage';
import EventManager from '../../CommonModule/Script/Manager/EventManager';
import {httpResult} from '../../CommonModule/Script/Network/Macross/MacrossClient';
import BackpackManager from '../../CommonModule/Script/Manager/BackpackManager';
import {ItemSystemDataInterface} from '../../CommonModule/Script/Network/DataInterface/ItemSystemDataInterface';
import {
  _decorator,
  Component,
  Label,
  Button,
  RichText,
  EditBox,
  WebView,
  Prefab,
  Vec2,
  sys,
  macro,
  Color,
  instantiate,
  Node,
  type EventKeyboard,
  Vec3,
  input,
  Input,
  CCBoolean,
  game,
} from 'cc';
import {
  getSize,
  getWorldSpaceAR,
  setColor,
  setOpacity,
  setPosition,
  setSize,
} from '../../CommonModule/Script/Utility/NodeProperty';
import MultiLangHandler from '../../CommonModule/Script/Core/MultiLangHandler';

declare let GlobalConfig;

const {ccclass, property} = _decorator;

export class ButtonStateCheck {
  public isPressed: boolean;
  public accumTime: number;
}

export enum SpinStatus {
  Spin,
  Stop,
  Skip,
  Start,
  AutoSpin,
  BlockSpin,
  BlockStop,
  SpecialGame,
  ShowAward,
  HideSpin,
}

@ccclass('BottomBar')
export class BottomBar extends Component {
  public spinClicked: Delegate = new Delegate();

  public buyBonusClicked: Delegate = new Delegate();

  public stopClicked: Delegate = new Delegate();

  public startClicked: Delegate = new Delegate();

  public skipClicked: Delegate = new Delegate();

  public extraBetClicked: Delegate = new Delegate();

  public Event_InfoClicked: Delegate = new Delegate();

  public audioMute: Delegate = new Delegate();

  public clickFullScreen: Delegate = new Delegate();

  public clickHome: Delegate = new Delegate();

  public cancelAutospin: Delegate = new Delegate();

  public openAutospinPopupButtonClicked: Delegate = new Delegate();

  public openBetPopupButtonClicked: Delegate = new Delegate();

  public openMainMenuButtonClicked: Delegate = new Delegate();

  public closeMainMenuButtonClicked: Delegate = new Delegate();

  public infoPopupButtonClicked: Delegate = new Delegate();

  public gameLogPopupButtonClicked: Delegate = new Delegate();

  public clickClearFeature: Delegate = new Delegate();

  public clickBackpack: Delegate = new Delegate();

  public clickFastSpin: Delegate = new Delegate();

  public showInSuffcientBalancePopUp: Delegate = new Delegate();

  @property(Label)
  public userNameLabel: Label = null; //暱稱

  @property(Label)
  public currencyNameLabel: Label = null; //幣種

  @property(NumberAnimation)
  public balanceNumberAnimation: NumberAnimation = null; //玩家金額

  @property(Button)
  public spinButton: Button = null; //SPIN按鈕

  @property(Button)
  public stopButton: Button = null; //暫停按鈕

  @property(Button)
  public skipButton: Button = null; //略過按鈕

  @property(Node)
  public startButton: Node = null; //Start按鈕

  @property(Button)
  public autospinButton: Button = null; //Autospin按鈕

  @property(RichText)
  public autospinTimesRichText: RichText = null; //Autospin次數RichText

  @property(Node)
  public freeGameBar: Node = null; //免費遊戲按鈕

  @property(Label)
  private freeGameBarLabel: Label = null; //免費遊戲按鈕文字

  @property(Node)
  public mainMenuRoot_Open: Node = null; //Menu打開狀態的Root

  @property(Node)
  public mainMenuRoot_Close: Node = null; //Menu關閉狀態的Root

  @property(Node)
  public audioBtn_Open: Node = null; //開啟音效物件

  @property(Node)
  public audioBtn_Close: Node = null; //關閉音效物件

  @property(Node)
  public fullScreenBtn_Open: Node = null; //開啟全畫面物件

  @property(Node)
  public fullScreenBtn_Close: Node = null; //關閉全畫面物件

  @property(Node)
  public homeBtn: Node = null; //首頁按鈕

  @property(Node)
  public winBoardRoot: Node = null; //贏分面板

  @property(NumberAnimation)
  public winNumberCounter: NumberAnimation = null; //贏分滾錢的物件

  @property(Node)
  private debugRoot: Node = null; //Debug工具

  @property(EditBox)
  private triggerKeyEditBox: EditBox = null; //Trigger的輸入框

  @property(BetPopup)
  public betPopup: BetPopup = null; //Bet的Popup

  @property(AutospinPopup)
  public autospinPopup: AutospinPopup = null; //AutoSpin的Popup

  @property(Node)
  public openMenuButton: Node = null; //打開Menu的按鈕

  @property(Node)
  public infoPopup: Node = null; //Info頁的Popup

  @property(WebView)
  public infoWebView: WebView = null; //Info頁的WebView元件

  @property(Node)
  public gameLogPopup: Node = null; //GameLog頁的Popup

  @property(WebView)
  public gameLogWebView: WebView = null; //GameLog頁的WebView元件

  @property(Label)
  public totalBetLabelUI: Label = null; //顯示totalBet的Label

  @property(LinkJackpotManager)
  public linkingJpMgr: LinkJackpotManager = null; //Linking Jackpot

  @property(SystemMessageUI)
  public systemMessageUI: SystemMessageUI = null; //跑馬燈的背景

  @property(MarqueesUI)
  public marqueesUI: MarqueesUI = null; //跑馬燈的功能

  @property(RemoteSharedImage)
  public remoteLogoIcon: RemoteSharedImage = null; //遠端Logo圖示

  @property(Label)
  public versionLabel: Label = null; //顯示Server版本的Label

  @property(Label)
  public probVersionLabel: Label = null; //顯示機率表的Label

  @property(Label)
  public serialNOLabel: Label = null; //每一手流水號的Label

  @property(Prefab)
  public retriggerEffect_Move: Prefab = null; //Retrigger移動的特效

  @property(Prefab)
  public retriggerEffect_Hit: Prefab = null; //Retrigger擊中的特效

  @property(Node)
  private effectRoot: Node = null; //特效的Root

  @property(Node)
  private internetUnstableTipNode: Node = null; //網路不穩定的提示

  @property(Node)
  private clickStartBtnTip: Node = null; //按下StartBtn的提示

  protected get c_LongPressTime(): number {
    return 0.5;
  }

  @property(Node)
  public spinButtonBlock: Node = null; //spin紐的阻擋Node

  @property(Node)
  public stopButtonBlock: Node = null; //stop紐的阻擋Node

  @property([Node])
  public bottomBarButtonBlocks: Node[] = []; //在底bar上的按鈕的阻擋Node

  @property(Node)
  public autoButtonBlock: Node = null; //auto按鈕的阻擋Node

  @property(Node)
  public turboButtonBlock: Node = null; //turbo按鈕的阻擋Node

  @property(Node)
  public extraBetButton: Node = null; //extraBet按鈕

  @property(Label)
  private autoSelectCountDownLabel: Label = null; //Slot自動選擇提示文字訊息

  @property(Node)
  public topBarRoot: Node = null; //TopBar根節點

  @property(Label)
  public serialNOLabelUnderTopBar: Label = null; //TopBar隱藏時顯示的流水號Label

  @property(Button)
  private backpackBtn: Button = null; //背包按鈕

  @property(Node)
  private backpackRedDot: Node = null; //背包紅點

  @property(CCBoolean)
  public hasBackPack = true;

  @property(Node)
  private winText: Node = null; //贏分文字

  private autoSelectPerSecCB: Function = null;

  private autoSelectEndCB: Function = null;

  //自動選擇所需設定
  private autoSelectLabel_LandscapePos: Vec3 = null;
  private autoSelectLabel_LandscapeSize: Vec2 = null;
  private autoSelectLabel_PortraitPos: Vec3 = null;
  private autoSelectLabel_PortraitSize: Vec2 = null;

  //是否顯示自動選擇提示
  private needShowAutoSelectContent = false;
  //客製化自動選擇訊息
  private customAutoSelectContent = '';
  //目前時間
  private currentTime = 0;
  //客制倒数时间
  private customCountDownTime = 0;
  //背包cd時間
  private backpackGetDataCD = 20;

  /**
   * 設置非行動裝置時 改變按鈕上的游標狀態
   */
  private SetButtonsCursor() {
    if (!sys.isMobile) {
      const buttons: Array<Button> = this.node.getComponentsInChildren(Button);
      for (let i = 0; i < buttons.length; i++) {
        const button: Button = buttons[i];

        button.node.on(
          Node.EventType.MOUSE_ENTER,
          () => {
            game.canvas.style.cursor = 'pointer';
          },
          this
        );
        button.node.on(
          Node.EventType.MOUSE_LEAVE,
          () => {
            game.canvas.style.cursor = 'default';
          },
          this
        );
      }
    }
  }

  onLoad() {
    if (this.debugRoot) {
      this.debugRoot.active = false;
      if (Define.DEBUG_MODE) {
        this.debugRoot.active = true;
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
      }
    }

    //初始化按鈕狀態
    this.audioBtn_Open.active = !PlatformData.isMute;
    this.audioBtn_Close.active = PlatformData.isMute;

    if (this.autoSelectCountDownLabel !== null) {
      this.autoSelectCountDownLabel.node.active = false;
    }

    SlotGDK.instance.eventPlayRetriggerEffect.insert(
      this.PlayRetriggerEffect,
      this
    );
    SlotGDK.instance.eventPlayFlyToBottomBarEffect.insert(
      this.PlayFlyToBottomBarEffect,
      this
    );

    EventManager.instance.addEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.AdjustSerialNOPosition,
      this
    );
    EventManager.instance.addEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.RefreshAutoSelectUI,
      this
    );
  }

  protected onDestroy(): void {
    this.unschedule(this.GetBagSetting);
    SlotGDK.instance.eventPlayRetriggerEffect.remove(
      this.PlayRetriggerEffect,
      this
    );
    SlotGDK.instance.eventPlayFlyToBottomBarEffect.remove(
      this.PlayFlyToBottomBarEffect,
      this
    );

    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.AdjustSerialNOPosition,
      this
    );
    EventManager.instance.removeEventListener(
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.RefreshAutoSelectUI,
      this
    );
  }

  private onKeyDown(event: EventKeyboard) {
    if ((event as any).keyCode === macro.KEY.q) {
      this.debugRoot.active = !this.debugRoot.active;
    }
  }

  private SetWinDisplay(option: boolean) {
    console.warn('BottomBar: SetWinDisplay', option);
    setOpacity(this.winBoardRoot, option ? 255 : 0);
    setOpacity(this.winText, option ? 255 : 0);
  }

  /** 點擊按鈕開啟/關閉TriggerKey工具 */
  private onClickTriggerKeySetting() {
    this.triggerKeyEditBox.node.parent.active =
      !this.triggerKeyEditBox.node.parent.active;
  }

  public Init(startGameData: JSON): void {
    let clientVersion = '';
    const splitPath = location.pathname.split('/');
    const version = splitPath[splitPath.length - 3];
    if (version) {
      if (version.match(/^\d+(\.\d+)*$/)) clientVersion = version + '_';
    }

    if (PlatformData.instance.version)
      this.versionLabel.string = clientVersion + PlatformData.instance.version;

    let maxLines = 0;
    let currentLineBet = 0;
    let jpGate: number = Number.MAX_VALUE;
    if (startGameData.hasOwnProperty('max_lines')) {
      maxLines = startGameData['max_lines'];
    }

    if (startGameData.hasOwnProperty('current_line_bet')) {
      currentLineBet = startGameData['current_line_bet'];
    }

    if (startGameData.hasOwnProperty('jp_gate')) {
      jpGate = startGameData['jp_gate'];
    }

    this.DisableFullScreenBtn();

    //設置幣符及幣種文字
    this.currencyNameLabel.string = '';
    //2022/11/22 設置貨幣名稱
    if (PlatformData.currency !== null) {
      this.currencyNameLabel.string = PlatformData.currencyName;
      if (PlatformData.licenseSetting.showCurrencySymbol) {
        this.currencyNameLabel.string = PlatformData.currencySymbol;
      }
    }

    this.betPopup.node.active = true;

    this.betPopup.Init(
      PlatformData.instance.betList,
      maxLines,
      currentLineBet,
      jpGate
    );
    if (PlatformData.licenseSetting.enablePlatformJP) {
      this.linkingJpMgr.Init();
    }

    //初始化Logo圖示
    //TODO: 與LogoSetting整合
    //先確認是否有ShowLogo參數，有的話就使用白牌Logo
    const showLogo = Functions.getURLParameterByName('ShowLogo');
    if (
      typeof GlobalConfig !== 'undefined' &&
      showLogo !== '' &&
      GlobalConfig.WhiteLogoSetting.GetGameLogo(showLogo) !== undefined
    ) {
      this.remoteLogoIcon.filePath = GlobalConfig.WhiteLogoSetting.GetGameLogo(
        Functions.getURLParameterByName('ShowLogo')
      );
      console.log(
        '[BottomBar]White Logo FilePath = ' + this.remoteLogoIcon.filePath
      );
    } else {
      console.log('[BottomBar]Use default logo');
      this.remoteLogoIcon.filePath = `./Logo/${PlatformData.logo.toLowerCase()}/logo_h.png`;
    }
    this.remoteLogoIcon.init();

    this.betPopup.ChangeBetByTotalBet(PlatformData.instance.currentTotalBet);
    // this.totalBetLabelUI.string = Functions.GetValueByRatio(PlatformData.Instance.currentTotalBet, PlatformData.Instance.displayRatio).toString();

    // 2020/8/26 設定滑鼠移到按鈕上時，會變更圖示
    this.SetButtonsCursor();

    // 取得背包設定
    this.backpackBtn.node.active = false;
    this.GetBagSetting();
    this.schedule(this.GetBagSetting, 10);

    if (PlatformData.licenseSetting.closeWinTxtWithZero) {
      this.SetWinDisplay(false);
    }
    if (PlatformData.licenseSetting.showCurrencySymbolWin) {
      this.winNumberCounter.isMoney = true;
    }

    // 機率表版本
    this.SetProbVersion(startGameData);
  }

  protected DisableFullScreenBtn() {
    //iOS不支援全螢幕 關閉全螢幕功能; 避掉手機的UC全螢幕BUG; URL參數關閉全螢幕功能
    if (
      sys.os === sys.OS.IOS ||
      (sys.browserType === 'ucbrowser' && sys.isMobile) ||
      Functions.getURLParameterByName('fsBtn') === 'false'
    ) {
      this.fullScreenBtn_Open.active = false;
      this.fullScreenBtn_Close.active = false;
      const node = this.fullScreenBtn_Open.parent.parent.getChildByName('Bg');
      setSize(
        node,
        null,
        getSize(node).height - getSize(this.fullScreenBtn_Open).height
      );

      const {x, y} = this.fullScreenBtn_Open.parent.position;
      setPosition(this.homeBtn, x, y);
    }
  }

  public SetNickName(nickName: string) {
    this.userNameLabel.string = nickName;
  }

  public SetBalance(balance: number) {
    this.balanceNumberAnimation.setNumberToStop(balance);
  }

  public SetBalanceCount(balance: number, _updateTime: number) {
    this.balanceNumberAnimation.setNumberToStop(balance);
  }

  public SetTotalBet() {
    const {
      currentTotalBet,
      displayRatio,
      showThousandPlaces,
      displayDigit,
      discardExtraZeros,
    } = PlatformData.instance;
    const {licenseSetting, currencySymbol} = PlatformData;
    const adaptiveDigit = Functions.getAdaptiveDecimalPlaces(
      currentTotalBet,
      displayRatio,
      displayDigit
    );
    const betStr = Functions.numberFormat(
      currentTotalBet,
      adaptiveDigit,
      showThousandPlaces,
      null,
      displayRatio,
      false,
      discardExtraZeros
    );
    const finalCurrencySymbol = licenseSetting.showCurrencySymbolBet
      ? `${currencySymbol} `
      : '';
    this.totalBetLabelUI.string = finalCurrencySymbol + betStr;
  }

  //切換SPIN按鈕的狀態
  public ChangeStyle(_SpinStatus: SpinStatus, _AutoSpinCount: number): void {
    switch (_SpinStatus) {
      case SpinStatus.Spin:
        this.NormalStatus();
        break;
      case SpinStatus.BlockSpin:
        this.BlockSpinStatus();
        break;
      case SpinStatus.BlockStop:
        this.BlockStopStatus();
        break;
      case SpinStatus.HideSpin:
        this.HideSpinStatus();
        break;
      case SpinStatus.Stop:
        this.StopStatus();
        break;
      case SpinStatus.Skip:
        this.SkipStatus();
        break;
      case SpinStatus.Start:
        this.StartStatus();
        break;
      case SpinStatus.AutoSpin:
        this.AutoPlayStatus(_AutoSpinCount);
        break;
      case SpinStatus.SpecialGame:
        this.SpecialGameStatus();
        break;
    }
  }

  //關閉按鈕所有狀態
  protected ResetAllBtn(): void {
    this.spinButton.node.active = false;
    this.stopButton.node.active = false;
    this.skipButton.node.active = false;
    this.startButton.active = false;
    this.freeGameBar.active = false;

    this.spinButton.interactable = false;
    this.stopButton.interactable = false;
    this.skipButton.interactable = false;
    this.autospinButton.node.active = false;

    this.clickStartBtnTip.active = false;

    this.spinButtonBlock.active = false;
    this.stopButtonBlock.active = false;
  }

  //可以SPIN的狀態
  public NormalStatus(): void {
    this.ResetAllBtn();

    this.spinButton.node.active = true;
    this.spinButton.interactable = true;
    this.spinButtonBlock.active = false;

    setColor(this.openMenuButton, Color.WHITE);
    this.SetBottomBarButtonsEnable(true);
  }

  //顯示壓暗的SPIN按鈕
  public BlockSpinStatus(): void {
    this.ResetAllBtn();

    this.spinButtonBlock.active = true;
    this.spinButton.node.active = true;

    setColor(this.openMenuButton, Color.GRAY);
    this.SetBottomBarButtonsEnable(false);
  }

  //顯示壓暗的STOP按鈕，打開auto鈕
  public BlockStopStatus(): void {
    this.ResetAllBtn();

    this.stopButtonBlock.active = true;
    this.stopButton.node.active = true;

    setColor(this.openMenuButton, Color.GRAY);
    this.SetBottomBarButtonsEnable(false);
    this.autoButtonBlock.active = false; //auto鈕要用來停止自動旋轉
    this.turboButtonBlock.active = false;
  }

  ///隱藏SPIN按鈕
  public HideSpinStatus(): void {
    this.ResetAllBtn();
    setColor(this.openMenuButton, Color.GRAY);
    this.SetBottomBarButtonsEnable(false);
  }

  //顯示STOP按鈕
  public StopStatus(): void {
    this.ResetAllBtn();
    this.stopButtonBlock.active = false;
    this.stopButton.node.active = true;
    this.stopButton.interactable = true;
  }

  //顯示SKIP按鈕
  public SkipStatus(): void {
    this.ResetAllBtn();

    this.skipButton.node.active = true;
    this.skipButton.interactable = true;

    //免費遊戲中不開啟按鈕
    if (
      SlotGameMediator.instance.mainGameHost.getNowPlayMode() ===
      GamePlayMode.Normal
    ) {
      this.autoButtonBlock.active = false;
      this.turboButtonBlock.active = false;
    }
  }

  //顯示START按鈕
  public StartStatus(): void {
    this.ResetAllBtn();

    this.clickStartBtnTip.active = true;
    this.startButton.active = true;
  }

  //顯示AutoSpin按鈕
  public AutoPlayStatus(Times: number): void {
    if (Times === 0) this.BlockSpinStatus();
    else this.ResetAllBtn();

    setColor(this.openMenuButton, Color.GRAY);
    if (PlatformData.instance.fastspin) this.stopButtonBlock.active = true;
    else this.stopButtonBlock.active = false;
    this.autospinButton.node.active = true;
    this.SetAutoPlayTimesText(Times);

    this.SetBottomBarButtonsEnable(false);
    this.autoButtonBlock.active = false; //auto鈕要用來停止自動旋轉
    this.turboButtonBlock.active = false;
  }

  public SetAutoPlayTimesText(Times: number): void {
    if (Times === -1) {
      //無限次自動旋轉
      this.autospinTimesRichText.string =
        '<outline color=#000000 width=2><b>∞</b></outline>';
      this.autospinTimesRichText.fontSize = 64;
    } else if (Times === 0) {
      this.autospinTimesRichText.string = '';
    } else {
      this.autospinTimesRichText.string =
        '<outline color=#000000 width=2><b>' +
        Times.toString() +
        '</b></outline>';
      this.autospinTimesRichText.fontSize = 32;
    }
  }

  //顯示FreeSpin的次數
  public SpecialGameStatus(): void {
    this.ResetAllBtn();

    this.freeGameBar.active = true;
    setColor(this.openMenuButton, Color.GRAY);
    this.SetBottomBarButtonsEnable(false);
  }

  //關閉全屏按鈕
  public OnChangeFullScreenBtn(IsOn: boolean) {
    if (IsOn) {
      this.fullScreenBtn_Open.active = false;
      this.fullScreenBtn_Close.active = true;
    } else {
      this.fullScreenBtn_Open.active = true;
      this.fullScreenBtn_Close.active = false;
    }
  }

  //按下SPIN
  public OnSpinClick(): void {
    if (this.spinClicked.length > 0) this.spinClicked.notify();

    this.triggerKeyEditBox.string = '';
  }

  //開啟自動旋轉視窗
  protected OnOpenAutospinPopup() {
    if (this.openAutospinPopupButtonClicked.length > 0)
      this.openAutospinPopupButtonClicked.notify();
  }

  //開啟切Bet視窗
  private OnOpenBetPopup() {
    if (this.openBetPopupButtonClicked.length > 0)
      this.openBetPopupButtonClicked.notify();
  }

  //取消自動旋轉
  private CancelAutospin() {
    if (this.cancelAutospin.length > 0) this.cancelAutospin.notify();
  }

  //打開主選單
  private OnOpenMainMenu() {
    if (this.openMainMenuButtonClicked.length > 0)
      this.openMainMenuButtonClicked.notify();
  }

  //關閉主選單
  protected OnCloseMainMenu(_ButtonNode: Node = null, isRecoverCursor = false) {
    if (isRecoverCursor) game.canvas.style.cursor = 'default';

    if (this.closeMainMenuButtonClicked.length > 0)
      this.closeMainMenuButtonClicked.notify();
  }

  //開Info頁面
  private OnClickInfoPopup() {
    if (this.infoPopupButtonClicked.length > 0)
      this.infoPopupButtonClicked.notify();
  }

  //開GameLog頁面
  private OnClickGameLogPopup() {
    if (this.gameLogPopupButtonClicked.length > 0)
      this.gameLogPopupButtonClicked.notify();
  }

  //開啟音效
  private OnOpenAudio() {
    if (this.audioMute.length > 0) this.audioMute.notify(false);
  }

  //關閉音效
  private OnCloseAudio() {
    if (this.audioMute.length > 0) this.audioMute.notify(true);
  }

  //點下全屏按鈕
  private OnClickFullScreen() {
    if (this.clickFullScreen.length > 0) this.clickFullScreen.notify();
  }

  protected GetBagSetting() {
    //ItemManager.instance.sendBagSetting(this.ReceiveBagSetting.bind(this));
  }

  private ReceiveBagSetting(
    result: number,
    data: ItemSystemDataInterface.S2C_BagSetting
  ) {
    //TODO: try catch
    if (result === httpResult.ok && data.Code === 0) {
      this.backpackBtn.node.active = true;
      this.backpackRedDot.active = data.New;
      if (data.CoolDown !== undefined && data.CoolDown > 0)
        this.backpackGetDataCD = data.CoolDown;
    } else if (data.Code === 3) {
      //不再詢問背包按鈕
      this.unschedule(this.GetBagSetting);
    } else {
      this.backpackBtn.node.active = false;
    }
  }

  private ActiveRedDot(active: boolean) {
    this.backpackRedDot.active = active;
  }

  public OnClickBackpackBtn() {
    this.backpackRedDot.active = false;
    EventManager.instance.dispatchEvent(
      BackpackManager.backpackEvent.open,
      this.backpackGetDataCD
    );
  }

  //點下首頁按鈕
  private OnClickHome() {
    if (this.clickHome.length > 0) this.clickHome.notify();
  }

  // 重設贏分
  public OnResetWinNum(): void {
    if (PlatformData.licenseSetting.closeWinTxtWithZero) {
      this.SetWinDisplay(false);
    }
    this.winNumberCounter.reset();
  }

  // 時間內增加贏分
  public OnShowWinAnimCount(dTarget: number, fTotalTime: number): void {
    if (PlatformData.licenseSetting.closeWinTxtWithZero) {
      this.SetWinDisplay(dTarget > 0);
    }
    //this.ShowSystemMessageUI(true); //跳出贏分時無須先開啟黑背景,由顯示Message時再打開

    this.winNumberCounter.setTargetNumberAnimationEx(dTarget, fTotalTime);
  }

  // 快速跳到最後贏分
  public OnForceStopWinAnim(): void {
    if (PlatformData.licenseSetting.closeWinTxtWithZero) {
      this.SetWinDisplay(this.winNumberCounter.getTargetNumber() > 0);
    }
    this.winNumberCounter.setNumberToStop();
  }

  //打開系統訊息的背景
  public ShowSystemMessageUI(isShow: boolean) {
    this.systemMessageUI.ShowBg(isShow);
  }

  //// <summary>
  //// 點擊停止旋轉
  //// </summary>
  public OnStopClick(): void {
    if (this.stopClicked.length > 0) this.stopClicked.notify();
  }

  //// <summary>
  //// 點擊略過
  //// </summary>
  public OnSkipClick(): void {
    if (this.skipClicked.length > 0) this.skipClicked.notify();
  }

  //// <summary>
  //// 點擊開始特殊遊戲
  //// </summary>
  public OnStartClick(): void {
    console.log('********* bottombar 點擊開始特殊遊戲 ******* ');
    if (this.startClicked.length > 0) this.startClicked.notify();
  }

  //// <summary>
  //// 點擊ExtraBet
  //// </summary>
  public OnExtraBetClick(): void {
    if (this.extraBetClicked.length > 0) this.extraBetClicked.notify();
  }

  //刪除SG狀態
  private OnClickClearFeature() {
    if (this.clickClearFeature.length > 0) this.clickClearFeature.notify();
  }

  public SetSerialNO(SerialNO: string) {
    this.serialNOLabel.string = SerialNO;
    this.serialNOLabelUnderTopBar.string = SerialNO;
  }

  public AdjustSerialNOPosition() {
    if (PlatformData.isLandscape) {
      this.serialNOLabel.node.setPosition(new Vec3(-21, 0));
    }
  }

  //開關TopBar，隱藏時在右上顯示局號
  public ShowTopBar(isShow: boolean) {
    if (isShow) {
      setOpacity(this.topBarRoot, 255);
      this.serialNOLabelUnderTopBar.node.active = false;
    } else {
      setOpacity(this.topBarRoot, 0);
      this.serialNOLabelUnderTopBar.node.active = true;
    }
  }

  //Retrigger特效表演(先放在這裡，待整合)
  public PlayRetriggerEffect(_callback: Function, _target: any) {
    const moveEffect: Node = instantiate(this.retriggerEffect_Move.data);
    moveEffect.parent = this.effectRoot;
    let _hitEffect: Node;
    moveEffect.setPosition(getWorldSpaceAR(this.systemMessageUI.node));

    //   moveEffect.runAction(
    //     sequence(
    //       moveTo(0.5, this.spinButton.node.convertToWorldSpaceAR(v2(0, 0))), ////Move特效飛到Spin按鈕上

    //       //產生Hit效果
    //       callFunc(() => {
    //         hitEffect = instantiate(this.retriggerEffect_Hit.data);
    //         hitEffect.parent = this.effectRoot;
    //         hitEffect.setPosition(
    //           this.spinButton.node.convertToWorldSpaceAR(v2(0, 0))
    //         );
    //       }),

    //       //callback回去讓使用者加次數
    //       callFunc(callback, target),

    //       delayTime(2), //延遲一秒

    //       //回收物件
    //       callFunc(() => {
    //         if (moveEffect !== null) moveEffect.destroy();

    //         if (hitEffect !== null) hitEffect.destroy();
    //       })
    //     )
    //   );
  }

  //開關顯示網路不穩的提示
  ////飛到下Bar的特效
  public PlayFlyToBottomBarEffect(
    startPos: Vec3,
    moveEffectPrefab: Node,
    _moveDuration: number,
    _callback: Function,
    _target: any
  ) {
    const moveEffect: Node = instantiate(moveEffectPrefab);
    moveEffect.parent = this.effectRoot;
    let _hitEffect: Node;
    moveEffect.setPosition(startPos);

    // moveEffect.runAction(
    //   sequence(
    //     moveTo(
    //       moveDuration,
    //       this.spinButton.node.convertToWorldSpaceAR(v2(0, 0))
    //     ), ////Move特效飛到Spin按鈕上

    //     ////產生Hit效果
    //     callFunc(() => {
    //       hitEffect = instantiate(this.retriggerEffect_Hit.data);
    //       hitEffect.parent = this.effectRoot;
    //       hitEffect.setPosition(
    //         this.spinButton.node.convertToWorldSpaceAR(v2(0, 0))
    //       );
    //     }),

    //     ////callback回去讓使用者加次數
    //     callFunc(callback, target),

    //     delayTime(2), ////延遲一秒

    //     ////回收物件
    //     callFunc(() => {
    //       if (moveEffect !== null) moveEffect.destroy();

    //       if (hitEffect !== null) hitEffect.destroy();
    //     })
    //   )
    // );
  }

  ////開關顯示網路不穩的提示
  public ShowInternetUnstableTip(isShow: boolean) {
    setOpacity(this.internetUnstableTipNode, isShow ? 255 : 0);
    // if (isShow) {
    // const action: Action = sequence(fadeIn(1), fadeOut(1)).repeatForever();
    // this.internetUnstableTipNode.runAction(action);
    // } else {
    // this.internetUnstableTipNode.stopAllActions();
    // setOpacity(this.internetUnstableTipNode, 0);
    // }
  }

  //顯示ExtraBet按鈕
  public ShowExtraBetButton() {
    this.extraBetButton.active = true;
  }

  //設定FreeGameBar的次數
  public SetFreeGameBarSpinTimes(CurrentSpin: number, TotalSpin: number): void {
    if (Define.DEBUG_LOG) {
      console.log(
        '[BottomBar][SetFreeGameBarSpinTimes] ' +
          CurrentSpin +
          ' / ' +
          TotalSpin
      );
    }
    this.freeGameBarLabel.string = CurrentSpin + '/' + TotalSpin;
  }

  //設定FreeGameBar的次數
  public SetFreeGameBarSpinTimesByString(Context: string): void {
    if (Define.DEBUG_LOG) {
      console.log('[BottomBar][SetFreeGameBarSpinTimes] ' + Context);
    }
    this.freeGameBarLabel.string = Context;
  }

  public SetBottomBarButtonsEnable(isOn: boolean) {
    if (isOn) {
      for (let i = 0; i < this.bottomBarButtonBlocks.length; i++) {
        this.bottomBarButtonBlocks[i].active = false;
      }
      this.autoButtonBlock.active = false;
      this.turboButtonBlock.active = false;
      this.backpackBtn.interactable = true;
    } else {
      for (let i = 0; i < this.bottomBarButtonBlocks.length; i++) {
        this.bottomBarButtonBlocks[i].active = true;
      }
      this.autoButtonBlock.active = true;
      this.turboButtonBlock.active = true;
      this.backpackBtn.interactable = false;
    }
  }

  //自動選擇相關-------------------------------------------------------------------------------------------------------------

  /**
   *
   * @param needShowContent 是否顯示預設文字
   * @param customContent 自訂文字內容 (秒數需替代成%d)
   * @param landScapePos 橫版座標
   * @param landScapeSize 橫版Size
   * @param portraitPos 直版座標
   * @param portraitSize 直版Size
   */
  public InitAutoSelectSetting(
    needShowContent = true,
    customContent = '',
    landScapePos: Vec3 = Vec3.ZERO,
    landScapeSize: Vec2 = new Vec2(900, 50),
    portraitPos: Vec3 = Vec3.ZERO,
    portraitSize: Vec2 = new Vec2(500, 100)
  ) {
    this.needShowAutoSelectContent = needShowContent;
    this.customAutoSelectContent = customContent;

    this.autoSelectLabel_LandscapePos = landScapePos;
    this.autoSelectLabel_LandscapeSize = landScapeSize;
    this.autoSelectLabel_PortraitPos = portraitPos;
    this.autoSelectLabel_PortraitSize = portraitSize;

    this.ResetTimer();
    this.RefreshAutoSelectUI();
  }

  private RefreshAutoSelectUI() {
    if (!this.needShowAutoSelectContent) {
      return;
    }

    //如果不支援直橫轉換，先預設橫版客製處理
    if (PlatformData.isLandscape === null) {
      console.warn('[BottomBar]->CheckCustomSetting-> 不支援直橫轉換');
      //設定客製Pos
      if (this.autoSelectLabel_LandscapePos !== null) {
        this.autoSelectCountDownLabel.node.setPosition(
          this.autoSelectLabel_LandscapePos
        );
      }

      if (this.autoSelectLabel_LandscapeSize !== null) {
        setSize(
          this.autoSelectCountDownLabel.node,
          this.autoSelectLabel_LandscapeSize.x,
          this.autoSelectLabel_LandscapeSize.y
        );
      }

      return;
    }

    if (PlatformData.isLandscape) {
      //設定客製Pos
      if (this.autoSelectLabel_LandscapePos !== null) {
        this.autoSelectCountDownLabel.node.setPosition(
          this.autoSelectLabel_LandscapePos
        );
      }

      if (this.autoSelectLabel_LandscapeSize !== null) {
        setSize(
          this.autoSelectCountDownLabel.node,
          this.autoSelectLabel_LandscapeSize.x,
          this.autoSelectLabel_LandscapeSize.y
        );
      }
    } else {
      //設定客製Size
      if (this.autoSelectLabel_PortraitPos !== null) {
        this.autoSelectCountDownLabel.node.setPosition(
          this.autoSelectLabel_PortraitPos
        );
      }

      if (this.autoSelectLabel_PortraitSize !== null) {
        setSize(
          this.autoSelectCountDownLabel.node,
          this.autoSelectLabel_PortraitSize.x,
          this.autoSelectLabel_PortraitSize.y
        );
      }
    }
  }

  /**
   * 開始自動倒數
   * @param countDownTime 倒數時間(預設20秒)
   * @param perSecCB 每秒的callBack
   * @param endCB 結束的callBack
   * @returns
   */
  public StartAutoSelectTimer(
    countDownTime = 20,
    perSecCB: Function = null,
    endCB: Function = null
  ) {
    //重置倒數
    this.ResetTimer();

    if (countDownTime <= 0) {
      console.warn('自動選擇倒數秒數<=0  不做倒數!!');
      return;
    } else {
      this.customCountDownTime = countDownTime;
    }

    this.autoSelectPerSecCB = perSecCB;
    this.autoSelectEndCB = endCB;

    //開始倒數
    this.schedule(this.Timer, 1);
  }

  /**
   * 停止自動倒數
   */
  public StopAutoSelectTimer() {
    //停止倒數
    this.unschedule(this.Timer); // 停止計時器

    this.autoSelectCountDownLabel.node.active = false;
    //重置倒數
    this.ResetTimer();
  }

  /**
   * 時間倒數計時器
   */
  private Timer() {
    this.currentTime++;
    const remainingTime = this.customCountDownTime - this.currentTime;

    if (this.needShowAutoSelectContent) {
      //取得多國語系的字串顯示
      let multiStr = Functions.isNullOrEmpty(this.customAutoSelectContent)
        ? MultiLangHandler.getGameText('Common_DisconnectSettleCountDown')
        : this.customAutoSelectContent;
      //再把其中的%d替換成目前的剩餘時間
      multiStr = multiStr.replace('%d', remainingTime.toString());
      this.autoSelectCountDownLabel.string = multiStr;

      this.autoSelectCountDownLabel.node.active = remainingTime > 0;
    }
    //每秒CallBack
    if (this.autoSelectPerSecCB !== null) {
      this.autoSelectPerSecCB(remainingTime);
    }

    if (remainingTime <= 0) {
      this.unschedule(this.Timer); // 停止計時器
      //結束CallBack
      if (this.autoSelectEndCB !== null) {
        this.autoSelectEndCB();
      }
      this.ResetTimer();
    }
  }

  /**
   * 重置Timer設定
   */
  private ResetTimer() {
    this.autoSelectPerSecCB = null;
    this.autoSelectEndCB = null;
    this.currentTime = 0;
  }

  protected OnFastSpinClicked() {
    if (this.clickFastSpin.length > 0) {
      this.clickFastSpin.notify(!PlatformData.instance.fastspin);
    }
  }

  public SetProbVersion(data: JSON) {
    // 測試環境顯示機率表版本
    if (PlatformData.instance.isDebugMode && this.probVersionLabel !== null) {
      let probVersion = '';
      if (data.hasOwnProperty('ProbId')) {
        probVersion += 'ProbId: ';
        probVersion += data['ProbId'];
      }
      if (data.hasOwnProperty('ProbGroupName')) {
        probVersion += ', ProbGroupName: ';
        probVersion += data['ProbGroupName'];
      }
      this.probVersionLabel.string = probVersion;
    }
  }
}
