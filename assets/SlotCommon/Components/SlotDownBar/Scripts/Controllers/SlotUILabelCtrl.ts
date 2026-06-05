import {Component, Label, _decorator} from 'cc';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import {UserInfo} from '../../../../../CommonModule/Script/Define/UserInfo';
import {SlotGDK} from '../../../../../SlotModule/Define/SlotGDK';
import {DEV} from 'cc/env';
import {SlotUISwitch} from '../Define/SlotUISwitch';
import Functions from '../../../../../CommonModule/Script/Utility/Functions';
import type {UrlParameterFormat} from '../../../../../CommonModule/Script/Type/CommonDefine';
const {ccclass, property} = _decorator;
@ccclass('SlotUILabelCtrl')
export class SlotUILabelCtrl extends Component {
  @property(Label)
  private userNameLabel: Label = null;
  @property(Label)
  private gameVersionLabel: Label = null;
  @property(Label)
  private gameSNLabel: Label = null;
  @property(Label)
  private probabilityVersionLabel: Label = null;

  private registerEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    SlotGDK.instance.receiveSpinData[func](this.setLabel, this);
    SlotGDK.instance.receiveFeverData[func](this.setLabel, this);
    SlotGDK.instance.receiveDoubleGameData.insert(this.setLabel, this);
  }

  private setLabel(rawData) {
    if (rawData.data) {
      this.setGameSN(rawData.data['serial_id'] ?? '');
      this.setProbabilityVersion(rawData.data);
    }
  }

  private clearAll() {
    this.setUserName('');
    this.setGameSN('');
    this.setProbabilityVersion(null);
  }

  onLoad() {
    this.clearAll();
    this.registerEvents(true);
    this.setGameVersion();
  }

  onDestroy() {
    this.registerEvents(false);
  }

  public init() {
    this.setVisibility();
    if (SlotUISwitch.nickNameFromUrl) {
      const name = (Functions.getURLParameter() as UrlParameterFormat)['user'];
      this.setUserName(name);
    } else {
      this.setUserName(UserInfo.instance.nickName);
    }
  }

  public setUserName(userName: string): void {
    this.userNameLabel.string = userName;
  }

  public setGameVersion(): void {
    const splitPath = location.pathname.split('/');
    const version = splitPath[splitPath.length - 3];
    if (version) {
      this.gameVersionLabel.string = `v.${version}`;
    } else if (DEV) {
      this.gameVersionLabel.string = 'DEV MODE';
    }
  }

  private setGameSN(gameSerial: string): void {
    this.gameSNLabel.string = gameSerial;
  }

  private setProbabilityVersion(data: JSON): void {
    if (!data) {
      this.probabilityVersionLabel.string = '';
      return;
    }
    if (PlatformData.instance.isDebugMode) {
      let probVersion = '';
      if (data.hasOwnProperty('ProbId')) {
        probVersion += 'ProbId: ';
        probVersion += data['ProbId'];
      }
      if (data.hasOwnProperty('ProbGroupName')) {
        probVersion += ', ProbGroupName: ';
        probVersion += data['ProbGroupName'];
      }
      this.probabilityVersionLabel.string = probVersion;
    } else {
      this.probabilityVersionLabel.string = '';
    }
  }

  private setVisibility() {
    const {showGameSN, showGameVersion, showUsername} = SlotUISwitch;
    this.userNameLabel.node.active = showUsername;
    this.gameVersionLabel.node.active = showGameVersion;
    this.gameSNLabel.node.active = showGameSN;
  }
}
