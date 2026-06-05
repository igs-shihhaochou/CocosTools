/**
 * GameEventLog.ts
 * 替代 Game.js (Plugin) + UAParser.js (Plugin)
 *
 * 自帶輕量 UA 解析，不依賴外部 UAParser 庫。
 * 掛載 window 全域變數，確保既有程式碼不需修改：
 *   - gUserAgent.getResult() → { browser: {name, version}, os: {name, version} }
 *   - onSendEventLog(status)
 *   - eventLogNickName
 */

// ============================================================
// 輕量 UA 解析（取代 UAParser 庫）
// ============================================================
interface UAResult {
  browser: {name: string; version: string};
  os: {name: string; version: string};
}

function parseUA(ua: string): UAResult {
  const result: UAResult = {
    browser: {name: '', version: ''},
    os: {name: '', version: ''},
  };

  // --- Browser ---
  let m: RegExpMatchArray | null;
  if ((m = ua.match(/EdgA?\/([\d.]+)/))) {
    result.browser = {name: 'Edge', version: m[1]};
  } else if ((m = ua.match(/OPR\/([\d.]+)/))) {
    result.browser = {name: 'Opera', version: m[1]};
  } else if ((m = ua.match(/SamsungBrowser\/([\d.]+)/))) {
    result.browser = {name: 'Samsung Browser', version: m[1]};
  } else if ((m = ua.match(/UCBrowser\/([\d.]+)/))) {
    result.browser = {name: 'UC Browser', version: m[1]};
  } else if ((m = ua.match(/Chrome\/([\d.]+)/)) && !/Edg/.test(ua)) {
    result.browser = {name: 'Chrome', version: m[1]};
  } else if ((m = ua.match(/Version\/([\d.]+).*Safari/))) {
    result.browser = {name: 'Safari', version: m[1]};
  } else if ((m = ua.match(/Firefox\/([\d.]+)/))) {
    result.browser = {name: 'Firefox', version: m[1]};
  }

  // --- OS ---
  if ((m = ua.match(/Android ([\d.]+)/))) {
    result.os = {name: 'Android', version: m[1]};
  } else if ((m = ua.match(/iPhone OS ([\d_]+)/))) {
    result.os = {name: 'iOS', version: m[1].replace(/_/g, '.')};
  } else if ((m = ua.match(/iPad.*OS ([\d_]+)/))) {
    result.os = {name: 'iOS', version: m[1].replace(/_/g, '.')};
  } else if ((m = ua.match(/Mac OS X ([\d._]+)/))) {
    result.os = {name: 'Mac OS', version: m[1].replace(/_/g, '.')};
  } else if ((m = ua.match(/Windows NT ([\d.]+)/))) {
    const ntMap: Record<string, string> = {
      '10.0': '10',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
      '5.1': 'XP',
    };
    result.os = {name: 'Windows', version: ntMap[m[1]] || m[1]};
  } else if (/Linux/.test(ua)) {
    result.os = {name: 'Linux', version: ''};
  }

  return result;
}

const _uaResult = parseUA(navigator.userAgent);
const _gUserAgent = {getResult: () => _uaResult};

// ============================================================
// 全域型別宣告
// ============================================================
/* eslint-disable no-var */
declare global {
  var gUserAgent: {getResult: () => UAResult};
  var onSendEventLog: (status: number) => void;
  var eventLogNickName: string;
  var clientIP: string;
  var gGameFlow: {
    onHTMLLoad: number;
    gameInit: number;
    LoginFinished: number;
    inGame: number;
    firstPlay: number;
  };
  var GameFlow: any;
  var gameFlowURL: string;
  var PacketRecordURL: string;
  var GetURLParameterByName: (key: string) => string;
}
/* eslint-enable no-var */

// ============================================================
// 工具函式
// ============================================================
function _getURLParameterByName(key: string): string {
  const k = key.toLowerCase().replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + k + '=([^&#]*)');
  const results = regex.exec(location.search.toLowerCase());
  return results == null
    ? ''
    : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// ============================================================
// 狀態與內部變數
// ============================================================
const _gameFlow = {
  onHTMLLoad: 0,
  gameInit: 1,
  LoginFinished: 2,
  inGame: 3,
  firstPlay: 4,
};
const _clientIP = '';
let _eventLogNickName = '';
let _eventLogTag = -1;
let _gameFlowURL = '';
let _packetRecordURL = '';

const _eventListStr = _getURLParameterByName('event');
if (_eventListStr) {
  const eventList = _eventListStr.split(',');
  const protocol = window.location.protocol ?? 'https:';
  _gameFlowURL = protocol + '//' + eventList[0];
  _packetRecordURL = protocol + '//' + eventList[1];
}

// ============================================================
// 事件日誌發送
// ============================================================
function _onSendEventLog(status: number): void {
  if (status > _eventLogTag) _eventLogTag = status;
  else return;

  const d = new Date();
  const utcTimestamp = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  );

  const browserVersion = _uaResult.browser.version;
  if (!_gameFlowURL) return;

  const data = {
    mid: Number(_getURLParameterByName('mid')),
    loginName: _eventLogNickName,
    uid: _getURLParameterByName('uid'),
    browser: _uaResult.browser.name,
    browserVersion: browserVersion ? browserVersion.split('.')[0] : '',
    device: _uaResult.os.name,
    deviceVersion: _uaResult.os.version,
    ip: _clientIP || '',
    gameID: Number(_getURLParameterByName('gameID')),
    status,
    time: utcTimestamp,
    token: _getURLParameterByName('token'),
  };

  const xhr = new XMLHttpRequest();
  xhr.open('POST', _gameFlowURL, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      console.log(xhr.responseText);
    }
  };
  console.log(
    'onSendEventLog status : ' + status + ', data : ' + JSON.stringify(data)
  );
  xhr.send(JSON.stringify(data));
}

// ============================================================
// 掛載 window 全域變數
// ============================================================
(window as any).gUserAgent = _gUserAgent;
(window as any).onSendEventLog = _onSendEventLog;
(window as any).clientIP = _clientIP;
(window as any).GameFlow = function (this: any) {
  this.onHTMLLoad = 0;
  this.gameInit = 1;
  this.LoginFinished = 2;
  this.inGame = 3;
  this.firstPlay = 4;
};
(window as any).gGameFlow = _gameFlow;
(window as any).gameFlowURL = _gameFlowURL;
(window as any).PacketRecordURL = _packetRecordURL;
(window as any).GetURLParameterByName = _getURLParameterByName;

Object.defineProperty(window, 'eventLogNickName', {
  get() {
    return _eventLogNickName;
  },
  set(val: string) {
    _eventLogNickName = val;
  },
  configurable: true,
  enumerable: true,
});

// ============================================================
// 初始化
// ============================================================
_onSendEventLog(_gameFlow.onHTMLLoad);
