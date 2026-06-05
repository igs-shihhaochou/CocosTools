export const HttpResult = {
  OK: 0,
  Abort: 1,
  Timeout: 2,
  Error: 3,
  Status: 4,
  NotReset: 5,
  Condition: 6,
};

export default class HttpConnect {
  static HttpConnect = HttpConnect;
  static HttpResult = HttpResult;

  static async doGet(url, data = null, callback = null, timeout = 15000) {
    const conn = new BaseHttpConnect(timeout);
    const resp = await conn.sendGet(url, data, callback);
    return resp;
  }

  static async doPost(
    url,
    data = null,
    callback = null,
    timeout = 15000,
    header = null
  ) {
    const conn = new BaseHttpConnect(timeout);
    const resp = await conn.sendPost(url, data, callback, header);
    return resp;
  }
}

class BaseHttpConnect {
  //properties
  timeout = 0;
  conn: XMLHttpRequest = null;
  url = '';
  data: JSON = null;
  callback = null;

  constructor(timeout = 15000) {
    this.timeout = timeout;
    this.reset();
  }

  reset() {
    this.conn = null;
    this.url = null;
    this.data = null;
    this.callback = null;
  }

  sendGet(url, data = null, callback = null) {
    let conn = this.conn;
    if (conn !== null) {
      return new Promise((resolve, reject) => {
        const result = {
          result: HttpResult.NotReset,
          status: 0,
          text: 'NotReset',
          conn: null,
        };
        if (callback !== null) callback(result);
        reject(result);
      });
    }
    this.conn = new XMLHttpRequest();
    conn = this.conn;
    this.url = url;
    this.data = data;
    this.callback = callback;
    if (data !== null) {
      let str = '';
      for (const key in data) {
        if (str !== '') {
          str += '&';
        }
        str += key + '=' + encodeURIComponent(data[key]);
      }
      if (str !== '') {
        if (url.indexOf('?') < 0) {
          url += '?';
        }
        url += str;
      }
    }
    conn.open('GET', url);
    conn.timeout = this.timeout;
    return new Promise((resolve, reject) => {
      conn.onload = this.onLoad.bind(this, resolve, reject, conn);
      conn.onabort = this.onError.bind(this, reject, HttpResult.Abort);
      conn.onerror = this.onError.bind(this, reject, HttpResult.Error);
      conn.ontimeout = this.onError.bind(this, reject, HttpResult.Timeout);
      conn.send();
    });
  }

  sendPost(url, data = null, callback = null, header = null) {
    let conn = this.conn;

    if (conn !== null) {
      return new Promise(reject => {
        const result = {
          result: HttpResult.NotReset,
          status: 0,
          text: 'NotReset',
          conn: null,
        };
        if (callback !== null) callback(result);
        reject(result);
      });
    }
    this.conn = new XMLHttpRequest();
    conn = this.conn;
    this.url = url;
    this.data = data;
    this.callback = callback;
    let body = '';
    if (data !== null) {
      if (typeof data === 'string') body = data;
      else {
        for (const key in data) {
          if (body !== '') {
            body += '&';
          }
          body += key + '=' + encodeURIComponent(data[key]);
        }
      }
    }

    conn.open('POST', url, true);
    conn.timeout = this.timeout;
    if (!(header === undefined) && header !== null) {
      for (const key in header) {
        conn.setRequestHeader(key, header[key]);
      }
    } else {
      conn.setRequestHeader('Content-Type', 'text/plain; charset=UTF-8');
    }

    return new Promise((resolve, reject) => {
      conn.onload = this.onLoad.bind(this, resolve, reject, conn);
      conn.onabort = this.onError.bind(this, reject, HttpResult.Abort);
      conn.onerror = this.onError.bind(this, reject, HttpResult.Error);
      conn.ontimeout = this.onError.bind(this, reject, HttpResult.Timeout);
      conn.send(body);
    });
  }
  callbackWrapper(value) {
    if (this.callback !== null) this.callback(value);
  }

  onLoad(resolve, reject, conn) {
    const result = {
      result: HttpResult.Status,
      status: conn.status,
      text: conn.responseText,
      conn: conn,
    };
    if (conn.status >= 200 && conn.status < 400) {
      result.result = HttpResult.OK;
      this.callbackWrapper(result);
      resolve(result);
    } else {
      this.callbackWrapper(result);
      reject(result);
    }
    this.reset();
  }

  onError(reject, httpResult, e) {
    let msg = '';
    if (httpResult === HttpResult.Abort) msg = 'Abort';
    else if (httpResult === HttpResult.Error) msg = 'Error';
    else if (httpResult === HttpResult.Timeout) msg = 'Timeout';
    if (typeof e !== 'undefined' && e) msg += ':' + e.toString();
    const result = {
      result: httpResult,
      status: this.conn.status,
      text: msg,
      conn: this.conn,
    };
    console.error(msg);
    this.callbackWrapper(result);
    reject(result);
    this.reset();
  }
}
