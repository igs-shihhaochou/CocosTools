// import { _decorator, Node, Vec2, Component, Prefab, CCFloat, CCInteger, v2 } from 'cc';
// const { ccclass, property } = _decorator;

// import { SpawnPool } from "../../CommonModule/Script/UIComponent/SpawnPool";
// interface NodeParticle {
//     node: Node;
//     lifetime: number;
//     gravityXY: Vec2;
//     beginScale: number;        //起始時的Scale
//     endScale: number;          //結束時的Scale
//     currentLifeTime: number,    //目前生存的時間
//     currentGrivate: Vec2;      //要移動的位移量
// }
// // //20190724 byYC
// // //20190726 新增beginScale、endScale

// @ccclass('SlotNodeParticleSystem')
// export class NodeParticleSystem extends Component {
//     @property({ type: Prefab, displayName: "表演物件" })
//     public targetNode: Prefab | null = null;            //表演物件
//     @property({ displayName: "隨機隨轉角度" })
//     public randomRotation: boolean = false;          //隨機隨轉角度
//     @property({ displayName: "開啟物件時播放" })
//     public enableToPlay: boolean = true;          //開啟物件時播放
//     @property({ type: CCFloat, displayName: "表演持續時間" })
//     public duration: number = -1; 	                //播放時間長度*-1=Forever
//     @property({ type: CCFloat, displayName: "粒子生存時間" })
//     public lifetime: number = 1;	                //生存時間
//     @property({ type: CCFloat, displayName: "粒子生存時間浮動值", tooltip: "粒子生存時間 ± 粒子生存時間浮動值" })
//     public lifetimeRandomRange: number = 0;	         //生存時間浮動值
//     @property({ type: CCInteger, displayName: "每秒發射數量" })
//     public emissionRate: number = 10;           	//每秒發射數量
//     @property({ displayName: "發射範圍" })
//     public emitArea: Vec2 = Vec2.ZERO;	//發射範圍
//     @property({ type: CCFloat, displayName: "移動速度" })
//     public speed: number = 10;			            //移動速度
//     @property({ displayName: "發射角度" })
//     public angle: number = 90;			//發射角度
//     @property({ displayName: "發射角度浮動值", tooltip: "發射角度 ± 發射角度浮動值" })
//     public angleRandomRange: number = 0;			//發射角度浮動值
//     @property({ displayName: "重力方向" })
//     public gravityXY: cc.Vec2 = v2(0, 1);		//重力方向
//     @property({ displayName: "起始Scale" })
//     public beginScale: number = 1;       //起始時的Scale
//     @property({ displayName: "結束Scale" })
//     public endScale: number = 1;         //結束時的Scale
//     private receiveNodeParticleListIndex: number[] = []; //要回收nodeParticle的Index
//     private spawnpool: SpawnPool = null;            //物件生成器
//     private nodeParticleList: NodeParticle[] = [];          //特效物件
//     public onLoad() {

//         // this.spawnpool = this.addComponent(SpawnPool);
//     }
//     public onEnable() {

//         // if (this.targetNode == null) {

//         // console.warn("[NodeParticleSystem]TargetPrefab Not Found.");
//         // return;
//         // }

// //        //沒有設定enableToPlay直接跳掉
//         // if (!this.enableToPlay) return;

//         // this.RePlayParticleSystem();
//     }
//     public onDisable() {

//         // this.spawnpool.DespawnAll();
//         // this.nodeParticleList = [];
//     }
// //    //播放粒子特效
//     public RePlayParticleSystem() {

//         // let eps: number = 1 / this.emissionRate;

//         // this.unscheduleAllCallbacks();

// //        //大於0代表有設定持續時間
//         // if (this.duration > 0) {

//         // let emitTimes: number = this.duration / eps;
//         // this.schedule(this.EmitNode, eps, emitTimes);
//         // }
//         // else {

//         // this.schedule(this.EmitNode, eps);
//         // }
//     }
// //    //停止粒子特效
//     public StopParticleSystem() {

