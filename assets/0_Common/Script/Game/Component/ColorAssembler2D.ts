import {
  _decorator,
  Component,
  Enum,
  Color,
  Director,
  UIRenderer,
  Sprite,
} from 'cc';
const {ccclass, property, menu} = _decorator;

/** 漸變類型 */
enum enumGradientType {
  VERTEX,
  HORIZONTAL,
  VERTICAL,
}
/**
 * 漸變色
 * 支援Sprite、Label
 */
//kyy to do
@ccclass('ColorAssembler2D')
@menu('0_Common/Game/Component/ColorAssembler2D')
export default class ColorAssembler2D extends Component {
  @property({type: Enum(enumGradientType)})
  private gradientType: enumGradientType = enumGradientType.VERTEX;
  @property([Color])
  public get colors() {
    return this._colors;
  }
  public set colors(colors) {
    this._colors = colors;
    this._updateColors();
  }
  @property([Color])
  private _colors: Array<Color> = new Array<Color>();
  onEnable() {
    cc.director.once(Director.EVENT_AFTER_DRAW, this._updateColors, this);
  }
  onDisable() {
    cc.director.off(Director.EVENT_AFTER_DRAW, this._updateColors, this);
    this.node['_renderFlag'] |= cc['RenderFlow'].FLAG_COLOR;
  }
  update() {
    this._updateColors();
  }
  private _updateColors() {
    const cmp = this.getComponent(UIRenderer);
    if (!cmp) return;
    const _assembler = cmp['_assembler'];
    if (!(_assembler instanceof cc['Assembler2D'])) return;
    const uintVerts = _assembler._renderData.uintVDatas[0];
    if (!uintVerts) return;
    const color = this.node.getComponent(Sprite).color;
    const floatsPerVert = _assembler.floatsPerVert;
    const colorOffset = _assembler.colorOffset;
    let count = 0;
    switch (this.gradientType) {
      case enumGradientType.VERTEX:
        for (
          let i = colorOffset, l = uintVerts.length;
          i < l;
          i += floatsPerVert
        ) {
          uintVerts[i] = (this.colors[count++] || color)['_val'];
        }
        break;
      case enumGradientType.HORIZONTAL:
        //TODO: 改寫為水平漸變
        for (
          let i = colorOffset, l = uintVerts.length;
          i < l;
          i += floatsPerVert
        ) {
          uintVerts[i] = (this.colors[count++] || color)['_val'];
        }
        break;
      case enumGradientType.VERTICAL:
        //TODO: 改寫為垂直漸變
        for (
          let i = colorOffset, l = uintVerts.length;
          i < l;
          i += floatsPerVert
        ) {
          uintVerts[i] = (this.colors[count++] || color)['_val'];
        }
        break;
    }
  }
}
