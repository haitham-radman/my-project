---
name: alrifadah-weekly-hr-report
description: Write the weekly HR report for Al-Rifadah management in formal Modern Standard Arabic from the figures and notes the user pastes - summary, figures table with change from last week, points that need a decision, next week. Use when the user asks for the weekly report, a management summary, "تقرير الموارد البشرية الأسبوعي" or a status update on recruiting, onboarding or staff matters. Draft only; never sends it.
---

# Al-Rifadah weekly HR report

One job: a short, correct report from the numbers the user gives.

## My rules (fixed, from the user)
- Formal Modern Standard Arabic. Header: شركة الرفادة, "التقرير الأسبوعي للموارد البشرية", the week dates.
- Every number comes from what the user pasted. Never estimate, round up, or fill a gap. A missing figure stays `[ناقص: ...]`.
- Changes from last week are calculated by `scripts/delta.py`, not by hand. A last week of 0 gives no percent.
- Do not guess what the user tracks. Use only the metrics they give. Ask once which metrics, the recipient (role) and which digits (٠١٢ or 012); keep one style in the whole report.
- Counts only, never names, for discipline, complaints, health, pay disputes and terminations. If pasted notes contain such details, summarize them as a count and tell the user.
- Never send, post or file the report. Never state a cause or promise for a change unless the user wrote it.

## Steps
1. Ask for (or take from the paste): the week dates, the figures this week and last week, the notes, and the points that need a decision.
2. Write the figures to a text file, one per line: `metric | this week | last week` (use `-` for none). Run:
   `python3 .claude/skills/alrifadah-weekly-hr-report/scripts/delta.py figures.txt`
3. Build the report: summary of 3 lines at most; figures table (metric | this week | last week | change); highlights from the user's notes; points needing a decision (who decides: a role); plan for next week from the user's notes only; gaps list.
4. Check: each number in the text appears in the table or the paste; no cause was invented; no private details; digits are in one style.
5. Run the arabic-proofread skill on the report.
6. Show the report and the gaps. Stop. A Word or PDF file only if asked.

## Good example 1
Table row: `عدد المقابلات | 14 | 10 | ارتفاع 4 (40%)` from the script, and the summary says "ارتفع عدد المقابلات إلى 14".
Why good: the same number everywhere, change calculated by the script.

## Good example 2
"الوظائف الشاغرة: 5 (الأسبوع الماضي: [ناقص])" and the gaps list asks for last week's figure.
Why good: no invented comparison.

## Bad example
"ارتفعت الطلبات 200% بسبب حملة الإعلان" when last week's figure was 0 and no campaign was mentioned.
Why bad: the percent is meaningless and the cause was invented.
