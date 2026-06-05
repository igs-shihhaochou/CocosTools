import {_decorator} from 'cc';
const {ccclass} = _decorator;

import DataController from './DataController';

@ccclass('GDGameServerController')
export default class GDGameServerController extends DataController {
  public cid = 0;
  public get CommandID(): string {
    // return "game" + PlatformData.GameName;
  }
  public get CommandName(): any {
    // return HostSetting.Instance.ConnectSetting.Server.CommandName;
  }
  public getBuyBonusInfoData(_gameId: string, _onBuyBonusInfoDataReturn: any) {
    // let data: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
    // data['GameName'] = gameId;
    // data["Detail"] = true;
    // data['BonusType'] = "BuyBonus";
    // let content: CommandContent = new CommandContent();
    // content.commandID = this.CommandID;
    // content.commandName = this.CommandName.GetBuyBonusInfo;
    // content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
    // content.data = data;
    // content.callback = this.onDataReturn.bind(this, this.CommandName.GetBuyBonusInfo, onBuyBonusInfoDataReturn);
    // if (content.commandName) {
    // CommandHandler.Instance.SendCommand(content);
    // }
    // if (Define.DEBUG_LOG) {
    // console.log("[BuyBonus]Send getBuyBonusInfoData Data : ", content);
    // }
  }
  public getBuyBonusSpinData(
    _gameId: string,
    _lineBet: number,
    _extraBet: boolean,
    _specialGameType: string,
    _buyBonusName: string,
    _onBuyBonusSpinDataReturn: any
  ) {
    // let data: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
    // data['GameName'] = gameId;
    // data["line_bet"] = lineBet;
    // data["extra_bet"] = extraBet;
    // data["buy_bonus_type"] = specialGameType;
    // data["Name"] = buyBonusName;
    // let content: CommandContent = new CommandContent();
    // content.commandID = this.CommandID;
    // content.commandName = this.CommandName.BuyBonusSpin;
    // content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
    // content.data = data;
    // content.callback = this.onDataReturn.bind(this, this.CommandName.BuyBonusSpin, onBuyBonusSpinDataReturn);
    // CommandHandler.Instance.SendCommand(content);
    // if (Define.DEBUG_LOG) {
    // console.log("[BuyBonus]Send getBuyBonusSpinData Data : ", content);
    // }
  }
  public getStartGameData(_gameId: string, _onGameStartReturn: any) {
    // let data: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
    // data['GameName'] = gameId;
    // data["theme_id"] = SS.Common.GameEnvironment.GetGameIdByName(gameId);
    // data["theme_title"] = gameId;
    // data["game_id"] = gameId;
    // let content: CommandContent = new CommandContent();
    // content.commandID = this.CommandID;
    // content.commandName = this.CommandName.StartGame;
    // content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
    // content.data = data;
    // content.callback = this.onDataReturn.bind(this, this.CommandName.StartGame, onGameStartReturn);
    // CommandHandler.Instance.SendCommand(content);
    // if (Define.DEBUG_LOG) {
    // console.log("[StartGame]Send startGame Data : ", content);
    // }
  }
  public getSpinData(
    _gameId: string,
    _lineBet: number,
    _devMode: number,
    _onSpinDataReturn: any
  ) {
    // let data: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
    // data["theme_id"] = SS.Common.GameEnvironment.GetGameIdByName(gameId);
    // data["theme_title"] = gameId;
    // data[this.CommandName.LineBet] = lineBet;
    // data[this.CommandName.Lines] = PlatformData.Instance.originalTotalBet / PlatformData.Instance.originalLineBet;
    // data["cheat_key"] = devMode;
    // data["cheatKey"] = devMode;
    // data["dev_mode"] = devMode;
    // data["extra_bet"] = PlatformData.Instance.IsExtraBet;
    // data["extra_info"] = {};
    // data["cid"] = this.cid;
    // let content: CommandContent = new CommandContent();
    // content.commandID = this.CommandID;
    // content.commandName = this.CommandName.Spin;
    // content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
    // content.data = data;
    // content.callback = this.onDataReturn.bind(this, this.CommandName.Spin, onSpinDataReturn);
    // CommandHandler.Instance.SendCommand(content);
    // if (Define.DEBUG_LOG) {
    // console.log("[command]Send getSpinData Data : ", content);
    // }
  }
  public getFeverData(
    _gameId: string,
    _sgId: number,
    _devMode: number,
    _data: any,
    _onFeverDataReturn: any
  ) {
    // let tmp: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
    // data["theme_id"] = SS.Common.GameEnvironment.GetGameIdByName(gameId);
    // data["theme_title"] = gameId;
    // data["cid"] = this.cid;
    // for (let key in tmp) {
    // data[key] = tmp[key];
    // }
    // let content: CommandContent = new CommandContent();
    // content.commandID = this.CommandID;
    // content.commandName = this.CommandName.SpecialGame;
    // content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
    // content.data = data;
    // content.callback = this.onDataReturn.bind(this, this.CommandName.SpecialGame, onFeverDataReturn);
    // CommandHandler.Instance.SendCommand(content);
    // if (Define.DEBUG_LOG) {
    // console.log("[command]Send getSpinData Data : ", content);
    // }
  }
  public onDataReturn(_cmdName, _callback, _result, _cmd_data): void {
    // let retName = "ret" + cmdName;
    // if (!callback) {
    // console.error("callback is null");
    // }
    // if (result !== 0) {
    // console.error("onDataReturn error: ", cmd_data);
    // let errorCode = "C255-" + result;
    // if (errorCode) {
    // PlatformGDK.instance.CommandErrorHandler.Notify(errorCode);
    // }
    // }
    // else {
    // this.cid++;
    // if (SlotGDK.Event(retName).Length > 0) {
    // SlotGDK.Event(retName).Notify(result, cmd_data, callback);
    // }
    // else {
    // callback(result, cmd_data);
    // }
    // }
  }
}

