/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ANNOUNCE_DELAY, showNotice } from '@/utils/notice';

beforeEach(() => {
  vi.useFakeTimers();
  document.querySelectorAll('music-bridge-notice').forEach(notice => notice.remove());
});
afterEach(() => vi.useRealTimers());

it('shows the message in a status region, apart from the page styles', () => {
  const host = showNotice(document, 'Music Bridge could not find this music on Deezer.', 'en', 'Close');
  expect(host.isConnected).toBe(true);
  const status = host.shadowRoot!.querySelector('[role="status"]')!;
  vi.advanceTimersByTime(ANNOUNCE_DELAY);
  expect(status.textContent).toContain('Music Bridge could not find this music on Deezer.');
});

it('adds the status region before its text, for screen readers to announce it', () => {
  const host = showNotice(document, 'Message', 'en', 'Close');
  const text = host.shadowRoot!.querySelector('span')!;
  expect(text.textContent).toBe('');
  vi.advanceTimersByTime(ANNOUNCE_DELAY);
  expect(text.textContent).toBe('Message');
});

it('says the language of its text', () => {
  const host = showNotice(document, 'Message', 'fr', 'Fermer');
  expect(host.shadowRoot!.querySelector<HTMLElement>('[role="status"]')!.lang).toBe('fr');
});

it('closes with its button, which has a label', () => {
  const host = showNotice(document, 'Message', 'en', 'Close');
  const button = host.shadowRoot!.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('Close');
  button.click();
  expect(host.isConnected).toBe(false);
});

it('closes with Escape while the focus is in it', () => {
  const host = showNotice(document, 'Message', 'en', 'Close');
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  expect(host.isConnected).toBe(true);
  host.shadowRoot!.querySelector('button')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  expect(host.isConnected).toBe(false);
});

it('shows the logo, hidden from screen readers', () => {
  const host = showNotice(document, 'Message', 'en', 'Close', 'data:image/png;base64,iVBORw0KGgo=');
  const icon = host.shadowRoot!.querySelector('img')!;
  expect(icon.getAttribute('src')).toBe('data:image/png;base64,iVBORw0KGgo=');
  expect(icon.alt).toBe('');
});

it('shows the text as text, not HTML', () => {
  const host = showNotice(document, '<b>bold</b>', 'en', 'Close');
  vi.advanceTimersByTime(ANNOUNCE_DELAY);
  const text = host.shadowRoot!.querySelector('span')!;
  expect(text.children).toHaveLength(0);
  expect(text.textContent).toBe('<b>bold</b>');
});
