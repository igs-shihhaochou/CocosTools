import {_decorator, Component, PageView, Button} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('ArrowCtrl')
export default class ArrowCtrl extends Component {
  @property(PageView)
  private pageView: PageView | null = null;
  @property(Button)
  private arrowLeft: Button | null = null;
  @property(Button)
  private arrowRight: Button | null = null;
  protected onLoad(): void {
    this.updateArrow();
  }
  public onLeftClick() {
    this.pageView.scrollToLeft(0.5);
    this.pageView.setCurrentPageIndex(this.pageView.getCurrentPageIndex() - 1);
    this.updateArrow();
  }
  public onRightClick() {
    this.pageView.scrollToRight(0.5);
    this.pageView.setCurrentPageIndex(this.pageView.getCurrentPageIndex() + 1);
    this.updateArrow();
  }
  public pageviewEvent(pageView, eventType, customEventData) {
    this.updateArrow();
  }
  private updateArrow() {
    if (this.pageView.getCurrentPageIndex() === 0) {
      this.arrowLeft.interactable = false;
      this.arrowLeft.node.active = false;
      this.arrowRight.node.active = true;
      this.arrowRight.interactable = true;
    } else if (
      this.pageView.getCurrentPageIndex() ===
      this.pageView.getPages().length - 1
    ) {
      this.arrowRight.node.active = false;
      this.arrowRight.interactable = false;
      this.arrowLeft.interactable = true;
      this.arrowLeft.node.active = true;
    } else {
      this.arrowRight.node.active = true;
      this.arrowRight.interactable = true;
      this.arrowLeft.interactable = true;
      this.arrowLeft.node.active = true;
    }
  }
}
