import {v2, v3, Vec2, Vec3} from 'cc';

export const getVec3 = (vec: Vec2) => {
  return v3(vec.x, vec.y, 0);
};

export const getVec2 = (vec: Vec3) => {
  return v2(vec.x, vec.y);
};

export class Vec2Ex {
  /** return a Vec2 object with x = 0 and y = 1.*/
  get UP() {
    return new Vec2(0, 1);
  }
  /** return a Vec2 object with x = 1 and y = 0.*/
  get RIGHT() {
    return new Vec2(1, 0);
  }
}

export const vec2Ex = () => {
  return new Vec2Ex();
};

export class Vec3Ex {
  /** return a Vec3 object with x = 1, y = 1, z = 1.*/
  get ONE() {
    return new Vec3(1, 1, 1);
  }
  /** return a Vec3 object with x = 0, y = 0, z = 0.*/
  get ZERO() {
    return new Vec3(0, 0, 0);
  }
  /** return a Vec3 object with x = 0, y = 1, z = 0.*/
  get UP() {
    return new Vec3(0, 1, 0);
  }
  /**  return a Vec3 object with x = 1, y = 0, z = 0.*/
  get RIGHT() {
    return new Vec3(1, 0, 0);
  }
}

export const vec3Ex = () => {
  return new Vec3Ex();
};
