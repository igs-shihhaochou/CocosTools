// import { _decorator, Component, EditBox } from 'cc';
// const { ccclass, property } = _decorator;

// import ArkClient from "../../../CommonModule/Script/Network/ArkSDK/ArkClient";
// import HttpConnect from "../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect";

// @ccclass('CommandTest')
// export default class NewClass extends Component {
//     public arkClient = null;
//     @property(EditBox)
//     gameID: EditBox | null = null;
//     @property(EditBox)
//     serverAddress: EditBox | null = null;
//     @property(EditBox)
//     lineBet: EditBox | null = null;
//     @property(EditBox)
//     trigger: EditBox | null = null;
//     @property(EditBox)
//     sgID: EditBox | null = null;
//     @property(EditBox)
//     extraData: EditBox | null = null;
// //    // LIFE-CYCLE CALLBACKS:
//     onLoad() {

// //        // let sceneLoaderNode: cc.Node = cc.find("SceneLoader");
// //        // sceneLoaderNode.getComponent<SceneLoader>(SceneLoader).LoadingScreenActive(false);
//     }
//     OnClickLogin() {

//         // this._Login();
//     }
//     OnClickStartGame() {

//         // let data = { 'game_id': this.gameID.string };

//         // console.log("Send StartGame data : " + data);
//         // this.arkClient.send_cmd('SlotGame', 'start_game', data, (result, retData) => {

//         // console.log("StartGame Response State : " + result + ", data : " + JSON.stringify(retData));
//         // });
//     }
//     OnClickSpin() {

//         // let data = { 'game_id': this.gameID.string, 'line_bet': this.lineBet.string, 'dev_mode': Number(this.trigger.string), 'balance': 99999 };

//         // console.log("Send Spin data : " + data);
//         // this.arkClient.send_cmd('SlotGame', 'spin', data, (result, retData) => {

//         // console.log("Spin Response State : " + result + ", data : " + JSON.stringify(retData));
//         // });
//     }
//     OnClickNextFever() {

//         // let data = { 'game_id': this.gameID.string, 'sg_id': this.sgID.string, 'data': JSON.parse(this.extraData.string), 'dev_mode': Number(this.trigger.string) };

//         // console.log("Send NextFever data : " + data);
//         // this.arkClient.send_cmd('SlotGame', 'next_fever', data, (result, retData) => {

//         // console.log("NextFever Response State : " + result + ", data : " + JSON.stringify(retData));
//         // });
//     }
//     OnClickDoubleGame() {

//         // let data = { 'game_id': this.gameID.string, 'dev_mode': Number(this.trigger.string), 'balance': 99999, "data": JSON.parse(this.extraData.string) };

//         // console.log("Send DoubleGame data : " + data);
//         // this.arkClient.send_cmd('SlotGame', 'double_game', data, (result, retData) => {

//         // console.log("DoubleGame Response State : " + result + ", data : " + JSON.stringify(retData));
//         // });
//     }
//     _Login() {

//         // this.arkClient = new ArkClient(this.serverAddress.string);
//         // let uuid: string = cc.sys.localStorage.getItem("uuid");
//         // if (uuid == null || uuid.length == 0) {
//         // this.arkClient.get_uuid(this._onGetUUID.bind(this));
//         // } else {
//         // console.log("device_login");

//         // this.arkClient.device_login(
//         // 'webgl',
//         // uuid,
//         // this._onLoginCallback.bind(this),
//         // this._getLoginExtraData(),
//         // this._getLoginExtraData());

//         // return;
//         // }
//     }
//     private _getLoginExtraData() {
//         // var extra_data = {};
// //        // extra_data['browser'] = gUserAgent.getResult()["browser"]["name"];
// //        // extra_data['browser_version'] = gUserAgent.getResult()["browser"]["version"];
// //        // extra_data['os'] = gUserAgent.getResult()["os"]["name"];
// //        // extra_data['os_version'] = gUserAgent.getResult()["os"]["version"];
// //        // extra_data['os'] = cc.sys.os;
// //        // extra_data['language'] = GameData.Instance.lang;
// //        // extra_data['osMainVersion'] = cc.sys.osMainVersion;
// //        // extra_data['osVersion'] = cc.sys.osVersion;
// //        // extra_data['platform'] = cc.sys.platform;

// //        // extra_data['isBrowser'] = cc.sys.isBrowser;
// //        // extra_data['isMobile'] = cc.sys.isMobile;
// //        // extra_data['isNative'] = cc.sys.isNative;
// //        // extra_data['api_game_id'] = GameData.Instance.apiGameId;
//         // return extra_data;
//     }
//     private _onGetUUID(result, data) {
//         // if (result == HttpConnect.HttpResult.OK) {
//         // cc.sys.localStorage.setItem("uuid", data);
//         // this._Login();
//         // } else {
// //            ////當作login失敗處理
//         // this._onLoginCallback(result, data);
//         // }
//     }
//     private _onLoginCallback(result, retData) {

//         // console.log("loginFinish Response State : " + result + ", data : " + JSON.stringify(retData));
//     }
// //    // start () {
// //    // }
// //    // update (dt) {}
// }

