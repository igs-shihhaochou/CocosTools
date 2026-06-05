import {_decorator, Enum, CCInteger, SpriteFrame, Component, error} from 'cc';
const {ccclass, property} = _decorator;

import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {SymbolType, SymbolInfomation} from '../Define/SlotGameData';
import {SlotGameMediator} from '../Define/SlotGameMediator';

/// <summary>
/// 設定Symbol ID以及對應的Symbol Sprite ID
/// 通常跟著WheelController
/// </summary>
@ccclass('SymbolSettingItem')
export class SymbolSettingItem {
  @property({type: Enum(SymbolType)})
  public symbolType: SymbolType = SymbolType.Normal;
  @property(CCInteger)
  public symbolID = 0;
  @property(SpriteFrame)
  public spriteFrame: SpriteFrame | null = null;
}
@ccclass('SymbolSetting')
export class SymbolSetting extends Component {
  /// <summary> Symbol Sprite ID correspond with Symbol ID(Server) </summary>
  @property([SymbolSettingItem])
  public symbolIDAry: SymbolSettingItem[] = [];

  public onLoad() {
    SlotGameMediator.instance.symbolSetting = this;
  }

  public checkSymbolType(symbolId: number): SymbolType {
    let _item: SymbolSettingItem = null;
    for (let i = 0; i < this.symbolIDAry.length; i++) {
      if (this.symbolIDAry[i].symbolID === symbolId) {
        _item = this.symbolIDAry[i];
        break;
      }
    }
    if (_item) return _item.symbolType;
    return SymbolType.Normal;
  }

  public checkSymbolSpriteIndex(symbolId: number): number {
    let _index = -1;
    for (let i = 0; i < this.symbolIDAry.length; i++) {
      if (this.symbolIDAry[i].symbolID === symbolId) {
        _index = i;
        break;
      }
    }
    if (_index === -1) {
      if (Define.DEBUG_LOG)
        error('Error! Symbol ' + symbolId + ' is no Sprite!');
    }
    return _index;
  }

  /// <summary>
  /// 用symbolID創造Symbol的info
  /// </summary>
  /// <param name="symbolId"></param>
  /// <returns></returns>
  public createSymbolInfo(symbolId: number): SymbolInfomation {
    let _item: SymbolSettingItem = null;
    for (let i = 0; i < this.symbolIDAry.length; i++) {
      if (this.symbolIDAry[i].symbolID === symbolId) {
        _item = this.symbolIDAry[i];
        break;
      }
    }
    if (_item) {
      const _index: number = this.symbolIDAry.findIndex(x => {
        return x.symbolID === symbolId;
      });
      return new SymbolInfomation(_item.symbolType, _index, symbolId);
    }
    return null;
  }

  //id取得圖片資源
  public getSpriteFramebyId(symbolId: number): SpriteFrame {
    const info: SymbolSettingItem = this.symbolIDAry.find(
      x => x.symbolID === symbolId
    );
    if (info) {
      return info.spriteFrame;
    } else {
      if (Define.DEBUG_LOG)
        console.error('Error! SymbolId ' + symbolId + ' is no Sprite!');
      return null;
    }
  }

  //index取得圖片資源
  public getSpriteFramebyIndex(symbolIndex: number): SpriteFrame {
    const info: SymbolSettingItem = this.symbolIDAry[symbolIndex];
    if (info) {
      return info.spriteFrame;
    } else {
      if (Define.DEBUG_LOG)
        error('Error! SymbolIndex ' + symbolIndex + ' is no Sprite!');
      return null;
    }
  }
}
