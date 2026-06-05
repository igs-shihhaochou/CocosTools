import ArkClient from '../../CommonModule/Script/Network/ArkSDK/ArkClient';
import {Dictionary} from '../../CommonModule/Script/Utility/Dictionary';

export class GameData {
  private static _instance: GameData;

  public static get instance(): GameData {
    if (!GameData._instance) {
      GameData._instance = new GameData();
    }
    return GameData._instance;
  }

  public arkClient: ArkClient = null;

  //遊戲資源&參數
  public lang = ''; //語言
  public currency = ''; //幣種
  public gameId = ''; //與Server溝通用的GameID
  public apiGameId = ''; //API定義的GameID
  public version = ''; //Client版本號_Server機率版本號
  public startGameInfoSN = ''; //StartGame會取得的序號
  public gameLogVersion = ''; //GameLog的版本號

  public clientIP = ''; ////Client的位置

  //APIInfo
  public arkID = '';
  public arkToken = '';
  public arkKey = '';

  public thirdPartyId = '';
  public thirdPartyToken = '';

  public logo = '';
  public mid = '';
  public zone = '';

  //遊戲設定
  public audioMute = false; //靜音

  public autospinTimes = 0; //自動旋轉次數
  public autospin = false; //自動旋轉
  public fastspin = false; //快速旋轉
  public stopAutoInSpecialGame = false; //免費遊戲結束自動旋轉

  public betList: object = {};
  public currentTotalBet = 0;
  public currentLineBet = 0;

  public errorCodeDic: Dictionary<number, string> = new Dictionary();

  public devmode = ''; //TriggerKey

  //forTest
  public debugVersion = ''; //版本號

  //多幣種
  public displayDigit = 0; //顯示幾位小數位數
  public displayRatio = 0; //顯示數值縮放

  //ExtraBet
  public isExtraBet = false;
  public originalTotalBet = 0; //乘上ExtraBet倍數前的TotalBet
  public originalLineBet = 0; //乘上ExtraBet倍數前的LineBet

  //道具卡id
  public itemId = '';
}
