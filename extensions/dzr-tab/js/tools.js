console.log("%c▅"+"%c▃"+"%c▇"+"%c▅"+"%c█"+" %cDeezer Studio 🇫🇷","color:#f00;","color:#ffed00;","color:#ff0092;","color:#c2ff00;","color:#00c7f2;","color:#000;");

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
        request.onreadystatechange = function() {
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
            return array[Math.floor(Math.random()*array.length)];
    };

};

/**
 * Analytics
 */

var _gaq = _gaq || [];
_gaq.push(['_setAccount', params.ga]);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();