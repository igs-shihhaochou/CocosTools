import type {NumberSliderData} from '../../Components/NumberSlider';

export type AutoSpinPickerData = {
  numberOfSpins: number[];
  selectedNumberOfSpins: number;
  stopOnSpecialFeatureWin: boolean;
  showAdvanced: boolean;
  singleWinExceeds: number;
  takeProfitLimit: number;
  takeLossLimit: number;
  singleWinExceedsSetting: NumberSliderData;
  takeProfitLimitSetting: NumberSliderData;
  takeLossLimitSetting: NumberSliderData;
  showCounter: boolean;
  showAutoAdvance: boolean;
};

export const defautAutoSpinPickerData: AutoSpinPickerData = {
  numberOfSpins: [2, 25, 50, 100, 200, 500, 1000, -1],
  selectedNumberOfSpins: 2,
  stopOnSpecialFeatureWin: false,
  showAdvanced: false,
  singleWinExceeds: 0,
  takeProfitLimit: 0,
  takeLossLimit: 0,
  singleWinExceedsSetting: {
    min: 0,
    max: 100,
    section: 100,
    currentValue: 0,
    isMultiplyer: true,
  },
  takeProfitLimitSetting: {
    min: 100,
    max: 10000,
    section: 10,
    currentValue: 0,
    isMultiplyer: false,
  },
  takeLossLimitSetting: {
    min: 100,
    max: 10000,
    section: 20,
    currentValue: 0,
    isMultiplyer: false,
  },
  showCounter: true,
  showAutoAdvance: true,
};

export type AutoSpinPickerCookieData = {
  selectedNumberOfSpins: number;
  stopOnSpecialFeatureWin: boolean;
  showAdvanced: boolean;
  singleWinExceeds: number;
  takeProfitLimit: number;
  takeLossLimit: number;
};
