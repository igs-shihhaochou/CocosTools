import {_decorator, Component, Node} from 'cc';
const {ccclass, property} = _decorator;

import {MultLang, LangType} from './MultLang';

@ccclass('MultLangBehaviour')
export class MultLangBehaviour extends Component {
  @property(Node)
  public en: Node | null = null;
  @property(Node)
  public chs: Node | null = null;
  @property(Node)
  public ms: Node | null = null;
  @property(Node)
  public th: Node | null = null;
  @property(Node)
  public vi: Node | null = null;
  @property(Node)
  public id: Node | null = null;
  @property(Node)
  public my: Node | null = null;
  @property(Node)
  public es: Node | null = null;
  @property(Node)
  public pt: Node | null = null;
  @property(Node)
  public it: Node | null = null;
  @property(Node)
  public sv: Node | null = null;
  @property(Node)
  public ro: Node | null = null;
  @property(Node)
  public gr: Node | null = null;
  @property(Node)
  public fr: Node | null = null;
  @property(Node)
  public zh: Node | null = null;
  @property(Node)
  public ja: Node | null = null;
  @property(Node)
  public ko: Node | null = null;
  @property(Node)
  public hi: Node | null = null;
  @property(Node)
  public ta: Node | null = null;
  @property(Node)
  public bn: Node | null = null;
  @property(Node)
  public ur: Node | null = null;
  @property(Node)
  public de: Node | null = null;
  @property(Node)
  public nl: Node | null = null;
  @property(Node)
  public da: Node | null = null;
  @property(Node)
  public tr: Node | null = null;
  @property(Node)
  public ru: Node | null = null;

  public objList: Node[] = [];
  onLoad() {
    this.objList.push(this.en);
    this.objList.push(this.chs);
    this.objList.push(this.ms);
    this.objList.push(this.th);
    this.objList.push(this.vi);
    this.objList.push(this.id);
    this.objList.push(this.my);
    this.objList.push(this.es);
    this.objList.push(this.pt);
    this.objList.push(this.it);
    this.objList.push(this.sv);
    this.objList.push(this.ro);
    this.objList.push(this.gr);
    this.objList.push(this.fr);
    this.objList.push(this.zh);
    this.objList.push(this.ja);
    this.objList.push(this.ko);
    this.objList.push(this.hi);
    this.objList.push(this.ta);
    this.objList.push(this.bn);
    this.objList.push(this.ur);
    this.objList.push(this.de);
    this.objList.push(this.nl);
    this.objList.push(this.da);
    this.objList.push(this.tr);
    this.objList.push(this.ru);
  }
  onEnable() {
    if (this.objList === null || this.objList.length === 0) return;
    const iLangType = Number(MultLang.nowLangType);
    for (let i = 0; i < this.objList.length; i++) {
      if (this.objList[i] !== null) {
        this.objList[i].active = false;
      }
    }
    if (this.objList[iLangType] !== null) {
      this.objList[iLangType].active = true;
    }
    //啟用預設語系
    else {
      this.objList[0].active = true;
    }
  }
  // 針對 MultLangBehaviour 語系開關沒設定的做配對參考
  public autoReference(): void {
    const objList: Node[] = [];
    const objs: Node[] = this.node.children;

    for (let i = 0; i < Object.keys(LangType).length; i++) {
      objList.push(null);
    }
    if (objs !== null) {
      for (let i = 0; i < objs.length; i++) {
        // 只找父物件是Component下的第一層
        if (objs[i].parent === this.node) {
          const iLangType: number = this.findLangType(objs[i]);
          if (iLangType === -1) {
            // 不符合語系字尾
            continue;
          }
          if (iLangType < objList.length) {
            objList[iLangType] = objs[i];
          }
        }
      }
      for (let i = 0; i < objList.length && i < this.objList.length; i++) {
        if (objList[i] !== null && this.objList[i] === null) {
          this.objList[i] = objList[i];
        }
      }
    }
  }
  private findLangType(go: Node): number {
    let iLangType = -1;
    for (let i = 0; i < Object.keys(LangType).length; i++) {
      const strName: string = go.name.toLowerCase();
      const strMatch: string = '_' + (i as LangType).toString().toLowerCase();
      if (strName.includes(strMatch)) {
        iLangType = i;
        break;
      }
    }
    return iLangType;
  }
}
