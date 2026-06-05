import {_decorator, CCString, Component, sp} from 'cc';
const {ccclass, property} = _decorator;

import {PlatformData} from '../Define/PlatformData';

@ccclass('ChangeSpineByLogo')
export class ChangeSpineSetting {
  @property(CCString)
  public logo = '';
  @property(sp.SkeletonData)
  public skeletonData: sp.SkeletonData = null;
}

export default class ChangeSpineByLogo extends Component {
  @property(sp.Skeleton)
  private spine: sp.Skeleton = null;
  @property([ChangeSpineSetting])
  private settingList: ChangeSpineSetting[] = [];
  private defaultSkeletonData: sp.SkeletonData = null;
  protected onLoad(): void {
    if (this.spine === null) {
      this.spine = this.node.getComponent(sp.Skeleton);
    }
    this.defaultSkeletonData = this.spine.skeletonData;
  }
  protected start(): void {
    this.changeSpine();
  }
  private changeSpine() {
    let tempSkeletonData: sp.SkeletonData = this.defaultSkeletonData;
    for (let i = 0; i < this.settingList.length; i++) {
      if (this.settingList[i].logo === PlatformData.logo) {
        tempSkeletonData = this.settingList[i].skeletonData;
        break;
      }
    }
    this.spine.skeletonData = tempSkeletonData;
  }
}
