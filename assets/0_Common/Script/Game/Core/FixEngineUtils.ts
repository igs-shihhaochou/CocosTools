// import { unmute } from "../../../../CommonModule/Script/Core/UnMuteIosAudio";

// const isIpad = () => {
//     const { userAgent, maxTouchPoints } = window.navigator;
//     if (userAgent.indexOf('iPad') > -1) {
//         return true;
//     }
//     if (userAgent.indexOf('Macintosh') > -1 && maxTouchPoints > 0) {
//         return true;
//     }
//     return false;
// };

// //修正直版轉向方向
// const SetPortraitRotateDirection = () => {
//     cc.ContainerStrategy["EQUAL_TO_FRAME"].apply = function (view) {
//         var containerStyle = cc.game.container.style;
//         var frameW = view._frameSize.width;
//         this._setupContainer(view, view._frameSize.width, view._frameSize.height);
//         var frameH = view._frameSize.height;
//         var __BrowserGetter = {
//             init: function () {
//                 this.html = document.getElementsByTagName("html")[0];
//             },
//             availWidth: function (frame) {
//                 if (!frame || frame === this.html)
//                     return window.innerWidth;
//                 else
//                     return frame.clientWidth;
//             },
//             availHeight: function (frame) {
//                 if (!frame || frame === this.html)
//                     return window.innerHeight;
//                 else
//                     return frame.clientHeight;
//             },
//             meta: {
//                 "width": "device-width"
//             },
//             adaptationType: cc.sys.browserType
//         };
//         var w = __BrowserGetter.availWidth(cc.game.frame);
//         var h = __BrowserGetter.availHeight(cc.game.frame);
//         var isLandscape = w >= h;
//         // Setup container's margin and padding
//         if (view._isRotated) {
//             //調整margin坐標by kyy
//             if (isLandscape) {
//                 containerStyle.margin = frameW + 'px 0 0 0';
//             } else {
//                 containerStyle.margin = '0 0 0 ' + frameH + 'px';
//             }
//         }
//         else {
//             containerStyle.margin = '0px';
//         }
//         containerStyle.padding = "0px";
//     };
//     //@ts-expect-error
//     cc.view["convertToLocationInView"] = function (tx, ty, relatedPos, out) {
//         {
//             var __BrowserGetter = {
//                 init: function () {
//                     this.html = document.getElementsByTagName("html")[0];
//                 },
//                 availWidth: function (frame) {
//                     if (!frame || frame === this.html)
//                         return window.innerWidth;
//                     else
//                         return frame.clientWidth;
//                 },
//                 availHeight: function (frame) {
//                     if (!frame || frame === this.html)
//                         return window.innerHeight;
//                     else
//                         return frame.clientHeight;
//                 },
//                 meta: {
//                     "width": "device-width"
//                 },
//                 adaptationType: cc.sys.browserType
//             };
//             var w = __BrowserGetter.availWidth(cc.game.frame);
//             var h = __BrowserGetter.availHeight(cc.game.frame);
//             var isLandscape = w >= h;
//             let result = out || cc.v2();
//             let posLeft = relatedPos.adjustedLeft ? relatedPos.adjustedLeft : relatedPos.left;
//             let posTop = relatedPos.adjustedTop ? relatedPos.adjustedTop : relatedPos.top;
//             let x = this._devicePixelRatio * (tx - posLeft);
//             let y = this._devicePixelRatio * (posTop + relatedPos.height - ty);
//             if (this._isRotated) {
//                 if (!isLandscape) {
//                     result.x = cc.game.canvas.width - y;
//                     result.y = x;
//                 } else {
//                     result.x = y;
//                     result.y = cc.game.canvas.height - x;
//                 }
//             }
//             else {
//                 result.x = x;
//                 result.y = y;
//             }
//             return result;
//         }
//     };

//     cc.view["_initFrameSize"] = function () {
//         var __BrowserGetter = {
//             init: function () {
//                 this.html = document.getElementsByTagName("html")[0];
//             },
//             availWidth: function (frame) {
//                 if (!frame || frame === this.html)
//                     return window.innerWidth;
//                 else
//                     return frame.clientWidth;
//             },
//             availHeight: function (frame) {
//                 if (!frame || frame === this.html)
//                     return window.innerHeight;
//                 else
//                     return frame.clientHeight;
//             },
//             meta: {
//                 "width": "device-width"
//             },
//             adaptationType: cc.sys.browserType
//         };
//         var locFrameSize = this._frameSize;
//         var w = __BrowserGetter.availWidth(cc.game.frame);
//         var h = __BrowserGetter.availHeight(cc.game.frame);
//         var isLandscape = w >= h;

//         if (CC_EDITOR || !(cc.sys.isMobile || isIpad()) ||
//             (isLandscape && this._orientation & cc.macro.ORIENTATION_LANDSCAPE) ||
//             (!isLandscape && this._orientation & cc.macro.ORIENTATION_PORTRAIT)) {
//             locFrameSize.width = w;
//             locFrameSize.height = h;
//             cc.game.container.style['-webkit-transform'] = 'rotate(0deg)';
//             cc.game.container.style.transform = 'rotate(0deg)';
//             this._isRotated = false;
//         }
//         else {
//             locFrameSize.width = h;
//             locFrameSize.height = w;
//             //從90deg->-90deg by kyy
//             if (this._orientation & cc.macro.ORIENTATION_LANDSCAPE) {
//                 cc.game.container.style['-webkit-transform'] = 'rotate(90deg)';
//                 cc.game.container.style.transform = 'rotate(90deg)';
//             } else {
//                 cc.game.container.style['-webkit-transform'] = 'rotate(-90deg)';
//                 cc.game.container.style.transform = 'rotate(-90deg)';
//             }
//             cc.game.container.style['-webkit-transform-origin'] = '0px 0px 0px';
//             cc.game.container.style.transformOrigin = '0px 0px 0px';
//             this._isRotated = true;
//         }
//         if (this._orientationChanging) {
//             setTimeout(function () {
//                 //@ts-expect-error
//                 cc.view._orientationChanging = false;
//             }, 1000);
//         }
//     };
// };
// const FixIosMeshBuffer = () => {
//     //#region iOS14以上FPS下降 須調整的部分
//     const isIOSDevice: boolean = cc.sys.os == cc.sys.OS_IOS && cc.sys.isBrowser && cc.sys.isMobile;
//     const isNeedFixVersion: boolean = cc.sys.osMainVersion >= 14;
//     if (cc["MeshBuffer"] != null && (isIOSDevice && isNeedFixVersion)) {
//         cc["MeshBuffer"].prototype.checkAndSwitchBuffer = function (vertexCount) {
//             if (this.vertexOffset + vertexCount > 65535) {
//                 this.uploadData();
//                 this._batcher._flush();
//             }
//         };
//         cc["MeshBuffer"].prototype.forwardIndiceStartToOffset = function () {
//             this.uploadData();
//             this.switchBuffer();
//         };
//     }
//     //#endregion iOS14以上FPS下降 須調整的部分
// };

// const FixIosAudioMute = () => {
//     if (cc.sys.os === cc.sys.OS_IOS) {
//         //@ts-expect-error
//         const context: AudioContext = cc.sys.__audioSupport.context;
//         try {
//             if (context) {
//                 unmute(context, true, true);
//             }
//         } catch (e) {
//             console.error(e);
//         }
//     }
// };

// const FixEngineUtils = {
//     SetPortraitRotateDirection,
//     FixIosMeshBuffer,
//     FixIosAudioMute
// };
// export { FixEngineUtils };
//kyy cocos 3 再看看有沒有需要
