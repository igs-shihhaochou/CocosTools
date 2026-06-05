import {_decorator, Component, JsonAsset} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';

const {ccclass, property} = _decorator;

@ccclass
export default class HostSetting extends Component {
  /** 取得 Singleton 物件實體 */
  public static get instance(): HostSetting {
    return window['hostSetting'];
  }

  @property({type: JsonAsset, displayName: '北美設定檔'})
  private naHostSettingJson: JsonAsset = null; // 北美
  @property({type: JsonAsset, displayName: '東南亞設定檔'})
  private saHostSettingJson: JsonAsset = null; // 東南亞

  public gameSetting: HostSettingInterface.GameSetting = null;
  public connectSetting: HostSettingInterface.ConnectSetting = null;
  public bingo: HostSettingInterface.Bingo = null;
  public winEffect: HostSettingInterface.WinEffect = null;
  public winLabel: HostSettingInterface.WinLabel = null;
  public awardSetting: HostSettingInterface.AwardSetting = null;

  get hostSettingJson() {
    if (PlatformData.isDaraEnv || PlatformData.isSSEnv)
      return this.naHostSettingJson;
    else return this.saHostSettingJson;
  }

  set hostSettingJson(value: JsonAsset) {
    if (PlatformData.isDaraEnv || PlatformData.isSSEnv)
      this.naHostSettingJson = value;
    else this.saHostSettingJson = value;
  }

  protected onLoad(): void {
    if (window['hostSetting']) {
      this.node.destroy();
      return;
    }
    window['hostSetting'] = this;

    const jsonData = this.hostSettingJson.json;
    this.gameSetting = jsonData.gameSetting;
    this.connectSetting = jsonData.connectSetting;
    this.bingo = jsonData.bingo;
    this.winEffect = jsonData.winEffect;
    this.winLabel = jsonData.winLabel;
    this.awardSetting = jsonData.awardSetting;
  }
  protected onDestroy(): void {
    window['hostSetting'] = null;
  }
}

/**  協定介面 */
export namespace HostSettingInterface {
  export interface GameSetting {
    readyToSpinDelay: ReadyToSpinDelay;
    isUseShutter: boolean;
    quickStopWhenFastSpin: boolean;
    bgm: BGM;
  }

  export interface ReadyToSpinDelay {
    noWin: number;
    fastSpinNoWin: number;
    haveWin: number;
    multiplier: number;
  }
  export interface AwardSetting {
    alarmDelayTime: number;
  }

  export interface BGM {
    fadeInWhenSpin: boolean;
    /** <0 不 FadeOut */
    fadeOutDelay: number;
  }

  export interface ConnectSetting {
    isConnectServer: boolean;
    server: Server;
    fakeDataPathStartGame: string;
    fakeDataPathSpin: string[];
    retryIntervalArray: number[];
  }

  export interface Server {
    isSimpleServer: boolean;
    isGDSlotGame: boolean;
    isGDSlotMachine: boolean;
    userId: string;
    commandName: CommandName;
  }

  export interface CommandName {
    startGame: string;
    spin: string;
    specialGame: string;
    getBuyBonusInfo: string;
    buyBonusSpin: string;
    lines: string;
    lineBet: string;
  }

  export interface Bingo {
    showMode: number;
    useBingoFrame: boolean;
    useWheelMask: boolean;
    useScatterWin: boolean;
    dontShowAllBingoAnimationInMG: boolean;
    showWinEffectAfterAllBingo: boolean;
    dontShowBottomBarMessage: boolean;
    showDuation: number;
    hideDuration: number;
    skipLineWhenAutoEnabled: boolean;
  }

  export interface WinEffect {
    skipInSpecialGame: boolean;
    showTotalAfterSpecialGame: boolean;
    smallWin: WinEffectParameter;
    bigWin: WinEffectParameter;
    megaWin: WinEffectParameter;
    superWin: WinEffectParameter;
    specialWin: WinEffectParameter;
  }

  export interface WinLabel {
    smallWin: WinLabelParameter;
    bigWin: WinLabelParameter;
    megaWin: WinLabelParameter;
    superWin: WinLabelParameter;
    specialWin: WinLabelParameter;
  }

  export interface WinEffectParameter {
    showDelay: number;
    duration: number;
    skipDelay: number;
  }

  export interface WinLabelParameter {
    duration: number;
  }
}
