/* eslint-disable camelcase */
import {_decorator, resources, TextAsset} from 'cc';
import {PlatformData} from '../../../CommonModule/Script/Define/PlatformData';
import HttpConnect from '../../../CommonModule/Script/Network/ArkSDK/Utitlity/HttpConnect';
import DataController from './DataController';

const {ccclass} = _decorator;

@ccclass
export default class LocalFileController extends DataController {
  private startGameData = '';
  private mainGameDatas: string[] = [];
  private mainGameDataIdx = 0;
  private startTime = 0;
  private mainLocation = '';
  private secondLocation: string[] = [];

  public init(mainLocation: string, secondLocation: string[]) {
    this.mainLocation = mainLocation;
    this.secondLocation = secondLocation;

    PlatformData.isDevServer = true;
  }

  public login(gameId: string, onLoginFinish) {
    this._readAllData(this.mainLocation, this.secondLocation).then(() => {
      const retData = {cmd_data: {}};
      onLoginFinish(HttpConnect.HttpResult.OK, retData);
    });
  }

  public getStartGameData(gameId: string, onStartGameDataReturn) {
    this.mainGameDataIdx = 0;
    const retData = {cmd_data: {}};
    try {
      console.log('START:', this.startGameData);

      retData.cmd_data = JSON.parse(this.startGameData);
      onStartGameDataReturn(HttpConnect.HttpResult.OK, retData);
    } catch (e) {
      console.error('ERROR:', e, this.startGameData);
      onStartGameDataReturn(HttpConnect.HttpResult.Error, retData);
    }
  }

  public getSpinData(
    gameId: string,
    lineBet: number,
    devMode: number,
    onSpinDataReturn
  ) {
    const retData = {cmd_data: {}};
    retData.cmd_data = JSON.parse(this.mainGameDatas[this.mainGameDataIdx]);
    this.mainGameDataIdx =
      (this.mainGameDataIdx += 1) % this.mainGameDatas.length;

    onSpinDataReturn(HttpConnect.HttpResult.OK, retData);
  }

  public getFeverData(
    gameId: string,
    sgId: number,
    devMode: number,
    data,
    onFeverDataReturn
  ) {
    const retData = {cmd_data: {}};
    retData.cmd_data = JSON.parse(this.mainGameDatas[this.mainGameDataIdx]);
    this.mainGameDataIdx =
      (this.mainGameDataIdx += 1) % this.mainGameDatas.length;
    onFeverDataReturn(HttpConnect.HttpResult.OK, retData);
  }

  public getDoubleGameData(
    _gameId: string,
    _devMode: number,
    _data,
    _onDoubleGameDataReturn
  ) {}

  public getInGameJPData(gameId: string, onJPDataReturn) {
    if (this.startTime === 0) this.startTime = Date.now();
    const jpData = {
      status: {msg: 'OK', id: 0},
      data: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        jp_winners: [
          {
            game_id: 'GoldenTiger',
            jp_coin: 999999.99,
            jp_type: 'grand',
            user_id: '100000001',
            nickname: 'Chris',
          },
          {
            game_id: 'GoldenTiger',
            jp_coin: 99.99,
            jp_type: 'minor',
            user_id: '100000002',
            nickname: 'BBB',
          },
        ],
      },
    };

    for (let i = 0; i < 5; i++) {
      jpData['data'][(5 - i).toString()] =
        100 * (i + 1) + (i + 1) * (Date.now() - this.startTime);
    }

    const retData = {cmd_data: {}};
    retData.cmd_data = jpData;
    onJPDataReturn(HttpConnect.HttpResult.OK, retData);
  }

  public clearFeature(_gameId: string, _onClearFeatureFinish) {}

  private async _readAllData(mainLocation: string, secondLocation: string[]) {
    await Promise.all([
      this._readStartGameData(mainLocation),
      this._readSpinData(secondLocation),
    ]);
  }

  private async _readStartGameData(startGameFile) {
    await new Promise(resolve => {
      resources.load(
        '/' + startGameFile,
        TextAsset,
        null,
        (err: Error, res: TextAsset) => {
          if (err) console.error(err);
          else resolve(res.text);
        }
      );
    }).then(result => {
      if (typeof result === 'string') {
        console.log(
          '[LocalFileController]_readStartGameData',
          JSON.parse(result)
        );
        this.startGameData = result;
      }
    });
  }

  private async _readSpinData(mainGameFiles) {
    for (let i = 0; i < mainGameFiles.length; i++) {
      if (mainGameFiles[i] === '') return;
      try {
        const result = await new Promise((resolve, reject) => {
          resources.load(
            '/' + mainGameFiles[i],
            TextAsset,
            null,
            (err: Error, res: TextAsset) => {
              if (err) reject(err);
              else resolve(res.text);
            }
          );
        });
        if (typeof result === 'string') {
          this.mainGameDatas = this.mainGameDatas.concat(result.split('+'));
        }
      } catch (err) {
        console.error(err);
      }
    }
    for (let i = 0; i < this.mainGameDatas.length; i++) {
      console.log('[LocalFileController]_readSpinData', this.mainGameDatas[i]);
    }
  }
}
