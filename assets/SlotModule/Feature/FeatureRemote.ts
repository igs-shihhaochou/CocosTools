import {_decorator, Component} from 'cc';
const {ccclass} = _decorator;

import {Delegate} from '../../CommonModule/Script/ExtraType';
import {FeatureData} from '../Define/SlotGameData';

@ccclass
export abstract class FeatureRemote extends Component {
  //需要告知WheelBlock，Feature已經結束
  public eventFinished: Delegate = new Delegate();
  public featureKey = '';
  protected _data: FeatureData = null;
  public get data(): FeatureData {
    return this._data;
  }
  //     //判斷是不是正在執行
  public isPlaying = false;
  //     //開始第一個進入點
  public startFeature(dataArg: FeatureData): void {
    this.isPlaying = true;
    this._data = dataArg;
  }
  //     //接收資料流程 *Override
  public playFeature(dataArg: FeatureData, _resultAry: number[][]): boolean {
    this._data = dataArg;
    return true;
  }
  //     //結束Feature
  public playEnding(): void {
    this.isPlaying = false;
    if (this.eventFinished.length > 0) {
      this.eventFinished.notify(this);
    }
  }
  //     //單輪停止
  public actionWhenStop(_wheelIndex: number) {}
}
