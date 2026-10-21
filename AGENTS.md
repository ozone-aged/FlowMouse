# FlowMouse independent source-copy project

- This repository is an independent copy of Hmily-LCG/FlowMouse, not a GitHub fork. Preserve the untouched `upstream-v2.5` baseline, provenance in UPSTREAM.json, all original functions and license notices.
- The user explicitly exempts this browser extension from app-manager integration. Do not register it with the manager. Do not install it into the user's browser or register any OS startup/background item. The user installs release ZIPs manually on Windows/macOS Chrome/Edge.
- New implementation defaults to TypeScript. Existing upstream JavaScript stays in place; make minimal integration changes and generate js/enhancements with the TypeScript build. Never commit generated build output, node_modules, profiles or logs.
- For new stable upstream releases, follow docs/UPDATE.md: download source, inspect differences/security, preserve local improvements, test, increment the independent version, and publish the reviewed final installation ZIP to this user's GitHub Releases with hashes. Never send changes to upstream.
- Before each release: npm run check, npm test, npm audit --audit-level=moderate, real disposable-profile Chromium browser tests, and a second browser test against the extracted final ZIP. Stop test browsers afterward. Record platform limitations honestly. Do not enable unattended publishing or a scheduler.
