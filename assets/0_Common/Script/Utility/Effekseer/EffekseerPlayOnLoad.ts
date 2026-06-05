import {_decorator, Component, CCInteger} from 'cc';
const {ccclass, property} = _decorator;
//kyy看不懂

import EffekseerComponent from './EffekseerComponent';

@ccclass('EffekseerPlayOnLoad')
export default class EffekseerPlayOnLoad extends Component {
  @property(EffekseerComponent)
  efkComp: EffekseerComponent = null;
  @property([CCInteger])
  lstIdx: number[] = [];
  start() {
    //        // 暫時這個元件的順序要在 EffekseerComponent 之前才會正常
    // this.scheduleOnce(() => {
    // for (let index of this.lstIdx) {
    // this.efkComp.playEffek(index);
    // }
    // }, 1);
  }
}

/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import EffekseerComponent from "./EffekseerComponent";
//
// const { ccclass, property } = cc._decorator;
//
// @ccclass
// export default class EffekseerPlayOnLoad extends cc.Component {
//
//     @property(EffekseerComponent)
//     efkComp: EffekseerComponent = null;
//
//     @property([cc.Integer])
//     lstIdx: number[] = [];
//
//     start() {
//         // 暫時這個元件的順序要在 EffekseerComponent 之前才會正常
//
//         this.scheduleOnce(() => {
//             for (let index of this.lstIdx) {
//                 this.efkComp.playEffek(index);
//             }
//         }, 1);
//
//
//     }
//
// }
