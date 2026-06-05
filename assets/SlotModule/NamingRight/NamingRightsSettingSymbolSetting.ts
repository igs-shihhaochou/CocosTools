import {
  _decorator,
  CCBoolean,
  CCInteger,
  CCString,
  Component,
  resources,
  SpriteFrame,
} from 'cc';
import Functions from '../../CommonModule/Script/Utility/Functions';
import {SymbolSetting} from '../../SlotModule/Wheel/SymbolSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
const {ccclass, property} = _decorator;

@ccclass('NamingDataSymbolSetting')
export class NamingDataSymbolSetting {
  @property(CCBoolean)
  public useCompanyName = false;
  @property(CCString)
  public companyName = '';
  @property(CCBoolean)
  public useGameId = false;
  @property(CCString)
  public gameId = '';
  @property(CCString)
  public fileName = '';
  @property(CCInteger)
  public symbolIndex = 0;
}

@ccclass('NamingRightsSettingSymbolSetting')
export class NamingRightsSettingSymbolSetting extends Component {
  @property(SymbolSetting)
  public symbolSetting: SymbolSetting = null;
  @property([NamingDataSymbolSetting])
  public namingData: NamingDataSymbolSetting[] = [];

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
        let file = '';
        if (this.namingData[i].useCompanyName) {
          file = `${logoName}/${this.namingData[i].fileName}/spriteFrame`;
        } else if (this.namingData[i].useGameId) {
          file = `${gameId}/${this.namingData[i].fileName}/spriteFrame`;
        }
        resources.load(file, SpriteFrame, (err, sf) => {
          if (err) {
            console.error(err);
            return;
          }

          for (let j = 0; j < this.symbolSetting.symbolIDAry.length; j++) {
            if (
              this.symbolSetting.symbolIDAry[j].symbolID ===
              this.namingData[i].symbolIndex
            ) {
              this.symbolSetting.symbolIDAry[j].spriteFrame = sf;
              break;
            }
          }
        });
      }
    }
  }
}
