import ArkClient from '../ArkClient';

export default class BaseHttpSystem {
  protected arkClient: ArkClient = null;
  protected systemName = '';
  public cmdDict: JSON = <JSON>{};

  constructor(_arkClient: ArkClient, systemName: string) {
    this.arkClient = _arkClient;
    this.systemName = systemName;
  }

  public release() {
    this.arkClient = null;
    this.cmdDict = null;
  }

  protected registerCmdCallback(
    cmdName: string,
    callback: (result: number, cmdData: JSON, processTimeMs?: number) => void
  ) {
    this.cmdDict[cmdName] = callback;
  }

  protected sendCmd(cmdName: string, cmdData?: JSON) {
    const callback = this.cmdDict[cmdName];
    if (this.arkClient !== null)
      this.arkClient.sendCmd(this.systemName, cmdName, cmdData, callback);
  }
}
