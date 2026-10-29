// Discover library. Each item: title, description, starter prompt, as [en, ar].
(function () {
  const I = (t, ta, d, da, p, pa) => ({ t: [t, ta], d: [d, da], p: [p, pa] });

  window.LASSO_ROLES = [
    {
      id: 'general', n: ['General', 'عام'],
      cats: [
        { n: ['Career', 'المسار المهني'], items: [
          I('Tailor a cover letter', 'تخصيص خطاب التقديم', 'Customized to the job posting and your experience', 'مصمم حسب إعلان الوظيفة وخبرتك',
            'Write a cover letter for the [job title] role at [company], based on my experience in [field].',
            'اكتب لي خطاب تقديم لوظيفة [المسمى الوظيفي] في شركة [الشركة] بناءً على خبرتي في [المجال].'),
          I('Sharpen resume bullets', 'تحسين نقاط السيرة الذاتية', 'Rewrite experience points to match a target role', 'أعد صياغة خبراتك لتناسب وظيفة مستهدفة',
            'Rewrite these resume bullets so they fit a [target role] position and show measurable results: [paste bullets]',
            'أعد كتابة نقاط سيرتي الذاتية التالية لتناسب وظيفة [الوظيفة المستهدفة] وتُظهر نتائج قابلة للقياس: [الصق النقاط]'),
          I('Prepare for an interview', 'التحضير لمقابلة عمل', 'Anticipate questions, plan your answers', 'توقع الأسئلة وخطط لإجاباتك',
            'Help me prepare for an interview for [job title] at [company]. Give likely questions and how I should answer.',
            'ساعدني في التحضير لمقابلة وظيفة [المسمى الوظيفي] في [الشركة]. أعطني الأسئلة المتوقعة وكيف أجيب عنها.'),
          I('Nail behavioural questions', 'إتقان الأسئلة السلوكية', 'STAR-format answers drawn from your real experience', 'إجابات بصيغة STAR من تجربتك الحقيقية',
            'Turn this experience into a STAR-format answer to "Tell me about a time you led under pressure": [describe experience]',
            'حوّل هذه التجربة إلى إجابة بصيغة STAR عن سؤال «حدثني عن موقف قدت فيه الفريق تحت الضغط»: [صف التجربة]')
        ] },
        { n: ['Writing & Emails', 'الكتابة والبريد'], items: [
          I('Draft a professional email', 'كتابة بريد مهني', 'A clear, confident email for any situation', 'رسالة واضحة وواثقة لأي موقف',
            'Write an email to [recipient] about [topic]. I want them to [desired action].',
            'اكتب رسالة بريد إلى [المستلم] بخصوص [الموضوع]. أريده أن [الإجراء المطلوب].'),
          I('Polish an email draft', 'تلميع مسودة بريد', 'Rewrite for clarity, tone and professionalism', 'إعادة صياغة للوضوح والنبرة والاحترافية',
            'Polish this email so it is clearer and more professional without changing the meaning: [paste draft]',
            'حسّن هذه الرسالة لتكون أوضح وأكثر احترافية دون تغيير المعنى: [الصق المسودة]'),
          I('Push back professionally', 'الرفض بلباقة', 'Disagree or decline without burning bridges', 'اعترض أو اعتذر دون خسارة العلاقة',
            'Help me politely decline [request] from [person] while keeping the relationship strong.',
            'ساعدني في رفض [الطلب] من [الشخص] بلباقة مع الحفاظ على العلاقة.'),
          I('Follow up on no response', 'متابعة بلا رد', 'Polite nudges that actually get replies', 'تذكير مهذب يحصل على رد فعلاً',
            'Write a follow-up email to [person] who has not replied to my message about [topic] sent [N] days ago.',
            'اكتب رسالة متابعة إلى [الشخص] الذي لم يرد على رسالتي بخصوص [الموضوع] المرسلة قبل [عدد] أيام.')
        ] },
        { n: ['Planning & Decisions', 'التخطيط والقرارات'], items: [
          I('Build a meeting agenda', 'إعداد جدول اجتماع', 'Structured agendas that drive decisions', 'جداول منظمة تقود إلى قرارات',
            'Create an agenda for a [duration] meeting about [topic] with [attendees]. The goal is to decide [decision].',
            'أنشئ جدول أعمال لاجتماع مدته [المدة] حول [الموضوع] مع [الحضور]. الهدف هو اتخاذ قرار بشأن [القرار].'),
          I('Negotiate a raise', 'التفاوض على زيادة الراتب', 'Talking points, timing and framing', 'نقاط الحديث والتوقيت وطريقة العرض',
            'Help me prepare to negotiate a raise. My role is [role], I have been here [years], and my main achievements are [achievements].',
            'ساعدني في التحضير للتفاوض على زيادة الراتب. وظيفتي [الوظيفة]، ولي [عدد] سنوات هنا، وأهم إنجازاتي [الإنجازات].'),
          I('Compare options', 'مقارنة الخيارات', 'Side-by-side analysis with a clear recommendation', 'تحليل متجاور مع توصية واضحة',
            'Compare [option A] and [option B] for [my situation] and recommend one.',
            'قارن بين [الخيار أ] و[الخيار ب] لحالتي [وصف الحالة] ورشّح واحداً منهما.')
        ] },
        { n: ['Research & Summaries', 'البحث والتلخيص'], items: [
          I('Research any topic', 'البحث في أي موضوع', 'A comprehensive briefing on any subject', 'ملخص شامل عن أي موضوع',
            'Give me a clear briefing on [topic] so I can understand it quickly.',
            'أعطني ملخصاً واضحاً عن [الموضوع] لأفهمه بسرعة.'),
          I('Summarize a document', 'تلخيص مستند', 'Key points from any long document, fast', 'أهم النقاط من أي مستند طويل بسرعة',
            'Summarize the following document and list the decisions and action items: [paste text]',
            'لخّص المستند التالي واذكر القرارات والمهام المطلوبة: [الصق النص]'),
          I('Explain something technical', 'شرح موضوع تقني', 'Make complex topics accessible for any audience', 'اجعل الموضوعات المعقدة مفهومة لأي جمهور',
            'Explain [technical concept] to someone with no background in it, using an everyday analogy.',
            'اشرح [المفهوم التقني] لشخص لا يملك خلفية عنه باستخدام تشبيه من الحياة اليومية.')
        ] }
      ]
    },
    {
      id: 'sales', n: ['Sales', 'المبيعات'],
      cats: [{ n: ['Selling', 'البيع'], items: [
        I('Cold outreach email', 'رسالة تواصل أولى', 'A short first message that earns a reply', 'رسالة قصيرة أولى تستحق الرد',
          'Write a cold outreach email to a [job title] at a [industry] company selling [product].',
          'اكتب رسالة تواصل أولى إلى [المسمى الوظيفي] في شركة [المجال] لبيع [المنتج].'),
        I('Discovery call questions', 'أسئلة مكالمة الاستكشاف', 'Questions that uncover real needs', 'أسئلة تكشف الاحتياج الحقيقي',
          'List discovery questions for a first call with a prospect who might need [product].',
          'اكتب أسئلة استكشاف لمكالمة أولى مع عميل محتمل قد يحتاج [المنتج].'),
        I('Handle a price objection', 'الرد على اعتراض السعر', 'Respond without discounting too early', 'الرد دون التخفيض مبكراً',
          'A prospect says "your price is too high" for [product]. Give me responses that reframe the value.',
          'قال عميل محتمل «سعركم مرتفع» بخصوص [المنتج]. أعطني ردوداً تعيد صياغة القيمة.')
      ] }]
    },
    {
      id: 'marketing', n: ['Marketing', 'التسويق'],
      cats: [{ n: ['Campaigns', 'الحملات'], items: [
        I('Plan a content calendar', 'خطة تقويم محتوى', 'A month of posts with themes and formats', 'شهر من المنشورات بمحاور وأشكال متنوعة',
          'Create a 4-week social media content calendar for [brand] aimed at [audience].',
          'أنشئ تقويم محتوى لوسائل التواصل لمدة 4 أسابيع لعلامة [العلامة] موجّه إلى [الجمهور].'),
        I('Write ad copy variants', 'نصوص إعلانية بديلة', 'Three angles to A/B test', 'ثلاث زوايا للاختبار',
          'Write ad copy for [product] targeting [audience] on [platform].',
          'اكتب نصاً إعلانياً لـ[المنتج] موجهاً إلى [الجمهور] على منصة [المنصة].'),
        I('Outline an SEO blog post', 'هيكل مقال SEO', 'Headings, keywords and search intent', 'عناوين وكلمات مفتاحية ونية البحث',
          'Outline a blog post that can rank for "[keyword]" for readers who want to [goal].',
          'ضع هيكلاً لمقال يمكنه الظهور في نتائج البحث لعبارة «[الكلمة المفتاحية]» لقراء يريدون [الهدف].')
      ] }]
    },
    {
      id: 'product', n: ['Product', 'إدارة المنتج'],
      cats: [{ n: ['Product work', 'عمل المنتج'], items: [
        I('Write a PRD', 'كتابة وثيقة متطلبات', 'Problem, users, scope and success metrics', 'المشكلة والمستخدمون والنطاق ومقاييس النجاح',
          'Write a product requirements document for [feature] that solves [problem] for [users].',
          'اكتب وثيقة متطلبات منتج لميزة [الميزة] تحل [المشكلة] لـ[المستخدمين].'),
        I('Draft user stories', 'صياغة قصص المستخدم', 'With acceptance criteria', 'مع معايير القبول',
          'Turn this feature idea into user stories with acceptance criteria: [feature idea]',
          'حوّل فكرة الميزة هذه إلى قصص مستخدم مع معايير قبول: [فكرة الميزة]'),
        I('Prioritize a backlog', 'ترتيب أولويات المهام', 'Score ideas with RICE and justify', 'قيّم الأفكار بمنهج RICE وبرّر',
          'Prioritize this backlog using RICE and explain the ranking: [list items]',
          'رتّب هذه المهام حسب أولويتها بمنهج RICE واشرح الترتيب: [اذكر المهام]')
      ] }]
    },
    {
      id: 'engineering', n: ['Engineering', 'الهندسة'],
      cats: [{ n: ['Code', 'الكود'], items: [
        I('Review my code', 'مراجعة الكود', 'Bugs, readability and edge cases', 'الأخطاء وسهولة القراءة والحالات الحدّية',
          'Review this [language] code for bugs, performance and readability: [paste code]',
          'راجع هذا الكود بلغة [اللغة] بحثاً عن الأخطاء والأداء وسهولة القراءة: [الصق الكود]'),
        I('Debug an error', 'تتبّع خطأ برمجي', 'Find the root cause, not just a patch', 'ابحث عن السبب الجذري لا الترقيع',
          'Help me debug this error in [language/framework]: [error message and code]',
          'ساعدني في تتبّع هذا الخطأ في [اللغة/الإطار]: [رسالة الخطأ والكود]'),
        I('Write unit tests', 'كتابة اختبارات وحدة', 'Cover happy path and edge cases', 'تغطية الحالة العادية والحالات الحدّية',
          'Write unit tests in [test framework] for this function: [paste function]',
          'اكتب اختبارات وحدة باستخدام [إطار الاختبار] لهذه الدالة: [الصق الدالة]')
      ] }]
    },
    {
      id: 'founder', n: ['Founder', 'ريادة الأعمال'],
      cats: [{ n: ['Building', 'التأسيس'], items: [
        I('Write a business plan', 'خطة عمل', 'A lean plan you can act on', 'خطة رشيقة قابلة للتنفيذ',
          'Help me write a business plan for my new startup: [one-line idea].',
          'ساعدني في كتابة خطة عمل لشركتي الناشئة الجديدة: [الفكرة في جملة].'),
        I('Craft an investor pitch', 'عرض للمستثمرين', 'Story, traction and the ask', 'القصة والإنجازات والطلب',
          'Outline a 10-slide investor pitch for [startup] in [industry].',
          'ضع هيكل عرض من 10 شرائح للمستثمرين لشركة [الشركة] في مجال [المجال].'),
        I('Analyze competitors', 'تحليل المنافسين', 'Positioning gaps you can exploit', 'فجوات التموضع التي يمكنك استغلالها',
          'Analyze the main competitors of [product] and find where we can differentiate.',
          'حلل أبرز منافسي [المنتج] واكتشف أين يمكننا التميّز.')
      ] }]
    },
    {
      id: 'operations', n: ['Operations', 'العمليات'],
      cats: [{ n: ['Process', 'الإجراءات'], items: [
        I('Write an SOP', 'كتابة إجراء تشغيل', 'Step-by-step, repeatable by anyone', 'خطوة بخطوة ويمكن لأي شخص تكراره',
          'Write a standard operating procedure for [process] that a new hire can follow.',
          'اكتب إجراء تشغيل قياسياً لـ[العملية] يستطيع موظف جديد اتباعه.'),
        I('Improve a process', 'تحسين عملية', 'Find the bottleneck and fix it', 'اكتشف عنق الزجاجة وعالجه',
          'Here is how we handle [process] today: [describe]. Find bottlenecks and suggest improvements.',
          'هكذا ننفذ [العملية] حالياً: [صف]. اكتشف الاختناقات واقترح تحسينات.'),
        I('Build a risk register', 'سجل مخاطر', 'Likelihood, impact and mitigation', 'الاحتمالية والأثر وخطة المعالجة',
          'Create a risk register for [project] with likelihood, impact and mitigation.',
          'أنشئ سجل مخاطر لمشروع [المشروع] يتضمن الاحتمالية والأثر وخطة المعالجة.')
      ] }]
    },
    {
      id: 'support', n: ['Customer Success', 'نجاح العملاء'],
      cats: [{ n: ['Support', 'الدعم'], items: [
        I('Reply to an angry customer', 'الرد على عميل غاضب', 'Calm, empathetic and solution-focused', 'هادئ ومتعاطف ويركز على الحل',
          'Write a reply to a customer upset about [issue]. Acknowledge, apologize if due, and offer a fix.',
          'اكتب رداً لعميل منزعج بسبب [المشكلة]. اعترف بالمشكلة واعتذر عند اللزوم وقدّم حلاً.'),
        I('Write a help-center article', 'مقال مركز مساعدة', 'Clear steps with troubleshooting', 'خطوات واضحة مع حل المشكلات',
          'Write a help-center article explaining how to [task] in [product].',
          'اكتب مقالاً لمركز المساعدة يشرح كيفية [المهمة] في [المنتج].'),
        I('Plan a renewal conversation', 'التحضير لتجديد عميل', 'Value recap and risks to address', 'ملخص القيمة والمخاطر',
          'Prepare talking points for a renewal call with [customer] who has used [product] for [time].',
          'جهّز نقاط حديث لمكالمة تجديد مع [العميل] الذي يستخدم [المنتج] منذ [المدة].')
      ] }]
    },
    {
      id: 'data', n: ['Data', 'البيانات'],
      cats: [{ n: ['Analytics', 'التحليل'], items: [
        I('Write a SQL query', 'كتابة استعلام SQL', 'From a plain-language question', 'من سؤال بلغة عادية',
          'Write a SQL query that answers: [question]. Tables: [table names and columns].',
          'اكتب استعلام SQL يجيب عن: [السؤال]. الجداول: [أسماء الجداول والأعمدة].'),
        I('Find insights in a dataset', 'استخراج رؤى من بيانات', 'Patterns, outliers and next questions', 'الأنماط والقيم الشاذة والأسئلة التالية',
          'Analyze this data and tell me the top insights and what to investigate next: [paste data]',
          'حلل هذه البيانات وأخبرني بأهم الرؤى وما يجب فحصه بعد ذلك: [الصق البيانات]'),
        I('Choose dashboard KPIs', 'اختيار مؤشرات اللوحة', 'Metrics that match the decision', 'مؤشرات تناسب القرار',
          'Suggest KPIs for a dashboard that helps [team] decide [decision].',
          'اقترح مؤشرات أداء للوحة بيانات تساعد [الفريق] على اتخاذ قرار [القرار].')
      ] }]
    },
    {
      id: 'finance', n: ['Finance', 'المالية'],
      cats: [{ n: ['Money', 'المال'], items: [
        I('Draft a budget', 'إعداد ميزانية', 'Categories, assumptions and buffers', 'البنود والافتراضات وهامش الأمان',
          'Draft a [period] budget for [team or project] with a total of [amount].',
          'أعدّ ميزانية [الفترة] لـ[الفريق أو المشروع] بإجمالي [المبلغ].'),
        I('Write an investor update', 'تحديث للمستثمرين', 'Highlights, numbers and asks', 'أبرز الأحداث والأرقام والطلبات',
          'Write a monthly investor update. Highlights: [list]. Metrics: [list]. Challenges: [list].',
          'اكتب تحديثاً شهرياً للمستثمرين. الإنجازات: [قائمة]. المؤشرات: [قائمة]. التحديات: [قائمة].'),
        I('Explain a variance', 'تفسير انحراف الأرقام', 'What changed and why', 'ما الذي تغير ولماذا',
          'Explain in plain language why [metric] changed from [A] to [B] and what we should do.',
          'اشرح بلغة بسيطة لماذا تغيّر [المؤشر] من [أ] إلى [ب] وماذا ينبغي أن نفعل.')
      ] }]
    },
    {
      id: 'legal', n: ['Legal', 'القانونية'],
      cats: [{ n: ['Documents', 'المستندات'], items: [
        I('Spot contract risks', 'كشف مخاطر العقد', 'Clauses to question before signing', 'بنود تستحق السؤال قبل التوقيع',
          'Review this contract and list clauses that carry risk for me as [party]: [paste text]',
          'راجع هذا العقد واذكر البنود التي تحمل مخاطر عليّ بصفتي [الطرف]: [الصق النص]'),
        I('Plain-language policy', 'سياسة بلغة بسيطة', 'Make dense policy readable', 'اجعل السياسات المعقدة مقروءة',
          'Rewrite this policy in plain language for employees: [paste policy]',
          'أعد كتابة هذه السياسة بلغة بسيطة للموظفين: [الصق السياسة]'),
        I('Summarize a legal document', 'تلخيص مستند قانوني', 'Obligations, dates and exceptions', 'الالتزامات والمواعيد والاستثناءات',
          'Summarize this legal document: obligations, deadlines and exceptions: [paste text]',
          'لخّص هذا المستند القانوني: الالتزامات والمواعيد والاستثناءات: [الصق النص]')
      ] }]
    },
    {
      id: 'hr', n: ['HR', 'الموارد البشرية'],
      cats: [{ n: ['People', 'الأفراد'], items: [
        I('Write a job description', 'كتابة وصف وظيفي', 'Inclusive, specific and honest', 'شامل ومحدد وصادق',
          'Write a job description for a [role] at a [company type] company.',
          'اكتب وصفاً وظيفياً لوظيفة [المسمى] في شركة [نوع الشركة].'),
        I('Create an interview scorecard', 'نموذج تقييم المقابلة', 'Consistent criteria for every candidate', 'معايير ثابتة لكل مرشح',
          'Create an interview scorecard for hiring a [role].',
          'أنشئ نموذج تقييم مقابلات لتوظيف [المسمى الوظيفي].'),
        I('Give constructive feedback', 'تقديم ملاحظات بنّاءة', 'Specific, kind and actionable', 'محددة ولطيفة وقابلة للتنفيذ',
          'Help me give feedback to a teammate about [behavior], using a specific example: [example]',
          'ساعدني في إعطاء ملاحظات لزميل بخصوص [السلوك] مع مثال محدد: [المثال]')
      ] }]
    }
  ];
})();
