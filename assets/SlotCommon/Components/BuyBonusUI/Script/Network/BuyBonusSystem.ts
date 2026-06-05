import BaseArkSystem, {
  ReturnCommandData,
} from '../../../../../CommonModule/Script/Network/System/BaseArkSystem';
import HttpConnect from '../../../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import GameErrorCode from '../../../../../CommonModule/Script/Core/GameErrorCode';
import {PlatformGDK} from '../../../../../CommonModule/Script/Platform/PlatformGDK';
import {PlatformData} from '../../../../../CommonModule/Script/Define/PlatformData';
import {BuyBonusNetwork} from './BuyBonusNetworkModule';
import {BuyBonusSystemCommand} from './BuyBonusSystemCommand';
import {BuyBonusDataInterface} from './BuyBonusDataInterface';

export default class BuyBonusSystem extends BaseArkSystem {
  /** 命令協定 */
  private commandProtocol: BuyBonusCommandProtocol = {
    GetInfo: BuyBonusSystemCommand.C2SCommand.GetInfo,
    BonusSpin: BuyBonusSystemCommand.C2SCommand.BonusSpin,
    StartGame: BuyBonusSystemCommand.C2SCommand.StartGame,
  };

  constructor() {
    super(BuyBonusSystemCommand.SystemName);

    // 根據PlatformData.useApiServer來決定使用的命令協定
    if (PlatformData.useApiServer) {
      this.setNewCmdName();
    }
  }

  public setNewCmdName() {
    this.commandProtocol = {
      GetInfo: BuyBonusSystemCommand.C2SCommandNew.GetInfo,
      BonusSpin: BuyBonusSystemCommand.C2SCommandNew.BonusSpin,
      StartGame: BuyBonusSystemCommand.C2SCommandNew.StartGame,
    };
  }

  /**
   * 獲取當前的命令協定
   */
  public getCommandProtocol(): BuyBonusCommandProtocol {
    return this.commandProtocol;
  }

  protected registerNetworkCommand() {
    this.registerCmdCallback(
      this.commandProtocol.GetInfo,
      this.receiveGetInfo.bind(this)
    );
    this.registerCmdCallback(
      this.commandProtocol.BonusSpin,
      this.receiveBonusSpin.bind(this)
    );
  }

  protected registerSocketNetworkCommand() {}

  //#region Client to Server
  //=======================================================

  /**
   * 詢問BuyBonus資訊列表
   * @param cmdData
   */
  public SendGetInfo(cmdData: BuyBonusDataInterface.C2S_GetInfo) {
    this.sendCmd(this.commandProtocol.GetInfo, cmdData as JSON, true);
  }

  /**
   * 詢問BuyBonusSpin資料
   * @param cmdData
   */
  public SendBonusSpin(cmdData: JSON) {
    this.sendCmd(this.commandProtocol.BonusSpin, cmdData, true);
  }

  //=======================================================
  //#endregion Client to Server

  //#region Server to Client
  //=======================================================

  /**
   * 回傳BuyBonus資訊列表
   * @param result
   * @param cmdData
   * @param processTimeMs
   * @returns
   */
  private receiveGetInfo(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (result !== HttpConnect.HttpResult.OK) {
      PlatformGDK.instance.showPopUpMessage.notify(
        GameErrorCode.GetMessage(GameErrorCode.UNKNOWN),
        GameErrorCode.UNKNOWN
      );
      console.warn('[BuyBonusSystem] receiveGetInfo error');

      this.dispatchEvent(
        BuyBonusNetwork.BuyBonusSystem.BuyBonusEvent.NETWORK_ERROR,
        result,
        cmdData,
        processTimeMs
      );
      return;
    }

    this.dispatchEvent(
      this.commandProtocol.GetInfo,
      result,
      cmdData,
      processTimeMs
    );
  }

  /**
   * 回傳BuyBonusSpin資料
   * @param result
   * @param cmdData
   * @param processTimeMs
   * @returns
   */
  private receiveBonusSpin(
    result: number,
    cmdData: ReturnCommandData,
    processTimeMs?: number
  ) {
    if (result !== HttpConnect.HttpResult.OK) {
      PlatformGDK.instance.showPopUpMessage.notify(
        GameErrorCode.GetMessage(GameErrorCode.UNKNOWN),
        GameErrorCode.UNKNOWN
      );
      console.warn('[BuyBonusSystem] receiveBonusSpin error');

      this.dispatchEvent(
        BuyBonusNetwork.BuyBonusSystem.BuyBonusEvent.NETWORK_ERROR,
        result,
        cmdData,
        processTimeMs
      );
      return;
    }

    this.dispatchEvent(
      this.commandProtocol.BonusSpin,
      result,
      cmdData,
      processTimeMs
    );
  }
}

/** BuyBonus 命令協定介面 */
export interface BuyBonusCommandProtocol {
  GetInfo: string;
  BonusSpin: string;
  StartGame: string;
}
