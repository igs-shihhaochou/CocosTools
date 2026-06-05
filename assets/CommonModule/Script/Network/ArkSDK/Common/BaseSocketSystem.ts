import ArkSocketClient from '../ArkSocketClient';

export default class BaseSocketSystem {
  protected arkSocketClient: ArkSocketClient = null;
  protected systemName = '';
  public cmdDict: JSON = <JSON>{};

  constructor(arkSocketClient: ArkSocketClient, systemName: string) {
    this.arkSocketClient = arkSocketClient;
    this.systemName = systemName;
    this.arkSocketClient.systemDict[this.systemName] = this;
  }

  public release() {
    if (this.arkSocketClient !== null) this.arkSocketClient.close(true);
    this.arkSocketClient = null;
    this.cmdDict = null;
  }

  protected registerCmdCallback(
    cmdName: string,
    callback: (
      result: number,
      data: JSON,
      ret: string,
      sn: number,
      sys: string,
      cmd: string,
      processTimeMs?: number
    ) => void
  ) {
    this.cmdDict[cmdName] = callback;
  }

  protected sendCmd(cmdName: string, cmdData?: JSON, isReturn?: boolean) {
    let callback = null;
    if (isReturn) callback = this.cmdDict[cmdName];
    if (this.arkSocketClient !== null)
      this.arkSocketClient.sendCmd(this.systemName, cmdName, cmdData, callback);
  }
}
