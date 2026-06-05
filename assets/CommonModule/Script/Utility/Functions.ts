import {assetManager, type JsonAsset} from 'cc';
import {EDITOR, PREVIEW} from 'cc/env';
import {PlatformData} from '../Define/PlatformData';
import {UrlParameterFormat} from '../Type/CommonDefine';

export default class Functions {
  /**
   * 檢查值是否為Null或空字串
   * @param target
   */
  public static isNullOrEmpty(target): boolean {
    let isNull = true;
    try {
      isNull = target === undefined || target === null || target === '';
    } catch (err) {
      console.error('[Functions] IsNullOrEmpty error.', err);
      isNull = true;
    }
    return isNull;
  }

  /**
   * 格式化數值字串 (四捨五入至指定小數、千分位、貨幣符號)
   * @param value 數值
   * @param decimalPlaces 四捨五入至指定小數 (default: 0)
   * @param addComma 加入千分位 (default: false)
   * @param dollarSign 指定貨幣符號 (default: "")
   * @param ratio ratio縮放值 (default: 1)
   * @param discardDecimalZero 移除小數尾數多於的0 (default: false)
   * @param chopOff 使用無條件捨去(default:false)
   */
  public static numberFormat(
    value: number,
    decimalPlaces?: number,
    addComma = false,
    dollarSign = '',
    ratio = 1,
    discardDecimalZero = false,
    chopOff = true
  ): string {
    if (decimalPlaces <= 0) decimalPlaces = 0;
    if (addComma === null) addComma = false;
    if (dollarSign === null) dollarSign = '';
    if (ratio === null) ratio = 1;
    if (Number(value)) value = Number(value);

    let str = '';

    if (ratio !== 1) value = Functions.getValueByRatio(value, ratio);

    if (decimalPlaces === null) {
      str = value.toString();
    } else {
      if (chopOff) {
        str = Functions.chopOff(value, decimalPlaces).toFixed(decimalPlaces);
      } else {
        str = value.toFixed(decimalPlaces);
      }
    }

    if (discardDecimalZero) {
      str = Number(str).toString();
    }

    str = str.replace('.', '#');
    if (addComma && value >= 1000) {
      switch (PlatformData.decimalFormat) {
        case '1.000,00':
          str = addThousandSeparator(str, '.');
          str = str.replace('#', ',');
          break;
        case '1000.00':
          str = str.replace('#', '.');
          break;
        case '1,000.00':
        default:
          str = addThousandSeparator(str, ',');
          str = str.replace('#', '.');
          break;
      }
    } else {
      str = str.replace('#', '.');
    }

    function addThousandSeparator(str: string, separator: string): string {
      const parts = str.split('#'); // '#' 代表小數點占位符
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return parts.join('#');
    }

    str = dollarSign + str;

    return str;
  }

  /**
   * 格式化數值成KMB字串    (1,000=>1K  1,000,000=>1M  1,000,000,000=>1B)
   * @param num 數字
   * @param decimalPlaces 無條件捨去至指定小數 (default: 0)
   * @param discardDecimalZero 移除小數尾數多於的0 (default: true)
   * @returns
   */
  public static formatKMBNumber(
    num: number,
    decimalPlaces = 3,
    discardDecimalZero = true,
    forceShowAdaptive = false
  ): string {
    let numStr = '';

    if (decimalPlaces <= 0) decimalPlaces = 0;
    const suffixes = ['', 'K', 'M', 'B']; // 定義後綴
    let suffixIndex = 0; // 從第一個後綴開始
    while (num >= 1000 && suffixIndex < suffixes.length - 1) {
      num *= 0.001; // 每次除以1000
      suffixIndex++; // 後綴索引加1
    }
    const adaptiveDecimalPlaces = Functions.getAdaptiveDecimalPlaces(
      num,
      1,
      decimalPlaces,
      forceShowAdaptive
    );
    numStr = this.chopOff(num, adaptiveDecimalPlaces).toString();

    if (discardDecimalZero) {
      numStr = Number(numStr).toString();
    }
    return numStr + suffixes[suffixIndex]; // 返回格式化後的數字
  }

