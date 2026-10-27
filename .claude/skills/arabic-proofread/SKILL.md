---
name: arabic-proofread
description: Check Arabic text for the user's usual mistakes before they see it - wrong Arabic level (Saudi vs Modern Standard), spelling, hamza, tashkeel, mixed-up numbers, wrong order of lines, text direction. Use when the user pastes Arabic or a script, message or document made by Claude and asks to check, review, correct or "راجع النص". Does not translate and does not change the meaning.
---

# Arabic proofread

One job: find and fix language mistakes. Same meaning, same facts.

## My rules (fixed, from the user)
- Company name: full form شركة الرفادة لخدمات الحجاج in formal text; flag any other spelling.
- Video on-screen text, messages and documents: Modern Standard Arabic.
- Video spoken lines only: Saudi dialect, warm.
- Never add, remove or change a fact, number, name or date. If something looks wrong, ask.
- Show a before and after list. Do not silently rewrite.

## Steps
1. Ask what the text is for (video spoken, video screen, message, document) if not clear.
2. Check in this order: wrong level for its use, spelling and hamza, grammar, repeated words, numbers and dates in one style, line direction and punctuation.
3. Output a table: place | before | after | reason in plain words.
4. Give the corrected text once, below the table.

## Good example 1
Screen text "نرحب بكم في شركتنا الغالية يا شباب" in a video. Change to "أهلاً بكم في الرفاضة". Reason: screen text must be Modern Standard.

## Good example 2
Spoken line "يتوجب على سيادتكم الحضور" in a video. Change to "نبغاكم تحضرون بدري". Reason: the voice must be Saudi and warm.

## Bad example
Changing "الدوام ٨ صباحاً" to "الدوام ٩ صباحاً" because it "sounds usual".
Why bad: a fact was changed. Ask instead.
