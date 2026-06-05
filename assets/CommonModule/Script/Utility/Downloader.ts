export default class Downloader {
  protected retryTimes = 0;
  protected retryTimeOut = [2000, 3000, 4000, 5000, 6000];
  /**
   * 從其他Url下載Script
   * @param url
   * @param onload 下載Script成功的Callback
   * @param onerror 下載Script錯誤的Callback
   */
  protected getScript(url: string, onload?: Function, onerror?: Function) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    //Script須為最新
    script.src = url; // + '?Date=' + new Date().getTime();
    //@ts-expect-error proerty d.n.e
    script.timeout = 10000;
    //@ts-expect-error proerty d.n.e
    script.ontimeout = () => {
      if (onerror !== null) onerror({url, onload, onerror});
    };
    script.onerror = () => {
      if (onerror !== null) onerror({url, onload, onerror});
    };
    //@ts-expect-error proerty d.n.e
    script.onload = script.onreadystatechange = () => {
      if (
        //@ts-expect-error proerty d.n.e
        !script.readyState ||
        //@ts-expect-error proerty d.n.e
        script.readyState === 'loaded' ||
        //@ts-expect-error proerty d.n.e
        script.readyState === 'complete'
      ) {
        if (onload !== null && typeof onload === 'function') {
          onload();
        }
        //@ts-expect-error proerty d.n.e
        script.onload = this.onreadystatechange = null;
        document.getElementsByTagName('head')[0].removeChild(script);
      }
    };
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  /**
   * 從其他Url下載Image
   * @param url
   * @param onload 下載成功的Callback
   * @param onerror 下載錯誤的Callback
   */
  protected getImage(url: string, onload?: Function, onerror?: Function) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';

    xhr.onload = () => {
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
        if (onload !== null && typeof onload === 'function') {
          onload(xhr.response);
        }
      } else {
        console.error('xhr.onload error status ', xhr.status);
        this.retryHandler(xhr.response, xhr, url, onerror);
      }
    };
    xhr.onerror = content => {
      console.error('xhr.onerror  ', content);
      this.retryHandler(content, xhr, url, onerror);
    };
    xhr.ontimeout = content => {
      console.log('xhr.ontimeout  ', content);
      this.retryHandler(content, xhr, url, onerror);
    };

    xhr.open('GET', url);
    xhr.timeout = this.retryTimeOut[this.retryTimes];
    xhr.send();
  }

  /**
   * 從其他Url下載JSON
   * @param url
   * @param onload 下載成功的Callback
   * @param onerror 下載錯誤的Callback
   * todo LOAD_GAMESETTING_FAILED!!!
   */
  protected getJSON(
    url: string,
    onload?: (responseText: string) => void,
    onerror?: (errorContent) => void,
    addDateParam = true
  ) {
    // Feature detection
    if (!window.XMLHttpRequest) {
      if (onerror !== null && typeof onerror === 'function') {
        console.error('Error from XMLHttpRequest');
        onerror('Error from XMLHttpRequest');
      }
      return;
    }
    //設定檔須為最新
    if (addDateParam) {
      url += '?Date=' + new Date().getTime();
    }
    // Create new request
    const xhr = new XMLHttpRequest();
    this.retryTimes = 0;

    // Setup callback
    xhr.onload = () => {
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
        if (onload !== null && typeof onload === 'function') {
          onload(xhr.responseText);
        }
      } else {
        console.error('xhr.onload error status ', xhr.status);
        this.retryHandler(xhr.responseText, xhr, url, onerror);
      }
    };
    xhr.onerror = content => {
      console.error('xhr.onerror', content);
      this.retryHandler(content, xhr, url, onerror);
    };
    xhr.ontimeout = content => {
      console.warn('xhr.ontimeout', content);
      this.retryHandler(content, xhr, url, onerror);
    };

    // Get the HTML
    xhr.open('GET', url);
    xhr.timeout = this.retryTimeOut[this.retryTimes];
    xhr.send();
  }

  private async retryHandler(
    content,
    xhr: XMLHttpRequest,
    url: string,
    onerror
  ) {
    if (this.retryTimes === this.retryTimeOut.length - 1) {
      console.log('retry fail', content);
      if (onerror !== null && typeof onerror === 'function') {
        onerror(content);
      }
    } else {
      console.log('this.retryTimes', this.retryTimes);
      console.log('xhr.timeout', xhr.timeout);

      if (content.type !== 'timeout') {
        console.log('not timeout error');
        //非TimeOut錯誤，延遲3秒在送
        setTimeout(() => {
          xhr.open('GET', url);
          xhr.timeout = this.retryTimeOut[++this.retryTimes];
          xhr.send();
        }, 3e3);
      } else {
        xhr.open('GET', url);
        xhr.timeout = this.retryTimeOut[++this.retryTimes];
        xhr.send();
      }
    }
  }
}
