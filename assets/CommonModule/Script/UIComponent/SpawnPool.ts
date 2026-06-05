import {_decorator, Component, director, instantiate, Node} from 'cc';
const {ccclass} = _decorator;

//MultiType物件池 Translate from C# , byYC

@ccclass('SpawnPool')
export class SpawnPool extends Component {
  private stockpileObjAry = []; //目前存起來可以用的NodeArray
  private stockpileKindAry: Node[] = []; //目前存在stockpileAry中的Array種類
  private spawnedAry = []; //丟出去的所有物件
  ///取出SpawnNode
  public spawn(target: Node | null, parent: Node | null = null): Node | null {
    if (target === null) {
      console.error('NodePool : spawnNode not Reference');
      return null;
    }
    let kindIndex = this.stockpileKindAry.indexOf(target);
    if (kindIndex <= -1) {
      this.stockpileKindAry.push(target);
      kindIndex = this.stockpileKindAry.length - 1;
    }
    let ret: Node = null;
    const index = this.stockpileObjAry.findIndex(obj => {
      return obj.kind === this.stockpileKindAry[kindIndex];
    });
    if (index >= 0) {
      ret = this.stockpileObjAry[index].node;
      this.stockpileObjAry.splice(index, 1); //拔掉指定index
    } else {
      ret = instantiate(target);
      ret.parent = director.getScene();
    }
    if (parent !== null) {
      ret.parent = parent;
    }
    const obj = {kind: this.stockpileKindAry[kindIndex], node: ret};
    this.spawnedAry.push(obj);
    ret.active = true;
    return ret;
  }
  ///回收SpawnNode
  public despawn(node: Node) {
    const nodeIndex = this.spawnedAry.findIndex(obj => {
      return obj.node === node;
    });
    //判斷是不是由該pool產生的
    if (nodeIndex >= 0) {
      // node.parent = this.node;
      node.active = false;
      const obj = {kind: this.spawnedAry[nodeIndex].kind, node: node};
      this.stockpileObjAry.push(obj);
      this.spawnedAry.splice(nodeIndex, 1); //拔掉指定index
    } else {
      console.log('_nodeIndex : ' + nodeIndex);
      console.log('NodePool : This Node Not Can Despawn');
    }
  }
  //回收所有SpawnNode
  public despawnAll() {
    for (const obj of this.spawnedAry) {
      // obj.node.parent = this.node; ////設定parent的物件上有掛particle會有奇怪的被砍掉的BUG
      obj.node.active = false;
      this.stockpileObjAry.push(obj);
    }
    this.spawnedAry = [];
  }
  //判斷是不是被spawn出來的物件
  public isSpawned(node: Node): boolean {
    if (
      this.spawnedAry.findIndex(obj => {
        return obj.node === node;
      }) >= 0
    ) {
      return true;
    }
    return false;
  }
}
