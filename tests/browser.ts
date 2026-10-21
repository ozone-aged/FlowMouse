import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

declare const chrome: any;
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const root = process.env.FLOWMOUSE_EXTENSION_DIR || projectRoot;
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'flowmouse-test-'));
const artifacts = path.join(projectRoot, 'test-results');
await fs.mkdir(artifacts, { recursive: true });
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`, '--disable-background-mode'],
  viewport: { width: 1440, height: 1000 },
});
const errors: string[] = [];
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  const base = `chrome-extension://${id}`;
  // Use synthetic settings and pages only; never use the user's browser profile.
  await worker.evaluate(() => chrome.storage.sync.set({ language: 'en', theme: 'light' }));
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${base}/pages/options.html`);
  await expect(page.locator('settings-finder input')).toBeVisible();
  const finder = page.locator('settings-finder');
  await expect(finder.locator('.results button')).toHaveCount(10);
  await finder.locator('input').fill('data');
  await expect(finder.locator('.results button', { hasText: 'Data Management' })).toBeVisible();
  await finder.locator('input').fill('zzzz-no-match');
  await expect(finder.getByRole('status')).toContainText('No matching');
  await finder.getByRole('button', { name: 'Clear search' }).click();
  await expect(finder.locator('.results button')).toHaveCount(10);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
  await expect(finder.locator('input')).toBeFocused();
  await finder.locator('input').fill('Data Management');
  await finder.locator('input').press('Enter');
  await expect(page.locator('.section[data-nav="data"]')).toBeFocused();
  await page.evaluate(() => scrollTo(0, 0));
  await finder.locator('input').fill('');
  await page.screenshot({ path: path.join(artifacts, 'options-light.png') });

  await page.locator('#trailWidth').fill('7');
  await page.locator('#trailWidth').press('Tab');
  await expect.poll(() => worker.evaluate(async () => (await chrome.storage.sync.get('trailWidth')).trailWidth)).toBe(7);
  const backup = await worker.evaluate(() => chrome.storage.sync.get(null));
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#importFile').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"enableGesture":true,"mouseGestures":{"↑":null}}') });
  await expect(page.locator('options-page > .status')).toContainText('Import');
  assert.equal(await worker.evaluate(async () => (await chrome.storage.sync.get('trailWidth')).trailWidth), 7);
  await page.locator('#importFile').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...backup, trailWidth: 8, _version: '2.5' })) });
  await expect.poll(() => worker.evaluate(async () => (await chrome.storage.sync.get('trailWidth')).trailWidth)).toBe(8);
  await page.waitForTimeout(650); // Regression: a pre-import debounce must not overwrite the imported value.
  assert.equal(await worker.evaluate(async () => (await chrome.storage.sync.get('trailWidth')).trailWidth), 8);
  await expect(page.locator('#trailWidth')).toHaveValue('8');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await worker.evaluate(() => chrome.storage.sync.set({ theme: 'dark' }));
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(artifacts, 'options-dark.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: path.join(artifacts, 'options-narrow.png') });
  await worker.evaluate(() => chrome.storage.sync.set({ language: 'ko' }));
  await expect(page.locator('settings-finder label')).toHaveText('설정 찾기');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(artifacts, 'options-ko.png') });

  await context.route('https://flowmouse.test/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Gesture fixture</title><body><h1>FlowMouse test page</h1><p>Test gesture on this page.</p></body>' }));
  const fixture = await context.newPage();
  await fixture.goto('https://flowmouse.test/one');
  await fixture.goto('https://flowmouse.test/two');
  await expect.poll(() => worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ url: 'https://flowmouse.test/two' });
    try { return (await chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' })).pong; } catch { return false; }
  })).toBe(true);
  await fixture.mouse.move(700, 350);
  await fixture.mouse.down({ button: 'right' });
  await fixture.mouse.move(450, 350, { steps: 15 });
  await fixture.mouse.up({ button: 'right' });
  await expect(fixture).toHaveURL('https://flowmouse.test/one');
  const popup = await context.newPage();
  await popup.goto(`${base}/pages/popup.html`);
  await fixture.bringToFront();
  await popup.reload();
  await expect(popup.locator('.site-domain')).toContainText('flowmouse.test');
  await expect(popup.locator('popup-page h1')).toContainText('FlowMouse');
  await expect(popup.locator('popup-page input[type=checkbox][aria-label]')).toHaveCount(3);
  await popup.setViewportSize({ width: 320, height: 700 });
  await popup.screenshot({ path: path.join(artifacts, 'popup-ko.png') });
  assert.deepEqual(errors, [], `Uncaught browser errors: ${errors.join(', ')}`);
  const report = { passed: true, browser: context.browser()?.version(), platform: process.platform, checks: ['real MV3 extension load', 'settings search and clear', 'keyboard shortcut and focus transfer', 'save and readback', 'invalid import rejected without storage changes', 'v2.5 backup import', 'light/dark/narrow layouts', 'Korean UI', 'default left gesture navigates back', 'popup renders with labelled controls', 'no uncaught page errors'] };
  await fs.writeFile(path.join(artifacts, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await fs.rm(profile, { recursive: true, force: true });
}
