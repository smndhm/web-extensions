import './style.css';

// Music Bridge's listing in the store of this browser (Edge runs the Chrome build)
const MUSIC_BRIDGE = import.meta.env.FIREFOX
  ? 'https://addons.mozilla.org/firefox/addon/music-bridge/'
  : /\bEdg\//.test(navigator.userAgent)
    ? 'https://microsoftedge.microsoft.com/addons/detail/kfbedaeciahfjnknbjkcnjknkbdlcnld'
    : 'https://chromewebstore.google.com/detail/music-bridge/mbebbcaajfmockkcflajghbambbimpck';

type MessageKey = Parameters<typeof browser.i18n.getMessage>[0];

document.documentElement.lang = browser.i18n.getMessage('lang');
document.title = browser.i18n.getMessage('movingTitle');
for (const element of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
  element.textContent = browser.i18n.getMessage(element.dataset.i18n as MessageKey);
}

document.querySelector<HTMLAnchorElement>('#install')!.href = MUSIC_BRIDGE;
// Needs no permission: an extension can always uninstall itself, the browser asks the user first
document.querySelector('#uninstall')!.addEventListener('click', () => void browser.management.uninstallSelf({ showConfirmDialog: true }));
