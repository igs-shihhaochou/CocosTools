import {ClickLogSystemCommand} from './Command/ClickLogSystemCommand';
import {ClickLogSystemDataInterface} from './DataInterface/ClickLogSystemDataInterface';

export namespace CommonNetwork {
  export namespace ClickLogSystem {
    export const SystemName = ClickLogSystemCommand.SystemName;
    export const Command = ClickLogSystemCommand.Command;

    export namespace DataInterface {
      export type C2SGetSetting = ClickLogSystemDataInterface.C2SGetSetting;
      export type C2SClientLog = ClickLogSystemDataInterface.C2SClientLog;

      export type S2CGetSettingResponse =
        ClickLogSystemDataInterface.S2CGetSettingResponse;
      export type S2CLogResponse = ClickLogSystemDataInterface.S2CLogResponse;

      export namespace SubDataStruct {
        export type C2SLog = ClickLogSystemDataInterface.SubDataStruct.C2SLog;
        export type C2SSetting =
          ClickLogSystemDataInterface.SubDataStruct.C2SSetting;
      }
    }
  }
}
