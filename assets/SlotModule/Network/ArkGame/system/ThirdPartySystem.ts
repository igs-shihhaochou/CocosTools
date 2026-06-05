import HttpConnect from '../../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import BaseSystem from '../common/BaseSystem';

export default class ThirdPartySystem extends BaseSystem {
  public verifyMemberEvent: (
    status: number,
    msg: string,
    cmd_data: JSON
  ) => void = null;
  public memberInfoEvent: (
    status: number,
    msg: string,
    balance: number
  ) => void = null;

  constructor(arkClient) {
    super(arkClient, 'tp');

    this.registerCmdCallback('verify', this.onVerifyMember.bind(this));
    this.registerCmdCallback('info', this.onMemberInfo.bind(this));
  }
  registerCmdCallback(
    _arg0: string,
    _arg1: (result: number, rowData: JSON) => void
  ) {
    throw new Error('Method not implemented.');
  }

  verifyMember(user_token: string) {
    const data: any = {
      user_token: user_token,
    };

    this.sendDrtCmd('verify', <JSON>data);
  }
  sendDrtCmd(_arg0: string, _arg1: JSON) {
    throw new Error('Method not implemented.');
  }

  onVerifyMember(result: number, rowData: JSON) {
    //console.log("[onVerifyMember]response: " + JSON.stringify(rowData))

    if (result === HttpConnect.HttpResult.OK) {
      if (rowData !== null) {
        if (rowData.hasOwnProperty('status')) {
          // 將資料傳給遊戲邏輯做演出
          if (this.verifyMemberEvent !== null) {
            const status = rowData['status'];
            const cmd_data: any = {
              user_id: rowData['uid'],
              lname: rowData['lname'],
              nick: rowData['nick'],
              type: rowData['type'],
              currency: rowData['currency'],
            };
            const msg = rowData['msg'];

            this.verifyMemberEvent(status, msg, <JSON>cmd_data);
          }
        }
      }
    } else
      console.error(
        'onVerifyMemberError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rowData)
      );
  }

  memberInfo(
    user_id: string,
    user_token: string,
    lname: string,
    nick: string,
    account_type: number,
    currency: string
  ) {
    const data: any = {
      user_id: user_id,
      user_token: user_token,
      lname: lname,
      nick: nick,
      account_type: account_type,
      currency: currency,
    };

    this.sendCmd('info', <JSON>data);
  }
  sendCmd(_arg0: string, _arg1: JSON) {
    throw new Error('Method not implemented.');
  }

  onMemberInfo(result: number, rowData: JSON) {
    //console.log("[onMemberInfo]response: " + JSON.stringify(cmd_data))

    if (result === HttpConnect.HttpResult.OK) {
      if (rowData !== null) {
        const _cmd_sn = rowData['cmd_sn'];
        const cmd_data = rowData['cmd_data'];

        // 將資料傳給遊戲邏輯做演出
        if (this.memberInfoEvent !== null) {
          const status = cmd_data['status'];
          const balance = cmd_data['balance'];
          const msg = cmd_data['msg'];

          this.memberInfoEvent(status, msg, balance);
        }
      }
    } else {
      console.error(
        'onMemberInfoError \n result: ' +
          result +
          ' cmd_data: ' +
          JSON.stringify(rowData)
      );
    }
  }
}
