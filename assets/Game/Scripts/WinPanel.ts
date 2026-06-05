import {_decorator, Component, CCFloat, sp} from 'cc';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {NumberAnimation} from '../../CommonModule/Script/UIComponent/NumberAnimation';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';

const {ccclass, property} = _decorator;

const START = 'FG_result_str';
const LOOP = 'FG_result_lop';

@ccclass
export default class WinPanel extends Component {
  @property({type: NumberAnimation, displayName: '贏分數字'})
  public winValue: NumberAnimation = null;

  @property({type: sp.Skeleton, displayName: '動畫'})
  public animation: sp.Skeleton = null;

  @property({type: CCFloat, displayName: '表演時長'})
  public duration = 0;

  @property({type: CCFloat, displayName: '淡出時長'})
  public fadeDuration = 0;

  @property({type: CCFloat, displayName: '表演延遲'})
  public delay = 0;

  @property({type: CCFloat, displayName: '0 分延遲'})
  public noWinDelay = 0.2;

  public async Show(win = 0): Promise<void> {
    if (win <= 0) {
      await waitForSeconds(this.noWinDelay);
    } else {
      await this.Animation(win);
    }
  }

  public async Animation(win: number): Promise<void> {
    await waitForSeconds(this.delay);
    let duration = this.duration;
    this.winValue.setCurrentNumber(0);
    this.winValue.setTargetNumberAnimationEx(win, duration);
    this.animation.node.active = true;
    //this.animation.node.getComponent(UIOpacity).opacity = 0;
    SlotGameMediator.instance.audioManager.play('a14');
    this.animation.setAnimation(0, 'In', false);
    return new Promise<void>(resolve => {
      this.animation.setCompleteListener(() => {
        this.animation.setAnimation(0, 'Loop', true);
        this.animation.setCompleteListener(async () => {
          await waitForSeconds(this.fadeDuration);
          this.animation.setAnimation(0, 'Out', false);
          this.animation.setCompleteListener(() => {
            this.animation.node.active = false;
            resolve();
          });
        });
      });
    });
  }
}
