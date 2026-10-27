---
name: alrifadah-about-us
description: Write the "about us" text of Al-Rifadah from the user's own words - what the company does and its values - as a short Saudi spoken line for scene 2 of the onboarding video, a short Modern Standard on-screen line, and a longer Modern Standard paragraph for documents. Use when the user asks for the company introduction, "نص من نحن", the values line for the video, or when the facts sheet still has no company values. Uses only what the user says; claims nothing the user did not say.
---

# Al-Rifadah about-us text

One job: say who the company is, once, in the user's words, and reuse it everywhere.

## My rules (fixed, from the user)
- Only the user's own words. Never add what the company does, its values, its history, size, years, awards, licences, numbers, "the best", "leading" or "trusted" unless the user said it. I do not guess the services from the company name.
- Three forms: a spoken line (Saudi, warm, 22 words at most for the 10 seconds of scene 2), an on-screen line (Modern Standard, 8 words at most), and a paragraph (formal Modern Standard, for documents). The full name شركة الرفادة لخدمات الحجاج appears once in the paragraph; the short الرفادة is fine in the spoken line.
- Offer two wordings of each so the user chooses; never publish or send any of them.
- If the user's words are thin, say so and ask, rather than filling the gap.

## Steps
1. Read `.claude/alrifadah-facts.local.md`. If company values are already there, show them and ask whether to use them as they are.
2. If not, ask the user, in their own words (one short message, answers can be one line each):
   - What does the company do, in one sentence?
   - What are two or three values or ways of working you want new staff to feel?
   - Anything that must never be said about the company?
3. Save the user's answers to a text file (`source.txt`) and write the drafts to `draft.txt`, each line starting with `spoken:`, `screen:` or `text:`, then run:
   `python3 .claude/skills/alrifadah-about-us/scripts/claims_check.py source.txt draft.txt`
   FIX = a number or boast the user never said (remove it). CHECK = too long for its use or Latin letters.
4. Run the arabic-proofread skill on the drafts.
5. Show the two wordings of each form with the checker result. Wait for the user's choice.
6. After the user's yes, record the chosen text in the facts sheet under company values (with today's date), and tell the user that scene 2 of the onboarding script can now use it. The sheet is local and temporary; offer to commit only if the user says yes.

## Good example 1
The user says "نخدم الحجاج بالاحترام والتعاون." Spoken: "في الرفادة نخدم الحجاج بالاحترام والتعاون، وأنت جزء من هذا." Screen: "خدمة بالاحترام والتعاون."
Why good: every idea comes from the user's sentence; short enough for the scene.

## Good example 2
The user gives one value only. The skill says "عندي قيمة واحدة فقط، هل تضيف قيمة ثانية؟" and drafts around the one value.
Why good: asks instead of inventing.

## Bad example
"الرفادة، الشركة الرائدة منذ 1995 في خدمة أكثر من مليون حاج." with nothing like it in the user's words.
Why bad: an invented boast, year and number; the checker would flag all three.
