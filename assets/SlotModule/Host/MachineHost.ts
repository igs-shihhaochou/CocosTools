import {SlotGDK} from '../Define/SlotGDK';
import {CmdSender} from '../Network/Application/CmdSender';
import {SystemObj} from '../../CommonModule/Script/Define/GlobalSetting';
import {
  EventGameFlow,
  PlatformGDK,
} from '../../CommonModule/Script/Platform/PlatformGDK';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import Functions from '../../CommonModule/Script/Utility/Functions';
import EventManager from '../../CommonModule/Script/Manager/EventManager';
import BackpackManager from '../../CommonModule/Script/Manager/BackpackManager';
import {_decorator, Component, macro, director, CCString} from 'cc';
import {BUILD} from 'cc/env';

const {ccclass, property} = _decorator;

@ccclass
export class MachineHost extends Component {
  @property(CCString)
  private gameId = '';

  @property(CCString)
  private lang = 'en-us'; //Local端設定的語言

  @property(CmdSender)
  public cmdSender: CmdSender = null;

  private startGameData = null;

  private inGameJpInterval = 10; //預設10秒

  private tempFeverData: {sgId: number; data: unknown} = null;

  protected onLoad() {
    this.getGameConfig();

    this.cmdSender.spinDataHandler.insert(this.receiveSpinData, this);
    this.cmdSender.startGameDataHandler.insert(this.receiveStartGameData, this);
    this.cmdSender.inGameStartGameDataHandler.insert(
      this.receiveInGameStartGameData,
      this
    );
    this.cmdSender.feverGameDataHandler.insert(this.receiveFeverGameData, this);
    this.cmdSender.doubleGameDataHandler.insert(
      this.receiveDoubleGameData,
      this
    );
    this.cmdSender.inGameJpInfoDataHandler.insert(
      this.reciveInGameJpInfoData,
      this
    );
    this.cmdSender.clearFeatureDataHandler.insert(
      this.reciveClearFeatureData,
      this
    );

    PlatformGDK.instance.clearFeature.insert(this.sendClearFeature, this);

    SlotGDK.instance.eventSpin.insert(this.sendSpin, this);
    SlotGDK.instance.eventGameIsReady.insert(this.cmdSenderInit, this);
    SlotGDK.instance.eventSendInGameJackpotInfoCmd.insert(
      this.sendInGameJackpotInfoCmd,
      this
    );
    SlotGDK.instance.sendNextFeverCmd.insert(this.onFeverGameStart, this);
    SlotGDK.instance.sendBonusNextFeverCmd.insert(
      this.onBonusFeverGameStart,
      this
    );
    SlotGDK.instance.sendInGameStartGameCmd.insert(
      this.sendInGameStartGameData,
      this
    );
    SlotGDK.instance.eventSendDoubleGameCmd.insert(this.onDoubleGame, this);
    SlotGDK.instance.eventBeforeLoadingClose.insert(this.onLoadingClose, this);
  }

  protected onDestroy(): void {
    this.cmdSender.spinDataHandler.remove(this.receiveSpinData, this);
    this.cmdSender.startGameDataHandler.remove(this.receiveStartGameData, this);
    this.cmdSender.inGameStartGameDataHandler.remove(
      this.receiveInGameStartGameData,
      this
    );
    this.cmdSender.feverGameDataHandler.remove(this.receiveFeverGameData, this);
    this.cmdSender.doubleGameDataHandler.remove(
      this.receiveDoubleGameData,
      this
    );
    this.cmdSender.inGameJpInfoDataHandler.remove(
      this.reciveInGameJpInfoData,
      this
    );
    this.cmdSender.clearFeatureDataHandler.remove(
      this.reciveClearFeatureData,
      this
    );

    PlatformGDK.instance.clearFeature.remove(this.sendClearFeature, this);

    SlotGDK.instance.eventSpin.remove(this.sendSpin, this);
    SlotGDK.instance.eventGameIsReady.remove(this.cmdSenderInit, this);
    SlotGDK.instance.eventSendInGameJackpotInfoCmd.remove(
      this.sendInGameJackpotInfoCmd,
      this
    );
    SlotGDK.instance.sendNextFeverCmd.remove(this.onFeverGameStart, this);
    SlotGDK.instance.sendBonusNextFeverCmd.remove(
      this.onBonusFeverGameStart,
      this
    );
    SlotGDK.instance.sendInGameStartGameCmd.remove(
      this.sendInGameStartGameData,
      this
    );
    SlotGDK.instance.eventSendDoubleGameCmd.remove(this.onDoubleGame, this);
    SlotGDK.instance.eventBeforeLoadingClose.remove(this.onLoadingClose, this);

    for (let i = 0; i < SystemObj.waitForSeconds.length; i++) {
      clearTimeout(SystemObj.waitForSeconds[i]);
    }
    SystemObj.waitForSeconds = [];

    PlatformData.instance.errorCodeDic.clear();
  }

  private onLoadingClose() {
    const callback = () => {
      //確認收到startgameData後再呼叫事件
      if (this.startGameData) {
        //解註冊schedule
        this.unschedule(callback);
        this.dispatchStartGameEvents();
      }
    };
    //等待收到startgameData
    this.schedule(callback, 0, macro.REPEAT_FOREVER);
  }

