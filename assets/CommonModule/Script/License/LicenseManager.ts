import {PlatformData} from '../Define/PlatformData';
import {
  CertAreaList,
  CertIdList,
  GetSetting,
  SwitchOffKeyDefine,
  CLIENTMODE_ID,
  IClientMode,
  GetClientMode,
} from './LicenseSetting';
import {defaultLicenseSetting} from '../Type/LicenseSettingDefine';

/**
 * 檢查SwitchOff設定是否符合認證
 * @param certId 認證機構
 * @param certArea 認證地區
 * @param serverSwitchList 平台提供的的SwitchOff設定
 * @returns 檢查過的SwitchOff設定
 */
export function CheckSwitchOff(
  certId: number,
  certArea: number,
  serverSwitchList: number[]
): number[] {
  if (certId > CertIdList.None && certArea > CertAreaList.None) {
    const setting = GetSetting(certId, certArea);
    setting.forEach((value: number) => {
      if (!serverSwitchList.includes(value)) {
        serverSwitchList.push(value);
      }
    });
  }
  return serverSwitchList;
}

export function CheckClientMode(
  certId: number,
  certArea: number,
  serverClientModeSets: IClientMode[] = []
): IClientMode[] {
  if (certId > CertIdList.None && certArea > CertAreaList.None) {
    if (serverClientModeSets.length === 0) {
      serverClientModeSets = GetClientMode(certId, certArea);
    } else {
      const setting: IClientMode[] = GetClientMode(certId, certArea);
      setting.forEach((set: IClientMode) => {
        let isExist = false;
        for (let i = 0; i < serverClientModeSets.length; i++) {
          if (serverClientModeSets[i].eventId === set.eventId) {
            isExist = true;
            serverClientModeSets[i].value = set.value;
            break;
          }
        }
        if (!isExist) {
          serverClientModeSets.push(set);
        }
      });
    }
  }
  return serverClientModeSets;
}

export function SetLicenseSetting(serverSwitchList: number[]) {
  const {certArea, certId} = PlatformData;
  const Id = Number(certId);
  const Area = Number(certArea);
  console.log('GetLicenseSetting', certArea, certId, serverSwitchList);
  const resultSwitchOffList = CheckSwitchOff(Id, Area, serverSwitchList);

  PlatformData.licenseSetting = defaultLicenseSetting;

  for (const settingName of resultSwitchOffList) {
    PlatformData.licenseSetting[SwitchOffKeyDefine[settingName]] = true;
  }

  let clientModeList: IClientMode[] = PlatformData.userSetting.FuncMode;
  clientModeList = CheckClientMode(Id, Area, clientModeList);
  for (const clientMode of clientModeList) {
    const {eventId, value} = clientMode;
    PlatformData.licenseClientModeSetting[CLIENTMODE_ID[eventId]] = value;
  }

  console.log('LicenseSetting:', PlatformData.licenseSetting);

  console.log(
    'LicenseSettingClientModeSetting:',
    PlatformData.licenseClientModeSetting
  );
}
