/**
 * TrackUrl 命名空間
 * 包含追蹤 URL 相關的功能
 */
declare namespace TrackUrl {
  /**
   * 發送父視窗資料的參數介面
   */
  interface PostParentDataParams {
    /** URL 參數 */
    url: string;
    /** API ID */
    apiId: string;
    /** 貨幣類型 */
    currency: string;
    /** 網站名稱 */
    siteName: string;
    /** sessionID (Macross SSOKey) */
    sessionId: string;
  }

  /**
   * 發送父視窗資料到追蹤 URL
   * @param params 包含 url, apiId, currency, siteName 的參數物件
   * @returns Promise<boolean> 成功時返回 true
   */
  function postParentData(params: PostParentDataParams): Promise<boolean>;
}