  /**
   * 根據數值乘上ratio後，動態判斷應顯示的小數位數
   * - 數值 < 閾值（0.1^(baseDigit-1)）且下一位非零 → baseDigit + 1
   * - 其他（含整數） → baseDigit
   * 整數是否去掉小數由 discardDecimalZero 控制，不在此處理
   * @param value 原始數值（server raw value）
   * @param ratio 幣種ratio
   * @param baseDigit 平台預設小數位數（default: 2）
   */
  public static getAdaptiveDecimalPlaces(
    value: number,
    ratio: number,
    baseDigit = 2,
    forceShowAdaptive = false
  ): number {
    const scaled = Functions.accMul(value, ratio);
    // 修正浮點精度至 baseDigit+1 位
    const precision = Math.pow(10, baseDigit + 1);
    const fixed = Math.round(scaled * precision) / precision;
    // 只有數值小於閾值時才考慮多顯示一位
    // eg: baseDigit=2, 閾值=0.01; baseDigit=3, 閾值=0.001
    const threshold = Math.pow(0.1, baseDigit);
    if (
      Math.abs(fixed) > 0 &&
      (forceShowAdaptive || Math.abs(fixed) < threshold)
    ) {
      // 取第 baseDigit+1 位小數判斷是否非零
      const digit = Math.round(fixed * precision) % 10;
      if (digit !== 0) return baseDigit + 1;
    }
    return baseDigit;
  }

  /**
   * 格式化數值字串，自動依第三位小數動態決定顯示位數
   * @param num 數字
   * @param addComma 加入千分位
   * @param dollarSign 貨幣符號
   * @param ratio ratio縮放值
   */
  public static formatNumberAdaptive(
    num: number,
    addComma = false,
    dollarSign = '',
    ratio?: number
  ): string {
    const {displayRatio, displayDigit} = PlatformData.instance;
    const r = ratio ?? displayRatio;
    const decimalPlaces = Functions.getAdaptiveDecimalPlaces(
      num,
      r,
      displayDigit
    );
    return Functions.numberFormat(
      num,
      decimalPlaces,
      addComma,
      dollarSign,
      r,
      false,
      true
    );
  }

  /**
   * 格式化數值字串 (四捨五入至指定小數、千分位、貨幣符號)
   * @param num 數字
   * @param discardDecimalZero 移除小數尾數多於的0 (default: true)
   * @returns
   */
  public static formatNumberWithPlatformData(
    num: number,
    discardDecimalZero = false,
    forceShowAdaptive = false
  ) {
    const {displayRatio, displayDigit, showThousandPlaces} =
      PlatformData.instance;
    const decimalPlaces = Functions.getAdaptiveDecimalPlaces(
      num,
      displayRatio,
      displayDigit,
      forceShowAdaptive
    );
    return Functions.numberFormat(
      num,
      decimalPlaces,
      showThousandPlaces,
      '',
      displayRatio,
      discardDecimalZero,
      true
    );
  }

  /**
   * 格式化數值成KMB字串
   * @param num 數字
   * @param discardDecimalZero 移除小數尾數多於的0 (default: true)
   * @returns
   */
  public static formatNumberKMBWithPlatformData(
    num: number,
    discardDecimalZero = false
  ) {
    const {displayRatio} = PlatformData.instance;
    return Functions.formatKMBNumber(num * displayRatio, 2, discardDecimalZero);
  }

  /**
   * 無條件捨去至指定小數位數
   * @param num 數字
   * @param decimalPlaces 指定小數位數
   * @returns
   */
  public static numberRoundDown(num: number, decimalPlaces: number): number {
    return (
      Math.floor((num + Number.EPSILON) * Math.pow(10, decimalPlaces)) /
      Math.pow(10, decimalPlaces)
    );
  }

  /**
   * 以Ratio取得縮放後數值
   * @param value 數值
   * @param ratio ratio值
   */
  public static getValueByRatio(value: number, ratio: number): number {
    return Number((value * ratio).toFixed(6));
  }

