/* eslint-disable camelcase */
import {_decorator, Sprite, Node} from 'cc';
import {SymbolInfomation} from '../../SlotModule/Define/SlotGameData';
import {Symbol} from '../../SlotModule/Wheel/Symbol';
import {S202_SymbolID} from './Define';

const {ccclass, property} = _decorator;

@ccclass
export default class S202_Symbol extends Symbol {
  @property(Sprite)
  public sprite: Sprite = null;


  public static isGolden(id: number): boolean {
    return id >= S202_SymbolID.GoldAce && id <= S202_SymbolID.GoldClub;
  }

  public static isNormal(id: number): boolean {
    return id >= S202_SymbolID.Ace && id <= S202_SymbolID.Club;
  }

  public static isJoker(id: number): boolean {
    return this.isBigJoker(id) || this.isSmallJoker(id);
  }

  public static isBigJoker(id: number): boolean {
    return id === S202_SymbolID.BigJoker;
  }

  public static isSmallJoker(id: number): boolean {
    return id === S202_SymbolID.SmallJoker;
  }

  public get isGolden(): boolean {
    return S202_Symbol.isGolden(this.symbolInfo.symbolID);
  }

  public get isNormal(): boolean {
    return S202_Symbol.isNormal(this.symbolInfo.symbolID);
  }

  public get isJoker(): boolean {
    return S202_Symbol.isJoker(this.symbolInfo.symbolID);
  }

  public get isBigJoker(): boolean {
    return S202_Symbol.isBigJoker(this.symbolInfo.symbolID);
  }

  public get isSmallJoker(): boolean {
    return S202_Symbol.isSmallJoker(this.symbolInfo.symbolID);
  }

  // Overwrite 避免Sprite 被換成 null
  protected onLoad(): void {}

  public changeSymbol(_info: SymbolInfomation) {
    if (_info === null || _info === undefined) {
      console.error('ChangeSymbol Info Is Null');
      return;
    }
    super.changeSymbol(_info);
  }
}
