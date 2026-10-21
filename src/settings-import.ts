export const MAX_IMPORT_BYTES = 1024 * 1024;
type Settings = Record<string, unknown>;
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
const legacyKeys = new Set(['gestures', 'customGestures', 'customGestureUrls']);

function record(value: unknown): value is Settings {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Settings {
  if (!record(value)) throw new Error(`Expected object: ${path}`);
  return value;
}

/** Reject prototype keys, excessive nesting and oversized structures before merging. */
function inspectTree(value: unknown, depth = 0, budget = { remaining: 20000 }): void {
  if (--budget.remaining < 0 || depth > 24) throw new Error('Configuration is too complex');
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid number');
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) throw new Error(`Unsafe key: ${key}`);
    inspectTree(child, depth + 1, budget);
  }
}

function action(value: unknown): void {
  const entry = requireRecord(value, 'action');
  if (typeof entry.action !== 'string' || !entry.action) throw new Error('Missing action');
}

/** Keep upstream action parameters intact; validate the containers consumed by the UI. */
export function parseSettingsImport(text: string, defaults: Settings): Settings {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) throw new Error('File too large');
  const imported = requireRecord(JSON.parse(text), 'settings');
  inspectTree(imported);
  if (typeof imported.enableGesture !== 'boolean') throw new Error('Missing enableGesture');
  for (const [key, value] of Object.entries(imported)) {
    if (key === '_version') {
      if (typeof value !== 'string') throw new Error('Invalid version');
      continue;
    }
    if (legacyKeys.has(key)) {
      const entries = requireRecord(value, key);
      if (!Object.values(entries).every(v => typeof v === 'string' || v === null)) {
        throw new Error(`Invalid legacy setting: ${key}`);
      }
      continue;
    }
    if (!Object.hasOwn(defaults, key)) throw new Error(`Unknown setting: ${key}`);
    const expected = defaults[key];
    if (expected === null) {
      if (value !== null && typeof value !== 'string') throw new Error(`Invalid setting: ${key}`);
    } else if (Array.isArray(expected)) {
      if (!Array.isArray(value)) throw new Error(`Expected array: ${key}`);
    } else if (typeof expected === 'object') {
      requireRecord(value, key);
    } else if (typeof value !== typeof expected) {
      throw new Error(`Invalid type: ${key}`);
    }
  }
  for (const key of ['mouseGestures', 'wheelGestures', 'specialGestures']) {
    if (imported[key] !== undefined) Object.values(requireRecord(imported[key], key)).forEach(action);
  }
  for (const key of ['textDragGestures', 'imageDragGestures', 'linkDragGestures']) {
    const entries = imported[key];
    if (Array.isArray(entries)) for (const entry of entries) {
      action(entry);
      if (!record(entry) || typeof entry.direction !== 'string') throw new Error('Missing drag direction');
    }
  }
  if (Array.isArray(imported.blacklist) && !imported.blacklist.every(v => typeof v === 'string')) {
    throw new Error('Invalid blacklist');
  }
  for (const key of ['gestureTriggerButtons', 'sectionAdvanced']) {
    if (imported[key] !== undefined && !Object.values(requireRecord(imported[key], key)).every(v => typeof v === 'boolean')) {
      throw new Error(`Invalid switches: ${key}`);
    }
  }
  if (imported.actionChains !== undefined) {
    for (const value of Object.values(requireRecord(imported.actionChains, 'actionChains'))) {
      const chain = requireRecord(value, 'chain');
      if (typeof chain.name !== 'string' || !Array.isArray(chain.steps)) throw new Error('Invalid chain');
      chain.steps.forEach(action);
    }
  }
  if (imported.customMenus !== undefined) {
    for (const value of Object.values(requireRecord(imported.customMenus, 'customMenus'))) {
      const menu = requireRecord(value, 'menu');
      if (typeof menu.name !== 'string' || !Array.isArray(menu.items)) throw new Error('Invalid menu');
      for (const item of menu.items) if (item !== 'separator') action(item);
    }
  }
  delete imported._version;
  return imported;
}