  /**
   * 依Ratio調整數值
   * @param data
   * @param ratio
   * @param keys
   */
  public static changeValueByRatio(data: JSON | [], ratio: number, ...keys) {
    if (!(isJson(data) || Array.isArray(data))) return;

    //目標資料 依鍵值參數逐序讀取內容
    let targetData = data;
    //暫存資料 暫存目標資料上層
    let tempData = targetData;
    //逐序讀取內容
    let key = null;
    for (let i = 0; i < keys.length; i++) {
      key = keys[i];
      //讀取指定內容
      targetData = targetData[key];
      //若無則結束
      if (targetData === null) {
        console.warn(
          '[Functions] ChangeValueByRatio fail. data: %s, ratio: %s, path: %s',
          JSON.stringify(data),
          ratio,
          JSON.stringify(keys)
        );
        return;
      }
      //若為陣列則中斷此處理 進入陣列處理
      if (Array.isArray(targetData)) {
        const remainKeys = keys.slice(i + 1);
        for (let i = 0; i < targetData.length; i++) {
          this.changeValueByRatio(targetData, ratio, String(i), ...remainKeys);
        }
        return;
      }
      //暫存目標資料
      if (i !== keys.length - 1) tempData = targetData;
    }
    //修改數值
    if (typeof targetData === 'number') {
      //內容為數值
      //由上層調整 調整數值取至第五位
      tempData[key] = Number((targetData * ratio).toFixed(5));
    }

    //判斷是否為JSON
    function isJson(data) {
      data = typeof data !== 'string' ? JSON.stringify(data) : data;

      try {
        data = JSON.parse(data);
      } catch (e) {
        return false;
      }

      if (typeof data === 'object' && data !== null) return true;

      return false;
    }
  }

  /// 判斷有沒有超出最大值和最小值 *小於最小值、大於等於最大值
  public static checkOutOfRange(
    min: number,
    max: number,
    value: number
  ): boolean {
    if (value < min || value >= max) return true;
    return false;
  }

  /**
   * 取得小數位數
   * @param value 數值
   */
  public static getDecimalPlaces(value: number): number {
    return value % 1 === 0 ? 0 : value.toString().split('.')[1].length;
  }

  /**
   * 侷限Value在範圍內
   * @param min 最小值
   * @param max 最大值
   * @param value 參數
   */
  public static clamp(min: number, max: number, value: number): number {
    return Math.min(Math.max(value, min), max);
  }

  //取得URL參數
  public static getURLParameterByName(key) {
    key = key.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + key + '=([^&#]*)'),
      results = regex.exec(location.search);
    return results === null
      ? ''
      : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  /// <summary>
  /// 自定義小數位數四捨五入
  /// </summary>
  /// <returns>The round.</returns>
  /// <param name="_dValue">數值</param>
  /// <param name="_iDigit">小數位數</param>
  public static customizeRound(value, decimalDigit) {
    const digitMultiplier: number = Math.pow(10, decimalDigit);
    let valuetMultiplier: number = value * digitMultiplier;

    valuetMultiplier += 0.5;

    const roundValue: number =
      (valuetMultiplier - (valuetMultiplier % 1)) / digitMultiplier;

    return roundValue;
  }

  /**
   * 自定義小數位數四捨五入
   * @param value 數值
   * @param decimalPlaces 小數點位數
   */
  public static roundDecimalPlaces(value: number, decimalPlaces: number) {
    const digitMultiplier: number = Math.pow(10, decimalPlaces);

    return Math.round(value * digitMultiplier) / digitMultiplier;
  }

  /**
   * 取得貝茲曲線點
   * @param t 0 ~ 1
   * @param p0
   * @param p1
   * @param p2
   * @param p3
   */
  public static getBezierCurvePoint(
    t: number,
    p0: {x: number; y: number},
    p1: {x: number; y: number},
    p2: {x: number; y: number},
    p3: {x: number; y: number}
  ): {x: number; y: number} {
    const x = Functions.bezierValue(t, p0.x, p1.x, p2.x, p3.x);
    const y = Functions.bezierValue(t, p0.y, p1.y, p2.y, p3.y);

    return {x: x, y: y};
  }

