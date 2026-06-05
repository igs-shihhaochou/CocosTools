import {Animation} from 'cc';

export default class AnimationEx {
  private _anim: Animation;

  constructor(anim: Animation) {
    this._anim = anim;
  }

  get currentClip() {
    const clips = this._anim.clips;
    for (let i = 0; i < clips.length; i++) {
      const state = this._anim.getState(clips[i].name);
      if (state.isPlaying) {
        return clips[i].name;
      }
    }
    return '';
  }

  public destroy() {
    this._anim = null;
  }
}

export const animationEx = (anim: Animation) => {
  return new AnimationEx(anim);
};
