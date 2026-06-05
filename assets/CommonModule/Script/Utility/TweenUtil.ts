import {Node} from 'cc';
import {nodeEx, safeTween} from './NodeEx';

/**
 * 結合Tween與NodeEx
 * @description 若無需要nodeEx的功能，請直接使用Tween
 * @description NodeEx的功能會同時取用Node的UITransform和UIOpacity組件，請斟酌使用
 */
export const tweenNodeEx = (node: Node) => {
  return safeTween(nodeEx(node));
};
