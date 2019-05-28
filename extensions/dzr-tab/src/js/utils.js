var Utils = {

  getJson: function (url, callback) {

    var request = new XMLHttpRequest();

    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        callback(JSON.parse(this.response));
      }
    };

    request.open('GET', url, true);
    request.overrideMimeType('application/json');
    request.send();

  },

  random: function (array) {
    if (array.constructor === Array)
      return array[Math.floor(Math.random() * array.length)];
  },

  browser: function () {
    return window.msBrowser || window.browser || window.chrome;
  },

  analytics: function (category, action, label, value) {

    var request = new XMLHttpRequest(),
      ga_params = "v=1&tid=" + Conf.ga + "&cid=" + localStorage.uuid + "&t=event";
    if (category) ga_params += "&ec=" + category;
    if (action) ga_params += "&ea=" + action;
    if (label) ga_params += "&el=" + label;
    if (value) ga_params += "&ev=" + value;

    request.open("POST", "http://www.google-analytics.com/collect", true);
    request.send(ga_params);

  }

};