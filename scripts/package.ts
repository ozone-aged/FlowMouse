import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { zipSync, type Zippable } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
const files: Zippable = {};
const timestamp = new Date(1980, 0, 1, 0, 0, 0);
async function add(relative: string): Promise<void> {
  const full = path.join(root, relative);
  const stat = await fs.stat(full);
  if (stat.isDirectory()) {
    for (const child of (await fs.readdir(full)).sort()) if (!child.startsWith('.')) await add(`${relative}/${child}`);
  } else {
    files[relative.replaceAll(path.sep, '/')] = [new Uint8Array(await fs.readFile(full)), { mtime: timestamp }];
  }
}
for (const entry of ['manifest.json', '_locales', 'icons', 'assets/icons', 'css', 'js', 'pages', 'LICENSE', 'THIRD_PARTY_LICENSES.md']) await add(entry);
await fs.access(path.join(root, 'js/enhancements/settings-import.js'));
files['INSTALL.ko.md'] = [new Uint8Array(await fs.readFile(path.join(root, 'docs/INSTALL.ko.md'))), { mtime: timestamp }];
const output = path.join(root, 'dist');
await fs.mkdir(output, { recursive: true });
const filename = `FlowMouse-Chromium-${manifest.version}.zip`;
const bytes = zipSync(files, { level: 9 });
await fs.writeFile(path.join(output, filename), bytes);
const sha = createHash('sha256').update(bytes).digest('hex');
await fs.writeFile(path.join(output, 'SHA256SUMS.txt'), `${sha}  ${filename}\n`);
console.log(`Packaged ${filename}: ${bytes.length} bytes, SHA-256 ${sha}`);
