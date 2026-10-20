# URL2QR Studio — 프로젝트 개요 및 기능 명세서

- 문서 버전: 1.0
- 작성일: 2026-10-21
- 대상: `/Users/pkh/workspace/Project04`

---

## 1. 프로젝트 개요

### 1.1 목적

하나의 진입 페이지에서 **QR코드 생성**과 **URL 단축** 두 가지 링크 도구를 제공하는 정적 웹 애플리케이션이다. 기존 QR코드 생성기(`url2qr`)를 그대로 보존하면서, 새 URL 단축 도구(`urlShort`)를 추가하고 두 기능을 선택할 수 있는 첫 번째 페이지를 신설했다.

### 1.2 핵심 가치

| 구분 | 내용 |
| --- | --- |
| 단순함 | 설치·회원가입·API 키 없이 브라우저에서 즉시 사용 |
| 일관성 | 두 도구가 동일한 다크 글래스 UI와 디자인 토큰 공유 |
| 안전성 | 입력값은 화면 상태로만 유지되며 별도 저장소에 보관하지 않음 |
| 이식성 | 빌드 과정 없는 순수 HTML/CSS/JavaScript |

### 1.3 기술 스택

- HTML5, CSS3 (Flexbox / Grid, CSS 변수, 미디어 쿼리)
- Vanilla JavaScript (ES2017+, Fetch API, Clipboard API)
- 외부 라이브러리: `url2qr/js/qrcode.min.js` (QR 렌더링 전용, 오프라인 동작)
- 외부 API: is.gd OpenAPI (URL 단축), 실패 시 v.gd로 자동 재시도
- 폰트: Google Fonts (Outfit, Plus Jakarta Sans)

### 1.4 디렉터리 구조

```
Project04/
├── index.html                # 첫 번째 페이지 (기능 선택 랜딩)
├── css/
│   └── landing.css           # 랜딩 전용 스타일
├── img/
│   └── logo.png              # 랜딩·단축 페이지 로고
├── url2qr/                   # 기존 QR코드 생성기 (이동 완료)
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   ├── js/qrcode.min.js
│   ├── img/logo.png
│   └── logo.png
├── urlShort/                 # 신규 URL 단축 도구
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
└── PROJECT_SPEC.md           # 본 문서
```

### 1.5 실행 방법

```bash
cd /Users/pkh/workspace/Project04
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000/ 접속
```

> `file://`로 직접 열어도 동작하지만, Clipboard API·CORS 정책이 브라우저마다 다를 수 있으므로 로컬 서버 사용을 권장한다.

---

## 2. 화면 흐름

```
[첫 번째 페이지  index.html]
        │
        ├── 'QR코드' 버튼  ──▶  url2qr/index.html   (QR 생성·JPG 다운로드)
        │                              │
        │                              └── '홈' ──▶ 첫 페이지
        │
        └── 'URL단축' 버튼 ──▶  urlShort/index.html (URL 단축·복사)
                                       │
                                       └── '홈' ──▶ 첫 페이지
```

- 랜딩의 기능 카드 전체가 링크(`<a>`)이므로 카드 어디를 클릭해도 이동한다.
- 두 하위 페이지 상단에는 홈으로 돌아가는 버튼을 제공한다.
- 브라우저 뒤로 가기로도 자연스럽게 복귀할 수 있다.

---

## 3. 기능 명세

### F-01. 첫 번째 페이지 — 기능 선택

| 항목 | 명세 |
| --- | --- |
| 위치 | `index.html`, `css/landing.css` |
| 버튼 | **QR코드**, **URL단축** 2개 카드형 버튼 |
| QR코드 동작 | 클릭 시 `url2qr/index.html`로 이동 |
| URL단축 동작 | 클릭 시 `urlShort/index.html`로 이동 |
| 표현 | 아이콘, 제목, 설명, CTA 문구, 호버 시 상승·글로우 효과 |
| 반응형 | 780px 이하에서 1열 배치, 640px 이하에서 헤더·타이포 축소 |
| 접근성 | 카드가 링크 요소이므로 키보드 Tab/Enter로 이동 가능, `:focus-visible` 스타일 제공 |

