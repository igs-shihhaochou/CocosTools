import {tween, v3, Vec2, Vec3, Node, bezier} from 'cc';
import {nodeEx} from './NodeEx';

export const bezierTo3 = (
  object: Node,
  duration: number,
  _startPos: Vec3 | Vec2,
  _controlPos1: Vec3 | Vec2,
  _controlPos2: Vec3 | Vec2,
  _endPos: Vec3 | Vec2
) => {
  // 三维空间的缓动

  const bezierCurve = (
    t: number,
    p1: Vec3,
    cp1: Vec3,
    cp2: Vec3,
    p2: Vec3,
    out: Vec3
  ) => {
    out.x = bezier(p1.x, cp1.x, cp2.x, p2.x, t);

    out.y = bezier(p1.y, cp1.y, cp2.y, p2.y, t);

    out.z = bezier(p1.z, cp1.z, cp2.z, p2.z, t);
  };
  const startPos =
    _startPos instanceof Vec2 ? v3(_startPos.x, _startPos.y, 0) : _startPos;
  const controlPos1 =
    _controlPos1 instanceof Vec2
      ? v3(_controlPos1.x, _controlPos1.y, 0)
      : _controlPos1;
  const controlPos2 =
    _controlPos2 instanceof Vec2
      ? v3(_controlPos2.x, _controlPos2.y, 0)
      : _controlPos2;
  const endPos =
    _endPos instanceof Vec2 ? v3(_endPos.x, _endPos.y, 0) : _endPos;
  const tempVec3 = v3();

  return tween(nodeEx(object)).to(
    duration,
    {position: endPos},
    {
      onUpdate: (target, ratio) => {
        bezierCurve(
          ratio,
          startPos,
          controlPos1,
          controlPos2,
          endPos,
          tempVec3
        );
        object.position = tempVec3;
      },
    }
  );
};

export const bezierTo2 = (
  object: Node,
  duration: number,
  _startPos: Vec3 | Vec2,
  _controlPos: Vec3 | Vec2,
  _endPos: Vec3 | Vec2
) => {
  // 三维空间的缓动

  const quadraticCurve = (
    t: number,
    p1: Vec3,
    cp: Vec3,
    p2: Vec3,
    out: Vec3
  ) => {
    out.x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;

    out.y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;

    out.z = (1 - t) * (1 - t) * p1.z + 2 * t * (1 - t) * cp.z + t * t * p2.z;
  };

  const tempVec3 = v3();

  const startPos =
    _startPos instanceof Vec2 ? v3(_startPos.x, _startPos.y, 0) : _startPos;
  const controlPos =
    _controlPos instanceof Vec2
      ? v3(_controlPos.x, _controlPos.y, 0)
      : _controlPos;
  const endPos =
    _endPos instanceof Vec2 ? v3(_endPos.x, _endPos.y, 0) : _endPos;

  return tween(nodeEx(object)).to(
    duration,
    {position: endPos},
    {
      onUpdate: (target, ratio) => {
        quadraticCurve(ratio, startPos, controlPos, endPos, tempVec3);
        object.position = tempVec3;
      },
    }
  );
};
