import fs from 'node:fs/promises';
const pinned = JSON.parse(await fs.readFile(new URL('../UPSTREAM.json', import.meta.url), 'utf8'));
const response = await fetch('https://api.github.com/repos/Hmily-LCG/FlowMouse/releases/latest', {
  headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'FlowMouse-local-upstream-check' },
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
const latest = await response.json() as { tag_name: string; html_url: string; draft: boolean; prerelease: boolean };
if (latest.draft || latest.prerelease) throw new Error('Expected stable release');
console.log(JSON.stringify({ current: pinned.tag, latest: latest.tag_name, updateAvailable: latest.tag_name !== pinned.tag, release: latest.html_url, next: 'Follow docs/UPDATE.md; review and test before publishing.' }, null, 2));
