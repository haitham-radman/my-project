---
name: alrifadah-day-one-plan
description: Make a one-page day-one plan for a new Al-Rifadah employee in formal Modern Standard Arabic - schedule, people to meet, what to bring, first-week notes, HR contact - built only from the facts sheet and what the user gives about that person. Use when the user says a new employee is starting, or asks for a plan, schedule or welcome sheet for a new hire, "خطة اليوم الأول". Draft only; never sends it to the employee. For the welcome video use alrifadah-onboarding-script.
---

# Al-Rifadah day-one plan

One job: a clear one-page plan for one new employee, ready for the user to review.

## My rules (fixed, from the user)
- Modern Standard Arabic, formal, right to left. Full company name شركة الرفادة لخدمات الحجاج in the header. Colors, if a file is made: red, black, white.
- Every fact (times, places, names, what to bring) comes from `.claude/alrifadah-facts.local.md` or from the user in this chat. Anything else stays `[ناقص: ...]`. Never invent times, rooms, names or policies.
- People to meet: only staff listed in the facts sheet, by name and role. No private phone numbers; give the HR contact by role.
- The new employee's name, role, start date and manager are private. Use them for this plan only. Do not save them to the facts sheet, any file in the repo, or git.
- Never send, email, post or print. The plan is a draft for the user to review.

## Steps
1. Ask for what the plan needs about this person: name, job title, start date, direct manager. Ask nothing the facts sheet already answers.
2. Read the facts sheet. List the gaps that matter for day one (hours, address or entrance, first-day steps, people to meet).
3. Build the plan with these parts: header (شركة الرفادة لخدمات الحجاج, "خطة اليوم الأول", name, title, start date, manager); schedule table (time | activity | with whom | where); people to meet (name, role); what to bring; first-week notes; HR contact by role; closing welcome line.
4. Check: nothing in the plan is missing from the sources; every gap is marked; no dialect; the name and date match what the user gave.
5. Run the arabic-proofread skill.
6. Show the plan and the gap list. Stop. A Word or PDF file is made only if the user asks.

## Good example 1
Row: `08:00 | استقبال وجولة تعريفية | [اسم، دور من جدول الفريق] | [ناقص: المكان]`
Why good: the person is from the facts sheet, the unknown place is marked.

## Good example 2
Gap list ends with: "ناقص: ساعات الدوام، خطوات اليوم الأول. أرسلها لأكمل الخطة." and the plan still shows the parts that are known.
Why good: useful now, nothing invented.

## Bad example
A full schedule from 8:00 to 4:00 with invented rooms and the manager's mobile number, and the plan emailed to the employee.
Why bad: made-up details, a private number, and it was sent without approval.