// /**
//  * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
//  */
// // import ArkClient from "../../../CommonModule/Script/Network/ArkSDK/ArkClient";
// // import HttpConnect from "../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect";
// //
// // const { ccclass, property } = cc._decorator;
// //
// // @ccclass
// // export default class NewClass extends cc.Component {
// //
// //     public arkClient = null;
// //
// //     @property(cc.EditBox)
// //     gameID: cc.EditBox = null;
// //
// //     @property(cc.EditBox)
// //     serverAddress: cc.EditBox = null;
// //
// //     @property(cc.EditBox)
// //     lineBet: cc.EditBox = null;
// //
// //     @property(cc.EditBox)
// //     trigger: cc.EditBox = null;
// //
// //     @property(cc.EditBox)
// //     sgID: cc.EditBox = null;
// //
// //     @property(cc.EditBox)
// //     extraData: cc.EditBox = null;
// //
// //     // LIFE-CYCLE CALLBACKS:
// //
// //     onLoad() {
// //
// //         // let sceneLoaderNode: cc.Node = cc.find("SceneLoader");
// //         // sceneLoaderNode.getComponent<SceneLoader>(SceneLoader).LoadingScreenActive(false);
// //     }
// //
// //     OnClickLogin() {
// //
// //         this._Login();
// //     }
// //
// //     OnClickStartGame() {
// //
// //         let data = { 'game_id': this.gameID.string };
// //
// //         console.log("Send StartGame data : " + data);
// //         this.arkClient.send_cmd('SlotGame', 'start_game', data, (result, retData) => {
// //
// //
// //             console.log("StartGame Response State : " + result + ", data : " + JSON.stringify(retData));
// //         });
// //     }
// //
// //     OnClickSpin() {
// //
// //         let data = { 'game_id': this.gameID.string, 'line_bet': this.lineBet.string, 'dev_mode': Number(this.trigger.string), 'balance': 99999 };
// //
// //         console.log("Send Spin data : " + data);
// //         this.arkClient.send_cmd('SlotGame', 'spin', data, (result, retData) => {
// //
// //             console.log("Spin Response State : " + result + ", data : " + JSON.stringify(retData));
// //         });
// //     }
// //
// //     OnClickNextFever() {
// //
// //         let data = { 'game_id': this.gameID.string, 'sg_id': this.sgID.string, 'data': JSON.parse(this.extraData.string), 'dev_mode': Number(this.trigger.string) };
// //
// //         console.log("Send NextFever data : " + data);
// //         this.arkClient.send_cmd('SlotGame', 'next_fever', data, (result, retData) => {
// //
// //             console.log("NextFever Response State : " + result + ", data : " + JSON.stringify(retData));
// //         });
// //     }
// //
// //     OnClickDoubleGame() {
// //
// //         let data = { 'game_id': this.gameID.string, 'dev_mode': Number(this.trigger.string), 'balance': 99999, "data": JSON.parse(this.extraData.string) };
// //
// //         console.log("Send DoubleGame data : " + data);
// //         this.arkClient.send_cmd('SlotGame', 'double_game', data, (result, retData) => {
// //
// //             console.log("DoubleGame Response State : " + result + ", data : " + JSON.stringify(retData));
// //         });
// //     }
// //
// //     _Login() {
// //
// //         this.arkClient = new ArkClient(this.serverAddress.string);
// //         let uuid: string = cc.sys.localStorage.getItem("uuid");
// //         if (uuid == null || uuid.length == 0) {
// //             this.arkClient.get_uuid(this._onGetUUID.bind(this));
// //         } else {
// //             console.log("device_login");
// //
// //             this.arkClient.device_login(
// //                 'webgl',
// //                 uuid,
// //                 this._onLoginCallback.bind(this),
// //                 this._getLoginExtraData(),
// //                 this._getLoginExtraData());
// //
// //             return;
// //         }
// //     }
// //
// //     private _getLoginExtraData() {
// //         var extra_data = {};
// //         // extra_data['browser'] = gUserAgent.getResult()["browser"]["name"];
// //         // extra_data['browser_version'] = gUserAgent.getResult()["browser"]["version"];
// //         // extra_data['os'] = gUserAgent.getResult()["os"]["name"];
// //         // extra_data['os_version'] = gUserAgent.getResult()["os"]["version"];
// //         // extra_data['os'] = cc.sys.os;
// //         // extra_data['language'] = GameData.Instance.lang;
// //         // extra_data['osMainVersion'] = cc.sys.osMainVersion;
// //         // extra_data['osVersion'] = cc.sys.osVersion;
// //         // extra_data['platform'] = cc.sys.platform;
// //
// //         // extra_data['isBrowser'] = cc.sys.isBrowser;
// //         // extra_data['isMobile'] = cc.sys.isMobile;
// //         // extra_data['isNative'] = cc.sys.isNative;
// //         // extra_data['api_game_id'] = GameData.Instance.apiGameId;
// //         return extra_data;
// //     }
// //
// //     private _onGetUUID(result, data) {
// //         if (result == HttpConnect.HttpResult.OK) {
// //             cc.sys.localStorage.setItem("uuid", data);
// //             this._Login();
// //         } else {
// //             ////當作login失敗處理
// //             this._onLoginCallback(result, data);
// //         }
// //     }
// //
// //     private _onLoginCallback(result, retData) {
// //
// //         console.log("loginFinish Response State : " + result + ", data : " + JSON.stringify(retData));
// //     }
// //
// //
// //
// //     // start () {
// //
// //     // }
// //
// //     // update (dt) {}
// // }
