import {_decorator, Node, CCString, Component} from 'cc';
const {ccclass, property} = _decorator;

import {FeatureData, FeatureType} from '../Define/SlotGameData';
import {FeatureRemote} from './FeatureRemote';
import {Delegate, Queue} from '../../CommonModule/Script/ExtraType';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';

@ccclass('GameObjectDictionary')
class GameObjectDictionary {
  @property(CCString)
  public key = '';
  @property(Node)
  public node: Node = null;
}

@ccclass('FeatureController')
export class FeatureController extends Component {
  public eventFreatureEnter: Delegate = new Delegate();
  public eventFreatureLeave: Delegate = new Delegate();

  @property([GameObjectDictionary])
  protected featureRemoteList: GameObjectDictionary[] = [];

  private rotFeatureQueue: Queue<FeatureData> = new Queue<FeatureData>();
  private singleFeatureQueue: Queue<FeatureData> = new Queue<FeatureData>();
  private endFeatureQueue: Queue<FeatureData> = new Queue<FeatureData>();
  public featureShowerList: FeatureRemote[] = [];

  public awake() {
    for (let i: number; i < this.featureRemoteList.length; i++) {
      this.featureRemoteList[i].node.active = true;
    }
  }

  public onDestroy() {
    this.rotFeatureQueue.clear();
    this.singleFeatureQueue.clear();
    this.endFeatureQueue.clear();
    this.rotFeatureQueue = null;
    this.singleFeatureQueue = null;
    this.endFeatureQueue = null;
    this.featureShowerList = null;
  }

  // 設定這一手的Feature Data
  public setFeatureData(dataList: FeatureData[]): void {
    let log = '';
    for (let i = 0, count = dataList.length; i < count; i++) {
      const data: FeatureData = dataList[i];
      switch (data.featureSection) {
        case FeatureType.Rotating:
          this.rotFeatureQueue.enqueue(data);
          break;
        case FeatureType.End:
          this.endFeatureQueue.enqueue(data);
          break;
        case FeatureType.SingleEnd:
          this.singleFeatureQueue.enqueue(data);
          break;
      }
      log +=
        '(' +
        data.featureSection +
        ')' +
        data.featureKey +
        ' : ' +
        JSON.stringify(data.value) +
        '\n';
    }
    if (Define.DEBUG_LOG) {
      console.log('[FeatureControllerEx] SetFeatureData = \n' + log);
    }
  }

  // 根據featureType確認有沒有Feature要執行
  public checkIsFeature(featureType: FeatureType): boolean {
    if (featureType === FeatureType.Rotating) {
      return this.rotFeatureQueue.count > 0;
    } else if (featureType === FeatureType.End) {
      return this.endFeatureQueue.count > 0;
    } else if (featureType === FeatureType.SingleEnd) {
      return this.singleFeatureQueue.count > 0;
    }
    return false;
  }

  // 判斷有沒有任何正在執行中的Feature
  public checkHasPlayFeature(featureType: FeatureType = null): boolean {
    let isFound = false;
    //沒有帶type就檢查全部的Feature
    if (featureType === null) {
      isFound =
        this.featureShowerList.findIndex(x => {
          return x.isPlaying;
        }) !== -1
          ? true
          : false;
    } else {
      isFound =
        this.featureShowerList.findIndex(x => {
          return x.isPlaying && x.data.featureSection === featureType;
        }) !== -1
          ? true
          : false;
    }
    return isFound;
  }

  // 執行Feature
  public playFeatureProcess(
    featureType: FeatureType,
    resultAry: number[][]
  ): boolean {
    //根據featureType取出待執行的FeatureData
    const data: FeatureData = this.getNextFeature(featureType);
    if (data === null) {
      return false;
    }
    const currentFeatureKey: string = data.featureKey.toString();
    const playFeatureRemote: FeatureRemote =
      this.getFeatureRemote(currentFeatureKey);
    this.startFeature(playFeatureRemote, currentFeatureKey, featureType, data);
    const isCanPlay = this.playFeature(playFeatureRemote, data, resultAry);
    return isCanPlay;
  }

