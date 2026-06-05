import {_decorator} from 'cc';
import {PlatformData} from '../../Define/PlatformData';
import BQLogger from '../BQLog/BQLogger';
import {UrlParameterFormat} from '../../Type/CommonDefine';
import Functions from '../../Utility/Functions';
const {ccclass} = _decorator;

function isTrackUrlAvailable(): boolean {
  return (
    typeof TrackUrl !== 'undefined' &&
    TrackUrl !== null &&
    typeof TrackUrl.postParentData === 'function'
  );
}

/**
 * 等待 TrackUrl.js 載入完成
 * @param maxWaitTime 最大等待時間（毫秒），預設 10 秒
 * @param checkInterval 檢查間隔（毫秒），預設 1 秒
 * @returns Promise<void>
 */
function waitForTrackUrlLoad(
  maxWaitTime = 10000,
  checkInterval = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 如果已經載入完成，直接 resolve
    if (isTrackUrlAvailable()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkTimer = setInterval(() => {
      // 檢查是否已載入
      if (isTrackUrlAvailable()) {
        clearInterval(checkTimer);
        resolve();
        return;
      }

      // 檢查是否超過最大等待時間
      if (Date.now() - startTime >= maxWaitTime) {
        clearInterval(checkTimer);
        reject(new Error('TrackUrl.js 載入超時'));
        return;
      }
    }, checkInterval);
  });
}

@ccclass('UrlTracker')
export class UrlTracker {
  /**
   * 透過 TrackUrl 將網址回傳給 API
   */
  public static async sendTrackUrl(url: string): Promise<void> {
    try {
      BQLogger.SendEventLogById(
        1, //GET_SITE_CHASE
        BQLogger.getGameLoadingTime(),
        BQLogger.getGameLoadingTimeForStart(),
        url ? url : '',
        PlatformData.siteName,
        '',
        Date.now().toString()
      );

      // 等待 TrackUrl.js 載入完成
      await waitForTrackUrlLoad();

      const urlObj: UrlParameterFormat = Functions.getURLParameter();

      // 取得所需參數
      const apiId = PlatformData.apiId || '';
      const currency = PlatformData.currency || '';
      const siteName = PlatformData.siteName || '';
      const sessionId = urlObj.ssoKey || '';

      // 呼叫 TrackUrl.postParentData
      await TrackUrl.postParentData({
        url,
        apiId,
        currency,
        siteName,
        sessionId: sessionId,
      });

      console.log('[UrlTracker] 成功發送網址資料至 API');
    } catch (error) {
      console.error('[UrlTracker] 發送網址資料失敗:', error);
    }
  }
}
