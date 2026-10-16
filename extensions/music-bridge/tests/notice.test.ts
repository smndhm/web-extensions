/**
 * @vitest-environment jsdom
 */
import { beforeEach, expect, it } from 'vitest';
import { showNotice } from '@/utils/notice';

beforeEach(() => document.querySelectorAll('music-bridge-notice').forEach(notice => notice.remove()));

it('shows the message in a status region, apart from the page styles', () => {
  const host = showNotice(document, 'Music Bridge could not find this music on Deezer.', 'Close');
  expect(host.isConnected).toBe(true);
  const status = host.shadowRoot!.querySelector('[role="status"]')!;
  expect(status.textContent).toContain('Music Bridge could not find this music on Deezer.');
});

it('closes with its button, which has a label', () => {
  const host = showNotice(document, 'Message', 'Close');
  const button = host.shadowRoot!.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('Close');
  button.click();
  expect(host.isConnected).toBe(false);
});

it('shows the logo, hidden from screen readers', () => {
  const host = showNotice(document, 'Message', 'Close', 'data:image/png;base64,iVBORw0KGgo=');
  const icon = host.shadowRoot!.querySelector('img')!;
  expect(icon.getAttribute('src')).toBe('data:image/png;base64,iVBORw0KGgo=');
  expect(icon.alt).toBe('');
});

it('shows the text as text, not HTML', () => {
  const host = showNotice(document, '<b>bold</b>', 'Close');
  const text = host.shadowRoot!.querySelector('span')!;
  expect(text.children).toHaveLength(0);
  expect(text.textContent).toBe('<b>bold</b>');
});