  // 針對單一停輪時Feature的流程
  public playSingleEndFeature(
    firstStop: boolean,
    wheelIndex: number,
    featureType: FeatureType,
    resultAry: number[][]
  ): boolean {
    //只要有一輪停止，且又有單一停輪的Feature，則進去Play Feature，之後的停輪都是直接執行FeatureRemoteEx內的ActionWhenStop(int wheelIndex)
    const isCanPlay = true;
    // if (firstStop) {
    //   isCanPlay = this.playFeatureProcess(featureType, resultAry);
    // }
    // if (isCanPlay) {

    // 原始這段Code只會觸發一個SingleEnd，改成While去Check才會觸發多個
    while (this.getNextFeature(featureType))
      this.playFeatureProcess(featureType, resultAry);
    //因應多個SingleEnd的變動，不做檢查讓他一直跑
    this.actionFeatureWhenSingleStop(wheelIndex);
    //}
    return isCanPlay;
  }

  // 呼叫FeatureRemote開始的函數&註冊FeatureRemote結束事件
  public startFeature(
    remote: FeatureRemote,
    nowFeatureKey: string,
    featureType: FeatureType,
    data: FeatureData
  ): void {
    if (remote !== null) {
      remote.eventFinished.clear();
      remote.eventFinished.insert(this.playFeatureEnding, this);
      remote.startFeature(data);
      if (this.eventFreatureEnter !== null) {
        this.eventFreatureEnter.notify(nowFeatureKey, featureType);
      }
    } else {
      if (Define.DEBUG_LOG) {
        console.error(
          "[FeatureControllerEx] This Key '" +
            nowFeatureKey +
            "' Feature remote is NULL."
        );
      }
    }
  }

  // 塞入Data到FeatureRemote
  public playFeature(
    remote: FeatureRemote,
    data: FeatureData,
    resultAry: number[][]
  ): boolean {
    if (data !== null && remote !== null) {
      const isFeaturePlaying: boolean = remote.playFeature(data, resultAry);
      if (isFeaturePlaying) {
        this.featureShowerList.push(remote);
      }
      return isFeaturePlaying;
    }
    return false;
  }

  // Feature結束後的Callback
  public playFeatureEnding(remote: FeatureRemote): void {
    remote.eventFinished.remove(this.playFeatureEnding, this);

    if (remote !== null) {
      if (this.eventFreatureLeave !== null) {
        this.eventFreatureLeave.notify(
          remote.featureKey,
          remote.data.featureSection
        );
      }

      for (let i = 0; i < this.featureShowerList.length; i++) {
        if (this.featureShowerList[i] === remote) {
          this.featureShowerList.splice(i, 1);
        }
      }

      if (Define.DEBUG_LOG) {
        console.log(
          '[FeatureControllerEx] FeatureShowerList = ' +
            this.featureShowerList.length
        );
      }
    }
  }

  // 當每一輪停下時，Feature需要觸發行為
  public actionFeatureWhenSingleStop(wheelIndex: number): void {
    const count: number = this.featureShowerList.length;
    for (let i = 0; i < count; i++) {
      this.featureShowerList[i].actionWhenStop(wheelIndex);
    }
  }

  // 根據FeatureKey找出要執行的FeatureRemote
  public getFeatureRemote(featureKey: string): FeatureRemote {
    for (let i = 0; i < this.featureRemoteList.length; i++) {
      if (this.featureRemoteList[i].key === featureKey) {
        return this.featureRemoteList[i].node.getComponent<FeatureRemote>(
          FeatureRemote as unknown as new () => FeatureRemote
        );
        // return this.featureRemoteList[i].node.getComponent<FeatureRemote>(
        //   FeatureRemote
        // );
      }
    }
    return null;
  }

  // 取得下一個FeatureData
  public getNextFeature(featureType: FeatureType): FeatureData {
    if (
      featureType === FeatureType.Rotating &&
      this.rotFeatureQueue.count > 0
    ) {
      return this.rotFeatureQueue.dequeue();
    } else if (
      featureType === FeatureType.End &&
      this.endFeatureQueue.count > 0
    ) {
      return this.endFeatureQueue.dequeue();
    } else if (
      featureType === FeatureType.SingleEnd &&
      this.singleFeatureQueue.count > 0
    ) {
      return this.singleFeatureQueue.dequeue();
    }
    return null;
  }
}
