//console.log("%c▅"+"%c▃"+"%c▇"+"%c▅"+"%c█"+" %cDeezer Studio 🇫🇷","color:#f00;","color:#ffed00;","color:#ff0092;","color:#c2ff00;","color:#00c7f2;","color:#000;");

/**
 * Browser
 */

window.browser = (function () {
  return window.msBrowser ||
    window.browser ||
    window.chrome;
})();

/**
 * Tool
 */

var Tool = function () {

  this.document = document;

  var self = this;

  this.getJson = function (url, callback) {

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status >= 200 && this.status < 400)
          callback(JSON.parse(this.responseText));
      }
    };
    request.send();
    request = null;

  };

  this.random = function (array) {
    if (array.constructor === Array)
      return array[Math.floor(Math.random() * array.length)];
  };

};

/**
 * Analytics
 */

var gae = function (category, action, label, value) {

  var request = new XMLHttpRequest(),
    ga_params = "v=1&tid=" + params.ga + "&cid=" + localStorage.uuid + "&t=event";
  if (category) ga_params += "&ec=" + category;
  if (action) ga_params += "&ea=" + action;
  if (label) ga_params += "&el=" + label;
  if (value) ga_params += "&ev=" + value;

  request.open("POST", "http://www.google-analytics.com/collect", true);
  request.send(ga_params);

};