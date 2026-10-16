/**
 * A message at the top of the music page, when Music Bridge could not redirect it. It sits in a
 * shadow root, so the page's styles neither change it nor are changed by it, and it is a status
 * region, so screen readers announce it. Sizes are in px: the page's root font size is not ours.
 */
export function showNotice(doc: Document, text: string, closeLabel: string, iconSvg = ''): HTMLElement {
  const host = doc.createElement('music-bridge-notice');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; position: fixed; z-index: 2147483647; inset: 12px 12px auto; display: flex; justify-content: center; pointer-events: none; }
      div {
        display: flex; align-items: center; gap: 12px; max-width: 680px; padding: 10px 10px 10px 16px; pointer-events: auto;
        border: 1px solid #ffffff40; border-radius: 8px; background: #222; color: #fafafa; box-shadow: 0 4px 16px #0005;
        font: 500 15px/1.4 system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      i { flex: none; display: flex; width: 24px; height: 24px; }
      i svg { width: 100%; height: 100%; }
      button {
        flex: none; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 4px;
        background: transparent; color: inherit; font: inherit; font-size: 20px; line-height: 1; cursor: pointer;
      }
      button:hover { background: #fff2; }
      button:focus-visible { outline: 3px solid #c9a2ff; outline-offset: 2px; }
    </style>
    <div role="status"><i aria-hidden="true"></i><span></span><button type="button">×</button></div>
  `;
  // The extension's own logo, not page content
  shadow.querySelector('i')!.innerHTML = iconSvg;
  shadow.querySelector('span')!.textContent = text;
  const button = shadow.querySelector('button')!;
  button.setAttribute('aria-label', closeLabel);
  button.addEventListener('click', () => host.remove());
  doc.documentElement.append(host);
  return host;
}
