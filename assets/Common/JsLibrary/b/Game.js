////EventLog流程
var GameFlow = function () {
  this.onHTMLLoad = 0;
  this.gameInit = 1;
  this.LoginFinished = 2;
  this.inGame = 3;
  this.firstPlay = 4;
};

var gUserAgent = new UAParser();
var clientIP = '';
var eventLogNickName = '';
var eventLogTag = -1;
var gGameFlow = new GameFlow();

var gameFlowURL = '';
var PacketRecordURL = '';

if (gameFlowURL === '' || PacketRecordURL === '') {
  var eventListStr = GetURLParameterByName('event');
  if (eventListStr) {
    var eventList = eventListStr.split(',');
    var protocol =
      window.location.protocol === undefined
        ? 'https:'
        : window.location.protocol;
    gameFlowURL = protocol + '//' + eventList[0];
    PacketRecordURL = protocol + '//' + eventList[1];
  }
}

function onSendEventLog(status) {
  if (status > eventLogTag) eventLogTag = status;
  else return;

  var d = new Date();
  var utc_timestamp = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  );

  var browserVersion = gUserAgent.getResult()['browser']['version'];
  if (gameFlowURL === undefined || gameFlowURL === '') return;
  var data = {
    mid: Number(GetURLParameterByName('mid')),
    loginName: eventLogNickName,
    uid: GetURLParameterByName('uid'),
    browser: gUserAgent.getResult()['browser']['name'],
    browserVersion: browserVersion
      ? browserVersion.toString().split('.')[0]
      : '',
    device: gUserAgent.getResult()['os']['name'],
    deviceVersion: gUserAgent.getResult()['os']['version'],
    ip: clientIP ? clientIP : '',
    gameID: Number(GetURLParameterByName('gameID')),
    status: status,
    time: utc_timestamp,
    token: GetURLParameterByName('token'),
  };
  var xhr = new XMLHttpRequest();
  xhr.open('POST', gameFlowURL, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  xhr.onreadystatechange = function () {
    if (
      xhr.readyState === XMLHttpRequest.DONE &&
      xhr.status === 200 &&
      CC_DEBUG
    ) {
      console.log(xhr.responseText);
    }
  };

  if (CC_DEBUG) {
    console.log(
      'onSendEventLog status : ' + status + ', data : ' + JSON.stringify(data)
    );
  }
  xhr.send(JSON.stringify(data));
}

////取得URL參數
function GetURLParameterByName(key) {
  key = key.toLowerCase();
  key = key.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + key + '=([^&#]*)'),
    results = regex.exec(location.search.toLowerCase());
  return results === null
    ? ''
    : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

(() => {
  onSendEventLog(gGameFlow.onHTMLLoad);
})();
