# Windows · macOS Chrome / Edge 설치

이 개선판은 FlowMouse v2.5 소스를 독립 복사한 GPL-3.0 배포판입니다.
Chrome/Edge Manifest V3 확장이며 별도 서버나 app-manager가 필요하지 않습니다.

1. GitHub Releases에서 `FlowMouse-Chromium-2.5.0.1.zip`을 받습니다. GitHub가 자동으로 표시하는 `Source code` ZIP은 개발용 소스입니다.
2. ZIP을 오래 보관할 폴더(예: Windows `C:\Extensions\FlowMouse`)에 풉니다. 그 폴더 안에 `manifest.json`이 바로 있어야 합니다.
3. Chrome은 `chrome://extensions`, Edge는 `edge://extensions`를 엽니다.
4. **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**를 선택합니다.
5. 2번의 폴더를 선택한 뒤 확장 메뉴에서 FlowMouse를 고정하고 설정을 엽니다.
6. 기존에 열어 둔 웹페이지는 새로고침합니다. 기본 `←` 제스처는 마우스 오른쪽 버튼을 누른 채 왼쪽으로 움직이는 동작입니다.

원본 FlowMouse가 설치되어 있으면 먼저 원본 설정에서 내보내기 후 이 개선판에 가져옵니다. 제스처가 겹치지 않도록 원본 확장은 꺼 둡니다. 설정 검색은 `Ctrl+K` / macOS `⌘K`로 열 수 있습니다. 한국어와 기존 모든 언어·기능을 유지합니다.

## 다음 버전으로 갱신

1. 설정의 데이터 관리에서 백업을 내보냅니다.
2. 새 Releases의 설치 ZIP을 받고 확장 폴더 바깥에 압축을 풉니다.
3. 브라우저의 확장 관리 화면에서 FlowMouse를 잠시 끕니다.
4. **기존과 같은 경로의 확장 폴더**를 새 파일로 교체합니다. 예전 파일이 남지 않게 폴더 내용 전체를 교체합니다.
5. 확장 관리 화면에서 새로고침(다시 로드)을 누르고 확장을 켠 뒤 웹페이지도 새로고침합니다.

같은 경로를 유지하면 압축해제 확장의 ID와 설정이 유지됩니다. 경로·브라우저가 바뀌면 백업을 가져오면 됩니다. 이 방식은 스토어 자동 업데이트가 아니므로 새 ZIP을 수동으로 적용합니다. ZIP을 받은 뒤 폴더를 지우면 확장이 작동하지 않습니다.

## 파일 무결성

Releases의 `SHA256SUMS.txt`와 받은 ZIP의 SHA-256을 비교할 수 있습니다.

Windows PowerShell:

```powershell
Get-FileHash .\FlowMouse-Chromium-2.5.0.1.zip -Algorithm SHA256
```

macOS:

```sh
shasum -a 256 FlowMouse-Chromium-2.5.0.1.zip
```

Firefox 설치판은 이 릴리스에 포함하지 않습니다. 원본 저장소 소스는 Chromium 대상이며 Firefox는 별도 변형·서명이 필요합니다.
