# FlowMouse independent source-copy project

- This repository is an independent copy of Hmily-LCG/FlowMouse, not a GitHub fork. Preserve the untouched `upstream-v2.5` baseline, provenance in UPSTREAM.json, all original functions and license notices.
- The user explicitly exempts this browser extension from app-manager integration. Do not register it with the manager. Do not install it into the user's browser or register any OS startup/background item. The user installs release ZIPs manually on Windows/macOS Chrome/Edge.
- New implementation defaults to TypeScript. Existing upstream JavaScript stays in place; make minimal integration changes and generate js/enhancements with the TypeScript build. Never commit generated build output, node_modules, profiles or logs.
- For new stable upstream releases, follow docs/UPDATE.md: download source, inspect differences/security, preserve local improvements, test, increment the independent version, and publish the reviewed final installation ZIP to this user's GitHub Releases with hashes. Never send changes to upstream.
- Before each release: npm run check, npm test, npm audit --audit-level=moderate, real disposable-profile Chromium browser tests, and a second browser test against the extracted final ZIP. Stop test browsers afterward. Record platform limitations honestly. Do not enable unattended publishing or a scheduler.

## README 작성 원칙 · 2026-10-28 사용자 요청

- README는 GitHub 첫 화면이다. 프로젝트 소개, 대표 화면, 주요 기능, 짧은 설치·사용법, 중요한 지원 범위와 상세 문서 링크를 중심으로 유지한다.
- 작업 단위별 개선 일지, 감사 설명, 테스트 개수, 전후 측정, 에이전트·Goal·토큰·종료 보고는 README에 누적하지 않는다. docs/handoff.md 또는 해당 상세 기록에 남긴다.
- README는 사용자에게 보이는 기능·설치·지원 범위가 바뀔 때 해당 설명을 고친다. 매 커밋마다 새 개선 문단을 추가할 필요는 없다. 기존의 매 완료 단위 README 갱신 규칙은 이 기준으로 적용한다.
- 상세 검증으로 옮겨도 실제 사용에 필요한 제한, 미검증 상태, 데이터·인증·라이선스 안내는 README에서 숨기거나 과장하지 않는다.
- 이번 정리 전 README는 [보관 문서](docs/readme-archive-20261028.md)에 보존했다. 이후 변경 기록은 상세 문서에서 관리한다.
