import {
  Color,
  director,
  Node,
  Size,
  Sprite,
  UIOpacity,
  UITransform,
  v2,
  Vec2,
  Vec3,
  sp,
  Label,
  math,
} from 'cc';

export const getUItrans = (node: Node) => {
  return node.getComponent(UITransform) ?? node.addComponent(UITransform);
};

export const getUIOpacity = (node: Node) => {
  return node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
};

export const setOpacity = (node: Node, opacity: number) => {
  getUIOpacity(node).opacity = opacity;
};

export const getColorComponent = (node: Node) => {
  const sprite = node.getComponent(Sprite);
  if (sprite) return sprite;
  const spine = node.getComponent(sp.Skeleton);
  if (spine) return spine;
  const label = node.getComponent(Label);
  if (label) return label;
  return null;
};

export const getSprite = (node: Node) => {
  return node.getComponent(Sprite);
};

export const setPosition = (
  node: Node,
  pos: Vec2 | Vec3 | number,
  y = null,
  z = null
) => {
  if (pos instanceof Vec2) {
    node.setPosition(pos.x, pos.y, 0);
  }
  if (pos instanceof Vec3) {
    node.setPosition(pos);
  }
  if (typeof pos === 'number') {
    node.setPosition(pos, y ?? node.position.y, z ?? node.position.z);
  }
};

export const getPositionVec2 = (node: Node) => {
  return v2(node.position.x, node.position.y);
};

const _tempScaleVec3 = new Vec3();

export const setScale = (
  node: Node,
  scale: Vec2 | Vec3 | number,
  scaleY = null,
  scaleZ = null
) => {
  const {x, y, z} = node.getScale();
  if (scale instanceof Vec2) {
    _tempScaleVec3.set(scale.x, scale.y, scaleZ ?? z);
    node.setScale(_tempScaleVec3);
  }
  if (scale instanceof Vec3) {
    node.setScale(scale);
  }
  if (typeof scale === 'number') {
    _tempScaleVec3.set(scale ?? x, scaleY ?? scale ?? y, scaleZ ?? scale ?? z);
    node.setScale(_tempScaleVec3);
  }
};

export const getSize = (node: Node): Size => {
  const tran = getUItrans(node);
  return new Size(tran.width, tran.height);
};

export const setSize = (node: Node, width: number | Size, height?: number) => {
  const tran = getUItrans(node);
  if (width instanceof Size) {
    tran.width = width.width;
    tran.height = width.height;
  } else {
    tran.width = width ?? tran.width;
    tran.height = height ?? tran.height;
  }
};

export const setColor = (
  node: Node,
  color: Color | number,
  g = null,
  b = null
) => {
  const comp = getColorComponent(node);
  if (!comp) return;
  if (color instanceof Color) {
    comp.color = color;
  } else {
    comp.color = new Color(color, g, b);
  }
};

export const getColor = (node: Node) => {
  return getColorComponent(node).color;
};

const _tempWorldInputVec3 = new Vec3();

export const getWorldSpaceAR = (
  node: Node,
  pos?: Vec2 | Vec3 | null,
  out?: Vec3 | null
): Vec3 => {
  out = out ?? new Vec3();
  if (pos instanceof Vec3) {
    return getUItrans(node).convertToWorldSpaceAR(pos, out);
  } else if (pos instanceof Vec2) {
    _tempWorldInputVec3.set(pos.x, pos.y, 0);
    return getUItrans(node).convertToWorldSpaceAR(_tempWorldInputVec3, out);
  }
  _tempWorldInputVec3.set(0, 0, 0);
  return getUItrans(node).convertToWorldSpaceAR(_tempWorldInputVec3, out);
};

const _tempNodeInputVec3 = new Vec3();

export const getNodeSpaceAR = (
  node: Node,
  pos?: Vec2 | Vec3 | null,
  out?: Vec3 | null
): Vec3 => {
  out = out ?? new Vec3();
  if (pos instanceof Vec3) {
    return getUItrans(node).convertToNodeSpaceAR(pos, out);
  } else if (pos instanceof Vec2) {
    _tempNodeInputVec3.set(pos.x, pos.y, 0);
    return getUItrans(node).convertToNodeSpaceAR(_tempNodeInputVec3, out);
  }
  _tempNodeInputVec3.set(0, 0, 0);
  return getUItrans(node).convertToNodeSpaceAR(_tempNodeInputVec3, out);
};

export const getNodeSpaceFromOtherNode = (
  node: Node,
  otherNode: Node,
  position?: Vec3 | null,
  out?: Vec3 | null,
  tempWorld?: Vec3 | null
): Vec3 => {
  out = out ?? new Vec3();
  tempWorld = tempWorld ?? new Vec3();
  getWorldSpaceAR(otherNode, position, tempWorld);
  return getNodeSpaceAR(node, tempWorld, out);
};

export const getOpacity = (node: Node) => {
  return getUIOpacity(node).opacity;
};

export const setWidth = (node: Node, width: number) => {
  getUItrans(node).width = width;
};

export const getWidth = (node: Node) => {
  return getUItrans(node).width;
};

export const setHeight = (node: Node, height: number) => {
  getUItrans(node).height = height;
};

export const getHeight = (node: Node) => {
  return getUItrans(node).height;
};

export const getCanvas = () => {
  return director.getScene().getChildByPath('Canvas');
};

export const getCanvasSize = () => {
  return getSize(getCanvas());
};

export const setAnchorX = (node: Node, anchorX: number) => {
  getUItrans(node).anchorX = anchorX;
};

export const getAnchorX = (node: Node) => {
  return getUItrans(node).anchorX;
};

export const setAnchorY = (node: Node, anchorY: number) => {
  getUItrans(node).anchorY = anchorY;
};

export const getAnchorY = (node: Node) => {
  return getUItrans(node).anchorY;
};

export const setContentSize = (node: Node, size: math.Size) => {
  getUItrans(node).setContentSize(size);
};

export const setAnchorPoint = (node: Node, point: Vec2) => {
  getUItrans(node).setAnchorPoint(point);
};
