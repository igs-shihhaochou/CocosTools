import {
  _decorator,
  macro,
  DynamicAtlasManager,
  Node,
  Component,
  Mask,
  isValid,
  rect,
  mat4,
  Rect,
  Director,
  UIOpacity,
  director,
  UITransform,
} from 'cc';
const {ccclass, property} = _decorator;

macro.CLEANUP_IMAGE_CACHE = false;
DynamicAtlasManager.instance.enabled = true;
let _nodeID = 0;
let _draws: Draw[] = [];
// //绘画层
class Draw {
  public mask = false; //是否有mask遮盖组件
  public nodes: Node[] = []; //绘画节点容器
  public localOpacitys: number[] = [];
  public childrens: Node[][] = []; //绘图节点原子节点数据
  constructor() {
    this.nodes = [];
    this.mask = false;
    this.childrens = [];
  }
}
// //遍历建立绘图层队，并收集绘画节点, 全程以节点名字来作为唯一识别标记
const DFS = function (
  prev: Draw | null,
  node: Node,
  active: boolean,
  level = 0,
  opacity = 1.0
) {
  const key = _nodeID++;
  let draw = _draws[key];
  if (!draw) {
    draw = _draws[key] = new Draw();
    //         //不建议item内有mask, 会打断合批，会增加dc
    draw.mask = node.getComponent(Mask) !== null;
  }
  const nodes = draw.nodes;
  const localOpacitys = draw.localOpacitys;
  const uiOpacity =
    node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  if (active && opacity > 0) {
    //node.active && active
    nodes.push(node); //收集节点
    localOpacitys.push(uiOpacity.opacity); //保存透明度
    uiOpacity.opacity = opacity * uiOpacity.opacity; //设置当前透明度
  }
  opacity = (opacity * uiOpacity.opacity) / 255.0;
  //     //遮罩直接打断返回
  if (draw.mask) return;
  const childs = node.children;
  for (let i = 0; i < childs.length; i++) {
    const n = childs[i];
    const isActive = active ? isValid(n) : false;
    DFS(prev, n, isActive, level + 1, opacity);
  }
};
const aabb0 = rect();
const aabb1 = rect();
const worldMat4 = mat4();
const getWorldBoundingBox = function (node: Node, rect: Rect) {
  const _contentSize = node.getComponent(UITransform).contentSize;
  const _anchorPoint = node.getComponent(UITransform).anchorPoint;
  const width = _contentSize.width;
  const height = _contentSize.height;
  rect.x = -_anchorPoint.x * width;
  rect.y = -_anchorPoint.y * height;
  rect.width = width;
  rect.height = height;
  node.getWorldMatrix(worldMat4);
  return rect.transformMat4(worldMat4);
};
const changeTree = function (parent: Node, queue: Draw[]) {
  queue.length = 0;
  const btn = parent.getComponent(BatchItems)!;
  if (btn.culling) {
    getWorldBoundingBox(btn.culling, aabb0);
  }
  _draws = queue;
  //     //遍历所有绘画节点，按顺序分层
  const nodes = parent.children;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const uiOpacity =
      node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    if (isValid(node) && uiOpacity.opacity > 0) {
      //node.activeInHierarchy
      //             //剔除显示范围外的item
      if (btn.culling) {
        getWorldBoundingBox(node, aabb1);
        if (!aabb0.intersects(aabb1)) continue;
      }
      _nodeID = 0;
      DFS(null, node, true);
    }
  }
  // 记录item的父节点的子节点结构
  // let btn = parent.getComponent(BatchItems)!;
  btn.children = parent['_children']; //记录原来节点结构
  const childs: Node[] = (parent['_children'] = []); //创建动态分层节点结构
  for (let i = 0; i < _draws.length; i++) {
    const curr = _draws[i];
    const mask = curr.mask;
    const nodes = curr.nodes;
    const childrens = curr.childrens;
    for (let i = 0; i < nodes.length; i++) {
      childrens[i] = nodes[i]['_children']; //记录原来节点结构
      if (!mask) nodes[i]['_children'] = []; //清空切断下层节点
    }
    //         //按顺序拼接分层节点
    childs.push(...nodes);
  }
};
const resetTree = function (parent: Node, queue: Draw[]) {
  //     //恢复父节点结构
  const btn = parent.getComponent(BatchItems)!;
  parent['_children'].length = 0; //清空动态分层节点结构
  parent['_children'] = btn.children; //恢复原来节点结构
  _draws = queue;
  for (let i = 0; i < _draws.length; i++) {
    const curr = _draws[i];
    const nodes = curr.nodes;
    const childrens = curr.childrens;
    const localOpacitys = curr.localOpacitys;
    for (let i = 0; i < nodes.length; i++) {
      nodes[i]['_children'] = childrens[i]; //恢复原来节点结构
      //             //恢复原来透明度
      nodes[i].getComponent(UIOpacity).opacity = localOpacitys[i];
    }
    childrens.length = 0;
    nodes.length = 0;
  }
  _draws.length = 0;
};
director.on(Director.EVENT_BEFORE_DRAW, () => {
  //     //绘画前拦截修改节点结构
  const nodes = BatchItems.nodes;
  const queues = BatchItems.queues;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.active && node.isValid) {
      changeTree(node, queues[i]);
    }
  }
});
director.on(Director.EVENT_AFTER_DRAW, () => {
  //     //绘画结束后恢复节点结构
  const nodes = BatchItems.nodes;
  const queues = BatchItems.queues;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node && node.isValid) {
      resetTree(node, queues[i]);
    }
  }
  nodes.length = 0;
  queues.length = 0;
  _draws.length = 0;
});

@ccclass('BatchItem')
export default class BatchItems extends Component {
  //    //全局合批队列记录
  public static queues: Draw[][] = [];
  public static nodes: Node[] = [];

  public quene: Draw[] = [];
  public children: Node[] = []; //记录原节点结构
  @property(Node)
  public culling: Node | null = null;
  lateUpdate() {
    if (!isValid(this.node)) return;
    BatchItems.nodes.push(this.node);
    BatchItems.queues.push(this.quene);
  }
}
