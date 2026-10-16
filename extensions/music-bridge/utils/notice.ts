/**
 * A message at the top of the music page, when Music Bridge could not redirect it. It sits in a
 * shadow root, so the page's styles neither change it nor are changed by it, and it is a status
 * region, so screen readers announce it. Its colors are those of the options page, light or dark
 * as the system. Sizes are in px: the page's root font size is not ours.
 */
export function showNotice(doc: Document, text: string, closeLabel: string, iconUrl = ''): HTMLElement {
  const host = doc.createElement('music-bridge-notice');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial; position: fixed; z-index: 2147483647; inset: 12px 12px auto; display: flex; justify-content: center; pointer-events: none;
        --text: #222; --background: #fafafa; --border: #ccc; --accent: #4b0195; --hover: #4b019514;
      }
      @media (prefers-color-scheme: dark) {
        :host { --text: #fafafa; --background: #222; --border: #555; --accent: #c9a2ff; --hover: #c9a2ff1f; }
      }
      div {
        display: flex; align-items: center; gap: 12px; max-width: 680px; padding: 10px 10px 10px 14px; pointer-events: auto;
        border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: var(--text); box-shadow: 0 4px 16px #0004;
        font: 500 15px/1.4 system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      img { flex: none; width: 24px; height: 24px; }
      img:not([src]) { display: none; }
      button {
        flex: none; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 4px;
        background: transparent; color: inherit; font: inherit; font-size: 20px; line-height: 1; cursor: pointer;
      }
      button:hover { background: var(--hover); }
      button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
    </style>
    <div role="status"><img alt=""><span></span><button type="button">×</button></div>
  `;
  if (iconUrl) shadow.querySelector('img')!.src = iconUrl;
  shadow.querySelector('span')!.textContent = text;
  const button = shadow.querySelector('button')!;
  button.setAttribute('aria-label', closeLabel);
  button.addEventListener('click', () => host.remove());
  doc.documentElement.append(host);
  return host;
}
