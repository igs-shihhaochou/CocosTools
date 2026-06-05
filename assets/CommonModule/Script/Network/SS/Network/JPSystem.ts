import type {ArkClient} from '../Ark/SSArkClient';
import {ArkSocketClient, SocketResult} from '../Ark/SSArkSocketClient';
import {RetryTimer} from './Common/RetryTimer';
import {Signal} from './Common/Signal';
import {LoginModel} from './LoginModel';

export const enum JPDenyResult {
  IllegalPlayer = 1,
  WrongJPSerialID = 2,
  NotReady = 3,
  WrongState = 4,
  intNotEnoughBet = 5,
  Pass = 6,
}
export const enum JPWinValueProtocol {
  machine_id = 0,
  pin_ark_id = 1,
  jp_type = 2,
  jp_value = 3,
  entries = 4,
  winning = 5,
  jp_SerialID = 6,
  exchange_rate = 7,
  leader_board_info = 8,
}

export class JPSystem {
  /*for ArkSocketClient 收到廣播封包訊息發送 (請勿存取)*/
  public cmdDict: JSON = <JSON>{};

  /*OnWinJPValueSignal(grandVal, majorVal, minorVal, miniVal)*/
  public OnChangeJpValCmdSignal: Signal = new Signal();

  /*OnWinJPValueSignal(jp_type, ShowValue, entries, winning)*/
  public OnWinJPValueSignal: Signal = new Signal();

  public OnChangeInGameJpSingnal: Signal = new Signal();

  /*JP開獎訊號*/
  public OnJPStartSignal: Signal = new Signal();
  /*JP結束訊號*/
  public OnJPFinishSignal: Signal = new Signal();

  /*玩家資訊更新*/
  public OnUpdatePlayerInfoSignal: Signal = new Signal();
  /*收到大神戰艦分數廣播*/
  public OnRecvSubmarineInfoSignal: Signal = new Signal();
  /*收到戰艦被佔領廣播*/
  public OnRecvSubmarineOccupySignal: Signal = new Signal();
  /*收到破紀錄廣播*/
  public OnRecordUpdateSignal: Signal = new Signal();

  /*private*/
  private socketClient: ArkSocketClient = null;
  private pinClient: ArkClient = null; //開獎需要登入Token資訊
  private systemName = 'jp';
  private strJpSerialID: string;
  private isJPReadyRequest: boolean;

  //for send JPVale recv cmd callback
  private getJpCmdCb: any;
  private getInGameJpCmdCb: any;
  public getTreasureMapCB: any;
  public getOceanHeartCB: any;

  //處理Retry Handler模組
  private retryTimer: RetryTimer = new RetryTimer();

  public Release() {
    this.socketClient = null;
    this.OnChangeJpValCmdSignal.removeAll();
    this.OnChangeJpValCmdSignal = null;

    this.OnWinJPValueSignal.removeAll();
    this.OnWinJPValueSignal = null;

    this.OnChangeInGameJpSingnal.removeAll();
    this.OnChangeInGameJpSingnal = null;

    if (this.OnJPStartSignal) {
      this.OnJPStartSignal.removeAll();
      this.OnJPStartSignal = null;
    }
    if (this.OnJPFinishSignal) {
      this.OnJPFinishSignal.removeAll();
      this.OnJPFinishSignal = null;
    }

    this.OnUpdatePlayerInfoSignal.removeAll();
    this.OnUpdatePlayerInfoSignal = null;

    this.OnRecvSubmarineInfoSignal.removeAll();
    this.OnRecvSubmarineInfoSignal = null;

    this.OnRecvSubmarineOccupySignal.removeAll();
    this.OnRecvSubmarineOccupySignal = null;

    if (this.OnRecordUpdateSignal) {
      this.OnRecordUpdateSignal.removeAll();
      this.OnRecordUpdateSignal = null;
    }

    this.cmdDict = null;
    this.getJpCmdCb = null;
    this.getInGameJpCmdCb = null;
    this.getTreasureMapCB = null;
    this.getOceanHeartCB = null;
  }

  public setNetClient(socketClient: ArkSocketClient, pinClient: ArkClient) {
    this.socketClient = socketClient;
    this.socketClient.systemDict[this.systemName] = this;
    this.pinClient = pinClient;
  }

