import {FeatureData, FeatureType} from './GameArgs';

export class WheelDataArgs {
  public wheelCtrlIndex = 0;
  public fakeWheelDataAry: number[][] = []; /// 假轉輪
  public resultWheelDataAry: number[][] = []; /// 最後結果的盤面
  public scatterToWheelPosAry: number[][] = []; /// Scatter在轉輪帶上的位置

  public parse(data: JSON): WheelDataArgs {
    this.wheelCtrlIndex = data['id'];
    this.parseFakeWheels(data);
    this.parseInitWheels(data);
    this.parseWinSpecialSymbol(data);
    return this;
  }

  public parseFakeWheels(data: JSON): WheelDataArgs {
    if (data.hasOwnProperty('fake_wheels')) {
      const datas: JSON = data['fake_wheels'];
      let keyIndex = 0;
      this.fakeWheelDataAry = [];
      for (let i = 0, count = Object.keys(datas).length; i < count; ) {
        const keyStr: string = '' + keyIndex;
        if (datas.hasOwnProperty(keyStr)) {
          const ary: number[] = datas[keyStr];
          this.fakeWheelDataAry.push(ary);
          keyIndex++;
        }
        i++;
      }
    }
    return this;
  }

  public parseInitWheels(data: JSON): WheelDataArgs {
    if (data.hasOwnProperty('init_wheels')) {
      const datas: JSON = data['init_wheels'];
      let keyIndex = 0;
      this.resultWheelDataAry = [];
      for (let i = 0, count = Object.keys(datas).length; i < count; ) {
        const keyStr: string = '' + keyIndex;
        if (datas.hasOwnProperty(keyStr)) {
          const ary: number[] = datas[keyStr];
          this.resultWheelDataAry.push(ary);
          keyIndex++;
        }
        i++;
      }
    }
    return this;
  }

  public parseWinSpecialSymbol(data: JSON): WheelDataArgs {
    if (data.hasOwnProperty('win_special_symbols')) {
      const datas: JSON = data['win_special_symbols'];
      let keyIndex = 0;
      this.scatterToWheelPosAry = [];
      for (let i = 0, count = Object.keys(datas).length; i < count; ) {
        const keyStr: string = '' + keyIndex;
        if (datas.hasOwnProperty(keyStr)) {
          const ary: number[] = datas[keyStr];
          this.scatterToWheelPosAry.push(ary);
          keyIndex++;
        }
        i++;
      }
    }
    return this;
  }
}

export class BingoArgs {
  public lineId: number = undefined; //// Line ID
  public waysCount: number = undefined; //// way用，一條線上的複數的獎會顯示
  public symbolTotalCount: number = undefined; //// 顆數奨使用的欄位，塞畫面上的數量
  public symbolCount = 0; ////這顆Symbol在線上連線的數量
  public symbolId = 0; //// 指的是有中獎線的symbol_id
  public bingoPosList: number[][] = []; //// 兌獎位置
  public multiplier = 1; ////額外增加倍率
  public win = 0; ////Win分

  constructor(jsonData: JSON) {
    this.parseBingoPos(jsonData);
  }

  private parseBingoPos(jsonData: JSON): void {
    if (jsonData.hasOwnProperty('line_id')) {
      this.lineId = Number(jsonData['line_id']);
    }
    if (jsonData.hasOwnProperty('ways_count')) {
      this.waysCount = Number(jsonData['ways_count']);
    }
    if (jsonData.hasOwnProperty('symbol_total_count')) {
      this.symbolTotalCount = Number(jsonData['symbol_total_count']);
    }
    if (jsonData.hasOwnProperty('multiplier')) {
      this.multiplier = Number(jsonData['multiplier']);
    }
    this.symbolCount = Number(jsonData['symbol_count']);
    this.symbolId = Number(jsonData['symbol_id']);
    this.win = Number(jsonData['win']);
    const iList = jsonData['pos'];
    for (let i = 0; i < iList.length; i++) {
      const secList = iList[i];
      const sAry: number[] = [];
      for (let j = 0; j < secList.length; j++) {
        sAry.push(secList[j]);
      }
      this.bingoPosList.push(sAry);
    }
  }
}

export enum BingoType {
  Lines,
  Costs,
}

export class WheelBlockResultArgs {
  public wheelCtrlIndex = 0;
  public resultAry: number[][] = null;
  public scatterAry: number[][] = null;
  public preWinAry: number[] = null;
  public featurList: FeatureData[] = null;
  public bingoArgsList: BingoArgs[]; // "bingo",
  public bingoKind: BingoType = BingoType.Lines;

  public parse(data: JSON): WheelBlockResultArgs {
    if (data.hasOwnProperty('id')) {
      this.wheelCtrlIndex = data['id'];
    }
    //聽牌
    if (data.hasOwnProperty('pre_win_wheels')) {
      this.preWinAry = data['pre_win_wheels'];
    }
    this.parseResultWheels(data);
    this.parseWinSpecialSymbols(data);
    this.parseFeatureWheels(data);
    this.parseBingoData(data);
    return this;
  }

