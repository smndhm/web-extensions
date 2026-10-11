import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Open Deezer in desktop app',
    description:
      'Get redirected to the Deezer desktop app when you open a Deezer link in the browser.',
    icons: {
      16: 'icons/16.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },
  },
});
