/* eslint-disable camelcase */
import {_decorator, Component} from 'cc';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import HttpConnect from '../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import {PlatformGDK} from '../../CommonModule/Script/Platform/PlatformGDK';
import {EDITOR} from 'cc/env';

const {ccclass} = _decorator;

@ccclass
export default class CustomCmdSender extends Component {
  /** 取得 Singleton 物件實體 */
  public static get instance(): CustomCmdSender {
    if (!window['customCmdSender']) {
      window['customCmdSender'] = new CustomCmdSender();
    }
    return window['customCmdSender'];
  }

  // public static get instance(): CustomCmdSender {
  //   return CustomCmdSender._instance;
  // }
  /** Instance 實體 */
  // private static _instance: CustomCmdSender = null;

  private commandProtocol: CommandSender.Interface.CommandProtocol =
    CommandSender.Source.API;
  /** 是否為合法第三方資訊 */
  private isLegalThirdPartyInfo = false;
  /** 是否為合法Ark資訊 */
  private isLegalArkInfo = false;

  private localDataStartTime = 0;

  protected onLoad(): void {
    PlatformGDK.instance.sendEventLog.insert(this.sentEventLog, this);
  }

  protected onDestroy(): void {
    window['customCmdSender'] = null;
  }

  public getUserInfo(onGetUserInfoFinish) {
    if (PlatformData.isDevServer) {
      console.log('getUserInfo PlatformData.isDevServer');
      const retData = {
        cmd_data: {data: {Balance: 99999, ThirdPartyNick: 'ABC'}},
      };

      onGetUserInfoFinish(HttpConnect.HttpResult.OK, retData);
      return;
    }

    console.log(
      '[command]Send getUserInfo',
      PlatformData.instance.lobbyArkClient
    );

    PlatformData.instance.lobbyArkClient?.sendCmd(
      this.commandProtocol.UserInfo.ID,
      this.commandProtocol.UserInfo.Name,
      null,
      onGetUserInfoFinish
    );

    if (Define.DEBUG_LOG) {
      console.log('[command]Send getUserInfo');
    }
  }

  /**
   * 取得資產資料
   * @param onGetAssetDataReturn
   */
  public getAssetData(onGetAssetDataReturn) {
    PlatformData.instance.lobbyArkClient?.sendCmd(
      this.commandProtocol.GetAsset.ID,
      this.commandProtocol.GetAsset.Name,
      null,
      onGetAssetDataReturn
    );

    if (Define.DEBUG_LOG) {
      console.log('[command]Send getAssetData');
    }
  }

  public getMarqueesData(onMarqueesDataReturn) {
    if (PlatformData.isDevServer) {
      const MarqueesData: JSON = JSON.parse(
        '{"status":{"msg":"OK","id":0},"data":{"serial":"' +
          Date.now() +
          '","stay":5,"content":"我是跑馬燈", "update_frequency":10}}'
      );

      const retData = {cmd_data: {}};
      retData.cmd_data = MarqueesData;
      onMarqueesDataReturn(HttpConnect.HttpResult.OK, retData);
      return;
    }

    const data: JSON = {lang: PlatformData.lang} as any;
    PlatformData.instance.lobbyArkClient.sendCmd(
      this.commandProtocol.Marquee.ID,
      this.commandProtocol.Marquee.Name,
      data,
      onMarqueesDataReturn
    );

    if (Define.DEBUG_LOG) {
      console.log(
        '[command]Send getMarqueesData Data : ' + JSON.stringify(data)
      );
    }
  }

  public getLinkingJPData(gameId: string, onLinkingJPDataReturn) {
    if (PlatformData.isDevServer) {
      if (this.localDataStartTime === 0) this.localDataStartTime = Date.now();

      const jpData: JSON = JSON.parse(
        '{"status":{"msg":"","id":0},"data":{"sent_time_gap":10,"jp_info":[{"game_id":"PhoenixLegend","jp_coin":999999.99,"jp_type":"Grand","end_time":123456789,"min_bet":10,"linking_id":"jp1504737","linking_theme":"LINKING_NAME"},{"game_id":"PhoenixLegend","jp_coin":666666.66,"jp_type":"Major","end_time":123456789,"min_bet":1,"linking_id":"jp1504737","linking_theme":"LINKING_NAME"},{"game_id":"PhoenixLegend","jp_coin":333333.33,"jp_type":"Minor","end_time":123456789,"min_bet":1,"linking_id":"jp1504737","linking_theme":"LINKING_NAME"}],"winner_info":{"winner_history":[{"game_id":"PhoenixLegend","jp_coin":99999.99,"jp_type":"Grand","jp_id":"jp1504737","user_id":"100000001","nickname":"Chris"}]}}}'
      );

      for (let i = 0; i < Object.keys(jpData['data']['jp_info']).length; i++) {
        jpData['data']['jp_info'][i]['jp_coin'] +=
          100 * (i + 1) + (i + 1) * (Date.now() - this.localDataStartTime);
      }

      const retData = {cmd_data: {}};
      retData.cmd_data = jpData;
      onLinkingJPDataReturn(HttpConnect.HttpResult.OK, retData);
      return;
    }

    const data: JSON = {game_id: gameId} as any;
    PlatformData.instance.lobbyArkClient.sendCmd(
      this.commandProtocol.LinkingJP.ID,
      this.commandProtocol.LinkingJP.Name,
      data,
      onLinkingJPDataReturn
    );

    if (Define.DEBUG_LOG) {
      console.log(
        '[command]Send getLinkingJPData Data : ' + JSON.stringify(data)
      );
    }
  }

  private sentEventLog(status: number) {
    if (EDITOR) {
      return;
    }
    onSendEventLog(status);
  }
}

export namespace Network.CommonSystem {
  export const Name = 'CommonSystem';
  export const C2SCommand = {
    UserInfo: 'get_user_info',
    Marquee: 'announce',
    CleanFever: 'clean_fever',
  };
}

export namespace Network.SlotSystem {
  export const Name = 'SlotGame';
  export const C2SCommand = {
    LinkingJP: 'get_jp_info',
  };
}

/** 資產系統 */
export namespace Network.AssetSystem {
  export const Name = 'Asset';
  export const C2SCommand = {
    GetAsset: 'GET_ASSET',
  };
}

/** CommandSender 協定介面 */
export namespace CommandSender.Interface {
  export interface CommandProtocol {
    UserInfo: ArkCommand;
    GetAsset: ArkCommand;
    LinkingJP: ArkCommand;
    Marquee: ArkCommand;
    ClearFeature: ArkCommand;
  }

  export interface ArkCommand {
    ID: string;
    Name: string;
  }
}

/** CommandSender 協定來源 */
export namespace CommandSender.Source {
  export const API: CommandSender.Interface.CommandProtocol = {
    UserInfo: {
      ID: Network.CommonSystem.Name,
      Name: Network.CommonSystem.C2SCommand.UserInfo,
    },
    GetAsset: {
      ID: Network.AssetSystem.Name,
      Name: Network.AssetSystem.C2SCommand.GetAsset,
    },
    Marquee: {
      ID: Network.CommonSystem.Name,
      Name: Network.CommonSystem.C2SCommand.Marquee,
    },
    ClearFeature: {
      ID: Network.CommonSystem.Name,
      Name: Network.CommonSystem.C2SCommand.CleanFever,
    },
    LinkingJP: {
      ID: Network.SlotSystem.Name,
      Name: Network.SlotSystem.C2SCommand.LinkingJP,
    },
  };
}
