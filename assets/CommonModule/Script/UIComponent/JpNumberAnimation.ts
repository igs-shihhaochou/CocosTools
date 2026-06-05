import {_decorator} from 'cc';
const {ccclass} = _decorator;

import {PlatformData} from '../Define/PlatformData';
import {NumberAnimation} from './NumberAnimation';
import {UIModuleType} from '../Type/CommonDefine';

@ccclass('JpNumberAnimation')
export class JpNumberAnimation extends NumberAnimation {
  public onLoad(): void {
    //強制設定
    this.isInteger = false;
    this.isRatio = true;
    this.isKMBFormat = false;
    this.isMoney = false;
    this.showThousandPlaces = true;
    this.showCurrencyName = false;
    this.discardDecimalZero = false;
    this.chopOff = true;

    //isMoney 各市場不一致
    switch (PlatformData.logo) {
      case 'playgd':
      case 'magiccity':
        this.isMoney = true;
        break;
      default:
        //SSSAPI SS站台
        if (PlatformData.uiModuleType === UIModuleType.SWEEPSTAKES) {
          this.isMoney = true;
        }
        break;
    }
    super.onLoad();
  }
  protected getCurrencySetting() {
    const {displayRealDigit, displayRealRatio, showThousandPlaces} =
      PlatformData.instance;

    const {displayDigit, displayRatio} = PlatformData.instance;

    return {
      displayDigit: displayRealDigit ? displayRealDigit : displayDigit,
      displayRatio: displayRealRatio ? displayRealRatio : displayRatio,
      showThousandPlaces: showThousandPlaces,
    };
  }
}
