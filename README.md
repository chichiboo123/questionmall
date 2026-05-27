# 질문 다있소 (Question Mall)

초등학생을 위한 질문 카드 제작 & 아카이브 웹앱.
구글 스프레드시트를 DB로 사용해 카드 데이터를 저장/조회합니다.

> Created by. 교육뮤지컬 꿈꾸는 치수쌤 · https://litt.ly/chichiboo

---

## ✨ 기능

### 카드 제작소
- 카테고리 선택: **마음**(파스텔 핑크) / **생각**(파스텔 블루) / **몸**(파스텔 그린) / **관계**(파스텔 옐로) / **기타**(7색 팔레트에서 직접 선택)
- 질문 유형: 공감 / 상상 / 경험 / 딜레마 / 기타(직접 입력)
- 카드 비율 63 × 88 mm (252 × 352 px) 고정
- **이모지 꾸미기**: 6개 팩(표정/손짓/자연/음식/동물/기호) · 드래그 이동 · 클릭 후 크기·회전 슬라이더 · 더블클릭으로 삭제
- 뒷면 고정 디자인 — `질문카드 / 질문은 (        ) 문이다`
- **공유하기**: 구글 스프레드시트로 저장
- **내보내기**: 앞/뒷면 JPG 다운로드 또는 클립보드 복사 (html2canvas)

### 카드 탐험대
- 카테고리/유형 다중 선택 + '전체' 토글
- 1–30장 무작위 뽑기 → 뒷면으로 배치 후 클릭 시 플립
- '모두 뒤집기' 토글
- DB 카드 수가 요청 수보다 적으면 **중복 허용**, 단 동일 질문이 **연속 자리에 오지 않게** 셔플

### 다국어
- 한국어 / English / 日本語 (우측 상단 드롭다운)
- `html[lang]` 기반 폰트 스택 — 한국어 Noto Sans KR, 일본어 Noto Sans JP, 영어 Noto Sans
- 타이틀 폰트: **Black Han Sans**

---

## 🗂 파일 구조

```
questionmall/
├── index.html        # 마크업
├── styles.css        # 디자인 시스템 + 컴포넌트 스타일
├── i18n.js           # 다국어 사전 (ko/en/ja)
├── app.js            # 상태/렌더링/이벤트
└── apps-script/
    └── Code.gs       # 구글 스프레드시트 백엔드 (Apps Script)
```

외부 의존성 (CDN): `html2canvas 1.4.1`, Google Fonts(Black Han Sans, Noto Sans/KR/JP)

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

스프레드시트 URL을 설정하지 않아도 데모 데이터로 카드 탐험대를 시험할 수 있습니다.

---

## 🔗 구글 스프레드시트 연동

### 1) 스프레드시트 + Apps Script 준비
1. 새 Google Sheets 생성
2. **확장 프로그램 → Apps Script** 클릭
3. `apps-script/Code.gs` 내용을 통째로 붙여넣고 저장
4. 스프레드시트로 돌아가 새로고침하면 메뉴에 **QuestionMall**이 생김
5. **QuestionMall → 시트 초기화 (헤더 생성)** 실행 — 자동으로 `cards` 시트와 헤더 9개 컬럼 생성
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

이제 **공유하기**가 시트로 저장하고, **카드 탐험대**가 시트에서 카드를 가져옵니다.

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

---

## 🌐 API 엔드포인트 (Apps Script Web App)

### POST — 카드 저장
요청 바디(JSON):
```json
{
  "timestamp": "2026-05-27T10:22:33.000Z",
  "lang": "ko",
  "category": "mind",
  "categoryLabel": "마음",
  "type": "empathy",
  "typeLabel": "공감질문",
  "question": "오늘 가장 행복했던 순간은?",
  "color": "#FFD6E0"
}
```
프론트는 CORS 단순화를 위해 `mode: 'no-cors'`로 호출합니다. 응답을 읽지 않아도 저장은 정상 수행됩니다.

### GET — 목록 조회
- `?action=list` — 전체 반환 (배열)
- `?action=list&category=mind,thought` — 카테고리 필터 (쉼표 다중)
- `?action=list&type=empathy&limit=50` — 유형 필터 + 최신 N개
- `?action=count` — 총 개수 `{ "count": 42 }`

응답 예:
```json
[
  {
    "id": "1a2b3c4d",
    "timestamp": "2026-05-27T10:22:33.000Z",
    "lang": "ko",
    "category": "mind",
    "categoryLabel": "마음",
    "type": "empathy",
    "typeLabel": "공감질문",
    "question": "오늘 가장 행복했던 순간은?",
    "color": "#FFD6E0"
  }
]
```

---

## 🎨 디자인 토큰

```css
--pink:   #FFD6E0;  /* 마음 */
--blue:   #D6E5FF;  /* 생각 */
--green:  #D6F5D6;  /* 몸 */
--yellow: #FFF4C2;  /* 관계 */
/* 기타 팔레트: #FFD6E0 #D6E5FF #D6F5D6 #FFF4C2 #E5D6FF #FFE0C2 #C2F0F0 */
--card-w: 252px;  /* 63mm * 4 */
--card-h: 352px;  /* 88mm * 4 */
```

---

## 🛠 트러블슈팅

- **공유는 되는데 시트에 안 쌓여요** — Apps Script 배포 시 권한이 "모든 사용자"인지, URL이 `app.js`에 정확히 들어갔는지 확인하세요.
- **카드 탐험대가 데모 데이터만 보여요** — `SHEETS_WEBAPP_URL`이 비어 있거나 GET 호출이 실패한 경우입니다. 브라우저 콘솔의 에러를 확인하세요.
- **클립보드 복사가 안 돼요** — `file://`로 열면 차단됩니다. 정적 서버(`python3 -m http.server`)로 띄워서 확인하세요. 일부 브라우저는 `ClipboardItem`을 지원하지 않으니 JPG 저장을 사용해 주세요.
- **이모지가 캡처에 안 찍혀요** — html2canvas는 OS 이모지 폰트에 의존합니다. 시스템에 이모지 폰트가 있는 환경에서 캡처하세요.

---

## 📄 License

개인/교육 목적 자유 사용.
