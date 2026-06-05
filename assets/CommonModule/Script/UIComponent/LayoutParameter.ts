import {Enum, Layout, _decorator} from 'cc';
const {property, ccclass} = _decorator;

export enum LayoutType {
  NONE = 0,
  HORIZONTAL,
  VERTICAL,
  GRID,
}

export enum HorizontalDirection {
  LEFT_TO_RIGHT = 0,
  RIGHT_TO_LEFT,
}

export enum VerticalDirection {
  TOP_TO_BOTTOM = 0,
  BOTTOM_TO_TOP,
}

@ccclass('LayoutParameter')
export class LayoutParameter {
  @property({type: Enum(LayoutType), displayName: 'Layout 種類'})
  public type: LayoutType = LayoutType.NONE;
  @property({
    displayName: '左邊 Padding',
    visible: function (this: LayoutParameter) {
      return (
        this.type === LayoutType.HORIZONTAL || this.type === LayoutType.GRID
      );
    },
  })
  public paddingLeft = 0;
  @property({
    displayName: '右邊 Padding',
    visible: function (this: LayoutParameter) {
      return (
        this.type === LayoutType.HORIZONTAL || this.type === LayoutType.GRID
      );
    },
  })
  public paddingRight = 0;
  @property({
    displayName: '上方 Padding',
    visible: function (this: LayoutParameter) {
      return this.type === LayoutType.VERTICAL || this.type === LayoutType.GRID;
    },
  })
  public paddingTop = 0;
  @property({
    displayName: '下方 Padding',
    visible: function (this: LayoutParameter) {
      return this.type === LayoutType.VERTICAL || this.type === LayoutType.GRID;
    },
  })
  public paddingBottom = 0;
  @property({
    displayName: 'X 方向間隔',
    visible: function (this: LayoutParameter) {
      return (
        this.type === LayoutType.HORIZONTAL || this.type === LayoutType.GRID
      );
    },
  })
  public spacingX = 0;
  @property({
    displayName: 'Y 方向間隔',
    visible: function (this: LayoutParameter) {
      return this.type === LayoutType.VERTICAL || this.type === LayoutType.GRID;
    },
  })
  public spacingY = 0;
  @property({
    type: Enum(Layout.HorizontalDirection),
    displayName: '橫向排列方向',
    visible: function (this: LayoutParameter) {
      return (
        this.type === LayoutType.HORIZONTAL || this.type === LayoutType.GRID
      );
    },
  })
  public horizontalDirection: HorizontalDirection =
    HorizontalDirection.LEFT_TO_RIGHT;
  @property({
    type: Enum(Layout.VerticalDirection),
    displayName: '直向排列方向',
    visible: function (this: LayoutParameter) {
      return this.type === LayoutType.VERTICAL || this.type === LayoutType.GRID;
    },
  })
  public verticalDirection: VerticalDirection = VerticalDirection.TOP_TO_BOTTOM;
}
