import LocalServer from '../LocalServer';

export default class BaseSystem {
  arkClient = null;
  systemName = '';
  cmdDict = {};

  constructor(_arkClient, _systemName: string) {
    this.arkClient = _arkClient;
    this.systemName = _systemName;
  }

  registerCmdCallback(
    cmdName: string,
    callback: (result: number, cmd_data: JSON) => void
  ) {
    this.cmdDict[cmdName] = callback;
  }

  sendCmd(cmdName: string, cmdData = {}) {
    const callback = this.cmdDict[cmdName];
    if (this.arkClient !== null)
      this.arkClient.send_cmd(this.systemName, cmdName, cmdData, callback);
    else
      LocalServer.Instance.Command(this.systemName, cmdName, cmdData, callback);
  }

  sendDrtCmd(cmdName: string, cmdData?: JSON) {
    const callback = this.cmdDict[cmdName];
    this.arkClient.send_drt_cmd(this.systemName, cmdName, cmdData, callback);
  }
}
