(() => {
  'use strict';

  // ============ Config ============
  // 구글 Apps Script Web App URL을 여기 채워 넣으세요. (배포: 액세스=모든 사용자)
  const SHEETS_WEBAPP_URL = '';

  // ============ State ============
  const state = {
    lang: 'ko',
    category: null,        // 'mind'|'thought'|'body'|'relation'|'etc'
    categoryEtc: '',
    etcColor: '#FFD6E0',
    qType: null,
    qTypeEtc: '',
    question: '',
  };

  const CATEGORY_COLOR = {
    mind:     '#FFD6E0',
    thought:  '#D6E5FF',
    body:     '#D6F5D6',
    relation: '#FFF4C2',
  };

  const EMOJIS = ['😀','😍','🤔','😎','🥰','😭','😡','🤩','👍','💖','✨','🌟','🌈','🍀','🌸','🍎','🍩','🎈','🎉','⭐','🔥','💡','📚','🎵','⚽','🐶','🐱','🦄','🐝','🐢'];

  // ============ i18n ============
  function applyLang(lang) {
    state.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    const dict = window.I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (dict[k]) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const k = el.getAttribute('data-i18n-placeholder');
      if (dict[k]) el.setAttribute('placeholder', dict[k]);
    });
    const labels = { ko: '한국어', en: 'English', ja: '日本語' };
    document.getElementById('langCurrent').textContent = labels[lang];
    // 카드 라벨도 갱신
    renderCardLabels();
  }

  // ============ DOM helpers ============
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { t.hidden = true; }, 2200);
  }

  // ============ Language dropdown ============
  const langBtn = $('#langBtn');
  const langMenu = $('#langMenu');
  langBtn.addEventListener('click', () => {
    const open = !langMenu.hidden;
    langMenu.hidden = open;
    langBtn.setAttribute('aria-expanded', String(!open));
  });
  langMenu.addEventListener('click', e => {
    const li = e.target.closest('li[data-lang]');
    if (!li) return;
    applyLang(li.dataset.lang);
    langMenu.hidden = true;
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.lang-dropdown')) langMenu.hidden = true;
  });

  // ============ Help modal ============
  $('#helpBtn').addEventListener('click', () => { $('#helpModal').hidden = false; });
  $('#helpClose').addEventListener('click', () => { $('#helpModal').hidden = true; });

  // ============ Tabs ============
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      $('#view-maker').hidden    = which !== 'maker';
      $('#view-explorer').hidden = which !== 'explorer';
    });
  });

  // ============ Category / Type chips ============
  const categoryChips = $('#categoryChips');
  categoryChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.category = chip.dataset.value;

    const isEtc = state.category === 'etc';
    $('#categoryEtcInput').hidden = !isEtc;
    $('#etcPalette').hidden = !isEtc;
  });

  $('#categoryEtcInput').addEventListener('input', e => {
    state.categoryEtc = e.target.value.trim();
  });

  $('#etcPalette').addEventListener('click', e => {
    const sw = e.target.closest('.swatch');
    if (!sw) return;
    $('#etcPalette').querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    state.etcColor = sw.dataset.color;
  });

  const typeChips = $('#typeChips');
  typeChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    typeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.qType = chip.dataset.value;
    $('#typeEtcInput').hidden = state.qType !== 'etc';
  });
  $('#typeEtcInput').addEventListener('input', e => {
    state.qTypeEtc = e.target.value.trim();
  });

  // ============ Generate ============
  $('#generateBtn').addEventListener('click', () => {
    const q = $('#questionInput').value.trim();
    if (!q) { showToast(window.I18N[state.lang].toastNeedQ); return; }
    if (!state.category) { showToast('카테고리를 선택해 주세요.'); return; }
    if (!state.qType) { showToast('질문 유형을 선택해 주세요.'); return; }
    state.question = q;

    renderCardFront();
    renderCardLabels();
    $('#step-input').hidden = true;
    $('#step-decorate').hidden = false;
  });

  $('#backToInputBtn').addEventListener('click', () => {
    $('#step-decorate').hidden = true;
    $('#step-input').hidden = false;
  });

  // ============ Card rendering ============
  function getCardColor() {
    if (state.category === 'etc') return state.etcColor;
    return CATEGORY_COLOR[state.category] || '#FFD6E0';
  }
  function getCategoryLabel() {
    const dict = window.I18N[state.lang];
    if (state.category === 'etc') return state.categoryEtc || dict.catEtc;
    return dict['cat' + capitalize(state.category)] || '';
  }
  function getTypeLabel() {
    const dict = window.I18N[state.lang];
    const map = { empathy: 'typeEmpathy', imagine: 'typeImagine', exp: 'typeExp', dilemma: 'typeDilemma', etc: 'typeEtc' };
    if (state.qType === 'etc') return state.qTypeEtc || dict.typeEtc;
    return dict[map[state.qType]] || '';
  }
  function capitalize(s){ return s ? s[0].toUpperCase()+s.slice(1) : ''; }

  function renderCardFront() {
    const front = $('#cardFront');
    front.style.background = getCardColor();
    $('#cardQuestion').textContent = state.question;
  }
  function renderCardLabels() {
    if ($('#cardCatLabel')) $('#cardCatLabel').textContent = getCategoryLabel();
    if ($('#cardTypeLabel')) $('#cardTypeLabel').textContent = getTypeLabel();
  }

  // ============ Emoji picker + draggable placement ============
  const emojiList = $('#emojiList');
  EMOJIS.forEach(em => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = em;
    b.addEventListener('click', () => addEmojiToCard(em));
    emojiList.appendChild(b);
  });

  $('#clearEmojiBtn').addEventListener('click', () => {
    $('#emojiLayer').innerHTML = '';
  });

  function addEmojiToCard(em) {
    const layer = $('#emojiLayer');
    const node = document.createElement('span');
    node.className = 'emoji';
    node.textContent = em;
    // 무작위 위치(중앙 근처)
    const x = 40 + Math.random() * 160;
    const y = 120 + Math.random() * 180;
    node.style.left = x + 'px';
    node.style.top  = y + 'px';
    makeDraggable(node, layer);
    // 더블클릭 시 제거
    node.addEventListener('dblclick', () => node.remove());
    layer.appendChild(node);
  }

  function makeDraggable(node, container) {
    let sx, sy, ox, oy, dragging = false;
    node.addEventListener('pointerdown', e => {
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = parseFloat(node.style.left) || 0;
      oy = parseFloat(node.style.top) || 0;
      node.setPointerCapture(e.pointerId);
      node.style.cursor = 'grabbing';
    });
    node.addEventListener('pointermove', e => {
      if (!dragging) return;
      const rect = container.getBoundingClientRect();
      let nx = ox + (e.clientX - sx);
      let ny = oy + (e.clientY - sy);
      nx = Math.max(0, Math.min(rect.width  - 32, nx));
      ny = Math.max(0, Math.min(rect.height - 32, ny));
      node.style.left = nx + 'px';
      node.style.top  = ny + 'px';
    });
    node.addEventListener('pointerup', () => { dragging = false; node.style.cursor = 'grab'; });
  }

  // ============ Share (Google Sheets via Apps Script) ============
  $('#shareBtn').addEventListener('click', async () => {
    const payload = {
      timestamp: new Date().toISOString(),
      lang: state.lang,
      category: state.category,
      categoryLabel: getCategoryLabel(),
      type: state.qType,
      typeLabel: getTypeLabel(),
      question: state.question,
      color: getCardColor(),
    };
    if (!SHEETS_WEBAPP_URL) {
      console.log('[share payload]', payload);
      showToast('Apps Script URL을 설정해 주세요. (콘솔에 데이터 출력됨)');
      return;
    }
    try {
      await fetch(SHEETS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script 권한 단순화
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      showToast(window.I18N[state.lang].toastShared);
    } catch (err) {
      console.error(err);
      showToast(window.I18N[state.lang].toastShareFail);
    }
  });

  // ============ Export ============
  $('#exportBtn').addEventListener('click', () => { $('#exportModal').hidden = false; });
  $('#exportClose').addEventListener('click', () => { $('#exportModal').hidden = true; });

  async function cardToCanvas(el) {
    return await html2canvas(el, { backgroundColor: null, scale: 2, useCORS: true });
  }
  function downloadCanvas(canvas, filename) {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = filename;
    a.click();
  }

  $('#dlFrontBtn').addEventListener('click', async () => {
    const c = await cardToCanvas($('#cardFront'));
    downloadCanvas(c, 'question-card-front.jpg');
  });
  $('#dlBackBtn').addEventListener('click', async () => {
    const c = await cardToCanvas($('#cardBack'));
    downloadCanvas(c, 'question-card-back.jpg');
  });
  $('#copyFrontBtn').addEventListener('click', async () => {
    try {
      const c = await cardToCanvas($('#cardFront'));
      const blob = await new Promise(res => c.toBlob(res, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast(window.I18N[state.lang].toastCopied);
    } catch (e) {
      console.error(e);
      $('#exportMsg').textContent = '브라우저가 이미지 클립보드 복사를 지원하지 않아요. JPG 저장을 사용해 주세요.';
    }
  });

  // ============ Init ============
  applyLang('ko');
  // 기본 선택
  categoryChips.querySelector('.chip[data-value="mind"]').click();
  typeChips.querySelector('.chip[data-value="empathy"]').click();
})();