### F-02. 기존 QR코드 기능 (이동)

| 항목 | 명세 |
| --- | --- |
| 위치 | `url2qr/` (기존 파일 전체 이동) |
| 입력 | URL 또는 텍스트 입력, 미입력 시 안내 토스트 + 입력창 흔들림 |
| 생성 | `qrcode.min.js`로 320×320 캔버스 렌더링, 오류 정정 레벨 H |
| 다운로드 | QR 카드 또는 'JPG 다운로드' 클릭 시 1000×1000 JPG 저장 |
| 복사 | 생성된 URL을 클립보드로 복사 |
| 초기화 | 헤더 '초기화' 버튼 및 로고 클릭 시 초기 상태 복귀 |
| 추가 사항 | 헤더에 '홈' 버튼 추가 (`../index.html`) — 기존 기능에는 영향 없음 |

### F-03. URL 단축 — 입력

| 항목 | 명세 |
| --- | --- |
| 위치 | `urlShort/index.html` > `#longUrl` |
| 레이블 | `URL 입력` |
| 타입 | `text` (한글 IME·붙여넣기 호환을 위해 `type="url"` 대신 사용) |
| 플레이스홀더 | `단축할 URL을 입력하세요 (예: https://example.com/very/long/path)` |
| 자동 보정 | 스킴이 없으면 `https://`를 자동 부여 (예: `example.com` → `https://example.com`) |
| 지우기 | 입력값이 있을 때만 X 버튼 노출, 클릭 시 입력·결과·메시지 초기화 |
| 포커스 | 페이지 진입 시 자동 포커스 |

### F-04. URL 단축 — '단축하기' 버튼 활성화 규칙

| 입력 상태 | 버튼 상태 |
| --- | --- |
| 비어 있음 (`""`) | **비활성화** (`disabled`) |
| 공백만 입력 (`"   "`) | **비활성화** |
| 1자 이상 입력 | 활성화 |
| 요청 진행 중 | 비활성화 + 스피너 + 문구 `단축 중...` |
| 요청 완료/실패 | 입력값 기준으로 재계산 |

- `input` 이벤트마다 `trim()` 결과로 판정한다 (F-04 요구사항 3-2).
- Enter 키로도 제출할 수 있으며, 버튼이 비활성이면 동작하지 않는다.

### F-05. URL 단축 — OpenAPI 요청 및 결과 출력

| 항목 | 명세 |
| --- | --- |
| 트리거 | '단축하기' 클릭 또는 Enter |
| 사전 검증 | `new URL()` 파싱, `http:`/`https:` 프로토콜 및 도메인 존재 확인 |
| 요청 | `GET https://is.gd/create.php?format=json&url={encodeURIComponent(url)}` |
| 성공 | 응답의 `shorturl`을 읽기 전용 출력 상자(`#shortUrl`)에 표시 |
| 실패 | HTTP 오류, `errorcode` 응답, JSON 파싱 실패, 네트워크 오류를 구분해 메시지 표시 |
| 재시도 | 네트워크 오류 시 `https://v.gd/create.php`로 1회 자동 재시도 |
| 출력 상자 | `readonly` 속성으로 직접 수정 불가, 결과 존재 시 초록색 테두리 강조 |
| 입력 변경 | 새 입력이 발생하면 이전 결과와 복사 버튼을 초기화 |

### F-06. URL 단축 — '복사' 버튼

| 항목 | 명세 |
| --- | --- |
| 위치 | 출력 상자 우측 `#btnCopy` |
| 활성화 | 단축 결과가 있을 때만 활성화 |
| 동작 | `navigator.clipboard.writeText()`로 자동 복사 |
| 대체 경로 | Clipboard API 미지원·거부 시 `textarea` + `execCommand('copy')` 사용 |
| 알림 | 성공 시 **`복사하였습니다.`** 토스트 표시 (3.2초 후 자동 사라짐) |
| 실패 | `복사하지 못했습니다. 직접 선택해 주세요.` 안내 |
| 중복 방지 | 새 토스트 표시 전 기존 토스트 제거 |

### F-07. 알림(토스트) 시스템

