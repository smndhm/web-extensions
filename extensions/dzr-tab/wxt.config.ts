import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Deezer Tab',
    short_name: 'Deezer Tab',
    description: 'Discover a Deezer Track every time you open a new tab.',
    icons: {
      16: 'img/icon16.png',
      48: 'img/icon48.png',
      128: 'img/icon128.png',
    },
    permissions: ['storage'],
    host_permissions: ['https://api.deezer.com/*'],
  },
});
