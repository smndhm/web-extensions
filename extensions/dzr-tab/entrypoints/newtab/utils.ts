export const Utils = {
  getJson: function (url: string, callback: (response: any) => void) {
    const request = new XMLHttpRequest();

    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        callback(JSON.parse(this.response));
      }
    };

    request.open('GET', url, true);
    request.overrideMimeType('application/json');
    request.send();
  },

  random: function <T>(array: T[]): T | undefined {
    if (Array.isArray(array))
      return array[Math.floor(Math.random() * array.length)];
  },
};
