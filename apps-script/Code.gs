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
 * ✨ 번역 컬럼
 *   row를 추가할 때 원문 lang 열에는 입력값을, 나머지 두 언어 열에는
 *   `=GOOGLETRANSLATE(원문셀, 원문lang, 대상lang)` 수식을 자동으로 넣어둔다.
 *   기존 데이터를 한 번에 채우려면 메뉴 "QuestionMall → 번역 컬럼 채우기" 실행.
 *
 * 엔드포인트 (질문 카드)
 *  - GET   ?action=list[&category=&type=&limit=]  : 카드 목록 (공개, 모든 번역 컬럼 포함)
 *  - GET   ?action=count                          : 카드 수
 *  - POST  {question, ...}                        : 카드 생성 (공개)
 *  - POST  {action:'verify', password}            : 관리자 비밀번호 확인
 *  - POST  {action:'admin-list', password}        : 관리자용 전체 조회
 *  - POST  {action:'update', password, id, ...}   : 카드 수정
 *  - POST  {action:'delete', password, id}        : 카드 삭제
 *
 * 엔드포인트 (미션 카드 — 추가는 관리자만)
 *  - GET   ?action=missions                       : 미션 목록 (공개, 번역 컬럼 포함)
 *  - GET   ?action=mission-count                  : 미션 수
 *  - POST  {action:'admin-mission-list', password}      : 관리자용 전체 조회
 *  - POST  {action:'admin-mission-create', password, ...}: 미션 추가
 *  - POST  {action:'mission-update', password, id, ...}  : 미션 수정
 *  - POST  {action:'mission-delete', password, id}       : 미션 삭제
 */

const SHEET_NAME = 'cards';
const HEADERS = [
  'id', 'timestamp', 'lang',
  'category',
  'categoryLabel', 'categoryLabel_ko', 'categoryLabel_en', 'categoryLabel_ja',
  'type',
  'typeLabel', 'typeLabel_ko', 'typeLabel_en', 'typeLabel_ja',
  'question', 'question_ko', 'question_en', 'question_ja',
  'color', 'author',
];
// 사용자가 직접 편집할 수 있는 컬럼 (관리자 UPDATE에서 허용)
const EDITABLE = ['lang', 'category', 'categoryLabel', 'type', 'typeLabel', 'question', 'color', 'author'];

// 번역이 필요한 원본 컬럼들 (원본명 → 번역 컬럼 prefix)
const TRANSLATABLE = ['question', 'categoryLabel', 'typeLabel'];
const ALL_LANGS = ['ko', 'en', 'ja'];

// ────────────── 미션 카드 시트 ──────────────
const MISSION_SHEET = 'missions';
const MISSION_HEADERS = [
  'id', 'timestamp', 'lang',
  'mission', 'mission_ko', 'mission_en', 'mission_ja',
  'emoji', 'color',
];
const MISSION_EDITABLE = ['lang', 'mission', 'emoji', 'color'];
const MISSION_TRANSLATABLE = ['mission'];

/** ────────────── Menu + 자동 초기화 ────────────── */

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('QuestionMall')
      .addItem('시트 초기화 (헤더 재설정)', 'initSheet')
      .addItem('샘플 데이터 추가', 'seedSamples')
      .addItem('관리자 비밀번호 설정', 'promptSetAdminPassword')
      .addItem('번역 컬럼 채우기 (기존 행 일괄)', 'backfillTranslations')
      .addSeparator()
      .addItem('미션 시트 초기화 (헤더 재설정)', 'initMissionSheet')
      .addItem('미션 샘플 추가', 'seedMissionSamples')
      .addToUi();
  } catch (e) {
    // 에디터에서 직접 실행 시 getUi()를 쓸 수 없음 — 무시하고 초기화만 진행
  }
  autoInit();
}

function onInstall() { onOpen(); }

function autoInit() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(SHEET_NAME)) initSheet();
  if (!ss.getSheetByName(MISSION_SHEET)) initMissionSheet();
}

function initSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  sh.clear();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  SpreadsheetApp.getActive().toast('시트 초기화 완료', 'QuestionMall');
}

