import {_decorator, Component, Node} from 'cc';
const {ccclass, property, executeInEditMode, menu, inspector} = _decorator;
//kyy看不懂

import efk_core from './EffekseerCore';
declare let _Editor; // creator editor
class EffekData {
  url = '';
  fps: number = efk_core.defaultFPS;
}

@ccclass('EffekseerComponent')
@property()
@property()
@menu('Plugin/Effekseer組件')
@inspector('packages://effekseer/toolUI/tool.js')
@executeInEditMode
export default class EffekseerComponent extends Component {
  //    // ----------------------------------------------------------------
  //    // For editor
  //    // ----------------------------------------------------------------
  @property
  _alredy_activated = false;
  @property
  _component_id = 'EffekseerComponent';
  @property
  _effekseer_folder_root = '';
  @property
  _effekseer_folder = 'effekseer\\res';
  _inEditor = true;
  debug() {
    //        // console.log(this.target);
    //        // console.log(this.scale_adjust);
  }
  addFile() {
    // this.effek_type.push(new EffekData());
  }
  deleteFile(_index: number) {
    // this.effek_type.splice(_index, 1);
  }
  writePath(_index: number, _filePath: string, _folderRoot: string) {
    // _filePath = _filePath.replace(/\\/g, '/');
    // this.effek_type[_index].url = _filePath;
    // this._effekseer_folder_root = _folderRoot;
  }
  //    // ----------------------------------------------------------------
  //    // EffekseerComponent
  //    // ----------------------------------------------------------------
  @property(Node)
  target: Node | null = null;
  @property
  scale_adjust = 1;
  @property(EffekData)
  effek_type: EffekData[] = [];
  private playingStates: {state: any; index: number}[] = []; // handlers of playEffect
  private playingQueue: Map<number, Function[]> = new Map(); // playing queue
  private onFinished: Function = null;
  onLoad() {
    // if (typeof Editor === 'undefined') {
    // this._inEditor = false;
    // }
    // if (!this._inEditor && !efk_core.isDone) {
    // efk_core.init();
    // }
  }
  start() {
    // if (this._inEditor) {
    // return;
    // }
    // if (!this.target) {
    // this.target = this.node;
    // }
    // if (!efk_core.camera) {  // it supposes that all effects are using the same camera
    // efk_core.camera = cc.Camera.findCamera(this.target);
    // efk_core.isCameraDrity = true;
    // }
  }
  onEnable() {
    // this.requestToLoadEffect();
    // efk_core.efkCompCnt++;
  }
  onDisable() {
    // this.stopEffek();
    // efk_core.efkCompCnt--;
  }
  lateUpdate() {
    // if (this._inEditor) {
    // return;
    // }
    // if (efk_core.isDone) {
    //            // check playing queue
    // this.playingQueue.forEach((lstFunc, index) => {
    // const efk = this.effek_type[index];
    // const effect = efk_core.efkLookup.get(efk.url);
    // if (effect && effect.isLoaded) {
    // efk_core.isCameraDrity = true;
    // lstFunc.forEach(play => play());
    // this.playingQueue.delete(index);
    // }
    // });
    //            // check playing states
    // for (let i = this.playingStates.length - 1; i >= 0; --i) {
    // let state = this.playingStates[i].state;
    // if (!state.exists) {
    // state.stop();
    // this.playingStates.splice(i, 1);
    //                    // on finished
    // if (this.onFinished != null) {
    // if (this.playingStates.length == 0) {
    // this.onFinished();
    // this.onFinished = undefined;
    // }
    // }
    // }
    // }
    //            // update the matrices of effects
    // if (efk_core.getWorldDirty(this.target)) {
    // let mat4 = cc.mat4();
    // let s = this.scale_adjust;
    // this.target.getWorldMatrix(mat4);
    // mat4.scale(cc.v3(s, s, s), mat4);
    // for (let i = this.playingStates.length - 1; i >= 0; --i) {
    // let state = this.playingStates[i].state;
    // if (state.exists) {
    // state.setMatrix(mat4.m);
    // }
    // }
    // }
    //            // check the matrix of camera (all effects use the same camera)
    // if (efk_core.getWorldDirty(efk_core.camera.node)) {
    // efk_core.isCameraDrity = true;
    // }
    // }
  }
  //    /**
  //     * load the effect only once
  //     */
  private requestToLoadEffect() {
    // if (!efk_core.isEFKEnable) {
    // return;
    // }
    // this.effek_type.forEach((efk, i) => {
    // const url = efk.url;
    // if (!efk_core.isDone) {
    // efk_core.preloadEffect.set(url, () => { });   // preloadEffect -> (url, finished)
    // return;
    // }
    // if (!efk_core.efkLookup.has(url)) {              // check effect data exits or not
    // let effect = efk_core.context.loadEffect(
    // url,
    // 1,
    // () => {                                 // called when loading is finished.
    //                        // console.log('loaded: ' + url);
    // },
    // (msg: string, url: string) => {         // called when error causes.
    // console.log(msg, url);
    // }
    // );
    // efk_core.efkLookup.set(url, effect);        // keep it
    // }
    // });
  }
  //    /**
  //     * call play function of effekseer module
  //     */
  private play(_index: number) {
    // if (!efk_core.isEFKEnable) {
    // return;
    // }
    // const efk = this.effek_type[index];
    // const effect = efk_core.efkLookup.get(efk.url);
    // if (efk && effect && effect.isLoaded) {
    //            // if play the same index of efk, then stop the old one
    // this.removePlayingStates(index);
    //            // play the efk and update the matrix
    // let mat4 = cc.mat4();
    // let s = this.scale_adjust;
    // this.target.getWorldMatrix(mat4);
    // mat4.scale(cc.v3(s, s, s), mat4);
    // let rot = efk_core.getWorldRotation(this.target).mulSelf(cc.macro.RAD);
    // let state = efk_core.context.play(effect, rot.x, rot.y, rot.z);
    // this.playingStates.push({ state: state, index: index });
    // state.setMatrix(mat4.m);
    // state.setSpeed(efk.fps / efk_core.defaultFPS);
    // }
  }
  //    /**
  //     * remove playing states
  //     */
  private removePlayingStates(_index: number) {
    // for (let i = this.playingStates.length - 1; i >= 0; --i) {
    // let playing = this.playingStates[i];
    // if (playing.index === _index) {
    // playing.state.stop();
    // this.playingStates.splice(i, 1);
    // }
    // }
  }
  //    /**
  //     * play efk
  //     */
  playEffek(_index = -1, _onFinished?: Function) {
    //        // on finished
    // if (onFinished != null) {
    // this.onFinished = onFinished;
    // }
    // if (index === -1) {
    // this.effek_type.forEach((_, i) => this.playEffek(i));  // split to call
    // return;
    // }
    // if (!this.playingQueue.has(index)) {
    // this.playingQueue.set(index, []);
    // }
    // this.playingQueue.get(index).push(() => this.play(index));
  }
  //    /**
  //     * stop efk
  //     */
  stopEffek(_index = -1) {
    // if (index === -1) {
    // this.effek_type.forEach((_, i) => this.stopEffek(i));  // split to call
    // return;
    // }
    // if (this.playingQueue.has(index)) {
    // this.playingQueue.delete(index);  // not play yet
    // }
    // this.removePlayingStates(index);
  }
  //    /**
  //     * pause efk
  //     */
  pauseEffek(_index = -1) {
    // if (index === -1) {
    // this.effek_type.forEach((_, i) => this.pauseEffek(i));  // split to call
    // return;
    // }
    // for (let playing of this.playingStates) {
    // if (playing.index === index) {
    // if (playing.state.exists) {
    // playing.state.setPaused(true);
    // }
    // }
    // }
  }
  //    /**
  //     * resume efk
  //     */
  resumeEffek(_index = -1) {
    // if (index === -1) {
    // this.effek_type.forEach((_, i) => this.resumeEffek(i));  // split to call
    // return;
    // }
    // for (let playing of this.playingStates) {
    // if (playing.index === index) {
    // if (playing.state.exists) {
    // playing.state.setPaused(false);
    // }
    // }
    // }
  }
  //    /**
  //     * check playing state
  //     * @param index
  //     */
  isPlaying(_index = -1): boolean {
    // for (let playing of this.playingStates) {
    // if (playing.index === index || index === -1) {
    // if (playing.state.exists) {
    // return true;
    // }
    // }
    // }
    // return false;
  }
}

