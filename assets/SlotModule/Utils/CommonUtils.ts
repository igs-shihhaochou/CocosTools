import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import Functions from '../../CommonModule/Script/Utility/Functions';

const convertNumText = (value: number) => {
  const {displayDigit, displayRatio} = PlatformData.instance;
  switch (PlatformData.logo) {
    case 'playgd':
    case 'magiccity':
      return Functions.numberFormat(value, 0, true);
    default:
      return Functions.numberFormat(
        value,
        displayDigit,
        true,
        '',
        displayRatio,
        false,
        true
      );
  }
};

const convertFeatureNumText = (value: number) => {
  const {displayDigit, displayRatio} = PlatformData.instance;
  switch (PlatformData.logo) {
    case 'playgd':
    case 'magiccity':
      return Functions.numberFormat(value, 0, true);
    default:
      return Functions.formatKMBNumber(
        value * displayRatio,
        displayDigit > 2 ? displayDigit : 2,
        true
      );
  }
};

export {convertNumText, convertFeatureNumText};
