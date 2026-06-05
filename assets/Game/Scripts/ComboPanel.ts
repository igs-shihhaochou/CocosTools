/* eslint-disable camelcase */
import {
  _decorator,
  Component,
  Label,
  tween,
  Tween,
  AnimationState,
  Node,
  Animation,
  UIOpacity,
  sp,
} from 'cc';

import {ComboInfo, S202_FreeGameData, S202_Status} from './Define';

const {ccclass, property} = _decorator;

@ccclass
export default class ComboPanel extends Component {
  @property({type: Label, displayName: 'Combo 數字'})
  public combo: Label = null;

  @property({type: Animation, displayName: '動畫節點'})
  public animation: Animation = null;

  public readonly SET: string = 'combo_str';
  public readonly IDLE: string = 'combo_lop';
  public readonly SET_MULTIPLE: string = 'FG_show';
  public readonly IDLE_MULTIPLE: string = 'FG_lop';
  public root: Node = null;

  public set Combo(combo: number) {
    this.combo.string = combo.toString();
  }

  public set Multiple(combo: number) {}

  public clearMultiple(): void {}

  protected onLoad(): void {
    this.root = this.animation.node;
    this.clearMultiple();
    this.Multiple = 0;
  }

  protected onDestroy(): void {
    Tween.stopAllByTarget(this.root?.getComponent(UIOpacity));
    this.unscheduleAllCallbacks();
  }

  public fadeIn(duration = 0.2): void {
    if (this.root.getComponent(UIOpacity).opacity === 0) {
      tween<UIOpacity>(this.root.getComponent(UIOpacity))
        .to(duration, {opacity: 255})
        .start();
    }
  }

  public fadeOut(duration = 0.2): void {
    tween<UIOpacity>(this.root.getComponent(UIOpacity))
      .to(duration, {opacity: 0})
      .start();
    this.animation.stop();
    this.unscheduleAllCallbacks();
  }

  public Set(comboInfo: ComboInfo): void {
    this.Combo = comboInfo.combo + 1;
    this.Multiple = comboInfo.combo;
    this.animation.play(this.SET);
    const animComponent = this.animation.getComponent(Animation);
    const state: AnimationState = animComponent.getState(this.SET);
    //const state: AnimationState = this.animation.play(this.SET, 0);
    //this.multiple.play(this.SET_MULTIPLE, 0);
    this.scheduleOnce(this.Idle, state.duration + 0.2);
  }

  public Idle(): void {
    this.animation.play(this.IDLE);
  }
}
