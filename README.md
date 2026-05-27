# 질문 다있소 (Question Mall)

초등학생을 위한 **질문 카드** 제작 · 탐험 · 추첨 웹앱.
구글 스프레드시트를 DB로 사용해 카드 데이터를 저장/조회합니다.

> Created by. 교육뮤지컬 꿈꾸는 치수쌤 · https://litt.ly/chichiboo

---

## ✨ 기능

### 🛠 질문 제작소 (Maker)
- **카드 카운터**: 첫 화면 상단에 지금까지 모인 전체 질문카드 수가 표시돼요.
- **카테고리** 선택: **마음**(파스텔 핑크) / **생각**(파스텔 블루) / **몸**(파스텔 그린) / **관계**(파스텔 옐로) / **기타**(7색 팔레트에서 직접 선택)
- **질문 유형** 선택: 공감 / 상상 / 경험 / 딜레마 / 기타(직접 입력)
- **만든 사람** 입력 (브라우저 자동완성 차단)
- **자동 저장**: 입력 내용은 `localStorage`에 자동 저장 → 새로고침해도 그대로
- **초기화 버튼**: 모달 확인 후 입력값을 한 번에 깨끗이 지움
- **카드 디자인** (63 × 88 mm / 260 × 360 px)
  - 앞면 상단: 카테고리 배지 · 질문 유형 배지 (둘 다 글래스모피즘 스타일)
  - 앞면 본문: 큼직한 **세리프 따옴표 “ ”** 사이에 질문이 표시
  - 앞면 좌측 하단: 사용자가 고른 **이모지 한 개**가 들어가요
  - 뒷면: 워터컬러 스플래시 · **질문카드** · *질문은 나의 세계*
- **이모지 픽커**: 6개 팩(표정/손짓/자연/음식/동물/기호) · 클릭 한 번으로 앞면 좌측 하단에 삽입 · "이모지 제거" 버튼
- **공유하기**: 구글 스프레드시트로 저장
- **내보내기**: 앞/뒷면 JPG 다운로드 또는 클립보드 복사 (html2canvas)

### 🧭 질문 탐험대 (Explorer)
- 카테고리/유형 다중 선택 + '전체' 토글
- 1–30장 무작위 뽑기 → 뒷면으로 배치 후 클릭 시 플립
- '모두 뒤집기' 토글
- DB에 카드 수가 부족하면 안내 모달 + 가능한 만큼만 뽑기

### 🎰 질문 로또 (Lotto) — NEW
- 버튼 한 번에 무작위 질문 한 장이 화면 중앙에 등장
- **다시 뽑기** 버튼으로 새로운 질문 카드를 계속 뽑을 수 있어요
- 같은 카드가 연속해서 두 번 나오지 않게 보정
- 카드를 클릭하면 앞·뒷면이 자연스럽게 뒤집혀요

### 🔐 관리자 모드
- **숨겨진 입구**: 화면 우측 하단의 작은 회색 점을 클릭
- **비밀번호 보호**: 비밀번호는 코드에 절대 포함되지 않으며, Apps Script의 **Script Properties (서버측 환경변수)** 에 보관
- **대시보드**: **리스트뷰** (테이블, 셀 단위 인라인 편집) / **카드뷰** 토글
- **기능**: 검색(질문/라벨/만든 사람), 카테고리 필터, 새로고침, 행 단위 수정·삭제
- **세션**: 비밀번호는 메모리에만 남고 새로고침/로그아웃 시 사라짐

### 🌐 다국어
- 한국어 / English / 日本語 (우측 상단 드롭다운)
- 모든 새 기능(로또, 초기화 모달, 카운터, 토스트)도 3개 언어 지원
- `html[lang]` 기반 폰트 스택 — 한국어 Noto Sans KR, 일본어 Noto Sans JP, 영어 Noto Sans
- 타이틀 폰트: **Black Han Sans**, 따옴표: **Noto Serif KR**

---

## 🗂 파일 구조

