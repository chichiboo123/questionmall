/**
 * 질문 다있소 (Question Mall) – Google Sheets 연동용 Apps Script
 * ----------------------------------------------------------------
 * 사용 방법
 *  1) 새 Google Sheets 만들기 → 확장 프로그램 → Apps Script
 *  2) 이 코드를 통째로 붙여넣기
 *  3) 메뉴 "QuestionMall → 시트 초기화" 실행 (헤더 자동 생성)
 *  4) ⚠️ 프로젝트 설정 → "스크립트 속성"에서 ADMIN_PASSWORD 추가
 *     (코드에 비밀번호를 하드코딩하지 않습니다)
 *  5) 배포 → "웹 앱" → 액세스 권한: "모든 사용자"
 *  6) 생성된 Web App URL을 프론트엔드 `app.js`의 `SHEETS_WEBAPP_URL`에 붙여넣기
 *
 * 엔드포인트
 *  - GET   ?action=list[&category=&type=&limit=]  : 카드 목록 (공개)
 *  - GET   ?action=count                          : 카드 수
 *  - POST  {question, ...}                        : 카드 생성 (공개)
 *  - POST  {action:'verify', password}            : 관리자 비밀번호 확인
 *  - POST  {action:'admin-list', password}        : 관리자용 전체 조회
 *  - POST  {action:'update', password, id, ...}   : 카드 수정
 *  - POST  {action:'delete', password, id}        : 카드 삭제
 */

const SHEET_NAME = 'cards';
const HEADERS = [
  'id', 'timestamp', 'lang',
  'category', 'categoryLabel',
  'type', 'typeLabel',
  'question', 'color', 'author',
];
const EDITABLE = ['lang', 'category', 'categoryLabel', 'type', 'typeLabel', 'question', 'color', 'author'];

/** ────────────── Menu + 자동 초기화 ────────────── */

// 스프레드시트를 열 때마다 실행 — cards 시트가 없으면 자동 생성
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('QuestionMall')
    .addItem('시트 초기화 (헤더 재설정)', 'initSheet')
    .addItem('샘플 데이터 추가', 'seedSamples')
    .addItem('관리자 비밀번호 설정', 'promptSetAdminPassword')
    .addToUi();

  autoInit();
}

// 스크립트가 처음 설치될 때 실행 (Apps Script가 Sheets에 처음 연결될 때)
function onInstall() {
  onOpen();
}

// cards 시트가 없을 때만 자동으로 헤더 생성 (기존 데이터 보호)
function autoInit() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(SHEET_NAME)) {
    initSheet();
  }
}

function initSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  sh.clear();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  const widths = [120, 170, 60, 90, 110, 90, 110, 360, 90, 110];
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  SpreadsheetApp.getActive().toast('시트 초기화 완료', 'QuestionMall');
}

function seedSamples() {
  const samples = [
    ['mind','마음','empathy','공감질문','오늘 가장 행복했던 순간은?','#FFD6E0',''],
    ['thought','생각','imagine','상상질문','내가 투명인간이 된다면 무엇을 할까?','#D6E5FF',''],
    ['body','몸','exp','경험질문','가장 좋아하는 운동은?','#D6F5D6',''],
    ['relation','관계','empathy','공감질문','친구가 슬퍼할 때 어떻게 위로해줄까?','#FFF4C2',''],
  ];
  const sh = ensureSheet();
  samples.forEach(s => {
    sh.appendRow([uuid(), new Date().toISOString(), 'ko', s[0], s[1], s[2], s[3], s[4], s[5], s[6]]);
  });
}

function promptSetAdminPassword() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('관리자 비밀번호 설정', '새 비밀번호를 입력하세요:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const pw = r.getResponseText().trim();
  if (!pw) { ui.alert('빈 비밀번호는 사용할 수 없어요.'); return; }
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', pw);
  ui.alert('관리자 비밀번호가 저장되었습니다.');
}

/** ────────────── Auth ────────────── */
function isAuthed(pw) {
  const real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return !!real && !!pw && String(pw) === String(real);
}

/** ────────────── HTTP: POST ────────────── */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'create';

    // 공개: 카드 생성
    if (action === 'create') {
      if (!data.question) return json({ ok: false, error: 'question required' });
      const sh = ensureSheet();
      const id = uuid();
      sh.appendRow([
        id,
        data.timestamp || new Date().toISOString(),
        data.lang || 'ko',
        data.category || '',
        data.categoryLabel || '',
        data.type || '',
        data.typeLabel || '',
        String(data.question).slice(0, 500),
        data.color || '',
        String(data.author || '').slice(0, 30),
      ]);
      return json({ ok: true, id });
    }

    // 관리자: 비밀번호 검증만
    if (action === 'verify') {
      return json({ ok: isAuthed(data.password) });
    }

    // 아래는 모두 관리자 인증 필요
    if (!isAuthed(data.password)) return json({ ok: false, error: 'unauthorized' });

    if (action === 'admin-list') {
      return json({ ok: true, items: readAll() });
    }

    if (action === 'update') {
      if (!data.id) return json({ ok: false, error: 'id required' });
      const sh = ensureSheet();
      const rowIdx = findRowById(sh, data.id);
      if (rowIdx < 0) return json({ ok: false, error: 'not found' });
      EDITABLE.forEach(key => {
        if (key in data) {
          const col = HEADERS.indexOf(key) + 1;
          let val = data[key];
          if (key === 'question') val = String(val).slice(0, 500);
          sh.getRange(rowIdx, col).setValue(val);
        }
      });
      return json({ ok: true });
    }

    if (action === 'delete') {
      if (!data.id) return json({ ok: false, error: 'id required' });
      const sh = ensureSheet();
      const rowIdx = findRowById(sh, data.id);
      if (rowIdx < 0) return json({ ok: false, error: 'not found' });
      sh.deleteRow(rowIdx);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** ────────────── HTTP: GET (공개 조회) ────────────── */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';
  if (action === 'count') return json({ count: readAll().length });

  if (action === 'list') {
    let out = readAll();
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
      if (n > 0) out = out.slice(-n);
    }
    return json(out);
  }
  return json({ ok: false, error: 'unknown action' });
}

/** ────────────── Helpers ────────────── */
function readAll() {
  const sh = ensureSheet();
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const [head, ...rows] = values;
  return rows
    .filter(r => r[0])
    .map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

function findRowById(sh, id) {
  const ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

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
