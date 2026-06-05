import JSEncrypt from 'jsencrypt';
import {ArkClient} from '../Ark/SSArkClient';
import {LoginModel} from './LoginModel';
import {HttpResult} from '../../ArkSDK/Utitlity/HttpConnect';

export class UserClient {
  private readonly ENCRYPT_KEY: string =
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC0l1BzizlBXTIs3X235yn5EfcNhbt3cgBZ + /peA2WBGh8HUKC2cWGOS3xtRtoPrco/NxNUJD1bhjIeWe0PCRQNYRW76DHhWylspBmgv45wFkTaTGLLZoXeK7BvajEXIrvs03RgGCboXI2CNB3aaOJXqpSPBJ6nbfF9QJYaYLiKkQIDAQAB';

  private m_kioskClient: ArkClient = null;
  private m_pinClient: ArkClient = null;

  private cmdTmpDataDict: JSON = <JSON>{};
  private cmdRetryTimesDict: JSON = <JSON>{};
  private cmdCallbackDict: JSON = <JSON>{};
  private cmdRecvDict: JSON = <JSON>{};
  private cmdSysName: JSON = <JSON>{};

  private Timer = [2000, 4000, 8000, 16000];
  private systemName = 'lobby';

  private m_arrJsonClickLog: JSON[] = [];
  public static CurClickLogData: JSON[] = [];
  //public static get GetClickLogData() { return this.m_arrJsonClickLog };
  private m_bHaveClickLog = false;

  private m_arrJsonSpinTypeLog: JSON[] = [];
  private m_intervalSpinTypeLog = null;

  //供遊戲使用PIN登入資訊
  public get GetPinClient() {
    return this.m_pinClient;
  }
  public get GetKioskClient() {
    return this.m_kioskClient;
  }

  /**玩家資訊*/
  public static UserInfo = {
    mobile_id: null,
    nickname: null,
    avatar_id: null,
    avatar_frame_id: null,
    avatar_expired_time: null,
    avatar_frame_expired_time: null,
    new_item: null,
  };

  public setNetClient(kioskClient: ArkClient, pinClient: ArkClient) {
    this.m_kioskClient = kioskClient;
    this.m_pinClient = pinClient;
  }

  constructor(kioskClient: ArkClient, pinClient: ArkClient) {
    this.m_kioskClient = kioskClient;
    this.m_pinClient = pinClient;
  }

  public Release() {
    this.m_kioskClient = null;
    this.m_pinClient = null;
    this.cmdTmpDataDict = null;
    this.cmdRetryTimesDict = null;
    this.cmdCallbackDict = null;
    this.Timer = null;
  }

