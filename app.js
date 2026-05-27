(() => {
  'use strict';

  // ============ Config ============
  // 구글 Apps Script Web App URL. POST=저장, GET=목록 조회
  const SHEETS_WEBAPP_URL = '';

  // ============ State ============
  const state = {
    lang: 'ko',
    category: null,
    categoryEtc: '',
    etcColor: '#FFD6E0',
    qType: null,
    qTypeEtc: '',
    question: '',
    selectedEmoji: null, // currently selected emoji DOM node
    emojiPack: 'face',
    deck: null, // cached fetched cards
  };

  const CATEGORY_COLOR = {
    mind: '#FFD6E0', thought: '#D6E5FF', body: '#D6F5D6', relation: '#FFF4C2',
  };

  const EMOJI_PACKS = {
    face:   ['😀','😁','😂','🥲','😊','😍','🥰','😎','🤔','🤩','😴','😭','😡','😱','😳','🤗','😏','🙄','😬','😇'],
    hand:   ['👍','👎','👏','🙌','🙏','👋','🤝','✌️','🤞','🤟','🤘','👌','🫶','💪','🫰','👀'],
    nature: ['🌟','✨','⭐','🌈','☀️','⛅','🌧️','❄️','⚡','🔥','🌸','🌼','🍀','🌳','🌊','🌙'],
    food:   ['🍎','🍊','🍋','🍉','🍇','🍓','🍪','🍩','🍰','🍫','🍕','🍔','🍟','🍙','🍣','🍦','🍿','☕'],
    animal: ['🐶','🐱','🦊','🦁','🐯','🐻','🐼','🐰','🐨','🐮','🐷','🐸','🐵','🐔','🐧','🐝','🐢','🦄'],
    symbol: ['💖','❤️','💛','💚','💙','💜','🖤','❗','❓','💡','📚','🎵','🎉','🎈','🏆','⚽','🎨','✏️'],
  };

  // ============ i18n ============
  function t(k){ return window.I18N[state.lang][k] || k; }
  function applyLang(lang) {
    state.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    const dict = window.I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n'); if (dict[k]) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const k = el.getAttribute('data-i18n-placeholder'); if (dict[k]) el.setAttribute('placeholder', dict[k]);
    });
    const labels = { ko: '한국어', en: 'English', ja: '日本語' };
    document.getElementById('langCurrent').textContent = labels[lang];
    renderCardLabels();
  }

  const $  = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  function showToast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(showToast._t); showToast._t = setTimeout(() => { t.hidden = true; }, 2200);
  }

  // ============ Language dropdown ============
  $('#langBtn').addEventListener('click', () => {
    const menu = $('#langMenu'); const open = !menu.hidden;
    menu.hidden = open; $('#langBtn').setAttribute('aria-expanded', String(!open));
  });
  $('#langMenu').addEventListener('click', e => {
    const li = e.target.closest('li[data-lang]'); if (!li) return;
    applyLang(li.dataset.lang); $('#langMenu').hidden = true;
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.lang-dropdown')) $('#langMenu').hidden = true;
  });

  // ============ Help modal ============
  $('#helpBtn').addEventListener('click', () => { $('#helpModal').hidden = false; });
  $('#helpClose').addEventListener('click', () => { $('#helpModal').hidden = true; });

  // ============ Tabs ============
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const w = tab.dataset.tab;
      $('#view-maker').hidden    = w !== 'maker';
      $('#view-explorer').hidden = w !== 'explorer';
    });
  });

  // ============ Maker: category/type ============
  const categoryChips = $('#categoryChips');
  categoryChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.category = chip.dataset.value;
    const isEtc = state.category === 'etc';
    $('#categoryEtcInput').hidden = !isEtc;
    $('#etcPalette').hidden = !isEtc;
  });
  $('#categoryEtcInput').addEventListener('input', e => { state.categoryEtc = e.target.value.trim(); });
  $('#etcPalette').addEventListener('click', e => {
    const sw = e.target.closest('.swatch'); if (!sw) return;
    $('#etcPalette').querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active'); state.etcColor = sw.dataset.color;
  });

  const typeChips = $('#typeChips');
  typeChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    typeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.qType = chip.dataset.value;
    $('#typeEtcInput').hidden = state.qType !== 'etc';
  });
  $('#typeEtcInput').addEventListener('input', e => { state.qTypeEtc = e.target.value.trim(); });

  // ============ Generate ============
  $('#generateBtn').addEventListener('click', () => {
    const q = $('#questionInput').value.trim();
    if (!q) { showToast(t('toastNeedQ')); return; }
    if (!state.category) { showToast('카테고리를 선택해 주세요.'); return; }
    if (!state.qType)    { showToast('질문 유형을 선택해 주세요.'); return; }
    state.question = q;
    renderCardFront(); renderCardLabels(); autosizeQuestion();
    $('#step-input').hidden = true;
    $('#step-decorate').hidden = false;
  });
  $('#backToInputBtn').addEventListener('click', () => {
    $('#step-decorate').hidden = true; $('#step-input').hidden = false;
  });

  // ============ Card rendering ============
  function getCardColor() {
    if (state.category === 'etc') return state.etcColor;
    return CATEGORY_COLOR[state.category] || '#FFD6E0';
  }
  function getCategoryLabel() {
    const d = window.I18N[state.lang];
    if (state.category === 'etc') return state.categoryEtc || d.catEtc;
    return d['cat' + cap(state.category)] || '';
  }
  function getTypeLabel() {
    const d = window.I18N[state.lang];
    const map = { empathy:'typeEmpathy', imagine:'typeImagine', exp:'typeExp', dilemma:'typeDilemma', etc:'typeEtc' };
    if (state.qType === 'etc') return state.qTypeEtc || d.typeEtc;
    return d[map[state.qType]] || '';
  }
  const cap = s => s ? s[0].toUpperCase()+s.slice(1) : '';

  function renderCardFront() {
    $('#cardFront').style.background = getCardColor();
    $('#cardQuestion').textContent = state.question;
  }
  function renderCardLabels() {
    if ($('#cardCatLabel'))  $('#cardCatLabel').textContent  = getCategoryLabel();
    if ($('#cardTypeLabel')) $('#cardTypeLabel').textContent = getTypeLabel();
  }
  // 글자 수에 따라 폰트 크기 보정
  function autosizeQuestion() {
    const el = $('#cardQuestion'); const len = state.question.length;
    let size = 18;
    if (len > 30) size = 16;
    if (len > 60) size = 14;
    if (len > 90) size = 12;
    el.style.fontSize = size + 'px';
  }

  // ============ Emoji picker (tabs + place + select + size/rotate) ============
  const emojiList = $('#emojiList');
  function renderEmojiPack(pack) {
    emojiList.innerHTML = '';
    EMOJI_PACKS[pack].forEach(em => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = em;
      b.addEventListener('click', () => addEmojiToCard(em));
      emojiList.appendChild(b);
    });
  }
  $('#emojiTabs').addEventListener('click', e => {
    const t = e.target.closest('.emoji-tab'); if (!t) return;
    $$('#emojiTabs .emoji-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    state.emojiPack = t.dataset.pack;
    renderEmojiPack(state.emojiPack);
  });

  $('#clearEmojiBtn').addEventListener('click', () => {
    $('#emojiLayer').innerHTML = ''; deselectEmoji();
  });

  function addEmojiToCard(em) {
    const layer = $('#emojiLayer');
    const node = document.createElement('span');
    node.className = 'emoji';
    node.textContent = em;
    node.dataset.size = '28';
    node.dataset.rot = '0';
    const x = 40 + Math.random() * 160;
    const y = 120 + Math.random() * 180;
    node.style.left = x + 'px';
    node.style.top  = y + 'px';
    applyEmojiTransform(node);
    makeDraggable(node, layer);
    node.addEventListener('pointerdown', () => selectEmoji(node));
    node.addEventListener('dblclick', () => { if (state.selectedEmoji === node) deselectEmoji(); node.remove(); });
    layer.appendChild(node);
    selectEmoji(node);
  }

  function applyEmojiTransform(node) {
    node.style.fontSize = node.dataset.size + 'px';
    node.style.transform = `rotate(${node.dataset.rot}deg)`;
  }

  function selectEmoji(node) {
    if (state.selectedEmoji) state.selectedEmoji.classList.remove('selected');
    state.selectedEmoji = node;
    node.classList.add('selected');
    $('#emojiControls').hidden = false;
    $('#sizeRange').value = node.dataset.size;
    $('#rotRange').value  = node.dataset.rot;
  }
  function deselectEmoji() {
    if (state.selectedEmoji) state.selectedEmoji.classList.remove('selected');
    state.selectedEmoji = null;
    $('#emojiControls').hidden = true;
  }

  $('#sizeRange').addEventListener('input', e => {
    if (!state.selectedEmoji) return;
    state.selectedEmoji.dataset.size = e.target.value;
    applyEmojiTransform(state.selectedEmoji);
  });
  $('#rotRange').addEventListener('input', e => {
    if (!state.selectedEmoji) return;
    state.selectedEmoji.dataset.rot = e.target.value;
    applyEmojiTransform(state.selectedEmoji);
  });
  $('#delEmojiBtn').addEventListener('click', () => {
    if (!state.selectedEmoji) return;
    const n = state.selectedEmoji; deselectEmoji(); n.remove();
  });

  // 카드 빈 영역 클릭 시 선택 해제
  $('#cardFront').addEventListener('pointerdown', e => {
    if (!e.target.classList.contains('emoji')) deselectEmoji();
  });

  function makeDraggable(node, container) {
    let sx, sy, ox, oy, dragging = false;
    node.addEventListener('pointerdown', e => {
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = parseFloat(node.style.left) || 0;
      oy = parseFloat(node.style.top)  || 0;
      node.setPointerCapture(e.pointerId);
    });
    node.addEventListener('pointermove', e => {
      if (!dragging) return;
      const rect = container.getBoundingClientRect();
      const sz = parseFloat(node.dataset.size);
      let nx = ox + (e.clientX - sx);
      let ny = oy + (e.clientY - sy);
      nx = Math.max(0, Math.min(rect.width  - sz, nx));
      ny = Math.max(0, Math.min(rect.height - sz, ny));
      node.style.left = nx + 'px';
      node.style.top  = ny + 'px';
    });
    node.addEventListener('pointerup', () => { dragging = false; });
  }

  // ============ Share (Apps Script) ============
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
      showToast('Apps Script URL을 설정해 주세요. (콘솔 출력)');
      return;
    }
    try {
      await fetch(SHEETS_WEBAPP_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      state.deck = null; // invalidate cache
      showToast(t('toastShared'));
    } catch (err) { console.error(err); showToast(t('toastShareFail')); }
  });

  // ============ Export ============
  $('#exportBtn').addEventListener('click', () => { $('#exportModal').hidden = false; });
  $('#exportClose').addEventListener('click', () => { $('#exportModal').hidden = true; });

  async function cardToCanvas(el) {
    return await html2canvas(el, { backgroundColor: null, scale: 2, useCORS: true });
  }
  function downloadCanvas(c, name) {
    const a = document.createElement('a');
    a.href = c.toDataURL('image/jpeg', 0.95);
    a.download = name; a.click();
  }
  $('#dlFrontBtn').addEventListener('click', async () => {
    deselectEmoji();
    const c = await cardToCanvas($('#cardFront')); downloadCanvas(c, 'question-card-front.jpg');
  });
  $('#dlBackBtn').addEventListener('click', async () => {
    const c = await cardToCanvas($('#cardBack')); downloadCanvas(c, 'question-card-back.jpg');
  });
  $('#copyFrontBtn').addEventListener('click', async () => {
    try {
      deselectEmoji();
      const c = await cardToCanvas($('#cardFront'));
      const blob = await new Promise(res => c.toBlob(res, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast(t('toastCopied'));
    } catch (e) {
      console.error(e);
      $('#exportMsg').textContent = '브라우저가 이미지 클립보드 복사를 지원하지 않아요. JPG 저장을 이용하세요.';
    }
  });

  // ============ Card Explorer ============
  // 다중 선택 칩 (전체 = 다른 선택 모두 해제)
  function bindMultiChips(container) {
    container.addEventListener('click', e => {
      const chip = e.target.closest('.chip'); if (!chip) return;
      const isAll = chip.dataset.value === 'all';
      if (isAll) {
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      } else {
        container.querySelector('.chip[data-value="all"]').classList.remove('active');
        chip.classList.toggle('active');
        // 아무것도 선택 안되면 다시 전체로
        const any = [...container.querySelectorAll('.chip.active')].length > 0;
        if (!any) container.querySelector('.chip[data-value="all"]').classList.add('active');
      }
    });
    // 기본: 전체
    container.querySelector('.chip[data-value="all"]').classList.add('active');
  }
  bindMultiChips($('#expCategoryChips'));
  bindMultiChips($('#expTypeChips'));

  function selectedValues(container) {
    const chips = [...container.querySelectorAll('.chip.active')];
    if (chips.some(c => c.dataset.value === 'all')) return null; // null = all
    return chips.map(c => c.dataset.value);
  }

  async function fetchDeck() {
    if (state.deck) return state.deck;
    if (!SHEETS_WEBAPP_URL) {
      console.warn('SHEETS_WEBAPP_URL 미설정 → 데모 데이터 사용');
      state.deck = DEMO_DECK.slice();
      return state.deck;
    }
    try {
      const res = await fetch(SHEETS_WEBAPP_URL + '?action=list');
      const data = await res.json(); // [{category,type,question,color,...}]
      state.deck = Array.isArray(data) ? data : (data.items || []);
      return state.deck;
    } catch (e) {
      console.error('fetch deck fail, using demo', e);
      state.deck = DEMO_DECK.slice();
      return state.deck;
    }
  }

  const DEMO_DECK = [
    { category:'mind',     type:'empathy', question:'오늘 가장 행복했던 순간은?',       color: CATEGORY_COLOR.mind },
    { category:'mind',     type:'exp',     question:'슬펐던 기억을 한 가지 떠올려봐.',   color: CATEGORY_COLOR.mind },
    { category:'thought',  type:'imagine', question:'내가 투명인간이 된다면?',           color: CATEGORY_COLOR.thought },
    { category:'thought',  type:'dilemma', question:'친구와 약속 vs 가족 여행?',          color: CATEGORY_COLOR.thought },
    { category:'body',     type:'exp',     question:'가장 좋아하는 운동은?',              color: CATEGORY_COLOR.body },
    { category:'body',     type:'empathy', question:'아플 때 누가 옆에 있어주면 좋을까?', color: CATEGORY_COLOR.body },
    { category:'relation', type:'empathy', question:'친구가 고민 있을 때 뭐라고 할래?',   color: CATEGORY_COLOR.relation },
    { category:'relation', type:'imagine', question:'동물과 말할 수 있다면 누구랑?',      color: CATEGORY_COLOR.relation },
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 부족할 때 중복 채우되, 인접 자리에 동일 질문이 오지 않게 배치
  function pickWithNonAdjacentDup(pool, n) {
    if (pool.length === 0) return [];
    if (pool.length >= n) return shuffle(pool).slice(0, n);

    // pool < n: 사용 횟수 기반 그리디 픽 (라운드로빈 + 무작위)
    const result = [];
    const used = new Map(pool.map((_, i) => [i, 0]));
    // 각 카드 등장 횟수가 균형 잡히도록
    for (let k = 0; k < n; k++) {
      const minCount = Math.min(...used.values());
      const candidates = [...used.keys()].filter(i => used.get(i) === minCount && pool[i].question !== (result[result.length-1] && result[result.length-1].question));
      const pickFrom = candidates.length ? candidates :
                       [...used.keys()].filter(i => pool[i].question !== (result[result.length-1] && result[result.length-1].question));
      const finalPool = pickFrom.length ? pickFrom : [...used.keys()];
      const idx = finalPool[Math.floor(Math.random() * finalPool.length)];
      result.push(pool[idx]);
      used.set(idx, used.get(idx) + 1);
    }
    return result;
  }

  $('#drawBtn').addEventListener('click', async () => {
    const grid = $('#drawGrid');
    grid.innerHTML = `<div class="empty-state">${t('loading')}</div>`;
    const deck = await fetchDeck();
    const cats  = selectedValues($('#expCategoryChips'));
    const types = selectedValues($('#expTypeChips'));
    const pool = deck.filter(c =>
      (cats  === null || cats.includes(c.category)) &&
      (types === null || types.includes(c.type))
    );
    if (pool.length === 0) {
      grid.innerHTML = `<div class="empty-state">${t('emptyFilter')}</div>`;
      $('#flipAllBtn').hidden = true;
      return;
    }
    const n = Math.max(1, Math.min(30, parseInt($('#drawCount').value, 10) || 1));
    const picked = pickWithNonAdjacentDup(pool, n);
    grid.innerHTML = '';
    picked.forEach(card => grid.appendChild(buildDrawCard(card)));
    $('#flipAllBtn').hidden = false;
  });

  function categoryLabelFor(value) {
    const d = window.I18N[state.lang];
    return d['cat' + cap(value)] || value || '';
  }
  function typeLabelFor(value) {
    const d = window.I18N[state.lang];
    const map = { empathy:'typeEmpathy', imagine:'typeImagine', exp:'typeExp', dilemma:'typeDilemma', etc:'typeEtc' };
    return d[map[value]] || value || '';
  }

  function buildDrawCard(card) {
    const wrap = document.createElement('div');
    wrap.className = 'draw-card';
    const color = card.color || CATEGORY_COLOR[card.category] || '#FFD6E0';
    wrap.innerHTML = `
      <div class="flipper">
        <div class="face back">
          <div class="b-title">${t('backTitle')}</div>
          <div class="b-sent">
            <span>${t('backSentence1')}</span>
            <span class="blank">(&nbsp;&nbsp;&nbsp;&nbsp;)</span>
            <span>${t('backSentence2')}</span>
          </div>
        </div>
        <div class="face front" style="background:${color}">
          <div class="d-cat">${card.categoryLabel || categoryLabelFor(card.category)}</div>
          <div class="d-type">${card.typeLabel || typeLabelFor(card.type)}</div>
          <div class="d-q">${escapeHtml(card.question)}</div>
        </div>
      </div>`;
    wrap.addEventListener('click', () => wrap.classList.toggle('flipped'));
    return wrap;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  $('#flipAllBtn').addEventListener('click', () => {
    const cards = $$('#drawGrid .draw-card');
    const anyClosed = [...cards].some(c => !c.classList.contains('flipped'));
    cards.forEach(c => c.classList.toggle('flipped', anyClosed));
  });

  // ============ Init ============
  applyLang('ko');
  renderEmojiPack('face');
  categoryChips.querySelector('.chip[data-value="mind"]').click();
  typeChips.querySelector('.chip[data-value="empathy"]').click();
})();
