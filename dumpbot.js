/***********************************
 * Dumpbot.
 ************************************/

(function() {
	
window.DB = window.DB || {};

var DB = window.DB;

// DB.CORS_PROXY_URL = "http://www.corsproxy.com/";
DB.CORS_PROXY_URL = "http://localhost:9292/"

// Given an image URL, tries to get a CORS-enabled version of the image.
DB.getCORSImage = function(url, callback, err_callback) {
  var im = new Image();
  im.crossOrigin = '';
  if (callback) { im.onload = function() { callback(im); }; }
  if (err_callback) { im.onerror = function() { err_callback(im); }; }
  im.src = DB.CORS_PROXY_URL + url.split('://')[1];
  return im;
}

DB.getCORSDataURL = function (url, callback) {
	DB.getCORSImage(url, function(im) {
    var f = document.createElement('canvas');
	  f.setAttribute('width', im.width);
	  f.setAttribute('height', im.height);
	  var fx = f.getContext('2d');
	  fx.drawImage(im,0,0);
	  callback(f.toDataURL());
	}, function() { window.console.log("Error getting CORS DataURL."); });
}

// Given an image as a dataURL, dumps it.
DB.sendDataDump = function(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var dataView = new DataView(ab);
    var blob = new Blob([dataView], { type: mimeString });

	var fd = new FormData();
	fd.append("room", Room);
	fd.append('image', blob, "image.png");
	var xhr = new XMLHttpRequest();
	xhr.crossOrigin = "";
  xhr.open('POST', 'http://dump.fm/upload/message');
	xhr.send(fd);
}

DB.dumpCanvas = function(canvas) {
	DB.sendDataDump(canvas.toDataURL());
}

// TODO: Keep a list of callbacks?
DB.setDumpCallback = function(callback) {
  window.buildMessageDivWrapper = function(msg, opts) {
    if (msg.nick != Nick) {
      callback(msg);
    }
    return window.buildMessageDiv(msg, opts);
  }
  window.addNewMessages = function(msgs) {
    var msgStr = $.map(msgs, window.buildMessageDivWrapper).join('');
    $('#messageList').append(msgStr);
    Drag.bindImages();
  }
}

DB.extractImageUrlsFromMsg = function(msg) {
	var imgUrlPattern = /[^ ]+:\/\/[^ ]+\.(gif|jpg|png)/g;
	var matches = msg.content.match(imgUrlPattern);
	if (matches != null) { return matches[0]; }
	return null;
}

DB.setSingleCORSImageCallback = function(cb) {
  DB.setDumpCallback(function(m) {
  var url = DB.extractImageUrlsFromMsg(m);
  if (url != null) {
      DB.getCORSImage(url, cb,
        function() {
          window.console.log("Couldn't get CORS image for " + url);
        });
  }});
}

})();
