/* eslint-disable @typescript-eslint/no-unused-vars */
export default class DataController {
  public init(mainLocation: string, secondLocation: string[]) {}
  public login(gameId: string, onLoginFinish) {}
  public getStartGameData(gameId: string, onStartGameFinish) {}
  public getSpinData(
    gameId: string,
    lineBet: number,
    devMode: number,
    onSpinDataReturn
  ) {}
  public getFeverData(
    gameId: string,
    sgId: number,
    devMode: number,
    data,
    onFeverDataReturn
  ) {}
  public getBonusFeverData(
    gameId: string,
    sgId: number,
    devMode: number,
    bonusType: string,
    data,
    onFeverDataReturn
  ) {}
  public getDoubleGameData(
    gameId: string,
    devMode: number,
    data,
    onDoubleGameDataReturn
  ) {}
  public getInGameJPData(gameId: string, onJPDataReturn) {}
  public clearFeature(gameId: string, onLoginFinish) {}
}