/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import { Define } from "../../../CommonModule/Script/Define/GlobalSetting";
// import { PlatformData } from "../../../CommonModule/Script/Define/PlatformData";
// import { PlatformGDK } from "../../../CommonModule/Script/Platform/PlatformGDK";
// import HostSetting, { HostSettingInterface } from "../../Define/HostSetting";
// import { SlotGDK } from "../../Define/SlotGDK";
// import CommandHandler, { CommandContent } from "./CommandHandler";
// import DataController from "./DataController";
//
// const { ccclass, property } = cc._decorator;
//
//
// @ccclass
// export default class GDGameServerController extends DataController {
//
//     public cid: number = 0;
//     public get CommandID(): string {
//         return "game" + PlatformData.GameName;
//     }
//
//     public get CommandName(): HostSettingInterface.CommandName {
//         return HostSetting.Instance.ConnectSetting.Server.CommandName;
//     }
//
//     public getBuyBonusInfoData(gameId: string, onBuyBonusInfoDataReturn: any) {
//         let data: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
//         data['GameName'] = gameId;
//         data["Detail"] = true;
//         data['BonusType'] = "BuyBonus";
//         let content: CommandContent = new CommandContent();
//
//         content.commandID = this.CommandID;
//         content.commandName = this.CommandName.GetBuyBonusInfo;
//         content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
//         content.data = data;
//         content.callback = this.onDataReturn.bind(this, this.CommandName.GetBuyBonusInfo, onBuyBonusInfoDataReturn);
//
//         if (content.commandName) {
//             CommandHandler.Instance.SendCommand(content);
//         }
//         if (Define.DEBUG_LOG) {
//
//             console.log("[BuyBonus]Send getBuyBonusInfoData Data : ", content);
//         }
//     }
//
//     public getBuyBonusSpinData(gameId: string, lineBet: number, extraBet: boolean, specialGameType: string, buyBonusName: string, onBuyBonusSpinDataReturn: any) {
//         let data: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
//         data['GameName'] = gameId;
//         data["line_bet"] = lineBet;
//         data["extra_bet"] = extraBet;
//         data["buy_bonus_type"] = specialGameType;
//         data["Name"] = buyBonusName;
//         let content: CommandContent = new CommandContent();
//
//         content.commandID = this.CommandID;
//         content.commandName = this.CommandName.BuyBonusSpin;
//         content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
//         content.data = data;
//         content.callback = this.onDataReturn.bind(this, this.CommandName.BuyBonusSpin, onBuyBonusSpinDataReturn);
//
//         CommandHandler.Instance.SendCommand(content);
//         if (Define.DEBUG_LOG) {
//             console.log("[BuyBonus]Send getBuyBonusSpinData Data : ", content);
//         }
//     }
//
//     public getStartGameData(gameId: string, onGameStartReturn: any) {
//         let data: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
//         data['GameName'] = gameId;
//         data["theme_id"] = SS.Common.GameEnvironment.GetGameIdByName(gameId);
//         data["theme_title"] = gameId;
//         data["game_id"] = gameId;
//
//         let content: CommandContent = new CommandContent();
//
//         content.commandID = this.CommandID;
//         content.commandName = this.CommandName.StartGame;
//         content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
//         content.data = data;
//         content.callback = this.onDataReturn.bind(this, this.CommandName.StartGame, onGameStartReturn);
//
//         CommandHandler.Instance.SendCommand(content);
//         if (Define.DEBUG_LOG) {
//
//             console.log("[StartGame]Send startGame Data : ", content);
//         }
//     }
//
//     public getSpinData(gameId: string, lineBet: number, devMode: number, onSpinDataReturn: any) {
//         let data: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
//
//         data["theme_id"] = SS.Common.GameEnvironment.GetGameIdByName(gameId);
//         data["theme_title"] = gameId;
//         data[this.CommandName.LineBet] = lineBet;
//         data[this.CommandName.Lines] = PlatformData.Instance.originalTotalBet / PlatformData.Instance.originalLineBet;
//         data["cheat_key"] = devMode;
//         data["cheatKey"] = devMode;
//         data["dev_mode"] = devMode;
//         data["extra_bet"] = PlatformData.Instance.IsExtraBet;
//         data["extra_info"] = {};
//         data["cid"] = this.cid;
//
//         let content: CommandContent = new CommandContent();
//         content.commandID = this.CommandID;
//         content.commandName = this.CommandName.Spin;
//         content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
//         content.data = data;
//         content.callback = this.onDataReturn.bind(this, this.CommandName.Spin, onSpinDataReturn);
//         CommandHandler.Instance.SendCommand(content);
//
//         if (Define.DEBUG_LOG) {
//             console.log("[command]Send getSpinData Data : ", content);
//         }
//     }
//
//     public getFeverData(gameId: string, sgId: number, devMode: number, data: any, onFeverDataReturn: any) {
//
//         let tmp: JSON = JSON.parse(JSON.stringify(PlatformData.Instance.CommandData));
//         data["theme_id"] = SS.Common.GameEnvironment.GetGameIdByName(gameId);
//         data["theme_title"] = gameId;
//         data["cid"] = this.cid;
//         for (let key in tmp) {
//             data[key] = tmp[key];
//         }
//
//         let content: CommandContent = new CommandContent();
//         content.commandID = this.CommandID;
//         content.commandName = this.CommandName.SpecialGame;
//         content.retryIntervalArray = HostSetting.Instance.ConnectSetting.RetryIntervalArray.slice(0);
//         content.data = data;
//         content.callback = this.onDataReturn.bind(this, this.CommandName.SpecialGame, onFeverDataReturn);
//         CommandHandler.Instance.SendCommand(content);
//
//         if (Define.DEBUG_LOG) {
//             console.log("[command]Send getSpinData Data : ", content);
//         }
//     }
//
//     public onDataReturn(cmdName, callback, result, cmd_data): void {
//         let retName = "ret" + cmdName;
//         if (!callback) {
//             console.error("callback is null");
//         }
//
//         if (result !== 0) {
//             console.error("onDataReturn error: ", cmd_data);
//             let errorCode = "C255-" + result;
//             if (errorCode) {
//                 PlatformGDK.instance.CommandErrorHandler.Notify(errorCode);
//             }
//         }
//         else {
//
//             this.cid++;
//             if (SlotGDK.Event(retName).Length > 0) {
//                 SlotGDK.Event(retName).Notify(result, cmd_data, callback);
//             }
//             else {
//                 callback(result, cmd_data);
//             }
//         }
//     }
// }
