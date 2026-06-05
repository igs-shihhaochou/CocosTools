import {_decorator, Component} from 'cc';
const {ccclass} = _decorator;

@ccclass('GDGameServerParser')
export default class GDGameServerParser extends Component {
  public get CommandName(): any {
    // return HostSetting.Instance.ConnectSetting.Server.CommandName;
  }
  public onLoad(): void {
    // SlotGDK.Event("ret" + this.CommandName.GetBuyBonusInfo).Insert(this.onGetBuyBonusInfoDataReturn, this);
    // SlotGDK.Event("ret" + this.CommandName.BuyBonusSpin).Insert(this.onBuyBonusSpinDataReturn, this);
    // SlotGDK.Event("ret" + this.CommandName.StartGame).Insert(this.onStartGameDataReturn, this);
    // SlotGDK.Event("ret" + this.CommandName.Spin).Insert(this.onSpinDataReturn, this);
    // SlotGDK.Event("ret" + this.CommandName.SpecialGame).Insert(this.onSpecialGameDataReturn, this);
  }
  public onDestroy(): void {
    // SlotGDK.Event("ret" + this.CommandName.GetBuyBonusInfo).Remove(this.onGetBuyBonusInfoDataReturn, this);
    // SlotGDK.Event("ret" + this.CommandName.BuyBonusSpin).Remove(this.onBuyBonusSpinDataReturn, this);
    // SlotGDK.Event("ret" + this.CommandName.StartGame).Remove(this.onStartGameDataReturn, this);
    // SlotGDK.Event("ret" + this.CommandName.Spin).Remove(this.onSpinDataReturn, this);
    // SlotGDK.Event("ret" + this.CommandName.SpecialGame).Remove(this.onSpecialGameDataReturn, this);
  }
  public onGetBuyBonusInfoDataReturn(
    _result: number,
    _data: JSON,
    _callback: Function
  ): void {
    // console.warn("onGetBuyBonusInfoDataReturn", result, data);
    // callback(result, data);
  }
  public onBuyBonusSpinDataReturn(
    _result: number,
    _data: JSON,
    _callback: Function
  ): void {
    // console.warn("onBuyBonusSpinDataReturn", result, data);
    // callback(result, data);
  }
  public onStartGameDataReturn(
    _result: number,
    _data: JSON,
    _callback: Function
  ): void {
    // if (!data["cmd_data"] || data["cmd_data"]["result"] !== 0) {
    // let errorCode = "C16-" + (data["cmd_data"].hasOwnProperty && data["cmd_data"]["result"] !== 0) ? data["cmd_data"]["result"] : result;
    // PlatformGDK.instance.CommandErrorHandler.Notify(errorCode);
    // return;
    // }
    // let jsonData = data["cmd_data"]["data"];
    // let jsonPlayerData = data["cmd_data"]["playerInfo"];
    // let gameState = {
    // 'current_sg_id': jsonData['GS']['GS0'],
    // 'recovery_need_start': jsonData['GS']['GS1'],
    // 'sg_state': jsonData['GS']['GS2'],
    // 'current_line_bet': jsonData['GS']['GS3'],
    // 'current_bet': jsonData['GS']['GS3'],
    // 'current_lines': jsonData['GS']['GS4'],
    // };
    // if (jsonData['GS'].hasOwnProperty('GS5')) {
    // gameState['current_script'] = jsonData['GS']['GS5'];
    // }
    // let wheelBlock = [];
    // let wheelLength: number = (jsonData['WB']).length;
    // for (let i = 0; i < wheelLength; i++) {
    // let jsonWheelDatas = jsonData['WB'][i];
    // wheelBlock.push({});
    // wheelBlock[i]['id'] = jsonWheelDatas['WB0'];
    // wheelBlock[i]['fake_wheels'] = jsonWheelDatas['WB7'];
    // wheelBlock[i]['init_wheels'] = jsonWheelDatas['WB8'];
    // if (jsonWheelDatas.hasOwnProperty["WB3"])
    // wheelBlock[i]['win_special_symbols'] = jsonWheelDatas['WB3'];
    // }
    // let joinGameData = {
    // 'ratio': jsonData['A0'],        //ratio
    // 'max_lines': jsonData['A1'],        //maxLines
    // 'min_lines': jsonData['A2'],        //minLines
    // 'max_line_bet': jsonData['A3'],        //maxLineBet
    // 'min_line_bet': jsonData['A4'],        //minLineBet
    // 'max_balance': jsonData['A5'],        //maxGate
    // 'min_balance': jsonData['A6'],        //minGate
    // 'line_bet_range': jsonData['A7'],        //lineBetRange
    // 'bet_list': jsonData['A7'],        //lineBetRange
    // 'lines_range': jsonData['A8'],        //linesRange
    // 'jp_bet': jsonData['A9'],       //JPBet
    // 'odds': jsonData['A10'],      //oddsTable
    // 'special_odds': jsonData['A11'],
    // 'total_win_amount': jsonData['A12'],      //total_win_amount
    // 'extra_info': jsonData['A13'],      //total_win_amount
    // 'enablePreview': jsonData['A14'],
    // 'game_state': gameState,             //game_state
    // 'wheel_blocks': wheelBlock,        //wheel_blocks
    // 'current_line_bet': jsonData['GS']['GS3'],
    // 'InGameJpName': jsonData['InGameJpName'],
    // 'extra_bet': jsonData["extra_bet"]
    // };
    // let playerData = {
    // 'playerEntries': jsonPlayerData['P0'],  //playerEntries
    // 'playerTotalWin': jsonPlayerData['P1']   //playerTotalWin
    // };
    // data["cmd_data"]["data"] = joinGameData;
    // data["cmd_data"]["playerInfo"] = playerData;
    // callback(result, data);
  }
  public onSpinDataReturn(
    _result: number,
    _data: JSON,
    _callback: Function
  ): void {
    // if (data["cmd_data"]["result"] !== 0) {
    // let errorCode = "C22-" + (data["cmd_data"].hasOwnProperty && data["cmd_data"]["result"] !== 0) ? data["cmd_data"]["result"] : result;
    // PlatformGDK.instance.CommandErrorHandler.Notify(errorCode);
    // return;
    // }
    // let jsonData = data["cmd_data"]["data"];
    // let jsonPlayerData = data["cmd_data"]["playerInfo"];
    // let gameState = {
    // 'current_sg_id': jsonData["GS"]["GS0"],
    // 'sg_state': jsonData["GS"]["GS2"]
    // };
    // if (jsonData["GS"].hasOwnProperty("GS5")) {
    // gameState['current_script'] = jsonData["GS"]["GS5"];
    // }
    // let wheelLegth: number = (jsonData["WB"]).length;
    // let wheelBlock = [];
    // console.warn("length : " + wheelLegth);
    // for (let i = 0; i < wheelLegth; i++) {
    // wheelBlock.push({});
    // let jsonWheelData = jsonData["WB"][i];
    // wheelBlock[i]["id"] = jsonWheelData["WB0"];
    // wheelBlock[i]["result_wheels"] = jsonWheelData["WB1"];
    // if (jsonWheelData.hasOwnProperty("WB2"))
    // wheelBlock[i]["feature_wheels"] = jsonWheelData["WB2"];
    // if (jsonWheelData.hasOwnProperty("WB3"))
    // wheelBlock[i]["win_special_symbols"] = jsonWheelData["WB3"];
    // if (jsonWheelData.hasOwnProperty("WB4"))
    // wheelBlock[i]["pre_win_wheels"] = jsonWheelData["WB4"];
    // if (jsonWheelData.hasOwnProperty("WB5"))
    // wheelBlock[i]["bingo"] = jsonWheelData["WB5"];
    // if (jsonWheelData.hasOwnProperty("WB6"))
    // wheelBlock[i]["bingo_type"] = jsonWheelData["WB6"];
    // }
    // let spinData = {
    // 'cid': jsonData['B0'],
    // 'total_win_amount': jsonData['B1'],
    // 'this_win_amount': jsonData['B2'],
    // 'win_type': jsonData['B3'],
    // 'extra_info': jsonData['B4'],
    // 'preview_msg': jsonData['B5'],
    // 'game_state': gameState,
    // 'wheel_blocks': wheelBlock,
    // 'eventInfo': jsonData["eventInfo"],
    // 'arkID': jsonData["ark_id"],
    // 'leaderBoardInfo': jsonData["leaderBoardInfo"],
    // 'ItemInfo': jsonData["ItemInfo"]
    // };
    // let playerData = {
    // 'playerEntries': jsonPlayerData['P0'],  //playerEntries
    // 'playerTotalWin': jsonPlayerData['P1']   //playerTotalWin
    // };
    // data["cmd_data"]["data"] = spinData;
    // data["cmd_data"]["playerInfo"] = playerData;
    // callback(result, data);
  }
  public onSpecialGameDataReturn(
    _result: number,
    _data: JSON,
    _callback: Function
  ): void {
    // if (data["cmd_data"]["result"] !== 0) {
    // let errorCode = "C24-" + (data["cmd_data"].hasOwnProperty && data["cmd_data"]["result"] !== 0) ? data["cmd_data"]["result"] : result;
    // PlatformGDK.instance.CommandErrorHandler.Notify(errorCode);
    // return;
    // }
    // if (data["cmd_data"]["data"].hasOwnProperty("D0"))
    // data = this.ConvertFreeGameInitCmd(data);
    // else if (data["cmd_data"]["data"].hasOwnProperty("C0"))
    // data = this.ConvertFreeGameSpinCmdConvert(data);
    // callback(result, data);
  }
  public ConvertFreeGameInitCmd(_data) {
    // console.log("[CmdFormatConvert.ConvertFreeInitCmd] Data ", data);
    // let jsonData = data["cmd_data"]["data"];
    // let jsonPlayerData = data["cmd_data"]["playerInfo"];
    // let InitData = {
    // 'sg_id': jsonData["C1"],
    // 'sg_state': jsonData["C2"],
    // 'sg_map': jsonData["C3"],
    // };
    // let playerData = {
    // 'playerEntries': jsonPlayerData['P0'],  //playerEntries
    // 'playerTotalWin': jsonPlayerData['P1']   //playerTotalWin
    // };
    // data["cmd_data"]["data"] = InitData;
    // data["cmd_data"]["playerInfo"] = playerData;
    // return data;
  }
  public ConvertFreeGameSpinCmdConvert(_data) {
    // console.log("[CmdFormatConvert.ConvertFreeSpinCmd] Data ", data);
    // let jsonData = data["cmd_data"]["data"];
    // let jsonPlayerData = data["cmd_data"]["playerInfo"];
    // let freeGameSpinData = {
    // 'sg_id': jsonData["C1"],
    // 'sg_state': jsonData["C2"],
    // 'sg_map': jsonData["C3"],
    // 'total_win_amount': jsonData["C4"],
    // "this_win_amount": jsonData["C5"],
    // "win_type": jsonData["C6"],
    // "preview_msg": jsonData["C7"],
    // 'arkID': jsonData["ark_id"],
    // 'leaderBoardInfo': jsonData["leaderBoardInfo"],
    // 'ItemInfo': jsonData["ItemInfo"]
    // };
    // let playerData = {
    // 'playerEntries': jsonPlayerData['P0'],  //playerEntries
    // 'playerTotalWin': jsonPlayerData['P1']   //playerTotalWin
    // };
    // data["cmd_data"]["data"] = freeGameSpinData;
    // data["cmd_data"]["playerInfo"] = playerData;
    // return data;
  }
}

