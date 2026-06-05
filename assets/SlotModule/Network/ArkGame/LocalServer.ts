import {JsonAsset, log} from 'cc';
import HttpConnect from '../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
class ServerBaseSystem {
  private server: LocalServer = null;
  private systemName = '';
  private cmdDict: Object = {};
  constructor(_server: LocalServer, _systemName: string) {
    this.server = _server;
    this.systemName = _systemName;
    _server.systemDict[_systemName] = this;
    console.log('system_' + _systemName + ' init!');
  }
  public RegisterCmd(
    cmdName: string,
    func: (ark_id: string, cmd_data: JSON) => void
  ) {
    this.cmdDict[cmdName] = func;
  }
}
class Calculator {
  public start_game = [];
  public main_game = [];
  public fever_game = [];
  private fever_game_index = 0;
  public get_start_game() {
    const index = this.randomInt(0, this.start_game.length);
    return this.start_game[index];
  }
  public get_main_game() {
    const index = this.randomInt(0, this.main_game.length);
    return this.main_game[index];
  }
  public get_fever_game() {
    this.fever_game_index += 1;
    if (this.fever_game_index >= this.fever_game.length)
      this.fever_game_index = 0;
    return this.fever_game[this.fever_game_index];
  }
  private randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
const enum GameCmd {
  START_GAME,
  SPIN,
  NEXT_FEVER,
}
class _ServerSlotSystem extends ServerBaseSystem {
  private game_info: JSON = null;
  private calculator_manager: Object = {};
  constructor(server: LocalServer, systemName = 'slot') {
    super(server, systemName);
    this.RegisterCmd(
      String(GameCmd.START_GAME),
      this.cmd_start_game.bind(this)
    );
    this.RegisterCmd(String(GameCmd.SPIN), this.cmd_spin.bind(this));
    this.RegisterCmd(
      String(GameCmd.NEXT_FEVER),
      this.cmd_next_fever.bind(this)
    );
  }
  private async init_game_info() {
    await this.__read_game_info();
    for (const game_id in this.game_info) {
      const game_info = this.game_info[game_id];
      const calculator = new Calculator();
      let option = 'start_game';
      if (game_info.hasOwnProperty(option) && game_info[option] !== '') {
        const file_path = game_info[option];
        await this.__read_game_data(file_path, calculator.start_game);
      }
      option = 'main_game';
      if (game_info.hasOwnProperty(option) && game_info[option] !== '') {
        const file_path = game_info[option];
        await this.__read_game_data(file_path, calculator.main_game);
      }
      option = 'fever_game';
      if (game_info.hasOwnProperty(option) && game_info[option] !== '') {
        const file_path = game_info[option];
        await this.__read_game_data(file_path, calculator.fever_game);
      }
      this.calculator_manager[game_id] = calculator;
    }
  }
  private async cmd_start_game(ark_id: string, cmd_data: JSON) {
    const game_id = cmd_data['game_id'];
    if (this.calculator_manager.hasOwnProperty(game_id)) {
      const calculator = this.calculator_manager[game_id];
      return {
        result: HttpConnect.HttpResult.OK,
        data: calculator.get_start_game(),
      };
    }
  }
  private cmd_spin(ark_id: string, cmd_data: JSON) {
    const game_id = cmd_data['game_id'];
    if (this.calculator_manager.hasOwnProperty(game_id)) {
      const calculator = this.calculator_manager[game_id];
      return {
        result: HttpConnect.HttpResult.OK,
        data: calculator.get_main_game(),
      };
    }
  }
  private cmd_next_fever(ark_id: string, cmd_data: JSON) {
    const game_id = cmd_data['game_id'];
    if (this.calculator_manager.hasOwnProperty(game_id)) {
      const calculator = this.calculator_manager[game_id];
      return {
        result: HttpConnect.HttpResult.OK,
        data: calculator.get_fever_game(),
      };
    }
  }
  private async __read_game_info() {
    const url = '/config/normal_game_info';
    await new Promise(function (resolve, _reject) {
      cc.resources.load(url, JsonAsset, null, (err: Error, res: JsonAsset) => {
        if (err) {
          log('Error url [' + url + ']:', err);
          return;
        }
        this.game_info = res.json;
        resolve(null);
      });
    });
  }
  private async __read_game_data(
    file_path: Array<string>,
    game_data: Array<JSON>
  ) {
    const url = '/script/' + file_path;
    await new Promise((resolve, _reject) => {
      cc.resources.load(url, JsonAsset, null, (err: Error, res: JsonAsset) => {
        if (err) {
          log('Error url [' + url + ']:', err);
          return;
        }
        resolve(res.json);
      });
    }).then((result: JSON) => {
      result['data'].forEach(element => {
        game_data.push(element);
      });
    });
  }
}

export default class LocalServer {
  public static get Instance(): LocalServer {
    // return this.instance || (this.instance = new LocalServer());
  }
  private static instance: LocalServer = null;
  public systemDict = {};
  private static slotSystem;
  constructor() {
    // LocalServer.slotSystem = new ServerSlotSystem(this);
  }
  private static async Init() {
    // this.instance = new LocalServer();
    // await LocalServer.slotSystem.init_game_info();
  }
  public async Command(
    _systemName: string,
    _cmdName: string,
    _cmdData,
    _callback: (result: number, cmd_data: {}) => void
  ) {
    // if (!this.systemDict.hasOwnProperty(systemName)) {
    // console.warn("system_" + systemName + " not register in server");
    // return;
    // }
    // let system = this.systemDict[systemName];
    // if (!system.cmdDict.hasOwnProperty(cmdName)) {
    // console.warn("cmd_" + cmdName + " not register in system_" + systemName);
    // return;
    // }
    // let func = system.cmdDict[cmdName];
    // let retult = await func("10000001", cmdData);
    // let data = {
    // "cmd_sn": "",
    // "cmd_data": retult,
    // };
    // callback(HttpConnect.HttpResult.OK, data);
  }
}

/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import HttpConnect from "../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect";
//
//
// export default class LocalServer {
//
//     public static get Instance(): LocalServer {
//         return this.instance || (this.instance = new LocalServer());
//     }
//     private static instance: LocalServer = null;
//
//     public systemDict = {};
//     private static slotSystem;
//
//     constructor() {
//         LocalServer.slotSystem = new ServerSlotSystem(this);
//     }
//
//     private static async Init() {
//         this.instance = new LocalServer();
//
//         await LocalServer.slotSystem.init_game_info();
//     }
//
//     public async Command(systemName: string, cmdName: string, cmdData, callback: (result: number, cmd_data: {}) => void) {
//         if (!this.systemDict.hasOwnProperty(systemName)) {
//             console.warn("system_" + systemName + " not register in server");
//             return;
//         }
//
//         let system = this.systemDict[systemName];
//
//         if (!system.cmdDict.hasOwnProperty(cmdName)) {
//             console.warn("cmd_" + cmdName + " not register in system_" + systemName);
//             return;
//         }
//
//         let func = system.cmdDict[cmdName];
//         let retult = await func("10000001", cmdData);
//
//         let data = {
//             "cmd_sn": "",
//             "cmd_data": retult,
//         };
//
//         callback(HttpConnect.HttpResult.OK, data);
//     }
// }
//
// class ServerBaseSystem {
//     private server: LocalServer = null;
//     private systemName: string = "";
//     private cmdDict: Object = {};
//
//     constructor(_server: LocalServer, _systemName: string) {
//         this.server = _server;
//         this.systemName = _systemName;
//
//         _server.systemDict[_systemName] = this;
//
//         console.log("system_" + _systemName + " init!");
//     }
//
//     public RegisterCmd(cmdName: string, func: (ark_id: string, cmd_data: JSON) => void) {
//         this.cmdDict[cmdName] = func;
//     }
// }
//
// class Calculator {
//
//     public start_game = [];
//     public main_game = [];
//     public fever_game = [];
//
//     private fever_game_index = 0;
//
//     public get_start_game() {
//         let index = this.randomInt(0, this.start_game.length);
//         return this.start_game[index];
//     }
//
//     public get_main_game() {
//         let index = this.randomInt(0, this.main_game.length);
//         return this.main_game[index];
//     }
//
//     public get_fever_game() {
//
//         this.fever_game_index += 1;
//         if (this.fever_game_index >= this.fever_game.length)
//             this.fever_game_index = 0;
//
//         return this.fever_game[this.fever_game_index];
//     }
//
//     private randomInt(min, max) {
//         return Math.floor(Math.random() * (max - min)) + min;
//     }
// }
//
// const enum GameCmd {
//     START_GAME,
//     SPIN,
//     NEXT_FEVER
// }
//
// class ServerSlotSystem extends ServerBaseSystem {
//
//     private game_info: JSON = null;
//
//     private calculator_manager: Object = {};
//
//     constructor(server: LocalServer, systemName: string = "slot") {
//         super(server, systemName);
//
//         this.RegisterCmd(String(GameCmd.START_GAME), this.cmd_start_game.bind(this));
//         this.RegisterCmd(String(GameCmd.SPIN), this.cmd_spin.bind(this));
//         this.RegisterCmd(String(GameCmd.NEXT_FEVER), this.cmd_next_fever.bind(this));
//     }
//
//     private async init_game_info() {
//         await this.__read_game_info();
//
//         for (let game_id in this.game_info) {
//             let game_info = this.game_info[game_id];
//             let calculator = new Calculator();
//
//             let option = "start_game";
//             if (game_info.hasOwnProperty(option) && game_info[option] != "") {
//                 let file_path = game_info[option];
//                 await this.__read_game_data(file_path, calculator.start_game);
//             }
//
//             option = "main_game";
//             if (game_info.hasOwnProperty(option) && game_info[option] != "") {
//                 let file_path = game_info[option];
//                 await this.__read_game_data(file_path, calculator.main_game);
//             }
//
//             option = "fever_game";
//             if (game_info.hasOwnProperty(option) && game_info[option] != "") {
//                 let file_path = game_info[option];
//                 await this.__read_game_data(file_path, calculator.fever_game);
//             }
//
//             this.calculator_manager[game_id] = calculator;
//         }
//     }
//
//     private async cmd_start_game(ark_id: string, cmd_data: JSON) {
//
//         let game_id = cmd_data["game_id"];
//         if (this.calculator_manager.hasOwnProperty(game_id)) {
//             let calculator = this.calculator_manager[game_id];
//             return { "result": HttpConnect.HttpResult.OK, "data": calculator.get_start_game() };
//         }
//     }
//
//     private cmd_spin(ark_id: string, cmd_data: JSON) {
//         let game_id = cmd_data["game_id"];
//         if (this.calculator_manager.hasOwnProperty(game_id)) {
//             let calculator = this.calculator_manager[game_id];
//             return { "result": HttpConnect.HttpResult.OK, "data": calculator.get_main_game() };
//         }
//     }
//
//     private cmd_next_fever(ark_id: string, cmd_data: JSON) {
//         let game_id = cmd_data["game_id"];
//         if (this.calculator_manager.hasOwnProperty(game_id)) {
//             let calculator = this.calculator_manager[game_id];
//             return { "result": HttpConnect.HttpResult.OK, "data": calculator.get_fever_game() };
//         }
//     }
//
//     private async __read_game_info() {
//         let url = "/config/normal_game_info";
//         await new Promise(function (resolve, reject) {
//             cc.resources.load(url, cc.JsonAsset, null, (err: Error, res: cc.JsonAsset) => {
//                 if (err) {
//                     console.log("Error url [" + url + "]:", err);
//                     return;
//                 }
//                 this.game_info = res.json;
//                 resolve(null);
//             });
//         });
//     }
//
//     private async __read_game_data(file_path: Array<string>, game_data: Array<JSON>) {
//         let url = "/script/" + file_path;
//         await new Promise(function (resolve, reject) {
//             cc.resources.load(url, cc.JsonAsset, null, (err: Error, res: cc.JsonAsset) => {
//                 if (err) {
//                     console.log("Error url [" + url + "]:", err);
//                     return;
//                 }
//                 resolve(res.json);
//             });
//         }).then((result: JSON) => {
//             result["data"].forEach(element => {
//                 game_data.push(element);
//             });
//         });
//     }
// }