```
questionmall/
├── index.html        # 마크업 (탭: 제작소 · 탐험대 · 로또)
├── styles.css        # 디자인 시스템 + 컴포넌트 스타일
├── i18n.js           # 다국어 사전 (ko/en/ja)
├── app.js            # 상태/렌더링/이벤트/localStorage
└── apps-script/
    └── Code.gs       # 구글 스프레드시트 백엔드 (Apps Script)
```

외부 의존성 (CDN): `html2canvas 1.4.1`, Google Fonts(Black Han Sans, Noto Sans/KR/JP, Noto Serif KR)

---

## 🚀 로컬 실행

별도 빌드가 필요 없습니다. 정적 파일을 그대로 열거나 간단한 정적 서버를 띄우세요.

```bash
# 옵션 1: 그냥 열기
open index.html        # macOS
# 또는 브라우저에 드래그&드롭

# 옵션 2: 정적 서버 (권장 — 클립보드 API는 file://에서 막힐 수 있음)
python3 -m http.server 5500
# → http://localhost:5500
```

스프레드시트 URL을 설정하지 않아도 데모 데이터로 카드 탐험대와 로또를 시험할 수 있습니다.

---

## 🔗 구글 스프레드시트 연동

### 1) 스프레드시트 + Apps Script 준비
1. 새 Google Sheets 생성
2. **확장 프로그램 → Apps Script** 클릭
3. `apps-script/Code.gs` 내용을 통째로 붙여넣고 저장
4. 스프레드시트로 돌아가 새로고침하면 메뉴에 **QuestionMall**이 생김
5. **QuestionMall → 시트 초기화 (헤더 생성)** 실행 — 자동으로 `cards` 시트와 헤더 10개 컬럼 생성
   - (선택) **QuestionMall → 샘플 데이터 추가**

### 2) 웹 앱으로 배포
Apps Script 편집기에서:
1. 우측 상단 **배포 → 새 배포**
2. 유형 선택 → **웹 앱**
3. **다음 사용자로 실행**: 나 / **액세스 권한**: **모든 사용자**
4. 배포 후 발급되는 **Web App URL** 복사

### 3) 프론트엔드에 URL 입력
`app.js` 상단 상수에 붙여넣기:

```js
const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

이제 **공유하기**가 시트로 저장하고, **탐험대 / 로또 / 카드 카운터**가 시트에서 데이터를 가져옵니다.

---

## 🔐 관리자 비밀번호 설정 (환경변수)

비밀번호는 **Apps Script Script Properties**에 저장됩니다. 코드/리포지토리에는 절대 포함되지 않습니다.

**방법 A — 메뉴 사용 (권장)**
1. 스프레드시트 메뉴 **QuestionMall → 관리자 비밀번호 설정**
2. 비밀번호 입력 → 저장

**방법 B — 수동 설정**
1. Apps Script 편집기 → 좌측 **⚙️ 프로젝트 설정**
2. 하단 **스크립트 속성** → **속성 추가**
3. 속성: `ADMIN_PASSWORD` / 값: 원하는 비밀번호 → 저장

비밀번호를 변경하면 즉시 반영됩니다(재배포 불필요).

> ⚠️ Apps Script Web App URL을 알면 누구나 `verify` 호출은 시도할 수 있으므로, 추측이 어려운 비밀번호를 사용하세요.

---

## 💾 자동 저장 (localStorage)

제작소의 입력값은 `localStorage`(키: `questionmall.maker.v1`)에 자동 저장됩니다.

저장 대상: 카테고리, 카테고리 기타 텍스트, 기타 색상, 질문 유형, 유형 기타 텍스트, 질문 내용, 만든 사람, 선택한 이모지.

**초기화 버튼**을 누르면 모달 확인 후 위 항목이 모두 비워지고 `localStorage`도 제거됩니다.

---

## 📑 시트 컬럼 스펙 (`cards` 시트)

| 열 | 키 | 설명 | 예시 |
|---|---|---|---|
| A | `id` | 자동 생성 ID (UUID 8자리) | `1a2b3c4d` |
| B | `timestamp` | 저장 시각 (ISO8601) | `2026-05-27T10:22:33.000Z` |
| C | `lang` | 작성 언어 | `ko` / `en` / `ja` |
| D | `category` | 카테고리 코드 | `mind` `thought` `body` `relation` `etc` |
| E | `categoryLabel` | 표시용 라벨(기타일 때 사용자 입력) | `마음` 또는 `미술` |
| F | `type` | 질문 유형 코드 | `empathy` `imagine` `exp` `dilemma` `etc` |
| G | `typeLabel` | 표시용 라벨 | `공감질문` |
| H | `question` | 질문 본문 (최대 500자) | `오늘 가장 행복했던 순간은?` |
| I | `color` | 카드 배경 HEX | `#FFD6E0` |
| J | `author` | 만든 사람 (최대 30자) | `치수쌤` |

