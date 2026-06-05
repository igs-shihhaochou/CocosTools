import {_decorator} from 'cc';
const {ccclass, property} = _decorator;

import {SpecialGameState} from '../../Define/SlotGameData';
import {SpecialGameBase} from '../../SpecialGame/SpecialGameBase';
import {WheelBlockController} from '../../Wheel/WheelBlockController';

@ccclass('G01FeverGame')
export class G01_FeverGame_ extends SpecialGameBase {
  private canPressSpaceflag = false;
  private specialGameState: SpecialGameState = SpecialGameState.NO_SG;
  //    ///宣告WheelBlockController
  @property(WheelBlockController)
  private wheelBlockController: WheelBlockController = null;
  //    ///(必須要Override)進入免費遊戲的第一個時間點 *開始免費遊戲後自動進入
  //    ///這裡拆解current_script資料
  public EnterSpecialGameOpening(_jsonData: JSON) {
    // console.log("進入免費遊戲");
    //        ///註冊停輪事件
    // this.wheelBlockController.Event_Finished.Insert(this.AllWheelStopped, this);
    // this.IsExecuting = true;    ///EnterSpecialGameOpening和Recovery一定要把該Flag設成true
    // SlotGameMediator.instance.awardController.Reset();
    // let sgmapJson = null;
    // if (jsonData != null && jsonData.hasOwnProperty("sg_map")) {
    // jsonData["sg_map"]; ///先拆一層sg_map
    // }
    // if (sgmapJson != null) {
    //            ///印出封包的範例，抓0~20的key，如果有Key就印出來
    // for (let i: number = 0; i < 20; i++) {
    // if (sgmapJson.hasOwnProperty(i.toString())) { ///判斷封包存不存在
    // console.log("key[ " + i + " ] = " + sgmapJson[i]);   ///拆封包印Log
    // }
    // }
    // }
    //        ///部分遊戲的current_script資料沒有包sg_map
    // if (sgmapJson == null && jsonData != null) {
    //            ///印出封包的範例，抓0~20的key，如果有Key就印出來
    // for (let i: number = 0; i < 20; i++) {
    // if (jsonData.hasOwnProperty(i.toString())) { ///判斷封包存不存在
    // console.log("key[ " + i + " ] = " + jsonData[i]);   ///拆封包印Log
    // }
    // }
    // }
    // this.SendFeverCommand(null);
  }
  //    ///(必須要Override) 狀態復原 *如果Server給的資料發現需要狀態復原，就會變成免費遊戲進入的第一個時間點，而不會進入EnterSpecialGameOpening
  //    ///這裡拆解狀態復原的current_script資料
  public Recovery(_jsonData: JSON): void {
    // console.log("進入免費遊戲");
    //        ///註冊停輪事件
    // this.wheelBlockController.Event_Finished.Insert(this.AllWheelStopped, this);
    // this.IsExecuting = true;    ///EnterSpecialGameOpening和Recovery一定要把該Flag設成true
    // let sgmapJson = null;
    // if (jsonData != null && jsonData.hasOwnProperty("sg_map")) {
    // jsonData["sg_map"]; ///先拆一層sg_map
    // }
    // if (sgmapJson != null) {
    //            ///印出封包的範例，抓0~20的key，如果有Key就印出來
    // for (let i: number = 0; i < 20; i++) {
    // if (sgmapJson.hasOwnProperty(i.toString())) { ///判斷封包存不存在
    // console.log("key[ " + i + " ] = " + sgmapJson[i]);   ///拆封包印Log
    // }
    // }
    // }
    //        ///部分遊戲的current_script資料沒有包sg_map
    // if (sgmapJson == null && jsonData != null) {
    //            ///印出封包的範例，抓0~20的key，如果有Key就印出來
    // for (let i: number = 0; i < 20; i++) {
    // if (jsonData.hasOwnProperty(i.toString())) { ///判斷封包存不存在
    // console.log("key[ " + i + " ] = " + jsonData[i]);   ///拆封包印Log
    // }
    // }
    // }
    // this.scheduleOnce(this.OpeningFinish, 1);///等待一秒，當作是轉場完畢
  }
  //    ///客製化轉場
  private OpeningFinish() {
    // this.FinishEnterGameOpening();  ///轉場完後Call FinishEnterGameOpening進入DoProcess
  }
  //    ///(必須要Override)接收封包，根據封包State做分類 *接收到封包後自動進入
  public GetRequest(_jsonData: JSON) {
    // this.specialGameState = jsonData["sg_state"];
    // let state: string = "";
    // if (this.specialGameState == SpecialGameState.INIT) {
    // state = "INIT";
    // } else if (this.specialGameState == SpecialGameState.PROCESS) {
    // state = "PROCESS";
    // } else if (this.specialGameState == SpecialGameState.END) {
    // state = "END";
    // }
    // console.log("sg_state : " + state);
    //        ///判斷免費遊戲的狀態 0.沒有免費遊戲 1.初始化 2.一般流程 3.狀態復原 4.結束
    // switch (this.specialGameState) {
    // case SpecialGameState.INIT:
    // this.ReceiveInitData(jsonData);
    // break;
    // case SpecialGameState.PROCESS:
    // case SpecialGameState.END:
    // this.ReceiveProcessData(jsonData);
    // break;
    // }
  }
  //    ///客製化處理初始化資料
  //    ///這裡處理INIT(初始化)的資料
  private ReceiveInitData(_jsonData: JSON) {
    // let sgmapJson = jsonData["sg_map"]; ///先拆一層sg_map
    // if (sgmapJson != null) {
    //            ///印出封包的範例，抓0~20的key，如果有Key就印出來
    // for (let i: number = 0; i < 20; i++) {
    // if (sgmapJson.hasOwnProperty(i.toString())) { ///判斷封包存不存在
    // console.log("key[ " + i + " ] = " + sgmapJson[i]);   ///拆封包印Log
    // }
    // }
    // }
    // this.scheduleOnce(this.OpeningFinish, 1);///等待一秒，當作是轉場完畢
  }
  //    ///客製化接收一般流程&結束的資料
  //    ///這裡處理PROCESS(一般流程)和END(結束)的資料
  private ReceiveProcessData(_jsonData: JSON) {
    // let sgmapJson = jsonData["sg_map"]; ///先拆一層sg_map
    // if (sgmapJson != null) {
    //            ///印出封包的範例，抓0~20的key，如果有Key就印出來
    // for (let i: number = 0; i < 20; i++) {
    // if (sgmapJson.hasOwnProperty(i.toString())) { ///判斷封包存不存在
    // console.log("key[ " + i + " ] = " + sgmapJson[i]);   ///拆封包印Log
    // }
    // }
    // }
    //        ///收到Server資料後，將資料塞進去再停輪
    // let wheelBlockResultArgs: WheelBlockResultArgs = new WheelBlockResultArgs().Parse(sgmapJson["3"]);
    // this.wheelBlockController.SpinRequest(wheelBlockResultArgs);
    // this.wheelBlockController.StopAll();
    // let winType: WinType = jsonData["win_type"];       ///報獎效果的狀態，用於區分BigWin、MegaWin、SuperWin....
    // let thisWin: number = jsonData["this_win_amount"]; ///這一手的贏分
    // let totalWin: number = jsonData["total_win_amount"];///免費遊戲到目前為止累積的贏分
    // console.log("key[ win_type ] = " + winType);
    // console.log("key[ this_win_amount ] = " + thisWin);
    // console.log("key[ total_win_amount ] = " + totalWin);
    // SlotGameMediator.instance.awardController.Init_Customized(thisWin, totalWin, winType, null, null);  ///塞入報獎的資訊(參考G01鳳凰傳說)
  }
  //    ///(必須要Override)
  //    ///SPIN後，做以下兩件事情後就可以進入轉輪模組報獎流程
  //    ///SlotGameMediator.instance.awardController.Init_Customized();     ///塞入報獎的資訊(參考G01鳳凰傳說)
  //    ///this.FinishedToShowAward ();     ///塞完資料後只要Call這個Function就會進入報獎
  //    ///報獎完會進入該流程，若是不需要報獎的免費遊戲Function內不需要做事情，只要public DoAfterShowAward(){}就好 *Call FinishedToShowAward報獎後，自動進入
  public DoAfterShowAward() {
    // SlotGameMediator.instance.awardController.Reset();       ///進來後先清掉兌獎資料，沒有主動清掉兌獎的資訊會殘留著，下一手在報獎會報一樣的
    //        ///報獎後判斷現在的狀態是不是結束了
    // if (this.specialGameState != SpecialGameState.END) {
    // this.FinishedDoAfterProcess(); ///報獎後的流程跑完後，Call這個Function進入DoProcess
    // }
    // else {
    //            ///解註冊停輪事件
    // this.wheelBlockController.Event_Finished.Remove(this.AllWheelStopped, this);
    // this.FinishSpecialGame(0);  ///離開免費遊戲流程，回到MainGame
    // console.log("免費遊戲結束，回到MainGame");
    // console.log("-----------------------------------------------------");
    // }
  }
  public AllWheelStopped() {
    // console.warn("Wheel Stoppppppppp");
    // this.FinishedToShowAward();    ///塞完資料後只要Call這個Function就會進入報獎
  }
  //    //(必須要Override)主流程的處理 *Call了FinishEnterGameOpening或是FinishedDoAfterProcess後都會進入
  public DoProcess(): void {
    //        ///轉動功能
    // this.wheelBlockController.SpinAll(GamePlayMode.SpecialGame);
    // console.log("按下空白鍵繼續下一手");
    // console.log("-----------------------------------------------------");
    // this.canPressSpaceflag = true;
  }
  //    ///Test
  //    // public start (){
  //    //     if (CC_DEBUG) {
  //    //         cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
  //    //     }
  //    // }
  //    // private onKeyDown(event: cc.Event.EventKeyboard) {
  //    //     if((event as any).keyCode == cc.KEY.space && this.canPressSpaceflag) {
  //    //         this.canPressSpaceflag = false;
  //    //         this.SendFeverCommand(null);    ///SendCommand給Server，Server回傳後進入GetRequest
  //    //         // this.CreateAddFreeSpinEffect(cc.v2(100, 100), cc.v2(1000, 500), 0.5, this.TestCallback, this);
  //    //     }
  //    // }
}

