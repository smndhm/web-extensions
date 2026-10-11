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
  }

};