---

## 🌐 API 엔드포인트 (Apps Script Web App)

### POST — 카드 저장
요청 바디(JSON):
```json
{
  "action": "create",
  "timestamp": "2026-05-27T10:22:33.000Z",
  "lang": "ko",
  "category": "mind",
  "categoryLabel": "마음",
  "type": "empathy",
  "typeLabel": "공감질문",
  "question": "오늘 가장 행복했던 순간은?",
  "color": "#FFD6E0",
  "author": "치수쌤"
}
```

### POST — 관리자 작업 (비밀번호 필요)
- `{ "action": "verify",     "password": "..." }`
- `{ "action": "admin-list", "password": "..." }` → `{ ok, items: [...] }`
- `{ "action": "update",     "password": "...", "id": "...", "question": "..." }` (수정 가능 필드: `lang`, `category`, `categoryLabel`, `type`, `typeLabel`, `question`, `color`, `author`)
- `{ "action": "delete",     "password": "...", "id": "..." }`

### GET — 공개 조회
- `?action=list` — 전체 반환 (배열)
- `?action=list&category=mind,thought` — 카테고리 필터 (쉼표 다중)
- `?action=list&type=empathy&limit=50` — 유형 필터 + 최신 N개
- `?action=count` — 총 개수 `{ "count": 42 }` (첫 페이지 카운터가 사용)

---

## 🎨 디자인 토큰

```css
--pink:   #FFD6E0;  /* 마음 */
--blue:   #D6E5FF;  /* 생각 */
--green:  #D6F5D6;  /* 몸 */
--yellow: #FFF4C2;  /* 관계 */
/* 기타 팔레트: #FFD6E0 #D6E5FF #D6F5D6 #FFF4C2 #E5D6FF #FFE0C2 #C2F0F0 */
--card-w: 260px;  /* 63mm * 4 */
--card-h: 360px;  /* 88mm * 4 */
```

배지는 반투명 흰색 + `backdrop-filter: blur(4px)` + 미세한 흰색 테두리로 부드러운 글래스모피즘을 적용했고, 카드 본문 양 끝에는 세리프 큰따옴표 “ ”가 들어가 책의 문장처럼 보입니다.

---

## 🛠 트러블슈팅

- **공유는 되는데 시트에 안 쌓여요** — Apps Script 배포 시 권한이 "모든 사용자"인지, URL이 `app.js`에 정확히 들어갔는지 확인하세요.
- **카드 탐험대/로또가 데모 데이터만 보여요** — `SHEETS_WEBAPP_URL`이 비어 있거나 GET 호출이 실패한 경우입니다. 브라우저 콘솔의 에러를 확인하세요.
- **첫 화면 카운터가 `—` 으로 나와요** — 위와 동일하게 GET `?action=count` 요청이 막혔습니다. 배포 권한을 확인하세요.
- **클립보드 복사가 안 돼요** — `file://`로 열면 차단됩니다. 정적 서버(`python3 -m http.server`)로 띄워서 확인하세요.
- **이모지가 캡처에 안 찍혀요** — html2canvas는 OS 이모지 폰트에 의존합니다. 시스템에 이모지 폰트가 있는 환경에서 캡처하세요.
- **만든 사람 입력칸에 다른 텍스트가 자동 채워져요** — 브라우저 자동완성을 끄려면 해당 브라우저의 자동완성/저장된 항목을 정리하세요. (HTML 측에서 `autocomplete="off"`와 고유 `name`을 이미 적용했어요.)

---

## 📄 License

개인/교육 목적 자유 사용.
