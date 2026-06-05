import {_decorator, CCBoolean, Component, Node, Sprite, SpriteFrame} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
const {ccclass, property} = _decorator;

@ccclass('GameNameShowControl')
export class GameNameShowControl extends Component {
  //左上角白字
  @property(CCBoolean) showGameNameInSS = false;
  @property(CCBoolean) showGameNameInIG = true;
  @property(CCBoolean) showGameNameInDara = false;
  //logo
  @property(CCBoolean) showLogoInSS = true;
  @property(CCBoolean) showLogoInIG = true;
  @property(CCBoolean) showLogoInDara = true;

  @property(Node) gameNameNode: Node | null = null; // Game name node
  @property(Sprite) logoSprite: Sprite | null = null; // Game logo sprite
  @property([SpriteFrame]) logoSpriteFrame: SpriteFrame[] = []; //0: English, 1: Chinese

  protected onLoad(): void {
    this.setGameName();
    this.setLogoSpriteFrame();
  }
  private setGameName() {
    //SS GD
    if (PlatformData.isSSEnv && this.showGameNameInSS === false) {
      this.gameNameNode.active = false;
    }
    //Dara Joya
    if (PlatformData.isDaraEnv && this.showGameNameInDara === false) {
      this.gameNameNode.active = false;
    }
    //Macross IG
    if (
      PlatformData.isSSEnv === false &&
      PlatformData.isDaraEnv === false &&
      this.showGameNameInIG === false
    ) {
      this.gameNameNode.active = false;
    }
  }
  private setLogoSpriteFrame() {
    if (this.logoSprite === null) {
      return;
    } else {
      //SS GD
      if (PlatformData.isSSEnv && this.showLogoInSS === false) {
        this.logoSprite.node.active = false;
        return;
      }
      //Dara Joya
      if (PlatformData.isDaraEnv && this.showLogoInDara === false) {
        this.logoSprite.node.active = false;
        return;
      }
      //Macross IG
      if (
        PlatformData.isSSEnv === false &&
        PlatformData.isDaraEnv === false &&
        this.showLogoInIG === false
      ) {
        this.logoSprite.node.active = false;
        return;
      }

      switch (PlatformData.lang) {
        case 'zh-cn':
        case 'zh-tw':
          this.logoSprite.spriteFrame = this.logoSpriteFrame[1];
          break;
        default:
          this.logoSprite.spriteFrame = this.logoSpriteFrame[0];
          break;
      }
    }
  }
}