  constructor(socketClient: ArkSocketClient, pinClient: ArkClient) {
    this.socketClient = socketClient;
    this.socketClient.systemDict[this.systemName] = this;
    this.pinClient = pinClient;

    //註冊cmdCallBack
    this.cmdDict['candidate'] = this.OnRecvCandidateCmd.bind(this);
    this.cmdDict['deny'] = this.OnRecvDenyCmd.bind(this);
    this.cmdDict['game'] = this.OnRecvGameCmd.bind(this);
    this.cmdDict['winValue'] = this.OnRecvWinValueCmd.bind(this);
    this.cmdDict['change'] = this.OnRecvChangeCmd.bind(this);
    this.cmdDict['gameStart'] = this.OnRecvJPStart.bind(this);
    this.cmdDict['gameFinish'] = this.OnRecvJPFinish.bind(this);
    this.cmdDict['in_game_jp_update'] = this.OnRecvChangeInGameJpCmd.bind(this);
    this.cmdDict['treasureMap'] = this.OnRecvTreasureMapCmd.bind(this);
    this.cmdDict['oceanHeart'] = this.OnRecvOceanHeartCmd.bind(this);
    this.cmdDict['player_info_update'] = this.OnRecvPlayerInfoCmd.bind(this);
    this.cmdDict['GetSubmarineInfo'] = this.OnRecvSubmarineInfoCmd.bind(this);
    this.cmdDict['BroadCastSubmarineOccupy'] =
      this.OnRecvSubmarineOccupyCmd.bind(this);
    this.cmdDict['break_record'] = this.OnRecvRecordUpdate.bind(this); // 破紀錄事件
  }

  /**
   * 送出請求JP中獎歷史紀錄
   * @param callback 回應CallBack
   */
  public SendGetJPHistory(callback: (result: number, data: JSON) => void) {
    //歷史紀錄拿到是SERVER算好的，SERVER目前給的是分數
    // console.log('[JPSystem.SendGetJPHistory]');

    this.socketClient.SendCmd(this.systemName, 'jplog', null, callback);
  }

  /**
   * 送出請求JP數值
   * @param callback 回應CallBack
   */
  public SendGetJPValCmd(callback: any) {
    // console.log('[JPSystem.SendGetJPValCmd]');

    this.getJpCmdCb = callback;

    this.socketClient.SendCmd(
      this.systemName,
      'jp',
      null,
      this.RecvGetJpValCmd.bind(this)
    );
  }

  /**
   * 送出請求JP數值
   * @param callback 回應CallBack
   */
  public SendGetInGameJpValCmd(callback: any) {
    // console.log('[JPSystem.SendGetInGameJpValCmd]');

    this.getInGameJpCmdCb = callback;

    this.socketClient.SendCmd(
      this.systemName,
      'ingame_jp',
      null,
      this.RecvGetInGameJpValCmd.bind(this)
    );
  }

  public SendJPTimerResume() {
    // console.log('[JPSystem.SendJPTimerResume]');

    this.socketClient.SendCmd(this.systemName, 'gameSettle');
  }

  /**
   * 檢查是否為候選人，若是則自動送出JP請求封包
   * @param gameName 遊戲名稱
   * @param totalBetExcludeJPBet TotoalBet但不含JPBet
   */
  public CheckJPRequest(gameName: string, totalBetExcludeJPBet: number) {
    if (this.isJPReadyRequest) {
      this.isJPReadyRequest = false;
      this.SendJPRequest('game' + gameName, totalBetExcludeJPBet);

      return true;
    }

    return false;
  }

