---
name: alrifadah-onboarding-script
description: Write the script for a one-minute Al-Rifadah staff onboarding video in Arabic - spoken lines in a Saudi dialect, on-screen text in Modern Standard Arabic, warm tone. Use when the user asks for an onboarding video script, a welcome video text, or "نص فيديو توظيف / استقبال موظف جديد". Not for filming, editing or rendering (use alrifadah-onboarding-video) and not for messages or documents.
---

# Al-Rifadah onboarding video script

One job: turn the facts the user gives into a one-minute script, ready to approve.

## My rules (fixed, from the user)
- Facts come from `.claude/alrifadah-facts.local.md` (see alrifadah-facts). Read it first; use only what it says; anything missing stays `[ناقص]`.
- Full company name: شركة الرفادة لخدمات الحجاج (as written on the logo). Use it in documents, signatures and the first on-screen mention; the short form الرفادة is fine in spoken lines and warm messages.
- Company: الرفادة (Al-Rifadah, Arabic spelling الرفادة). Audience: new staff.
- Length: exactly one minute. Spoken part: 110 to 130 words. Count them and say the number.
- Spoken lines: Saudi dialect, warm, like a colleague welcoming you.
- On-screen text: Modern Standard Arabic, short (at most 8 words per screen).
- Company staff appear in the video. Mark which scene each person appears in. Use only names and roles the user gave.
- Never invent company facts (hours, policies, names, numbers, benefits). If a fact is missing, write `[ناقص: ...]` and list it at the end.

## Steps
1. Ask for what is missing: who is the new employee group, what must they know on day one, which staff appear (name and role), any must-say sentence.
   If the user says to continue with gaps, write the spoken lines without any fact that is missing (no markers in lines meant to be read aloud). Keep each gap marker only in the gaps list and in on-screen text drafts, and say that the spoken text is shorter than the 110-word target.
2. Use this scene order unless the user gives another one (state that it is a default they can change): welcome (5 s), who we are (10 s), the first day (15 s), who to ask and where (15 s), closing welcome (15 s).
3. Write a table: scene | seconds | spoken line (Saudi) | on-screen text (Modern Standard) | who appears.
4. Check: total seconds = 60, spoken words in range, no invented facts, dialect only in the spoken column. Count words with `python3 -c "import sys;print(len(sys.stdin.read().split()))" < spoken.txt` (the `wc -w` tool miscounts Arabic). Under 110 words means the video runs short: add warm detail from facts the user gave, never filler or invented facts. Over 130 means cut.
5. Run the arabic-proofread skill on the script. Then show the script and the missing-facts list. Stop. Do not film, render or send anything. After the user approves, the alrifadah-voiceover-sheet skill makes the recording sheet.

## Good example 1
| Scene | Sec | Spoken (Saudi) | On screen (Modern Standard) | Who |
|---|---|---|---|---|
| 1 | 5 | هلا والله، نورتونا في الرفادة! | أهلاً بكم في الرفادة | [الموظف: اسم، دور] |
Why good: warm spoken line, formal short screen text, a named person, seconds shown.

## Good example 2
Missing fact handled: spoken line "دوامكم يبدأ [ناقص: وقت الدوام]" and the list ends with "ناقص: وقت الدوام".
Why good: it asks instead of inventing.

## Bad example
Spoken line in Modern Standard ("نرحب بكم أيها الزملاء الأعزاء") and a made-up "الدوام من 8 إلى 4".
Why bad: the voice must be Saudi and warm, and the working hours were never given.
