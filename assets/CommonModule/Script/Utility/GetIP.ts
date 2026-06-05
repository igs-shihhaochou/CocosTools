const getIp = (oncomplete, onerror) => {
  let isComplete = false;
  const onload = function (jsonstr) {
    if (isComplete) return;
    try {
      const data = JSON.parse(jsonstr);
      oncomplete(data['ip']);
      isComplete = true;
    } catch (err) {
      // console.warn(err);
      if (onerror && typeof onerror === 'function') {
        onerror(err);
      }
    }
  };
  SendXHR('https://api.ipify.org/?format=json', onload, onerror);
  SendXHR('https://ipapi.co/json/', onload, onerror);
};

const SendXHR = (url, onload, onerror) => {
  // Feature detection
  if (!window.XMLHttpRequest) {
    if (onerror && typeof onerror === 'function') {
      console.error('Error from XMLHttpRequest');
      onerror('Error from XMLHttpRequest');
    }
    return;
  }
  // Create new request
  const xhr = new XMLHttpRequest();
  // Setup callback
  xhr.onload = function () {
    if (onload && typeof onload === 'function') {
      onload(this.responseText);
    }
  };
  xhr.onerror = function (content) {
    if (onerror && typeof onerror === 'function') {
      onerror(content);
    }
  };
  xhr.open('GET', url);
  xhr.send();
};

export {getIp};