//         // this.unscheduleAllCallbacks();
//     }
// //    /**
// //     * 發射出物件
// //     */
//     private EmitNode() {

//         // if (!this.spawnpool)
//         // this.spawnpool = this.addComponent(SpawnPool);

// //        //產生物件，給與生成位置
//         // let particleNode = this.spawnpool.Spawn(this.targetNode.data);
//         // particleNode.parent = this.node;
//         // let createPosX: number = ((Math.random() - 0.5) * 2) * this.emitArea.x;
//         // let createPosY: number = ((Math.random() - 0.5) * 2) * this.emitArea.y;
//         // particleNode.setPosition(cc.v2(createPosX, createPosY));
//         // particleNode.scale = this.beginScale;

// //        //隨機旋轉角度
//         // if (this.randomRotation)
//         // particleNode.angle = -(Math.random() * 360);

// //        //角度轉向量,亂數取-1~1乘上亂數範圍
//         // let radian: number = (this.angle + ((Math.random() - 0.5) * 2) * this.angleRandomRange) * Math.PI / 180.0;
//         // let randomDirection: cc.Vec2 = cc.v2(Math.cos(radian), Math.sin(radian));

// //        //亂數產生生存時間
//         // let particleLifetime: number = this.lifetime + (((Math.random() - 0.5) * 2) * this.lifetimeRandomRange);

//         // let nodeParticle: NodeParticle = {

//         // node: particleNode,
//         // lifetime: particleLifetime,
//         // gravityXY: this.gravityXY,
//         // beginScale: this.beginScale,
//         // endScale: this.endScale,
//         // currentLifeTime: 0,
//         // currentGrivate: cc.v2(randomDirection.x * this.speed, randomDirection.y * this.speed)
//         // };

//         // this.nodeParticleList.push(nodeParticle);
//     }
//     public update(dt) {

// //        // console.warn("----");
//         // this.nodeParticleList.forEach((element, index) => {

//         // element.currentLifeTime += dt;

// //            //超過生存時間就記錄起來
//         // if (element.currentLifeTime >= element.lifetime) {

//         // element.currentLifeTime = element.lifetime;     //確保最後一次進入時是lifetime
//         // this.receiveNodeParticleListIndex.push(index);
//         // }

// //            //計算這一個Frame要更新的重力
//         // let updateGrivate: cc.Vec2 = cc.v2(
//         // element.gravityXY.x * dt,
//         // element.gravityXY.y * dt
//         // );

// //            //計算出這個Frame要更新的位移量
//         // element.currentGrivate = cc.v2(
//         // element.currentGrivate.x + updateGrivate.x,
//         // element.currentGrivate.y + updateGrivate.y
//         // );

// //            //更新Position
//         // element.node.setPosition(cc.v2(
//         // element.node.position.x + element.currentGrivate.x,
//         // element.node.position.y + element.currentGrivate.y
//         // ));

// //            //更新Scale(如果不需要變動就不進入計算)
//         // if (element.beginScale != element.endScale) {

//         // let timeRate: number = element.currentLifeTime / element.lifetime;  //經過時間的比例 0~1

//         // let scale: number = ((element.endScale - element.beginScale) * timeRate) + element.beginScale;

//         // element.node.scale = scale;
//         // }
//         // });

// //        //將有記錄起來的位置回收
//         // if (this.receiveNodeParticleListIndex.length > 0) {

//         // for (let i = this.receiveNodeParticleListIndex.length - 1; i >= 0; i--) {

//         // const element = this.receiveNodeParticleListIndex[i];

//         // this.spawnpool.Despawn(this.nodeParticleList[element].node);

//         // this.nodeParticleList.splice(element, 1);
//         // }

//         // this.receiveNodeParticleListIndex = [];
//         // }
//     }
// }

