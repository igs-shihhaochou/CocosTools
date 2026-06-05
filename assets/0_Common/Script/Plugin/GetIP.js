var GetIP = function(oncomplete, onerror) {
    var isComplete = false;
    var onload_1 = function (json_str) {
        if (isComplete)
            return;
        try {
            var data = JSON.parse(json_str);
            oncomplete(data["ip"]);
            isComplete = true;
        }
        catch (err) {
            // console.warn(err);
            if (onerror != null && typeof (onerror) === 'function') {
                onerror(err);
            }
        }
    };
    SendXHR("https://api.ipify.org/?format=json", onload_1, onerror);
    SendXHR("https://ipapi.co/json/", onload_1, onerror);
}
var SendXHR = function(url, onload, onerror) {
    // Feature detection
    if (!window.XMLHttpRequest) {
        if (onerror != null && typeof (onerror) === 'function') {
            console.error("Error from XMLHttpRequest");
            onerror("Error from XMLHttpRequest");
        }
        return;
    }
    // Create new request
    var xhr = new XMLHttpRequest();
    // Setup callback
    xhr.onload = function () {
        if (onload != null && typeof (onload) === 'function') {
            onload(this.responseText);
        }
    };
    xhr.onerror = function (content) {
        if (onerror != null && typeof (onerror) === 'function') {
            onerror(content);
        }
    };
    xhr.open('GET', url);
    xhr.send();
}