  private getGameConfig() {
    //不是BUILD就抓本地設定
    if (!BUILD && PlatformData.lang === '') PlatformData.lang = this.lang;

    //根據場景設定GameName (但排除不同廳館)
    if (PlatformData.gameFolderName === PlatformData.gameName)
      PlatformData.gameName = this.gameId;

    //設定語言
    SlotGDK.instance.setUsingLanguage(PlatformData.lang);
  }

  private cmdSenderInit() {
    PlatformGDK.instance.sendEventLog.notify(EventGameFlow.gameInit);
    this.cmdSender.init();
  }

  //接收StartGame資料
  private receiveStartGameData(data) {
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.verifyDataCode(data);
    if (legalCode !== 0) {
      PlatformGDK.instance.showPopUpMessageByErrorCode.notify(legalCode);
      return;
    }

    this.startGameData = data;

    if (data.hasOwnProperty('data')) {
      const dataJson: JSON = data['data'];

      if (dataJson.hasOwnProperty('probability_ver'))
        PlatformData.instance.version = dataJson['probability_ver'];

      if (dataJson.hasOwnProperty('start_game_info_sn'))
        PlatformData.instance.startGameInfoSN = dataJson['start_game_info_sn'];

      PlatformData.instance.autospinTimes = 0;
      PlatformData.instance.autospin = false;
      PlatformData.instance.fastspin = false;

      let betList: object[] = null;
      let maxCosts = 0;
      let maxLines = 0;

      //最大花費資訊
      if (dataJson.hasOwnProperty('max_costs')) {
        maxCosts = dataJson['max_costs'];
      }
      if (dataJson.hasOwnProperty('max_lines')) {
        maxLines = dataJson['max_lines'];
      }
      //押注段列表
      if (dataJson.hasOwnProperty('bet_list')) {
        betList = dataJson['bet_list'];
        //若無線注及總押資訊 由現有資訊計算
        if (
          !betList[0].hasOwnProperty('line_bet') ||
          !betList[0].hasOwnProperty('total_bet')
        ) {
          const result = maxCosts > 0 ? maxCosts : maxLines;
          betList.forEach((obj: Object, idx: number) => {
            betList[idx] = {
              // eslint-disable-next-line camelcase
              line_bet: Number(obj),
              // eslint-disable-next-line camelcase
              total_bet: Functions.accMul(Number(obj), result), //maxCosts或maxLines作為計算基準 maxCosts為Allways會帶入的值
            };
          });
        }
        //sort betList from large to small
        betList = betList.sort((a, b) => b['total_bet'] - a['total_bet']);
        PlatformData.instance.betList = betList;
        PlatformData.instance.maxTotalBet = betList[0]['total_bet'];
        PlatformData.instance.maxLineBet = betList[0]['line_bet'];
      }

      let currentLineBet = 0;
      if (dataJson.hasOwnProperty('current_line_bet')) {
        currentLineBet = dataJson['current_line_bet'];
      }

      let betObject: object = betList.find(
        x => x['line_bet'] === currentLineBet
      );

      if (!betObject) {
        betObject = betList[0]; //不存在取最小的
      }

      PlatformData.instance.originalLineBet = betObject['line_bet'];
      PlatformData.instance.originalTotalBet = betObject['total_bet'];

      PlatformData.instance.currentLineBet = betObject['line_bet'];
      PlatformData.instance.currentTotalBet = betObject['total_bet'];

      if (typeof ActivityModule === 'undefined' || ActivityModule === null) {
        console.warn('ActivityModule is null');
      } else {
        EventManager.instance.dispatchEvent(
          ActivityModule.ActivityEventName.GAME_CHANGE_BET,
          PlatformData.instance.originalTotalBet,
          PlatformData.instance.currentTotalBet
        );
      }

      if (SlotGDK.instance.eventClickChangeBet.length > 0) {
        SlotGDK.instance.eventClickChangeBet.notify(
          PlatformData.instance.currentLineBet,
          PlatformData.instance.currentTotalBet
        );
      }
    }
    if (PlatformGDK.instance.receiveOriginalStartGameData.length > 0) {
      PlatformGDK.instance.receiveOriginalStartGameData.notify(
        this.startGameData
      );
    }
  }

  //接收StartGame資料
  private receiveInGameStartGameData(data) {
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.verifyDataCode(data);
    if (legalCode !== 0) {
      PlatformGDK.instance.showPopUpMessageByErrorCode.notify(legalCode);
      return;
    }
    if (PlatformGDK.instance.receiveInGameStartGameData.length > 0) {
      PlatformGDK.instance.receiveInGameStartGameData.notify(data);
    }
  }

