/**
 * 질문 다있소 (Question Mall) – Google Sheets 연동용 Apps Script
 * ----------------------------------------------------------------
 * 사용 방법
 *  1) 새 Google Sheets 만들기 → 확장 프로그램 → Apps Script
 *  2) 이 코드를 통째로 붙여넣기
 *  3) 메뉴 "QuestionMall → 시트 초기화" 실행 (헤더 자동 생성)
 *  4) 배포 → "웹 앱" → 액세스 권한: "모든 사용자"
 *  5) 생성된 Web App URL을 프론트엔드 `app.js`의 `SHEETS_WEBAPP_URL`에 붙여넣기
 *
 * 지원 엔드포인트
 *  - POST  body=JSON       : 카드 1장 저장
 *  - GET   ?action=list    : 전체 카드 JSON 배열로 반환
 *  - GET   ?action=list&category=mind&type=empathy&limit=50 : 필터 조회
 *  - GET   ?action=count   : 저장된 카드 수
 *
 * 시트 구조 (sheet name: "cards")
 *  id | timestamp | lang | category | categoryLabel | type | typeLabel | question | color
 */

const SHEET_NAME = 'cards';
const HEADERS = [
  'id',            // 자동 증가 (UUID 일부)
  'timestamp',     // ISO8601
  'lang',          // ko | en | ja
  'category',      // mind | thought | body | relation | etc
  'categoryLabel', // 표시용 라벨 (etc일 때 사용자 입력값)
  'type',          // empathy | imagine | exp | dilemma | etc
  'typeLabel',     // 표시용 라벨
  'question',      // 본문
  'color',         // 카드 배경 HEX
];

/** ────────────── Menu (수동 초기화용) ────────────── */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('QuestionMall')
    .addItem('시트 초기화 (헤더 생성)', 'initSheet')
    .addItem('샘플 데이터 추가', 'seedSamples')
    .addToUi();
}

function initSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  sh.clear();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  // 가독성 위한 열 너비 조정
  const widths = [120, 170, 60, 90, 110, 90, 110, 360, 90];
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  SpreadsheetApp.getActive().toast('시트 초기화 완료', 'QuestionMall');
}

function seedSamples() {
  const samples = [
    ['mind','마음','empathy','공감질문','오늘 가장 행복했던 순간은?','#FFD6E0'],
    ['thought','생각','imagine','상상질문','내가 투명인간이 된다면 무엇을 할까?','#D6E5FF'],
    ['body','몸','exp','경험질문','가장 좋아하는 운동은?','#D6F5D6'],
    ['relation','관계','empathy','공감질문','친구가 슬퍼할 때 어떻게 위로해줄까?','#FFF4C2'],
  ];
  const sh = ensureSheet();
  samples.forEach(s => {
    sh.appendRow([uuid(), new Date().toISOString(), 'ko', s[0], s[1], s[2], s[3], s[4], s[5]]);
  });
}

/** ────────────── HTTP: POST (카드 저장) ────────────── */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.question) return json({ ok: false, error: 'question required' });

    const sh = ensureSheet();
    const row = [
      uuid(),
      data.timestamp || new Date().toISOString(),
      data.lang || 'ko',
      data.category || '',
      data.categoryLabel || '',
      data.type || '',
      data.typeLabel || '',
      String(data.question).slice(0, 500),
      data.color || '',
    ];
    sh.appendRow(row);
    return json({ ok: true, id: row[0] });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** ────────────── HTTP: GET (목록 / 카운트) ────────────── */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';
  const sh = ensureSheet();
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return json([]);

  const [head, ...rows] = values;
  const items = rows
    .filter(r => r[0])
    .map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));

  if (action === 'count') return json({ count: items.length });

  if (action === 'list') {
    let out = items;
    const p = e.parameter || {};

    if (p.category) {
      const cats = p.category.split(',').map(s => s.trim()).filter(Boolean);
      out = out.filter(it => cats.includes(it.category));
    }
    if (p.type) {
      const types = p.type.split(',').map(s => s.trim()).filter(Boolean);
      out = out.filter(it => types.includes(it.type));
    }
    if (p.limit) {
      const n = parseInt(p.limit, 10);
      if (n > 0) out = out.slice(-n); // 최신 N개
    }
    return json(out);
  }

  return json({ ok: false, error: 'unknown action' });
}

/** ────────────── Helpers ────────────── */
function ensureSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function uuid() {
  return Utilities.getUuid().slice(0, 8);
}