- 위치: 화면 상단 중앙, `position: fixed`
- 종류: 단축 성공(`🔗 URL이 단축되었습니다.`), 복사 성공/실패
- 애니메이션: 슬라이드 다운 진입, 페이드 아웃 종료
- 접근성: 컨테이너에 `aria-live="assertive"`

### F-08. 오류 및 예외 처리

| 상황 | 사용자 메시지 |
| --- | --- |
| 빈 입력 제출(직접 호출 등) | `단축할 URL을 입력해 주세요.` + 입력창 흔들림 |
| 형식 오류 | `올바른 URL 형식이 아닙니다. 예: https://example.com` |
| 네트워크 실패 | `서비스에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.` |
| HTTP 오류 | `요청에 실패했습니다. (HTTP {status})` |
| API 오류 응답 | is.gd가 반환한 `errormessage` 표시 |
| 응답 형식 오류 | `단축된 URL을 받지 못했습니다.` |

---

## 4. OpenAPI 명세 (is.gd)

### 4.1 요청

```
GET https://is.gd/create.php?format=json&url=https%3A%2F%2Fexample.com
```

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `format` | O | `json` 고정 |
| `url` | O | 단축할 원본 URL (URL 인코딩) |

- 인증 키 불필요, 응답 헤더에 `Access-Control-Allow-Origin: *` 포함 → 브라우저 직접 호출 가능
- 대체 엔드포인트: `https://v.gd/create.php` (동일 스키마)

### 4.2 성공 응답

```json
{ "shorturl": "https://is.gd/kOtTD1" }
```

### 4.3 오류 응답

```json
{ "errorcode": 1, "errormessage": "Please enter a URL to shorten" }
```

---

## 5. UI / 디자인 명세

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--bg-main` | `#0a0d16` | 페이지 배경 |
| `--primary` | `#6366f1` | 주요 버튼·포커스 |
| `--accent-cyan` | `#06b6d4` | 보조 강조 |
| `--accent-emerald` | `#10b981` | 성공·결과 강조 |
| `--text-secondary` | `#94a3b8` | 본문 보조 텍스트 |
| `--radius-xl` | `28px` | 카드 모서리 |

- 배경: 앰비언트 글로우 3개 + 40px 그리드 패턴
- 카드: 반투명 글래스(`backdrop-filter: blur`), 보라색 테두리 글로우
- 상태 표현: 호버 시 `translateY(-6px)`, 포커스 시 명확한 외곽선
- 버튼 비활성화: 회색 배경 + `cursor: not-allowed` + `disabled` 속성

---

## 6. 요구사항 추적표

| 요구사항 | 구현 위치 | 상태 |
| --- | --- | --- |
| 첫 페이지에 'QR코드'·'URL단축' 버튼 | `index.html` `.feature-grid` | 완료 |
| 기존 기능을 `url2qr/`로 이동 | `url2qr/` | 완료 |
| 'QR코드' 클릭 시 해당 페이지 이동 | `index.html` `href="url2qr/index.html"` | 완료 |
| 'URL단축' 클릭 시 `urlShort/` 코드로 이동 | `urlShort/index.html` | 완료 |
| URL 입력창·단축하기 버튼·읽기 전용 출력 상자 | `urlShort/index.html` | 완료 |
| 빈 입력 시 '단축하기' 비활성화 | `urlShort/js/app.js` `updateShortenButton()` | 완료 |
| OpenAPI 호출 후 응답을 출력 상자에 표시 | `requestShortUrl()` / `applyResult()` | 완료 |
| '복사' 클릭 시 자동 복사 + '복사하였습니다' 알림 | `copyShortUrl()` / `showToast()` | 완료 |
| 프로젝트 개요·기능 명세서 | 본 문서 | 완료 |

---

## 7. 제약 사항 및 향후 개선

- is.gd 정책상 동일 URL을 반복 단축하면 같은 짧은 주소가 반환될 수 있다.
- 단축 이력은 저장하지 않으므로 새로고침 시 결과가 사라진다.
- 오프라인에서는 단축 기능을 사용할 수 없다 (QR 생성은 오프라인에서도 동작).
- 향후 개선: 단축 이력 목록, QR–단축 연동(짧은 URL로 QR 생성), 다국어 지원.