// /**
//  * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
//  */
// // import { SpawnPool } from "../../CommonModule/Script/UIComponent/SpawnPool";
// //
// //
// // const { ccclass, property } = cc._decorator;
// //
// // interface NodeParticle {
// //
// //     node: cc.Node;
// //     lifetime: number;
// //     gravityXY: cc.Vec2;
// //     beginScale: number;        //起始時的Scale
// //     endScale: number;          //結束時的Scale
// //     currentLifeTime: number,    //目前生存的時間
// //     currentGrivate: cc.Vec2;      //要移動的位移量
// // }
// //
// // //20190724 byYC
// // //20190726 新增beginScale、endScale
// // @ccclass
// // export class NodeParticleSystem extends cc.Component {
// //
// //     @property({ type: cc.Prefab, displayName: "表演物件" })
// //     public targetNode: cc.Prefab = null;            //表演物件
// //
// //     @property({ displayName: "隨機隨轉角度" })
// //     public randomRotation: boolean = false;          //隨機隨轉角度
// //
// //     @property({ displayName: "開啟物件時播放" })
// //     public enableToPlay: boolean = true;          //開啟物件時播放
// //
// //     @property({ type: cc.Float, displayName: "表演持續時間" })
// //     public duration: number = -1; 	                //播放時間長度*-1=Forever
// //
// //     @property({ type: cc.Float, displayName: "粒子生存時間" })
// //     public lifetime: number = 1;	                //生存時間
// //
// //     @property({ type: cc.Float, displayName: "粒子生存時間浮動值", tooltip: "粒子生存時間 ± 粒子生存時間浮動值" })
// //     public lifetimeRandomRange: number = 0;	         //生存時間浮動值
// //
// //     @property({ type: cc.Integer, displayName: "每秒發射數量" })
// //     public emissionRate: number = 10;           	//每秒發射數量
// //
// //     @property({ displayName: "發射範圍" })
// //     public emitArea: cc.Vec2 = cc.Vec2.ZERO;	//發射範圍
// //
// //     @property({ type: cc.Float, displayName: "移動速度" })
// //     public speed: number = 10;			            //移動速度
// //
// //     @property({ displayName: "發射角度" })
// //     public angle: number = 90;			//發射角度
// //
// //     @property({ displayName: "發射角度浮動值", tooltip: "發射角度 ± 發射角度浮動值" })
// //     public angleRandomRange: number = 0;			//發射角度浮動值
// //
// //     @property({ displayName: "重力方向" })
// //     public gravityXY: cc.Vec2 = cc.v2(0, 1);		//重力方向
// //
// //     @property({ displayName: "起始Scale" })
// //     public beginScale: number = 1;       //起始時的Scale
// //
// //     @property({ displayName: "結束Scale" })
// //     public endScale: number = 1;         //結束時的Scale
// //
// //     private receiveNodeParticleListIndex: number[] = []; //要回收nodeParticle的Index
// //
// //     private spawnpool: SpawnPool = null;            //物件生成器
// //
// //     private nodeParticleList: NodeParticle[] = [];          //特效物件
// //
// //     public onLoad() {
// //
// //         this.spawnpool = this.addComponent(SpawnPool);
// //     }
// //
// //     public onEnable() {
// //
// //         if (this.targetNode == null) {
// //
// //             console.warn("[NodeParticleSystem]TargetPrefab Not Found.");
// //             return;
// //         }
// //
// //         //沒有設定enableToPlay直接跳掉
// //         if (!this.enableToPlay) return;
// //
// //         this.RePlayParticleSystem();
// //     }
// //
// //     public onDisable() {
// //
// //         this.spawnpool.DespawnAll();
// //         this.nodeParticleList = [];
// //     }
// //
// //     //播放粒子特效
// //     public RePlayParticleSystem() {
// //
// //         let eps: number = 1 / this.emissionRate;
// //
// //         this.unscheduleAllCallbacks();
// //
// //         //大於0代表有設定持續時間
// //         if (this.duration > 0) {
// //
// //             let emitTimes: number = this.duration / eps;
// //             this.schedule(this.EmitNode, eps, emitTimes);
// //         }
// //         else {
// //
// //             this.schedule(this.EmitNode, eps);
// //         }
// //     }
// //
// //     //停止粒子特效
// //     public StopParticleSystem() {
// //
// //         this.unscheduleAllCallbacks();
// //     }
// //
// //     /**
// //      * 發射出物件
// //      */
// //     private EmitNode() {
// //
// //         if (!this.spawnpool)
// //             this.spawnpool = this.addComponent(SpawnPool);
// //
// //         //產生物件，給與生成位置
// //         let particleNode = this.spawnpool.Spawn(this.targetNode.data);
// //         particleNode.parent = this.node;
// //         let createPosX: number = ((Math.random() - 0.5) * 2) * this.emitArea.x;
// //         let createPosY: number = ((Math.random() - 0.5) * 2) * this.emitArea.y;
// //         particleNode.setPosition(cc.v2(createPosX, createPosY));
// //         particleNode.scale = this.beginScale;
// //
// //         //隨機旋轉角度
// //         if (this.randomRotation)
// //             particleNode.angle = -(Math.random() * 360);
// //
// //         //角度轉向量,亂數取-1~1乘上亂數範圍
// //         let radian: number = (this.angle + ((Math.random() - 0.5) * 2) * this.angleRandomRange) * Math.PI / 180.0;
// //         let randomDirection: cc.Vec2 = cc.v2(Math.cos(radian), Math.sin(radian));
// //
// //         //亂數產生生存時間
// //         let particleLifetime: number = this.lifetime + (((Math.random() - 0.5) * 2) * this.lifetimeRandomRange);
// //
// //         let nodeParticle: NodeParticle = {
// //
// //             node: particleNode,
// //             lifetime: particleLifetime,
// //             gravityXY: this.gravityXY,
// //             beginScale: this.beginScale,
// //             endScale: this.endScale,
// //             currentLifeTime: 0,
// //             currentGrivate: cc.v2(randomDirection.x * this.speed, randomDirection.y * this.speed)
// //         };
// //
// //         this.nodeParticleList.push(nodeParticle);
// //     }
// //
// //     public update(dt) {
// //
// //         // console.warn("----");
// //         this.nodeParticleList.forEach((element, index) => {
// //
// //             element.currentLifeTime += dt;
// //
// //             //超過生存時間就記錄起來
// //             if (element.currentLifeTime >= element.lifetime) {
// //
// //                 element.currentLifeTime = element.lifetime;     //確保最後一次進入時是lifetime
// //                 this.receiveNodeParticleListIndex.push(index);
// //             }
// //
// //             //計算這一個Frame要更新的重力
// //             let updateGrivate: cc.Vec2 = cc.v2(
// //                 element.gravityXY.x * dt,
// //                 element.gravityXY.y * dt
// //             );
// //
// //             //計算出這個Frame要更新的位移量
// //             element.currentGrivate = cc.v2(
// //                 element.currentGrivate.x + updateGrivate.x,
// //                 element.currentGrivate.y + updateGrivate.y
// //             );
// //
// //             //更新Position
// //             element.node.setPosition(cc.v2(
// //                 element.node.position.x + element.currentGrivate.x,
// //                 element.node.position.y + element.currentGrivate.y
// //             ));
// //
// //             //更新Scale(如果不需要變動就不進入計算)
// //             if (element.beginScale != element.endScale) {
// //
// //                 let timeRate: number = element.currentLifeTime / element.lifetime;  //經過時間的比例 0~1
// //
// //                 let scale: number = ((element.endScale - element.beginScale) * timeRate) + element.beginScale;
// //
// //                 element.node.scale = scale;
// //             }
// //         });
// //
// //         //將有記錄起來的位置回收
// //         if (this.receiveNodeParticleListIndex.length > 0) {
// //
// //             for (let i = this.receiveNodeParticleListIndex.length - 1; i >= 0; i--) {
// //
// //                 const element = this.receiveNodeParticleListIndex[i];
// //
// //                 this.spawnpool.Despawn(this.nodeParticleList[element].node);
// //
// //                 this.nodeParticleList.splice(element, 1);
// //             }
// //
// //             this.receiveNodeParticleListIndex = [];
// //         }
// //     }
// // }
