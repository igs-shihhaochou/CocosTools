import {PlatformData} from '../Define/PlatformData';
import Functions from '../Utility/Functions';
import MultiGameNameListDownloader from '../Utility/MultiGameNameListDownloader';

/** 多語系遊戲名稱表 */
export interface MultiGameNameTable {
  [GameName: string]: {
    [Lang: string]: string;
  };
}

export interface MultiLangAsset {
  BundleName: string;
  AssetPath: string;
}

/**
 * 多語系遊戲名稱資料集合
 */
interface MultiGameNameDataCollection {
  /** 編號 */
  [No: string]: MultiGameNameData;
}

/**
 * 多語系遊戲名稱資料
 */
interface MultiGameNameData {
  /** 編號 */
  No?: string;
  /** 鍵值 */
  Key?: string;
  /** 語系 */
  [Lang: string]: string;
}

export default class MultiLangHandler {
  /** 資源名稱 */
  public static readonly ASSET_NAME: string = 'GameTextDictionary';
  /** 文字資源外的對應表名稱 */
  public static readonly ASSET_DICT_TABLE_NAME: string = 'GameAssetDictionary';
  /** 遊戲文字內容 */
  private static GameTextDict: JSON = {} as JSON;
  /** 資源與路徑對應表 */
  private static GameAssetDict: MultiLangAsset[] = [];
  /** 遊戲名稱多國 */
  public static get MultiGameNameList(): MultiGameNameTable {
    return window['MultiGameNameList'];
  }
  public static set MultiGameNameList(arr) {
    window['MultiGameNameList'] = arr;
  }
  /**
   * 從GameTextDict取得文字 後面不定參數根據字串的%s#自動替代
   * @param key 鍵值
   * @param args Subsequences beginning with %s#
   */
  public static getGameText(key: string, ...args: string[]): string {
    let result: string = key;
    if (window['GameTextDict'] && window['GameTextDict'][key]) {
      result = window['GameTextDict'][key];
    }
    result = result.format(...args);
    return result;
  }
  /**
   * 從GameTextDict取得文字 以replaceKeyDict替換內容
   * @param key 鍵值
   * @param replaceKeyDict 原字串內容中的%[Key]為key值 替換為對應的字串內容 若字串內容為%[Key]則會再由GetGameText取得對應的字串內容
   */
  public static getGameTextByReplaceKey(
    key: string,
    replaceKeyDict: {[replaceKey: string]: string}
  ): string {
    let result: string = this.getGameText(key);

    let replaceString = '';
    let keyTypeReplaceString: string = null;
    for (const replaceKey in replaceKeyDict) {
      replaceString = replaceKeyDict[replaceKey];
      keyTypeReplaceString = replaceString.match(/^%(.+)/)?.[1];
      result = result.replace(
        '%' + replaceKey,
        keyTypeReplaceString
          ? this.getGameText(keyTypeReplaceString)
          : replaceString
      );
    }

    return result;
  }
  /**
   * 從GameAssetDict取得資源路徑
   * @param key 鍵值
   */
  public static getGameAssetPath(key: string): MultiLangAsset {
    let result: MultiLangAsset = null;
    if (window['GameAssetDict'] && window['GameAssetDict'][key]) {
      result = window['GameAssetDict'][key];
    } else {
      console.error(
        '[MultiLangHandler] Please set asset multilang info before access it. key:',
        key
      );
    }
    return result;
  }
  /**
   * 新增遊戲文字內容
   * 整合成一份 統一由MultiLangHandler提供
   * @param gameTextDict
   */
  public static addGameTextDict(gameTextDict: JSON) {
    let addText: string = null;
    let gameText: string = null;
    if (!window['GameTextDict']) {
      window['GameTextDict'] = {};
    }
    for (const key in gameTextDict) {
      addText = gameTextDict[key];
      gameText = window['GameTextDict'][key];
      //衝突訊息 後者會覆蓋前者
      if (gameText && gameText !== addText)
        console.warn(
          `[MultiLangHandler] AddGameTextDict conflict key name: ${key}, oldText: ${gameText}, newText: ${addText}`
        );
      window['GameTextDict'][key] = addText;
    }
  }
  public static AddGameAssetDict(bundleName: string, gameAssetDict: JSON) {
    if (!window['GameAssetDict']) {
      window['GameAssetDict'] = {};
    }
    for (const key in gameAssetDict) {
      //衝突訊息 後者會覆蓋前者
      if (window['GameAssetDict'][key])
        console.error(
          '[MultiLangHandler] AddGameAssetDice conflict key name:',
          key
        );
      const item: MultiLangAsset = {
        BundleName: bundleName,
        AssetPath: gameAssetDict[key],
      };
      window['GameAssetDict'][key] = item;
    }
  }
  /**
   * 取得MultiGameList
   * (因可由外部設定 故提供此功能)
   * @param onComplete
   * @param onError
   */
  public static DownloadMultiGameNameList(
    onComplete: (json: JSON) => void,
    onError: (err: Error) => void
  ) {
    const filePath = `${PlatformData.gameConfig.RemoteResources}./Common/Localization/`;
    const downloader: MultiGameNameListDownloader =
      new MultiGameNameListDownloader();
    downloader.start(
      filePath,
      (jsonData: JSON) => {
        console.log(
          '[MultiLangHandler] DownloadMultiGameNameList jsonData: %o',
          jsonData
        );
        //解析JSON設定檔
        const collection: MultiGameNameDataCollection =
          jsonData as unknown as MultiGameNameDataCollection;
        let data: MultiGameNameData = collection[0];
        //取得語系列表
        const langList: Array<string> = new Array<string>();
        for (const key in data) {
          if (key.search(/^[a-z]{2}-[a-z]{2}$/) !== -1) langList.push(key);
        }
        //建立多語系名稱表
        const multiGameNameTable: MultiGameNameTable = {};
        for (const idx in collection) {
          data = collection[idx];
          //鍵值衝突訊息
          if (multiGameNameTable[data.Key])
            console.warn(
              `[MultiLangHandler] DownloadMultiGameNameList multiGameNameTable duplicate key: ${data.Key}`
            );
          //設定內容
          langList.forEach((lang: string) => {
            Functions.setNestedJSON(
              data[lang],
              multiGameNameTable as unknown as JSON,
              data.Key,
              lang
            );
          });
        }
        window['MultiGameNameList'] = multiGameNameTable;
        onComplete(jsonData);
      },
      err => {
        onError(err);
      }
    );
  }
}