  /**
   * 貝茲曲線值
   * @param t 0 ~ 1
   * @param p0
   * @param p1
   * @param p2
   * @param p3
   */
  public static bezierValue(
    t: number,
    p0: number,
    p1: number,
    p2: number,
    p3: number
  ): number {
    return (
      (1 - t) ** 3 * p0 +
      3 * (1 - t) ** 2 * t * p1 +
      3 * (1 - t) * t ** 2 * p2 +
      t ** 3 * p3
    );
  }

  /**
   * 繪製測試貝茲曲線
   * @param p0
   * @param p1
   * @param p2
   * @param p3
   * @param location
   * @param accuracy
   */
  public static drawTestBezierCurve(
    p0: {x: number; y: number},
    p1: {x: number; y: number},
    p2: {x: number; y: number},
    p3: {x: number; y: number},
    location: {x: number; y: number} = {x: 0, y: 0},
    accuracy = 0.01
  ) {
    const gCanvas: HTMLCanvasElement = document.getElementById(
      'GameCanvas'
    ) as HTMLCanvasElement;
    let bCanvas: HTMLCanvasElement = document.getElementById(
      'BezierCurveCanvas'
    ) as HTMLCanvasElement;
    if (!bCanvas) {
      bCanvas = document.createElement('canvas');
      bCanvas.id = 'BezierCurveCanvas';
      bCanvas.width = gCanvas.width;
      bCanvas.height = gCanvas.height;
      bCanvas.style.position = 'fixed';
      bCanvas.style.left = '0';
      bCanvas.style.top = '0';
      bCanvas.addEventListener('click', () => {
        gCanvas.focus();
      });
      gCanvas.parentElement.appendChild(bCanvas);
    }
    const ctx: CanvasRenderingContext2D = bCanvas.getContext('2d');
    ctx.clearRect(0, 0, bCanvas.width, bCanvas.height);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 1; i += accuracy) {
      const p = Functions.getBezierCurvePoint(i, p0, p1, p2, p3);
      ctx.lineTo(location.x + p.x, bCanvas.height - location.y - p.y);
    }
    ctx.stroke();

