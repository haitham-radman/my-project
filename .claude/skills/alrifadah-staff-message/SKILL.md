---
name: alrifadah-staff-message
description: Draft a message from HR to Al-Rifadah staff in Modern Standard Arabic - announcements, reminders, requests. Use when the user asks to write, reply to or prepare a message, email or notice for an employee or group, sent by email or chat. For a formal letter, policy or form kept on file use alrifadah-hr-document. To answer a question an employee sent, use alrifadah-employee-reply. For job candidates use alrifadah-recruiting-message. Produces a draft only; never sends it.
---

# Al-Rifadah staff message

One job: a clear draft the user can send themselves.

## My rules (fixed, from the user)
- Facts come from `.claude/alrifadah-facts.local.md` (see alrifadah-facts). Read it first; use only what it says; anything missing stays `[ناقص]`.
- Full company name: شركة الرفادة لخدمات الحجاج (as written on the logo). Use it in documents, signatures and the first on-screen mention; the short form الرفادة is fine in spoken lines and warm messages.
- Modern Standard Arabic. Respectful and clear. Tone: ask the user "رسمي أم ودّي؟" if not stated; the user's default is formal for documents and warm for videos, not yet set for messages.
- Short: one purpose per message, the action and the date first.
- Never invent a date, amount, policy or name. Use `[ناقص: ...]` and list it.
- Never send, post or schedule. Do not use email or chat tools to send. A draft may be saved only if the user asks.
- Private matters (pay, discipline, health): remind the user to check who receives it.

## Steps
1. Ask: who receives it, what they must do, by when, what tone.
2. Write: greeting, purpose in one sentence, details, action and date, thanks, signature `[اسم، المسمى]`.
3. List missing facts.
4. Run the arabic-proofread skill on the draft. Then show it. Ask: "تحب أعدّل شيء؟" Stop.

## Good example 1
"السلام عليكم ورحمة الله وبركاته، نذكّركم بتسليم نموذج الإجازة قبل [ناقص: التاريخ]. شاكرين تعاونكم."
Why good: purpose, action, date placeholder, polite and short.

## Good example 2
Reply to a leave question: answers the question first, then the next step, no policy guessed.
Why good: nothing invented.

## Bad example
A long message that mixes a holiday notice, a warning and a policy change, and says "تم الإرسال".
Why bad: three purposes, and it claims to have sent.
