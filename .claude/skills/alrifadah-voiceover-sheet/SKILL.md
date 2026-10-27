---
name: alrifadah-voiceover-sheet
description: Turn the approved Saudi spoken lines of an Al-Rifadah onboarding video into a reading sheet for the person who records the voice - time per scene, words per second check, pauses, hard words, tone notes. Use when the user has an approved onboarding script and asks for a voice-over sheet, recording sheet, or "ورقة التسجيل الصوتي". Does not record, clone or generate any voice.
---

# Al-Rifadah voice-over reading sheet

One job: a clean sheet the speaker can read from, that fits 60 seconds.

## My rules (fixed, from the user)
- Spoken lines stay Saudi dialect and warm, exactly as approved. This skill does not rewrite the script. If a line must change to fit the time, show the change and ask first.
- Total 60 seconds. On-screen text is not read aloud.
- Names, titles and hard words: pronunciation notes only for words the user or the speaker confirmed. Never guess how a person's name is said.
- The speaker is whoever the user says. Never record, clone or generate a voice, and never use a staff member's voice without that person's agreement. A generated or paid voice needs the user's yes and the cost shown first.
- Never send or publish the sheet or any recording.

## Steps
1. Get the approved script (spoken column with scene seconds). If it is not approved or does not total 60 seconds, stop and ask.
2. Write the scenes into a text file, one per line: `scene | seconds | spoken line`. Run:
   `python3 .claude/skills/alrifadah-voiceover-sheet/scripts/pace.py scenes.txt`
   FIX = too many words for the time (cut or move words, with the user's yes). CHECK = slow; make it a planned pause or add warm words from the approved script.
   The limits (1.5 to 2.5 words per second) are defaults for a warm, unhurried voice; use the speaker's real pace when known.
3. Build the sheet: scene | seconds | line, with `/` for a short pause and `//` for a long one, bold on words to stress, a one-line tone note per scene (for example: "ابتسامة في الصوت").
4. List the hard words and names with pronunciation only where confirmed; the rest as `[ناقص: كيف تُنطق؟]`.
5. Ask for a test read of one scene before the full take, and a timer check after.
6. Show the sheet and the pace report. Stop.

## Good example 1
Report: "FIX scene 4: 27 words in 10 s (2.7/s): too fast. Cut about 2 words." Sheet shows two proposed cuts and waits for the user.
Why good: finds the problem before recording and asks before changing approved words.

## Good example 2
Sheet line: `1 | 5 s | هلا والله // ومرحبا بك / نورتنا في الرفادة` with tone note "ابتسامة".
Why good: pauses and tone are marked, the words are unchanged.

## Bad example
Quietly dropping a sentence from scene 4 to make it fit, and guessing the manager's name as "الأستاذ عبدالرحمن".
Why bad: approved words were changed without asking and the name was invented.
