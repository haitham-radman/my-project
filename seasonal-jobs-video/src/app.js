// Motion-graphics timeline: seasonal-jobs registration guide (Al Rifadah, Hajj 1448H).
// Deterministic: the renderer calls window.seek(t) for every frame.
const P = new URLSearchParams(location.search);
const W = +P.get('w') || 1080, H = +P.get('h') || 1920;
const ORI = W > H * 1.2 ? 'landscape' : (H > W * 1.2 ? 'portrait' : 'square');
const REM = Math.min(W, H) / 108;
document.documentElement.style.fontSize = REM + 'px';
const stage = document.getElementById('stage');
Object.assign(stage.style, { width: W + 'px', height: H + 'px' });
stage.classList.add(ORI);

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const I = {
  check: svg('<path d="M5 12.5l4.2 4.2L19 7"/>', 'stroke-width="3"'),
  upload: svg('<path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>'),
  eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 'stroke-width="3"'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  doc: svg('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6 8-6s7 1.5 8 6"/>'),
  msg: svg('<path d="M4 5h16v11H8l-4 4z"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
};
const CURSOR = `<div class="cursor"><div class="ring"></div><svg viewBox="0 0 24 24"><path d="M4 2.5l15.5 9-6.8 1.4L9.6 20z" fill="#151518" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg></div>`;

const fld = (label, req, inner = '<div class="bar"></div>', cls = '') =>
  `<div class="fld ${cls}"><label>${label}${req ? ' <em>*</em>' : ''}</label><div class="inp">${inner}</div></div>`;
const words = s => s.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
const head = (badge, title, sub) =>
  `<div class="head"><div class="badge">${badge}</div><div class="title">${words(title)}</div><div class="sub">${sub}</div></div>`;
const chrome = `<div class="chrome"><div><b>التقديم للوظائف الموسمية</b><small>موسم حج 1448هـ</small></div><img src="assets/logo.png"></div>`;

// ---------------------------------------------------------------- background
stage.insertAdjacentHTML('beforeend', `
<div class="bg">
  <div class="glow g1"></div><div class="glow g2"></div><div class="dia"></div>
  <svg class="rings" viewBox="0 0 200 200"><g fill="none" stroke-linecap="round">
    <circle cx="100" cy="100" r="88" stroke="#111" stroke-width="10" stroke-dasharray="330 223"/>
    <circle cx="100" cy="100" r="70" stroke="#fff" stroke-width="6" stroke-dasharray="200 240" opacity=".8"/>
    <circle cx="100" cy="100" r="54" stroke="#E8424E" stroke-width="8" stroke-dasharray="150 190"/></g></svg>
  <svg class="rings2" viewBox="0 0 200 200"><g fill="none" stroke-linecap="round">
    <circle cx="100" cy="100" r="88" stroke="#fff" stroke-width="6" stroke-dasharray="300 253"/>
    <circle cx="100" cy="100" r="66" stroke="#111" stroke-width="10" stroke-dasharray="180 235"/></g></svg>
</div>`);

// ---------------------------------------------------------------- scenes
const S = {};
const addScene = (id, html, cls = '') => {
  stage.insertAdjacentHTML('beforeend', `<div class="scene ${cls}" id="${id}">${html}</div>`);
  return (S[id] = document.getElementById(id));
};

addScene('intro', `
  <div class="logo-card"><img src="assets/logo.png"></div>
  <div class="kicker">شركة الرفادة لخدمات الحجاج</div>
  <div class="mega">${words('التوظيف الموسمي')}</div>
  <div class="pill">موسم حج 1448هـ</div>
  <div class="sub">كن جزءًا من فريق خدمة ضيوف الرحمن</div>`, 'center');

addScene('login', head('البداية', 'الدخول إلى البوابة', 'أدخل رقم الهوية ورقم الجوال، ثم أكّد بكود التحقق الذي يصلك') + `
  <div class="visual"><div class="card narrow">
    <img class="logo-sm" src="assets/logo.png">
    <div class="ctitle">تسجيل الدخول</div>
    ${fld('رقم الهوية', false, '<span class="ph">ادخل رقم الهوية</span><span class="tx ltr" data-type="1 0 • • • • • • • •"></span>')}
    <div style="height:2.4rem"></div>
    ${fld('رقم الجوال', false, '<span class="ph">ادخل رقم الجوال</span><span class="tx ltr" data-type="0 5 • • • • • • • •"></span>')}
    <div class="captcha"><div class="box">${I.check}</div>أنا لست برنامج روبوت</div>
    <div class="btn block go">تسجيل الدخول<i class="ripple"></i></div>
    <div class="overlay">
      <img class="logo-sm" src="assets/logo.png">
      <div class="ctitle">تأكيد إرسال الكود</div>
      ${fld('أدخل الكود المرسل', false, '<span class="ph">أدخل الكود</span><span class="tx ltr" data-type="• • • • • •"></span>')}
      <div class="btn block go2">تحقق<i class="ripple"></i></div>
    </div>
    <div class="sms"><div class="ic">${I.msg}</div><div><b>رسالة جديدة</b><small>كود التحقق الخاص بك لبوابة التوظيف</small></div></div>
    ${CURSOR}
  </div></div>`);

addScene('overview', `
  <div class="head" style="align-items:center;text-align:center;margin-bottom:20rem;flex:none"><div class="title">${words('سجّل طلبك في 7 خطوات')}</div>
  <div class="sub">نموذج إلكتروني واحد يرشدك من البداية حتى الإرسال</div></div>`, 'center');

addScene('s1', head('الخطوة 1', 'البيانات الأساسية', 'الاسم الرباعي بالعربي والإنجليزي، بيانات الهوية والميلاد، البنك والآيبان، والصورة الشخصية') + `
  <div class="visual"><div class="card">
    ${chrome}
    <div class="avatar" style="margin-bottom:2.6rem"><div class="ph2">${I.user}<div class="okdot">${I.check}</div></div>
      <div class="fld"><label>الصورة الشخصية <em>*</em></label><span class="tag-en">ارفع صورة واضحة</span></div></div>
    <div class="fld" style="margin-bottom:2.6rem"><label>الاسم الرباعي <em>*</em> <span class="tag-en">عربي / English</span></label>
      <div class="namegrid">${'<div class="inp"><div class="bar"></div></div>'.repeat(8)}</div></div>
    <div class="grid2">
      ${fld('الجنس', true, '<div class="bar"></div>')}
      ${fld('تاريخ الميلاد', true)}
      ${fld('الجنسية', true)}
      ${fld('رقم الهوية', false)}
      ${fld('تاريخ انتهاء الهوية', true)}
      ${fld('البنك', true)}
      ${fld('رقم حساب الآيبان', true, '<span class="tx ltr" data-type="SA" style="font-weight:800"></span><div class="bar" style="width:60%"></div>', 'full')}
    </div>
    <div class="btn block go">التالي<i class="ripple"></i></div>
    ${CURSOR}
  </div></div>`);

addScene('s2', head('الخطوة 2', 'بيانات الاتصال', 'مدينة وعنوان السكن ورقم الجوال، ثم وثّق بريدك الإلكتروني بكود من 6 أرقام') + `
  <div class="visual"><div class="card">
    ${chrome}
    <div class="grid2">
      ${fld('مدينة السكن', true)}
      ${fld('عنوان السكن', false)}
      ${fld('رقم الجوال', true, '', 'full')}
      <div class="fld full"><label>البريد الإلكتروني <em>*</em></label>
        <div style="display:flex;gap:1.4rem"><div class="inp" style="flex:1"><span class="tx ltr" data-type="name@email.com"></span></div><div class="btn sm vbtn">تحقق<i class="ripple"></i></div></div></div>
    </div>
    <div class="btn block go">التالي<i class="ripple"></i></div>
    <div class="dim"></div>
    <div class="modal"><div class="mh">${I.mail}التحقق من البريد الإلكتروني</div>
      <div class="mb"><b>كود التحقق (6 أرقام)</b><div class="otp">${'4 8 2 9 1 6'.split(' ').map(d => `<span><i>${d}</i></span>`).join('')}</div>
      <div class="btn sm mbtn" style="margin-top:3rem">${I.check}تحقق<i class="ripple"></i></div></div></div>
    <div class="toast"><div class="okdot">${I.check}</div>تم التحقق من البريد الإلكتروني بنجاح</div>
    ${CURSOR}
  </div></div>`);

addScene('s3', head('الخطوة 3', 'المهارات', 'حدّد مؤهلك العلمي وتخصصك واللغات التي تتقنها') + `
  <div class="visual"><div class="card">
    ${chrome}
    <div class="grid2">
      <div class="fld rel q"><label>المؤهل <em>*</em></label><div class="inp dd"><span class="ph">اختر</span><span class="tx" data-type="بكالوريوس"></span></div>
        <div class="menu"><div>ثانوي</div><div>دبلوم</div><div class="hi">بكالوريوس</div><div>ماجستير</div></div></div>
      ${fld('التخصص', true, '<span class="ph">اختر</span><span class="tx" data-type="إدارة أعمال"></span>', 'dd')}
      <div class="fld full"><label>اللغات <em>*</em></label><div class="inp" style="height:7rem"><div class="tags"><span class="tagx">العربية ×</span><span class="tagx">الإنجليزية ×</span></div></div></div>
    </div>
    <div class="btn block go">التالي<i class="ripple"></i></div>
    ${CURSOR}
  </div></div>`);

const tableSec = (title, btn, cols) => `
  <div class="sec"><div class="sech"><div><b>${title}</b><span class="opt">اختياري</span></div><div class="btn sm add">${I.plus}${btn}<i class="ripple"></i></div></div>
  <div class="thead">${cols.map(c => `<span>${c}</span>`).join('')}<span>مرفق</span><span>حذف</span></div>
  <div class="trow">${cols.map(() => '<div class="inp"><div class="bar"></div></div>').join('')}<div class="ib">${I.upload}</div><div class="ib del">${I.trash}</div></div></div>`;
addScene('s45', head('الخطوتان 4 و5', 'الدورات والخبرات', 'أضف دوراتك وخبراتك السابقة إن وجدت، ويمكنك حذف أي سطر بأيقونة الحذف') + `
  <div class="visual"><div class="card">
    ${chrome}
    ${tableSec('الدورات', 'إضافة دورة', ['اسم الدورة', 'الجهة', 'تاريخ البداية', 'نوع الدورة'])}
    ${tableSec('الخبرات', 'إضافة خبرة', ['الموسم', 'جهة العمل', 'الوظيفة', 'مجال الخبرة'])}
    <div class="note">المرفق اختياري: صيغة PDF بحد أقصى 1MB</div>
    ${CURSOR}
  </div></div>`);

const files = [['صورة الهوية', 1], ['حساب الآيبان', 1], ['السيرة الذاتية', 1], ['العنوان الوطني', 1], ['المؤهل العلمي', 1], ['رخصة القيادة', 0]];
addScene('s6', head('الخطوة 6', 'الملفات', 'ارفع المستندات المطلوبة بصيغة PDF وبحجم لا يتجاوز 1MB للملف') + `
  <div class="visual"><div class="card">
    ${chrome}
    <div class="grid3">${files.map(([n, r]) => `
      <div class="tile"><div class="okdot">${I.check}</div><div class="doc">${I.doc}<small>PDF</small></div>
        <b>${n}${r ? ' <span class="req">*</span>' : ''}</b>${r ? '' : '<span class="opt">اختياري</span>'}
        <div class="acts"><span class="eye">${I.eye}</span><span class="up">${I.upload}</span></div><div class="prog"></div></div>`).join('')}
    </div>
    <div class="rule">جميع الملفات المطلوبة بصيغة PDF بحد أعلى 1MB</div>
    ${CURSOR}
  </div></div>`);

addScene('s7', head('الخطوة 7', 'الطلب', 'اختر موقع العمل والرغبة الوظيفية، ووافق على الاشتراطات العامة ثم أرسل طلبك') + `
  <div class="visual"><div class="card">
    ${chrome}
    <div class="fld"><label>موقع العمل <em>*</em></label>
      <div class="radios"><div class="radio r1"><div class="rd"><i></i></div>مكة المكرمة<div class="hl"></div></div>
      <div class="radio r2"><div class="rd"><i></i></div>المدينة المنورة<div class="hl"></div></div></div></div>
    <div style="height:2.8rem"></div>
    ${fld('الرغبة الوظيفية', true, '<span class="ph">اختر الوظيفة المرغوبة</span><div class="bar" style="width:55%"></div>', 'dd job')}
    <span class="link">اضغط هنا للاطلاع على الاشتراطات العامة</span>
    <div class="agree"><div class="box">${I.check}</div>تم الاطلاع والموافقة على الاشتراطات العامة</div>
    <div class="btn block go">إرسال<i class="ripple"></i></div>
    <div class="terms"><div class="tt"></div><b>متطلبات التوظيف الموسمي لحج عام 1448هـ</b>
      ${'<div class="l"></div>'.repeat(3)}<div class="l" style="width:70%"></div>${'<div class="l"></div>'.repeat(2)}<div class="l" style="width:55%"></div></div>
    ${CURSOR}
  </div></div>`);

addScene('ok', head('تم بنجاح', 'تم تسجيل طلبك', 'تظهر رسالة تأكيد تحمل رقم طلبك، احتفظ به للمتابعة') + `
  <div class="visual"><div class="card narrow succ">
    <img class="logo-sm" src="assets/logo.png">
    <svg class="big" viewBox="0 0 100 100"><circle class="cc" cx="50" cy="50" r="44" fill="none" stroke="#1FA855" stroke-width="7" stroke-linecap="round" transform="rotate(-90 50 50)"/>
      <path class="ck" d="M30 52l13 13 27-29" fill="none" stroke="#1FA855" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h3>لقد تم تسجيل طلبك بنجاح</h3>
    <p>اسم المتقدم: <span class="bar"></span></p>
    <p>رقم الطلب: <span class="ltr num" style="color:var(--red);font-weight:900"></span></p>
  </div></div>`);

addScene('cta', `
  <div class="logo-card"><img src="assets/logo.png"></div>
  <div class="mega">${words('سجّل الآن')}</div>
  <div class="sub" style="font-weight:700">التوظيف الموسمي لموسم حج 1448هـ</div>
  <div class="row"><div class="pill ghost">مكة المكرمة</div><div class="pill ghost">المدينة المنورة</div></div>
  <div class="support"><div class="ic">${I.phone}</div><div><small>للدعم الفني</small><b class="ltr">012-541-4423</b></div></div>
  <div class="hint">${I.link}رابط التسجيل في الوصف</div>`, 'center');

// ---------------------------------------------------------------- stepper
const STEPS = ['الأساسية', 'الاتصال', 'المهارات', 'الدورات', 'الخبرات', 'الملفات', 'الطلب'];
stage.insertAdjacentHTML('beforeend', `<div class="stepper" id="stepper">${STEPS.map((s, i) => `
  <div class="st"><div class="c">${i + 1}<div class="on">${i + 1}</div><div class="done">${I.check}</div></div>
  <div class="lb">${s}</div>${i < 6 ? '<div class="ln"><i></i></div>' : ''}</div>`).join('')}</div>`);
const stepper = document.getElementById('stepper');
const STEP_TOP = { portrait: 8, square: 3.2, landscape: 3.2 }[ORI] * REM;
stepper.style.top = STEP_TOP + 'px';
const stEls = [...stepper.querySelectorAll('.st')];

// ---------------------------------------------------------------- timeline
const tl = gsap.timeline({ paused: true });
const SFX = [];
const sfx = (t, type) => SFX.push({ t: +t.toFixed(3), type });
const q = (el, s) => el.querySelector(s);
const qa = (el, s) => [...el.querySelectorAll(s)];

function rel(el, card) {
  const c = card.getBoundingClientRect(), r = el.getBoundingClientRect();
  const k = c.width / card.offsetWidth;
  return { x: (r.left - c.left + r.width / 2) / k, y: (r.top - c.top + r.height / 2) / k };
}
function cursorPath(card, t0, targets) {
  // targets: [{el, t, click:bool}] ; cursor glides between them
  const cur = q(card, '.cursor');
  const ring = q(cur, '.ring');
  const first = rel(targets[0].el, card);
  tl.fromTo(cur, { x: first.x + 120, y: first.y + 160, opacity: 0 }, { x: first.x, y: first.y, opacity: 1, duration: .5, ease: 'power2.out' }, t0);
  let prev = t0 + .5;
  targets.forEach((tg, i) => {
    const p = rel(tg.el, card);
    if (i > 0) tl.to(cur, { x: p.x, y: p.y, duration: Math.max(.25, Math.min(.55, tg.t - prev - .02)), ease: 'power2.inOut' }, Math.max(prev, tg.t - .55));
    if (tg.click !== false) {
      tl.to(cur, { scale: .82, duration: .08, yoyo: true, repeat: 1, transformOrigin: '0 0' }, tg.t);
      tl.fromTo(ring, { scale: .2, opacity: .9 }, { scale: 1.4, opacity: 0, duration: .45, ease: 'power2.out' }, tg.t);
      const rp = tg.el.querySelector(':scope > .ripple');
      if (rp) tl.fromTo(rp, { scale: 0, opacity: .8 }, { scale: 14, opacity: 0, duration: .55, ease: 'power2.out' }, tg.t);
      sfx(tg.t, 'click');
    }
    prev = tg.t + .1;
  });
  return cur;
}
function typeIn(el, t, dur) {
  const str = el.dataset.type, o = { n: 0 };
  const ph = el.parentElement.querySelector('.ph');
  if (ph) tl.to(ph, { opacity: 0, duration: .15 }, t);
  tl.to(el.closest('.inp'), { borderColor: '#C42A36', duration: .15 }, t);
  tl.to(o, { n: str.length, duration: dur, ease: 'none', onUpdate: () => { el.textContent = str.slice(0, Math.round(o.n)); } }, t);
  tl.to(el.closest('.inp'), { borderColor: '#E4A9AF', duration: .2 }, t + dur + .1);
  sfx(t, 'type');
}
function fillBars(bars, t, gap = .08, dur = .35) {
  bars.forEach((b, i) => tl.to(b, { scaleX: 1, duration: dur, ease: 'power2.out' }, t + i * gap));
}
function enter(scene, t, centered = false) {
  tl.set(scene, { visibility: 'visible' }, t);
  sfx(t, 'whoosh');
  const headKids = centered ? [...scene.children] : qa(scene, '.head > *');
  headKids.forEach((k, i) => {
    const ws = k.classList.contains('title') || k.classList.contains('mega') ? qa(k, '.w') : null;
    if (ws && ws.length) {
      tl.from(ws, { y: 60, opacity: 0, filter: 'blur(12px)', duration: .6, stagger: .12, ease: 'power3.out' }, t + .1 + i * .1);
    } else {
      tl.from(k, { y: 40, opacity: 0, duration: .55, ease: 'power3.out' }, t + .1 + i * .1);
    }
  });
  const card = q(scene, '.card');
  if (card) tl.from(card, { y: 120, opacity: 0, scale: .92, rotateX: 8, duration: .8, ease: 'power3.out' }, t + .15);
  return card;
}
function exit(scene, t) {
  tl.to(scene, { opacity: 0, y: -50, filter: 'blur(8px)', duration: .45, ease: 'power2.in' }, t);
  tl.set(scene, { visibility: 'hidden' }, t + .46);
}
const press = (btn, t) => tl.to(btn, { scale: .95, duration: .1, yoyo: true, repeat: 1 }, t);
function stepOn(i, t) {
  const st = stEls[i];
  tl.to(q(st, '.on'), { opacity: 1, duration: .3 }, t);
  tl.fromTo(q(st, '.c'), { scale: 1 }, { scale: 1.18, duration: .4, ease: 'back.out(3)' }, t);
  tl.to(q(st, '.lb'), { color: '#fff', fontWeight: 900, duration: .3 }, t);
}
function stepDone(i, t) {
  const st = stEls[i];
  tl.to(q(st, '.done'), { opacity: 1, duration: .3 }, t);
  tl.to(q(st, '.on'), { opacity: 0, duration: .3 }, t);
  tl.to(q(st, '.c'), { scale: 1, duration: .3 }, t);
  tl.to(q(st, '.lb'), { color: 'rgba(255,255,255,.75)', fontWeight: 700, duration: .3 }, t);
  const ln = q(st, '.ln i');
  if (ln) tl.to(ln, { scaleX: 1, duration: .4, ease: 'power2.inOut' }, t + .1);
}

function fitVisuals() {
  // scale tall cards so they never collide with the stepper or the frame edge
  if (ORI === 'portrait') return;
  Object.values(S).forEach(sc => {
    const v = sc.querySelector('.visual'), card = v && v.querySelector('.card');
    if (!card) return;
    const h = card.offsetHeight / REM;
    if (ORI === 'landscape') v.style.transform = `scale(${Math.min(.84, 87 / h)})`;
    else {
      const top = (v.getBoundingClientRect().top - stage.getBoundingClientRect().top) / REM;
      v.style.transform = `scale(${Math.min(.66, (H / REM - top - 2.5) / h)})`;
    }
  });
}

function build() {
  fitVisuals();
  // ambient background motion over the full piece
  const DUR = 56;
  tl.to('.dia', { x: 14 * 3 * REM, duration: DUR, ease: 'none' }, 0);
  tl.to('.rings', { rotation: 140, duration: DUR, ease: 'none' }, 0);
  tl.to('.rings2', { rotation: -120, duration: DUR, ease: 'none' }, 0);
  tl.to('.g1', { x: -20 * REM, y: 10 * REM, duration: DUR / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0);
  gsap.set(stepper, { xPercent: -50, opacity: 0 });

  // 1) INTRO 0 – 5
  {
    const s = S.intro;
    tl.set(s, { visibility: 'visible' }, 0);
    tl.from(q(s, '.logo-card'), { y: -80, scale: .6, opacity: 0, duration: .9, ease: 'back.out(1.8)' }, .2);
    tl.from(q(s, '.kicker'), { y: 30, opacity: 0, duration: .6 }, .7);
    tl.from(qa(s, '.mega .w'), { y: 120, opacity: 0, scale: 1.3, filter: 'blur(20px)', duration: .9, stagger: .18, ease: 'power4.out' }, 1.0);
    tl.from(q(s, '.pill'), { scale: 0, opacity: 0, duration: .6, ease: 'back.out(2.5)' }, 1.9);
    tl.from(q(s, '.sub'), { y: 30, opacity: 0, duration: .6 }, 2.4);
    tl.to(q(s, '.pill'), { scale: 1.06, duration: .5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 3.2);
    sfx(.2, 'whoosh'); sfx(1.0, 'hit'); sfx(1.9, 'pop');
    exit(s, 4.7);
  }

  // 2) LOGIN 5 – 11
  {
    const s = S.login, card = enter(s, 5.1);
    const [idT, mobT, otpT] = qa(card, '.tx');
    typeIn(idT, 6.0, .8);
    typeIn(mobT, 7.0, .8);
    const box = q(card, '.captcha .box svg');
    tl.to(box, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(3)' }, 8.05);
    const go = q(card, '.go');
    press(go, 8.5);
    cursorPath(card, 5.6, [{ el: q(card, '.inp'), t: 5.95 }, { el: qa(card, '.inp')[1], t: 6.95 }, { el: q(card, '.captcha .box'), t: 8.0 }, { el: go, t: 8.5 }]);
    const ov = q(card, '.overlay');
    tl.to(ov, { opacity: 1, duration: .4 }, 8.8);
    const sms = q(card, '.sms');
    tl.fromTo(sms, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'back.out(1.6)' }, 9.0);
    sfx(9.0, 'ding');
    tl.to(sms, { y: -80, opacity: 0, duration: .4 }, 10.2);
    typeIn(otpT, 9.5, .6);
    press(q(card, '.go2'), 10.3);
    tl.to(q(card, '.cursor'), { x: rel(q(card, '.go2'), card).x, y: rel(q(card, '.go2'), card).y, duration: .5 }, 9.6);
    tl.fromTo(q(card, '.go2 .ripple'), { scale: 0, opacity: .8 }, { scale: 14, opacity: 0, duration: .55 }, 10.3);
    sfx(10.3, 'click');
    exit(s, 10.8);
  }

  // 3) OVERVIEW 11.2 – 14.6 (stepper flies to the top)
  {
    const s = S.overview;
    tl.set(s, { visibility: 'visible' }, 11.2);
    sfx(11.2, 'whoosh');
    tl.from(qa(s, '.title .w'), { y: 60, opacity: 0, filter: 'blur(12px)', duration: .6, stagger: .1, ease: 'power3.out' }, 11.3);
    tl.from(q(s, '.sub'), { y: 30, opacity: 0, duration: .5 }, 11.8);
    // place stepper under the headline
    const sh = q(s, '.head').getBoundingClientRect();
    const target = sh.bottom + 9 * REM;
    const dy = target - STEP_TOP;
    tl.set(stepper, { opacity: 1, y: dy, scale: ORI === 'landscape' ? 1.35 : 1.12 }, 11.2);
    tl.from(stEls, { y: 50, opacity: 0, scale: .5, duration: .5, stagger: .1, ease: 'back.out(2)' }, 11.9);
    stEls.forEach((_, i) => sfx(11.9 + i * .1, 'tick'));
    tl.to(s, { opacity: 0, y: -60, duration: .4, ease: 'power2.in' }, 14.0);
    tl.set(s, { visibility: 'hidden' }, 14.45);
    tl.to(stepper, { y: 0, scale: 1, duration: .8, ease: 'power3.inOut' }, 14.0);
  }

  // 4) STEP 1  14.6 – 19.8
  {
    const s = S.s1, card = enter(s, 14.6);
    stepOn(0, 14.7);
    tl.to(q(card, '.okdot'), { opacity: 1, scale: 1, duration: .35, ease: 'back.out(3)' }, 15.6);
    sfx(15.6, 'pop');
    fillBars(qa(card, '.namegrid .bar'), 15.9, .07);
    fillBars(qa(card, '.grid2 .bar').slice(0, 6), 16.6, .12);
    typeIn(q(card, '.grid2 .tx'), 17.5, .2);
    fillBars(qa(card, '.grid2 .bar').slice(6), 17.75, 0, .4);
    const go = q(card, '.go');
    cursorPath(card, 15.1, [{ el: q(card, '.ph2'), t: 15.55 }, { el: q(card, '.namegrid'), t: 16.2, click: false }, { el: go, t: 18.6 }]);
    press(go, 18.6);
    stepDone(0, 18.9);
    exit(s, 19.3);
  }

  // 5) STEP 2  19.8 – 25.3
  {
    const s = S.s2, card = enter(s, 19.8);
    stepOn(1, 19.9);
    fillBars(qa(card, '.bar'), 20.6, .15);
    typeIn(q(card, '.tx'), 21.0, .6);
    const vb = q(card, '.vbtn'), mb = q(card, '.mbtn'), go = q(card, '.go');
    cursorPath(card, 20.3, [{ el: q(card, '.inp'), t: 20.6, click: false }, { el: vb, t: 21.75 }, { el: mb, t: 23.4 }, { el: go, t: 24.35 }]);
    press(vb, 21.75);
    tl.to(q(card, '.dim'), { opacity: 1, duration: .3 }, 21.9);
    const md = q(card, '.modal');
    tl.fromTo(md, { yPercent: -40, scale: .9, opacity: 0 }, { yPercent: -50, scale: 1, opacity: 1, duration: .45, ease: 'back.out(1.6)' }, 21.95);
    qa(card, '.otp i').forEach((d, i) => {
      tl.fromTo(d, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .2 }, 22.4 + i * .14);
      tl.to(d.parentElement, { borderColor: '#C42A36', duration: .1 }, 22.4 + i * .14);
    });
    sfx(22.4, 'type');
    press(mb, 23.4);
    tl.to([md, q(card, '.dim')], { opacity: 0, duration: .3 }, 23.65);
    const toast = q(card, '.toast');
    tl.fromTo(toast, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'back.out(2)' }, 23.7);
    sfx(23.7, 'success');
    press(go, 24.35);
    stepDone(1, 24.6);
    exit(s, 24.85);
  }

  // 6) STEP 3  25.3 – 29.8
  {
    const s = S.s3, card = enter(s, 25.3);
    stepOn(2, 25.4);
    const qf = q(card, '.fld.q'), menu = q(qf, '.menu'), go = q(card, '.go');
    cursorPath(card, 25.8, [{ el: q(qf, '.inp'), t: 26.15 }, { el: q(menu, '.hi'), t: 26.85 }, { el: qa(card, '.inp')[1], t: 27.4 }, { el: go, t: 28.9 }]);
    tl.fromTo(menu, { scaleY: .4, opacity: 0 }, { scaleY: 1, opacity: 1, duration: .3 }, 26.2);
    tl.to(menu, { opacity: 0, duration: .2 }, 26.9);
    const [t1, t2] = qa(card, '.tx');
    typeIn(t1, 26.95, .3);
    typeIn(t2, 27.45, .4);
    qa(card, '.tagx').forEach((g, i) => { tl.fromTo(g, { scale: .3, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: 'back.out(3)' }, 28.0 + i * .3); sfx(28.0 + i * .3, 'pop'); });
    press(go, 28.9);
    stepDone(2, 29.1);
    exit(s, 29.35);
  }

  // 7) STEPS 4 + 5  29.8 – 35.3
  {
    const s = S.s45, card = enter(s, 29.8);
    stepOn(3, 29.9);
    const [a1, a2] = qa(card, '.add'), [r1, r2] = qa(card, '.trow');
    press(a1, 30.9);
    tl.fromTo(r1, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .35 }, 31.05);
    fillBars(qa(r1, '.bar'), 31.3, .12);
    stepDone(3, 32.3);
    stepOn(4, 32.5);
    press(a2, 32.9);
    tl.fromTo(r2, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .35 }, 33.05);
    fillBars(qa(r2, '.bar'), 33.3, .12);
    const del = q(r2, '.del');
    tl.to(del, { scale: 1.2, duration: .25, yoyo: true, repeat: 3 }, 34.0);
    cursorPath(card, 30.3, [{ el: a1, t: 30.9 }, { el: a2, t: 32.9 }, { el: del, t: 34.0, click: false }]);
    stepDone(4, 34.6);
    exit(s, 34.85);
  }

  // 8) STEP 6  35.3 – 40.8
  {
    const s = S.s6, card = enter(s, 35.3);
    stepOn(5, 35.4);
    const tiles = qa(card, '.tile');
    tiles.forEach((tile, i) => {
      const t = 36.1 + i * .45;
      tl.to(q(tile, '.prog'), { scaleX: 1, duration: .35, ease: 'power1.inOut' }, t);
      tl.to(q(tile, '.okdot'), { opacity: 1, scale: 1, duration: .3, ease: 'back.out(3)' }, t + .3);
      tl.to(q(tile, '.eye'), { opacity: 1, duration: .3 }, t + .3);
      tl.to(tile, { borderColor: '#9ED9B2', duration: .3 }, t + .3);
      sfx(t + .3, 'pop');
    });
    const rule = q(card, '.rule');
    tl.fromTo(rule, { scale: 1 }, { scale: 1.05, duration: .3, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 38.9);
    tl.to(rule, { backgroundColor: '#FDECEE', duration: .3 }, 38.9);
    cursorPath(card, 35.7, tiles.map((tile, i) => ({ el: q(tile, '.up'), t: 36.1 + i * .45 })));
    stepDone(5, 40.1);
    exit(s, 40.35);
  }

  // 9) STEP 7  40.8 – 46.3
  {
    const s = S.s7, card = enter(s, 40.8);
    stepOn(6, 40.9);
    const r1 = q(card, '.r1'), r2 = q(card, '.r2');
    tl.to([q(r1, '.rd i'), q(r1, '.hl')], { scale: 1, opacity: 1, duration: .25 }, 41.6);
    tl.to([q(r1, '.rd i'), q(r1, '.hl')], { scale: 0, opacity: 0, duration: .25 }, 42.1);
    tl.to([q(r2, '.rd i'), q(r2, '.hl')], { scale: 1, opacity: 1, duration: .25 }, 42.1);
    tl.to([q(r2, '.rd i'), q(r2, '.hl')], { scale: 0, opacity: 0, duration: .25 }, 42.5);
    tl.to([q(r1, '.rd i'), q(r1, '.hl')], { scale: 1, opacity: 1, duration: .25 }, 42.5);
    const job = q(card, '.job .inp');
    tl.to(q(job, '.ph'), { opacity: 0, duration: .15 }, 42.95);
    fillBars([q(job, '.bar')], 43.0, 0, .4);
    const link = q(card, '.link'), terms = q(card, '.terms');
    tl.fromTo(terms, { y: 60, opacity: 0, scale: .95 }, { y: 0, opacity: 1, scale: 1, duration: .4, ease: 'power3.out' }, 43.6);
    tl.to(terms, { y: 60, opacity: 0, duration: .3 }, 44.5);
    const bx = q(card, '.agree .box');
    tl.to(q(bx, 'svg'), { opacity: 1, scale: 1, duration: .3, ease: 'back.out(3)' }, 44.9);
    const go = q(card, '.go');
    tl.to(go, { scale: 1.04, duration: .2, yoyo: true, repeat: 1 }, 45.3);
    cursorPath(card, 41.2, [{ el: r1, t: 41.6 }, { el: r2, t: 42.1 }, { el: r1, t: 42.5 }, { el: job, t: 42.95 }, { el: link, t: 43.55 }, { el: bx, t: 44.9 }, { el: go, t: 45.55 }]);
    press(go, 45.55);
    stepDone(6, 45.8);
    exit(s, 46.0);
  }

  // 10) SUCCESS 46.4 – 50.6
  {
    const s = S.ok, card = enter(s, 46.4);
    const cc = q(card, '.cc'), ck = q(card, '.ck');
    const lc = 2 * Math.PI * 44, lk = ck.getTotalLength();
    tl.fromTo(cc, { strokeDasharray: lc, strokeDashoffset: lc }, { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut' }, 47.0);
    tl.fromTo(ck, { strokeDasharray: lk, strokeDashoffset: lk }, { strokeDashoffset: 0, duration: .45, ease: 'power2.out' }, 47.6);
    tl.from(q(card, 'svg.big'), { scale: .6, duration: .8, ease: 'back.out(2)' }, 47.0);
    sfx(47.6, 'success');
    const num = q(card, '.num'), str = '2 4 7 0 • • • •'.replace(/ /g, ''), o = { n: 0 };
    tl.to(o, { n: str.length, duration: .6, ease: 'none', onUpdate: () => { num.textContent = str.slice(0, Math.round(o.n)); } }, 48.2);
    stEls.forEach((st, i) => tl.to(q(st, '.c'), { scale: 1.2, duration: .18, yoyo: true, repeat: 1 }, 47.2 + i * .07));
    tl.to(stepper, { opacity: 0, y: -40, duration: .4 }, 50.0);
    exit(s, 50.1);
  }

  // 11) CTA 50.6 – 56
  {
    const s = S.cta;
    tl.set(s, { visibility: 'visible' }, 50.6);
    sfx(50.6, 'whoosh');
    tl.from(q(s, '.logo-card'), { y: -60, scale: .7, opacity: 0, duration: .7, ease: 'back.out(1.8)' }, 50.7);
    tl.from(qa(s, '.mega .w'), { y: 100, opacity: 0, scale: 1.3, filter: 'blur(18px)', duration: .8, stagger: .15, ease: 'power4.out' }, 51.0);
    sfx(51.0, 'hit');
    tl.from(q(s, '.sub'), { y: 30, opacity: 0, duration: .5 }, 51.6);
    tl.from(qa(s, '.pill'), { scale: 0, opacity: 0, duration: .45, stagger: .12, ease: 'back.out(2.5)' }, 51.9);
    tl.from(q(s, '.support'), { y: 60, opacity: 0, duration: .6, ease: 'power3.out' }, 52.4);
    sfx(52.4, 'pop');
    tl.from(q(s, '.hint'), { opacity: 0, y: 20, duration: .5 }, 52.9);
    tl.to(q(s, '.support'), { scale: 1.05, duration: .45, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 53.4);
    tl.to({}, { duration: .01 }, DUR - .01);
  }
  window.__dur = DUR;
  window.__sfx = SFX.sort((a, b) => a.t - b.t);
}

window.seek = t => { tl.seek(t, false); };
Promise.all([document.fonts.ready, ...[...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))])
  .then(() => { build(); tl.seek(0); window.__ready = true; });
