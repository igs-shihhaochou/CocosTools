import {_decorator, Component, tween, Tween, Node, UIOpacity, sp} from 'cc';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {SlotGameMediator} from '../../SlotModule/Define/SlotGameMediator';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';
import WinPanel from './WinPanel';
import {S202_DragonBallCtrl} from './S202_DragonBallCtrl';

const {ccclass, property} = _decorator;

@ccclass
export default class SceneManager extends Component {
  @property(Node)
  private mainGameBG: Node = null;

  @property(Node)
  private freeGameBG: Node = null;

  @property(S202_DragonBallCtrl)
  private dragonBallCtrl: S202_DragonBallCtrl = null;

  @property({type: WinPanel, displayName: '贏分面板'})
  public winPanel: WinPanel = null;

  @property({type: sp.Skeleton, displayName: '轉場動畫'})
  public freeGameAnnouceSpine: sp.Skeleton = null;

  protected onLoad(): void {
    window['sceneMgr'] = this;
  }

  protected onDestroy(): void {
    Tween.stopAllByTarget(this.freeGameBG?.getComponent(UIOpacity));
    window['sceneMgr'] = null;
  }

  public Recover(): void {
    this.dragonBallCtrl.init(true);
  }

  public async Transition(
    currentTimes: number,
    totalTimes: number
  ): Promise<void> {
    tween<UIOpacity>(this.freeGameBG.getComponent(UIOpacity))
      .call(() => {
        this.freeGameBG.getComponent(UIOpacity).opacity = 0;
        this.freeGameBG.active = true;
      })
      .to(1, {opacity: 255})
      .call(() => {
        this.mainGameBG.active = false;
      })
      .start();

    this.playTransitionAnimation();
    this.dragonBallCtrl.init(true);

    SlotGDK.instance.eventSetFreeGameBarSpinTimes.notify(
      currentTimes,
      totalTimes
    );
    SlotGameMediator.instance.audioManager.play('a07');

    await waitForSeconds(5);
    this.freeGameAnnouceSpine.setAnimation(0, 'Out', false);
    this.freeGameAnnouceSpine.setCompleteListener(
      (trackEntry: sp.spine.TrackEntry) => {
        if (trackEntry?.animation?.name !== 'Out') return;
        this.freeGameAnnouceSpine.setCompleteListener(null);
        this.freeGameAnnouceSpine.node.active = false;
      }
    );
    await waitForSeconds(1);
  }

  private playTransitionAnimation() {
    this.freeGameAnnouceSpine.node.active = true;
    this.freeGameAnnouceSpine.setAnimation(0, 'In', false);
    this.freeGameAnnouceSpine.addAnimation(0, 'Loop', true);
  }

  public async Leave(winValue = 0): Promise<void> {
    await this.winPanel.Show(winValue);
  }

  public BackToMain(): void {
    tween<UIOpacity>(this.freeGameBG.getComponent(UIOpacity))
      .call(() => {
        this.mainGameBG.active = true;
      })
      .to(1, {opacity: 0})
      .call(() => {
        this.freeGameBG.active = false;
      })
      .start();

    this.dragonBallCtrl.init(false);
  }
}
