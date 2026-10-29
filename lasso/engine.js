// Rule-based prompt enhancer. No network, no model: it detects the kind of task,
// keeps the user's own words, and wraps them in a proven structure (role, context,
// steps, output format, constraints). Works for Arabic and English input.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LassoEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TYPES = {
    general: {
      kw: null,
      role: { en: 'a senior expert in the subject of this request who explains clearly and gets to the point', ar: 'خبير متمرّس في موضوع هذا الطلب، يشرح بوضوح ويدخل في صلب الموضوع' },
      steps: {
        en: ['Restate the goal in one sentence so we are aligned.', 'Work through the problem step by step before answering.', 'Give the answer first, then the reasoning behind it.', 'Point out any assumption you had to make.'],
        ar: ['أعد صياغة الهدف في جملة واحدة للتأكد أننا متفقان.', 'فكّر في المشكلة خطوة بخطوة قبل أن تجيب.', 'ابدأ بالإجابة ثم اشرح المنطق وراءها.', 'اذكر أي افتراض اضطررت إليه.']
      },
      format: { en: 'A short direct answer first, followed by organized sections with headings or bullet points.', ar: 'إجابة مباشرة قصيرة أولاً، ثم أقسام منظمة بعناوين أو نقاط.' },
      rules: { en: ['Be specific; avoid filler and generic advice.', 'If something is uncertain, say so instead of guessing.'], ar: ['كن محدداً وتجنب الحشو والنصائح العامة.', 'إن كان هناك شك فاذكره بدل التخمين.'] }
    },
    writing: {
      kw: /\b(write|draft|rewrite|article|blog|post|story|essay|caption|script|speech|headline|copy)\b|اكتب|كتابة|صياغة|صغ|مقال|منشور|قصة|نص|سكريبت|خطاب|عنوان|أعد كتابة/i,
      role: { en: 'an award-winning editor and writer with a sharp ear for tone and structure', ar: 'محرّر وكاتب محترف يتمتع بحسّ دقيق بالنبرة والبنية' },
      steps: {
        en: ['Identify the reader and the single idea they should remember.', 'Draft with a strong opening line and a clear flow.', 'Cut filler words, clichés and repetition.', 'Finish with a clear ending or call to action.'],
        ar: ['حدّد القارئ والفكرة الوحيدة التي يجب أن يتذكرها.', 'اكتب بجملة افتتاحية قوية وتسلسل واضح.', 'احذف الحشو والعبارات المستهلكة والتكرار.', 'اختم بخاتمة واضحة أو دعوة لاتخاذ إجراء.']
      },
      format: { en: 'The finished text, ready to use, with a suggested title. Add two alternative openings at the end.', ar: 'النص النهائي جاهزاً للاستخدام مع عنوان مقترح، ثم افتتاحيتان بديلتان في النهاية.' },
      rules: { en: ['Write in natural human language, not corporate jargon.', 'Keep sentences short and varied.'], ar: ['اكتب بلغة بشرية طبيعية لا بلغة الشركات المتكلفة.', 'اجعل الجمل قصيرة ومتنوعة.'] }
    },
    email: {
      kw: /\b(email|e-mail|reply|follow[- ]?up|cover letter|message|outreach)\b|إيميل|ايميل|بريد|رسالة|رد على|متابعة|خطاب تقديم/i,
      role: { en: 'an executive communications coach who writes clear, confident and polite messages', ar: 'مدرّب تواصل مهني يكتب رسائل واضحة وواثقة ومهذبة' },
      steps: {
        en: ['State the purpose in the first two lines.', 'Give only the context the reader needs to act.', 'End with one clear request and a deadline if relevant.'],
        ar: ['اذكر الغرض في أول سطرين.', 'قدّم فقط السياق الذي يحتاجه القارئ ليتصرف.', 'اختم بطلب واحد واضح وموعد نهائي إن لزم.']
      },
      format: { en: 'A subject line, then the email body (under 150 words), then one shorter alternative version.', ar: 'سطر موضوع، ثم نص الرسالة (أقل من 150 كلمة)، ثم نسخة بديلة أقصر.' },
      rules: { en: ['Warm but professional tone.', 'No clichés such as "I hope this email finds you well".'], ar: ['نبرة ودودة ومهنية.', 'تجنب العبارات المكررة والمملة.'] }
    },
    coding: {
      kw: /\b(code|function|bug|error|debug|api|sql|python|javascript|typescript|react|node|regex|script|refactor|unit test|class|query|css|html)\b|كود|برمجة|دالة|خطأ برمجي|استعلام|كلاس|اختبار وحدة|بايثون|جافاسكربت/i,
      role: { en: 'a principal software engineer who writes clean, tested and maintainable code', ar: 'مهندس برمجيات رئيسي يكتب شيفرة نظيفة ومختبرة وسهلة الصيانة' },
      steps: {
        en: ['Clarify the requirement and list edge cases first.', 'Propose the simplest approach that works, and say why.', 'Write the code with clear names and brief comments where needed.', 'Explain how to run and test it.'],
        ar: ['وضّح المتطلب واذكر الحالات الحدّية أولاً.', 'اقترح أبسط حل يعمل واشرح السبب.', 'اكتب الكود بأسماء واضحة وتعليقات موجزة عند الحاجة.', 'اشرح كيفية تشغيله واختباره.']
      },
      format: { en: 'Code in a fenced block with the language tag, followed by a short explanation and example usage.', ar: 'الكود داخل كتلة برمجية مع تحديد اللغة، يليه شرح موجز ومثال استخدام.' },
      rules: { en: ['State the language and version you assume.', 'Do not invent APIs or libraries; say when unsure.'], ar: ['اذكر اللغة والإصدار الذي تفترضه.', 'لا تخترع واجهات أو مكتبات؛ قل إن لم تكن متأكداً.'] }
    },
    analysis: {
      kw: /\b(analy[sz]e|compare|evaluate|pros and cons|decision|swot|forecast|kpi|metrics|dataset|budget|trend|report)\b|حلل|تحليل|قارن|مقارنة|قيّم|تقييم|ميزانية|مؤشرات|بيانات|قرار|تقرير/i,
      role: { en: 'a pragmatic business analyst who turns messy information into clear decisions', ar: 'محلل أعمال عملي يحوّل المعلومات المبعثرة إلى قرارات واضحة' },
      steps: {
        en: ['List the facts you have and the facts you are missing.', 'Compare the options against explicit criteria.', 'Quantify wherever possible.', 'End with a recommendation and the main risk.'],
        ar: ['اذكر الحقائق المتوفرة وتلك الناقصة.', 'قارن الخيارات وفق معايير صريحة.', 'استخدم الأرقام حيثما أمكن.', 'اختم بتوصية وأهم مخاطرها.']
      },
      format: { en: 'A summary of 3 lines, a comparison table, then a clear recommendation with next steps.', ar: 'ملخص من 3 أسطر، جدول مقارنة، ثم توصية واضحة وخطوات تالية.' },
      rules: { en: ['Separate facts from opinions.', 'Flag the numbers you are unsure about.'], ar: ['افصل بين الحقائق والآراء.', 'نبّه إلى الأرقام غير المؤكدة.'] }
    },
    research: {
      kw: /\b(research|explain|what is|how does|why|learn|teach|summari[sz]e|overview|history of|guide)\b|ابحث|بحث|اشرح|ما هو|ما هي|كيف|لماذا|لخص|تلخيص|نبذة|تعلم|علمني|دليل/i,
      role: { en: 'a patient expert teacher and researcher who makes complex topics easy to grasp', ar: 'معلّم وباحث خبير صبور يجعل الموضوعات المعقدة سهلة الفهم' },
      steps: {
        en: ['Start with a one-paragraph plain-language overview.', 'Break the topic into its key parts, simplest first.', 'Use a concrete example or analogy for each hard idea.', 'Finish with common misconceptions and what to learn next.'],
        ar: ['ابدأ بنظرة عامة في فقرة واحدة بلغة بسيطة.', 'قسّم الموضوع إلى أجزائه الرئيسية من الأبسط للأعقد.', 'استخدم مثالاً أو تشبيهاً ملموساً لكل فكرة صعبة.', 'اختم بالمفاهيم الخاطئة الشائعة وما يُنصح بتعلمه بعد ذلك.']
      },
      format: { en: 'Headed sections with short paragraphs, a quick-summary list at the top, and a "go deeper" list at the end.', ar: 'أقسام بعناوين وفقرات قصيرة، وقائمة ملخص سريع في الأعلى، وقائمة «للتعمق أكثر» في النهاية.' },
      rules: { en: ['Do not fabricate sources or statistics; say when something is uncertain.', 'Define jargon the first time it appears.'], ar: ['لا تختلق مصادر أو إحصاءات؛ وانبّه عند عدم التأكد.', 'عرّف المصطلحات المتخصصة عند أول ظهور.'] }
    },
    marketing: {
      kw: /\b(marketing|ad|ads|campaign|seo|brand|landing page|slogan|social media|linkedin|instagram|tiktok|newsletter|audience|content calendar|sales)\b|تسويق|إعلان|حملة|علامة تجارية|صفحة هبوط|شعار|سوشال|انستقرام|تيك توك|مبيعات|محتوى/i,
      role: { en: 'a veteran growth marketer and conversion copywriter', ar: 'مسوّق نمو متمرّس وكاتب محتوى تسويقي يركز على التحويل' },
      steps: {
        en: ['Define the audience, their pain point and the promised outcome.', 'Lead with the benefit, not the feature.', 'Offer 3 distinct angles to test.', 'Close with one specific call to action.'],
        ar: ['حدّد الجمهور ومشكلته والنتيجة الموعودة.', 'ابدأ بالفائدة لا بالميزة.', 'قدّم 3 زوايا مختلفة للاختبار.', 'اختم بدعوة واحدة محددة لاتخاذ إجراء.']
      },
      format: { en: 'Three variations labelled A, B and C, each with a headline, body and call to action, plus a one-line rationale.', ar: 'ثلاث نسخ A وB وC، لكل منها عنوان ونص ودعوة لاتخاذ إجراء، مع سطر يشرح الفكرة.' },
      rules: { en: ['No unverifiable claims or fake testimonials.', 'Match the brand voice I describe below.'], ar: ['لا ادعاءات غير قابلة للإثبات ولا شهادات مختلقة.', 'التزم بنبرة العلامة التي أصفها أدناه.'] }
    },
    image: {
      kw: /\b(image|picture|photo|logo|illustration|midjourney|dall-?e|render|poster|portrait|wallpaper)\b|صورة|صوره|شعار|رسم|ملصق|بوستر|بورتريه|ميدجورني/i,
      role: { en: 'an art director who writes precise prompts for AI image generators', ar: 'مدير فني يكتب أوامر دقيقة لمولدات الصور بالذكاء الاصطناعي' },
      steps: {
        en: ['Describe the main subject and what it is doing.', 'Add setting, time of day and mood.', 'Specify style, medium, camera or lens and lighting.', 'Add colour palette and composition.'],
        ar: ['صف الموضوع الرئيسي وما يفعله.', 'أضف المكان ووقت اليوم والمزاج العام.', 'حدّد الأسلوب والخامة والكاميرا أو العدسة والإضاءة.', 'أضف لوحة الألوان وتكوين الكادر.']
      },
      format: { en: 'One detailed prompt paragraph in English, then a short negative-prompt list, then two alternative variations.', ar: 'فقرة أمر واحدة مفصلة بالإنجليزية، ثم قائمة قصيرة بما يجب تجنبه، ثم نسختان بديلتان.' },
      rules: { en: ['Avoid text inside the image unless requested.', 'Avoid real people and copyrighted characters.'], ar: ['تجنب النصوص داخل الصورة ما لم تُطلب.', 'تجنب الأشخاص الحقيقيين والشخصيات المحمية بحقوق النشر.'] }
    }
  };

  const LABELS = {
    en: { role: 'Role', task: 'Task', context: 'Context', steps: 'How to approach it', format: 'Output format', rules: 'Constraints', youAre: 'You are', ask: 'Before you answer, ask me up to 3 clarifying questions if any key detail is missing. Otherwise, go ahead.', ctx: ['Audience: [who will read or use this]', 'Goal: [what a great result achieves]', 'Background: [key facts, data or links]'], tone: 'Tone' },
    ar: { role: 'الدور', task: 'المهمة', context: 'السياق', steps: 'طريقة التنفيذ', format: 'شكل المخرجات', rules: 'القيود', youAre: 'أنت', ask: 'قبل أن تجيب، اسألني حتى 3 أسئلة توضيحية إن كانت هناك تفاصيل أساسية ناقصة. وإلا فابدأ مباشرة.', ctx: ['الجمهور: [من سيقرأ هذا أو يستخدمه]', 'الهدف: [ما الذي تحققه نتيجة ممتازة]', 'الخلفية: [حقائق أو بيانات أو روابط مهمة]'], tone: 'النبرة' }
  };

  const TAGS = { role: 'role', task: 'task', context: 'context', steps: 'instructions', format: 'output_format', rules: 'constraints' };

  const RE = {
    role: /\b(you are|act as|as an? )\b|أنت |تصرف ك|بصفتك/i,
    context: /\b(context|background|audience|goal|target)\b|السياق|الخلفية|الجمهور|الهدف|موجه ل/i,
    steps: /^\s*(?:\d+[.)]|[-*•])\s/m,
    format: /\b(format|table|bullets?|json|markdown|outline|words|paragraphs?|list)\b|جدول|نقاط|تنسيق|صيغة|كلمة|فقرات|قائمة/i,
    rules: /\b(avoid|don't|do not|must|never|only|limit|constraints?|no more than|at most)\b|تجنب|لا تستخدم|يجب|ممنوع|فقط|بحد أقصى|قيود/i,
    clarify: /clarifying questions|ask me|أسئلة توضيحية|اسألني/i
  };

  function detectLang(text) {
    const ar = (text.match(/[؀-ۿ]/g) || []).length;
    const lat = (text.match(/[A-Za-z]/g) || []).length;
    return ar > lat ? 'ar' : 'en';
  }

  function detectType(text) {
    let best = 'general', bestHits = 0;
    for (const id of Object.keys(TYPES)) {
      const re = TYPES[id].kw;
      if (!re) continue;
      const g = new RegExp(re.source, 'gi');
      const hits = (text.match(g) || []).length;
      if (hits > bestHits) { best = id; bestHits = hits; }
    }
    return best;
  }

  function words(text) {
    const m = text.trim().match(/[\w؀-ۿ]+/g);
    return m ? m.length : 0;
  }

  // 0-100. Counts the traits that make a prompt reliable, not its length alone.
  function score(text) {
    if (!text || !text.trim()) return 0;
    let s = Math.min(20, Math.round(words(text) / 2));
    if (RE.role.test(text)) s += 15;
    if (RE.context.test(text)) s += 15;
    if (RE.steps.test(text)) s += 15;
    if (RE.format.test(text)) s += 15;
    if (RE.rules.test(text)) s += 10;
    if (RE.clarify.test(text)) s += 10;
    return Math.min(100, s);
  }

  function cleanTask(text) {
    let t = text.replace(/\s+/g, ' ').trim().replace(/(?:\.{2,}|…)+\s*$/, '').trim();
    if (!t) return t;
    t = t.charAt(0).toUpperCase() + t.slice(1);
    if (!/[.!?؟]$/.test(t)) t += '.';
    return t;
  }

  function section(key, body, style, lang) {
    const label = LABELS[lang][key];
    if (style === 'xml') return '<' + TAGS[key] + '>\n' + body + '\n</' + TAGS[key] + '>';
    return '## ' + label + '\n' + body;
  }

  const bullets = (a) => a.map((x) => '- ' + x).join('\n');
  const numbered = (a) => a.map((x, i) => (i + 1) + '. ' + x).join('\n');

  // style: 'md' (ChatGPT, Gemini, others) or 'xml' (Claude likes tagged sections)
  function enhance(text, opts) {
    opts = opts || {};
    const input = (text || '').trim();
    if (!input) return null;
    const lang = opts.lang || detectLang(input);
    const type = opts.type && opts.type !== 'auto' && TYPES[opts.type] ? opts.type : detectType(input);
    const style = opts.model === 'claude' ? 'xml' : 'md';
    const T = TYPES[type];
    const L = LABELS[lang];
    const parts = [];
    const changes = [];

    if (!RE.role.test(input)) {
      parts.push(section('role', L.youAre + ' ' + T.role[lang] + '.', style, lang));
      changes.push('role');
    }
    parts.push(section('task', cleanTask(input), style, lang));
    if (!RE.context.test(input)) {
      parts.push(section('context', bullets(L.ctx), style, lang));
      changes.push('context');
    }
    parts.push(section('steps', numbered(T.steps[lang]), style, lang));
    changes.push('steps');
    if (!RE.format.test(input)) {
      parts.push(section('format', T.format[lang], style, lang));
      changes.push('format');
    }
    if (!RE.rules.test(input)) {
      parts.push(section('rules', bullets(T.rules[lang]), style, lang));
      changes.push('rules');
    }
    parts.push(L.ask);
    changes.push('clarify');

    const prompt = parts.join('\n\n');
    return { prompt, lang, type, style, changes, before: score(input), after: score(prompt) };
  }

  // Template mode: the user fills the fields, we assemble them in order.
  function fromTemplate(f, opts) {
    opts = opts || {};
    const task = (f.task || '').trim();
    if (!task) return null;
    const lang = opts.lang || detectLang(task);
    const style = opts.model === 'claude' ? 'xml' : 'md';
    const L = LABELS[lang];
    const clean = (v) => (v || '').trim();
    const parts = [];
    if (clean(f.role)) parts.push(section('role', L.youAre + ' ' + clean(f.role).replace(/[.]+$/, '') + '.', style, lang));
    parts.push(section('task', cleanTask(task), style, lang));
    const ctx = [];
    if (clean(f.audience)) ctx.push((lang === 'ar' ? 'الجمهور: ' : 'Audience: ') + clean(f.audience));
    if (clean(f.context)) ctx.push(clean(f.context));
    if (clean(f.tone)) ctx.push(L.tone + ': ' + clean(f.tone));
    if (ctx.length) parts.push(section('context', bullets(ctx), style, lang));
    if (clean(f.format)) parts.push(section('format', clean(f.format), style, lang));
    if (clean(f.rules)) parts.push(section('rules', clean(f.rules).split(/\n+/).map((x) => x.replace(/^[-*•]\s*/, '')).filter(Boolean).map((x) => '- ' + x).join('\n'), style, lang));
    parts.push(L.ask);
    const prompt = parts.join('\n\n');
    return { prompt, lang, type: 'template', style, changes: ['clarify'], before: score(task), after: score(prompt) };
  }

  return { enhance, fromTemplate, score, detectLang, detectType, TYPES: Object.keys(TYPES) };
});
