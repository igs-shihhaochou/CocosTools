import {_decorator, Component, Label} from 'cc';
import MultiLangHandler from 'db://assets/CommonModule/Script/Core/MultiLangHandler';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';

const {ccclass, property} = _decorator;

@ccclass('GameNameDisplay')
export default class GameNameDisplay extends Component {
  @property(Label)
  private label: Label | null = null;
  protected onLoad(): void {
    SlotGDK.instance.eventSceneIsReady.insert(this.onSceneIsReady, this);
  }
  protected onDestroy(): void {
    SlotGDK.instance.eventSceneIsReady.remove(this.onSceneIsReady, this);
  }

  private onSceneIsReady() {
    if (!PlatformData.certArea && !PlatformData.certId) {
      this.label.string = '';
      return;
    }
    this.label.string = this.getGameNameFromGameList(PlatformData.gameName);
  }

  protected getGameNameFromGameList(game: number | string): string {
    const oriGameName = game.toString();
    let gameName = null;
    //找對應的多語系名稱
    if (MultiLangHandler.MultiGameNameList) {
      const multiGameNameList = MultiLangHandler.MultiGameNameList;

      //找出game name對應的多語系名稱
      if (
        multiGameNameList[oriGameName] !== undefined &&
        multiGameNameList[oriGameName][PlatformData.instance.lang] !== undefined
      ) {
        //遊戲多語系名稱
        gameName = multiGameNameList[oriGameName][PlatformData.instance.lang];
      }
    }
    return gameName ?? oriGameName; // 如果沒有找到對應的多語系名稱，則返回原始遊戲名稱
  }
}
