---
name: alrifadah-facts
description: Keep one sheet of confirmed Al-Rifadah facts (brand colors and logo, working hours, day-one steps, staff who agreed to appear, HR contacts, values) so the user never retypes them. Use when the user wants to set up, view, update or check the company facts, when another Al-Rifadah skill finds a fact missing, or when the user says "الحقائق", "بيانات الشركة", "facts sheet". Does not write scripts, messages or documents.
---

# Al-Rifadah facts sheet

One job: keep a short, confirmed list of facts that the other Al-Rifadah skills read.

## My rules (fixed, from the user)
- Only facts the user told me, each with the date they confirmed it. Never fill a gap with a guess; leave `[ناقص]`.
- No passwords, API keys, ID numbers, salaries, private phone numbers or health details in the sheet.
- A person goes in the "appear in videos" table only after the user says that person agreed. Record the date.
- Never send, publish or share the sheet. Saving or committing it needs the user's yes.

## Where it lives
- Template: `facts-template.md` in this folder (empty, safe to commit).
- Filled sheet: `.claude/alrifadah-facts.local.md`. It is listed in `.gitignore`, so it is not committed by accident.
- This cloud session is temporary. Files not committed are lost when it ends. Tell the user this once, and offer to commit only the non-personal parts (brand, hours, steps) if they say yes. Staff names and photos stay out of git.

## Steps
1. If the filled sheet does not exist, copy the template and ask for the missing facts, a few at a time, starting with what the next video or document needs.
2. Write each answer in the sheet with today's date. Do not reword the user's own values text.
3. Update mode: show a before and after list of changed lines and ask before saving.
4. Check mode: list every `[ناقص]` and every fact older than 6 months, ask if still true.
5. Show the result. Stop.

## Good example 1
User: "الدوام من 7 إلى 3:30". Sheet line: `Working hours: 7:00-15:30 (confirmed 2026-10-27)`.
Why good: exact, dated, nothing added.

## Good example 2
Table row for a manager is left as `agreed: [ناقص]` and the video plan is told "do not use this person".
Why good: no consent, no appearance.

## Bad example
Filling "Address: الرياض، حي العليا" because the company "is probably there", and saving the manager's mobile number.
Why bad: the address was invented and a private number was stored.