  public parseResultWheels(data: JSON): WheelBlockResultArgs {
    if (data.hasOwnProperty('result_wheels')) {
      const resultDatas: JSON = data['result_wheels'];
      let keyIndex = 0;
      this.resultAry = [];
      for (let i = 0, count = Object.keys(resultDatas).length; i < count; ) {
        const keyStr: string = '' + keyIndex;
        if (resultDatas.hasOwnProperty(keyStr)) {
          const ary: number[] = resultDatas[keyStr];
          this.resultAry.push(ary);
          keyIndex++;
        }
        i++;
      }
    }
    return this;
  }
  public parseWinSpecialSymbols(data: JSON): WheelBlockResultArgs {
    if (data.hasOwnProperty('win_special_symbols')) {
      const datas: JSON = data['win_special_symbols'];
      this.scatterAry = [];
      for (let i = 0, count = Object.keys(datas).length; i < count; i++) {
        const keyStr: string = '' + i;
        if (datas.hasOwnProperty(keyStr)) {
          const ary: number[] = datas[keyStr];
          this.scatterAry.push(ary);
        }
      }
    }
    return this;
  }

  public parseFeatureWheels(data: JSON): WheelBlockResultArgs {
    this.featurList = [];
    if (data.hasOwnProperty('feature_wheels')) {
      const featureDatas: JSON = data['feature_wheels'];
      if (featureDatas.hasOwnProperty('end_feature_map')) {
        const endFeatureAry: JSON[] = featureDatas['end_feature_map'];
        const featureDataAry: FeatureData[] = this.parseFeatureData(
          endFeatureAry,
          FeatureType.End
        );
        for (const i of featureDataAry) {
          this.featurList.push(i);
        }
      } else if (featureDatas.hasOwnProperty('End')) {
        const endFeatureAry: JSON[] = featureDatas['End'];
        const featureDataAry: FeatureData[] = this.parseNewFeatureData(
          endFeatureAry,
          FeatureType.End
        );
        for (const i of featureDataAry) {
          this.featurList.push(i);
        }
      }

      if (featureDatas.hasOwnProperty('rot_feature_map')) {
        const rotFeatureAry: JSON[] = featureDatas['rot_feature_map'];
        const featureDataAry: FeatureData[] = this.parseFeatureData(
          rotFeatureAry,
          FeatureType.Rotating
        );
        for (const i of featureDataAry) {
          this.featurList.push(i);
        }
      } else if (featureDatas.hasOwnProperty('Rot')) {
        const rotFeatureAry: JSON[] = featureDatas['Rot'];
        const featureDataAry: FeatureData[] = this.parseNewFeatureData(
          rotFeatureAry,
          FeatureType.Rotating
        );
        for (const i of featureDataAry) {
          this.featurList.push(i);
        }
      }

      if (featureDatas.hasOwnProperty('single_end_feature_map')) {
        const singleFeatureAry: JSON[] = featureDatas['single_end_feature_map'];
        const featureDataAry: FeatureData[] = this.parseFeatureData(
          singleFeatureAry,
          FeatureType.SingleEnd
        );
        for (const i of featureDataAry) {
          this.featurList.push(i);
        }
      }
    }
    return this;
  }

  public parseFeatureData(
    featureJsonAry: JSON[],
    featureKind: FeatureType
  ): FeatureData[] {
    const count: number = featureJsonAry.length;
    const returnAry: FeatureData[] = [];
    for (let i = 0; i < count; i++) {
      const featureJson: JSON = featureJsonAry[i];
      const feature: FeatureData = new FeatureData(
        featureJson['key'],
        featureJson['value'],
        featureKind
      );
      returnAry.push(feature);
    }
    return returnAry;
  }

  public parseNewFeatureData(
    featureJsonAry: JSON[],
    featureKind: FeatureType
  ): FeatureData[] {
    const count: number = featureJsonAry.length;
    const returnAry: FeatureData[] = [];
    for (let i = 0; i < count; i++) {
      const featureJson: JSON = featureJsonAry[i];
      const keyAry: string[] = Object.keys(featureJson);
      for (let j = 0; j < keyAry.length; j++) {
        const keyStr: string = keyAry[j];
        const feature: FeatureData = new FeatureData(
          keyStr,
          featureJson[keyStr],
          featureKind
        );
        returnAry.push(feature);
      }
    }
    return returnAry;
  }

  public parseBingoData(data: JSON): WheelBlockResultArgs {
    if (data.hasOwnProperty('bingo')) {
      this.bingoArgsList = [];
      const bingoPosAry: JSON[] = data['bingo'];
      for (const json of bingoPosAry) {
        const bingoArgs: BingoArgs = new BingoArgs(json);
        this.bingoArgsList.push(bingoArgs);
      }
    }
    if (data.hasOwnProperty('bingo_type')) {
      this.bingoKind = data['bingo_type'] as BingoType;
    }
    return this;
  }
}
