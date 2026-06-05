import {_decorator, Component, Label, Node} from 'cc';
const {ccclass, property} = _decorator;

@ccclass('ShareScreenDateCtrl')
export class ShareScreenDateCtrl extends Component {
  @property({type: Label, tooltip: '日期 Label'})
  private dayLabel: Label = null;

  @property({
    type: Label,
    tooltip: '月份 Label（使用特殊字體 A=JAN, B=FEB ... L=DEC）',
  })
  private monthLabel: Label = null;

  @property({type: Label, tooltip: '年份 Label'})
  private yearLabel: Label = null;

  public getOverlayNodes(): Node[] {
    const nodes: Node[] = [];
    if (this.dayLabel?.node) nodes.push(this.dayLabel.node);
    if (this.monthLabel?.node) nodes.push(this.monthLabel.node);
    if (this.yearLabel?.node) nodes.push(this.yearLabel.node);
    return nodes;
  }

  public updateDate() {
    const now = new Date();

    if (this.dayLabel) {
      this.dayLabel.string = now.getDate().toString().padStart(2, '0');
    }

    if (this.monthLabel) {
      // A=JAN(0), B=FEB(1), C=MAR(2) ... L=DEC(11)
      this.monthLabel.string = String.fromCharCode(65 + now.getMonth());
    }

    if (this.yearLabel) {
      this.yearLabel.string = now.getFullYear().toString();
    }
  }
}
