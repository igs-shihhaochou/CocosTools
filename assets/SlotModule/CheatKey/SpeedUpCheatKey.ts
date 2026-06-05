import {_decorator, Component, Button, Label} from 'cc';
const {ccclass} = _decorator;

const _speed = [1, 1.5, 2, 5];

@ccclass('SpeedUpCheatKey')
export default class SpeedUpCheatKey extends Component {
  private _speed = 0;
  private _button: Button | null = null;
  private _label: Label | null = null;
  public onLoad(): void {
    // this._button = this.getComponent(cc.Button);
    // this._label = this.getComponentInChildren(cc.Label);
    // this._label.string = speed[this._speed] + "X";
    // let eventHandler = new cc.Component.EventHandler();
    // eventHandler.target = this.node;
    // eventHandler.component = "SpeedUpCheatKey";
    // eventHandler.handler = "OnClickSpeedUpCheatKey";
    // this._button.clickEvents.push(eventHandler);
    //        //@ts-expect-error
    // window._speed = 1;
    //        //@ts-expect-error
    // window._originCalculateDeltaTime = cc.Director.prototype.calculateDeltaTime;
    //        //@ts-expect-error
    // cc.director.calculateDeltaTime = function (now) {
    //            //@ts-expect-error
    // window._originCalculateDeltaTime.call(this, now);
    //            //@ts-expect-error
    // this._deltaTime *= window._speed;
    // };
  }
  public onDestroy(): void {
    //        //@ts-expect-error
    // cc.director.calculateDeltaTime = cc.Director.prototype.calculateDeltaTime;
    //        //@ts-expect-error
    // window._originCalculateDeltaTime = null;
  }
  public OnClickSpeedUpCheatKey(): void {
    // this._speed++;
    // if (this._speed >= speed.length || this._speed < 0) {
    // this._speed = 0;
    // }
    //        //@ts-expect-error
    // window._speed = speed[this._speed];
    // this._label.string = speed[this._speed] + "X";
  }
}

/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// const { ccclass, property } = cc._decorator;
//
// const speed = [1, 1.5, 2, 5];
// @ccclass
// export default class SpeedUpCheatKey extends cc.Component {
//
//     private _speed: number = 0;
//     private _button: cc.Button = null;
//     private _label: cc.Label = null;
//
//     public onLoad(): void {
//         this._button = this.getComponent(cc.Button);
//         this._label = this.getComponentInChildren(cc.Label);
//         this._label.string = speed[this._speed] + "X";
//         let eventHandler = new cc.Component.EventHandler();
//         eventHandler.target = this.node;
//         eventHandler.component = "SpeedUpCheatKey";
//         eventHandler.handler = "OnClickSpeedUpCheatKey";
//         this._button.clickEvents.push(eventHandler);
//
//         //@ts-expect-error
//         window._speed = 1;
//         //@ts-expect-error
//         window._originCalculateDeltaTime = cc.Director.prototype.calculateDeltaTime;
//         //@ts-expect-error
//         cc.director.calculateDeltaTime = function (now) {
//             //@ts-expect-error
//             window._originCalculateDeltaTime.call(this, now);
//             //@ts-expect-error
//             this._deltaTime *= window._speed;
//         };
//     }
//
//     public onDestroy(): void {
//         //@ts-expect-error
//         cc.director.calculateDeltaTime = cc.Director.prototype.calculateDeltaTime;
//         //@ts-expect-error
//         window._originCalculateDeltaTime = null;
//     }
//
//     public OnClickSpeedUpCheatKey(): void {
//         this._speed++;
//         if (this._speed >= speed.length || this._speed < 0) {
//             this._speed = 0;
//         }
//         //@ts-expect-error
//         window._speed = speed[this._speed];
//         this._label.string = speed[this._speed] + "X";
//     }
// }