  // 統一對外接口
  public SendLobbyRetryCmd(cmd_Name, cmd_data, callback) {
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public collectQuest(questID: string, questLevel: number, callback) {
    const cmd_Name = 'collectQuest';

    const cmd_data = {
      quest_id: questID,
      quest_level: questLevel,
    };
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public getCommonEventInfo(callback) {
    const cmd_Name = 'getCommonEventInfo';

    this.SendRetryCmd(cmd_Name, null, callback, this.OnRecvRetryCmd.bind(this));
  }

  public getPlayerProfileList(arkIdList, callback) {
    const cmd_Name = 'getPlayerProfileList';
    const cmd_data = {
      ark_id_list: arkIdList,
    };
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public getPuzzleQuestInfo(callback) {
    const cmd_Name = 'GetPuzzleQuestInfo';

    this.SendRetryCmd(cmd_Name, null, callback, this.OnRecvRetryCmd.bind(this));
  }

  public collectPuzzleQuest(quest_name, serial_no, quest_level, callback) {
    const cmd_Name = 'CollectPuzzleQuest';
    const cmd_data = {
      name: quest_name,
      serial_no: serial_no,
      quest_level: quest_level,
    };
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public getPuzzleRank(rank_list_id, rank_let_limit, callback) {
    const cmd_Name = 'GetPuzzleRank';
    const cmd_data = {
      rank_list_id: rank_list_id,
      rank_get_limit: rank_let_limit,
    };
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public getPuzzleHistory(rank_list_id, callback) {
    const cmd_Name = 'getPuzzleHistory';
    // 筆數先固定50筆寫死
    const cmd_data = {
      rank_list_id: rank_list_id,
      limit: 50,
    };
    console.log('[UserClient.getPuzzleHistory] ', cmd_data);
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  // ExtraFree 可領獎資料
  public getExtraCompsResult(callback) {
    const cmd_Name = 'getExtraCompsResult';
    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      pin_id: LoginModel.LoginInfo.pin_id,
    };
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  // ExtraFree 點擊領獎
  public collectExtraCompsAward(event_id, event_serial_no, callback) {
    const cmd_Name = 'collectExtraCompsAward';
    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      pin_id: LoginModel.LoginInfo.pin_id,
      EventID: event_id,
      EventSerialNo: event_serial_no,
    };
    this.NoRtryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public NoRtryCmd(
    cmd_name: string,
    cmd_data?: JSON,
    callback?,
    timeout = 15000,
    sn?: string,
    extra_data?: JSON
  ) {
    this.m_pinClient.send_cmd(
      this.systemName,
      cmd_name,
      cmd_data,
      callback,
      timeout,
      sn,
      extra_data
    );
  }

  public getNoRetryCommonEventInfo(callback) {
    const cmd_Name = 'getCommonEventInfo';
    const cmdData: any = {};
    this.NoRtryCmd(cmd_Name, cmdData, callback);
  }

  public GetMissionBonus(ThemeID, callback) {
    const cmd_Name = 'collectH5LoginBonus';

    const cmd_data = {
      theme_id: ThemeID,
    };
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }
  public GetMissionBonusInfo(callback) {
    const cmd_Name = 'getH5LoginBonusInfo';

    this.SendRetryCmd(cmd_Name, null, callback, this.OnRecvRetryCmd.bind(this));
  }

  //取得玩家自己資料(頭像、頭相框、暱稱...)
  public GetUserInfor(ark_id, callback) {
    console.log('[UserClient.GetUserInfor] %c GetUserInfor', 'color:coral');
    const cmd_Name = 'getUserInfo';
    const cmd_data: any = {
      ark_id: ark_id,
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  //取得玩家名片資料
  public GetProfileInfo(ark_id, callback) {
    console.log('[UserClient.GetProfileInfo] %c GetProfileInfo', 'color:coral');
    const cmd_Name = 'getProfileInfo';
    const cmd_data: any = {
      ark_id: ark_id,
    };

    this.NoRtryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  //取得玩家所有道具(頭像、頭相框等)資料
  public GetItemInfo(ark_id, callback) {
    console.log('[UserClient.GetItemInfo] %c GetItemInfo', 'color:coral');
    const cmd_Name = 'getItemInfo';
    const cmd_data: any = {
      ark_id: ark_id,
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  //變更設定後儲存(頭像、頭相框、暱稱)
  public ChangePlayerInfo(ark_id, nickname, data, callback) {
    console.log(
      '[UserClient.ChangePlayerInfo] %c ChangePlayerInfo',
      'color:coral'
    );
    const cmd_Name = 'changePlayerInfo';
    data.ark_id = ark_id;
    data.nickname = nickname;
    this.NoRtryCmd(cmd_Name, data, callback, this.OnRecvRetryCmd.bind(this));
  }

  public GetUserProperty(callback?: (status: number, result: any) => void) {
    console.log(
      '[UserClient.GetUserProperty] %c GetUserProperty',
      'color:coral'
    );
    const cmd_Name = 'getUserProperty';

    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      pin_id: LoginModel.LoginInfo.pin_id,
      device_id: LoginModel.LoginInfo.device_id,
      shutter_skill_fail_serial_id:
        LoginModel.LoginInfo.shutter_skill_fail_serial_id,
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnGetUserPropertyRecv.bind(this)
    );
  }

  private OnGetUserPropertyRecv(status: number, result: any, cmd_Name: any) {
    console.log(
      '[UserClient.OnGetUserPropertyRecv] ',
      status,
      result,
      cmd_Name
    );
    if (status === HttpResult.OK) {
      let shutter_skill_fail_serial_id = 0;

      if (result == null || result.cmd_data == null) {
        this.CmdCallback(cmd_Name, status, result);
        return;
      }

      if (result.cmd_data.result === 0 || result.cmd_data.result === 1) {
        if (result.cmd_data.data.shutter_skill_fail_serial_id !== undefined)
          shutter_skill_fail_serial_id =
            result.cmd_data.data.shutter_skill_fail_serial_id;

        this.CmdCallback(cmd_Name, status, result);
        LoginModel.LoginInfo.shutter_skill_fail_serial_id =
          shutter_skill_fail_serial_id + 1;
      } else {
        this.CmdCallback(cmd_Name, status, result);
      }
    } else {
      if (this.cmdRetryTimesDict[cmd_Name] < this.Timer.length) {
        console.log(
          'shutter skill fail retry : ',
          this.cmdRetryTimesDict[cmd_Name]
        );

        this.ReSendCmd(cmd_Name);

        this.cmdRetryTimesDict[cmd_Name]++;
      } else {
        console.log('shutter skill fail retry dead');

        this.CmdCallback(cmd_Name, status, result);
      }
    }
  }

  public SendChangeID(
    newMobileID,
    callback?: (status: number, result: any) => void
  ) {
    console.log('[UserClient.SendChangeID] %c SendChangeID', 'color:coral');

    const cmd_Name = 'changeUserID';

    const cmd_data: any = {
      user_id: newMobileID,
    };

    this.NoRtryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public SendPlayFlowData(deviceInfo, SceneName, status) {
    const cmd_Name = 'playerFlow';
    const cmd_data: any = {
      BrowserInfo: deviceInfo.browser.name,
      BrowserVersion: deviceInfo.browser.version,
      DeviceInfo: deviceInfo.os.name,
      DeviceVersion: deviceInfo.os.version,
      ThemeTitle: SceneName,
      KioskID: LoginModel.LoginInfo.kiosk_id,
      MachineID: LoginModel.LoginInfo.machine_id,
      pin_id: LoginModel.LoginInfo.pin_id,
      PinArkID: LoginModel.LoginInfo.pin_ark_id,
      UserID: LoginModel.LoginInfo.user_id,
      Status: status,
    };

    this.m_pinClient.send_cmd(this.systemName, cmd_Name, cmd_data, null, 60e3);
  }

  public SendPacketDelayData(data) {
    const cmd_Name = 'sendH5ClientPacketDelayTime';

    const cmd_data: any = {
      sent: data.sent,
      receive: data.receive,
      loss: data.loss,
      best: data.best,
      average: data.average,
      worst: data.worst,
      totalElapsedTime: data.totalElapsedTime,
      KioskID: LoginModel.LoginInfo.kiosk_id,
      MachineID: LoginModel.LoginInfo.machine_id,
      PinArkID: LoginModel.LoginInfo.pin_ark_id,
      UserID: LoginModel.LoginInfo.user_id,
    };

    this.m_pinClient.send_cmd(this.systemName, cmd_Name, cmd_data);
  }

  public SendErrorLog(data) {
    const cmd_Name = 'sendH5ErrorLog';

    const cmd_data: any = {
      error_result: data.error_result,
      trigger_point: data.trigger_point,
      scene_name: data.scene_name,
      error_handle: data.error_handle,
      ClientTimeUTC: data.ClientTimeUTC,
      MachineID: data.MachineID,
      KioskID: data.KioskID,
      PinArkID: data.PinArkID,
      UserID: data.UserID,
    };

    this.m_pinClient.send_cmd(this.systemName, cmd_Name, cmd_data);
  }

  public GetLobbyInfo(callback?: (status: number, result: any) => void) {
    console.log('[UserClient.GetLobbyInfo] %c GetLobbyInfo', 'color:coral');

    const cmd_Name = 'getLobbyInfo';

    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      device_id: LoginModel.LoginInfo.device_id,
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public GetClientBannerAdv(callback?: (status: number, result: any) => void) {
    console.log(
      '[UserClient.GetClientBannerAdv] %c GetClientBannerAdv',
      'color:coral'
    );

    const cmd_Name = 'getClientBannerAdv';

    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      platform: 'PHONE',
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public GetClientPopUpAdv(callback?: (status: number, result: any) => void) {
    console.log(
      '[UserClient.GetClientPopUpAdv] %c GetClientPopUpAdv',
      'color:coral'
    );

    const cmd_Name = 'getClientPopUpAdv';

    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      platform: 'PHONE',
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public GetPopupBillBoard(
    logoMode: number,
    callback?: (status: number, result: any) => void
  ) {
    console.log(
      '[UserClient.GetPopupBillBoard] %c GetPopupBillBoard',
      'color:coral'
    );
    const cmd_Name = 'getPopupBillBoard';
    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      device: LoginModel.LoginInfo.device_id,
      mode: logoMode,
    };
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public GetPopupContent(
    logoMode: number,
    titleID: string,
    tagID: string,
    callback?: (status: number, result: any) => void
  ) {
    console.log(
      '[UserClient.GetPopupContent] %c GetPopupContent',
      'color:coral'
    );
    const cmd_Name = 'getPopupContent';
    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      device: LoginModel.LoginInfo.device_id,
      mode: logoMode,
      TitleID: titleID,
      TagID: tagID,
    };
    if (titleID === 'hot') {
      cmd_data['HotID'] = titleID;
    }
    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public SendShutterSkillLose(
    curLineBet: number,
    curLines: number,
    callback?: (status: number, result: any) => void
  ): void {
    console.log(
      '[UserClient.ShutterSkillFail] %c ShutterSkillFail',
      'color:coral'
    );
    const cmd_Name = 'ShutterSkillFail';
    const cmd_data = {
      total_bet: curLineBet * curLines,
      shutter_skill_fail_serial_id:
        LoginModel.LoginInfo.shutter_skill_fail_serial_id,
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnShutterSkillFailRecv.bind(this)
    );
  }

  //[手機綁定] 該州別是否允許手機綁定
  public SendSmsSetting(callback?: (status: number, result: any) => void) {
    console.log('[UserClient.SendSmsSetting] %c SendSmsSetting', 'color:coral');

    const cmd_Name = 'getSmsSetting';
    const cmd_data: any = {};

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  //[手機綁定] 送出是否接受GD SMS設定選項
  public SendChangeSmsSetting(
    isAcceptSms: boolean,
    callback?: (status: number, result: any) => void
  ) {
    console.log(
      '[UserClient.changeSmsSetting] %c changeSmsSetting',
      'color:coral'
    );

    const cmd_Name = 'changeSmsSetting';
    const cmd_data: any = {
      is_accept_sms: isAcceptSms,
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  //[手機綁定] 點擊GetBonus Type
  public SendVerifyCodeEffect(
    callback?: (status: number, result: any) => void
  ) {
    console.log(
      '[UserClient.getVerifyCodeEffect] %c getVerifyCodeEffect',
      'color:coral'
    );

    const cmd_Name = 'getVerifyCodeEffect';
    this.SendRetryCmd(cmd_Name, null, callback, this.OnRecvRetryCmd.bind(this));
  }

  //[手機綁定] 點擊 Send Code Btn
  public SendUserCellPhoneVerify(
    callback?: (status: number, result: any) => void
  ) {
    console.log(
      '[UserClient.SendUserCellPhoneVerify] %c SendUserCellPhoneVerify',
      'color:coral'
    );

    const cmd_Name = 'getUserCellphoneVerify';
    this.SendRetryCmd(cmd_Name, null, callback, this.OnRecvRetryCmd.bind(this));
  }

  //[手機綁定] 點擊 Send SMS
  public SendVerifyCode(
    cellPhoneNum: string,
    cellPhoneStateNum: string,
    callback?: (status: number, result: any) => void
  ) {
    console.log('[UserClient.SendVerifyCode] %c SendVerifyCode', 'color:coral');

    const cmd_Name = 'sendVerifyCode';
    const cmd_data: any = {
      cellphone_num: cellPhoneNum,
      cellphone_state_num: cellPhoneStateNum,
    };

    this.m_pinClient.send_cmd(this.systemName, cmd_Name, cmd_data, callback);
  }

  //[手機綁定] 輸入完成驗證碼
  public SendVerifyValidCode(
    validCode: string,
    callback?: (status: number, result: any) => void
  ) {
    console.log(
      '[UserClient.SendVerifyValidCode] %c SendVerifyValidCode',
      'color:coral'
    );

    const cmd_Name = 'verifyVerifyCode';
    const cmd_data: any = {
      verify_code: validCode,
    };

    this.m_pinClient.send_cmd(this.systemName, cmd_Name, cmd_data, callback);
  }

  public SendSessionLengthStart(
    ThemeId: string,
    callback?: (status: number, result: any) => void
  ) {
    console.log(
      '[UserClient.SendSessionLengthStart] %c SessionLengthStart',
      'color:coral'
    );

    const cmd_Name = 'sessionLengthStart';
    const cmd_data: any = {
      gameId: ThemeId,
    };

    this.m_pinClient.send_cmd(this.systemName, cmd_Name, cmd_data, callback);
  }

  public SendSessionLengthEnd(
    ThemeId: string,
    callback?: (status: number, result: any) => void
  ) {
    console.log(
      '[UserClient.SendSessionLengthEnd] %c SessionLengthEnd',
      'color:coral'
    );

    const cmd_Name = 'sessionLengthEnd';
    const cmd_data: any = {
      gameId: ThemeId,
    };

    this.m_pinClient.send_cmd(this.systemName, cmd_Name, cmd_data, callback);
  }

  public GetKioskGameSetting(
    callback?: (status: number, result: any) => void
  ): void {
    console.log(
      '[UserClient.GetKioskGameSetting] %c GetKioskGameSetting',
      'color:coral'
    );
    const cmd_Name = 'getKioskGameSetting';

    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  public SendPurchase(
    purchase_key: string,
    callback?: (status: number, result: any) => void
  ) {
    console.log('[UserClient.Purchase] %c Purchase', 'color:coral');

    const cmd_Name = 'purchase';

    const cmd_data = {
      key: purchase_key,
      client_purchase_serial_id: LoginModel.LoginInfo.purchase_serial_id,
    };

    this.SendRetryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnPurchaseRecv.bind(this)
    );
  }

  public SendChangePassword(
    _old_pw: string,
    _new_pw: string,
    callback?: Function
  ): void {
    console.log('[UserClient.SendChangePassword]');

    const cmd_Name = 'changePassword';

    const crypt = new JSEncrypt();
    crypt.setKey(this.ENCRYPT_KEY);

    const user_pw_old_encrypt = crypt.encrypt(_old_pw);
    const user_pw_new_encrypt = crypt.encrypt(_new_pw);

    const cmd_data = <JSON>{};
    cmd_data['user_id'] = LoginModel.LoginInfo.user_id;
    cmd_data['user_pw_old'] = user_pw_old_encrypt;
    cmd_data['user_pw_new'] = user_pw_new_encrypt;
    cmd_data['kiosk_id'] = LoginModel.LoginInfo.kiosk_id;
    cmd_data['pin_id'] = LoginModel.LoginInfo.pin_id;

    this.NoRtryCmd(
      cmd_Name,
      cmd_data,
      callback,
      this.OnRecvRetryCmd.bind(this)
    );
  }

  private OnRecvRetryCmd(status: number, result: any, cmd_Name: any) {
    if (status === HttpResult.OK) {
      this.CmdCallback(cmd_Name, status, result);
    } else {
      if (this.cmdRetryTimesDict[cmd_Name] < this.Timer.length) {
        console.log(cmd_Name + ' retry : ', this.cmdRetryTimesDict[cmd_Name]);

        this.ReSendCmd(cmd_Name);

        this.cmdRetryTimesDict[cmd_Name]++;
      } else {
        console.log(cmd_Name + ' retry dead');

        this.CmdCallback(cmd_Name, status, result);
      }
    }
  }

  private OnClickLogCmd(status: number, result: any, cmd_Name: any) {
    if (status === HttpResult.OK) {
      this.CmdCallback(cmd_Name, status, result);
    } else {
      if (this.cmdRetryTimesDict[cmd_Name] < this.Timer.length) {
        console.log(cmd_Name + ' retry : ', this.cmdRetryTimesDict[cmd_Name]);

        this.ReSendCmd(cmd_Name);

        this.cmdRetryTimesDict[cmd_Name]++;
      } else {
        console.log(cmd_Name + ' retry dead');

        this.CmdCallback(cmd_Name, status, result);
      }
    }
  }

  private OnPurchaseRecv(status: number, result: any, cmd_Name: any) {
    if (status === HttpResult.OK) {
      if (result == null || result.cmd_data == null) {
        this.CmdCallback(cmd_Name, status, result);
        return;
      }

      if (result.cmd_data.result === 0 || result.cmd_data.result === 1) {
        if (
          LoginModel.LoginInfo.purchase_serial_id ===
          result.cmd_data.client_purchase_serial_id
        ) {
          LoginModel.LoginInfo.purchase_serial_id++;
          this.CmdCallback(cmd_Name, status, result);
        } else {
          console.warn(
            'LoginModel.LoginInfo.purchase_serial_id ' +
              LoginModel.LoginInfo.purchase_serial_id +
              ' != ' +
              result.cmd_data.client_purchase_serial_id +
              ' result.cmd_data.client_purchase_serial_id'
          );
        }
      } else {
        this.CmdCallback(cmd_Name, status, result);
      }
    } else {
      if (this.cmdRetryTimesDict[cmd_Name] < this.Timer.length) {
        console.log('purchase retry : ', this.cmdRetryTimesDict[cmd_Name]);

        this.ReSendCmd(cmd_Name);

        this.cmdRetryTimesDict[cmd_Name]++;
      } else {
        console.log('purchase retry dead');

        this.CmdCallback(cmd_Name, status, result);
      }
    }
  }

  private OnShutterSkillFailRecv(status: number, result: any, cmd_Name: any) {
    console.warn('[OnShutterSkillFailRecv]', result);

    if (status === HttpResult.OK) {
      if (result == null || result.cmd_data == null) {
        this.CmdCallback(cmd_Name, status, result);
        return;
      }

      if (result.cmd_data.result === 0 || result.cmd_data.result === 1) {
        if (
          LoginModel.LoginInfo.shutter_skill_fail_serial_id ===
          result.cmd_data.shutter_skill_fail_serial_id
        ) {
          LoginModel.LoginInfo.shutter_skill_fail_serial_id += 1;
          this.CmdCallback(cmd_Name, status, result);
        } else {
          console.warn(
            'LoginModel.LoginInfo.shutter_skill_fail_serial_id ' +
              LoginModel.LoginInfo.shutter_skill_fail_serial_id +
              ' != ' +
              result.cmd_data.shutter_skill_fail_serial_id +
              ' result.cmd_data.shutter_skill_fail_serial_id'
          );
        }
      } else {
        this.CmdCallback(cmd_Name, status, result);
      }
    } else {
      if (this.cmdRetryTimesDict[cmd_Name] < this.Timer.length) {
        console.log(
          'shutter skill fail retry : ',
          this.cmdRetryTimesDict[cmd_Name]
        );

        this.ReSendCmd(cmd_Name);

        this.cmdRetryTimesDict[cmd_Name]++;
      } else {
        console.log('shutter skill fail retry dead');

        this.CmdCallback(cmd_Name, status, result);
      }
    }
  }

  public get_sn() {
    let sn = ArkClient.sn + 1;
    const seconds: number = Math.floor(new Date().getTime() * 0.001);
    if (ArkClient.nowSecond !== seconds) {
      sn = 0;
    }
    return (seconds * 1000 + sn).toString();
  }

  /**
   * 送出帶 Retry 的 Command
   * @param systemName Server 的 Sysytem Name
   * @param commandName Server 的 Command Name
   * @param data 要送出的資料
   * @param callback
   * @returns sn SerialNumber
   */
  public SendCommand(
    systemName: string,
    commandName: string,
    data: JSON,
    callback: Function
  ): void {
    const sn: string = this.get_sn();
    console.warn(
      '[SendCommand] systemName' + systemName + ', commandName = ' + commandName
    );
    if (this.cmdTmpDataDict[sn] !== undefined) {
      console.error(commandName, 'is send already');
      return;
    } else {
      this.cmdTmpDataDict[sn] = data;
      this.cmdRetryTimesDict[sn] = 0;
      this.cmdCallbackDict[sn] = callback;
      this.cmdRecvDict[sn] = this.Retry.bind(this, sn);
      this.cmdSysName[sn] = systemName;
    }

    const retryIndex = this.cmdRetryTimesDict[sn];
    this.cmdRetryTimesDict[sn]++;

    this.m_pinClient.send_cmd(
      systemName,
      commandName,
      this.cmdTmpDataDict[sn],
      this.cmdRecvDict[sn],
      this.Timer[retryIndex]
    );
  }

  private Retry(sn: string, status: number, result: any, cmd_Name: any) {
    if (status === HttpResult.OK) {
      this.Callback(sn, cmd_Name, status, result);
    } else {
      if (this.cmdRetryTimesDict[sn] < this.Timer.length) {
        console.log(cmd_Name + ' retry : ', this.cmdRetryTimesDict[sn]);

        this.ReSend(sn, cmd_Name);

        this.cmdRetryTimesDict[sn]++;
      } else {
        console.log(cmd_Name + ' retry dead');

        this.Callback(sn, cmd_Name, status, result);
      }
    }
  }

  private ReSend(sn: string, cmd_Name: string) {
    console.log('[UserClient.ReSend] %c' + sn, 'color:coral');

    const retryIndex = this.cmdRetryTimesDict[sn];
    let sysName = this.systemName;
    if (this.cmdSysName[sn]) {
      sysName = this.cmdSysName[sn];
    }
    this.m_pinClient.send_cmd(
      sysName,
      cmd_Name,
      this.cmdTmpDataDict[sn],
      this.cmdRecvDict[sn],
      this.Timer[retryIndex],
      sn
    );
  }
  private Callback(sn, cmd_Name, status, result) {
    if (this.cmdCallbackDict !== undefined) {
      this.cmdCallbackDict[sn](status, result);
      this.cmdRetryTimesDict[sn] = undefined;
      this.cmdTmpDataDict[sn] = undefined;
      this.cmdCallbackDict[sn] = undefined;
      this.cmdRecvDict[sn] = undefined;
      this.cmdSysName[sn] = undefined;
    }
  }

  /**
   * 送出 noRetry 的 Command
   * @param systemName Server 的 Sysytem Name
   * @param commandName Server 的 Command Name
   * @param data 要送出的資料
   * @param callback
   */
  public SentNoRetryCommond(
    systemName: string,
    commandName: string,
    data?: JSON,
    callback?,
    timeout = 15000,
    sn?: string,
    extra_data?: JSON
  ) {
    console.warn(
      '[SentNoRetryCommond] systemName' +
        systemName +
        ', commandName = ' +
        commandName
    );
    this.m_pinClient.send_cmd(
      systemName,
      commandName,
      data,
      callback,
      timeout,
      sn,
      extra_data
    );
  }

  private SendRetryCmd(cmd_Name, cmd_data, callback, RecvHandler) {
    if (this.cmdTmpDataDict[cmd_Name] !== undefined) {
      console.error(cmd_Name, 'is send already,retry now ...');
      return;
    } else {
      this.cmdTmpDataDict[cmd_Name] = cmd_data;
      this.cmdRetryTimesDict[cmd_Name] = 0;
      this.cmdCallbackDict[cmd_Name] = callback;
      this.cmdRecvDict[cmd_Name] = RecvHandler;
    }

    const retryIndex = this.cmdRetryTimesDict[cmd_Name];

    this.cmdRetryTimesDict[cmd_Name]++;

    this.m_pinClient.send_cmd(
      this.systemName,
      cmd_Name,
      this.cmdTmpDataDict[cmd_Name],
      this.cmdRecvDict[cmd_Name],
      this.Timer[retryIndex]
    );
  }

  private ReSendCmd(cmd_Name: string) {
    console.log('[UserClient.ReSendCmd] %c' + cmd_Name, 'color:coral');

    const retryIndex = this.cmdRetryTimesDict[cmd_Name];
    let sysName = this.systemName;
    if (this.cmdSysName[cmd_Name]) {
      sysName = this.cmdSysName[cmd_Name];
    }

    this.m_pinClient.send_cmd(
      sysName,
      cmd_Name,
      this.cmdTmpDataDict[cmd_Name],
      this.cmdRecvDict[cmd_Name],
      this.Timer[retryIndex]
    );
  }

  private CmdCallback(cmdName: string, status, result) {
    if (this.cmdCallbackDict !== undefined) {
      this.cmdCallbackDict[cmdName](status, result);
      this.ReleaseRetryCmdData(cmdName);
    }
  }

  private ReleaseRetryCmdData(cmdName: string): void {
    this.cmdRetryTimesDict[cmdName] = undefined;
    this.cmdTmpDataDict[cmdName] = undefined;
    this.cmdCallbackDict[cmdName] = undefined;
    this.cmdRecvDict[cmdName] = undefined;
    this.cmdSysName[cmdName] = undefined;
  }

  /**
   * 紀錄click log，每五分鐘批量上傳
   * @param click_id 表示屬於哪個活動或元件的log
   * @param btn_click_id 表示該活動或元件中定義的按鈕ID
   */
  public recordClickLog(
    click_id: string,
    btn_click_id: number,
    extra_data: JSON = null
  ) {
    if (!this.m_bHaveClickLog) {
      this.m_bHaveClickLog = true;
      this.sendClickLog();
    }

    //@ts-ignore
    const curGame: string = SS.Common.GameEnvironment.CurrentGameNow;
    const scenes: string = curGame ? curGame : 'Lobby';
    let newLog: Boolean = true;
    for (let i = 0; i < this.m_arrJsonClickLog.length; i++) {
      const element = this.m_arrJsonClickLog[i];
      if (
        element['click_id'] === click_id &&
        element['btn_click_id'] === btn_click_id &&
        element['scenes'] === scenes
      ) {
        newLog = false;
        element['btn_click_times'] += 1;
        break;
      }
    }

    if (newLog) {
      const date = new Date();
      const now = date.getTime();
      const local = date.getTime() - date.getTimezoneOffset() * 60000;
      //let timestamp:number = Math.floor(now.getTime() / 1000);

      const data: any = {
        click_id: click_id,
        btn_click_id: btn_click_id,
        btn_click_times: 1,
        scenes: curGame ? curGame : 'Lobby',
        ark_id: LoginModel.LoginInfo.pin_ark_id,
        pin_id: LoginModel.LoginInfo.pin_id,
        kiosk_id: LoginModel.LoginInfo.kiosk_id,
        device_id: LoginModel.LoginInfo.device_id,
        device_type: 1, //1:h5 0:PC
        machine_id: LoginModel.LoginInfo.machine_id,
        extra_data: extra_data,

        client_time_utc: Math.floor(now / 1000),
        client_time_local: Math.floor(local / 1000),
      };

      this.m_arrJsonClickLog.push(data);
      UserClient.CurClickLogData.push(data);
    }
  }

  /**
   *
   * 每五分鐘上傳m_arrJsonClickLog並清空
   * 無retry
   */
  private async sendClickLog() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.delay(300000);

      if (this.m_arrJsonClickLog != null && this.m_arrJsonClickLog.length > 0) {
        const cmdData: JSON = <JSON>{};
        cmdData['btn_click_list'] = this.m_arrJsonClickLog;

        console.warn('sendClickLog');
        console.warn(cmdData);
        this.m_pinClient.send_cmd(
          this.systemName,
          'sendClientClickInfo',
          cmdData,
          null,
          null
        );

        this.m_arrJsonClickLog = [];
        UserClient.CurClickLogData = [];
      }
    }
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * send click log now
   * @param click_id click id
   * @param btn_click_id btn click id
   */
  public sendClickLogNow(
    click_id: string,
    btn_click_id: number,
    btn_click_times = 1,
    extra_data: JSON = null
  ) {
    //@ts-ignore
    const curGame: string = SS.Common.GameEnvironment.CurrentGameNow;
    const date = new Date();
    const now = date.getTime();
    const local = date.getTime() - date.getTimezoneOffset() * 60000;

    const data: any = {
      click_id: click_id,
      btn_click_id: btn_click_id,
      btn_click_times: btn_click_times,
      scenes: curGame ? curGame : 'Lobby',
      ark_id: LoginModel.LoginInfo.pin_ark_id,
      pin_id: LoginModel.LoginInfo.pin_id,
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      device_id: LoginModel.LoginInfo.device_id,
      device_type: 1, //1:h5 0:PC
      machine_id: LoginModel.LoginInfo.machine_id,
      extra_data: extra_data,

      client_time_utc: Math.floor(now / 1000),
      client_time_local: Math.floor(local / 1000),
    };

    const arr = [];
    arr[0] = data;
    const cmdData: JSON = <JSON>{};
    cmdData['btn_click_list'] = arr;

    console.warn('sendClickLogNow');
    console.warn(cmdData);
    this.m_pinClient.send_cmd(
      this.systemName,
      'sendClientClickInfo',
      cmdData,
      null,
      null
    );
  }

  /**
   * 紀錄click log，每五分鐘批量上傳，一次新增一筆包含點擊次數的log (目前用來記錄每次海王(野牛、惡龍、小綠人、金剛)捕獲後點擊互動次數)
   * @param click_id 表示屬於哪個活動或元件的log
   * @param btn_click_id 表示該活動或元件中定義的按鈕ID
   * @param btn_click_times 點擊次數
   */
  public recordClickTimesLog(
    click_id: string,
    btn_click_id: number,
    btn_click_times: number
  ) {
    if (!this.m_bHaveClickLog) {
      this.m_bHaveClickLog = true;
      this.sendClickLog();
    }

    //@ts-ignore
    const curGame: string = SS.Common.GameEnvironment.CurrentGameNow;
    const scenes: string = curGame ? curGame : 'Lobby';
    const date = new Date();
    const now = date.getTime();
    const local = date.getTime() - date.getTimezoneOffset() * 60000;
    const data: any = {
      click_id: click_id,
      btn_click_id: btn_click_id,
      btn_click_times: btn_click_times,
      scenes: scenes,
      ark_id: LoginModel.LoginInfo.pin_ark_id,
      pin_id: LoginModel.LoginInfo.pin_id,
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      device_id: LoginModel.LoginInfo.device_id,
      device_type: 1, //1:h5 0:PC
      machine_id: LoginModel.LoginInfo.machine_id,

      client_time_utc: Math.floor(now / 1000),
      client_time_local: Math.floor(local / 1000),
    };

    console.warn(
      '[recordClickTimesLog] click_id = ' +
        click_id +
        ', btn_click_id = ' +
        btn_click_id +
        ', btn_click_times = ' +
        btn_click_times
    );
    this.m_arrJsonClickLog.push(data);
    UserClient.CurClickLogData.push(data);
  }

  /**
   * GUEST 模式下，一般登入，取得店家聯絡資訊
   * @param successCallback
   * @param failCallback
   */
  public getContactInfoByKiosk(
    successCallback: (status: number, data: any, cmdName: string) => void,
    failCallback: (status: number, data: any, cmdName: string) => void
  ) {
    this.getContactInfoSuccessCallback = successCallback;
    this.getContactInfoFailCallback = failCallback;

    const cmd_data: any = {
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      logo: LoginModel.LoginInfo.logo,
    };

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.m_pinClient.send_cmd(
      'lobby',
      'getContactInfoByKiosk',
      cmd_data,
      self.onRecieveContactInfoByKiosk.bind(self)
    );
  }

  private getContactInfoSuccessCallback = null;
  private getContactInfoFailCallback = null;

  private onRecieveContactInfoByKiosk(status: number, data: any) {
    console.log('[UserClient] getContactInfoByKiosk state: ', status);
    console.log('[UserClient] getContactInfoByKiosk data: ', data);

    try {
      if (status === HttpResult.OK && data.cmd_data.err_code === 0) {
        if (this.getContactInfoSuccessCallback != null) {
          this.getContactInfoSuccessCallback(
            status,
            data,
            'getContactInfoByKiosk'
          );
          this.getContactInfoSuccessCallback = null;
        }
      } else {
        console.error(
          '[UserClient] %c getContactInfoByKiosk failed\n',
          'font-size:18px;font-weight:bold;color:green;',
          data
        );
        if (this.getContactInfoFailCallback != null) {
          this.getContactInfoFailCallback(
            status,
            data,
            'getContactInfoByKiosk'
          );
          this.getContactInfoFailCallback = null;
        }
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  /**
   * GUEST 補分
   * @param comps_name 補分類別
   * @param succeedCallback
   * @param failedCallback
   */
  public getComps(
    comps_name: string,
    succeedCallback: (status: number, data: any, cmdName: string) => void,
    failedCallback: (status: number, data: any, cmdName: string) => void
  ): void {
    this.getCompsSucceedCallback = succeedCallback;
    this.getCompsFailedCallback = failedCallback;

    const cmd_data: any = {
      comps_name: comps_name,
      logo: LoginModel.LoginInfo.logo,
    };

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.m_pinClient.send_cmd(
      'lobby',
      'getComps',
      cmd_data,
      self.onRecieveGetComps.bind(self)
    );
  }

  private getCompsSucceedCallback = null;
  private getCompsFailedCallback = null;

  private onRecieveGetComps(status: number, data: any) {
    console.log('[UserClient] getComps state: ', status);
    console.log('[UserClient] getComps data: ', data);

    try {
      if (status === HttpResult.OK && data.cmd_data.err_code === 0) {
        if (this.getCompsSucceedCallback != null) {
          this.getCompsSucceedCallback(status, data, 'getComps');
          this.getCompsSucceedCallback = null;
        }
      } else {
        console.error(
          '[UserClient] %c getComps failed\n',
          'font-size:18px;font-weight:bold;color:green;',
          data
        );
        if (this.getCompsFailedCallback != null) {
          this.getCompsFailedCallback(status, data, 'getComps');
          this.getCompsFailedCallback = null;
        }
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  /**
   * 取得目前開放的補分活動
   * @param succeedCallback
   * @param failedCallback
   */
  public getCompsEventInfo(
    succeedCallback: (status: number, data: any, cmdName: string) => void,
    failedCallback: (status: number, data: any, cmdName: string) => void
  ): void {
    this.getCompsEventInfoSucceedCallback = succeedCallback;
    this.getCompsEventInfoFailedCallback = failedCallback;

    const cmd_data: any = {
      logo: LoginModel.LoginInfo.logo,
    };

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.m_pinClient.send_cmd(
      'lobby',
      'getCompsEventInfo',
      cmd_data,
      self.onRecieveGetCompsEventInfo.bind(self)
    );
  }

  private getCompsEventInfoSucceedCallback = null;
  private getCompsEventInfoFailedCallback = null;

  private onRecieveGetCompsEventInfo(status: number, data: any) {
    console.log('[UserClient] getCompsEventInfo state: ', status);
    console.log('[UserClient] getCompsEventInfo data: ', data);

    try {
      if (status === HttpResult.OK && data.cmd_data.err_code === 0) {
        if (this.getCompsEventInfoSucceedCallback != null) {
          this.getCompsEventInfoSucceedCallback(
            status,
            data,
            'getCompsEventInfo'
          );
          this.getCompsEventInfoSucceedCallback = null;
        }
      } else {
        console.error(
          '[UserClient] %c getCompsEventInfo failed\n',
          'font-size:18px;font-weight:bold;color:green;',
          data
        );
        if (this.getCompsEventInfoFailedCallback != null) {
          this.getCompsEventInfoFailedCallback(
            status,
            data,
            'getCompsEventInfo'
          );
          this.getCompsEventInfoFailedCallback = null;
        }
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  /**
   * send Click Log Ex
   * @param click_id click id
   * @param btn_click_id btn click id
   * @param _click_name click name
   * @param _urlCode url code
   */
  public sendClickLogEx(
    click_id: string,
    btn_click_id: number,
    _click_name: string,
    _urlCode: string,
    deviceInfo: any = null
  ) {
    //@ts-ignore
    const curGame: string = SS.Common.GameEnvironment.CurrentGameNow;
    const date = new Date();
    const now = date.getTime();
    const local = date.getTime() - date.getTimezoneOffset() * 60000;

    const data: any = {
      click_id: click_id,
      btn_click_id: btn_click_id,
      btn_click_times: 1,
      click_name: _click_name,
      scenes: curGame ? curGame : 'Lobby',
      ark_id: LoginModel.LoginInfo.pin_ark_id,
      pin_id: LoginModel.LoginInfo.pin_id,
      kiosk_id: LoginModel.LoginInfo.kiosk_id,
      device_id: _urlCode, // device_id, 這個資料欄位目前 db 沒有在使用，目前用來儲存 url code 通路代碼
      device_type: 1, // 1:h5 0:PC
      machine_id: LoginModel.LoginInfo.machine_id,

      browser_info: deviceInfo.browser.name,
      browser_version: deviceInfo.browser.version,
      device_info: deviceInfo.os.name,
      device_version: deviceInfo.os.version,

      client_time_utc: Math.floor(now / 1000),
      client_time_local: Math.floor(local / 1000),
    };

    const arr = [];
    arr[0] = data;
    const cmdData: JSON = <JSON>{};
    cmdData['btn_click_list'] = arr;

    console.warn('sendClickLogEx');
    console.warn(cmdData);
    this.m_pinClient.send_cmd(
      this.systemName,
      'sendClientClickInfo',
      cmdData,
      null,
      null
    );
  }

  /**
   * 紀錄SpinTypeLog，每30分鐘批量上傳
   * @param stopType 每手玩家選擇的停輪狀態 (0= 一般停輪、1=手動停輪、2=開加速鈕)
   * @param autoType 是否開啟 AUTO 狀態 (0=關閉、1=開啟)
   * @param bet 押注額(美金=分數/100)
   */
  public recordSpinTypeLog(stopType: number, autoType: number, bet: number) {
    this.intervalSendSpinTypeLog();

    //@ts-ignore
    const curGame: string = SS.Common.GameEnvironment.CurrentGameNow;
    //let scenes: string = curGame ? curGame : "Lobby";
    let newLog: Boolean = true;
    for (let i = 0; i < this.m_arrJsonSpinTypeLog.length; i++) {
      const element = this.m_arrJsonSpinTypeLog[i];
      if (
        element['ThemeTitle'] === curGame &&
        element['SpeedStopType'] === stopType &&
        element['AutoType'] === autoType &&
        element['Bet'] === bet
      ) {
        newLog = false;
        element['TotalBetTimes'] += 1;
        break;
      }
    }

    if (newLog) {
      const data: any = {
        KioskID: LoginModel.LoginInfo.kiosk_id,
        PinID: LoginModel.LoginInfo.pin_id,
        ThemeTitle: curGame,

        Device: 1,

        SpeedStopType: stopType,
        AutoType: autoType,
        Bet: bet,
        TotalBet: bet * 1,
        TotalBetTimes: 1,
      };

      this.m_arrJsonSpinTypeLog.push(data);
    }
  }

  /**
   *
   *
   * 無retry
   */
  public sendSpinTypeLog() {
    console.log('sendSpinTypeLog');
    if (
      this.m_arrJsonSpinTypeLog != null &&
      this.m_arrJsonSpinTypeLog.length > 0
    ) {
      for (let i = 0; i < this.m_arrJsonSpinTypeLog.length; i++) {
        console.log('i = ' + i);
        const cmdData: JSON = this.m_arrJsonSpinTypeLog[i];
        cmdData['TotalBet'] = cmdData['Bet'] * cmdData['TotalBetTimes'];
        console.log(cmdData);

        this.m_pinClient.send_cmd(
          this.systemName,
          'SpinTypeLog',
          cmdData,
          null,
          null
        );
      }

      this.m_arrJsonSpinTypeLog = [];
    }
  }

  private async intervalSendSpinTypeLog() {
    console.log('intervalSendSpinTypeLog()');
    //30 min 18e5
    if (this.m_intervalSpinTypeLog == null)
      this.m_intervalSpinTypeLog = setInterval(
        () => this.sendSpinTypeLog(),
        18e5
      );
  }

  public sendSpinTypeLogVer2(arrJsonSpinTypeLog: JSON[]) {
    console.log('sendSpinTypeLogVer2');
    if (arrJsonSpinTypeLog != null && arrJsonSpinTypeLog.length > 0) {
      for (let i = 0; i < arrJsonSpinTypeLog.length; i++) {
        console.log('i = ' + i);
        const cmdData: JSON = arrJsonSpinTypeLog[i];
        cmdData['TotalBet'] = cmdData['Bet'] * cmdData['TotalBetTimes'];
        console.log(cmdData);

        this.m_pinClient.send_cmd('log', 'SpinTypeLog', cmdData, null, null);
      }
    }
  }

  // 取得 SessionBonus 信息(例如: DailyBonus...)
  public getSessionBonusInfo(
    layout: string[],
    callback?: (status: number, result: any) => void
  ) {
    if (layout == null || layout.length === 0) {
      console.log('getSessionBonusInfo (get all)');
      this.m_pinClient.send_cmd('SessionBonus', 'GET_INFO', null, callback);
    } else {
      const cmdData: any = {
        Layout: layout,
      };
      console.log('getSessionBonusInfo ', cmdData);
      this.m_pinClient.send_cmd(
        'SessionBonus',
        'GET_INFO',
        <JSON>cmdData,
        callback
      );
    }
  }

  // 通知 Server SessionBonus 要領獎的項目
  // BonusId: 活動名稱
  // Session: 活動序號
  // Level: 欲領獎的物品，位在活動內獎項的哪個位置 (對應 GET_INFO 封包的 "Level" 清單索引)
  public sendSessionBonusTakeReward(
    BonusId: string,
    Session: number,
    Level: number,
    callback?: (status: number, result: any) => void
  ) {
    if (BonusId == null || Session == null || Level == null) {
      console.log('sendSessionBonusTakeReward error', BonusId, Session, Level);
      return;
    }
    const cmdData: any = {
      BonusId: BonusId,
      Session: Session,
      Level: Level,
    };
    console.log('sendSessionBonusTakeReward ', cmdData);
    this.m_pinClient.send_cmd(
      'SessionBonus',
      'TAKE_REWARD',
      <JSON>cmdData,
      callback
    );
  }

  // 取得大廳內最愛遊戲清單
  public getFavoriteGameList(callback?: (status: number, result: any) => void) {
    this.m_pinClient.send_cmd(this.systemName, 'getFavList', null, callback);
  }

  // 上傳大廳內最愛遊戲清單給 server 保存
  public sendFavoriteGameList(
    favoriteList: string[],
    callback?: (status: number, result: any) => void
  ) {
    const cmdData: any = {
      FavList: favoriteList,
    };
    this.m_pinClient.send_cmd(
      this.systemName,
      'updateFavList',
      cmdData,
      callback
    );
  }
}
