import {
  _decorator,
  CCBoolean,
  CCString,
  Component,
  resources,
  Sprite,
  SpriteFrame,
} from 'cc';
import Functions from '../../CommonModule/Script/Utility/Functions';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
const {ccclass, property} = _decorator;

@ccclass('NamingData')
export class NamingData {
  @property(CCBoolean)
  public useCompanyName = false;
  @property(CCString)
  public companyName = '';
  @property(CCBoolean)
  public useGameId = false;
  @property(CCString)
  public gameId = '';
  @property(Sprite)
  public changeObj: Sprite = null;
  @property(CCString)
  public fileName = '';
}

@ccclass('NamingRightsSetting')
export class NamingRightsSetting extends Component {
  @property([NamingData])
  public namingData: NamingData[] = [];

  protected onLoad(): void {
    const logoName: string = Functions.getURLParameterByName('ShowLogo');
    const gameId = PlatformData.gameID.toString();
    console.log('NamingRightsSetting LogoName:', logoName);
    for (let i = 0; i < this.namingData.length; i++) {
      //判斷使用廠商名判斷 或 遊戲ID判斷
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
          // sf: SpriteFrame
          const sprite = this.namingData[i].changeObj.getComponent(Sprite);
          if (sprite) sprite.spriteFrame = sf;
        });
      }
    }
  }
}
