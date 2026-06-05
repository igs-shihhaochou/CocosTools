import {type Animation} from 'cc';

export const setAnimationClipPlaybackrange = (
  animation: Animation,
  clipName: string,
  _min?: number,
  _max?: number
) => {
  const state = animation.getState(clipName);
  const duration = state.duration;
  state.playbackRange = {min: _min ?? 0, max: _max ?? duration};
  return state;
};

export const playAnimation = (animation: Animation, clipName: string) => {
  const name = clipName ?? animation.defaultClip.name;
  animation.play(name);
  return animation.getState(name);
};
