---
name: alrifadah-exit-checklist
description: Make an exit and handover checklist for an Al-Rifadah employee who is leaving, in formal Modern Standard Arabic - items to return, access to close, handover tasks, HR paperwork, exit conversation - built from the company's own list and what the user says about this case. Use when an employee resigns, ends a contract or transfers, and the user asks for an exit, offboarding or handover checklist, "قائمة إنهاء الخدمة / تسليم". Draft only; closes no access and sends nothing.
---

# Al-Rifadah exit checklist

One job: a complete, ordered checklist for one departing employee, for HR to work through.

## My rules (fixed, from the user)
- Formal Modern Standard Arabic. Header: شركة الرفادة لخدمات الحجاج, "قائمة إنهاء الخدمة والتسليم", employee name and title, last working day, manager.
- Items come from the company's own list: `.claude/alrifadah-facts.local.md` or what the user gives in this chat. If no company list exists, ask for it. Do not fill the list from general knowledge. The categories below are questions to ask, not facts.
- Never state amounts, notice periods, end-of-service entitlements or legal duties. Those are `[ناقص: ...]` and need the user's, and legal or finance, confirmation.
- Never ask for or write the reason for leaving unless the user gives it. Never write anything about discipline, health or disputes in the checklist; a person decides those.
- The employee's details are used for this checklist only; do not save them to a file in the repo or git.
- The checklist closes no accounts, revokes no access, sends no email and creates no tasks. HR does these steps. Each item has an owner (role) and a done box for HR to fill.

## Steps
1. Ask for: employee name, title, last working day, manager, and the company's exit list (or where it is). Ask nothing the facts sheet already holds.
2. Ask by category what applies at Al-Rifadah: items to return; accounts and access to close; work to hand over and to whom; HR paperwork and certificates; final-pay steps (steps only, no figures); exit conversation.
3. Build the table: # | item | owner (role) | due | done. Order by date: before the last day, on the last day, after.
4. Gaps list: items without owner or due date, and anything needing legal or finance confirmation.
5. Run the arabic-proofread skill.
6. Show the checklist and gaps. Stop.

## Good example 1
Row: `3 | إعادة بطاقة الدخول | الموارد البشرية | آخر يوم عمل | ☐`, from the company's list.
Why good: item from the user's list, owner and due date present.

## Good example 2
"فترة الإشعار: [ناقص: المدة من العقد]. تؤكدها الإدارة القانونية قبل الاعتماد."
Why good: no invented duration, asks for confirmation.

## Bad example
Adding "مكافأة نهاية الخدمة 3 رواتب" and "إغلاق حساب البريد فوراً" as done, with a note "استقالة بسبب خلاف مع المدير".
Why bad: an invented entitlement, an action claimed done, and a reason nobody gave.
