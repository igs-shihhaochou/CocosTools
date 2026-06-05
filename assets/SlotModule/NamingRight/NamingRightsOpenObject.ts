import {_decorator, CCBoolean, CCString, Component, Node} from 'cc';
import Functions from '../../CommonModule/Script/Utility/Functions';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
const {ccclass, property} = _decorator;

@ccclass('NamingOpenData')
export class NamingOpenData {
  @property(CCBoolean)
  public useCompanyName = false;
  @property(CCString)
  public companyName = '';
  @property(CCBoolean)
  public useGameId = false;
  @property(CCString)
  public gameId = '';
  @property([Node])
  public openObj: Node[] = [];
}

@ccclass('NamingRightsSetting')
export class NamingRightsSetting extends Component {
  @property([NamingOpenData])
  public namingData: NamingOpenData[] = [];

  protected onLoad(): void {
    const logoName: string = Functions.getURLParameterByName('ShowLogo');
    const gameId = PlatformData.gameID.toString();
    console.log('NamingRightsSetting LogoName:', logoName);
    for (let i = 0; i < this.namingData.length; i++) {
      if (
        (this.namingData[i].useCompanyName &&
          this.namingData[i].companyName === logoName) ||
        (this.namingData[i].useGameId && this.namingData[i].gameId === gameId)
      ) {
        for (let j = 0; j < this.namingData[i].openObj.length; j++) {
          this.namingData[i].openObj[j].active = true;
        }
      }
    }
  }
}
