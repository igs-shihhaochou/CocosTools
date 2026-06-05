import {_decorator, Component, Label, Node, sp} from 'cc';
import {setOpacity} from 'db://assets/CommonModule/Script/Utility/NodeProperty';
import {SlotGameMediator} from '../../Define/SlotGameMediator';
import {waitForSeconds} from 'db://assets/CommonModule/Script/ExtraType';
import {SlotGDK} from '../../Define/SlotGDK';

const {ccclass, property} = _decorator;

@ccclass('MaxWinCtrl')
export class MaxWinCtrl extends Component {
  @property(sp.Skeleton)
  public maxWinBoard: sp.Skeleton = null;

  @property(Label)
  public maxWinBoardValue: Label = null;

  @property(Node)
  public maxWinBoardButton: Node = null;

  private isClickable = false;
  private callback: () => void = null;

  private loopAudioId = undefined;

  protected onLoad(): void {
    SlotGDK.instance.eventShowCustomMaxWin.insert(
      this.playMaxWinBoardShow,
      this
    );
    this.resetMaxWinBoard();
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventShowCustomMaxWin.remove(
      this.playMaxWinBoardShow,
      this
    );
  }

  private resetMaxWinBoard(): void {
    this.maxWinBoardValue.string = '';
    this.maxWinBoardButton.active = false;
    this.maxWinBoard.node.active = false;
  }

  /**
   * 播放最大倍率展示動畫，玩家點擊後執行callback
   * @param value 最大倍率 (目前固定10000倍)
   * @param callback 完成後的callback
   */
  public async playMaxWinBoardShow(value = 10000, callback: () => void = null) {
    console.log('[MaxWinCtrl] playMaxWinBoardShow, value: ', value);
    this.maxWinBoardValue.string = value.toString() + 'x';
    this.maxWinBoard.node.active = true;
    this.maxWinBoardButton.active = true;
    setOpacity(this.maxWinBoard.node, 255);
    this.maxWinBoard.setAnimation(0, 'in', false);
    SlotGameMediator.instance.audioManager.play('MaxWinBoard_In');
    await waitForSeconds(this.maxWinBoard.getCurrent(0).animation.duration);
    this.maxWinBoard.setAnimation(0, 'loop', true);
    this.loopAudioId =
      SlotGameMediator.instance.audioManager.play('MaxWinBoard_Loop');
    this.callback = callback;
    this.isClickable = true;
  }

  public async onClickEnd(): Promise<void> {
    if (!this.isClickable) return;
    this.isClickable = false;

    this.maxWinBoard.setAnimation(0, 'out', false);
    SlotGameMediator.instance.audioManager.stop(this.loopAudioId);
    this.loopAudioId = undefined;
    SlotGameMediator.instance.audioManager.play('MaxWinBoard_Out');
    await waitForSeconds(this.maxWinBoard.getCurrent(0).animation.duration);
    this.maxWinBoard.node.active = false;
    setOpacity(this.maxWinBoard.node, 0);
    this.maxWinBoardButton.active = false;
    if (this.callback !== null) {
      this.callback();
      this.callback = null;
    }
  }
}
