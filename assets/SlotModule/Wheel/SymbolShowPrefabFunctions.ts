import {Node, sp, Animation, AnimationClip, Vec2} from 'cc';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {WheelBlockController} from './WheelBlockController';

//播停輪動畫
const playAnimation = (
  node: Node,
  animationName: string,
  isSpine = false,
  isLoop = false,
  callBack: Function = null,
  startTime = 0
) => {
  //播Spine
  try {
    if (isSpine) {
      const spine: sp.Skeleton =
        node.getComponent(sp.Skeleton) ||
        node.getComponentInChildren(sp.Skeleton);
      if (animationName !== '') {
        spine.setEndListener(() => {
          if (callBack !== null) {
            callBack();
          }
          spine.setEndListener(null);
        });
        if (isLoop) {
          const onPlayLoopOnceEnd = () => {
            spine.setAnimation(0, animationName, isLoop);
          };
          spine.setCompleteListener(onPlayLoopOnceEnd);
        } else {
          spine.setCompleteListener(null);
        }
        if (startTime > 0) {
          if (Define.DEBUG_LOG) console.log('SymbolShowPrefab Play-', name);
          spine.getState();
          const entry: sp.spine.TrackEntry = spine.setAnimation(
            0,
            animationName,
            isLoop
          );
          entry.animationStart = startTime;
        } else {
          spine.setAnimation(0, animationName, isLoop);
        }
      } else {
        throw 'SymbolShowPrefabController: Animation Name not found.';
      }
    }
    //播動畫
    else {
      const animation: Animation =
        node.getComponent(Animation) || node.getComponentInChildren(Animation);
      animation.once(Animation.EventType.FINISHED, () => {
        if (callBack !== null) {
          callBack();
        }
      });
      const name = animationName ? animationName : animation.defaultClip.name;
      if (name !== '' && name !== undefined) {
        animation.play(name);
        const animaState = animation.getState(name);

        animaState.wrapMode = isLoop
          ? AnimationClip.WrapMode.Loop
          : AnimationClip.WrapMode.Default;
        animaState.setTime(startTime);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const getSpineTime = (spine: sp.Skeleton): number => {
  const entry: sp.spine.TrackEntry = spine.getCurrent(0);
  if (entry) {
    return entry.getAnimationTime();
  }
  return 0;
};

const getAnimationTime = (animation: Animation, name: string): number => {
  return animation.getState(name).time;
};

const isLastScatter = (
  wheelBlock: WheelBlockController,
  wheelIndex: number,
  symbolIndex: number,
  needAmount = 0,
  id: number,
  replacedId: number[] = []
) => {
  const scatterPos: Vec2[] = [];
  const resultWheel = wheelBlock.getResultAry();
  resultWheel.forEach((wheelAry, idx) => {
    //取得可視範圍的symbol
    const {outOfTopSymbolAmount, outOfBottomSymbolAmount} =
      wheelBlock.wheelAry[idx];
    for (
      let i = outOfTopSymbolAmount;
      i <= wheelAry.length - 1 - outOfBottomSymbolAmount;
      i++
    ) {
      const symbol = wheelAry[i];
      if (replacedId.includes(symbol)) {
        scatterPos.push(new Vec2(idx, i));
      }
    }
  });

  const currentIdx = scatterPos.findIndex(
    pos => pos.x === wheelIndex && pos.y === symbolIndex
  );

  if (currentIdx === scatterPos.length - 1 && scatterPos.length >= needAmount) {
    return true;
  } else {
    return false;
  }
};

const isLastScatterEx = (
  wheelBlock: WheelBlockController,
  wheelIndex: number,
  symbolIndex: number,
  needAmount = 0,
  scatterIDAry: number[]
) => {
  const scatterPos: Vec2[] = [];
  const resultWheel = wheelBlock.getResultAry();
  resultWheel.forEach((wheelAry, idx) => {
    //取得可視範圍的symbol
    const {outOfTopSymbolAmount, outOfBottomSymbolAmount} =
      wheelBlock.wheelAry[idx];
    for (
      let i = outOfTopSymbolAmount;
      i <= wheelAry.length - 1 - outOfBottomSymbolAmount;
      i++
    ) {
      const symbol = wheelAry[i];
      if (scatterIDAry.includes(symbol)) {
        scatterPos.push(new Vec2(idx, i));
      }
    }
  });

  const currentIdx = scatterPos.findIndex(
    pos => pos.x === wheelIndex && pos.y === symbolIndex
  );
  console.log(
    '[IsLastScatterEx]',
    wheelIndex,
    symbolIndex,
    scatterIDAry,
    currentIdx,
    scatterPos
  );
  if (currentIdx === scatterPos.length - 1 && scatterPos.length >= needAmount) {
    return true;
  } else {
    return false;
  }
};

export {
  playAnimation,
  getSpineTime,
  getAnimationTime,
  isLastScatter,
  isLastScatterEx,
};
