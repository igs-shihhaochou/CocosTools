import {_decorator, CCString, Component, Node} from 'cc';
const {ccclass, property} = _decorator;

import {WheelBlockController} from './WheelBlockController';
import {SlotGameMediator} from '../Define/SlotGameMediator';

@ccclass('PrewinController')
export class PrewinController extends Component {
  @property(CCString)
  protected prewinAudioKey = '';
  @property(WheelBlockController)
  protected wheelBlockController: WheelBlockController = null;
  @property([Node])
  protected prewinObjectAry: Node[] = [];
  protected prewinAudioId: number = undefined;
  public onLoad() {
    this.wheelBlockController.eventPrewinStart.insert(this.onPrewinStart, this);
    this.wheelBlockController.eventPrewinFinished.insert(
      this.onPrewinFinish,
      this
    );

    for (let i = 0; i < this.prewinObjectAry.length; i++) {
      this.onPrewinFinish(0, i);
    }
  }
  public onPrewinStart(ctrlIndex: number, wheelIndex: number) {
    if (this.prewinAudioId !== undefined) {
      SlotGameMediator.instance.audioManager.stop(this.prewinAudioId);
      this.prewinAudioId = undefined;
    }
    if (this.prewinAudioKey === undefined || this.prewinAudioKey === '') {
      this.prewinAudioKey = 'prewin';
    }
    this.prewinAudioId = SlotGameMediator.instance.audioManager.play(
      this.prewinAudioKey
    );
    if (wheelIndex < this.prewinObjectAry.length) {
      this.prewinObjectAry[wheelIndex].active = true;
    }
  }
  public onPrewinFinish(ctrlIndex: number, wheelIndex: number) {
    if (this.prewinAudioId !== undefined) {
      SlotGameMediator.instance.audioManager.stop(this.prewinAudioId);
      this.prewinAudioId = undefined;
    }
    if (wheelIndex < this.prewinObjectAry.length) {
      this.prewinObjectAry[wheelIndex].active = false;
    }
  }
}