function seedSamples() {
  const samples = [
    { lang:'ko', category:'mind',     categoryLabel:'마음', type:'choice', typeLabel:'선택질문', question:'오늘 가장 행복했던 순간은?',            color:'#FFD6E0', author:'' },
    { lang:'ko', category:'thought',  categoryLabel:'생각', type:'imagine', typeLabel:'상상질문', question:'내가 투명인간이 된다면 무엇을 할까?', color:'#D6E5FF', author:'' },
    { lang:'ko', category:'body',     categoryLabel:'몸',   type:'exp',     typeLabel:'경험질문', question:'가장 좋아하는 운동은?',                  color:'#D6F5D6', author:'' },
    { lang:'ko', category:'relation', categoryLabel:'관계', type:'choice',  typeLabel:'선택질문', question:'친구가 슬퍼할 때 어떻게 위로해줄까?',  color:'#FFF4C2', author:'' },
  ];
  samples.forEach(s => appendCard(s));
}

function initMissionSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(MISSION_SHEET);
  if (!sh) sh = ss.insertSheet(MISSION_SHEET);
  sh.clear();
  sh.getRange(1, 1, 1, MISSION_HEADERS.length).setValues([MISSION_HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  SpreadsheetApp.getActive().toast('미션 시트 초기화 완료', 'QuestionMall');
}

function seedMissionSamples() {
  const samples = [
    { lang:'ko', mission:'질문카드 다시 뽑기',                        emoji:'🔄', color:'#D6E5FF' },
    { lang:'ko', mission:'웃긴 예시를 들어 설명하기',                 emoji:'😆', color:'#FFF4C2' },
    { lang:'ko', mission:'내 오른쪽에 앉은 친구의 생각을 예상해서 답하기', emoji:'➡️', color:'#D6F5D6' },
    { lang:'ko', mission:'세 문장으로 대답하기',                      emoji:'3️⃣', color:'#E5D6FF' },
    { lang:'ko', mission:'왼쪽에 앉은 친구가 대신 대답하기',          emoji:'⬅️', color:'#FFD6E0' },
    { lang:'ko', mission:'꽝! 이번 질문은 넘어가기',                  emoji:'🎉', color:'#FFE0C2' },
    { lang:'ko', mission:'자리에서 일어나서 설명하기',               emoji:'🧍', color:'#C2F0F0' },
    { lang:'ko', mission:'10초 안에 대답하기',                        emoji:'⏱️', color:'#FFD6E0' },
    { lang:'ko', mission:'몸으로 말해요 (몸짓으로만 표현하기)',       emoji:'🤸', color:'#D6F5D6' },
  ];
  samples.forEach(s => appendMission(s));
  SpreadsheetApp.getActive().toast('미션 샘플 추가 완료', 'QuestionMall');
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

    if (action === 'create') {
      if (!data.question) return json({ ok: false, error: 'question required' });
      const id = appendCard(data);
      return json({ ok: true, id });
    }

    if (action === 'verify') return json({ ok: isAuthed(data.password) });

    if (!isAuthed(data.password)) return json({ ok: false, error: 'unauthorized' });

    if (action === 'admin-list') {
      return json({ ok: true, items: readAll() });
    }

    if (action === 'admin-create') {
      if (!data.question) return json({ ok: false, error: 'question required' });
      const id = appendCard(data);
      return json({ ok: true, id });
    }

    if (action === 'update') {
      if (!data.id) return json({ ok: false, error: 'id required' });
      const sh = ensureSheet();
      const rowIdx = findRowById(sh, data.id);
      if (rowIdx < 0) return json({ ok: false, error: 'not found' });

      // 먼저 일반 필드를 직접 쓴다
      EDITABLE.forEach(key => {
        if (key in data) {
          const col = HEADERS.indexOf(key) + 1;
          let val = data[key];
          if (key === 'question') val = String(val).slice(0, 500);
          sh.getRange(rowIdx, col).setValue(val);
        }
      });

      // 번역 대상 필드 또는 lang이 바뀌었으면 _ko/_en/_ja 수식을 다시 셋업
      const langChanged = ('lang' in data);
      const translatableChanged = TRANSLATABLE.some(k => k in data);
      if (langChanged || translatableChanged) {
        const row = sh.getRange(rowIdx, 1, 1, HEADERS.length).getValues()[0];
        const lang = String(row[HEADERS.indexOf('lang')] || 'ko');
        TRANSLATABLE.forEach(base => writeTranslationCells(sh, rowIdx, base, lang));
      }
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

    // ────────────── 미션 카드 (관리자 전용) ──────────────
    if (action === 'admin-mission-list') {
      return json({ ok: true, items: readAllMissions() });
    }

    if (action === 'admin-mission-create') {
      if (!data.mission) return json({ ok: false, error: 'mission required' });
      const id = appendMission(data);
      return json({ ok: true, id });
    }

    if (action === 'mission-update') {
      if (!data.id) return json({ ok: false, error: 'id required' });
      const sh = ensureMissionSheet();
      const rowIdx = findMissionRowById(sh, data.id);
      if (rowIdx < 0) return json({ ok: false, error: 'not found' });

      MISSION_EDITABLE.forEach(key => {
        if (key in data) {
          const col = MISSION_HEADERS.indexOf(key) + 1;
          let val = data[key];
          if (key === 'mission') val = String(val).slice(0, 300);
          if (key === 'emoji')   val = String(val).slice(0, 8);
          sh.getRange(rowIdx, col).setValue(val);
        }
      });

      const langChanged = ('lang' in data);
      const translatableChanged = MISSION_TRANSLATABLE.some(k => k in data);
      if (langChanged || translatableChanged) {
        const row = sh.getRange(rowIdx, 1, 1, MISSION_HEADERS.length).getValues()[0];
        const lang = String(row[MISSION_HEADERS.indexOf('lang')] || 'ko');
        MISSION_TRANSLATABLE.forEach(base => writeTranslationCells(sh, rowIdx, base, lang, MISSION_HEADERS));
      }
      return json({ ok: true });
    }

    if (action === 'mission-delete') {
      if (!data.id) return json({ ok: false, error: 'id required' });
      const sh = ensureMissionSheet();
      const rowIdx = findMissionRowById(sh, data.id);
      if (rowIdx < 0) return json({ ok: false, error: 'not found' });
      sh.deleteRow(rowIdx);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** ────────────── HTTP: GET ────────────── */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';
  if (action === 'count') return json({ count: readAll().length });

  if (action === 'missions') return json(readAllMissions());
  if (action === 'mission-count') return json({ count: readAllMissions().length });

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

/** ────────────── 신규 카드 추가 (번역 수식 자동 세팅) ────────────── */
function appendCard(data) {
  const sh = ensureSheet();
  const id = uuid();
  const lang = String(data.lang || 'ko');

  // 일단 한 줄 추가 — 원본 필드만 채우고 번역 컬럼은 비워둔다
  const row = HEADERS.map(h => {
    switch (h) {
      case 'id': return id;
      case 'timestamp': return data.timestamp || new Date().toISOString();
      case 'lang': return lang;
      case 'category': return data.category || '';
      case 'categoryLabel': return data.categoryLabel || '';
      case 'type': return data.type || '';
      case 'typeLabel': return data.typeLabel || '';
      case 'question': return String(data.question || '').slice(0, 500);
      case 'color': return data.color || '';
      case 'author': return String(data.author || '').slice(0, 30);
      default: return ''; // _ko/_en/_ja 컬럼들
    }
  });
  sh.appendRow(row);
  const rowIdx = sh.getLastRow();

  // 번역 컬럼 (질문/카테고리라벨/타입라벨) 수식 설정
  TRANSLATABLE.forEach(base => writeTranslationCells(sh, rowIdx, base, lang));

  return id;
}

/**
 * 한 행의 base_ko/base_en/base_ja 셀을 채운다.
 *  - 원본 lang에 해당하는 셀: ={원본셀}    (참조)
 *  - 그 외 lang 셀: =IFERROR(GOOGLETRANSLATE({원본셀}, "원본lang", "대상lang"), {원본셀})
 *  - 원본 텍스트가 비어 있으면 모든 번역 셀도 비움
 */
function writeTranslationCells(sh, rowIdx, base, lang, headers) {
  headers = headers || HEADERS;
  const baseCol = headers.indexOf(base) + 1;
  if (baseCol <= 0) return;
  const baseA1 = colLetter(baseCol) + rowIdx;
  const baseVal = sh.getRange(rowIdx, baseCol).getValue();

  ALL_LANGS.forEach(L => {
    const tCol = headers.indexOf(base + '_' + L) + 1;
    if (tCol <= 0) return;
    const cell = sh.getRange(rowIdx, tCol);
    if (baseVal === '' || baseVal == null) { cell.clearContent(); return; }
    if (L === lang) {
      cell.setFormula('=' + baseA1);
    } else {
      cell.setFormula(
        '=IFERROR(GOOGLETRANSLATE(' + baseA1 + ', "' + lang + '", "' + L + '"), ' + baseA1 + ')'
      );
    }
  });
}

/**
 * 기존 행들에 대해 번역 수식을 다시 채우는 보조 함수.
 * 메뉴에서 "번역 컬럼 채우기" 실행 시 호출된다.
 */
function backfillTranslations() {
  const sh = ensureSheet();
  const last = sh.getLastRow();
  if (last < 2) {
    SpreadsheetApp.getActive().toast('데이터가 없어요.', 'QuestionMall');
    return;
  }
  const langCol = HEADERS.indexOf('lang') + 1;
  for (let r = 2; r <= last; r++) {
    const lang = String(sh.getRange(r, langCol).getValue() || 'ko');
    TRANSLATABLE.forEach(base => writeTranslationCells(sh, r, base, lang));
  }

  // 미션 시트도 함께 채운다
  const msh = SpreadsheetApp.getActive().getSheetByName(MISSION_SHEET);
  if (msh && msh.getLastRow() >= 2) {
    const mLangCol = MISSION_HEADERS.indexOf('lang') + 1;
    const mLast = msh.getLastRow();
    for (let r = 2; r <= mLast; r++) {
      const lang = String(msh.getRange(r, mLangCol).getValue() || 'ko');
      MISSION_TRANSLATABLE.forEach(base => writeTranslationCells(msh, r, base, lang, MISSION_HEADERS));
    }
  }
  SpreadsheetApp.getActive().toast('번역 컬럼 채우기 완료', 'QuestionMall');
}

/** ────────────── 미션 카드 헬퍼 ────────────── */
function ensureMissionSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(MISSION_SHEET);
  if (!sh) {
    sh = ss.insertSheet(MISSION_SHEET);
    sh.getRange(1, 1, 1, MISSION_HEADERS.length).setValues([MISSION_HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  const lastCol = Math.max(sh.getLastColumn(), MISSION_HEADERS.length);
  const cur = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  let changed = false;
  MISSION_HEADERS.forEach((h, i) => {
    if (cur[i] !== h) { sh.getRange(1, i + 1).setValue(h); changed = true; }
  });
  if (changed) {
    sh.getRange(1, 1, 1, MISSION_HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function appendMission(data) {
  const sh = ensureMissionSheet();
  const id = uuid();
  const lang = String(data.lang || 'ko');

  const row = MISSION_HEADERS.map(h => {
    switch (h) {
      case 'id': return id;
      case 'timestamp': return data.timestamp || new Date().toISOString();
      case 'lang': return lang;
      case 'mission': return String(data.mission || '').slice(0, 300);
      case 'emoji': return String(data.emoji || '').slice(0, 8);
      case 'color': return data.color || '';
      default: return ''; // _ko/_en/_ja 컬럼들
    }
  });
  sh.appendRow(row);
  const rowIdx = sh.getLastRow();

  MISSION_TRANSLATABLE.forEach(base => writeTranslationCells(sh, rowIdx, base, lang, MISSION_HEADERS));
  return id;
}

function readAllMissions() {
  const sh = ensureMissionSheet();
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const [head, ...rows] = values;
  return rows
    .filter(r => r[0])
    .map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

function findMissionRowById(sh, id) {
  const ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
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
    return sh;
  }
  // 누락된 컬럼을 우측으로 추가 (기존 데이터 보존)
  const lastCol = Math.max(sh.getLastColumn(), HEADERS.length);
  const cur = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  let changed = false;
  HEADERS.forEach((h, i) => {
    if (cur[i] !== h) { sh.getRange(1, i + 1).setValue(h); changed = true; }
  });
  if (changed) {
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function colLetter(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function uuid() {
  return Utilities.getUuid().slice(0, 8);
}