    // console.log('DrawTestBezierCurve', arguments);
  }

  /**
   * 清除測試貝茲曲線
   */
  public static clearTestBezierCurve() {
    const bCanvas: HTMLCanvasElement = document.getElementById(
      'BezierCurveCanvas'
    ) as HTMLCanvasElement;
    if (!bCanvas) return;

    bCanvas.remove();
  }

  /**
   * 取得網址列利用Get傳遞的參數
   */
  public static getURLParameter(customStr?: string): Object {
    const query: string = customStr ?? window.location.search.substring(1);
    const vars = query.split('&');
    const queryString: Object = {};
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      // If first entry with this name
      if (typeof queryString[pair[0]] === 'undefined') {
        queryString[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
      } else if (typeof queryString[pair[0]] === 'string') {
        const arr = [queryString[pair[0]], decodeURIComponent(pair[1])];
        queryString[pair[0]] = arr;
        // If third or later entry with this name
      } else {
        queryString[pair[0]].push(decodeURIComponent(pair[1]));
      }
    }
    return queryString;
  }

  /**
   * 關閉遊戲
   * 非彈出頁且有上一頁瀏覽紀錄則返回上一頁
   * @param isMute
   */
  public static closeGame(isMute?: boolean, forceClose = false) {
    if (EDITOR) return; // do nothing in editor mode
    if (PlatformData.LogoSetting.EnableTryReload && !forceClose) {
      window.location.reload();
      return;
    }

    console.log('%c** CloseGame **', 'color:red');
    const isMuteStr: string = isMute ? 'true' : 'false';
    const urlObj: UrlParameterFormat = Functions.getURLParameter();
    if (urlObj.homeBtn === 'disable') {
      console.log('** CloseGame ** - homeBtn disable');
      return;
    }
    //unity開啟 回傳關閉事件及聲音狀態
    if (urlObj.unity === 'true') {
      const openUrl: string = 'uniwebview://close?isMute=' + isMuteStr;
      console.log('** CloseGame ** - open url: %s', openUrl);
      if (urlObj.unityCloseMode === 'href') {
        window.location.href = openUrl;
      } else {
        window.open(openUrl);
      }
      return;
    }
    //若為iframe 發送訊息至父視窗
    if (window.parent !== window.self) {
      const messageContent: Object = {
        IsCloseGame: 'true',
        IsMute: isMuteStr,
      };
      console.log(
        '** CloseGame ** - post message: %s',
        JSON.stringify(messageContent)
      );
      window.parent.postMessage(JSON.stringify(messageContent), '*');
    }
    //遊戲關閉模式
    if (urlObj['closeMode'] === 'refresh') {
      //網頁重整
      window.location.replace(window.location.href);
    } else {
      //頁面轉為空白頁
      window.location.replace('about:blank');
      //獨立視窗 (非彈出頁 非iframe) 有上一頁瀏覽紀錄則返回上一頁
      if (
        window.opener === null &&
        window.parent === window.self &&
        window.history.length > 1
      ) {
        window.history.go(-1);
        return;
      }
      //關閉頁面
      window.close();
    }
  }

  /**
   * 設定cookie
   * @param key 欄位
   * @param value 值
   * @param exMin 保留時間(分鐘) 刪除設0即可，-1為永久
   * @param isGlobal 全域權限
   */
  public static setCookie(
    key: string,
    value: string,
    _exMin = 525600,
    _isGlobal = false
  ) {
    localStorage.setItem(key, value);
  }

  /**
   * 取得cookie
   * @param key 欄位
   */
  public static getCookie(key: string) {
    return localStorage.getItem(key);
  }

  /**
   * 取得指定時區的 LocaleString
   * @param utcTime UTC0時間
   * @param timeZone 時區
   * @returns
   */
  public static getLocaleStringByTimeZone(
    utcTime: number,
    timeZone: number
  ): string {
    const tempDate: Date = new Date(
      utcTime +
        timeZone * 60 * 60 * 1000 +
        new Date().getTimezoneOffset() * 60 * 1000
    );
    return tempDate.toLocaleString();
  }

  /**
   * 取得瀏覽器顯示時間
   * @param utcTime UTC0時間
   * @param timeZone 時區
   * @returns
   */
  public static getLocaleStringByBrowser(
    utcTime: number,
    timeZone: string
  ): string {
    const tempDate: Date = new Date(utcTime);
    return tempDate.toLocaleString(timeZone, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 取得指定時區的 LocaleDateString
   * @param utcTime UTC0時間
   * @param timeZone 時區
   * @returns
   */
  public static getLocaleDateStringByTimeZone(
    utcTime: number,
    timeZone: number
  ): string {
    const tempDate: Date = new Date(
      utcTime +
        timeZone * 60 * 60 * 1000 +
        new Date().getTimezoneOffset() * 60 * 1000
    );
    return tempDate.toLocaleDateString();
  }

  /**
   * 取得指定時區的 LocaleTimeString
   * @param utcTime UTC0時間
   * @param timeZone 時區
   * @returns
   */
  public static getLocaleTimeStringByTimeZone(
    utcTime: number,
    timeZone: number
  ): string {
    const tempDate: Date = new Date(
      utcTime +
        timeZone * 60 * 60 * 1000 +
        new Date().getTimezoneOffset() * 60 * 1000
    );
    return tempDate.toLocaleTimeString();
  }

  /**
   * 取得與現在時間的差距(秒)
   */
  public static getTimeDiffSec(ts: number): number {
    const nowTime: number = new Date().getTime();
    return Math.floor((ts - nowTime) / 1000);
  }

  /**
   * 從陣列中移除Null項目
   * (主要提供給組件的屬性面板使用)
   * @param list
   * @param lastNullLimit 容許最後連續Null的數量
   */
  public static removeNullItemFromList(list = [], lastNullLimit = 3) {
    if (
      list.length > lastNullLimit &&
      list.slice(list.length - (lastNullLimit + 1)).every(value => {
        return value === null;
      })
    ) {
      //末X個連續超過指定數為Null時 移除所有null
      list = list.filter(value => {
        return value !== null;
      });
    } else {
      //移除某一項目時 遞補其它項目
      const endLen: number = list.length;
      list = list.filter(value => {
        return value !== null;
      });
      const startLen: number = list.length;
      list.length = endLen;
      list.fill(null, startLen, endLen);
    }
    return list;
  }

  /**
   * 使用url讀取遠端資源的Json檔
   * @param filePath
   * @returns
   */
  public static async loadRemoteJson(filePath: string): Promise<JSON> {
    let data: JSON = {} as JSON;
    await new Promise((resolve: Function, reject: (err: Error) => void) => {
      assetManager.loadRemote(
        filePath + '?t=' + Date.now(),
        (error, resource: JsonAsset) => {
          if (error) {
            console.error('[Functions] LoadRemoteJson error.', error);
            reject(error);
            return;
          }
          data = JSON.parse(JSON.stringify(resource.json));
          //釋放資源
          assetManager.releaseAsset(resource);
          resolve(null);
        }
      );
    });
    return data;
  }

  /**
   * 設定全域變數
   * @param target
   * @param keyName
   */
  public static setGlobalVariable(target, keyName?: string) {
    keyName = keyName || target.name;
    if (!keyName) {
      console.error(
        '[Functions] SetGlobalVariable keyName / target.name is null.'
      );
      return;
    }
    window[keyName] = target;
    console.warn('[Functions] SetGlobalVariable', keyName, target);
  }

  /**
   * 預覽模式匯入類別
   * @param className 匯入的類別名
   * @param isCCComponent 是否為Component (因編譯時檢查即須知)
   */
  public static previewImportClass(className: string, isCCComponent = false) {
    //非編輯模式且非預覽模式略過
    if (!EDITOR && !PREVIEW) return;

    //編輯模式預編譯過早 或 預覽模式類別載入較早 才須做下方處理
    const importClass: Function = window[className];
    if (importClass) return;

    //未取得類別則建立暫存類別 eval動態生成指定類別名稱
    const evalClassStr = `window["${className}"] = class Temp${className} ${isCCComponent ? 'extends cc.Component ' : ''}{ };`;
    console.log('[Functions] PreviewImportClass:', evalClassStr);
    eval(evalClassStr);
  }

  /**
   * 匯出類別至全域
   * @param className 須預先記錄類別名稱 避免取得混淆類別失敗
   * @param targetClass
   */
  public static exportClassToGlobal(className: string, targetClass: Function) {
    //目標非類別
    if (!isClass(targetClass)) {
      console.error(
        '[Functions] ExportClassToGlobal targetClass is not class: %o',
        targetClass
      );
      return;
    }

    const globalVariable: Function = window[className];
    //已存在內容
    if (globalVariable) {
      //類別
      if (!isClass(globalVariable)) {
        console.error(
          `[Functions] ExportClassToGlobal window["${className}"] already exists and not class`,
          globalVariable
        );
        return;
      }
      //預覽模式因Cocos架構有可能子類較早載入才須做此處理 發布版本應保證類別先後順序
      if (PREVIEW && globalVariable !== targetClass) {
        try {
          Object.setPrototypeOf(globalVariable, targetClass);
          Object.setPrototypeOf(
            globalVariable.prototype,
            targetClass.prototype
          );
        } catch (err) {
          console.error(
            '[Functions] ExportClassToGlobal extends class error.',
            err
          );
        }
      }
    }

    //全域設定
    this.setGlobalVariable(targetClass, className);

    /**
     * 判斷是否為類別
     * @param target
     */
    function isClass(target) {
      return target instanceof Object && typeof target === 'function';
    }
  }

  /**
   * 無條件捨去
   */
  public static chopOff(val: number, decimalPlaces: number): number {
    const dec = Math.pow(10, decimalPlaces);
    val = Functions.accMul(val, dec);
    val = Math.floor(val);
    const rtn: number = Functions.accDiv(val, dec);
    return rtn;
  }
  /**
   * 數值相乘取得精確數值
   * @param val 數值1
   * @param va2 數值2
   */
  public static accMul(val1: number, val2: number) {
    let m1 = 0,
      m2 = 0;
    const s1 = val1.toString(),
      s2 = val2.toString();
    try {
      m1 = s1.split('.')[1].length;
    } catch (e) {
      m1 = 0;
    }
    try {
      m2 = s2.split('.')[1].length;
    } catch (e) {
      m2 = 0;
    }
    return (
      (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) /
      Math.pow(10, m1 + m2)
    );
  }
  /**
   * 數值相除取得精確數值
   * @param val 數值1
   * @param va2 數值2
   */
  public static accDiv(arg1, arg2) {
    let t1 = 0,
      t2 = 0;

    try {
      t1 = arg1.toString().split('.')[1].length;
    } catch (e) {
      t1 = 0;
    }
    try {
      t2 = arg2.toString().split('.')[1].length;
    } catch (e) {
      t2 = 0;
    }

    const r1 = Number(arg1.toString().replace('.', ''));
    const r2 = Number(arg2.toString().replace('.', ''));

    return (r1 / r2) * Math.pow(10, t2 - t1);
  }

  /**
   * @param currency 幣種名稱
   */
  public static getCurrencyDisplayName(currency: string) {
    const str = this.CurrencyDisplayTable[currency];
    return str === null ? currency : str;
  }

  static CurrencyDisplayTable = {
    USD: 'SC',
    SC: 'SC',
    Silver: 'GC',
    GC: 'GC',
  };

  static getFormattedNumber(num: number, discardDecimalZero = false) {
    const {displayRatio, displayDigit} = PlatformData.instance;
    const decimalPlaces = Functions.getAdaptiveDecimalPlaces(
      num,
      displayRatio,
      displayDigit
    );
    return Functions.numberFormat(
      num,
      decimalPlaces,
      true,
      '',
      displayRatio,
      discardDecimalZero,
      true
    );
  }

  static getFormattedKMBNumber(num: number, discardDecimalZero = false) {
    const {displayRatio} = PlatformData.instance;
    return Functions.formatKMBNumber(num * displayRatio, 2, discardDecimalZero);
  }

  public static callAllEnumKey<T extends Record<string, string | number>>(
    enumObj: T,
    callback: (key: keyof T) => void
  ) {
    for (const key of Object.keys(enumObj)) {
      if (!isNaN(Number(key))) continue;
      callback(key as keyof T);
    }
  }

  public static callAllEnumValue<T extends Record<string, string | number>>(
    enumObj: T,
    callback: (value: T[keyof T]) => void
  ) {
    for (const key of Object.keys(enumObj)) {
      const val = enumObj[key as keyof T];

      if (typeof val === 'string' && enumObj[val as keyof T] === Number(key)) {
        continue;
      }

      callback(val);
    }
  }

  /**
   * @param errorMsg 錯誤訊息
   */

  public static showErrorAlert(msg: string) {
    window.alert(msg);
    Functions.closeGame();
  }

  /**
   * 設定嵌套的JSON內容
   * @param value 值
   * @param json 指定的JSON內容
   * @param keys 鍵值
   * x, y... 表示 json["x"]["y"]...
   * @returns
   */
  public static setNestedJSON(value, json: JSON, ...keys: Array<string>) {
    if (keys.length === 0) {
      return value;
    } else {
      const key: string = keys[0];
      let tempContent = json[key];
      if (tempContent) {
        tempContent = Functions.setNestedJSON(
          value,
          tempContent,
          ...keys.slice(1)
        );
      } else {
        json[key] = Functions.setNestedJSON(
          value,
          {} as JSON,
          ...keys.slice(1)
        );
      }
      return json;
    }
  }

  public static getOrientation() {
    if (window.screen.orientation && window.screen.orientation.type) {
      return window.screen.orientation.type;
    }

    // 傳統方法
    const angle = window.orientation;
    if (angle === 0 || angle === 180) {
      return 'portrait-primary';
    } else if (angle === 90 || angle === -90) {
      return 'landscape-primary';
    }

    // 默认值
    return window.innerHeight > window.innerWidth
      ? 'portrait-primary'
      : 'landscape-primary';
  }
}