import {IClientMode} from '../License/LicenseSetting';

export type UserSetting = {
  ShowCurrency: string;
  ShowFloatPrecision: number;
  FuncSwitch: number[];
  FuncMode: IClientMode[];
  clientTheme: string;
  CertArea: string;
  CertId: string;
  Wallets?: Wallet[];
  game_id?: string;
  game_name?: string;
  isShowDonate?: boolean;
  isUseScoreBox?: boolean;
  kiosk_id?: string;
  pin_id?: string;
  prizeViewerMode?: number;
  prizeViewerSec?: number;
  theme_id?: string;
  decimalFormat?: string;
  jpIsMoneyFormat?: boolean;
  jpRatio?: number;
  realDecimalPlaces?: number;
  showGameLog?: boolean;
  showFullScreen?: boolean;
  showBackpack?: boolean;
  showProfile?: boolean;
  ShowBetInfo?: boolean;
  ShowBtnInfo?: boolean;
  ShareUrl?: string;
  ShareWinType?: number[]; //-1(max),4(big),5(mega),6(super)
  ShowInGameShare?: boolean;
  PromoteId?: string;
};

type Wallet = {
  balance?: number;
  currency?: string;
  type?: string;
};
