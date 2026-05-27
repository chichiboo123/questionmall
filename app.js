(() => {
  'use strict';

  // ============ Config ============
  // 구글 Apps Script Web App URL. POST=저장, GET=목록 조회
  const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbx_4o3UiJRXAwhOCeG3U7RNLkIEjfb3JXfA1vm0ec1GU7K_QcggXiXLApo8Viws8Uu8/exec';

  const LS_KEY = 'questionmall.maker.v1';

  // ============ State ============
  const state = {
    lang: 'ko',
    category: null,
    categoryEtc: '',
    etcColor: '#FFD6E0',
    qType: null,
    qTypeEtc: '',
    question: '',
    author: '',
    selectedEmoji: '',   // 사용자가 고른 카드 좌측 하단 이모지 (한 글자)
    emojiPack: 'face',
    deck: null,
    lottoCard: null,
  };

  const CATEGORY_COLOR = {
    mind: '#FFD6E0', thought: '#D6E5FF', body: '#D6F5D6', relation: '#FFF4C2',
  };
  const CATEGORY_COLOR_2 = {
    mind: '#FFA8BD', thought: '#A8C8FF', body: '#A8E0A8', relation: '#FFE38A',
  };
  const CATEGORY_EMOJI = {
    mind: '❤️', thought: '💭', body: '🏃', relation: '👥', etc: '⭐',
  };

  // 각 팩은 약 70~80개로 확장 — 어린이가 다양한 이모지를 둘러보며 고를 수 있도록
  const EMOJI_PACKS = {
    face: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩',
      '😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤗','🤭','🤫','🤔','🤐','🤨',
      '😐','😑','😶','😏','😒','🙄','😬','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢',
      '🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁',
      '😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😢','😭','😱','😖','😞','😓',
      '😩','😫','🥱','😤','😠','😡','🤬','😈','👿','💀','💩','🤡','👻','👽','👾','🤖',
    ],
    hand: [
      '👍','👎','👏','🙌','🙏','👋','🤝','✌️','🤞','🤟','🤘','👌','🤌','🤏','🫶','💪',
      '🫰','👀','🤚','🖐️','✋','🖖','🤛','🤜','✊','👊','👇','👆','👉','👈','☝️','🤙',
      '🫵','✍️','💅','🦾','🦵','🦶','👂','🦻','👃','🧠','🦷','👁️','👅','👄','🫦','💋',
      '🧑','👶','🧒','👦','👧','🧓','👴','👵','👨','👩','🧑‍🎓','🧑‍🏫','🧑‍🎨','🧑‍🚀','🧑‍🚒','🧑‍🍳',
      '👮','🕵️','💂','👷','🤴','👸','👳','👲','🧕','🤰','🤱','👼','🎅','🤶','🦸','🦹',
      '🧙','🧚','🧛','🧜','🧝','🧞','🧟','💆','💇','🚶','🏃','💃','🕺','👯','👫','👨‍👩‍👧',
    ],
    animal: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸',
      '🐵','🙈','🙉','🙊','🐒','🦍','🦧','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦢','🦉',
      '🦅','🦇','🐺','🐗','🐴','🦄','🦓','🦌','🦬','🐂','🐃','🐄','🐎','🐖','🐏','🐑',
      '🦙','🐐','🦒','🐘','🦣','🦏','🦛','🐪','🐫','🦘','🐀','🐁','🐿️','🦔','🦫','🦦',
      '🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙',
      '🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🦭','🐅','🐆','🐾',
    ],
    nature: [
      '🌟','✨','⭐','🌠','🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️',
      '☃️','⛄','🌬️','💨','🌪️','🌫️','🌊','💧','💦','☔','⚡','🔥','💥','🌙','🌛','🌜',
      '🌚','🌝','🌞','☄️','🪐','🌍','🌎','🌏','🗺️','🏔️','⛰️','🌋','🏕️','🏖️','🏜️','🏝️',
      '🌅','🌄','🌇','🌆','🌃','🌉','🌸','💮','🏵️','🌹','🥀','🌺','🌻','🌼','🌷','💐',
      '🌱','🌿','☘️','🍀','🍃','🍂','🍁','🌾','🌵','🌴','🌳','🌲','🪴','🌰','🥜','🪨',
    ],
    food: [
      '🍎','🍏','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝',
      '🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐',
      '🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔',
      '🍟','🍕','🥪','🌮','🌯','🫔','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙',
      '🍚','🍘','🍥','🥮','🍡','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬',
      '🍭','🍮','🍯','☕','🍵','🥛','🧃','🥤','🧋','🍶','🍺','🥂','🍷','🥃','🍹','🧊',
    ],
    activity: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🥅','⛳','🪁',
      '🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼',
      '🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇',
      '🥈','🥉','🏅','🎖️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼',
      '🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟️','🎯','🎮','🕹️','🎰','🧩',
    ],
    object: [
      '📱','💻','⌨️','🖥️','🖱️','💾','💿','📀','📷','📸','📹','🎥','📞','☎️','📺','📻',
      '🎙️','⏰','⏱️','⏲️','⌛','⏳','🔋','🔌','💡','🔦','🕯️','🧯','💸','💵','💰','💳',
      '💎','⚖️','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🧱','🔗','⛓️','🧲',
      '🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🌡️','🛏️','🛋️','🚪','🪑',
      '🚿','🛁','🪥','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪒','🧽','🛒','🛍️','📚','📖',
      '📒','📓','📔','📕','📗','📘','📙','📰','✏️','✒️','🖊️','🖋️','🖌️','🖍️','📝','📌',
    ],
    symbol: [
      '💖','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗',
      '💘','💝','💟','💌','💢','💥','💫','💦','💨','🕳️','💬','🗨️','🗯️','💭','💤','♻️',
      '✅','❌','⭕','🚫','⚠️','❗','❓','❕','❔','‼️','⁉️','💯','🔆','🔅','〽️','🔱',
      '⚜️','🔰','♠️','♥️','♦️','♣️','🃏','🎴','🀄','☮️','✝️','☪️','🕉️','☸️','✡️','🔯',
      '☯️','☦️','🛐','⚛️','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓',
      '🆎','🅰️','🅱️','🆑','🆒','🆓','🆕','🆖','🆗','🆙','🆚','🈁','🈂️','🉐','🉑','㊙️',
    ],
  };
  const RECENT_EMOJI_KEY = 'questionmall.recentEmojis.v1';
  const RECENT_EMOJI_MAX = 16;

  const $  = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

  // ============ i18n ============
  function t(k){ return window.I18N[state.lang][k] || k; }
  function applyLang(lang) {
    state.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    const dict = window.I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n'); if (dict[k]) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const k = el.getAttribute('data-i18n-html'); if (dict[k]) el.innerHTML = dict[k];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const k = el.getAttribute('data-i18n-placeholder'); if (dict[k]) el.setAttribute('placeholder', dict[k]);
    });
    const labels = { ko: '한국어', en: 'English', ja: '日本語' };
    document.getElementById('langCurrent').textContent = labels[lang];
    renderCardLabels();
    rerenderTranslatedDecks();
  }

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
    tab.addEventListener('click', async () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const w = tab.dataset.tab;
      $('#view-maker').hidden    = w !== 'maker';
      $('#view-explorer').hidden = w !== 'explorer';
      $('#view-lotto').hidden    = w !== 'lotto';
      if (w === 'maker') refreshCardCount();
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
    saveLocal();
  });
  $('#categoryEtcInput').addEventListener('input', e => {
    state.categoryEtc = e.target.value.trim(); saveLocal();
  });
  $('#etcPalette').addEventListener('click', e => {
    const sw = e.target.closest('.swatch'); if (!sw) return;
    $('#etcPalette').querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active'); state.etcColor = sw.dataset.color;
    saveLocal();
  });

  const typeChips = $('#typeChips');
  typeChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    typeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.qType = chip.dataset.value;
    $('#typeEtcInput').hidden = state.qType !== 'etc';
    saveLocal();
  });
  $('#typeEtcInput').addEventListener('input', e => {
    state.qTypeEtc = e.target.value.trim(); saveLocal();
  });

  $('#questionInput').addEventListener('input', () => { saveLocal(); });
  $('#authorInput').addEventListener('input', e => {
    state.author = e.target.value.trim(); saveLocal();
  });

  // ============ LocalStorage persistence ============
  function saveLocal() {
    const data = {
      category: state.category,
      categoryEtc: state.categoryEtc,
      etcColor: state.etcColor,
      qType: state.qType,
      qTypeEtc: state.qTypeEtc,
      question: $('#questionInput').value,
      author: state.author,
      selectedEmoji: state.selectedEmoji,
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.category) {
        const chip = categoryChips.querySelector(`.chip[data-value="${data.category}"]`);
        if (chip) {
          categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          state.category = data.category;
          if (data.category === 'etc') {
            $('#categoryEtcInput').hidden = false;
            $('#etcPalette').hidden = false;
          }
        }
      }
      if (data.categoryEtc) {
        state.categoryEtc = data.categoryEtc;
        $('#categoryEtcInput').value = data.categoryEtc;
      }
      if (data.etcColor) {
        state.etcColor = data.etcColor;
        const sw = $('#etcPalette').querySelector(`.swatch[data-color="${data.etcColor}"]`);
        if (sw) { $('#etcPalette').querySelectorAll('.swatch').forEach(s => s.classList.remove('active')); sw.classList.add('active'); }
      }
      if (data.qType) {
        const chip = typeChips.querySelector(`.chip[data-value="${data.qType}"]`);
        if (chip) {
          typeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          state.qType = data.qType;
          if (data.qType === 'etc') $('#typeEtcInput').hidden = false;
        }
      }
      if (data.qTypeEtc) {
        state.qTypeEtc = data.qTypeEtc;
        $('#typeEtcInput').value = data.qTypeEtc;
      }
      if (data.question) $('#questionInput').value = data.question;
      if (data.author) {
        state.author = data.author;
        $('#authorInput').value = data.author;
      }
      if (data.selectedEmoji) state.selectedEmoji = data.selectedEmoji;
    } catch (e) { console.warn('loadLocal failed', e); }
  }

  // ============ Reset ============
  $('#resetBtn').addEventListener('click', () => { $('#resetModal').hidden = false; });
  $('#resetClose').addEventListener('click',  () => { $('#resetModal').hidden = true; });
  $('#resetCancel').addEventListener('click', () => { $('#resetModal').hidden = true; });
  $('#resetOk').addEventListener('click', () => {
    state.category = null; state.categoryEtc = ''; state.etcColor = '#FFD6E0';
    state.qType = null; state.qTypeEtc = '';
    state.question = ''; state.author = ''; state.selectedEmoji = '';

    categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    typeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    $('#categoryEtcInput').value = ''; $('#categoryEtcInput').hidden = true;
    $('#typeEtcInput').value = '';     $('#typeEtcInput').hidden = true;
    $('#etcPalette').hidden = true;
    $('#etcPalette').querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    $('#questionInput').value = '';
    $('#authorInput').value = '';

    try { localStorage.removeItem(LS_KEY); } catch {}
    $('#resetModal').hidden = true;
    showToast(t('toastReset'));
  });

  // ============ Generate ============
  $('#generateBtn').addEventListener('click', () => {
    const q = $('#questionInput').value.trim();
    if (!q) { showToast(t('toastNeedQ')); return; }
    if (!state.category) { showToast(t('toastNeedCat')); return; }
    if (!state.qType)    { showToast(t('toastNeedType')); return; }
    state.question = q;
    state.author = $('#authorInput').value.trim();
    renderCardFront(); renderCardBack(); renderCardLabels(); autosizeQuestion();
    $('#step-input').hidden = true;
    $('#step-decorate').hidden = false;
    saveLocal();
  });
  $('#backToInputBtn').addEventListener('click', () => {
    $('#step-decorate').hidden = true; $('#step-input').hidden = false;
  });

  // ============ Card rendering ============
  function getCardColor() {
    if (state.category === 'etc') return state.etcColor;
    return CATEGORY_COLOR[state.category] || '#FFD6E0';
  }
  function getCardColor2() {
    if (state.category === 'etc') return state.etcColor;
    return CATEGORY_COLOR_2[state.category] || '#FFA8BD';
  }
  function getCategoryLabel() {
    const d = window.I18N[state.lang];
    if (state.category === 'etc') return state.categoryEtc || d.catEtc;
    return d['cat' + cap(state.category)] || '';
  }
  function getCategoryEmoji() {
    return CATEGORY_EMOJI[state.category] || '⭐';
  }
  function getTypeLabel() {
    const d = window.I18N[state.lang];
    const map = { choice:'typeChoice', imagine:'typeImagine', exp:'typeExp', dilemma:'typeDilemma', etc:'typeEtc' };
    if (state.qType === 'etc') return state.qTypeEtc || d.typeEtc;
    return d[map[state.qType]] || '';
  }
  const cap = s => s ? s[0].toUpperCase()+s.slice(1) : '';

  function renderCardFront() {
    const front = $('#cardFront');
    front.style.background = getCardColor();
    $('#cardQuestion').textContent = state.question;
    $('#cardCatEmoji').textContent = getCategoryEmoji();
    $('#cardCharacter').textContent = state.selectedEmoji || '';
    const authorEl = $('#cardAuthor');
    authorEl.textContent = state.author ? '— ' + state.author : '';
    syncEmojiPickerSelection();
  }
  function renderCardBack() {
    const back = $('#cardBack');
    back.style.setProperty('--bk-color',   getCardColor());
    back.style.setProperty('--bk-color-2', getCardColor2());
  }
  function renderCardLabels() {
    if ($('#cardCatLabel'))  $('#cardCatLabel').textContent  = getCategoryLabel();
    if ($('#cardTypeLabel')) $('#cardTypeLabel').textContent = getTypeLabel();
  }
  function autosizeQuestion() {
    const el = $('#cardQuestion'); const len = state.question.length;
    let size = 18;
    if (len > 30) size = 16;
    if (len > 60) size = 14;
    if (len > 90) size = 12;
    el.style.fontSize = size + 'px';
  }

  // ============ Emoji picker ============
  const emojiList = $('#emojiList');
  function renderEmojiPack(pack) {
    emojiList.innerHTML = '';
    const frag = document.createDocumentFragment();
    EMOJI_PACKS[pack].forEach(em => frag.appendChild(buildEmojiButton(em)));
    emojiList.appendChild(frag);
    // 새 팩으로 이동하면 스크롤 위치를 맨 위로
    emojiList.scrollTop = 0;
    syncEmojiPickerSelection();
  }
  function buildEmojiButton(em) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = em;
    b.addEventListener('click', () => setCardEmoji(em));
    return b;
  }
  $('#emojiTabs').addEventListener('click', e => {
    const t = e.target.closest('.emoji-tab'); if (!t) return;
    $$('#emojiTabs .emoji-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    state.emojiPack = t.dataset.pack;
    renderEmojiPack(state.emojiPack);
  });
  $('#clearEmojiBtn').addEventListener('click', () => {
    state.selectedEmoji = '';
    $('#cardCharacter').textContent = '';
    syncEmojiPickerSelection();
    saveLocal();
  });
  $('#applyCustomEmojiBtn').addEventListener('click', () => {
    const input = $('#customEmojiInput');
    const em = normalizeEmojiInput(input.value);
    if (!em) { showToast(t('toastNeedEmoji')); return; }
    setCardEmoji(em);
    input.value = '';
  });
  $('#customEmojiInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#applyCustomEmojiBtn').click();
    }
  });

  // ===== 최근 사용 이모지 =====
  function loadRecentEmojis() {
    try {
      const raw = localStorage.getItem(RECENT_EMOJI_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(x => typeof x === 'string' && x) : [];
    } catch { return []; }
  }
  function saveRecentEmojis(list) {
    try { localStorage.setItem(RECENT_EMOJI_KEY, JSON.stringify(list.slice(0, RECENT_EMOJI_MAX))); } catch {}
  }
  function pushRecentEmoji(em) {
    if (!em) return;
    const list = loadRecentEmojis().filter(x => x !== em);
    list.unshift(em);
    saveRecentEmojis(list);
    renderRecentEmojis();
  }
  function renderRecentEmojis() {
    const row = $('#emojiRecentRow');
    const listEl = $('#emojiRecentList');
    if (!row || !listEl) return;
    const list = loadRecentEmojis();
    if (!list.length) { row.hidden = true; return; }
    row.hidden = false;
    listEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach(em => frag.appendChild(buildEmojiButton(em)));
    listEl.appendChild(frag);
    syncEmojiPickerSelection();
  }

  function setCardEmoji(em) {
    state.selectedEmoji = em;
    $('#cardCharacter').textContent = em;
    pushRecentEmoji(em);
    syncEmojiPickerSelection();
    saveLocal();
  }
  function normalizeEmojiInput(raw) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return '';
    const segments = typeof Intl !== 'undefined' && Intl.Segmenter
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(trimmed)].map(s => s.segment)
      : [...trimmed];
    const firstEmoji = segments.find(seg => EMOJI_REGEX.test(seg));
    return firstEmoji || '';
  }
  function syncEmojiPickerSelection() {
    const sel = state.selectedEmoji;
    document.querySelectorAll('#emojiList button, #emojiRecentList button').forEach(b => {
      b.classList.toggle('selected', !!sel && b.textContent === sel);
    });
  }

  // ============ Share (Apps Script) ============
  // 공유하기는 한 번 누르면 되돌릴 수 없으므로 확인 모달을 먼저 띄운다
  $('#shareBtn').addEventListener('click', () => {
    $('#shareConfirmModal').hidden = false;
  });
  $('#shareConfirmClose').addEventListener('click', () => { $('#shareConfirmModal').hidden = true; });
  $('#shareConfirmCancel').addEventListener('click', () => { $('#shareConfirmModal').hidden = true; });
  $('#shareConfirmOk').addEventListener('click', async () => {
    $('#shareConfirmModal').hidden = true;
    const payload = {
      timestamp: new Date().toISOString(),
      lang: state.lang,
      category: state.category,
      categoryLabel: getCategoryLabel(),
      type: state.qType,
      typeLabel: getTypeLabel(),
      question: state.question,
      color: getCardColor(),
      author: state.author || '',
    };
    if (!SHEETS_WEBAPP_URL) {
      console.log('[share payload]', payload);
      showToast('Apps Script URL을 설정해 주세요. (콘솔 출력)');
      return;
    }
    try {
      await postToScript({ action: 'create', ...payload });
      state.deck = null;
      showToast(t('toastShared'));
      refreshCardCount();
    } catch (err) { console.error(err); showToast(t('toastShareFail')); }
  });

  async function postToScript(body) {
    if (!SHEETS_WEBAPP_URL) throw new Error('SHEETS_WEBAPP_URL not configured');
    const res = await fetch(SHEETS_WEBAPP_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error('Apps Script non-JSON response:', text.slice(0, 200));
      throw new Error(`Apps Script returned non-JSON (HTTP ${res.status})`);
    }
  }

  // ============ Card count (first page) ============
  async function refreshCardCount() {
    const el = $('#cardCountNum');
    if (!el) return;
    if (!SHEETS_WEBAPP_URL) {
      el.textContent = String(DEMO_DECK.length);
      return;
    }
    try {
      const res = await fetch(SHEETS_WEBAPP_URL + '?action=count');
      const data = await res.json();
      el.textContent = String(typeof data.count === 'number' ? data.count : '—');
    } catch {
      el.textContent = '—';
    }
  }

  // ============ Export ============
  $('#exportBtn').addEventListener('click', () => { $('#exportModal').hidden = false; });
  $('#exportClose').addEventListener('click', () => { $('#exportModal').hidden = true; });

  async function cardToCanvas(el) {
    const clone = el.cloneNode(true);
    clone.style.setProperty('border-radius', '0', 'important');
    clone.style.setProperty('box-shadow', 'none', 'important');
    clone.style.setProperty('margin', '0', 'important');
    clone.style.position = 'fixed';
    clone.style.left = '-99999px';
    clone.style.top = '0';
    clone.style.overflow = 'hidden';
    document.body.appendChild(clone);
    // Force any inner rounded card/face containers to also be square so the
    // outer JPG bitmap is a clean rectangle (no transparent → black corners).
    clone.querySelectorAll('.card, .face, .flipper, .lotto-card, .draw-card').forEach(node => {
      node.style.setProperty('border-radius', '0', 'important');
    });
    try {
      const cs = window.getComputedStyle(el);
      let bg = cs.backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') bg = '#ffffff';
      return await html2canvas(clone, { backgroundColor: bg, scale: 2, useCORS: true });
    } finally {
      clone.remove();
    }
  }
  function downloadCanvas(c, name) {
    const a = document.createElement('a');
    a.href = c.toDataURL('image/jpeg', 0.95);
    a.download = name; a.click();
  }
  $('#dlFrontBtn').addEventListener('click', async () => {
    const c = await cardToCanvas($('#cardFront')); downloadCanvas(c, 'question-card-front.jpg');
  });
  $('#dlBackBtn').addEventListener('click', async () => {
    const c = await cardToCanvas($('#cardBack')); downloadCanvas(c, 'question-card-back.jpg');
  });
  $('#copyFrontBtn').addEventListener('click', async () => {
    try {
      const c = await cardToCanvas($('#cardFront'));
      const blob = await new Promise(res => c.toBlob(res, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast(t('toastCopied'));
    } catch (e) {
      console.error(e);
      $('#exportMsg').textContent = '브라우저가 이미지 클립보드 복사를 지원하지 않아요. JPG 저장을 이용하세요.';
    }
  });

  // ============ Max card modal ============
  function showMaxCardModal(max) {
    const tpl = t('maxCardMsg');
    $('#maxCardMsg').textContent = tpl.replace(/\{n\}/g, max);
    $('#maxCardModal').hidden = false;
  }
  $('#maxCardClose').addEventListener('click', () => { $('#maxCardModal').hidden = true; });
  $('#maxCardOk').addEventListener('click',   () => { $('#maxCardModal').hidden = true; });

  // ============ Card Explorer ============
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
        const any = [...container.querySelectorAll('.chip.active')].length > 0;
        if (!any) container.querySelector('.chip[data-value="all"]').classList.add('active');
      }
    });
    container.querySelector('.chip[data-value="all"]').classList.add('active');
  }
  bindMultiChips($('#expCategoryChips'));
  bindMultiChips($('#expTypeChips'));

  function selectedValues(container) {
    const chips = [...container.querySelectorAll('.chip.active')];
    if (chips.some(c => c.dataset.value === 'all')) return null;
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
      const data = await res.json();
      state.deck = Array.isArray(data) ? data : (data.items || []);
      return state.deck;
    } catch (e) {
      console.error('fetch deck fail, using demo', e);
      state.deck = DEMO_DECK.slice();
      return state.deck;
    }
  }

  const DEMO_DECK = [
    { category:'mind',     type:'choice', question:'오늘 가장 행복했던 순간은?',       color: CATEGORY_COLOR.mind },
    { category:'mind',     type:'exp',     question:'슬펐던 기억을 한 가지 떠올려봐.',   color: CATEGORY_COLOR.mind },
    { category:'thought',  type:'imagine', question:'내가 투명인간이 된다면?',           color: CATEGORY_COLOR.thought },
    { category:'thought',  type:'dilemma', question:'친구와 약속 vs 가족 여행?',          color: CATEGORY_COLOR.thought },
    { category:'body',     type:'exp',     question:'가장 좋아하는 운동은?',              color: CATEGORY_COLOR.body },
    { category:'body',     type:'choice', question:'아플 때 누가 옆에 있어주면 좋을까?', color: CATEGORY_COLOR.body },
    { category:'relation', type:'choice', question:'친구가 고민 있을 때 뭐라고 할래?',   color: CATEGORY_COLOR.relation },
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

  $('#drawBtn').addEventListener('click', async () => {
    const grid = $('#drawGrid');
    grid.innerHTML = `<div class="loading-state">${t('loading')}</div>`;
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
    const requested = Math.max(1, Math.min(30, parseInt($('#drawCount').value, 10) || 1));
    let n = requested;
    if (requested > pool.length) {
      n = pool.length;
      showMaxCardModal(pool.length);
      $('#drawCount').value = n;
    }
    const picked = shuffle(pool).slice(0, n);
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
    const map = { choice:'typeChoice', imagine:'typeImagine', exp:'typeExp', dilemma:'typeDilemma', etc:'typeEtc' };
    return d[map[value]] || value || '';
  }

  // 카드의 현재 언어 텍스트를 반환. 스프레드시트의 GOOGLETRANSLATE 결과(question_ko/en/ja 등)를
  // 우선 사용하고, 없으면 원본(question)을 그대로 표시한다.
  function pickLangField(card, base) {
    const lang = state.lang;
    const v = card[base + '_' + lang];
    if (v != null && String(v).trim() !== '') return String(v);
    return card[base] != null ? String(card[base]) : '';
  }
  function cardQuestion(card) { return pickLangField(card, 'question'); }
  function cardCategoryLabel(card) {
    // 사전 정의 카테고리는 i18n 매핑이 항상 정확하므로 그쪽을 우선 사용
    if (card.category && card.category !== 'etc') return categoryLabelFor(card.category);
    const v = pickLangField(card, 'categoryLabel');
    return v || categoryLabelFor(card.category);
  }
  function cardTypeLabel(card) {
    if (card.type && card.type !== 'etc') return typeLabelFor(card.type);
    const v = pickLangField(card, 'typeLabel');
    return v || typeLabelFor(card.type);
  }
  function catEmojiFor(value) { return CATEGORY_EMOJI[value] || '⭐'; }
  function catColor2For(value){ return CATEGORY_COLOR_2[value] || '#FFA8BD'; }

  function buildDrawCard(card) {
    const wrap = document.createElement('div');
    wrap.className = 'draw-card';
    wrap._cardRef = card;
    const color  = card.color || CATEGORY_COLOR[card.category] || '#FFD6E0';
    const color2 = catColor2For(card.category);
    const catLabel  = cardCategoryLabel(card);
    const typeLabel = cardTypeLabel(card);
    const catEm  = catEmojiFor(card.category);
    const author = card.author ? `— ${escapeHtml(card.author)}` : '';
    wrap.innerHTML = `
      <div class="flipper">
        <div class="face back" style="--bk-color:${color};--bk-color-2:${color2}">
          <div class="b-mark">?</div>
          <div class="b-title">${escapeHtml(t('backTitle'))}</div>
          <div class="b-tagline">${escapeHtml(t('backTagline'))}</div>
        </div>
        <div class="face front" style="background:${color}">
          <div class="d-top">
            <div class="d-cat"><span>${catEm}</span><span>${escapeHtml(catLabel)}</span></div>
            <div class="d-type"><span>${escapeHtml(typeLabel)}</span></div>
          </div>
          <div class="d-body">
            <span class="d-quote-l">“</span>
            <div class="d-q">${escapeHtml(cardQuestion(card))}</div>
            <span class="d-quote-r">”</span>
          </div>
          <div class="d-bottom">
            <span class="d-char">${catEm}</span>
            <span class="d-author">${author}</span>
          </div>
        </div>
      </div>`;
    wrap.addEventListener('click', () => wrap.classList.toggle('flipped'));
    return wrap;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  $('#flipAllBtn').addEventListener('click', () => {
    const cards = $$('#drawGrid .draw-card');
    const anyClosed = [...cards].some(c => !c.classList.contains('flipped'));
    cards.forEach(c => c.classList.toggle('flipped', anyClosed));
  });

  // ============ Lotto ============
  $('#lottoDrawBtn').addEventListener('click', async () => {
    const stage = $('#lottoStage');
    const btn = $('#lottoDrawBtn');
    stage.innerHTML = `<div class="lotto-empty muted">${t('loading')}</div>`;
    const deck = await fetchDeck();
    if (!deck.length) {
      stage.innerHTML = `<div class="lotto-empty muted">${t('emptyLotto')}</div>`;
      return;
    }
    // 새로 뽑은 카드는 이전 카드와 같지 않도록 — 한 장 이상이면 보장
    let card;
    let tries = 0;
    do { card = deck[Math.floor(Math.random() * deck.length)]; tries++; }
    while (deck.length > 1 && state.lottoCard
           && card.question === state.lottoCard.question && tries < 12);
    state.lottoCard = card;
    stage.innerHTML = '';
    stage.appendChild(buildLottoCard(card));
    btn.setAttribute('data-i18n', 'lottoRedraw');
    btn.textContent = t('lottoRedraw');
  });

  function buildLottoCard(card) {
    const wrap = document.createElement('div');
    wrap.className = 'lotto-card flipped'; // 처음엔 앞면(질문) 바로 보이도록
    wrap._cardRef = card;
    const color  = card.color || CATEGORY_COLOR[card.category] || '#FFD6E0';
    const color2 = catColor2For(card.category);
    const catLabel  = cardCategoryLabel(card);
    const typeLabel = cardTypeLabel(card);
    const catEm  = catEmojiFor(card.category);
    const author = card.author ? `— ${escapeHtml(card.author)}` : '';
    wrap.innerHTML = `
      <div class="flipper">
        <div class="face back" style="--bk-color:${color};--bk-color-2:${color2}">
          <div class="b-mark">?</div>
          <div class="b-title">${escapeHtml(t('backTitle'))}</div>
          <div class="b-tagline">${escapeHtml(t('backTagline'))}</div>
        </div>
        <div class="face front" style="background:${color}">
          <div class="l-top">
            <div class="l-cat"><span>${catEm}</span><span>${escapeHtml(catLabel)}</span></div>
            <div class="l-type"><span>${escapeHtml(typeLabel)}</span></div>
          </div>
          <div class="l-body">
            <span class="l-quote-l">“</span>
            <div class="l-q">${escapeHtml(cardQuestion(card))}</div>
            <span class="l-quote-r">”</span>
          </div>
          <div class="l-bottom">
            <span class="l-char">${catEm}</span>
            <span class="l-author">${author}</span>
          </div>
        </div>
      </div>`;
    wrap.addEventListener('click', () => wrap.classList.toggle('flipped'));
    return wrap;
  }

  // 언어가 바뀌면 현재 표시 중인 탐험대/로또 카드를 재렌더링한다
  function rerenderTranslatedDecks() {
    const drawGrid = document.getElementById('drawGrid');
    if (drawGrid) {
      drawGrid.querySelectorAll('.draw-card').forEach(wrap => {
        const card = wrap._cardRef; if (!card) return;
        const qEl = wrap.querySelector('.d-q');
        const catEl = wrap.querySelector('.d-cat span:last-child');
        const typeEl = wrap.querySelector('.d-type span');
        const bTitle = wrap.querySelector('.b-title');
        const bTagline = wrap.querySelector('.b-tagline');
        if (qEl) qEl.textContent = cardQuestion(card);
        if (catEl) catEl.textContent = cardCategoryLabel(card);
        if (typeEl) typeEl.textContent = cardTypeLabel(card);
        if (bTitle) bTitle.textContent = t('backTitle');
        if (bTagline) bTagline.textContent = t('backTagline');
      });
    }
    const lottoStage = document.getElementById('lottoStage');
    const wrap = lottoStage && lottoStage.querySelector('.lotto-card');
    const card = wrap && wrap._cardRef;
    if (wrap && card) {
      const qEl = wrap.querySelector('.l-q');
      const catEl = wrap.querySelector('.l-cat span:last-child');
      const typeEl = wrap.querySelector('.l-type span');
      const bTitle = wrap.querySelector('.b-title');
      const bTagline = wrap.querySelector('.b-tagline');
      if (qEl) qEl.textContent = cardQuestion(card);
      if (catEl) catEl.textContent = cardCategoryLabel(card);
      if (typeEl) typeEl.textContent = cardTypeLabel(card);
      if (bTitle) bTitle.textContent = t('backTitle');
      if (bTagline) bTagline.textContent = t('backTagline');
    }
  }

  // ============ Admin Mode ============
  let adminPw = null;
  let adminItems = [];
  let adminView = 'list';

  const CAT_OPTIONS  = ['mind','thought','body','relation','etc'];
  const TYPE_OPTIONS = ['choice','imagine','exp','dilemma','etc'];

  $('#adminGate').addEventListener('click', () => {
    $('#adminLockModal').hidden = false;
    $('#adminPwInput').value = '';
    $('#adminLoginMsg').textContent = '';
    setTimeout(() => $('#adminPwInput').focus(), 50);
  });
  $('#adminLockClose').addEventListener('click', () => { $('#adminLockModal').hidden = true; });
  $('#adminPwInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#adminLoginBtn').click(); });

  $('#adminLoginBtn').addEventListener('click', async () => {
    const pw = $('#adminPwInput').value;
    if (!pw) return;
    if (!SHEETS_WEBAPP_URL) {
      $('#adminLoginMsg').textContent = t('adminNoUrl');
      return;
    }
    try {
      const r = await postToScript({ action: 'verify', password: pw });
      if (!r.ok) { $('#adminLoginMsg').textContent = t('adminWrong'); return; }
      adminPw = pw;
      $('#adminLockModal').hidden = true;
      $('#adminPanel').hidden = false;
      await loadAdminData();
    } catch (e) {
      console.error(e);
      $('#adminLoginMsg').textContent = t('adminWrong');
    }
  });

  $('#adminLogoutBtn').addEventListener('click', () => {
    adminPw = null; adminItems = [];
    $('#adminPanel').hidden = true;
  });

  $('#adminReloadBtn').addEventListener('click', loadAdminData);

  // ============ Admin: add new card ============
  const CAT_LABEL_MAP = { mind:'마음', thought:'생각', body:'몸', relation:'관계', etc:'기타' };
  const TYPE_LABEL_MAP = { choice:'선택질문', imagine:'상상질문', exp:'경험질문', dilemma:'딜레마질문', etc:'기타' };
  const CAT_COLOR_MAP = { mind:'#FFD6E0', thought:'#D6E5FF', body:'#D6F5D6', relation:'#FFF4C2', etc:'#E5D6FF' };

  function fillAddDefaults() {
    const cat = $('#aaCategory').value;
    const type = $('#aaType').value;
    $('#aaCategoryLabel').value = CAT_LABEL_MAP[cat] || '';
    $('#aaTypeLabel').value     = TYPE_LABEL_MAP[type] || '';
    $('#aaColor').value         = CAT_COLOR_MAP[cat] || '#FFD6E0';
  }
  $('#adminAddBtn').addEventListener('click', () => {
    $('#aaCategory').value = 'mind';
    $('#aaType').value = 'choice';
    $('#aaQuestion').value = '';
    $('#aaAuthor').value = '';
    $('#aaLang').value = state.lang;
    fillAddDefaults();
    $('#adminAddMsg').textContent = '';
    $('#adminAddModal').hidden = false;
    setTimeout(() => $('#aaQuestion').focus(), 50);
  });
  $('#adminAddClose').addEventListener('click',  () => { $('#adminAddModal').hidden = true; });
  $('#adminAddCancel').addEventListener('click', () => { $('#adminAddModal').hidden = true; });
  $('#aaCategory').addEventListener('change', fillAddDefaults);
  $('#aaType').addEventListener('change', fillAddDefaults);

  $('#adminAddSave').addEventListener('click', async () => {
    const question = $('#aaQuestion').value.trim();
    if (!question) { $('#adminAddMsg').textContent = t('toastNeedQ'); return; }
    const payload = {
      action: 'admin-create',
      password: adminPw,
      timestamp: new Date().toISOString(),
      lang: $('#aaLang').value,
      category: $('#aaCategory').value,
      categoryLabel: $('#aaCategoryLabel').value.trim() || (CAT_LABEL_MAP[$('#aaCategory').value] || ''),
      type: $('#aaType').value,
      typeLabel: $('#aaTypeLabel').value.trim() || (TYPE_LABEL_MAP[$('#aaType').value] || ''),
      question,
      color: $('#aaColor').value.trim() || (CAT_COLOR_MAP[$('#aaCategory').value] || '#FFD6E0'),
      author: $('#aaAuthor').value.trim(),
    };
    try {
      const r = await postToScript(payload);
      if (!r.ok) throw new Error(r.error || 'fail');
      $('#adminAddModal').hidden = true;
      showToast(t('saved'));
      state.deck = null;
      refreshCardCount();
      await loadAdminData();
    } catch (e) {
      console.error(e);
      $('#adminAddMsg').textContent = t('saveFail');
    }
  });

  $('#adminSearch').addEventListener('input', renderAdmin);
  $('#adminFilterCat').addEventListener('change', renderAdmin);
  $('#adminFilterType').addEventListener('change', renderAdmin);
  $('#adminSort').addEventListener('change', renderAdmin);

  // Custom delete confirmation modal (replaces native confirm)
  let _pendingDeleteId = null;
  function openDeleteModal(item) {
    _pendingDeleteId = item.id;
    const preview = $('#adminDeletePreview');
    const color = item.color || CATEGORY_COLOR[item.category] || '#FFD6E0';
    preview.innerHTML = `
      <div class="del-card" style="background:${escapeAttr(color)}">
        <div class="del-meta">
          <span class="del-badge">${escapeHtml(item.categoryLabel || item.category || '')}</span>
          <span class="del-badge del-badge-type">${escapeHtml(item.typeLabel || item.type || '')}</span>
        </div>
        <div class="del-q">${escapeHtml(item.question || '')}</div>
        ${item.author ? `<div class="del-author">— ${escapeHtml(item.author)}</div>` : ''}
      </div>`;
    $('#adminDeleteModal').hidden = false;
  }
  function closeDeleteModal() {
    _pendingDeleteId = null;
    $('#adminDeleteModal').hidden = true;
  }
  $('#adminDeleteClose').addEventListener('click', closeDeleteModal);
  $('#adminDeleteCancel').addEventListener('click', closeDeleteModal);
  $('#adminDeleteOk').addEventListener('click', async () => {
    if (!_pendingDeleteId) return;
    const id = _pendingDeleteId;
    closeDeleteModal();
    await deleteItem(id);
  });

  $$('.view-toggle .vt').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.view-toggle .vt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      adminView = btn.dataset.view;
      renderAdmin();
    });
  });

  async function loadAdminData() {
    const content = $('#adminContent');
    $('#adminStats').textContent = '';
    content.innerHTML = `<p class="muted">${t('loading')}</p>`;
    try {
      const r = await postToScript({ action: 'admin-list', password: adminPw });
      if (!r.ok) {
        adminPw = null;
        $('#adminPanel').hidden = true;
        showToast(t('adminWrong'));
        return;
      }
      adminItems = r.items || [];
      state.deck = null;
      renderAdmin();
    } catch (e) {
      console.error('[admin-list error]', e);
      const isUrlError = e.message.includes('not configured');
      content.innerHTML = `
        <div class="admin-error-box">
          <p class="admin-error-title">⚠️ 데이터를 불러올 수 없어요</p>
          ${isUrlError
            ? `<p>app.js의 <code>SHEETS_WEBAPP_URL</code>을 설정하지 않았어요.</p>`
            : `<p>Apps Script 응답 오류입니다. 아래를 확인해 주세요:</p>
               <ol>
                 <li>Apps Script를 <b>최신 코드로 다시 배포</b>했는지 확인</li>
                 <li>배포 설정: 실행 권한 = <b>나</b> / 액세스 = <b>모든 사용자</b></li>
                 <li>Script Properties에 <code>ADMIN_PASSWORD</code> 설정 여부</li>
               </ol>
               <p class="muted small">오류: ${escapeHtml(e.message)}</p>`
          }
        </div>`;
    }
  }

  function filteredAdminItems() {
    const q = $('#adminSearch').value.trim().toLowerCase();
    const cat = $('#adminFilterCat').value;
    const type = $('#adminFilterType') ? $('#adminFilterType').value : '';
    const sort = $('#adminSort') ? $('#adminSort').value : 'newest';
    let list = adminItems.filter(it => {
      if (cat && it.category !== cat) return false;
      if (type && it.type !== type) return false;
      if (q) {
        const hay = [it.question, it.categoryLabel, it.typeLabel, it.author].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const ts = it => { const d = new Date(it.timestamp); return isNaN(d) ? 0 : d.getTime(); };
    if (sort === 'newest')      list = list.slice().sort((a, b) => ts(b) - ts(a));
    else if (sort === 'oldest') list = list.slice().sort((a, b) => ts(a) - ts(b));
    else if (sort === 'category') {
      const order = ['mind','thought','body','relation','etc'];
      list = list.slice().sort((a, b) => {
        const da = order.indexOf(a.category); const db = order.indexOf(b.category);
        return (da === -1 ? 99 : da) - (db === -1 ? 99 : db);
      });
    }
    return list;
  }

  function renderAdmin() {
    const items = filteredAdminItems();
    const total = adminItems.length;
    const shown = items.length;
    const statsEl = $('#adminStats');
    if (total === shown) {
      statsEl.textContent = t('totalCount').replace('{n}', total);
    } else {
      statsEl.textContent = `${shown} / ${total}`;
    }
    const content = $('#adminContent');
    if (items.length === 0) {
      content.innerHTML = `<div class="admin-empty"><div class="admin-empty-emoji">📭</div><p class="muted">${t('emptyAdmin')}</p></div>`;
      return;
    }
    if (adminView === 'list') renderAdminList(items, content);
    else renderAdminCards(items, content);
  }

  function renderAdminList(items, container) {
    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
      <thead><tr>
        <th>ID</th><th>Lang</th><th>Category</th><th>Label</th>
        <th>Type</th><th>Label</th><th>Question</th><th>Author</th><th>Color</th><th></th>
      </tr></thead>
      <tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    items.forEach(it => tbody.appendChild(buildAdminRow(it)));
    container.innerHTML = '';
    container.appendChild(table);
  }

  function buildAdminRow(it) {
    const tr = document.createElement('tr');
    tr.dataset.id = it.id;
    tr.innerHTML = `
      <td><code>${escapeHtml(it.id)}</code><div class="muted small">${escapeHtml(formatTs(it.timestamp))}</div></td>
      <td>${selectHtml('lang', it.lang, ['ko','en','ja'])}</td>
      <td>${selectHtml('category', it.category, CAT_OPTIONS)}</td>
      <td><input data-k="categoryLabel" value="${escapeAttr(it.categoryLabel || '')}" /></td>
      <td>${selectHtml('type', it.type, TYPE_OPTIONS)}</td>
      <td><input data-k="typeLabel" value="${escapeAttr(it.typeLabel || '')}" /></td>
      <td><textarea data-k="question" rows="2">${escapeHtml(it.question || '')}</textarea></td>
      <td><input data-k="author" value="${escapeAttr(it.author || '')}" /></td>
      <td>
        <span class="color-dot" style="background:${escapeAttr(it.color || '#fff')}"></span>
        <input data-k="color" value="${escapeAttr(it.color || '')}" style="width:88px" />
      </td>
      <td class="actions">
        <button class="primary-btn small-btn" data-act="save">${t('save')}</button>
        <button class="danger-btn" data-act="del">${t('deleteBtn')}</button>
      </td>`;
    bindRowEvents(tr, it);
    return tr;
  }

  function selectHtml(key, val, opts) {
    return `<select data-k="${key}">` +
      opts.map(o => `<option value="${o}" ${o===val?'selected':''}>${o}</option>`).join('') +
      `</select>`;
  }

  function bindRowEvents(row, original) {
    row.querySelectorAll('[data-k]').forEach(input => {
      input.addEventListener('input',  () => row.classList.add('dirty'));
      input.addEventListener('change', () => row.classList.add('dirty'));
    });
    row.querySelector('[data-act="save"]').addEventListener('click', () => saveRow(row, original));
    row.querySelector('[data-act="del"]').addEventListener('click',  () => openDeleteModal(original));
  }

  function collectFields(scope) {
    const fields = {};
    scope.querySelectorAll('[data-k]').forEach(el => { fields[el.dataset.k] = el.value; });
    return fields;
  }

  async function saveRow(scope, original) {
    const fields = collectFields(scope);
    try {
      const r = await postToScript({ action: 'update', password: adminPw, id: original.id, ...fields });
      if (!r.ok) throw new Error(r.error || 'fail');
      Object.assign(original, fields);
      scope.classList.remove('dirty');
      const dot = scope.querySelector('.color-dot');
      if (dot) dot.style.background = fields.color || '#fff';
      state.deck = null;
      showToast(t('saved'));
    } catch (e) {
      console.error(e); showToast(t('saveFail'));
    }
  }

  async function deleteItem(id) {
    try {
      const r = await postToScript({ action: 'delete', password: adminPw, id });
      if (!r.ok) throw new Error(r.error || 'fail');
      adminItems = adminItems.filter(x => x.id !== id);
      state.deck = null;
      renderAdmin();
      refreshCardCount();
      showToast(t('deleted'));
    } catch (e) {
      console.error(e); showToast(t('saveFail'));
    }
  }

  function renderAdminCards(items, container) {
    const grid = document.createElement('div');
    grid.className = 'admin-cards';
    items.forEach(it => grid.appendChild(buildAdminCardEl(it)));
    container.innerHTML = '';
    container.appendChild(grid);
  }

  function buildAdminCardEl(it) {
    const card = document.createElement('div');
    card.className = 'admin-card';
    const color = it.color || CATEGORY_COLOR[it.category] || '#FFD6E0';
    card.innerHTML = `
      <div class="ac-top">
        <span class="ac-cat" style="background:${escapeAttr(color)}">${escapeHtml(it.categoryLabel || it.category)}</span>
        <span class="ac-meta">${escapeHtml(formatTs(it.timestamp))}</span>
      </div>
      <textarea data-k="question">${escapeHtml(it.question || '')}</textarea>
      <div class="ac-row">
        ${selectHtml('category', it.category, CAT_OPTIONS)}
        <input type="text" data-k="categoryLabel" value="${escapeAttr(it.categoryLabel || '')}" placeholder="라벨" />
      </div>
      <div class="ac-row">
        ${selectHtml('type', it.type, TYPE_OPTIONS)}
        <input type="text" data-k="typeLabel" value="${escapeAttr(it.typeLabel || '')}" placeholder="라벨" />
      </div>
      <div class="ac-row">
        <input type="text" data-k="author" value="${escapeAttr(it.author || '')}" placeholder="작성자" style="flex:1;min-width:120px" />
      </div>
      <div class="ac-row">
        ${selectHtml('lang', it.lang, ['ko','en','ja'])}
        <input type="text" data-k="color" value="${escapeAttr(it.color || '')}" style="width:90px" />
        <span class="color-dot" style="background:${escapeAttr(color)}"></span>
      </div>
      <div class="ac-actions">
        <button class="danger-btn" data-act="del">${t('deleteBtn')}</button>
        <button class="primary-btn small-btn" data-act="save">${t('save')}</button>
      </div>`;
    bindRowEvents(card, it);
    return card;
  }

  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
  function formatTs(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return String(s);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ============ Init ============
  applyLang('ko');
  renderEmojiPack('face');
  renderRecentEmojis();
  loadLocal();
  refreshCardCount();
})();
