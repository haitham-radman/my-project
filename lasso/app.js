(function () {
  'use strict';
  const E = window.LassoEngine;
  const ROLES = window.LASSO_ROLES;
  const $ = (id) => document.getElementById(id);

  const STR = {
    en: {
      nav_new: 'New prompt', nav_library: 'Library', nav_search: 'Search', close: 'Close', menu: 'Menu',
      side_note: 'Runs entirely in your browser. Your prompts are never uploaded; saved ones stay on this device.',
      banner: 'New: ready-made prompts for every role', h1: 'Turn lazy prompts into great ones', sub: 'Your cheat code to AI that just works',
      ph_input: 'Help me write a business plan for my new startup…',
      type_label: 'Type', model_label: 'Model', generate: 'Improve prompt',
      tab_prompt: 'Prompt', tab_template: 'Template', privacy_chip: 'Free • no sign-in • nothing leaves your browser',
      f_role: 'Role (who should the AI be?)', f_audience: 'Audience', f_task: 'Task *', f_context: 'Context', f_format: 'Output format', f_tone: 'Tone', f_rules: 'Constraints (one per line)',
      ph_role: 'e.g. a senior product manager', ph_audience: 'e.g. busy executives', ph_task: 'What do you want done?', ph_context: 'Background, data, links…', ph_format: 'e.g. table + 3 bullet summary', ph_tone: 'e.g. confident, friendly', ph_rules: 'Max 200 words\nNo jargon',
      result_title: 'Your improved prompt', score_before: 'Before', score_after: 'After',
      copy: 'Copy', copied: 'Copied', save: 'Save', saved: 'Saved to library', regen: 'Redo', open_hint: 'The ChatGPT and Claude buttons open a new tab with your prompt in the link. Edit the [brackets] first, then send.',
      works_with: 'Works with every major AI',
      how_title: 'How it works', how1_t: 'Write it your way', how1_d: 'Type a rough idea in Arabic or English. Short and messy is fine.',
      how2_t: 'We add the structure', how2_d: 'Role, context, steps, output format and constraints are added, and only what is missing.',
      how3_t: 'Fill in and send', how3_d: 'Replace the [brackets] with your details, copy it, and paste into any AI.',
      disc_title: 'Discover', disc_sub: 'Ready-to-use prompts across every role. Pick one and make it yours', ph_search: 'Search…',
      foot: 'Lasso uses built-in rules to structure prompts. It does not call an AI model.',
      empty: 'Nothing matches your search.', lib_empty: 'No saved prompts yet. Improve a prompt, then press Save.',
      use: 'Use', del: 'Delete', deleted: 'Deleted', need_text: 'Write something first',
      ch: { role: 'Added a role', context: 'Added context slots', steps: 'Added steps', format: 'Added output format', rules: 'Added constraints', clarify: 'Asks clarifying questions' },
      types: { auto: 'Auto', general: 'General', writing: 'Writing', email: 'Email', coding: 'Coding', analysis: 'Analysis', research: 'Research & learning', marketing: 'Marketing', image: 'Image' },
      models: { general: 'Any AI', chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini' }, untitled: 'Prompt'
    },
    ar: {
      nav_new: 'برومبت جديد', nav_library: 'المكتبة', nav_search: 'بحث', close: 'إغلاق', menu: 'القائمة',
      side_note: 'يعمل بالكامل داخل متصفحك. لا يُرفع أي برومبت، والمحفوظ منها يبقى على جهازك.',
      banner: 'جديد: برومبتات جاهزة لكل وظيفة', h1: 'حوّل البرومبت الكسول إلى برومبت ممتاز', sub: 'اختصارك للحصول على ذكاء اصطناعي يفهمك من أول مرة',
      ph_input: 'ساعدني في كتابة خطة عمل لشركتي الناشئة الجديدة…',
      type_label: 'النوع', model_label: 'النموذج', generate: 'حسّن البرومبت',
      tab_prompt: 'برومبت', tab_template: 'قالب', privacy_chip: 'مجاني • بلا تسجيل • لا شيء يغادر متصفحك',
      f_role: 'الدور (من يجب أن يكون الذكاء الاصطناعي؟)', f_audience: 'الجمهور', f_task: 'المهمة *', f_context: 'السياق', f_format: 'شكل المخرجات', f_tone: 'النبرة', f_rules: 'القيود (واحد في كل سطر)',
      ph_role: 'مثال: مدير منتج خبير', ph_audience: 'مثال: مديرون تنفيذيون مشغولون', ph_task: 'ماذا تريد أن يُنجز؟', ph_context: 'خلفية، بيانات، روابط…', ph_format: 'مثال: جدول + ملخص من 3 نقاط', ph_tone: 'مثال: واثق وودود', ph_rules: 'بحد أقصى 200 كلمة\nبدون مصطلحات معقدة',
      result_title: 'برومبتك المحسّن', score_before: 'قبل', score_after: 'بعد',
      copy: 'نسخ', copied: 'تم النسخ', save: 'حفظ', saved: 'تم الحفظ في المكتبة', regen: 'إعادة', open_hint: 'زرّا ChatGPT وClaude يفتحان تبويباً جديداً ويضعان البرومبت في الرابط. عدّل ما بين [الأقواس] أولاً ثم أرسل.',
      works_with: 'يعمل مع كل أدوات الذكاء الاصطناعي الكبرى',
      how_title: 'كيف يعمل', how1_t: 'اكتب بطريقتك', how1_d: 'اكتب فكرة أولية بالعربية أو الإنجليزية. لا بأس أن تكون قصيرة وغير مرتبة.',
      how2_t: 'نضيف البنية', how2_d: 'يُضاف الدور والسياق والخطوات وشكل المخرجات والقيود، وفقط ما هو ناقص.',
      how3_t: 'املأ وأرسل', how3_d: 'استبدل ما بين [الأقواس] بتفاصيلك، انسخ البرومبت والصقه في أي ذكاء اصطناعي.',
      disc_title: 'اكتشف', disc_sub: 'برومبتات جاهزة لكل وظيفة. اختر واحداً وخصّصه لنفسك', ph_search: 'ابحث…',
      foot: 'يعتمد Lasso على قواعد مدمجة لبناء البرومبت ولا يستدعي أي نموذج ذكاء اصطناعي.',
      empty: 'لا توجد نتائج مطابقة.', lib_empty: 'لا توجد برومبتات محفوظة بعد. حسّن برومبتاً ثم اضغط حفظ.',
      use: 'استخدم', del: 'حذف', deleted: 'تم الحذف', need_text: 'اكتب شيئاً أولاً',
      ch: { role: 'أضفنا دوراً', context: 'أضفنا خانات السياق', steps: 'أضفنا خطوات', format: 'أضفنا شكل المخرجات', rules: 'أضفنا قيوداً', clarify: 'يطلب أسئلة توضيحية' },
      types: { auto: 'تلقائي', general: 'عام', writing: 'كتابة', email: 'بريد', coding: 'برمجة', analysis: 'تحليل', research: 'بحث وتعلّم', marketing: 'تسويق', image: 'صور' },
      models: { general: 'أي ذكاء اصطناعي', chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini' }, untitled: 'برومبت'
    }
  };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };

  const state = {
    lang: store.get('lasso.lang', 'ar'),
    mode: 'prompt', role: 'general', view: 'home', last: null,
    lib: store.get('lasso.lib', [])
  };
  const t = (k) => STR[state.lang][k];

  function h(tag, attrs) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    for (let i = 2; i < arguments.length; i++) if (arguments[i]) el.append(arguments[i]);
    return el;
  }
  const icon = (id) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.append(u); return s; };

  let toastTimer;
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 1800);
  }

  /* ---------- language ---------- */
  function applyLang() {
    const L = state.lang, S = STR[L];
    document.documentElement.lang = L; document.documentElement.dir = L === 'ar' ? 'rtl' : 'ltr';
    document.title = L === 'ar' ? 'Lasso — حوّل البرومبت الكسول إلى برومبت ممتاز' : 'Lasso — Turn lazy prompts into great ones';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = S[el.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = S[el.dataset.i18nPh]; });
    document.querySelectorAll('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', S[el.dataset.i18nLabel]); });
    $('langBtn').textContent = L === 'ar' ? 'English' : 'العربية';
    fillSelect($('typeSel'), ['auto'].concat(E.TYPES), S.types);
    fillSelect($('modelSel'), ['general', 'chatgpt', 'claude', 'gemini'], S.models);
    renderTabs(); renderDiscover(); renderLibrary(); renderCount();
    if (state.last) paintResult(state.last);
  }
  function fillSelect(sel, keys, labels) {
    const cur = sel.value;
    sel.textContent = '';
    keys.forEach((k) => sel.append(h('option', { value: k, text: labels[k] })));
    if (cur && keys.includes(cur)) sel.value = cur;
  }

  /* ---------- generate ---------- */
  function generate() {
    const opts = { type: $('typeSel').value, model: $('modelSel').value };
    let res;
    if (state.mode === 'prompt') {
      const v = $('input').value;
      if (!v.trim()) { toast(t('need_text')); $('input').focus(); return; }
      res = E.enhance(v, opts);
      res.title = v.trim().slice(0, 60);
    } else {
      const f = { role: $('tRole').value, audience: $('tAudience').value, task: $('tTask').value, context: $('tContext').value, format: $('tFormat').value, tone: $('tTone').value, rules: $('tRules').value };
      if (!f.task.trim()) { toast(t('need_text')); $('tTask').focus(); return; }
      res = E.fromTemplate(f, opts);
      res.title = f.task.trim().slice(0, 60);
    }
    state.last = res;
    paintResult(res);
    $('result').hidden = false;
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function paintResult(res) {
    $('output').value = res.prompt;
    $('output').dir = res.lang === 'ar' ? 'rtl' : 'ltr';
    $('sBefore').textContent = res.before; $('sAfter').textContent = res.after;
    const box = $('changes'); box.textContent = '';
    res.changes.forEach((c) => box.append(h('span', { text: t('ch')[c] })));
    grow(); syncLinks();
  }
  function grow() { const o = $('output'); o.style.height = 'auto'; o.style.height = o.scrollHeight + 2 + 'px'; }
  function syncLinks() {
    const q = encodeURIComponent($('output').value);
    $('openGpt').href = 'https://chatgpt.com/?q=' + q;
    $('openClaude').href = 'https://claude.ai/new?q=' + q;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = h('textarea'); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    toast(t('copied'));
  }

  /* ---------- library ---------- */
  function saveCurrent() {
    const text = $('output').value.trim(); if (!text) return;
    const title = (state.last && state.last.title) || t('untitled');
    state.lib.unshift({ id: Date.now(), title, text, at: Date.now() });
    state.lib = state.lib.slice(0, 200);
    store.set('lasso.lib', state.lib); renderCount(); renderLibrary(); toast(t('saved'));
  }
  function renderCount() {
    const c = $('libCount'); c.hidden = !state.lib.length; c.textContent = state.lib.length;
  }
  function renderLibrary() {
    const q = $('libSearch').value.trim().toLowerCase();
    const body = $('libBody'); body.textContent = '';
    const items = state.lib.filter((x) => !q || (x.title + ' ' + x.text).toLowerCase().includes(q));
    if (!items.length) { body.append(h('p', { class: 'empty', text: state.lib.length ? t('empty') : t('lib_empty') })); return; }
    const wrap = h('div', { class: 'saved' });
    items.forEach((x) => {
      wrap.append(h('article', null,
        h('h4', { text: x.title }),
        h('pre', { text: x.text }),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => copyText(x.text) }, icon('i-copy'), h('span', { text: t('copy') })),
          h('button', { class: 'btn', type: 'button', onclick: () => { state.lib = state.lib.filter((y) => y.id !== x.id); store.set('lasso.lib', state.lib); renderCount(); renderLibrary(); toast(t('deleted')); } }, icon('i-trash'), h('span', { text: t('del') })),
          h('span', { class: 'grow' }),
          h('time', { text: new Date(x.at).toLocaleDateString(state.lang === 'ar' ? 'ar' : 'en') }))));
    });
    body.append(wrap);
  }

  /* ---------- discover ---------- */
  function renderTabs() {
    const box = $('roleTabs'); box.textContent = '';
    ROLES.forEach((r) => box.append(h('button', { type: 'button', role: 'tab', class: r.id === state.role ? 'on' : '', text: r.n[state.lang === 'ar' ? 1 : 0], onclick: () => { state.role = r.id; $('discSearch').value = ''; renderTabs(); renderDiscover(); } })));
  }
  function renderDiscover() {
    const i = state.lang === 'ar' ? 1 : 0;
    const q = $('discSearch').value.trim().toLowerCase();
    const body = $('discBody'); body.textContent = '';
    // A query searches every role; otherwise only the selected tab.
    const roles = q ? ROLES : ROLES.filter((r) => r.id === state.role);
    let any = false;
    roles.forEach((r) => r.cats.forEach((c) => {
      const items = c.items.filter((it) => !q || (it.t[i] + ' ' + it.d[i] + ' ' + it.p[i]).toLowerCase().includes(q));
      if (!items.length) return;
      any = true;
      const grid = h('div', { class: 'cards' });
      items.forEach((it) => grid.append(h('button', { class: 'card', type: 'button', onclick: () => useStarter(it.p[i]) }, h('b', { text: it.t[i] }), h('span', { text: it.d[i] }))));
      body.append(h('div', { class: 'cat' }, h('h3', { text: q ? r.n[i] + ' · ' + c.n[i] : c.n[i] }), grid));
    }));
    if (!any) body.append(h('p', { class: 'empty', text: t('empty') }));
  }
  function useStarter(text) {
    setMode('prompt'); showView('home');
    $('input').value = text; $('typeSel').value = 'auto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('input').focus({ preventScroll: true });
    const m = text.indexOf('[');
    if (m >= 0) { const e = text.indexOf(']', m); $('input').setSelectionRange(m, e < 0 ? text.length : e + 1); }
  }

  /* ---------- navigation ---------- */
  function setMode(m) {
    state.mode = m;
    $('panePrompt').hidden = m !== 'prompt'; $('paneTemplate').hidden = m !== 'template';
    $('tabPrompt').classList.toggle('on', m === 'prompt'); $('tabTemplate').classList.toggle('on', m === 'template');
  }
  function showView(v) {
    state.view = v;
    $('viewHome').hidden = v !== 'home'; $('viewLibrary').hidden = v !== 'library';
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.nav === (v === 'library' ? 'library' : 'home')));
    document.body.classList.remove('menu-open');
  }

  function init() {
    $('sendBtn').addEventListener('click', generate);
    $('input').addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate(); });
    $('tabPrompt').addEventListener('click', () => setMode('prompt'));
    $('tabTemplate').addEventListener('click', () => setMode('template'));
    $('copyBtn').addEventListener('click', () => copyText($('output').value));
    $('saveBtn').addEventListener('click', saveCurrent);
    $('redoBtn').addEventListener('click', generate);
    $('output').addEventListener('input', () => { grow(); syncLinks(); });
    $('langBtn').addEventListener('click', () => { state.lang = state.lang === 'ar' ? 'en' : 'ar'; store.set('lasso.lang', state.lang); applyLang(); });
    $('discSearch').addEventListener('input', renderDiscover);
    $('libSearch').addEventListener('input', renderLibrary);
    $('banner').addEventListener('click', () => $('discover').scrollIntoView({ behavior: 'smooth' }));
    $('menuBtn').addEventListener('click', () => document.body.classList.add('menu-open'));
    $('sideClose').addEventListener('click', () => document.body.classList.remove('menu-open'));
    $('scrim').addEventListener('click', () => document.body.classList.remove('menu-open'));
    $('brandLink').addEventListener('click', (e) => { e.preventDefault(); showView('home'); window.scrollTo({ top: 0 }); });
    document.querySelectorAll('.nav-btn').forEach((b) => b.addEventListener('click', () => {
      const n = b.dataset.nav;
      if (n === 'library') showView('library');
      else { showView('home'); if (n === 'search') { $('discover').scrollIntoView({ behavior: 'smooth' }); $('discSearch').focus({ preventScroll: true }); } else { window.scrollTo({ top: 0, behavior: 'smooth' }); $('input').focus({ preventScroll: true }); } }
    }));
    applyLang();
  }
  init();
})();
