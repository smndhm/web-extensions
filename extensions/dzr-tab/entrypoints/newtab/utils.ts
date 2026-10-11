export type Rgb = [number, number, number];

export const WHITE: Rgb = [255, 255, 255];
export const BLACK: Rgb = [0, 0, 0];

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

  rgb: function (color: Rgb) {
    return 'rgb(' + color.map(Math.round).join(', ') + ')';
  },

  // WCAG 2 relative luminance: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
  luminance: function (color: Rgb) {
    const [r, g, b] = color.map(function (c) {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }) as Rgb;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  // WCAG 2 contrast ratio: https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
  contrast: function (a: Rgb, b: Rgb) {
    const [light, dark] = [Utils.luminance(a), Utils.luminance(b)].sort((x, y) => y - x) as [number, number];
    return (light + 0.05) / (dark + 0.05);
  },

  minContrast: function (text: Rgb, backgrounds: Rgb[]) {
    return Math.min(...backgrounds.map((background) => Utils.contrast(text, background)));
  },

  // Mix each background with the opposite of the text color until it reaches the target contrast
  ensureContrast: function (backgrounds: Rgb[], text: Rgb, target: number): Rgb[] {
    const opposite = text === WHITE ? BLACK : WHITE;
    return backgrounds.map(function (background) {
      let color = background;
      for (let amount = 0.05; Utils.contrast(text, color) < target && amount <= 1; amount += 0.05) {
        color = background.map((c, i) => c + (opposite[i]! - c) * amount) as Rgb;
      }
      return color;
    });
  },
};