/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import { GamePlayMode, SpecialGameState, WheelBlockResultArgs, WinType } from "../../Define/SlotGameData";
// import { SlotGameMediator } from "../../Define/SlotGameMediator";
// import { SpecialGameBase } from "../../SpecialGame/SpecialGameBase";
// import { WheelBlockController } from "../../Wheel/WheelBlockController";
//
//
// const { ccclass, property } = cc._decorator;
//
// @ccclass
// export class G01_FeverGame_ extends SpecialGameBase {
//
//     private canPressSpaceflag = false;
//
//     private specialGameState: SpecialGameState = SpecialGameState.NO_SG;
//
//     ///宣告WheelBlockController
//     @property(WheelBlockController)
//     private wheelBlockController: WheelBlockController = null;
//
//     ///(必須要Override)進入免費遊戲的第一個時間點 *開始免費遊戲後自動進入
//     ///這裡拆解current_script資料
//     public EnterSpecialGameOpening(jsonData: JSON) {
//
//         console.log("進入免費遊戲");
//
//         ///註冊停輪事件
//         this.wheelBlockController.Event_Finished.Insert(this.AllWheelStopped, this);
//
//
//         this.IsExecuting = true;    ///EnterSpecialGameOpening和Recovery一定要把該Flag設成true
//         SlotGameMediator.instance.awardController.Reset();
//
//         let sgmapJson = null;
//
//         if (jsonData != null && jsonData.hasOwnProperty("sg_map")) {
//
//             jsonData["sg_map"]; ///先拆一層sg_map
//         }
//
//         if (sgmapJson != null) {
//
//             ///印出封包的範例，抓0~20的key，如果有Key就印出來
//             for (let i: number = 0; i < 20; i++) {
//
//                 if (sgmapJson.hasOwnProperty(i.toString())) { ///判斷封包存不存在
//
//                     console.log("key[ " + i + " ] = " + sgmapJson[i]);   ///拆封包印Log
//                 }
//             }
//         }
//
//         ///部分遊戲的current_script資料沒有包sg_map
//         if (sgmapJson == null && jsonData != null) {
//
//             ///印出封包的範例，抓0~20的key，如果有Key就印出來
//             for (let i: number = 0; i < 20; i++) {
//
//                 if (jsonData.hasOwnProperty(i.toString())) { ///判斷封包存不存在
//
//                     console.log("key[ " + i + " ] = " + jsonData[i]);   ///拆封包印Log
//                 }
//             }
//         }
//
//         this.SendFeverCommand(null);
//     }
//
//     ///(必須要Override) 狀態復原 *如果Server給的資料發現需要狀態復原，就會變成免費遊戲進入的第一個時間點，而不會進入EnterSpecialGameOpening
//     ///這裡拆解狀態復原的current_script資料
//     public Recovery(jsonData: JSON): void {
//
//         console.log("進入免費遊戲");
//
//         ///註冊停輪事件
//         this.wheelBlockController.Event_Finished.Insert(this.AllWheelStopped, this);
//
//
//         this.IsExecuting = true;    ///EnterSpecialGameOpening和Recovery一定要把該Flag設成true
//         let sgmapJson = null;
//
//         if (jsonData != null && jsonData.hasOwnProperty("sg_map")) {
//             jsonData["sg_map"]; ///先拆一層sg_map
//         }
//
//         if (sgmapJson != null) {
//
//             ///印出封包的範例，抓0~20的key，如果有Key就印出來
//             for (let i: number = 0; i < 20; i++) {
//
//                 if (sgmapJson.hasOwnProperty(i.toString())) { ///判斷封包存不存在
//
//                     console.log("key[ " + i + " ] = " + sgmapJson[i]);   ///拆封包印Log
//                 }
//             }
//         }
//
//         ///部分遊戲的current_script資料沒有包sg_map
//         if (sgmapJson == null && jsonData != null) {
//
//             ///印出封包的範例，抓0~20的key，如果有Key就印出來
//             for (let i: number = 0; i < 20; i++) {
//
//                 if (jsonData.hasOwnProperty(i.toString())) { ///判斷封包存不存在
//
//                     console.log("key[ " + i + " ] = " + jsonData[i]);   ///拆封包印Log
//                 }
//             }
//         }
//
//         this.scheduleOnce(this.OpeningFinish, 1);///等待一秒，當作是轉場完畢
//     }
//
//     ///客製化轉場
//     private OpeningFinish() {
//
//         this.FinishEnterGameOpening();  ///轉場完後Call FinishEnterGameOpening進入DoProcess
//     }
//
//     ///(必須要Override)接收封包，根據封包State做分類 *接收到封包後自動進入
//     public GetRequest(jsonData: JSON) {
//
//         this.specialGameState = jsonData["sg_state"];
//
//         let state: string = "";
//         if (this.specialGameState == SpecialGameState.INIT) {
//
//             state = "INIT";
//         } else if (this.specialGameState == SpecialGameState.PROCESS) {
//
//             state = "PROCESS";
//         } else if (this.specialGameState == SpecialGameState.END) {
//
//             state = "END";
//         }
//
//         console.log("sg_state : " + state);
//
//         ///判斷免費遊戲的狀態 0.沒有免費遊戲 1.初始化 2.一般流程 3.狀態復原 4.結束
//         switch (this.specialGameState) {
//
//             case SpecialGameState.INIT:
//                 this.ReceiveInitData(jsonData);
//                 break;
//
//             case SpecialGameState.PROCESS:
//             case SpecialGameState.END:
//                 this.ReceiveProcessData(jsonData);
//                 break;
//         }
//     }
//
//     ///客製化處理初始化資料
//     ///這裡處理INIT(初始化)的資料
//     private ReceiveInitData(jsonData: JSON) {
//
//         let sgmapJson = jsonData["sg_map"]; ///先拆一層sg_map
//
//         if (sgmapJson != null) {
//
//             ///印出封包的範例，抓0~20的key，如果有Key就印出來
//             for (let i: number = 0; i < 20; i++) {
//
//                 if (sgmapJson.hasOwnProperty(i.toString())) { ///判斷封包存不存在
//
//                     console.log("key[ " + i + " ] = " + sgmapJson[i]);   ///拆封包印Log
//                 }
//             }
//         }
//
//         this.scheduleOnce(this.OpeningFinish, 1);///等待一秒，當作是轉場完畢
//     }
//
//     ///客製化接收一般流程&結束的資料
//     ///這裡處理PROCESS(一般流程)和END(結束)的資料
//     private ReceiveProcessData(jsonData: JSON) {
//
//         let sgmapJson = jsonData["sg_map"]; ///先拆一層sg_map
//
//         if (sgmapJson != null) {
//
//             ///印出封包的範例，抓0~20的key，如果有Key就印出來
//             for (let i: number = 0; i < 20; i++) {
//
//                 if (sgmapJson.hasOwnProperty(i.toString())) { ///判斷封包存不存在
//
//                     console.log("key[ " + i + " ] = " + sgmapJson[i]);   ///拆封包印Log
//                 }
//             }
//         }
//
//         ///收到Server資料後，將資料塞進去再停輪
//         let wheelBlockResultArgs: WheelBlockResultArgs = new WheelBlockResultArgs().Parse(sgmapJson["3"]);
//         this.wheelBlockController.SpinRequest(wheelBlockResultArgs);
//         this.wheelBlockController.StopAll();
//
//
//         let winType: WinType = jsonData["win_type"];       ///報獎效果的狀態，用於區分BigWin、MegaWin、SuperWin....
//         let thisWin: number = jsonData["this_win_amount"]; ///這一手的贏分
//         let totalWin: number = jsonData["total_win_amount"];///免費遊戲到目前為止累積的贏分
//
//         console.log("key[ win_type ] = " + winType);
//         console.log("key[ this_win_amount ] = " + thisWin);
//         console.log("key[ total_win_amount ] = " + totalWin);
//
//         SlotGameMediator.instance.awardController.Init_Customized(thisWin, totalWin, winType, null, null);  ///塞入報獎的資訊(參考G01鳳凰傳說)
//
//
//     }
//
//     ///(必須要Override)
//     ///SPIN後，做以下兩件事情後就可以進入轉輪模組報獎流程
//     ///SlotGameMediator.instance.awardController.Init_Customized();     ///塞入報獎的資訊(參考G01鳳凰傳說)
//     ///this.FinishedToShowAward ();     ///塞完資料後只要Call這個Function就會進入報獎
//     ///報獎完會進入該流程，若是不需要報獎的免費遊戲Function內不需要做事情，只要public DoAfterShowAward(){}就好 *Call FinishedToShowAward報獎後，自動進入
//     public DoAfterShowAward() {
//
//         SlotGameMediator.instance.awardController.Reset();       ///進來後先清掉兌獎資料，沒有主動清掉兌獎的資訊會殘留著，下一手在報獎會報一樣的
//
//         ///報獎後判斷現在的狀態是不是結束了
//         if (this.specialGameState != SpecialGameState.END) {
//
//             this.FinishedDoAfterProcess(); ///報獎後的流程跑完後，Call這個Function進入DoProcess
//         }
//         else {
//
//             ///解註冊停輪事件
//             this.wheelBlockController.Event_Finished.Remove(this.AllWheelStopped, this);
//
//             this.FinishSpecialGame(0);  ///離開免費遊戲流程，回到MainGame
//             console.log("免費遊戲結束，回到MainGame");
//             console.log("-----------------------------------------------------");
//         }
//
//     }
//
//     public AllWheelStopped() {
//
//         console.warn("Wheel Stoppppppppp");
//
//         this.FinishedToShowAward();    ///塞完資料後只要Call這個Function就會進入報獎
//     }
//
//     //(必須要Override)主流程的處理 *Call了FinishEnterGameOpening或是FinishedDoAfterProcess後都會進入
//     public DoProcess(): void {
//
//         ///轉動功能
//         this.wheelBlockController.SpinAll(GamePlayMode.SpecialGame);
//
//         console.log("按下空白鍵繼續下一手");
//         console.log("-----------------------------------------------------");
//         this.canPressSpaceflag = true;
//     }
//
//     ///Test
//     // public start (){
//
//     //     if (CC_DEBUG) {
//
//     //         cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
//     //     }
//     // }
//
//     // private onKeyDown(event: cc.Event.EventKeyboard) {
//
//     //     if((event as any).keyCode == cc.KEY.space && this.canPressSpaceflag) {
//
//     //         this.canPressSpaceflag = false;
//     //         this.SendFeverCommand(null);    ///SendCommand給Server，Server回傳後進入GetRequest
//
//     //         // this.CreateAddFreeSpinEffect(cc.v2(100, 100), cc.v2(1000, 500), 0.5, this.TestCallback, this);
//     //     }
//     // }
// }
