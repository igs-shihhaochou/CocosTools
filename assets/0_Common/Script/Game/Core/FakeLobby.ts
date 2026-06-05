import {_decorator, CCString, Component, director, Label} from 'cc';
import {EDITOR} from 'cc/env';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {waitForSeconds} from 'db://assets/CommonModule/Script/ExtraType';
import {LobbyClient} from 'db://assets/CommonModule/Script/Network/SS/Network/LobbyClient';
import {LoginModel} from 'db://assets/CommonModule/Script/Network/SS/Network/LoginModel';
const {ccclass, property} = _decorator;

@ccclass('FakeLobby')
export class FakeLobby extends Component {
  @property(CCString)
  private user = '';
  @property(CCString)
  private pw = '';
  @property(CCString)
  private host = 'https://lobby-dev.goldendragoncity.com:8080';
  @property(CCString)
  private gameHost = 'https://fish-dev-elb01.goldendragoncity.com:18080';
  @property(CCString)
  private gameName = '';
  @property(Label)
  private label: Label = null;
  @property(CCString)
  private language = 'en-us';
  start() {
    this.Login();
  }

  private Login() {
    console.log(
      '[FakeLobby] LobbyURL: ',
      this.host,
      ' id: ',
      this.user,
      ' pw: ',
      this.pw
    );

    LobbyClient.Instance = new LobbyClient();
    this.label.string = `[FakeLobby] status: Loggin In\nLobbyURL: ${this.host} \nid: ${this.user} \npw: ${this.pw}`;

    LobbyClient.Instance.DoLogin(
      this.host,
      this.user,
      this.pw,
      async () => {
        this.AddURLParameter();
        this.label.string =
          '[FakeLobby] status:Login Success, redirect to InitScene...';
        await waitForSeconds(0.01);
        //登入成功, 加載Slot共用資源
        director.loadScene('InitScene');
      },
      (status: number, data) => {
        //登入失敗, 使用CC物件Show訊息
        console.error(status, data);
        this.label.string = `[FakeLobby] status:${status}, data:${data}`;
      }
    );
  }

  /** iGaming遊戲所需參數都在網址上 */
  private AddURLParameter() {
    let URLParameter = '';
    //@ts-ignore
    URLParameter += '?logo=playgd';
    URLParameter += '&user=' + LoginModel.LoginInfo.user_id;
    URLParameter += '&game=' + this.gameName;
    URLParameter += '&isUseScoreBox=true';
    URLParameter += '&aid=' + LoginModel.LoginInfo.pin_ark_id;
    URLParameter += '&atoken=' + LoginModel.LoginInfo.pin_ark_token;
    URLParameter += '&isMute=false';
    // 先寫死
    URLParameter += '&currency=' + 'Coin';
    URLParameter += '&ft=' + 'ss';
    URLParameter += '&lang=' + this.language;
    // URLParameter += '&gameID=' + 52100;
    const siteParam = [this.host, this.gameHost?.trim()]
      .filter(Boolean) // 過濾空字串與 undefined
      .join(','); // 逗號串接
    URLParameter += '&site=' + siteParam;
    URLParameter += '&GameLog=' + undefined;
    URLParameter += '&eruda=' + false;
    // 傳入prizePreview設定
    URLParameter += '&prizeViewerMode=true';
    URLParameter += '&prizeViewerSec=0';
    URLParameter += '&realCurrencyRatio=0.01';
    URLParameter += '&realDecimalPlaces=2';
    // 當前的 URL
    if (EDITOR) {
      PlatformData.editorUrl = URLParameter.replace('?logo', 'logo');
      PlatformData.fromFakeLobby = true;
      console.log('FakeLobby editorUrl ', PlatformData.editorUrl);
    } else {
      window.history.replaceState(null, null, URLParameter);
    }
  }

  update(_deltaTime: number) {}
}
