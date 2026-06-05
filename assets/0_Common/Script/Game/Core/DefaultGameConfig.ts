/* eslint-disable no-var */
import {BUILD} from 'cc/env';
import type {GameConfigFormat} from 'db://assets/CommonModule/Script/Type/CommonDefine';
export const initGameConfig = () => {
  const gameConfig: GameConfigFormat = {
    RootBundle: '_Root',
    GameInfo: '../GameInfo/',
    GameLog: '../../../GameLog/%version/GameLog/index.html',
    RemoteResources: '../../../_RemoteResources/',
    ErrorCodeXmlName: 'ErrorCodeStringTable',
  };
  if (!BUILD) {
    gameConfig.GameInfo = './GameInfo/';
    gameConfig.GameLog = './GameLog/index.html';
    gameConfig.RemoteResources = './_RemoteResources/';
  }
  return gameConfig;
};

export const initCurrencyConfig = () => {
  return {
    Default: 'CNY',
    CNY: {
      Name: 'RMB',
      Sign: '$',
      Ratio: 1,
      Decimal: 2,
    },
    MYR: {
      Name: 'MYR',
      Sign: '$',
      Ratio: 1,
      Decimal: 2,
    },
    THB: {
      Name: 'THB',
      Sign: '$',
      Ratio: 1,
      Decimal: 2,
    },
    KVND: {
      Name: 'KVND',
      Sign: '$',
      Ratio: 1,
      Decimal: 2,
    },
    KIDR: {
      Name: 'KIDR',
      Sign: '$',
      Ratio: 1,
      Decimal: 2,
    },
    MMK: {
      Name: 'MMK',
      Sign: '$',
      Ratio: 1,
      Decimal: 2,
    },
    USD: {
      Name: 'USD',
      Sign: '$',
      Ratio: 1,
      Decimal: 3,
    },
    Q: {
      Name: 'Points',
      Sign: ' ',
      Ratio: 1,
      Decimal: 0,
    },
    Coin: {
      Name: 'Coin',
      Sign: ' ',
      Ratio: 1,
      Decimal: 0,
    },
    EUR: {
      Name: 'EUR',
      Sign: '€',
      Ratio: 0.01,
      Decimal: 2,
    },
    BRL: {
      Name: 'BRL',
      Sign: 'R$',
      Ratio: 0.01,
      Decimal: 2,
    },
    SEK: {
      Name: 'SEK',
      Sign: 'kr',
      Ratio: 0.01,
      Decimal: 2,
    },
    CAD: {
      Name: 'CAD',
      Sign: 'C$',
      Ratio: 0.01,
      Decimal: 2,
    },
    RON: {
      Name: 'RON',
      Sign: 'L',
      Ratio: 0.01,
      Decimal: 2,
    },
    GBP: {
      Name: 'GBP',
      Sign: '£',
      Ratio: 0.01,
      Decimal: 2,
    },
  };
};

export const initBundleConfig = () => {
  /** 共用動態加載 Bundle設定 */
  return {
    CommonLoadingScreen: {
      Name: 'CommonDynamicUI',
      Weight: 1,
      MultiLang: false,
    },
    CommonMessageBox: {
      Name: 'CommonDynamicUI',
      Weight: 1,
      MultiLang: false,
    },
    // CommonMultiLang: {
    //   /** Bundle名稱 */
    //   Name: 'CommonMultiLang',
    //   /** Bundle載入進度權重 */
    //   Weight: 1,
    //   /** 是否支援多語系 */
    //   MultiLang: true,
    // },
  };
};
