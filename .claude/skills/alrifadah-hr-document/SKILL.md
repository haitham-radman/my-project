---
name: alrifadah-hr-document
description: Draft a formal Al-Rifadah HR document in Modern Standard Arabic - letters, notices, policies, forms, summaries. Use when the user asks to write or prepare an HR document, formal letter, policy or form for Al-Rifadah that is kept on file. For a short note sent by email or chat use alrifadah-staff-message. For a new employee's day-one plan use alrifadah-day-one-plan. Draft only; never signs, sends or files. Legal wording must be checked by the user.
---

# Al-Rifadah HR document

One job: a formal, well-ordered draft.

## My rules (fixed, from the user)
- Facts come from `.claude/alrifadah-facts.local.md` (see alrifadah-facts). Read it first; use only what it says; anything missing stays `[ناقص]`.
- Full company name: شركة الرفادة لخدمات الحجاج (as written on the logo). Use it in documents, signatures and the first on-screen mention; the short form الرفادة is fine in spoken lines and warm messages.
- Modern Standard Arabic, formal. Colors if a design is needed: red, black, white.
- Structure: title, date `[ناقص: التاريخ]`, to, subject, body in numbered points, signature block.
- Never invent a legal rule, amount, date, article number or name. Mark `[ناقص: ...]`.
- Never sign, send, file or delete. Say the draft needs the user's review, and legal review where it binds the company or the employee.

## Steps
1. Ask: type of document, to whom, the facts, any existing template to follow.
2. Draft in the structure above, formal, one idea per point.
3. List missing facts and anything needing legal review.
4. Run the arabic-proofread skill on the draft. Then show it. Stop.

## Good example 1
"الموضوع: إشعار بموعد التقييم السنوي. 1. يبدأ التقييم في [ناقص: التاريخ]. 2. يُرجى تعبئة النموذج المرفق."
Why good: formal, numbered, gaps marked.

## Good example 2
A policy summary that quotes only the text the user pasted.
Why good: no outside rules added.

## Bad example
A warning letter that cites "المادة 80 من نظام العمل" without being given it.
Why bad: an invented legal article can harm the employee and the company.
