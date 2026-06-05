import {_decorator, Component, Node, CCInteger, easing} from 'cc';

import {setScale} from 'db://assets/CommonModule/Script/Utility/NodeProperty';
import {tweenNodeEx} from 'db://assets/CommonModule/Script/Utility/TweenUtil';
const {ccclass, property, menu} = _decorator;

/**
 * 載入頁處理
 */
@ccclass('DifficultyLevel')
@menu('CommonModule/Script/UIComponent/DifficultyLevel')
export default class DifficultyLevel extends Component {
  /** 取得 Singleton 物件實體 */
  public static get instance(): DifficultyLevel {
    return DifficultyLevel._instance;
  }
  /** Instance 實體 */
  protected static _instance: DifficultyLevel = null;
  protected isShowInfo = false;

  /** 說明頁節點 */
  @property(Node)
  protected infoNode: Node = null;

  /** 難度等級 */
  @property(CCInteger)
  protected level = 0;

  @property(Node)
  protected level0Node: Node = null;
  @property(Node)
  protected level1Node: Node = null;
  @property(Node)
  protected level2Node: Node = null;

  /** public method ================================ */

  /**
   * 設置難度等級
   * @param difficultyLevel
   */
  public setDifficultyLevel(difficultyLevel: number) {
    this.level = difficultyLevel;
    this.level0Node.active = this.level === 0;
    this.level1Node.active = this.level === 1;
    this.level2Node.active = this.level === 2;
  }

  /**
   * 開關說明頁
   * @param isShow
   */
  public onClickInfo() {
    this.isShowInfo = !this.isShowInfo;
    if (this.isShowInfo) {
      this.infoNode.active = true;
      setScale(this.infoNode, 0);
      tweenNodeEx(this.infoNode)
        .to(0.1, {scale: 1}, {easing: easing.sineInOut})
        .start();
    } else {
      this.infoNode.active = false;
    }
  }

  /**
   * 銷毀實體
   */
  public destroySelf() {
    if (!DifficultyLevel._instance) return;

    this.node.destroy();
  }

  /** protected method ================================ */
  protected override onLoad() {
    if (DifficultyLevel._instance) {
      this.node.destroy();
      return;
    }
    DifficultyLevel._instance = this;

    this.init();
  }

  protected override onDestroy() {
    this.release();
  }

  /**
   * 初始化
   */
  protected init() {
    this.infoNode.active = false;
    this.isShowInfo = false;
    this.setDifficultyLevel(this.level);
  }

  /**
   * 釋放LoadingHandler資源
   */
  protected release() {
    DifficultyLevel._instance = null;
  }
}
