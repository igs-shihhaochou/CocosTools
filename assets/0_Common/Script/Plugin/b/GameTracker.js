const UAParser = require('../UAParser');

var GlobalUserAgent = new UAParser();
window.GlobalUserAgent = GlobalUserAgent;
var _EventLog = function () {
  this.GameFlowURL = '';
  this.PacketRecordURL = '';
  this.UserAgent = GlobalUserAgent;

  this.GameFlow = {
    OnHTMLLoad: 0,
    GameInit: 1,
    OnLoginFinished: 2,
    InGame: 3,
  };

  this.Tag = -1;
  this.NickName = '';
  this.ClientIP = '';

  this.SendGameFlow = function (status) {
    if (status > this.Tag) this.Tag = status;
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
    var url = this.GameFlowURL;
    if (url == undefined || url == '') return;
    var obj = GetURLParameter();

    var browserVersion = this.UserAgent.getResult()['browser']['version'];
    var data = {
      mid: parseInt(obj['mid']),
      loginName: this.NickName ? this.NickName : '',
      uid: obj['uid'],
      token: obj['token'],
      browser: this.UserAgent.getResult()['browser']['name'],
      browserVersion: browserVersion
        ? browserVersion.toString().split('.')[0]
        : '',
      device: this.UserAgent.getResult()['os']['name'],
      deviceVersion: this.UserAgent.getResult()['os']['version'],
      ip: this.ClientIP ? this.ClientIP : '',
      gameID: Number(obj['gameID']),
      status: Number(status.toString()),
      time: utc_timestamp,
    };
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        console.log(xhr.responseText);
      }
    };
    console.log(JSON.stringify(data));
    xhr.send(JSON.stringify(data));
  };

  if (this.GameFlowURL == '' || this.PacketRecordURL == '') {
    var eventListStr = GetURLParameter()['event'];
    if (eventListStr == undefined) return;
    var eventList = eventListStr.split(',');
    if (eventList.length < 1) return;
    var protocol =
      window.location.protocol == undefined
        ? 'https:'
        : window.location.protocol;
    this.GameFlowURL = protocol + '//' + eventList[0];
    this.PacketRecordURL = protocol + '//' + eventList[1];
  }

  function GetURLParameter() {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    var query_string = {};
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (typeof query_string[pair[0]] === 'undefined') {
        query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
      } else if (typeof query_string[pair[0]] === 'string') {
        var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
        query_string[pair[0]] = arr;
        // If third or later entry with this name
      } else {
        query_string[pair[0]].push(decodeURIComponent(pair[1]));
      }
    }
    return query_string;
  }
};
var EventLog = new _EventLog();
window.EventLog = EventLog;
EventLog.SendGameFlow(EventLog.GameFlow.OnHTMLLoad);