/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import { PlatformGDK } from "../../../CommonModule/Script/Platform/PlatformGDK";
// import HostSetting, { HostSettingInterface } from "../../Define/HostSetting";
// import { SlotGDK } from "../../Define/SlotGDK";
//
// const { ccclass, property } = cc._decorator;
//
// @ccclass
// export default class GDGameServerParser extends cc.Component {
//
//
//     public get CommandName(): HostSettingInterface.CommandName {
//         return HostSetting.Instance.ConnectSetting.Server.CommandName;
//     }
//
//     public onLoad(): void {
//         SlotGDK.Event("ret" + this.CommandName.GetBuyBonusInfo).Insert(this.onGetBuyBonusInfoDataReturn, this);
//         SlotGDK.Event("ret" + this.CommandName.BuyBonusSpin).Insert(this.onBuyBonusSpinDataReturn, this);
//         SlotGDK.Event("ret" + this.CommandName.StartGame).Insert(this.onStartGameDataReturn, this);
//         SlotGDK.Event("ret" + this.CommandName.Spin).Insert(this.onSpinDataReturn, this);
//         SlotGDK.Event("ret" + this.CommandName.SpecialGame).Insert(this.onSpecialGameDataReturn, this);
//     }
//
//     public onDestroy(): void {
//         SlotGDK.Event("ret" + this.CommandName.GetBuyBonusInfo).Remove(this.onGetBuyBonusInfoDataReturn, this);
//         SlotGDK.Event("ret" + this.CommandName.BuyBonusSpin).Remove(this.onBuyBonusSpinDataReturn, this);
//         SlotGDK.Event("ret" + this.CommandName.StartGame).Remove(this.onStartGameDataReturn, this);
//         SlotGDK.Event("ret" + this.CommandName.Spin).Remove(this.onSpinDataReturn, this);
//         SlotGDK.Event("ret" + this.CommandName.SpecialGame).Remove(this.onSpecialGameDataReturn, this);
//     }
//
//     public onGetBuyBonusInfoDataReturn(result: number, data: JSON, callback: Function): void {
//         console.warn("onGetBuyBonusInfoDataReturn", result, data);
//         callback(result, data);
//     }
//
//     public onBuyBonusSpinDataReturn(result: number, data: JSON, callback: Function): void {
//         console.warn("onBuyBonusSpinDataReturn", result, data);
//         callback(result, data);
//     }
//
//     public onStartGameDataReturn(result: number, data: JSON, callback: Function): void {
//         if (!data["cmd_data"] || data["cmd_data"]["result"] !== 0) {
//             let errorCode = "C16-" + (data["cmd_data"].hasOwnProperty && data["cmd_data"]["result"] !== 0) ? data["cmd_data"]["result"] : result;
//             PlatformGDK.instance.CommandErrorHandler.Notify(errorCode);
//             return;
//         }
//         let jsonData = data["cmd_data"]["data"];
//         let jsonPlayerData = data["cmd_data"]["playerInfo"];
//
//         let gameState = {
//             'current_sg_id': jsonData['GS']['GS0'],
//             'recovery_need_start': jsonData['GS']['GS1'],
//             'sg_state': jsonData['GS']['GS2'],
//             'current_line_bet': jsonData['GS']['GS3'],
//             'current_bet': jsonData['GS']['GS3'],
//             'current_lines': jsonData['GS']['GS4'],
//         };
//
//         if (jsonData['GS'].hasOwnProperty('GS5')) {
//             gameState['current_script'] = jsonData['GS']['GS5'];
//         }
//
//         let wheelBlock = [];
//         let wheelLength: number = (jsonData['WB']).length;
//         for (let i = 0; i < wheelLength; i++) {
//             let jsonWheelDatas = jsonData['WB'][i];
//
//             wheelBlock.push({});
//             wheelBlock[i]['id'] = jsonWheelDatas['WB0'];
//             wheelBlock[i]['fake_wheels'] = jsonWheelDatas['WB7'];
//             wheelBlock[i]['init_wheels'] = jsonWheelDatas['WB8'];
//
//             if (jsonWheelDatas.hasOwnProperty["WB3"])
//                 wheelBlock[i]['win_special_symbols'] = jsonWheelDatas['WB3'];
//         }
//
//         let joinGameData = {
//             'ratio': jsonData['A0'],        //ratio
//             'max_lines': jsonData['A1'],        //maxLines
//             'min_lines': jsonData['A2'],        //minLines
//             'max_line_bet': jsonData['A3'],        //maxLineBet
//             'min_line_bet': jsonData['A4'],        //minLineBet
//             'max_balance': jsonData['A5'],        //maxGate
//             'min_balance': jsonData['A6'],        //minGate
//             'line_bet_range': jsonData['A7'],        //lineBetRange
//             'bet_list': jsonData['A7'],        //lineBetRange
//             'lines_range': jsonData['A8'],        //linesRange
//             'jp_bet': jsonData['A9'],       //JPBet
//             'odds': jsonData['A10'],      //oddsTable
//             'special_odds': jsonData['A11'],
//             'total_win_amount': jsonData['A12'],      //total_win_amount
//             'extra_info': jsonData['A13'],      //total_win_amount
//             'enablePreview': jsonData['A14'],
//             'game_state': gameState,             //game_state
//             'wheel_blocks': wheelBlock,        //wheel_blocks
//             'current_line_bet': jsonData['GS']['GS3'],
//
//             'InGameJpName': jsonData['InGameJpName'],
//             'extra_bet': jsonData["extra_bet"]
//         };
//
//         let playerData = {
//             'playerEntries': jsonPlayerData['P0'],  //playerEntries
//             'playerTotalWin': jsonPlayerData['P1']   //playerTotalWin
//         };
//
//         data["cmd_data"]["data"] = joinGameData;
//         data["cmd_data"]["playerInfo"] = playerData;
//
//         callback(result, data);
//     }
//
//     public onSpinDataReturn(result: number, data: JSON, callback: Function): void {
//         if (data["cmd_data"]["result"] !== 0) {
//             let errorCode = "C22-" + (data["cmd_data"].hasOwnProperty && data["cmd_data"]["result"] !== 0) ? data["cmd_data"]["result"] : result;
//             PlatformGDK.instance.CommandErrorHandler.Notify(errorCode);
//             return;
//         }
//         let jsonData = data["cmd_data"]["data"];
//         let jsonPlayerData = data["cmd_data"]["playerInfo"];
//
//         let gameState = {
//             'current_sg_id': jsonData["GS"]["GS0"],
//             'sg_state': jsonData["GS"]["GS2"]
//         };
//
//         if (jsonData["GS"].hasOwnProperty("GS5")) {
//             gameState['current_script'] = jsonData["GS"]["GS5"];
//         }
//
//
//         let wheelLegth: number = (jsonData["WB"]).length;
//         let wheelBlock = [];
//
//         console.warn("length : " + wheelLegth);
//         for (let i = 0; i < wheelLegth; i++) {
//             wheelBlock.push({});
//             let jsonWheelData = jsonData["WB"][i];
//
//             wheelBlock[i]["id"] = jsonWheelData["WB0"];
//             wheelBlock[i]["result_wheels"] = jsonWheelData["WB1"];
//
//             if (jsonWheelData.hasOwnProperty("WB2"))
//                 wheelBlock[i]["feature_wheels"] = jsonWheelData["WB2"];
//
//             if (jsonWheelData.hasOwnProperty("WB3"))
//                 wheelBlock[i]["win_special_symbols"] = jsonWheelData["WB3"];
//
//             if (jsonWheelData.hasOwnProperty("WB4"))
//                 wheelBlock[i]["pre_win_wheels"] = jsonWheelData["WB4"];
//
//             if (jsonWheelData.hasOwnProperty("WB5"))
//                 wheelBlock[i]["bingo"] = jsonWheelData["WB5"];
//
//             if (jsonWheelData.hasOwnProperty("WB6"))
//                 wheelBlock[i]["bingo_type"] = jsonWheelData["WB6"];
//         }
//
//         let spinData = {
//             'cid': jsonData['B0'],
//             'total_win_amount': jsonData['B1'],
//             'this_win_amount': jsonData['B2'],
//             'win_type': jsonData['B3'],
//             'extra_info': jsonData['B4'],
//             'preview_msg': jsonData['B5'],
//             'game_state': gameState,
//             'wheel_blocks': wheelBlock,
//             'eventInfo': jsonData["eventInfo"],
//             'arkID': jsonData["ark_id"],
//             'leaderBoardInfo': jsonData["leaderBoardInfo"],
//             'ItemInfo': jsonData["ItemInfo"]
//         };
//
//         let playerData = {
//             'playerEntries': jsonPlayerData['P0'],  //playerEntries
//             'playerTotalWin': jsonPlayerData['P1']   //playerTotalWin
//         };
//
//         data["cmd_data"]["data"] = spinData;
//         data["cmd_data"]["playerInfo"] = playerData;
//
//         callback(result, data);
//     }
//
//     public onSpecialGameDataReturn(result: number, data: JSON, callback: Function): void {
//         if (data["cmd_data"]["result"] !== 0) {
//             let errorCode = "C24-" + (data["cmd_data"].hasOwnProperty && data["cmd_data"]["result"] !== 0) ? data["cmd_data"]["result"] : result;
//             PlatformGDK.instance.CommandErrorHandler.Notify(errorCode);
//             return;
//         }
//         if (data["cmd_data"]["data"].hasOwnProperty("D0"))
//             data = this.ConvertFreeGameInitCmd(data);
//         else if (data["cmd_data"]["data"].hasOwnProperty("C0"))
//             data = this.ConvertFreeGameSpinCmdConvert(data);
//         callback(result, data);
//     }
//
//
//     public ConvertFreeGameInitCmd(data) {
//         console.log("[CmdFormatConvert.ConvertFreeInitCmd] Data ", data);
//
//         let jsonData = data["cmd_data"]["data"];
//         let jsonPlayerData = data["cmd_data"]["playerInfo"];
//
//         let InitData = {
//             'sg_id': jsonData["C1"],
//             'sg_state': jsonData["C2"],
//             'sg_map': jsonData["C3"],
//         };
//
//         let playerData = {
//             'playerEntries': jsonPlayerData['P0'],  //playerEntries
//             'playerTotalWin': jsonPlayerData['P1']   //playerTotalWin
//         };
//
//         data["cmd_data"]["data"] = InitData;
//         data["cmd_data"]["playerInfo"] = playerData;
//
//         return data;
//     }
//
//     public ConvertFreeGameSpinCmdConvert(data) {
//         console.log("[CmdFormatConvert.ConvertFreeSpinCmd] Data ", data);
//
//         let jsonData = data["cmd_data"]["data"];
//         let jsonPlayerData = data["cmd_data"]["playerInfo"];
//
//         let freeGameSpinData = {
//             'sg_id': jsonData["C1"],
//             'sg_state': jsonData["C2"],
//             'sg_map': jsonData["C3"],
//             'total_win_amount': jsonData["C4"],
//             "this_win_amount": jsonData["C5"],
//             "win_type": jsonData["C6"],
//             "preview_msg": jsonData["C7"],
//             'arkID': jsonData["ark_id"],
//             'leaderBoardInfo': jsonData["leaderBoardInfo"],
//             'ItemInfo': jsonData["ItemInfo"]
//         };
//
//         let playerData = {
//             'playerEntries': jsonPlayerData['P0'],  //playerEntries
//             'playerTotalWin': jsonPlayerData['P1']   //playerTotalWin
//         };
//
//         data["cmd_data"]["data"] = freeGameSpinData;
//         data["cmd_data"]["playerInfo"] = playerData;
//
//         return data;
//     }
// }
