import {_decorator} from 'cc';
const {property, ccclass} = _decorator;

@ccclass('WidgetParameter')
export class WidgetParameter {
  @property({displayName: '對齊上方'})
  public isAlignTop = false;
  @property({
    displayName: '上方距離',
    visible: function (this: WidgetParameter) {
      return this.isAlignTop;
    },
  })
  public top = 0;

  @property({displayName: '對齊下方'})
  public isAlignBottom = false;
  @property({
    displayName: '下方距離',
    visible: function (this: WidgetParameter) {
      return this.isAlignBottom;
    },
  })
  public bottom = 0;

  @property({displayName: '對齊左方'})
  public isAlignLeft = false;
  @property({
    displayName: '左方距離',
    visible: function (this: WidgetParameter) {
      return this.isAlignLeft;
    },
  })
  public left = 0;

  @property({displayName: '對齊右方'})
  public isAlignRight = false;
  @property({
    displayName: '右方距離',
    visible: function (this: WidgetParameter) {
      return this.isAlignRight;
    },
  })
  public right = 0;

  @property({displayName: '水平置中'})
  public isAlignHorizontalCenter = false;
  @property({
    displayName: '水平置中偏移',
    visible: function (this: WidgetParameter) {
      return this.isAlignHorizontalCenter;
    },
  })
  public horizontalCenter = 0;

  @property({displayName: '垂直置中'})
  public isAlignVerticalCenter = false;
  @property({
    displayName: '垂直置中偏移',
    visible: function (this: WidgetParameter) {
      return this.isAlignVerticalCenter;
    },
  })
  public verticalCenter = 0;
}
