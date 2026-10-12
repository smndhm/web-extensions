import { browser } from 'wxt/browser';
import { isChromeOs } from './links';
import { isPlatformId, platforms, PLATFORM_IDS } from './platforms';
import { getSettings, saveSettings } from './settings';

const SAVE_STATUS_DURATION = 2000;
const LINK_TOKEN = '%LINK%';

/** Message keys, typed from public/_locales by WXT */
type MessageKey = Parameters<typeof browser.i18n.getMessage>[0];
const t = (key: MessageKey) => browser.i18n.getMessage(key);

/** "Made with the Odesli API": the link goes where the message has the %LINK% token */
function renderCredits(footer: HTMLElement) {
  const doc = footer.ownerDocument;
  const [before = '', after = ''] = t('optionsCredits').split(LINK_TOKEN);
  const link = doc.createElement('a');
  link.href = 'https://odesli.co/';
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Odesli';
  const newTab = doc.createElement('span');
  newTab.className = 'visually-hidden';
  newTab.textContent = ` ${t('optionsNewTab')}`;
  link.append(newTab);
  footer.replaceChildren(before, link, after);
}

export async function initOptionsPage(doc: Document, userAgent: string): Promise<void> {
  doc.documentElement.lang = t('@@ui_locale').replace('_', '-');
  doc.title = t('optionsTitle');
  for (const element of doc.querySelectorAll<HTMLElement>('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n as MessageKey);
  }
  renderCredits(doc.querySelector('footer')!);

  const form = doc.querySelector('form')!;
  const select = doc.querySelector<HTMLSelectElement>('#streaming-platforms')!;
  const checkbox = doc.querySelector<HTMLInputElement>('#open-app')!;
  const openAppOption = doc.querySelector<HTMLElement>('#open-app-option')!;
  const closeTab = doc.querySelector<HTMLInputElement>('#close-tab')!;
  const closeTabOption = doc.querySelector<HTMLElement>('#close-tab-option')!;
  const status = doc.querySelector<HTMLElement>('#save-status')!;

  const settings = await getSettings();
  select.append(
    ...PLATFORM_IDS.map((id) => {
      const option = doc.createElement('option');
      option.value = id;
      option.textContent = platforms[id].name;
      option.selected = id === settings.platform;
      return option;
    }),
  );
  checkbox.checked = settings.openInApp;
  closeTab.checked = settings.closeTab;

  // Opening in the app only makes sense for platforms with app links, and not on ChromeOS
  const updateOpenAppOption = () => {
    const available = isPlatformId(select.value) && platforms[select.value].hasNativeAppLink === true;
    openAppOption.hidden = !available || isChromeOs(userAgent);
    if (openAppOption.hidden) checkbox.checked = false;
    // Closing the tab only applies when links open in the app
    closeTabOption.hidden = !checkbox.checked;
    if (closeTabOption.hidden) closeTab.checked = false;
  };
  updateOpenAppOption();
  checkbox.addEventListener('change', updateOpenAppOption);
  select.addEventListener('change', () => {
    checkbox.checked = false;
    updateOpenAppOption();
  });

  let clearStatus: ReturnType<typeof setTimeout> | undefined;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isPlatformId(select.value)) return;
    await saveSettings({ platform: select.value, openInApp: checkbox.checked, closeTab: closeTab.checked });
    // The status is a live region: screen readers announce the confirmation
    status.textContent = t('optionsSaveConfirmation');
    clearTimeout(clearStatus);
    clearStatus = setTimeout(() => (status.textContent = ''), SAVE_STATUS_DURATION);
  });
}