  private dispatchStartGameEvents() {
    if (this.startGameData) {
      SlotGDK.instance.initGame();
      SlotGDK.instance.setStartGameData(this.startGameData);
      if (SlotGDK.instance.eventSetStartGameData.length > 0) {
        SlotGDK.instance.eventSetStartGameData.notify();
      }
    }

    PlatformGDK.instance.sendEventLog.notify(EventGameFlow.inGame);

    if (PlatformGDK.instance.receiveStartGameData.length > 0) {
      PlatformGDK.instance.receiveStartGameData.notify(this.startGameData);
    }

    if (SlotGDK.instance.eventSceneIsReady.length > 0) {
      SlotGDK.instance.eventSceneIsReady.notify();
    }
  }

  private sendSpin(spinData?) {
    this.cmdSender.sendSpinCmd(spinData);
  }

  private receiveSpinData(data) {
    PlatformData.instance.devmode = '';
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.verifyDataCode(data);

    switch (legalCode) {
      case 0:
        break;
      case -200046:
        //check cmd 失敗
        this.sendSpin();
        return;
      default:
        PlatformGDK.instance.showPopUpMessageByErrorCode.notify(legalCode);
        return;
    }

    SlotGDK.instance.setSpinData(data);

    if (SlotGDK.instance.receiveSpinData.length > 0) {
      SlotGDK.instance.receiveSpinData.notify(data);
    }
  }

  private sendInGameStartGameData() {
    this.cmdSender.sendInGameStartGameCmd();
  }

  //送出FevertGame封包
  private onFeverGameStart(sgId: number, data) {
    if (SlotGDK.instance.disableInGameNextFever) {
      return;
    }
    this.tempFeverData = {sgId: sgId, data: data};
    this.cmdSender.sendFeverCmd(sgId, data);
  }
  private onBonusFeverGameStart(sgId: number, data) {
    if (SlotGDK.instance.disableInGameNextFever) {
      return;
    }
    this.tempFeverData = {sgId: sgId, data: data};
    this.cmdSender.sendBonusFeverCmd(sgId, data);
  }

  //接收FeverGame資料
  private receiveFeverGameData(data) {
    PlatformData.instance.devmode = '';
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.verifyDataCode(data);
    switch (legalCode) {
      case 0:
        break;
      case -200046:
        //check cmd 失敗
        this.onFeverGameStart(this.tempFeverData.sgId, this.tempFeverData.data);
        return;
      default:
        PlatformGDK.instance.showPopUpMessageByErrorCode.notify(legalCode);
        return;
    }
    SlotGDK.instance.setNextFeverData(data);

    if (SlotGDK.instance.receiveFeverData.length > 0) {
      SlotGDK.instance.receiveFeverData.notify(data);
    }

    //設定道具卡total win
    EventManager.instance.dispatchEvent(
      BackpackManager.backpackEvent.SetTotalWin,
      data['data']['total_win_amount']
    );
  }

  //送出DoubleGame封包
  private onDoubleGame(data) {
    this.cmdSender.sendDoubleGameCmd(data);
  }

  //接收比倍遊戲資料
  private receiveDoubleGameData(data) {
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.verifyDataCode(data);
    if (legalCode !== 0) {
      PlatformGDK.instance.showPopUpMessageByErrorCode.notify(legalCode);
      return;
    }

    SlotGDK.instance.setDoubleGameData(data);

    if (SlotGDK.instance.receiveDoubleGameData.length > 0) {
      SlotGDK.instance.receiveDoubleGameData.notify(data);
    }
  }

  //送InGamejp封包
  private sendInGameJackpotInfoCmd() {
    this.cmdSender.sendInGameJPCmd();
  }

  //接收InGamejp資料並定時發送取得新資料
  private reciveInGameJpInfoData(data) {
    //連接Server流程 需做合法代碼驗證
    const legalCode: number = this.verifyDataCode(data);
    if (legalCode !== 0) {
      PlatformGDK.instance.showPopUpMessageByErrorCode.notify(legalCode);
      return;
    } else {
      if (data['data']['sent_time_gap']) {
        this.inGameJpInterval = data['data']['sent_time_gap'];
      }
    }

    SlotGDK.instance.setInGameJackpotData(data, this.inGameJpInterval);

    this.scheduleOnce(
      this.cmdSender.sendInGameJPCmd.bind(this.cmdSender),
      this.inGameJpInterval
    ); //根據設定的間隔時間一直送
  }

  public sendClearFeature() {
    this.cmdSender.sendClearFeatureCmd();
  }

  //清除後重整遊戲
  private reciveClearFeatureData() {
    director.loadScene(director.getScene().name);
  }

  /**
   * 驗證資料正確性代碼
   */
  private verifyDataCode(data): number {
    //連接開發Server時 回傳0 不做驗證判斷
    if (PlatformData.isDevServer) {
      return 0;
    }

    let legalCode = -1;

    try {
      legalCode = data['status']['id'];
    } catch (err) {
      legalCode = null;
    }

    if (legalCode === null) {
      legalCode = data['Code'];
    }

    if (legalCode === null) {
      try {
        legalCode = data['result']['id'];
      } catch (err) {
        legalCode = null;
      }
    }

    if (legalCode === null) {
      try {
        legalCode = data['result'];
      } catch (err) {
        legalCode = null;
      }
    }

    if (legalCode === null) legalCode = -1;

    return legalCode;
  }
}