  private OnRecvCandidateCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ): void {
    console.log(
      '[SS.Network.OnRecvCandidateCmd]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );
    //#TODO fish game need to ignore
    if (result === SocketResult.OK) {
      this.strJpSerialID = data['JPSerialID'];
      this.isJPReadyRequest = true;
    }
  }

  private OnRecvDenyCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ): void {
    console.log(
      '[SS.Network.OnRecvDenyCmd]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );
    if (result === SocketResult.OK) {
      const iDenyType = data['DenyType'];
      const jp_SerialID = data['JPSerialID'];

      if (jp_SerialID === this.strJpSerialID) {
        if (iDenyType === JPDenyResult.NotReady) {
          this.retryTimer.ResetTimes();
        } else {
          // JP Server真的要拒絕進行JP game
          this.retryTimer.Stop();
        }
      }
    }
  }

  private OnRecvGameCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ): void {
    console.log(
      '[SS.Network.OnRecvGameCmd]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      const machine_id = data['machine'];
      const jp_SerialID = data['JPSerialID'];

      if (
        this.strJpSerialID === jp_SerialID && // 判斷封包內容 jp_SerialID
        machine_id === LoginModel.LoginInfo.machine_id
      ) {
        // 判斷封包內容 machine
        this.retryTimer.Stop();
      }
    }
  }

  private OnRecvJPStart(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ): void {
    console.log(
      '[SS.Network.OnRecvJPStart]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      this.OnJPStartSignal.dispatch();
    }
  }
  private OnRecvJPFinish(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ): void {
    console.log(
      '[SS.Network.OnRecvJPFinish]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      this.OnJPFinishSignal.dispatch();
    }
  }
  private OnRecvChangeCmd(
    result: number,
    data: JSON,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ): void {
    // console.log(
    //   '[SS.Network.JPSystem]',
    //   result,
    //   data,
    //   ret,
    //   sn,
    //   sys,
    //   cmd,
    //   process_time_ms
    // );

    if (result === SocketResult.OK) {
      // console.log('OnRecvChangeCmd ori : ', data);

      const jpVal = this.CovertJPVal(data, '0', '1', '2', '3');

      // console.log('OnRecvChangeCmd jpVal after convert: ', jpVal);

      if (!jpVal) return;

      this.OnChangeJpValCmdSignal.dispatch(
        jpVal[0],
        jpVal[1],
        jpVal[2],
        jpVal[3],
        data['exchange_rate']
      );
    }
  }

  private OnRecvChangeInGameJpCmd(
    result: number,
    data: JSON,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    // console.warn('OnRecvChangeInGameJpCmd result = ', result);

    if (result === SocketResult.OK) {
      // console.log('OnRecvChangeInGameJpCmd data : ', data);

      this.OnChangeInGameJpSingnal.dispatch(data);
    }
  }

  private OnRecvWinValueCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ): void {
    console.log(
      '[SS.Network.OnRecvWinValueCmd]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms
    );

    if (result === SocketResult.OK) {
      const machine_id = data[JPWinValueProtocol.machine_id];
      const pin_ark_id = data[JPWinValueProtocol.pin_ark_id];
      const jp_type = data[JPWinValueProtocol.jp_type];
      const jp_value = data[JPWinValueProtocol.jp_value];
      const entries = data[JPWinValueProtocol.entries];
      const winning = data[JPWinValueProtocol.winning];
      const jp_SerialID = data[JPWinValueProtocol.jp_SerialID];
      const exchange_rate = data[JPWinValueProtocol.exchange_rate];
      const leaderBoardInfo = data[JPWinValueProtocol.leader_board_info];

      if (
        machine_id === LoginModel.LoginInfo.machine_id &&
        pin_ark_id === this.pinClient.ArkID
      ) {
        if (this.strJpSerialID === jp_SerialID) {
          this.strJpSerialID = null;

          this.retryTimer.Stop();

          if (leaderBoardInfo == null || leaderBoardInfo === '') {
            this.OnWinJPValueSignal.dispatch(
              jp_type,
              jp_value,
              exchange_rate,
              entries,
              winning
            );
            console.log('[SS.Network.OnRecvWinValueCmd] normal ');
          } else {
            this.OnWinJPValueSignal.dispatch(
              jp_type,
              jp_value,
              exchange_rate,
              entries,
              winning,
              leaderBoardInfo
            );
            console.log(
              '[SS.Network.OnRecvWinValueCmd] with leaderBoardInfo ',
              leaderBoardInfo
            );
          }
        }
      } else {
        console.error(
          'server ArkId : ',
          pin_ark_id,
          'client ArkId : ',
          this.pinClient.ArkID
        );
        console.error(
          'server machine_id : ',
          machine_id,
          'client MachineID : ',
          LoginModel.LoginInfo.machine_id
        );
      }
    }
  }

  private CovertJPVal(
    jsonData: any,
    grandKey,
    majorKey,
    minorKey,
    miniKey
  ): [number, number, number, number] {
    if (!jsonData || !jsonData.hasOwnProperty('jp_rate')) {
      console.error('Recv Jp Value Error Data : ', jsonData);
      return;
    }

    const jp_rate = jsonData['jp_rate'];
    const Jp0 = jsonData[grandKey]
      ? this.accMul(jsonData[grandKey], jp_rate)
      : undefined;
    const Jp1 = jsonData[majorKey]
      ? this.accMul(jsonData[majorKey], jp_rate)
      : undefined;
    const Jp2 = jsonData[minorKey]
      ? this.accMul(jsonData[minorKey], jp_rate)
      : undefined;
    const Jp3 = jsonData[miniKey]
      ? this.accMul(jsonData[miniKey], jp_rate)
      : undefined;

    return [Jp0, Jp1, Jp2, Jp3];
  }

  private accMul(val1: number, val2: number) {
    const s1 = val1.toString();
    const s2 = val2.toString();
    const _m = 0;
    let m1 = 0,
      m2 = 0;
    try {
      m1 = s1.split('.')[1].length;
    } catch (e) {
      // ignored
    }
    try {
      m2 = s2.split('.')[1].length;
    } catch (e) {
      // ignored
    }
    return (
      (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) /
      Math.pow(10, m1 + m2)
    );
  }

  private SendJPRequest(game, excludeJPbet = 0): void {
    // console.log('[JPSystem.SendJPRequest]', game, excludeJPbet);

    const retryHandler: Function = () => {
      const cmd_data = <JSON>{};

      cmd_data['token'] = this.pinClient.ArkToken;
      cmd_data['game'] = game;
      cmd_data['JPSerialID'] = this.strJpSerialID;
      cmd_data['bet'] = excludeJPbet;

      this.socketClient.SendCmd(this.systemName, 'req', cmd_data);

      console.log('SendJPRequest = ', cmd_data);
    };

    const timeOutHandler: Function = () => {
      console.log('SendJPRequest Timeout!');
    };

    this.retryTimer.Start(retryHandler, timeOutHandler, [0, 2, 4, 8, 20]);
  }

  private RecvGetJpValCmd(
    result: number,
    data: JSON,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    console.warn('RecvGetJpValCmd = ', result);

    if (result === SocketResult.OK) {
      console.log('RecvGetJpValCmd ori : ', data);

      const jpVal = this.CovertJPVal(data['data'], 'jp0', 'jp1', 'jp2', 'jp3');

      console.log('RecvGetJpValCmd jpVal after convert: ', jpVal);

      if (!jpVal) return;

      this.getJpCmdCb(
        jpVal[0],
        jpVal[1],
        jpVal[2],
        jpVal[3],
        data['data']['exchange_rate']
      );

      this.getJpCmdCb = null;
    }
  }

  private RecvGetInGameJpValCmd(
    result: number,
    data: JSON,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    console.warn('RecvGetInGameJpValCmd = ', result);

    if (result === SocketResult.OK) {
      console.log('RecvGetInGameJpValCmd ori : ', data);

      this.getInGameJpCmdCb(data);

      this.getInGameJpCmdCb = null;
    }
  }

  private OnRecvTreasureMapCmd(
    result: number,
    data: JSON,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    console.warn('OnRecvTreasureMapCmd result = ', result);

    if (result === SocketResult.OK) {
      console.log('OnRecvTreasureMapCmd data : ', data);

      if (data && this.getTreasureMapCB) this.getTreasureMapCB(data);
    }
  }

  private OnRecvOceanHeartCmd(
    result: number,
    data: JSON,
    _ret: string,
    _sn: number,
    _sys: string,
    _cmd: string,
    _process_time_ms?: number
  ) {
    console.warn('OnRecvOceanHeartCmd result = ', result);

    if (result === SocketResult.OK) {
      console.log('OnRecvOceanHeartCmd data : ', data);

      if (data && this.getOceanHeartCB) this.getOceanHeartCB(data);
    }
  }

  private OnRecvPlayerInfoCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ) {
    console.log(
      '[SS.Network.OnRecvPlayerInfo]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      this.OnUpdatePlayerInfoSignal.dispatch(data);
    }
  }

  private OnRecvSubmarineInfoCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ) {
    console.log(
      '[SS.Network.OnRecvSubmarineInfo]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      this.OnRecvSubmarineInfoSignal.dispatch(data);
    }
  }

  private OnRecvSubmarineOccupyCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ) {
    console.log(
      '[SS.Network.OnRecvSubmarineOccupy]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      this.OnRecvSubmarineOccupySignal.dispatch(data);
    }
  }

  // 破紀錄廣播
  private OnRecvRecordUpdate(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ) {
    console.log(
      '[SS.Network.OnRecvRecordUpdate]',
      result,
      data,
      ret,
      sn,
      sys,
      cmd,
      process_time_ms,
      new Date().toUTCString()
    );

    if (result === SocketResult.OK) {
      this.OnRecordUpdateSignal.dispatch(data);
    }
  }
}
