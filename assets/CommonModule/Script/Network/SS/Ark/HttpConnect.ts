export const HttpResult = {
  OK: 0,
  Abort: 1,
  Timeout: 2,
  Error: 3,
  Status: 4,
  NotReset: 5,
  Condition: 6,
};

export class HttpConnect {
  static HttpConnect = HttpConnect;
  static HttpResult = HttpResult;

  static async do_get(url, data = null, timeout = 15000) {
    const conn = new BaseHttpConnect(timeout);
    const resp = await conn.send_get(url, data);
    return resp;
  }

  static async do_post(url, data = null, timeout = 15000, header = null) {
    const conn = new BaseHttpConnect(timeout);
    const resp = await conn.send_post(url, data, header);
    return resp;
  }
}

class BaseHttpConnect {
  //properties
  timeout = 0;
  conn: XMLHttpRequest = null;
  url = '';
  data: JSON = null;

  constructor(timeout = 15000) {
    this.timeout = timeout;
    this.reset();
  }

  reset() {
    this.conn = null;
    this.url = null;
    this.data = null;
  }

  send_get(url, data = null) {
    let conn = this.conn;
    if (conn != null) {
      return new Promise((resolve, reject) => {
        const result = {
          result: HttpResult.NotReset,
          status: 0,
          text: 'NotReset',
          conn: null,
        };
        reject(result);
      });
    }
    this.conn = new XMLHttpRequest();
    conn = this.conn;
    this.url = url;
    this.data = data;
    if (data != null) {
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
    console.log('URL : ' + url, 'Time :' + this.timeout);
    conn.timeout = this.timeout;
    return new Promise((resolve, reject) => {
      conn.onload = this._onload.bind(this, resolve, reject, conn);
      conn.onabort = this._onerror.bind(this, reject, HttpResult.Abort);
      conn.onerror = this._onerror.bind(this, reject, HttpResult.Error);
      conn.ontimeout = this._onerror.bind(this, reject, HttpResult.Timeout);
      conn.send();
    });
  }

  send_post(url, data = null, header = null) {
    let conn = this.conn;

    if (conn != null) {
      return new Promise((resolve, reject) => {
        const result = {
          result: HttpResult.NotReset,
          status: 0,
          text: 'NotReset',
          conn: null,
        };
        reject(result);
      });
    }
    this.conn = new XMLHttpRequest();
    conn = this.conn;
    this.url = url;
    this.data = data;
    let body = '';
    if (data != null) {
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
    if (!(header === undefined) && header != null) {
      for (const key in header) {
        conn.setRequestHeader(key, header[key]);
      }
    } else {
      conn.setRequestHeader('Content-Type', 'text/plain; charset=UTF-8');
    }

    return new Promise((resolve, reject) => {
      conn.onload = this._onload.bind(this, resolve, reject, conn);
      conn.onabort = this._onerror.bind(this, reject, HttpResult.Abort);
      conn.onerror = this._onerror.bind(this, reject, HttpResult.Error);
      conn.ontimeout = this._onerror.bind(this, reject, HttpResult.Timeout);
      conn.send(body);
    });
  }

  _onload(resolve, reject, conn) {
    const result = {
      result: HttpResult.Status,
      status: conn.status,
      text: conn.responseText,
      conn: conn,
    };
    if (conn.status >= 200 && conn.status < 400) {
      result.result = HttpResult.OK;
      resolve(result);
    } else {
      reject(result);
    }
    this.reset();
  }

  _onerror(reject, http_result, e) {
    let msg = '';
    if (http_result === HttpResult.Abort) msg = 'Abort';
    else if (http_result === HttpResult.Error) msg = 'Error';
    else if (http_result === HttpResult.Timeout) msg = 'Timeout';
    if (typeof e !== 'undefined' && e) msg += ':' + e.toString();
    const result = {
      result: http_result,
      status: this.conn.status,
      text: msg,
      conn: this.conn,
    };
    console.error(msg);
    reject(result);
    this.reset();
  }
}
