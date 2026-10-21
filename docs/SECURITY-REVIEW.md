# v2.5-ozone.1 security and compatibility review

Reviewed 2026-10-21. Base: Hmily-LCG/FlowMouse v2.5, commit `115d219fe48dc79f14a5a97d60b22d87d4468cd8`. `UPSTREAM.json` records the official source ZIP and its SHA-256. `upstream-v2.5` preserves the untouched source archive in this independent repository.

## Changes and evidence

| Area | Review and result |
| --- | --- |
| Settings import | Previously accepted any parsed object with an enableGesture field. Now checks a boolean marker, known top-level keys and their basic types, gesture/action containers, chains, menus and blacklist types. Rejects prototype-related keys recursively, more than 24 levels of nesting, more than 20,000 nodes and files over 1 MiB before storage writes. Unit tests include valid v2.5 and legacy gesture maps, malformed data, unsafe keys and limits. |
| Storage reliability | A failed set previously left the in-memory settings changed; reset cleared storage before replacement succeeded. Writes now serialize, snapshot caller patches, commit in memory only after successful storage writes, and reset overwrites known defaults without clearing the working data first. Synthetic quota failures verify state preservation and recovery. |
| Pending edits | Browser testing exposed a pre-import debounced edit overwriting the newly imported setting. Import, export and reset now finish pending writes first. The browser test verifies the imported value remains after the 500 ms debounce interval. |
| UI injection | The new navigator uses textContent and DOM creation only. No innerHTML, unsafeHTML, eval, remote scripts or runtime dependency is introduced by new TypeScript modules. Original Lit rendering remains. |
| Permissions | Existing required, optional, host permissions and web-accessible resource declarations are unchanged. All-URL access and optional clipboard/download/bookmark/pageCapture actions remain necessary to the original feature set and have not been widened. |
| Network and messaging | Reviewed original localization fetches, gesture navigation/search destinations, runtime message handler, menu iframe messaging and download actions. No new telemetry, external message receiver, remote script, fetch or network permission was added. This release leaves these original execution paths unchanged. |
| Dependencies | Runtime enhancement modules have zero npm runtime dependencies. Development tools are lockfile-pinned. fflate 0.8.2 was rejected after audit and replaced by 0.8.3, the patched version for [GHSA-px8p-9vwx-vf98](https://github.com/advisories/GHSA-px8p-9vwx-vf98). npm audit reports 0 known vulnerabilities for the development lockfile at review time. |
| Vendored code | Original Lit bundles are byte-for-byte preserved (reactive-element 2.1.2, lit-html 3.3.3, lit-element 4.2.2). npm audit does not cover these vendored bundles or prove the absence of source-level vulnerabilities. Original and third-party notices remain in the installation ZIP. |
| Installation artifact | Allowlisted packaging excludes source tests, development dependencies, .git, credentials, profiles and logs. Only browser files and licenses plus installation instructions ship. Generated TypeScript JavaScript is included in the install ZIP. SHA-256 accompanies assets. |

## Verification

- `npm run check`: both TypeScript configurations pass.
- `npm test`: 7 unit/integration cases pass, including the actual settings store with synthetic failure injection.
- Real MV3 extension in Chromium 156.0.8078.4 on macOS arm64: search/clear, keyboard shortcut/focus transfer, persisted edits, rejected malformed import, valid backup import surviving pending writes, light/dark, 390 px narrow window, Korean, default left/back gesture, popup controls, no uncaught page errors. Temporary profile and browser are removed/closed in finally.
- Visual review of screenshots: Korean settings, both themes, narrow layout and popup. Narrow-window header overflow was fixed with responsive CSS.
- The exact extracted installation ZIP is tested again before release using FLOWMOUSE_EXTENSION_DIR.
- `git diff upstream-v2.5 -- js/content.js js/background.js js/constants.js js/gesture-recognizer.js js/gesture-visual.js LICENSE THIRD_PARTY_LICENSES.md` is empty. Default gesture/drag/chain execution and licenses are preserved.

This is a targeted source and dependency review with regression tests, not an exhaustive penetration test. Windows and Microsoft Edge runtime execution were not available on this Mac. The same platform-independent Chromium extension ZIP is supplied for manual Windows/macOS Chrome and Edge installation. Firefox-specific packaging and signing are outside this release.