/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import efk_core from "./EffekseerCore";
//
// declare let Editor;  // creator editor
//
// const { ccclass, property, executeInEditMode, menu, inspector } = cc._decorator;
//
// @ccclass('EffekData')
// class EffekData {
//     @property()
//     url: string = '';
//
//     @property()
//     fps: number = efk_core.defaultFPS;
// }
//
// @ccclass
// @menu('Plugin/Effekseer組件')
// @inspector('packages://effekseer/toolUI/tool.js')
// @executeInEditMode
// export default class EffekseerComponent extends cc.Component {
//
//     // ----------------------------------------------------------------
//     // For editor
//     // ----------------------------------------------------------------
//
//     @property
//     _alredy_activated: boolean = false;
//
//     @property
//     _component_id: string = 'EffekseerComponent';
//
//     @property
//     _effekseer_folder_root: string = '';
//
//     @property
//     _effekseer_folder: string = 'effekseer\\res';
//
//     _inEditor: boolean = true;
//
//     debug() {
//         // console.log(this.target);
//         // console.log(this.scale_adjust);
//     }
//
//     addFile() {
//         this.effek_type.push(new EffekData());
//     }
//
//     deleteFile(index: number) {
//         this.effek_type.splice(index, 1);
//     }
//
//     writePath(index: number, filePath: string, folderRoot: string) {
//         filePath = filePath.replace(/\\/g, '/');
//         this.effek_type[index].url = filePath;
//         this._effekseer_folder_root = folderRoot;
//     }
//
//     // ----------------------------------------------------------------
//     // EffekseerComponent
//     // ----------------------------------------------------------------
//
//     @property(cc.Node)
//     target: cc.Node = null;
//
//     @property
//     scale_adjust: number = 1;
//
//     @property(EffekData)
//     effek_type: EffekData[] = [];
//
//     private playingStates: { state: any, index: number }[] = [];    // handlers of playEffect
//     private playingQueue: Map<number, Function[]> = new Map();      // playing queue
//     private onFinished: Function = null;
//
//     onLoad() {
//         if (typeof Editor === 'undefined') {
//             this._inEditor = false;
//         }
//         if (!this._inEditor && !efk_core.isDone) {
//             efk_core.init();
//         }
//     }
//
//     start() {
//         if (this._inEditor) {
//             return;
//         }
//         if (!this.target) {
//             this.target = this.node;
//         }
//         if (!efk_core.camera) {  // it supposes that all effects are using the same camera
//             efk_core.camera = cc.Camera.findCamera(this.target);
//             efk_core.isCameraDrity = true;
//         }
//     }
//
//     onEnable() {
//         this.requestToLoadEffect();
//         efk_core.efkCompCnt++;
//     }
//
//     onDisable() {
//         this.stopEffek();
//         efk_core.efkCompCnt--;
//     }
//
//     lateUpdate() {
//         if (this._inEditor) {
//             return;
//         }
//         if (efk_core.isDone) {
//             // check playing queue
//             this.playingQueue.forEach((lstFunc, index) => {
//                 const efk = this.effek_type[index];
//                 const effect = efk_core.efkLookup.get(efk.url);
//                 if (effect && effect.isLoaded) {
//                     efk_core.isCameraDrity = true;
//                     lstFunc.forEach(play => play());
//                     this.playingQueue.delete(index);
//                 }
//             });
//
//             // check playing states
//             for (let i = this.playingStates.length - 1; i >= 0; --i) {
//                 let state = this.playingStates[i].state;
//                 if (!state.exists) {
//                     state.stop();
//                     this.playingStates.splice(i, 1);
//
//                     // on finished
//                     if (this.onFinished != null) {
//                         if (this.playingStates.length == 0) {
//                             this.onFinished();
//                             this.onFinished = undefined;
//                         }
//                     }
//                 }
//             }
//
//             // update the matrices of effects
//             if (efk_core.getWorldDirty(this.target)) {
//                 let mat4 = cc.mat4();
//                 let s = this.scale_adjust;
//
//                 this.target.getWorldMatrix(mat4);
//                 mat4.scale(cc.v3(s, s, s), mat4);
//
//                 for (let i = this.playingStates.length - 1; i >= 0; --i) {
//                     let state = this.playingStates[i].state;
//                     if (state.exists) {
//                         state.setMatrix(mat4.m);
//                     }
//                 }
//             }
//             // check the matrix of camera (all effects use the same camera)
//             if (efk_core.getWorldDirty(efk_core.camera.node)) {
//                 efk_core.isCameraDrity = true;
//             }
//         }
//     }
//
//     /**
//      * load the effect only once
//      */
//     private requestToLoadEffect() {
//         if (!efk_core.isEFKEnable) {
//             return;
//         }
//
//         this.effek_type.forEach((efk, i) => {
//             const url = efk.url;
//             if (!efk_core.isDone) {
//                 efk_core.preloadEffect.set(url, () => { });   // preloadEffect -> (url, finished)
//                 return;
//             }
//             if (!efk_core.efkLookup.has(url)) {              // check effect data exits or not
//                 let effect = efk_core.context.loadEffect(
//                     url,
//                     1,
//                     () => {                                 // called when loading is finished.
//                         // console.log('loaded: ' + url);
//                     },
//                     (msg: string, url: string) => {         // called when error causes.
//                         console.log(msg, url);
//                     }
//                 );
//                 efk_core.efkLookup.set(url, effect);        // keep it
//             }
//         });
//     }
//
//     /**
//      * call play function of effekseer module
//      */
//     private play(index: number) {
//         if (!efk_core.isEFKEnable) {
//             return;
//         }
//
//         const efk = this.effek_type[index];
//         const effect = efk_core.efkLookup.get(efk.url);
//
//         if (efk && effect && effect.isLoaded) {
//             // if play the same index of efk, then stop the old one
//             this.removePlayingStates(index);
//
//             // play the efk and update the matrix
//             let mat4 = cc.mat4();
//             let s = this.scale_adjust;
//
//             this.target.getWorldMatrix(mat4);
//             mat4.scale(cc.v3(s, s, s), mat4);
//
//             let rot = efk_core.getWorldRotation(this.target).mulSelf(cc.macro.RAD);
//             let state = efk_core.context.play(effect, rot.x, rot.y, rot.z);
//             this.playingStates.push({ state: state, index: index });
//
//             state.setMatrix(mat4.m);
//             state.setSpeed(efk.fps / efk_core.defaultFPS);
//         }
//     }
//
//     /**
//      * remove playing states
//      */
//     private removePlayingStates(index: number) {
//         for (let i = this.playingStates.length - 1; i >= 0; --i) {
//             let playing = this.playingStates[i];
//             if (playing.index === index) {
//                 playing.state.stop();
//                 this.playingStates.splice(i, 1);
//             }
//         }
//     }
//
//     /**
//      * play efk
//      */
//     playEffek(index: number = -1, onFinished?: Function) {
//         // on finished
//         if (onFinished != null) {
//             this.onFinished = onFinished;
//         }
//
//         if (index === -1) {
//             this.effek_type.forEach((_, i) => this.playEffek(i));  // split to call
//             return;
//         }
//         if (!this.playingQueue.has(index)) {
//             this.playingQueue.set(index, []);
//         }
//         this.playingQueue.get(index).push(() => this.play(index));
//     }
//
//     /**
//      * stop efk
//      */
//     stopEffek(index: number = -1) {
//         if (index === -1) {
//             this.effek_type.forEach((_, i) => this.stopEffek(i));  // split to call
//             return;
//         }
//         if (this.playingQueue.has(index)) {
//             this.playingQueue.delete(index);  // not play yet
//         }
//         this.removePlayingStates(index);
//     }
//
//     /**
//      * pause efk
//      */
//     pauseEffek(index: number = -1) {
//         if (index === -1) {
//             this.effek_type.forEach((_, i) => this.pauseEffek(i));  // split to call
//             return;
//         }
//         for (let playing of this.playingStates) {
//             if (playing.index === index) {
//                 if (playing.state.exists) {
//                     playing.state.setPaused(true);
//                 }
//             }
//         }
//     }
//
//     /**
//      * resume efk
//      */
//     resumeEffek(index: number = -1) {
//         if (index === -1) {
//             this.effek_type.forEach((_, i) => this.resumeEffek(i));  // split to call
//             return;
//         }
//         for (let playing of this.playingStates) {
//             if (playing.index === index) {
//                 if (playing.state.exists) {
//                     playing.state.setPaused(false);
//                 }
//             }
//         }
//     }
//
//     /**
//      * check playing state
//      * @param index
//      */
//     isPlaying(index: number = -1): boolean {
//         for (let playing of this.playingStates) {
//             if (playing.index === index || index === -1) {
//                 if (playing.state.exists) {
//                     return true;
//                 }
//             }
//         }
//
//         return false;
//     }
//
// }
