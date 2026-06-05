/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import ArkClient from '../../../../CommonModule/Script/Network/ArkSDK/ArkClient';
import ArkSocketClient from '../../../../CommonModule/Script/Network/ArkSDK/ArkSocketClient';
import BaseSocketSystem from '../../../../CommonModule/Script/Network/ArkSDK/Common/BaseSocketSystem';

export default class BaseLocalServer {
  /** 本機是否為啟用狀態 */
  protected static isActive = false;
  /** 是否為啟用狀態 */
  public static isactive(): boolean {
    return BaseLocalServer.isActive;
  }

  /** 各處理系統 */
  public systemDict: Object = null;
  /** 本機測試用ArkClient */
  public localArkClient: LocalArkClient = null;
  /** 本機測試用ArkSocketClient */
  public localArkSocketClient: LocalArkSocketClient = null;

  /** 模擬網路延遲 */
  protected cmdDelay = 300;

  constructor() {
    this.systemDict = {};

    this.localArkClient = new LocalArkClient(this);
    this.localArkSocketClient = new LocalArkSocketClient(this);
  }

  /**
   * 釋放LocalServer資源
   */
  public release() {
    BaseLocalServer.isActive = false;

    if (this.systemDict !== null) delete this.systemDict;
    this.systemDict = null;
    this.localArkClient = null;
    this.localArkSocketClient = null;
  }

  /**
   * 更新本機處理
   * @param deltaTime 更新間隔時間 (秒)
   */
  public update() {
    if (!BaseLocalServer.isActive) return;
  }

  /**
   * 連接啟用本機處理
   */
  public connect() {
    BaseLocalServer.isActive = true;
  }

  /**
   * 接收命令
   * @param sysName
   * @param cmdName
   * @param cmdData
   */
  public receive(sysName: string, cmdName: string, cmdData?: JSON) {
    if (!BaseLocalServer.isActive) return;

    const serverSystem: ServerBaseSystem = this.systemDict[sysName];
    if (!serverSystem) {
      console.warn('[LocalServer] Receive: Server %s system is null', sysName);
      return;
    }
    const serverCmdCallback: Function = serverSystem.cmdDict[cmdName];
    if (!serverCmdCallback) {
      console.warn(
        '[LocalServer] Receive: Server %s system: command %s is null',
        sysName,
        cmdName
      );
      return;
    }

    serverCmdCallback(cmdData);
  }

  /**
   * 發送命令
   * @param sys
   * @param cmd
   * @param result
   * @param cmd_data
   * @param process_time_ms
   */
  public sendToArkClient(
    sys: string,
    cmd: string,
    result: number,
    cmd_data: JSON,
    process_time_ms?: number
  ) {
    if (!BaseLocalServer.isActive) return;

    setTimeout(() => {
      if (this.localArkClient !== null)
        this.localArkClient.recvCmd(
          sys,
          cmd,
          result,
          cmd_data,
          process_time_ms
        );
    }, this.cmdDelay);
  }

  /**
   * 發送命令
   * @param result
   * @param data
   * @param ret
   * @param sn
   * @param sys
   * @param cmd
   * @param process_time_ms
   */
  public sendToArkSocketClient(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ) {
    if (!BaseLocalServer.isActive) return;

    setTimeout(() => {
      if (this.localArkSocketClient !== null)
        this.localArkSocketClient.recvCmd(
          result,
          data,
          ret,
          sn,
          sys,
          cmd,
          process_time_ms
        );
    }, this.cmdDelay);
  }
}

class LocalArkClient extends ArkClient {
  /** 本機 */
  private localServer: BaseLocalServer = null;
  /** systemCmdDict (ex: sysName_cmdName: callback) */
  private sysCmdDict: {} = {};

  /**
   * 本機ArkClient建構
   * @param localServer
   */
  constructor(localServer: BaseLocalServer) {
    super('');

    this.localServer = localServer;
  }

  /**
   * 接收本機命令
   * @param sys
   * @param cmd
   * @param result
   * @param cmd_data
   * @param process_time_ms
   */
  public recvCmd(
    sys: string,
    cmd: string,
    result: number,
    cmd_data: JSON,
    process_time_ms?: number
  ) {
    const clientCmdCallback: Function = this.sysCmdDict[sys + '_' + cmd];
    if (!clientCmdCallback) {
      console.warn(
        '[LocalArkClient] Http RecvCmd Client %s system: command %s is null',
        sys,
        cmd
      );
      return;
    }
    clientCmdCallback(result, cmd_data, process_time_ms);
  }

  /**
   * 發送命令至本機
   * @param cmd_id
   * @param cmd_name
   * @param cmd_data
   * @param callback
   */
  public override async sendCmd(
    cmd_id: string,
    cmd_name: string,
    cmd_data?: JSON,
    callback?: (
      result: number,
      cmd_data: JSON,
      process_time_ms?: number
    ) => void
  ) {
    //記錄系統命令的callback
    this.sysCmdDict[cmd_id + '_' + cmd_name] = callback;

    this.localServer.receive(cmd_id, cmd_name, cmd_data);
  }
}

class LocalArkSocketClient extends ArkSocketClient {
  /** 本機 */
  private localServer: BaseLocalServer = null;

  /**
   * 本機ArkSocketClient建構
   * @param localServer
   */
  constructor(localServer: BaseLocalServer) {
    super();
    this._systemDict = {} as JSON;
    this.localServer = localServer;
  }

  /**
   * 接收本機命令
   * @param result
   * @param data
   * @param ret
   * @param sn
   * @param sys
   * @param cmd
   * @param process_time_ms
   */
  public recvCmd(
    result: number,
    data: JSON,
    ret: string,
    sn: number,
    sys: string,
    cmd: string,
    process_time_ms?: number
  ) {
    const clientSystem: BaseSocketSystem = this.systemDict[sys];
    if (!clientSystem) {
      console.warn(
        '[LocalArkSocketClient] Socket RecvCmd Client %s system is null',
        sys
      );
      return;
    }
    const clientCmdCallback: Function = clientSystem.cmdDict[cmd];
    if (!clientCmdCallback) {
      console.warn(
        '[LocalArkSocketClient] Socket RecvCmd Client %s system: command %s is null',
        sys,
        cmd
      );
      return;
    }

    clientCmdCallback(result, data, ret, sn, sys, cmd, process_time_ms);
  }

  /**
   * 發送命令至本機
   * @param cmd_id
   * @param cmd_name
   * @param cmd_data
   * @param callback
   */
  public override async sendCmd(
    cmd_id: string,
    cmd_name: string,
    cmd_data?: JSON,
    callback?: (
      result: number,
      data: JSON,
      ret: string,
      sn: number,
      sys: string,
      cmd: string,
      process_time_ms?: number
    ) => void
  ) {
    this.localServer.receive(cmd_id, cmd_name, cmd_data);
  }
}

export class ServerBaseSystem {
  protected _server: BaseLocalServer = null;
  public get server(): BaseLocalServer {
    return this._server;
  }
  protected _systemName: string = null;
  public get systemName(): string {
    return this._systemName;
  }
  public cmdDict: Object = null;

  constructor(server: BaseLocalServer, systemName: string) {
    this._server = server;
    this._systemName = systemName;
    this._server.systemDict[this.systemName] = this;

    this.cmdDict = {};
  }

  public release() {
    if (this.cmdDict !== null) delete this.cmdDict;
    this.cmdDict = null;

    this._server = null;
  }

  public registerCmd(cmdName: string, callback: (cmdData: JSON) => void) {
    this.cmdDict[cmdName] = callback.bind(this);
  }
}
