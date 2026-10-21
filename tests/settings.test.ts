import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { MAX_IMPORT_BYTES, parseSettingsImport } from '../src/settings-import.ts';
import { WriteQueue } from '../src/write-queue.ts';

const sandbox = { window: {} as { GestureConstants?: { DEFAULT_SETTINGS: Record<string, unknown> } } };
vm.runInNewContext(fs.readFileSync(new URL('../js/constants.js', import.meta.url), 'utf8'), sandbox);
const defaults = JSON.parse(JSON.stringify(sandbox.window.GestureConstants!.DEFAULT_SETTINGS));

test('upstream v2.5 settings round trip, retaining all action parameters', () => {
  const backup = { ...defaults, _version: '2.5', actionChains: { a: { name: 'Chain', steps: [{ action: 'openCustomUrl', customUrl: 'https://example.org/?q=%text%' }] } }, customMenus: { a: { name: 'Menu', items: ['separator', { action: 'back' }] } } };
  const parsed = parseSettingsImport(JSON.stringify(backup), defaults);
  assert.equal(parsed._version, undefined);
  assert.deepEqual(parsed.actionChains, backup.actionChains);
  assert.deepEqual(parsed.customMenus, backup.customMenus);
  assert.equal(parsed.customCss, defaults.customCss);
});

test('legacy gesture maps remain available to upstream migration', () => {
  const legacy = { enableGesture: true, gestures: { '←': 'back', '→': null }, customGestureUrls: { '↑': 'https://example.org' } };
  assert.deepEqual(parseSettingsImport(JSON.stringify(legacy), defaults), legacy);
});

test('reject unsafe keys at every nesting level without polluting prototypes', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    assert.throws(() => parseSettingsImport(`{"enableGesture":true,"mouseGestures":{"↑":{"action":"back","${key}":{"polluted":true}}}}`, defaults), /Unsafe key/);
  }
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test('reject malformed root, container types and action entries', () => {
  for (const value of [null, [], 1, { enableGesture: 'true' }, { enableGesture: true, mouseGestures: [] }, { enableGesture: true, mouseGestures: { '↑': null } }, { enableGesture: true, blacklist: [1] }, { enableGesture: true, actionChains: { a: { name: 'Bad', steps: {} } } }, { enableGesture: true, unexpected: true }, { enableGesture: true, trailWidth: 1e400 }]) {
    assert.throws(() => parseSettingsImport(JSON.stringify(value), defaults));
  }
});

test('bound byte size and nesting before storage is touched', () => {
  assert.throws(() => parseSettingsImport(' '.repeat(MAX_IMPORT_BYTES + 1), defaults), /large/);
  let nested: unknown = 'deep';
  for (let i = 0; i < 30; i++) nested = { child: nested };
  assert.throws(() => parseSettingsImport(JSON.stringify({ enableGesture: true, customMenus: nested }), defaults), /complex/);
});

test('write queue serializes and recovers after rejected writes', async () => {
  const queue = new WriteQueue();
  const events: number[] = [];
  const one = queue.run(async () => { await new Promise(resolve => setTimeout(resolve, 15)); events.push(1); throw new Error('quota'); });
  const two = queue.run(async () => { events.push(2); return true; });
  await assert.rejects(one, /quota/);
  assert.equal(await two, true);
  assert.deepEqual(events, [1, 2]);
});

test('real settings store keeps committed state on failure and merges concurrent saves', async () => {
  let failNext = false;
  let active = 0;
  let maxActive = 0;
  let stored: Record<string, unknown> = structuredClone(defaults);
  const environment = globalThis as unknown as { window: unknown; chrome: unknown };
  environment.window = { GestureConstants: { DEFAULT_SETTINGS: defaults } };
  environment.chrome = { storage: {
    onChanged: { addListener() {} },
    sync: {
      get(_keys: unknown, callback: (items: unknown) => void) { callback(structuredClone(stored)); },
      async set(value: Record<string, unknown>) {
        active++; maxActive = Math.max(active, maxActive);
        await new Promise(resolve => setTimeout(resolve, 5));
        active--;
        if (failNext) { failNext = false; throw new Error('Synthetic quota failure'); }
        stored = structuredClone(value);
      },
    },
  } };
  const { settingsStore } = await import('../js/settings-store.js');
  await settingsStore.waitForLoad();
  const original = structuredClone(settingsStore.current);
  failNext = true;
  assert.equal(await settingsStore.save({ trailWidth: 7 }), false);
  assert.deepEqual(settingsStore.current, original);
  const patch = { trailWidth: 8 };
  const first = settingsStore.save(patch);
  patch.trailWidth = 99;
  const second = settingsStore.save({ enableHUD: false });
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.equal(settingsStore.current.trailWidth, 8);
  assert.equal(settingsStore.current.enableHUD, false);
  assert.equal(maxActive, 1);
  failNext = true;
  assert.equal(await settingsStore.reset(), false);
  assert.equal(settingsStore.current.trailWidth, 8);
  assert.equal(await settingsStore.reset(), true);
  assert.deepEqual(settingsStore.current, defaults);
});
