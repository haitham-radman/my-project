'use strict';
(() => {
  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmt = (t) => {
    t = Math.max(0, t);
    const m = Math.floor(t / 60);
    return pad2(m) + ':' + (t - m * 60).toFixed(2).padStart(5, '0');
  };
  const ease = (p) => 1 - Math.pow(1 - p, 3);
  const easeBack = (p) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const isRtl = (s) => /[֐-ࣿ]/.test(s);

  function el(tag, props = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else if (k in e) e[k] = v;
      else e.setAttribute(k, v);
    }
    kids.flat().forEach((k) => e.append(k));
    return e;
  }

  const ICONS = {
    play: '<path d="M7 4.5v15l13-7.5z"/>',
    pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
    start: '<path d="M6 5v14M18 5l-9 7 9 7z"/>',
    end: '<path d="M18 5v14M6 5l9 7-9 7z"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
    export: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    split: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    dup: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.4-1"/>',
    vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 5 6M22 9l-5 6"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  };
  const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const setIcons = (root = document) => $$('[data-ic]', root).forEach((b) => {
    if (b.dataset.icDone) return;
    b.dataset.icDone = 1; b.insertAdjacentHTML('afterbegin', ic(b.dataset.ic));
  });

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- model ---------- */
  const TRACKS = [
    { id: 'T2', type: 'text', label: 'نص 2' },
    { id: 'T1', type: 'text', label: 'نص 1' },
    { id: 'V2', type: 'video', label: 'فيديو 2' },
    { id: 'V1', type: 'video', label: 'فيديو 1' },
    { id: 'A1', type: 'audio', label: 'صوت 1' },
    { id: 'A2', type: 'audio', label: 'صوت 2' },
  ];
  const trackType = (id) => TRACKS.find((t) => t.id === id).type;
  const ASPECTS = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '4:3': [1440, 1080] };
  const FPS = 30;
  const FX0 = () => ({ brightness: 100, contrast: 100, saturate: 100, blur: 0, gray: 0, sepia: 0, hue: 0 });
  const FX_PRESETS = {
    'أصلي': {},
    'دافئ': { saturate: 120, sepia: 20, hue: -8, contrast: 105 },
    'بارد': { saturate: 110, hue: 12, brightness: 102, contrast: 105 },
    'أبيض وأسود': { gray: 100, contrast: 115 },
    'سينمائي': { contrast: 125, saturate: 85, brightness: 92, sepia: 12 },
    'فيلم قديم': { sepia: 70, contrast: 110, brightness: 95, saturate: 80 },
    'نابض': { saturate: 160, contrast: 110 },
  };
  const FONTS = [
    ['Tahoma', 'Tahoma, "Noto Sans Arabic", sans-serif'],
    ['Arial', 'Arial, "Noto Sans Arabic", sans-serif'],
    ['Segoe UI', '"Segoe UI", "Noto Sans Arabic", sans-serif'],
    ['Georgia', 'Georgia, "Noto Naskh Arabic", serif'],
    ['Impact', 'Impact, "Arial Black", sans-serif'],
    ['Courier', '"Courier New", monospace'],
  ];
  const TEXT_PRESETS = [
    { name: 'عنوان رئيسي', text: 'عنوان رئيسي', size: 130, bold: true, y: 0, stroke: 0, bg: false, anim: 'pop', shadow: true },
    { name: 'عنوان فرعي', text: 'عنوان فرعي', size: 70, bold: false, y: 12, stroke: 0, bg: false, anim: 'fade', shadow: true },
    { name: 'كابشن بخلفية', text: 'اكتب الكابشن هنا', size: 56, bold: true, y: 34, stroke: 0, bg: true, anim: 'slide', shadow: false },
    { name: 'كابشن بحدود', text: 'كلام مهم', size: 78, bold: true, y: 30, stroke: 6, bg: false, anim: 'pop', shadow: false },
    { name: 'الثلث السفلي', text: 'الاسم - المسمى الوظيفي', size: 46, bold: false, y: 38, stroke: 0, bg: true, anim: 'slide', shadow: false },
    { name: 'آلة كاتبة', text: 'يظهر الحرف تلو الآخر', size: 64, bold: true, y: 0, stroke: 0, bg: false, anim: 'type', shadow: true },
  ];

  const S = {
    name: 'مشروع بدون عنوان', aspect: '16:9', res: [1920, 1080], bg: '#000000',
    clips: [], off: {}, media: new Map(),
    sel: null, t: 0, playing: false, zoom: 80, snap: true, exporting: false,
  };
  const duration = () => S.clips.reduce((m, c) => Math.max(m, c.start + c.dur), 0);
  const byId = (id) => S.clips.find((c) => c.id === id);
  const selClip = () => byId(S.sel);
  const mediaOf = (c) => S.media.get(c.media);
  const isActive = (c, t) => t >= c.start && t < c.start + c.dur;

  function newClip(o) {
    return Object.assign({
      id: uid(), track: 'V1', media: null, start: 0, dur: 5, in: 0, speed: 1, vol: 1, opacity: 1,
      x: 0, y: 0, scale: 1, rot: 0, fit: 'contain', fadeIn: 0, fadeOut: 0, fx: FX0(), text: null,
    }, o);
  }
  const newText = (o = {}) => Object.assign({
    text: 'نص جديد', font: FONTS[0][1], size: 80, bold: true, color: '#ffffff', align: 'center',
    bg: false, bgColor: '#000000', stroke: 0, strokeColor: '#000000', shadow: true, anim: 'fade',
  }, o);

  /* ---------- history / persistence ---------- */
  let hist = [], hi = -1;
  const snapshot = () => JSON.stringify({ clips: S.clips, res: S.res, aspect: S.aspect, off: S.off, name: S.name, bg: S.bg });
  function commit() {
    const s = snapshot();
    if (hist[hi] === s) return;
    hist = hist.slice(0, hi + 1); hist.push(s);
    if (hist.length > 200) hist.shift();
    hi = hist.length - 1;
    afterChange(); scheduleSave();
  }
  function restore(s) {
    const o = JSON.parse(s);
    Object.assign(S, { clips: o.clips, res: o.res, aspect: o.aspect, off: o.off, name: o.name, bg: o.bg || '#000000' });
    if (!byId(S.sel)) S.sel = null;
    $('#aspect').value = S.aspect; $('#projName').value = S.name;
    applyRes(); renderAll();
  }
  function undo() { if (hi > 0) { restore(hist[--hi]); scheduleSave(); } }
  function redo() { if (hi < hist.length - 1) { restore(hist[++hi]); scheduleSave(); } }
  function afterChange() {
    $('#btnUndo').disabled = hi <= 0; $('#btnRedo').disabled = hi >= hist.length - 1;
  }

  const DB = 'studio-media';
  const idb = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  async function idbOp(mode, fn) {
    try {
      const db = await idb();
      return await new Promise((res, rej) => {
        const tx = db.transaction('files', mode); const req = fn(tx.objectStore('files'));
        tx.oncomplete = () => res(req && req.result); tx.onerror = () => rej(tx.error);
      });
    } catch { return undefined; }
  }
  const idbPut = (id, file) => idbOp('readwrite', (s) => s.put(file, id));
  const idbGet = (id) => idbOp('readonly', (s) => s.get(id));
  const idbClear = () => idbOp('readwrite', (s) => s.clear());
  const idbDel = (id) => idbOp('readwrite', (s) => s.delete(id));

  let saveTimer;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const media = [...S.media.values()].map((m) => ({ id: m.id, name: m.name, kind: m.kind }));
        localStorage.setItem('studio.project', JSON.stringify({ snap: snapshot(), media }));
        $('#saved').textContent = 'تم الحفظ تلقائيًا';
      } catch { $('#saved').textContent = ''; }
    }, 500);
  }

  /* ---------- media import ---------- */
  const once = (target, ev, errEv = 'error') => new Promise((res, rej) => {
    target.addEventListener(ev, () => res(), { once: true });
    target.addEventListener(errEv, () => rej(new Error(errEv)), { once: true });
  });

  async function thumbOf(v, dur) {
    v.currentTime = Math.min(1, dur / 3);
    await once(v, 'seeked');
    const c = document.createElement('canvas'); c.height = 90; c.width = Math.max(1, Math.round(90 * (v.videoWidth / v.videoHeight || 16 / 9)));
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.7);
  }

  async function computePeaks(file, m) {
    if (file.size > 200e6) return;
    try {
      const buf = await file.arrayBuffer();
      const ac = new OfflineAudioContext(1, 1, 44100);
      const data = (await ac.decodeAudioData(buf)).getChannelData(0);
      const n = clamp(Math.ceil(m.duration * 60), 50, 8000);
      const step = data.length / n; const peaks = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let mx = 0; const a = Math.floor(i * step), b = Math.min(data.length, Math.floor((i + 1) * step));
        const hop = Math.max(1, Math.floor((b - a) / 40));
        for (let j = a; j < b; j += hop) mx = Math.max(mx, Math.abs(data[j]));
        peaks[i] = mx;
      }
      m.peaks = peaks; renderTimeline();
    } catch { /* video without decodable audio */ }
  }

  async function importOne(file, id = uid(), persist = true) {
    const kind = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : file.type.startsWith('image') ? 'image' : null;
    if (!kind) throw new Error('unsupported');
    const url = URL.createObjectURL(file);
    const m = { id, name: file.name, kind, url, file, duration: 0, w: 0, h: 0, thumb: null, peaks: null, el: null };
    if (kind === 'image') {
      const img = new Image(); img.src = url; await img.decode();
      Object.assign(m, { el: img, w: img.naturalWidth, h: img.naturalHeight, thumb: url, duration: 5 });
    } else {
      const v = document.createElement(kind === 'video' ? 'video' : 'audio');
      v.preload = 'metadata'; v.muted = true; v.src = url;
      await once(v, 'loadedmetadata');
      if (!isFinite(v.duration)) { v.currentTime = 1e9; await once(v, 'durationchange'); v.currentTime = 0; }
      m.duration = v.duration;
      if (kind === 'video') { m.w = v.videoWidth; m.h = v.videoHeight; m.thumb = await thumbOf(v, m.duration); }
      computePeaks(file, m);
    }
    S.media.set(id, m);
    if (persist) idbPut(id, file);
    return m;
  }

  async function importFiles(files) {
    let ok = 0;
    for (const f of files) {
      try { await importOne(f); ok++; } catch { toast('تعذّر استيراد: ' + f.name); }
    }
    renderBin(); scheduleSave();
    if (ok) toast(ok === 1 ? 'تم استيراد ملف' : 'تم استيراد ' + ok + ' ملفات');
  }

  /* ---------- timeline editing ---------- */
  const compat = (kind, trackId) => {
    const tt = trackType(trackId);
    return kind === 'text' ? tt === 'text' : kind === 'audio' ? tt === 'audio' : tt === 'video';
  };
  const clipKind = (c) => (c.text ? 'text' : mediaOf(c)?.kind || 'video');
  const maxDur = (c) => {
    const m = mediaOf(c);
    return !m || m.kind === 'image' ? Infinity : Math.max(0.1, (m.duration - c.in) / c.speed);
  };
  const trackEnd = (id) => S.clips.filter((c) => c.track === id).reduce((m, c) => Math.max(m, c.start + c.dur), 0);

  function resolveOverlap(c) {
    const others = S.clips.filter((o) => o !== c && o.track === c.track);
    const ok = (s) => others.every((o) => s >= o.start + o.dur - 1e-6 || s + c.dur <= o.start + 1e-6);
    if (ok(c.start)) return;
    const cands = [0];
    others.forEach((o) => cands.push(o.start + o.dur, o.start - c.dur));
    const valid = cands.filter((s) => s >= 0 && ok(s)).sort((a, b) => Math.abs(a - c.start) - Math.abs(b - c.start));
    if (valid.length) c.start = valid[0];
  }

  function addMediaClip(mediaId, track, start) {
    const m = S.media.get(mediaId); if (!m) return;
    if (!track || !compat(m.kind, track)) track = m.kind === 'audio' ? 'A1' : 'V1';
    const c = newClip({ media: mediaId, track, dur: m.kind === 'image' ? 5 : m.duration, start: start ?? trackEnd(track) });
    S.clips.push(c); resolveOverlap(c); S.sel = c.id;
    commit(); renderAll(); seek(c.start);
  }

  function addText(preset) {
    const dur = 3, t0 = S.t;
    const free = (id) => !S.clips.some((o) => o.track === id && t0 < o.start + o.dur && t0 + dur > o.start);
    const track = free('T1') ? 'T1' : free('T2') ? 'T2' : 'T1';
    const c = newClip({
      track, start: t0, dur, y: preset.y, text: newText({
        text: preset.text, size: preset.size, bold: preset.bold, stroke: preset.stroke, bg: preset.bg, anim: preset.anim, shadow: preset.shadow,
      }), fadeOut: 0.3,
    });
    S.clips.push(c); resolveOverlap(c); S.sel = c.id; commit(); renderAll();
    if (!S.playing) seek(c.start + 0.6);
  }

  function split() {
    const t = S.t;
    const sel = selClip();
    const targets = sel && isActive(sel, t) ? [sel] : S.clips.filter((c) => isActive(c, t) && !S.off[c.track]);
    let n = 0;
    for (const c of targets) {
      if (t - c.start < 0.05 || c.start + c.dur - t < 0.05) continue;
      const b = JSON.parse(JSON.stringify(c)); b.id = uid();
      b.start = t; b.dur = c.start + c.dur - t; b.in = c.in + (t - c.start) * c.speed; b.fadeIn = 0;
      c.dur = t - c.start; c.fadeOut = 0;
      S.clips.push(b); n++;
      if (c.id === S.sel) S.sel = b.id;
    }
    if (n) { commit(); renderAll(); } else toast('ضع المؤشر داخل مقطع لتقسيمه');
  }

  function removeSel(ripple) {
    const c = selClip(); if (!c) return;
    S.clips = S.clips.filter((o) => o !== c);
    if (ripple) S.clips.forEach((o) => { if (o.track === c.track && o.start >= c.start) o.start = Math.max(0, o.start - c.dur); });
    S.sel = null; commit(); renderAll();
  }

  function dupSel() {
    const c = selClip(); if (!c) return;
    const b = JSON.parse(JSON.stringify(c)); b.id = uid(); b.start = c.start + c.dur;
    S.clips.push(b); resolveOverlap(b); S.sel = b.id; commit(); renderAll();
  }

  function removeMedia(id) {
    if (S.clips.some((c) => c.media === id) && !confirm('هذا الملف مستخدم في المشروع. سيُحذف معه كل مقاطعه. متابعة؟')) return;
    S.clips = S.clips.filter((c) => c.media !== id);
    const m = S.media.get(id); if (m) URL.revokeObjectURL(m.url);
    S.media.delete(id); idbDel(id);
    if (!byId(S.sel)) S.sel = null;
    commit(); renderAll();
  }

  /* ---------- audio graph ---------- */
  const els = new Map(); // clip id -> {el, node, gain}
  let actx = null, dest = null, monitor = null;
  function ensureAudio() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      dest = actx.createMediaStreamDestination();
      monitor = actx.createGain(); monitor.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
  }
  function wire(e) {
    if (!actx || e.gain) return;
    try {
      e.node = actx.createMediaElementSource(e.el);
      e.gain = actx.createGain();
      e.node.connect(e.gain); e.gain.connect(monitor); e.gain.connect(dest);
      e.el.volume = 1;
    } catch { /* already wired */ }
  }
  function elFor(c) {
    let e = els.get(c.id); if (e) return e;
    const m = mediaOf(c); if (!m || m.kind === 'image') return null;
    const v = document.createElement(m.kind === 'video' ? 'video' : 'audio');
    v.preload = 'auto'; v.playsInline = true; v.src = m.url;
    e = { el: v, node: null, gain: null }; els.set(c.id, e); return e;
  }

  const fadeOf = (c, t) => {
    let f = 1;
    if (c.fadeIn > 0) f = Math.min(f, (t - c.start) / c.fadeIn);
    if (c.fadeOut > 0) f = Math.min(f, (c.start + c.dur - t) / c.fadeOut);
    return clamp(f, 0, 1);
  };

  function syncMedia() {
    const t = S.t;
    const live = new Set(S.clips.map((c) => c.id));
    for (const [id, e] of els) {
      if (!live.has(id)) { e.el.pause(); e.el.removeAttribute('src'); e.el.load(); els.delete(id); }
    }
    for (const c of S.clips) {
      const m = mediaOf(c); if (!m || m.kind === 'image') continue;
      const e = elFor(c); wire(e);
      const active = isActive(c, t) && !S.off[c.track];
      const target = c.in + (t - c.start) * c.speed;
      const vol = active ? c.vol * fadeOf(c, t) : 0;
      if (e.gain) e.gain.gain.value = vol; else e.el.volume = clamp(vol, 0, 1);
      const v = e.el;
      if (!active) { if (!v.paused) v.pause(); continue; }
      v.playbackRate = clamp(c.speed, 0.0625, 16);
      if (S.playing) {
        if (v.paused) {
          if (v.readyState >= 1) {
            if (Math.abs(v.currentTime - target) > 0.05) v.currentTime = target;
            v.play().catch(() => {});
          }
        } else if (Math.abs(v.currentTime - target) > 0.35) v.currentTime = target;
      } else {
        if (!v.paused) v.pause();
        if (!v.seeking && Math.abs(v.currentTime - target) > 0.02) v.currentTime = target;
      }
    }
  }

  /* ---------- rendering (preview + export share this) ---------- */
  const cv = $('#cv'), g = cv.getContext('2d');
  const ov = $('#ov'), og = ov.getContext('2d');
  const rects = new Map();

  function filterStr(fx, W) {
    const p = [];
    if (fx.brightness !== 100) p.push(`brightness(${fx.brightness}%)`);
    if (fx.contrast !== 100) p.push(`contrast(${fx.contrast}%)`);
    if (fx.saturate !== 100) p.push(`saturate(${fx.saturate}%)`);
    if (fx.blur > 0) p.push(`blur(${(fx.blur * W / 1920).toFixed(2)}px)`);
    if (fx.gray > 0) p.push(`grayscale(${fx.gray}%)`);
    if (fx.sepia > 0) p.push(`sepia(${fx.sepia}%)`);
    if (fx.hue !== 0) p.push(`hue-rotate(${fx.hue}deg)`);
    return p.length ? p.join(' ') : 'none';
  }

  function visualSource(c) {
    const m = mediaOf(c); if (!m) return null;
    if (m.kind === 'image') return { src: m.el, w: m.w, h: m.h };
    if (m.kind !== 'video') return null;
    if (S.fast && wcFrames.has(c.id)) { const f = wcFrames.get(c.id); return { src: f, w: f.displayWidth, h: f.displayHeight }; }
    const e = els.get(c.id);
    if (!e || e.el.readyState < 2 || !e.el.videoWidth) return null;
    return { src: e.el, w: e.el.videoWidth, h: e.el.videoHeight };
  }

  function drawVisual(c, t) {
    const s = visualSource(c); if (!s) return;
    const [W, H] = S.res;
    const base = c.fit === 'cover' ? Math.max(W / s.w, H / s.h) : Math.min(W / s.w, H / s.h);
    const dw = s.w * base * c.scale, dh = s.h * base * c.scale;
    const cx = W / 2 + c.x / 100 * W, cy = H / 2 + c.y / 100 * H;
    g.save();
    g.translate(cx, cy); g.rotate(c.rot * Math.PI / 180);
    g.globalAlpha = clamp(c.opacity * fadeOf(c, t), 0, 1);
    g.filter = filterStr(c.fx, W);
    g.drawImage(s.src, -dw / 2, -dh / 2, dw, dh);
    g.restore();
    rects.set(c.id, { cx, cy, w: dw, h: dh, rot: c.rot });
  }

  function wrapText(txt, maxW) {
    const out = [];
    for (const para of txt.split('\n')) {
      const words = para.split(' '); let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (g.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
      }
      out.push(line);
    }
    return out;
  }

  function roundRect(x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function drawText(c, t) {
    const T = c.text; if (!T.text) return;
    const [W, H] = S.res; const k = H / 1080; const size = T.size * k;
    g.save();
    g.font = `${T.bold ? '700' : '400'} ${size}px ${T.font}`;
    g.textBaseline = 'middle'; g.textAlign = 'center'; g.direction = isRtl(T.text) ? 'rtl' : 'ltr';
    let txt = T.text, alpha = c.opacity * fadeOf(c, t), dy = 0, sc = 1;
    const lt = t - c.start, A = 0.4;
    if (T.anim === 'fade') alpha *= clamp(lt / A, 0, 1);
    else if (T.anim === 'slide') { const p = clamp(lt / A, 0, 1); alpha *= p; dy = (1 - ease(p)) * size * 0.9; }
    else if (T.anim === 'pop') { sc = 0.5 + 0.5 * easeBack(clamp(lt / A, 0, 1)); alpha *= clamp(lt / (A / 2), 0, 1); }
    else if (T.anim === 'type') {
      const chars = [...txt]; const n = Math.floor(chars.length * clamp(lt / Math.min(c.dur * 0.6, 2.5), 0, 1));
      txt = chars.slice(0, Math.max(1, n)).join('');
    }
    const lines = wrapText(txt, W * 0.86);
    const lh = size * 1.3, bh = lines.length * lh;
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    const cx = W / 2 + c.x / 100 * W, cy = H / 2 + c.y / 100 * H + dy;
    g.translate(cx, cy); g.rotate(c.rot * Math.PI / 180); g.scale(c.scale * sc, c.scale * sc);
    g.globalAlpha = clamp(alpha, 0, 1);
    if (T.bg) {
      const p = size * 0.35;
      g.fillStyle = T.bgColor; roundRect(-widest / 2 - p, -bh / 2 - p * 0.6, widest + 2 * p, bh + p * 1.2, size * 0.25); g.fill();
    }
    if (T.shadow) { g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = size * 0.2; g.shadowOffsetY = size * 0.06; }
    lines.forEach((l, i) => {
      const y = -bh / 2 + lh * (i + 0.5);
      if (T.stroke > 0) { g.lineWidth = T.stroke * k * 2; g.strokeStyle = T.strokeColor; g.lineJoin = 'round'; g.strokeText(l, 0, y); }
      g.fillStyle = T.color; g.fillText(l, 0, y);
    });
    g.restore();
    rects.set(c.id, { cx, cy, w: (widest + size * 0.7) * c.scale, h: (bh + size * 0.7) * c.scale, rot: c.rot });
  }

  function render() {
    const [W, H] = S.res;
    rects.clear();
    g.globalAlpha = 1; g.filter = 'none'; g.fillStyle = S.bg; g.fillRect(0, 0, W, H);
    const t = S.t;
    for (const tid of ['V1', 'V2']) {
      if (S.off[tid]) continue;
      for (const c of S.clips) if (c.track === tid && isActive(c, t)) drawVisual(c, t);
    }
    for (const tid of ['T1', 'T2']) {
      if (S.off[tid]) continue;
      for (const c of S.clips) if (c.track === tid && isActive(c, t)) drawText(c, t);
    }
  }

  function drawOverlay() {
    og.clearRect(0, 0, ov.width, ov.height);
    if (S.exporting) return;
    const r = rects.get(S.sel); if (!r) return;
    const lw = Math.max(2, ov.width / 500);
    og.save(); og.translate(r.cx, r.cy); og.rotate(r.rot * Math.PI / 180);
    og.strokeStyle = '#ff8a3d'; og.lineWidth = lw; og.setLineDash([lw * 4, lw * 3]);
    og.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
    og.setLineDash([]); og.fillStyle = '#ff8a3d';
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) og.fillRect(x * r.w / 2 - lw * 2, y * r.h / 2 - lw * 2, lw * 4, lw * 4);
    og.restore();
  }
  const draw = () => { render(); drawOverlay(); };

  function applyRes() {
    const [W, H] = S.res;
    for (const c of [cv, ov]) { c.width = W; c.height = H; }
    fitStage(); draw();
  }
  function fitStage() {
    const box = $('#stageBox'); const [W, H] = S.res;
    const aw = box.clientWidth - 28, ah = box.clientHeight - 28;
    const k = Math.min(aw / W, ah / H);
    const wrap = $('#cvWrap'); wrap.style.width = Math.max(10, W * k) + 'px'; wrap.style.height = Math.max(10, H * k) + 'px';
  }

  /* preview interaction: select / drag clips directly on the canvas */
  function stagePoint(e) {
    const b = ov.getBoundingClientRect();
    return [(e.clientX - b.left) / b.width * S.res[0], (e.clientY - b.top) / b.height * S.res[1]];
  }
  function hit(id, [px, py]) {
    const r = rects.get(id); if (!r) return false;
    const a = -r.rot * Math.PI / 180, dx = px - r.cx, dy = py - r.cy;
    const x = dx * Math.cos(a) - dy * Math.sin(a), y = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(x) <= r.w / 2 && Math.abs(y) <= r.h / 2;
  }
  ov.addEventListener('pointerdown', (e) => {
    if (S.exporting) return;
    const p = stagePoint(e);
    let id = hit(S.sel, p) ? S.sel : null;
    if (!id) {
      const order = ['T2', 'T1', 'V2', 'V1'];
      outer: for (const tid of order) {
        for (const c of S.clips) if (c.track === tid && isActive(c, S.t) && hit(c.id, p)) { id = c.id; break outer; }
      }
    }
    if (id !== S.sel) { S.sel = id; renderTimeline(); renderInspector(); draw(); }
    const c = selClip(); if (!c) return;
    const o = { px: p[0], py: p[1], x: c.x, y: c.y, moved: false };
    ov.setPointerCapture(e.pointerId);
    const mv = (ev) => {
      const q = stagePoint(ev);
      c.x = o.x + (q[0] - o.px) / S.res[0] * 100; c.y = o.y + (q[1] - o.py) / S.res[1] * 100;
      o.moved = true; draw();
    };
    const up = () => {
      ov.removeEventListener('pointermove', mv); ov.removeEventListener('pointerup', up);
      if (o.moved) { commit(); renderInspector(); }
    };
    ov.addEventListener('pointermove', mv); ov.addEventListener('pointerup', up);
  });

  /* ---------- transport ---------- */
  let t0 = 0, wall0 = 0, raf = 0;
  function play() {
    if (S.playing) return;
    if (S.t >= duration() - 0.01) S.t = 0;
    ensureAudio(); S.playing = true; t0 = S.t; wall0 = performance.now(); updatePlayBtn();
  }
  function pause() { S.playing = false; updatePlayBtn(); }
  function seek(t) {
    S.t = Math.max(0, t);
    if (S.playing) { t0 = S.t; wall0 = performance.now(); }
  }
  function updatePlayBtn() { const b = $('#btnPlay'); b.innerHTML = ic(S.playing ? 'pause' : 'play'); }

  let phX = -1;
  function frame(now) {
    if (S.playing) {
      S.t = t0 + (now - wall0) / 1000;
      const d = duration();
      if (S.t >= d) { S.t = d; pause(); if (S.exporting) finishExport(); }
    }
    if (S.fast) { raf = requestAnimationFrame(frame); return; }
    syncMedia(); draw();
    $('#timecode').textContent = fmt(S.t);
    const x = Math.round(S.t * S.zoom);
    if (x !== phX) {
      phX = x; $('#playhead').style.left = x + 'px';
      if (S.playing) {
        const sc = $('#tl-scroll');
        if (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft) sc.scrollLeft = Math.max(0, x - 40);
      }
    }
    raf = requestAnimationFrame(frame);
  }

  /* ---------- timeline UI ---------- */
  const scroll = $('#tl-scroll'), inner = $('#tl-inner'), lanes = $('#lanes'), ruler = $('#ruler');

  function buildLanes() {
    lanes.innerHTML = ''; $('#tl-labels').innerHTML = '';
    for (const tr of TRACKS) {
      lanes.append(el('div', { class: 'lane', 'data-track': tr.id }));
      const aud = tr.type === 'audio';
      const btn = el('button', { class: 'tgl', title: aud ? 'كتم / تشغيل المسار' : 'إخفاء / إظهار المسار', 'data-t': tr.id, 'aria-label': tr.label, onclick: () => {
        S.off[tr.id] = !S.off[tr.id]; commit(); renderLabels();
      } });
      $('#tl-labels').append(el('div', { class: 'lbl' }, el('span', { textContent: tr.label }), btn));
    }
    renderLabels();
  }
  function renderLabels() {
    $$('.tgl').forEach((b) => {
      const tr = TRACKS.find((t) => t.id === b.dataset.t); const off = !!S.off[tr.id];
      b.classList.toggle('off', off);
      b.innerHTML = ic(tr.type === 'audio' ? (off ? 'mute' : 'vol') : (off ? 'eyeoff' : 'eye'));
    });
  }

  function drawRuler() {
    const w = scroll.clientWidth, dpr = window.devicePixelRatio || 1;
    ruler.width = w * dpr; ruler.height = 26 * dpr; ruler.style.width = w + 'px';
    const r = ruler.getContext('2d'); r.scale(dpr, dpr);
    r.fillStyle = '#151922'; r.fillRect(0, 0, w, 26);
    const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
    const step = steps.find((s) => s * S.zoom >= 80) || 600;
    const off = scroll.scrollLeft;
    r.fillStyle = '#8b95a7'; r.strokeStyle = '#3a4456'; r.font = '10.5px system-ui'; r.textBaseline = 'middle'; r.lineWidth = 1;
    const first = Math.floor(off / S.zoom / step) * step;
    for (let t = first; t * S.zoom - off < w + 80; t += step) {
      const x = Math.round(t * S.zoom - off) + 0.5;
      r.beginPath(); r.moveTo(x, 16); r.lineTo(x, 26); r.stroke();
      const m = Math.floor(t / 60); const sec = t - m * 60;
      r.fillText(`${m}:${(step < 1 ? sec.toFixed(2) : sec.toFixed(0)).padStart(step < 1 ? 5 : 2, '0')}`, x + 4, 9);
      const sub = step / 5;
      for (let i = 1; i < 5; i++) {
        const sx = Math.round((t + sub * i) * S.zoom - off) + 0.5;
        r.beginPath(); r.moveTo(sx, 21); r.lineTo(sx, 26); r.stroke();
      }
    }
  }

  function drawWave(canvas, m, c, w) {
    if (!m.peaks) return;
    const h = 30; canvas.width = Math.max(1, Math.floor(w)); canvas.height = h;
    const x = canvas.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.85)';
    const n = m.peaks.length, per = n / m.duration;
    for (let px = 0; px < canvas.width; px += 2) {
      const ts = c.in + (px / S.zoom) * c.speed;
      const i = clamp(Math.floor(ts * per), 0, n - 1);
      const a = Math.max(1, m.peaks[i] * h * 0.95);
      x.fillRect(px, h - a, 1.5, a);
    }
  }

  function clipEl(c) {
    const m = mediaOf(c); const kind = clipKind(c);
    const w = Math.max(4, c.dur * S.zoom);
    const e = el('div', { class: 'clip ' + kind + (c.id === S.sel ? ' sel' : ''), 'data-id': c.id });
    e.style.left = c.start * S.zoom + 'px'; e.style.width = w + 'px';
    if (m && (kind === 'video' || kind === 'image') && m.thumb) e.style.backgroundImage = `url("${m.thumb}")`;
    if (kind === 'audio' || kind === 'video') {
      if (m && m.peaks) { const cvs = el('canvas'); e.append(cvs); drawWave(cvs, m, c, w); }
    }
    if (kind !== 'audio' && kind !== 'text') e.append(el('div', { class: 'shade' }));
    e.append(el('span', { class: 'nm', textContent: c.text ? c.text.text.replace(/\n/g, ' ') : m ? m.name : '' }));
    e.append(el('div', { class: 'h l', 'data-h': 'l' }), el('div', { class: 'h r', 'data-h': 'r' }));
    return e;
  }

  function renderTimeline() {
    inner.style.width = Math.max((duration() + 15) * S.zoom, scroll.clientWidth) + 'px';
    $$('.lane', lanes).forEach((ln) => {
      ln.innerHTML = '';
      S.clips.filter((c) => c.track === ln.dataset.track).forEach((c) => ln.append(clipEl(c)));
      ln.style.opacity = S.off[ln.dataset.track] ? 0.45 : 1;
    });
    $('#totalcode').textContent = fmt(duration());
    drawRuler();
    phX = -1;
  }

  function snapPoints(skip) {
    const pts = [0, S.t];
    S.clips.forEach((o) => { if (o !== skip) pts.push(o.start, o.start + o.dur); });
    return pts;
  }
  function snapTo(v, pts) {
    if (!S.snap) return v;
    const th = 8 / S.zoom; let best = v, bd = th;
    for (const p of pts) { const d = Math.abs(p - v); if (d < bd) { bd = d; best = p; } }
    return best;
  }

  let drag = null;
  lanes.addEventListener('pointerdown', (e) => {
    const ce = e.target.closest('.clip');
    if (!ce) { if (S.sel) { S.sel = null; renderAll(); } return; }
    if (e.button !== 0) return;
    const c = byId(ce.dataset.id);
    if (S.sel !== c.id) { S.sel = c.id; $$('.clip.sel', lanes).forEach((x) => x.classList.remove('sel')); ce.classList.add('sel'); renderInspector(); }
    drag = { c, el: ce, mode: e.target.dataset.h || 'move', x0: e.clientX, start: c.start, dur: c.dur, inn: c.in, track: c.track, curTrack: c.track, moved: false, pts: snapPoints(c) };
    e.preventDefault();
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const d = drag, c = d.c, dt = (e.clientX - d.x0) / S.zoom;
    if (Math.abs(e.clientX - d.x0) > 2) d.moved = true;
    if (!d.moved) return;
    if (d.mode === 'move') {
      let s = Math.max(0, d.start + dt);
      const a = snapTo(s, d.pts), b = snapTo(s + d.dur, d.pts) - d.dur;
      s = Math.abs(a - s) <= Math.abs(b - s) ? a : b; s = Math.max(0, s);
      d.ns = s; d.el.style.left = s * S.zoom + 'px';
      const lane = document.elementFromPoint(e.clientX, e.clientY)?.closest('.lane');
      if (lane && lane.dataset.track !== d.curTrack && compat(clipKind(c), lane.dataset.track)) {
        lane.append(d.el); d.curTrack = lane.dataset.track;
      }
    } else if (d.mode === 'l') {
      const sibs = S.clips.filter((o) => o !== c && o.track === c.track && o.start + o.dur <= d.start + 1e-6);
      const minS = Math.max(sibs.reduce((m, o) => Math.max(m, o.start + o.dur), 0), isFinite(maxDur(c)) ? d.start - d.inn / c.speed : 0);
      let s = snapTo(d.start + dt, d.pts);
      s = clamp(s, minS, d.start + d.dur - 0.1);
      d.ns = s; d.nd = d.start + d.dur - s;
      d.el.style.left = s * S.zoom + 'px'; d.el.style.width = d.nd * S.zoom + 'px';
    } else {
      const m = mediaOf(c);
      const next = S.clips.filter((o) => o !== c && o.track === c.track && o.start >= d.start + d.dur - 1e-6).reduce((mn, o) => Math.min(mn, o.start), Infinity);
      const cap = Math.min(m && m.kind !== 'image' ? (m.duration - c.in) / c.speed : Infinity, next - d.start);
      let end = snapTo(d.start + d.dur + dt, d.pts);
      d.nd = clamp(end - d.start, 0.1, cap);
      d.el.style.width = d.nd * S.zoom + 'px';
    }
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    const d = drag, c = d.c; drag = null;
    if (!d.moved) return;
    if (d.mode === 'move') { c.start = d.ns ?? c.start; c.track = d.curTrack; resolveOverlap(c); }
    else if (d.mode === 'l') { const delta = d.ns - d.start; c.start = d.ns; c.dur = d.nd; c.in = Math.max(0, d.inn + delta * c.speed); }
    else c.dur = d.nd;
    commit(); renderAll();
  });

  /* drop from media bin */
  lanes.addEventListener('dragover', (e) => {
    const ln = e.target.closest('.lane'); if (!ln) return;
    e.preventDefault(); $$('.lane.drop-ok', lanes).forEach((x) => x !== ln && x.classList.remove('drop-ok')); ln.classList.add('drop-ok');
  });
  lanes.addEventListener('dragleave', (e) => { if (!lanes.contains(e.relatedTarget)) $$('.lane.drop-ok', lanes).forEach((x) => x.classList.remove('drop-ok')); });
  lanes.addEventListener('drop', (e) => {
    const id = e.dataTransfer.getData('text/media-id'); if (!id) return;
    e.preventDefault(); $$('.lane.drop-ok', lanes).forEach((x) => x.classList.remove('drop-ok'));
    const ln = e.target.closest('.lane');
    const x = e.clientX - inner.getBoundingClientRect().left;
    addMediaClip(id, ln && ln.dataset.track, Math.max(0, x / S.zoom));
  });

  /* scrub on ruler */
  ruler.addEventListener('pointerdown', (e) => {
    const go = (ev) => seek((ev.clientX - ruler.getBoundingClientRect().left + scroll.scrollLeft) / S.zoom);
    go(e); ruler.setPointerCapture(e.pointerId);
    const mv = (ev) => go(ev);
    ruler.addEventListener('pointermove', mv);
    ruler.addEventListener('pointerup', () => ruler.removeEventListener('pointermove', mv), { once: true });
  });
  scroll.addEventListener('scroll', drawRuler);
  scroll.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const x = e.clientX - scroll.getBoundingClientRect().left;
    const tAt = (scroll.scrollLeft + x) / S.zoom;
    setZoom(S.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    scroll.scrollLeft = tAt * S.zoom - x;
  }, { passive: false });

  function setZoom(z) {
    S.zoom = clamp(z, 10, 400); $('#zoom').value = S.zoom; renderTimeline();
  }

  /* ---------- media bin ---------- */
  function renderBin() {
    const bin = $('#bin'); bin.innerHTML = '';
    for (const m of S.media.values()) {
      const th = el('div', { class: 'th' });
      if (m.thumb) th.style.backgroundImage = `url("${m.thumb}")`; else th.innerHTML = ic('music');
      const card = el('div', { class: 'card-m', draggable: true, title: 'اسحب إلى الخط الزمني، أو اضغط مرتين للإضافة' },
        th,
        el('div', { class: 'dur', textContent: m.kind === 'image' ? 'صورة' : fmt(m.duration) }),
        el('div', { class: 'meta' }, el('b', { textContent: m.name })),
        el('div', { class: 'acts' },
          el('button', { title: 'إضافة إلى الخط الزمني', 'aria-label': 'إضافة', html: ic('plus'), onclick: (e) => { e.stopPropagation(); addMediaClip(m.id); } }),
          el('button', { title: 'حذف من المشروع', 'aria-label': 'حذف', html: ic('x'), onclick: (e) => { e.stopPropagation(); removeMedia(m.id); } })));
      card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/media-id', m.id); e.dataTransfer.effectAllowed = 'copy'; });
      card.addEventListener('dblclick', () => addMediaClip(m.id));
      bin.append(card);
    }
  }

  function buildTextPresets() {
    const box = $('#textPresets');
    TEXT_PRESETS.forEach((p) => {
      const b = el('button', { class: 'preset', textContent: p.name });
      b.style.fontWeight = p.bold ? 700 : 400; b.style.fontSize = Math.round(14 + p.size / 14) + 'px';
      if (p.bg) { b.style.background = '#000'; }
      if (p.stroke) b.style.webkitTextStroke = '1px #000', b.style.color = '#fff';
      b.addEventListener('click', () => addText(p));
      box.append(b);
    });
  }

  /* ---------- inspector ---------- */
  function section(title) {
    const s = el('div', { class: 'sec' }, el('h4', { textContent: title })); return s;
  }
  function rng(parent, label, o) {
    const r = el('input', { type: 'range', min: o.min, max: o.max, step: o.step ?? 1, 'aria-label': label });
    const n = el('input', { type: 'number', min: o.min, max: o.max, step: o.step ?? 1, 'aria-label': label });
    const sync = () => { const v = o.get(); r.value = v; n.value = +(+v).toFixed(3); };
    const apply = (v) => { if (!isFinite(v)) return; o.set(clamp(v, o.min, o.max)); sync(); (o.live || draw)(); };
    r.addEventListener('input', () => apply(+r.value));
    n.addEventListener('input', () => apply(+n.value));
    const done = () => { commit(); if (o.after) o.after(); };
    r.addEventListener('change', done); n.addEventListener('change', () => { sync(); done(); });
    sync();
    parent.append(el('div', { class: 'row' }, el('label', { textContent: label }), r, n));
  }
  function numRow(parent, label, o) {
    const n = el('input', { type: 'number', min: o.min, step: o.step ?? 0.1, 'aria-label': label });
    n.value = +o.get().toFixed(3);
    n.addEventListener('change', () => { const v = +n.value; if (isFinite(v)) { o.set(Math.max(o.min, v)); n.value = +o.get().toFixed(3); commit(); renderAll(); } });
    parent.append(el('div', { class: 'row two' }, el('label', { textContent: label }), n));
  }
  function selRow(parent, label, opts, get, set) {
    const s = el('select', { 'aria-label': label }, opts.map(([v, t]) => el('option', { value: v, textContent: t })));
    s.value = get(); s.addEventListener('change', () => { set(s.value); commit(); draw(); });
    parent.append(el('div', { class: 'row two' }, el('label', { textContent: label }), s));
  }
  function colorRow(parent, label, get, set) {
    const i = el('input', { type: 'color', value: get(), 'aria-label': label });
    i.addEventListener('input', () => { set(i.value); draw(); }); i.addEventListener('change', commit);
    parent.append(el('div', { class: 'row two' }, el('label', { textContent: label }), i));
  }
  function chkRow(parent, label, get, set) {
    const i = el('input', { type: 'checkbox', checked: get() });
    i.addEventListener('change', () => { set(i.checked); commit(); draw(); });
    parent.append(el('div', { class: 'row two' }, el('label', { textContent: label }), el('label', { class: 'chk' }, i)));
  }

  function renderInspector() {
    const box = $('#insp'); box.innerHTML = '';
    const c = selClip();
    if (!c) {
      const s = section('المشروع');
      colorRow(s, 'لون الخلفية', () => S.bg, (v) => { S.bg = v; });
      box.append(s, el('div', { class: 'empty', html: 'اختر مقطعًا من الخط الزمني أو من المعاينة لتعديل خصائصه.<br><br>اختصارات: مسافة تشغيل، S تقسيم، Delete حذف، Ctrl+D تكرار، الأسهم للتنقل إطارًا بإطار.' }));
      return;
    }
    const kind = clipKind(c), m = mediaOf(c);
    const head = section('المقطع');
    head.append(el('div', { class: 'ttl', textContent: c.text ? 'نص' : m ? m.name : '' }));
    head.querySelector('.ttl').style.marginBottom = '10px';
    numRow(head, 'البداية (ث)', { min: 0, get: () => c.start, set: (v) => { c.start = v; resolveOverlap(c); } });
    numRow(head, 'المدة (ث)', { min: 0.1, get: () => c.dur, set: (v) => { c.dur = Math.min(v, maxDur(c)); resolveOverlap(c); } });
    if (kind === 'video' || kind === 'audio') {
      rng(head, 'السرعة', {
        min: 0.25, max: 4, step: 0.05, get: () => c.speed,
        set: (v) => { const src = c.dur * c.speed; c.speed = v; c.dur = Math.min(src / v, maxDur(c)); },
        live: () => { renderTimeline(); },
      });
    }
    box.append(head);

    if (kind === 'text') {
      const T = c.text, s = section('النص');
      const ta = el('textarea', { value: T.text, 'aria-label': 'النص', dir: 'auto' });
      ta.addEventListener('input', () => { T.text = ta.value; draw(); const nm = $(`.clip[data-id="${c.id}"] .nm`); if (nm) nm.textContent = T.text.replace(/\n/g, ' '); });
      ta.addEventListener('change', commit);
      s.append(el('div', { class: 'row two' }, el('label', { textContent: 'المحتوى' }), ta));
      selRow(s, 'الخط', FONTS.map(([n, v]) => [v, n]), () => T.font, (v) => { T.font = v; });
      rng(s, 'الحجم', { min: 16, max: 300, get: () => T.size, set: (v) => { T.size = v; } });
      colorRow(s, 'اللون', () => T.color, (v) => { T.color = v; });
      chkRow(s, 'خط عريض', () => T.bold, (v) => { T.bold = v; });
      chkRow(s, 'خلفية', () => T.bg, (v) => { T.bg = v; });
      colorRow(s, 'لون الخلفية', () => T.bgColor, (v) => { T.bgColor = v; });
      rng(s, 'حدود', { min: 0, max: 20, get: () => T.stroke, set: (v) => { T.stroke = v; } });
      colorRow(s, 'لون الحدود', () => T.strokeColor, (v) => { T.strokeColor = v; });
      chkRow(s, 'ظل', () => T.shadow, (v) => { T.shadow = v; });
      selRow(s, 'الحركة', [['none', 'بدون'], ['fade', 'ظهور تدريجي'], ['slide', 'انزلاق'], ['pop', 'تكبير نابض'], ['type', 'آلة كاتبة']], () => T.anim, (v) => { T.anim = v; });
      box.append(s);
    }

    if (kind !== 'audio') {
      const s = section('التحويل');
      rng(s, 'الموضع X', { min: -100, max: 100, step: 0.5, get: () => c.x, set: (v) => { c.x = v; } });
      rng(s, 'الموضع Y', { min: -100, max: 100, step: 0.5, get: () => c.y, set: (v) => { c.y = v; } });
      rng(s, 'الحجم %', { min: 5, max: 400, get: () => c.scale * 100, set: (v) => { c.scale = v / 100; } });
      rng(s, 'التدوير', { min: -180, max: 180, get: () => c.rot, set: (v) => { c.rot = v; } });
      rng(s, 'الشفافية %', { min: 0, max: 100, get: () => c.opacity * 100, set: (v) => { c.opacity = v / 100; } });
      if (kind !== 'text') selRow(s, 'الملاءمة', [['contain', 'احتواء'], ['cover', 'ملء الإطار']], () => c.fit, (v) => { c.fit = v; });
      box.append(s);
    }

    const fd = section('الظهور والاختفاء');
    const lim = () => Math.max(0.1, c.dur / 2);
    rng(fd, 'ظهور (ث)', { min: 0, max: 10, step: 0.1, get: () => c.fadeIn, set: (v) => { c.fadeIn = Math.min(v, lim()); } });
    rng(fd, 'اختفاء (ث)', { min: 0, max: 10, step: 0.1, get: () => c.fadeOut, set: (v) => { c.fadeOut = Math.min(v, lim()); } });
    box.append(fd);

    if (kind === 'video' || kind === 'audio') {
      const s = section('الصوت');
      rng(s, 'مستوى الصوت %', { min: 0, max: 200, get: () => c.vol * 100, set: (v) => { c.vol = v / 100; } });
      box.append(s);
      box.append(captionSection(c));
    }

    if (kind === 'video' || kind === 'image') {
      const s = section('الألوان والفلاتر');
      const chips = el('div', { class: 'chips' });
      Object.entries(FX_PRESETS).forEach(([n, fx]) => chips.append(el('button', { class: 'chip', textContent: n, onclick: () => {
        c.fx = Object.assign(FX0(), fx); commit(); draw(); renderInspector();
      } })));
      s.append(chips);
      const F = (label, key, min, max) => rng(s, label, { min, max, get: () => c.fx[key], set: (v) => { c.fx[key] = v; } });
      F('السطوع', 'brightness', 0, 200); F('التباين', 'contrast', 0, 200); F('التشبع', 'saturate', 0, 300);
      F('تدرج رمادي', 'gray', 0, 100); F('بني قديم', 'sepia', 0, 100); F('تدوير اللون', 'hue', -180, 180); F('ضبابية', 'blur', 0, 40);
      box.append(s);
    }
  }


  /* ---------- auto captions (Whisper in a worker) ---------- */
  const CAP = { lang: 'auto', task: 'transcribe', model: 'onnx-community/whisper-tiny', words: 6, style: 2, anim: 'none', busy: false, msg: '', pct: 0 };
  const CAP_LANGS = [['auto', 'تلقائي'], ['ar', 'العربية'], ['en', 'English'], ['fr', 'Français'], ['es', 'Español'], ['de', 'Deutsch'], ['tr', 'Türkçe'], ['ru', 'Русский'], ['hi', 'हिन्दी'], ['ur', 'اردو'], ['fa', 'فارسی']];
  const CAP_MODELS = [['onnx-community/whisper-tiny', 'سريع (حوالي 40 ميجابايت)'], ['onnx-community/whisper-base', 'متوازن (حوالي 80 ميجابايت)'], ['onnx-community/whisper-small', 'دقيق (حوالي 250 ميجابايت)']];
  const CAP_STYLES = [2, 3, 4, 1];
  let asrWorker = null, asrUrl = 'captions-worker.js', asrConsent = false;

  async function clipAudio(c) {
    const m = mediaOf(c);
    const raw = await (await fetch(m.url)).arrayBuffer();
    const ab = await new OfflineAudioContext(1, 1, 16000).decodeAudioData(raw);
    const a0 = Math.floor(c.in * 16000), a1 = Math.min(ab.length, Math.ceil((c.in + c.dur * c.speed) * 16000));
    const out = new Float32Array(Math.max(0, a1 - a0));
    for (let ch = 0; ch < ab.numberOfChannels; ch++) {
      const d = ab.getChannelData(ch);
      for (let i = 0; i < out.length; i++) out[i] += d[a0 + i] / ab.numberOfChannels;
    }
    return out;
  }

  function runAsr(audio, opts, onMsg) {
    return new Promise((res, rej) => {
      if (!asrWorker) asrWorker = new Worker(asrUrl, { type: 'module' });
      const w = asrWorker;
      w.onmessage = (e) => {
        if (e.data.type === 'result') res(e.data.chunks);
        else if (e.data.type === 'error') rej(new Error(e.data.message));
        else onMsg(e.data);
      };
      w.onerror = (e) => rej(new Error(e.message || 'تعذّر تشغيل محرك التفريغ'));
      w.postMessage({ audio, ...opts }, [audio.buffer]);
    });
  }

  // Whisper segments -> short caption lines on the timeline
  function toLines(chunks, c, words) {
    const lines = [], srcLen = c.dur * c.speed;
    for (const ch of chunks) {
      const text = (ch.text || '').trim(); if (!text) continue;
      let [a, b] = ch.timestamp || [0, null];
      a = a || 0; if (b == null || b <= a) b = Math.min(a + 2.5, srcLen);
      const ws = text.split(/\s+/), n = Math.max(1, Math.ceil(ws.length / words)), per = Math.ceil(ws.length / n);
      const groups = [];
      for (let i = 0; i < ws.length; i += per) groups.push(ws.slice(i, i + per).join(' '));
      const total = groups.reduce((s, x) => s + x.length, 0);
      let t = a;
      for (const gt of groups) { const d = (b - a) * gt.length / total; lines.push({ s: t, e: t + d, text: gt }); t += d; }
    }
    const end = c.start + c.dur;
    const out = lines.map((l) => ({ s: c.start + l.s / c.speed, e: Math.min(end, c.start + l.e / c.speed), text: l.text })).filter((l) => l.s < end);
    out.forEach((l, i) => {
      if (l.e - l.s < 0.3) l.e = Math.min(end, l.s + 0.3);
      if (out[i + 1] && l.e > out[i + 1].s) l.e = Math.max(l.s + 0.1, out[i + 1].s);
    });
    return out;
  }

  function placeCaptions(c, lines) {
    S.clips = S.clips.filter((o) => o.capOf !== c.id);
    const lo = lines[0].s, hi = lines[lines.length - 1].e;
    const busy = (id) => S.clips.some((o) => o.track === id && o.start < hi && o.start + o.dur > lo);
    const track = !busy('T1') ? 'T1' : !busy('T2') ? 'T2' : 'T1';
    const P = TEXT_PRESETS[CAP.style], k = Math.min(1, S.res[0] / S.res[1] * 1.2);
    for (const l of lines) {
      const nc = newClip({
        track, start: l.s, dur: l.e - l.s, y: P.y, capOf: c.id,
        text: newText({ text: l.text, size: Math.round(P.size * k), bold: P.bold, stroke: P.stroke, bg: P.bg, shadow: P.shadow, anim: CAP.anim }),
      });
      S.clips.push(nc);
    }
  }

  function setCap(msg, pct) {
    CAP.msg = msg; if (pct != null) CAP.pct = pct;
    const m = $('#capMsg'), b = $('#capBar');
    if (m) m.textContent = msg; if (b) b.style.width = (CAP.pct * 100).toFixed(0) + '%';
  }

  async function autoCaption(c) {
    if (CAP.busy) return;
    const hasAudio = mediaOf(c) && mediaOf(c).kind !== 'image';
    if (!hasAudio) return;
    if (!asrConsent) {
      const mb = CAP_MODELS.find((x) => x[0] === CAP.model)[1];
      if (!confirm(`سيُحمَّل محرك Whisper (${mb}) من jsdelivr وhuggingface.co مرة واحدة ثم يُحفظ في المتصفح. التفريغ يتم على جهازك ولا يُرفع صوتك. متابعة؟`)) return;
      asrConsent = true;
    }
    CAP.busy = true; renderInspector(); setCap('قراءة الصوت…', 0);
    try {
      const audio = await clipAudio(c);
      if (audio.length < 1600) throw new Error('لا يوجد صوت في هذا المقطع');
      const chunks = await runAsr(audio, { language: CAP.lang, task: CAP.task, model: CAP.model }, (d) => {
        if (d.type === 'load') setCap(`تحميل النموذج… ${(d.pct * 100).toFixed(0)}%`, d.pct);
        else if (d.type === 'run') setCap('جارٍ تفريغ الكلام…', 1);
      });
      const lines = toLines(chunks, c, CAP.words);
      if (!lines.length) throw new Error('لم يُكتشف كلام في المقطع');
      placeCaptions(c, lines);
      S.sel = c.id; commit(); toast(`تمت إضافة ${lines.length} سطر كابشن`);
    } catch (err) {
      if (asrWorker) { asrWorker.terminate(); asrWorker = null; }
      toast('تعذّر إنشاء الكابشن: ' + err.message);
    } finally {
      CAP.busy = false; CAP.msg = ''; CAP.pct = 0; renderAll();
    }
  }

  function cancelCaption() {
    if (asrWorker) { asrWorker.terminate(); asrWorker = null; }
    // terminate() never settles the pending promise; unlock the UI directly
    CAP.busy = false; CAP.msg = ''; renderInspector(); toast('أُلغي إنشاء الكابشن');
  }

  const srtTime = (t) => {
    const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)},${String(ms % 1000).padStart(3, '0')}`;
  };
  function srtFor(c) {
    return S.clips.filter((o) => o.capOf === c.id).sort((a, b) => a.start - b.start)
      .map((o, i) => `${i + 1}\n${srtTime(o.start)} --> ${srtTime(o.start + o.dur)}\n${o.text.text}\n`).join('\n');
  }

  function captionSection(c) {
    const s = section('كابشن تلقائي');
    const have = S.clips.filter((o) => o.capOf === c.id).length;
    selRow(s, 'اللغة', CAP_LANGS, () => CAP.lang, (v) => { CAP.lang = v; });
    selRow(s, 'المهمة', [['transcribe', 'تفريغ بنفس اللغة'], ['translate', 'ترجمة إلى الإنجليزية']], () => CAP.task, (v) => { CAP.task = v; });
    selRow(s, 'الدقة', CAP_MODELS, () => CAP.model, (v) => { CAP.model = v; });
    selRow(s, 'النمط', CAP_STYLES.map((i) => [String(i), TEXT_PRESETS[i].name]), () => String(CAP.style), (v) => { CAP.style = +v; });
    selRow(s, 'الحركة', [['none', 'بدون'], ['fade', 'ظهور تدريجي'], ['slide', 'انزلاق'], ['pop', 'تكبير نابض']], () => CAP.anim, (v) => { CAP.anim = v; });
    const w = el('input', { type: 'number', min: 2, max: 14, step: 1, value: CAP.words, 'aria-label': 'كلمات في السطر' });
    w.addEventListener('change', () => { CAP.words = clamp(Math.round(+w.value) || 6, 2, 14); w.value = CAP.words; });
    s.append(el('div', { class: 'row two' }, el('label', { textContent: 'كلمات/سطر' }), w));
    const go = el('button', { class: 'primary wide', textContent: CAP.busy ? 'جارٍ العمل…' : have ? 'إعادة إنشاء الكابشن' : 'إنشاء الكابشن', disabled: CAP.busy, onclick: () => autoCaption(c) });
    s.append(go);
    if (CAP.busy) {
      s.append(el('div', { class: 'bar', style: 'margin-top:10px' }, el('i', { id: 'capBar' })), el('p', { id: 'capMsg', class: 'muted small' }),
        el('button', { class: 'ghost wide', textContent: 'إلغاء', onclick: cancelCaption }));
      setCap(CAP.msg, CAP.pct);
    } else if (have) {
      s.append(el('button', { class: 'ghost wide', textContent: `تنزيل SRT (${have} سطر)`, onclick: () => {
        const a = el('a', { href: URL.createObjectURL(new Blob(['﻿' + srtFor(c)], { type: 'text/plain' })), download: (mediaOf(c).name.replace(/\.[^.]+$/, '') || 'captions') + '.srt' });
        a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      } }), el('button', { class: 'ghost wide', textContent: 'حذف الكابشن', onclick: () => { S.clips = S.clips.filter((o) => o.capOf !== c.id); commit(); renderAll(); } }));
    }
    s.append(el('p', { class: 'muted small', textContent: 'يعمل التفريغ على جهازك. يُنشئ أسطرًا نصية قابلة للتعديل على مسار النص.' }));
    return s;
  }

  /* ---------- export ---------- */
  const MIMES = [
    ['MP4 (H.264)', 'video/mp4;codecs=avc1.640028,mp4a.40.2', 'mp4'],
    ['WebM (VP9)', 'video/webm;codecs=vp9,opus', 'webm'],
    ['WebM (VP8)', 'video/webm;codecs=vp8,opus', 'webm'],
    ['WebM', 'video/webm', 'webm'],
  ];
  let rec = null, chunks = [], expInfo = null, doneUrl = null;

  function openExport() {
    if (!S.clips.length) { toast('أضف مقاطع إلى الخط الزمني أولًا'); return; }
    pause();
    const sel = $('#expFmt'); sel.innerHTML = '';
    const ok = MIMES.filter(([, m]) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    ok.forEach(([n, m, ext]) => sel.append(el('option', { value: m, textContent: n, 'data-ext': ext })));
    $('#expMode').querySelector('[value=live]').disabled = !ok.length;
    $('#expMode').querySelector('[value=wc]').disabled = !window.VideoEncoder;
    if (!ok.length) $('#expMode').value = window.VideoEncoder ? 'wc' : 'fast';
    $('#expRes').textContent = `${S.res[0]} × ${S.res[1]} · ${FPS} fps`;
    updateExpMode();
    showExport('opts'); $('#exportModal').hidden = false;
  }
  function showExport(stage) {
    $('#expOpts').hidden = stage !== 'opts'; $('#expRun').hidden = stage !== 'run'; $('#expDone').hidden = stage !== 'done';
    $('#expStart').hidden = stage !== 'opts'; $('#expDl').hidden = stage !== 'done';
    $('#expCancel').textContent = stage === 'run' ? 'إلغاء' : 'إغلاق';
  }
  async function startExport() {
    if ($('#expMode').value === 'fast') return startFastExport('x264');
    if ($('#expMode').value === 'wc') return startFastExport('wc');
    ensureAudio(); await actx.resume();
    const opt = $('#expFmt').selectedOptions[0];
    const mime = opt.value, ext = opt.dataset.ext;
    S.exporting = true; S.sel = null; renderTimeline(); renderInspector(); seek(0); syncMedia();
    showExport('run'); $('#expBar').style.width = '0%'; $('#expMsg').textContent = 'تجهيز المقاطع…';
    await new Promise((r) => setTimeout(r, 700));
    monitor.gain.value = $('#expMute').checked ? 0 : 1;
    const stream = cv.captureStream(FPS);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    chunks = [];
    rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 * +$('#expQ').value, audioBitsPerSecond: 192000 });
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    expInfo = { mime, ext, cancelled: false, total: duration() };
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      monitor.gain.value = 1; S.exporting = false; pause();
      if (expInfo.cancelled) { $('#exportModal').hidden = true; return; }
      const blob = new Blob(chunks, { type: mime.split(';')[0] });
      if (doneUrl) URL.revokeObjectURL(doneUrl);
      doneUrl = URL.createObjectURL(blob);
      $('#expVideo').src = doneUrl;
      const dl = $('#expDl'); dl.href = doneUrl; dl.download = (S.name.trim() || 'video') + '.' + ext;
      showExport('done'); toast('اكتمل التصدير');
    };
    rec.start(500);
    play();
    const tick = () => {
      if (!S.exporting) return;
      const p = clamp(S.t / expInfo.total, 0, 1);
      $('#expBar').style.width = (p * 100).toFixed(1) + '%';
      $('#expMsg').textContent = `جارٍ التسجيل… ${fmt(S.t)} من ${fmt(expInfo.total)}`;
      requestAnimationFrame(tick);
    };
    tick();
  }
  function finishExport() {
    setTimeout(() => { if (rec && rec.state !== 'inactive') rec.stop(); }, 400);
  }
  function cancelExport() {
    if (S.fast) { fastCancel = true; return; }
    if (S.exporting && rec && rec.state !== 'inactive') { expInfo.cancelled = true; rec.stop(); return; }
    $('#exportModal').hidden = true; $('#expVideo').pause();
  }


  /* ---------- fast export: offline render + ffmpeg.wasm ---------- */
  const FF = {
    base: { ffmpeg: 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/', core: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/' },
    // SHA-384 of the files in the npm tarballs; anything that doesn't match is refused
    files: [
      ['ffmpeg', 'ffmpeg.js', 'text/javascript', '6gtICseWoSfROfflbGSkg1kwPTH+2SxMvyn0e3THJbNoyPxx5tzNk4EXfLIHD2iD'],
      ['ffmpeg', '814.ffmpeg.js', 'text/javascript', 'l2rTJ2R1KC9EDzuYSDeAvUOs6h0dm+YGX1oFKW7pn2e23NJ+JGHsFM+aPczr7nrr'],
      ['core', 'ffmpeg-core.js', 'text/javascript', 'sKfkiFtvUk+vexk+0EUhEh366190/4WpgUAsUvaxEfyg7+E1Zt5Y5hrsU808g8Q9'],
      ['core', 'ffmpeg-core.wasm', 'application/wasm', 'U1VDhkPYrM3wTCT4/vjSpSsKqG/UjljYrYCI4hBSJ02svbCkxuCi6U6u/peg5vpW'],
    ],
  };
  let ffm = null, ffConsent = false, fastCancel = false;

  async function loadFfmpeg(say) {
    if (ffm) return ffm;
    const urls = {};
    for (const [grp, name, mime, hash] of FF.files) {
      say(`تحميل ${name}…`);
      const r = await fetch(FF.base[grp] + name);
      if (!r.ok) throw new Error('تعذّر تحميل ' + name);
      const buf = await r.arrayBuffer();
      const got = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-384', buf))));
      if (got !== hash) throw new Error('فشل التحقق من سلامة ' + name);
      urls[name] = URL.createObjectURL(new Blob([buf], { type: mime }));
    }
    await new Promise((res, rej) => {
      const sc = document.createElement('script'); sc.src = urls['ffmpeg.js'];
      sc.onload = res; sc.onerror = () => rej(new Error('تعذّر تشغيل مكتبة ffmpeg')); document.head.append(sc);
    });
    say('تهيئة ffmpeg…');
    // ffmpeg.js starts its worker from a path next to its own script, which is a blob: URL here.
    // Hand it the verified worker blob instead (as a classic worker; classWorkerURL would make it a module worker,
    // where the core can't be loaded).
    const f = new FFmpegWASM.FFmpeg(), NativeWorker = window.Worker;
    window.Worker = function (u, o) { return new NativeWorker(String(u).endsWith('814.ffmpeg.js') ? urls['814.ffmpeg.js'] : u, o); };
    try { await f.load({ coreURL: urls['ffmpeg-core.js'], wasmURL: urls['ffmpeg-core.wasm'] }); } finally { window.Worker = NativeWorker; }
    ffm = f; return f;
  }

  const decodeCache = new Map();
  async function decodeMedia(m) {
    if (decodeCache.has(m.id)) return decodeCache.get(m.id);
    let buf = null;
    try {
      const raw = await (await fetch(m.url)).arrayBuffer();
      buf = await new OfflineAudioContext(2, 1, 44100).decodeAudioData(raw);
    } catch { /* no audio track */ }
    decodeCache.set(m.id, buf); return buf;
  }

  async function mixAudio(total) {
    const SR = 44100, ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(total * SR)), SR);
    for (const c of S.clips) {
      const m = mediaOf(c);
      if (!m || m.kind === 'image' || S.off[c.track]) continue;
      const buf = await decodeMedia(m); if (!buf) continue;
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = c.speed;
      const g = ctx.createGain(), end = c.start + c.dur, v = c.vol;
      g.gain.setValueAtTime(c.fadeIn > 0 ? 0 : v, c.start);
      if (c.fadeIn > 0) g.gain.linearRampToValueAtTime(v, c.start + c.fadeIn);
      if (c.fadeOut > 0) { g.gain.setValueAtTime(v, Math.max(c.start + c.fadeIn, end - c.fadeOut)); g.gain.linearRampToValueAtTime(0, end); }
      src.connect(g).connect(ctx.destination);
      src.start(c.start, c.in, c.dur * c.speed);
    }
    return ctx.startRendering();
  }

  function concatBytes(parts) {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }

  function wavBytes(ab) {
    const n = ab.length, ch = 2, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const str = (o, t) => [...t].forEach((x, i) => out.setUint8(o + i, x.charCodeAt(0)));
    str(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); str(8, 'WAVEfmt '); out.setUint32(16, 16, true);
    out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, ab.sampleRate, true);
    out.setUint32(28, ab.sampleRate * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true);
    str(36, 'data'); out.setUint32(40, n * 4, true);
    const L = ab.getChannelData(0), R = ab.numberOfChannels > 1 ? ab.getChannelData(1) : L;
    for (let i = 0, o = 44; i < n; i++, o += 4) {
      out.setInt16(o, clamp(L[i], -1, 1) * 0x7fff, true); out.setInt16(o + 2, clamp(R[i], -1, 1) * 0x7fff, true);
    }
    return new Uint8Array(out.buffer);
  }

  function seekEl(v, target) {
    return new Promise((res) => {
      if (Math.abs(v.currentTime - target) < 0.0005 && v.readyState >= 2) return res();
      const fin = () => { clearTimeout(to); v.removeEventListener('seeked', fin); res(); };
      const to = setTimeout(fin, 4000);
      v.addEventListener('seeked', fin); v.currentTime = target;
    });
  }
  let dsrc = new Map(), wcFrames = new Map(), demuxCache = new Map();
  function seekClip(c, t) {
    const m = mediaOf(c), e = elFor(c); e.el.muted = true;
    return seekEl(e.el, clamp(c.in + (t - c.start) * c.speed, 0, Math.max(0, m.duration - 0.001)));
  }
  // One frame per active video clip: from its WebCodecs reader when there is one, else by seeking the <video>.
  async function prepareFrames(t) {
    const jobs = [];
    for (const c of S.clips) {
      const m = mediaOf(c);
      if (!m || m.kind !== 'video' || S.off[c.track] || !isActive(c, t)) continue;
      const r = dsrc.get(c.id);
      if (!r) { jobs.push(seekClip(c, t)); continue; }
      jobs.push(r.frameAt(clamp(c.in + (t - c.start) * c.speed, 0, m.duration)).then((f) => { wcFrames.set(c.id, f); }).catch(() => {
        r.close(); dsrc.delete(c.id); wcFrames.delete(c.id); return seekClip(c, t);
      }));
    }
    await Promise.all(jobs);
  }
  // Untagged video is decoded with a default colour matrix that can differ from what <video> shows.
  // Compare one decoded frame against the element's rendering and keep the best-matching setting.
  const CS_VARIANTS = [
    undefined,
    { primaries: 'smpte170m', transfer: 'smpte170m', matrix: 'smpte170m', fullRange: false },
    { primaries: 'bt709', transfer: 'bt709', matrix: 'bt709', fullRange: true },
    { primaries: 'smpte170m', transfer: 'smpte170m', matrix: 'smpte170m', fullRange: true },
  ];
  async function calibrateColor(m, c, tr) {
    const W = 64, H = 36, mk = () => { const k = document.createElement('canvas'); k.width = W; k.height = H; return k.getContext('2d', { willReadFrequently: true }); };
    const t = clamp(c.in, 0, Math.max(0, m.duration - 0.001));
    const e = elFor(c); e.el.muted = true; await seekEl(e.el, t);
    if (e.el.readyState < 2) return;
    const ref = mk(); ref.drawImage(e.el, 0, 0, W, H);
    const R = ref.getImageData(0, 0, W, H).data;
    let best, bd = Infinity, base = Infinity;
    for (const cs of CS_VARIANTS) {
      tr.colorSpace = cs;
      const r = new Demux.Reader(tr);
      try {
        if (!(await r.start())) continue;
        const f = await r.frameAt(t), g = mk(); g.drawImage(f, 0, 0, W, H); f.close();
        const D = g.getImageData(0, 0, W, H).data; let d = 0;
        for (let i = 0; i < D.length; i++) d += Math.abs(D[i] - R[i]);
        if (cs === undefined) base = d;
        if (d < bd && (cs === undefined || d < base * 0.8)) { bd = d; best = cs; }
      } catch { /* variant unusable */ } finally { r.close(); }
    }
    tr.colorSpace = best;
  }

  async function openReaders(say) {
    dsrc = new Map(); wcFrames = new Map();
    if (!$('#expDec').checked || !window.Demux) return { used: 0, total: 0 };
    const vids = S.clips.filter((c) => { const m = mediaOf(c); return m && m.kind === 'video' && !S.off[c.track]; });
    say('تجهيز فك الترميز…', 0.03);
    for (const c of vids) {
      const m = mediaOf(c);
      if (!demuxCache.has(m.id)) demuxCache.set(m.id, Demux.open(m.file || await (await fetch(m.url)).blob()));
      const tr = await demuxCache.get(m.id); if (!tr) continue;
      if (!m.colorChecked) { m.colorChecked = true; await calibrateColor(m, c, tr); }
      const r = new Demux.Reader(tr);
      if (await r.start()) dsrc.set(c.id, r);
    }
    return { used: dsrc.size, total: vids.length };
  }
  function closeReaders() { for (const r of dsrc.values()) r.close(); dsrc.clear(); for (const f of wcFrames.values()) { try { f.close(); } catch { /* already closed */ } } wcFrames.clear(); }

  // Candidate WebCodecs configs, best first: H.264 (-> MP4) then VP9 (-> WebM).
  async function pickWcConfig(w, h, bitrate) {
    if (!window.VideoEncoder) return null;
    const base = { width: w, height: h, bitrate: Math.round(bitrate), framerate: FPS, latencyMode: 'quality' };
    const cands = [
      ...['avc1.640028', 'avc1.4d0028', 'avc1.42001f'].map((codec) => ({ kind: 'h264', cfg: { ...base, codec, avc: { format: 'annexb' } } })),
      { kind: 'vp9', cfg: { ...base, codec: 'vp09.00.40.08' } },
    ];
    for (const c of cands) {
      try { if ((await VideoEncoder.isConfigSupported(c.cfg)).supported) return c; } catch { /* try next */ }
    }
    return null;
  }

  function ivfBytes(chunks, w, h) {
    const total = chunks.reduce((n, c) => n + 12 + c.length, 32), out = new Uint8Array(total), dv = new DataView(out.buffer);
    out.set([0x44, 0x4b, 0x49, 0x46]); dv.setUint16(4, 0, true); dv.setUint16(6, 32, true);
    out.set([0x56, 0x50, 0x39, 0x30], 8); dv.setUint16(12, w, true); dv.setUint16(14, h, true);
    dv.setUint32(16, FPS, true); dv.setUint32(20, 1, true); dv.setUint32(24, chunks.length, true);
    let o = 32;
    chunks.forEach((c, i) => { dv.setUint32(o, c.length, true); dv.setBigUint64(o + 4, BigInt(i), true); out.set(c, o + 12); o += 12 + c.length; });
    return out;
  }

  async function startFastExport(engine = 'x264') {
    if (!ffConsent) {
      if (!confirm('سيُحمَّل محرك ffmpeg.wasm (حوالي 32 ميجابايت) من cdn.jsdelivr.net مرة واحدة، بعد التحقق من سلامته. الترميز يتم على جهازك. متابعة؟')) return;
      ffConsent = true;
    }
    const total = duration(), orig = S.res.slice();
    const k = +$('#expScale').value, crf = { 0.5: 28, 1: 23, 2: 18 }[$('#expQ').value] || 23;
    const even = (n) => Math.max(2, Math.round(n / 2) * 2);
    const res = [even(orig[0] * k), even(orig[1] * k)];
    const N = Math.max(1, Math.ceil(total * FPS)), CH = 90;
    pause(); fastCancel = false; S.exporting = true; S.fast = true; S.sel = null;
    showExport('run'); $('#expBar').style.width = '0%';
    const say = (m, p) => { $('#expMsg').textContent = m; if (p != null) $('#expBar').style.width = (p * 100).toFixed(1) + '%'; };
    const check = () => { if (fastCancel) throw new Error('cancel'); };
    let ok = false, enc = null;
    try {
      const ff = await loadFfmpeg(say); check();
      say('تجهيز الصوت…', 0.02);
      const wav = wavBytes(await mixAudio(total)); check();
      await ff.writeFile('a.wav', wav);

      const dec = await openReaders(say); check();
      S.res = res; for (const c of [cv, ov]) { c.width = res[0]; c.height = res[1]; }
      for (const c of S.clips) { const e = elFor(c); if (e) e.el.muted = true; }
      await Promise.all([...els.values()].map((e) => new Promise((r) => {
        if (e.el.readyState >= 2) return r();
        e.el.addEventListener('loadeddata', r, { once: true }); setTimeout(r, 5000);
      })));
      let mux = [], outName = 'out.mp4', outMime = 'video/mp4';
      const t0w = performance.now(), segs = [];
      if (engine === 'wc') {
        const bitrate = res[0] * res[1] * FPS * 0.1 * +$('#expQ').value;
        const pick = await pickWcConfig(res[0], res[1], bitrate);
        if (!pick) throw new Error('هذا المتصفح لا يدعم ترميز H.264 أو VP9 عبر WebCodecs');
        const chunks = []; let encErr = null;
        enc = new VideoEncoder({ output: (ch) => { const u = new Uint8Array(ch.byteLength); ch.copyTo(u); chunks.push(u); }, error: (e) => { encErr = e; } });
        enc.configure(pick.cfg);
        for (let i = 0; i < N; i++) {
          check(); if (encErr) throw encErr;
          S.t = i / FPS; await prepareFrames(S.t); render();
          const vf = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
          enc.encode(vf, { keyFrame: i % 60 === 0 }); vf.close();
          while (enc.encodeQueueSize > 6) { await new Promise((r) => enc.addEventListener('dequeue', r, { once: true })); check(); }
          const el = (performance.now() - t0w) / 1000, p = (i + 1) / N;
          say(`ترميز الإطار ${i + 1} من ${N} · متبقي حوالي ${Math.max(0, Math.round(el / p - el))} ث`, 0.05 + 0.85 * p);
        }
        await enc.flush(); enc.close(); enc = null; if (encErr) throw encErr; check();
        say('دمج الصوت والفيديو…', 0.95);
        let args;
        if (pick.kind === 'h264') {
          await ff.writeFile('v.h264', concatBytes(chunks)); mux = ['v.h264'];
          args = ['-y', '-f', 'h264', '-framerate', String(FPS), '-i', 'v.h264', '-i', 'a.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', 'out.mp4'];
        } else {
          await ff.writeFile('v.ivf', ivfBytes(chunks, res[0], res[1])); mux = ['v.ivf'];
          outName = 'out.webm'; outMime = 'video/webm';
          args = ['-y', '-f', 'ivf', '-i', 'v.ivf', '-i', 'a.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'libvorbis', '-b:a', '160k', 'out.webm'];
        }
        if (await ff.exec(args) !== 0) throw new Error('فشل الدمج');
      } else {
        // Pipeline: frames are rendered here while earlier frames are JPEG-compressed (off-thread) and x264-encoded
        // in the ffmpeg worker. Its message queue is FIFO, so writes, encodes and deletes stay in order.
        const jobs = [];
        const fname = (seg, n) => `f${seg}_${String(n).padStart(5, '0')}.jpg`;
        let done = 0;
        for (let a = 0, seg = 0; a < N; a += CH, seg++) {
          const b = Math.min(N, a + CH), writes = [];
          for (let i = a; i < b; i++) {
            check();
            S.t = i / FPS; await prepareFrames(S.t); render();
            const name = fname(seg, i - a + 1);
            const w = new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92)).then((bl) => bl.arrayBuffer()).then((ab) => ff.writeFile(name, new Uint8Array(ab)));
            w.catch(() => {}); // errors surface through Promise.all below; this keeps a cancel from leaving unhandled rejections
            writes.push(w);
            if (writes.length > 8) await writes[writes.length - 9];
            done = i + 1;
            const el = (performance.now() - t0w) / 1000, p = done / N;
            say(`معالجة الإطار ${done} من ${N} · متبقي حوالي ${Math.max(0, Math.round(el / p - el))} ث`, 0.05 + 0.85 * p);
          }
          await Promise.all(writes); check();
          const name = `s${seg}.mp4`, count = b - a;
          segs.push(name);
          const job = (ff.exec(['-y', '-framerate', String(FPS), '-start_number', '1', '-i', `f${seg}_%05d.jpg`, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-g', '60', '-r', String(FPS), name])
            .then(async (code) => {
              if (code !== 0) throw new Error('فشل الترميز');
              for (let i = 1; i <= count; i++) await ff.deleteFile(fname(seg, i));
            }));
          job.catch(() => {}); jobs.push(job);
          if (jobs.length > 2) await jobs[jobs.length - 3]; // backpressure: at most two chunks waiting
          check();
        }
        say('ترميز آخر الأجزاء…', 0.92);
        await Promise.all(jobs); check();
        say('دمج الصوت والفيديو…', 0.95);
        await ff.writeFile('list.txt', segs.map((n) => `file '${n}'`).join('\n'));
        const code = await ff.exec(['-y', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-i', 'a.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', 'out.mp4']);
        if (code !== 0) throw new Error('فشل الدمج');
        mux = ['list.txt', ...segs];

      }
      const data = await ff.readFile(outName);
      for (const n of [...mux, 'a.wav', outName]) { try { await ff.deleteFile(n); } catch { /* ignore */ } }
      if (doneUrl) URL.revokeObjectURL(doneUrl);
      doneUrl = URL.createObjectURL(new Blob([data], { type: outMime }));
      $('#expVideo').src = doneUrl;
      const dl = $('#expDl'); dl.href = doneUrl; dl.download = (S.name.trim() || 'video') + (outName.endsWith('webm') ? '.webm' : '.mp4');
      say('اكتمل', 1); showExport('done'); toast(`اكتمل التصدير خلال ${Math.round((performance.now() - t0w) / 1000)} ث` + (dec.total ? ` · فك الترميز بـ WebCodecs: ${dec.used} من ${dec.total} مقاطع` : ''));
      ok = true;
    } catch (err) {
      if (err.message === 'cancel') { if (ffm) { try { ffm.terminate(); } catch { /* ignore */ } ffm = null; } $('#exportModal').hidden = true; }
      else { toast('تعذّر التصدير السريع: ' + err.message); showExport('opts'); }
    } finally {
      closeReaders();
      if (enc && enc.state !== 'closed') { try { enc.close(); } catch { /* ignore */ } }
      S.res = orig; S.exporting = false; S.fast = false; S.t = 0; applyRes(); renderAll();
      if (!ok && ffm && !fastCancel) { for (const n of ['a.wav', 'out.mp4', 'out.webm', 'list.txt', 'v.h264', 'v.ivf']) { try { await ffm.deleteFile(n); } catch { /* ignore */ } } }
    }
  }

  function updateExpMode() {
    const mode = $('#expMode').value, fast = mode !== 'live';
    $('#expFmtRow').hidden = fast; $('#expMuteLbl').hidden = fast; $('#expDecLbl').hidden = !fast; $('#expDec').disabled = !window.VideoDecoder; $('#expScaleRow').hidden = !fast;
    $('#expNote').textContent = mode === 'wc'
      ? 'يُرسم كل إطار على حدة ويُرمَّز بواسطة مشفّر المتصفح (WebCodecs، وغالبًا بتسريع العتاد)، ثم يُدمج مع الصوت بواسطة ffmpeg.wasm دون إعادة ترميز. الناتج MP4 (H.264) أو WebM (VP9) إن لم يدعم المتصفح H.264. لا يرتبط الزمن بمدة الفيديو.'
      : fast
      ? 'يُرسم كل إطار على حدة ثم يُرمَّز بواسطة ffmpeg.wasm (معالج واحد)، فلا يرتبط الزمن بمدة الفيديو. يتفوق على الزمن الحقيقي مع الدقة المتوسطة أو الصغيرة على جهاز قوي، وقد يكون أبطأ مع الدقة الكاملة. يظهر الوقت المتبقي ويمكن الإلغاء.'
      : 'يُسجَّل الفيديو بالزمن الحقيقي: مدة التصدير تساوي مدة الفيديو. أبقِ هذا التبويب ظاهرًا حتى ينتهي.';
  }

  /* ---------- project-level ---------- */
  function setAspect(a) {
    S.aspect = a; S.res = ASPECTS[a].slice(); applyRes(); commit(); renderInspector();
  }
  async function newProject() {
    if (S.clips.length || S.media.size) if (!confirm('بدء مشروع جديد؟ سيُحذف المشروع الحالي وملفاته.')) return;
    pause(); for (const m of S.media.values()) URL.revokeObjectURL(m.url);
    S.media.clear(); S.clips = []; S.sel = null; S.off = {}; S.t = 0; S.name = 'مشروع بدون عنوان'; S.bg = '#000000';
    $('#projName').value = S.name; await idbClear();
    hist = []; hi = -1; commit(); renderAll(); renderBin();
  }

  async function loadSaved() {
    try {
      const raw = localStorage.getItem('studio.project'); if (!raw) return false;
      const { snap, media } = JSON.parse(raw);
      for (const mm of media) {
        const f = await idbGet(mm.id);
        if (f) { try { await importOne(f instanceof File ? f : new File([f], mm.name, { type: f.type }), mm.id, false); } catch { /* skip broken */ } }
      }
      const o = JSON.parse(snap);
      o.clips = o.clips.filter((c) => c.text || S.media.has(c.media));
      Object.assign(S, { clips: o.clips, res: o.res, aspect: o.aspect, off: o.off || {}, name: o.name, bg: o.bg || '#000000' });
      $('#aspect').value = S.aspect; $('#projName').value = S.name;
      return true;
    } catch { return false; }
  }

  function renderAll() { renderTimeline(); renderInspector(); renderLabels(); draw(); }

  /* ---------- wiring ---------- */
  function init() {
    setIcons(); updatePlayBtn(); buildLanes(); buildTextPresets();
    $('#btnPlay').onclick = () => (S.playing ? pause() : play());
    $('#btnStart').onclick = () => seek(0);
    $('#btnEnd').onclick = () => seek(duration());
    $('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
    $('#btnSplit').onclick = split; $('#btnDup').onclick = dupSel; $('#btnDel').onclick = () => removeSel(false);
    $('#btnNew').onclick = newProject; $('#btnExport').onclick = openExport;
    $('#expStart').onclick = startExport; $('#expMode').onchange = updateExpMode; $('#expCancel').onclick = cancelExport;
    $('#aspect').onchange = (e) => setAspect(e.target.value);
    $('#projName').onchange = (e) => { S.name = e.target.value; commit(); };
    $('#snap').onchange = (e) => { S.snap = e.target.checked; };
    $('#zoom').oninput = (e) => setZoom(+e.target.value);
    $('#zoomIn').onclick = () => setZoom(S.zoom * 1.3); $('#zoomOut').onclick = () => setZoom(S.zoom / 1.3);
    $('#zoomFit').onclick = () => { const d = Math.max(duration(), 1); setZoom((scroll.clientWidth - 40) / d); scroll.scrollLeft = 0; };
    $$('.tab').forEach((b) => b.addEventListener('click', () => {
      $$('.tab').forEach((x) => x.classList.toggle('on', x === b));
      $('#tab-media').hidden = b.dataset.tab !== 'media'; $('#tab-text').hidden = b.dataset.tab !== 'text';
    }));
    const file = $('#file');
    file.onchange = () => { importFiles([...file.files]); file.value = ''; };
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach((ev) => document.addEventListener(ev, (e) => {
      if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); drop.classList.add('over'); }
    }));
    ['dragleave', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => {
      if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); importFiles([...e.dataTransfer.files]); }
      if (ev === 'drop' || !e.relatedTarget) drop.classList.remove('over');
    }));

    document.addEventListener('keydown', (e) => {
      if (S.exporting) return;
      if (e.target.matches('input:not([type=range]):not([type=checkbox]), textarea, select')) return;
      const mod = e.ctrlKey || e.metaKey, k = e.key;
      if (mod && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && k.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (mod && k.toLowerCase() === 'd') { e.preventDefault(); dupSel(); }
      else if (mod) return;
      else if (k === ' ') { e.preventDefault(); S.playing ? pause() : play(); }
      else if (k === 's' || k === 'S' || k === 'س') split();
      else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); removeSel(e.shiftKey); }
      else if (k === 'ArrowLeft') { e.preventDefault(); seek(S.t - (e.shiftKey ? 1 : 1 / FPS)); }
      else if (k === 'ArrowRight') { e.preventDefault(); seek(S.t + (e.shiftKey ? 1 : 1 / FPS)); }
      else if (k === 'Home') seek(0);
      else if (k === 'End') seek(duration());
      else if (k === '+' || k === '=') setZoom(S.zoom * 1.3);
      else if (k === '-') setZoom(S.zoom / 1.3);
    });
    window.addEventListener('resize', () => { fitStage(); drawRuler(); });
    new ResizeObserver(() => { fitStage(); drawRuler(); }).observe($('#stageBox'));
    window.addEventListener('beforeunload', (e) => { if (S.exporting) { e.preventDefault(); e.returnValue = ''; } });

    loadSaved().then((restored) => {
      applyRes(); renderBin(); hist = []; hi = -1; commit(); renderAll();
      if (restored && S.clips.length) toast('تمت استعادة آخر مشروع');
      raf = requestAnimationFrame(frame);
    });

    // test / debugging hook
    window.__studio = { S, demuxOpen: (f) => Demux.open(f), pickWcConfig, loadFfmpeg, ivfBytes, wavBytes, setFfmpegBase: (b) => { FF.base = b; }, startFastExport, setAsrWorker: (u) => { asrUrl = u; }, autoCaption, srtFor, importFiles, addMediaClip, addText: () => addText(TEXT_PRESETS[0]), split, play, pause, seek, openExport, startExport, duration };
  }
  init();
})();
