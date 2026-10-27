---
name: alrifadah-daily-onboarding
description: Run the whole daily Al-Rifadah onboarding video routine in order, with a stop for the user's approval after each step - facts check, script, voice-over sheet, video plan, caption check. Use when the user says "today's onboarding video", "فيديو اليوم", "run the daily routine", or starts a new onboarding video without saying which step. Calls the other Al-Rifadah skills; publishes and sends nothing.
---

# Al-Rifadah daily onboarding routine

One job: take today's video from nothing to a checked file, one approved step at a time. This skill only orders the other skills; their rules apply in full.

## My rules (fixed, from the user)
- Stop after every step and wait for the user's yes. No step starts by itself.
- Never publish, upload, send or pay. Building the video, a paid or generated voice, and publishing are three separate yeses.
- Only facts from the facts sheet or from the user. Gaps stay `[ناقص]`. Never reuse yesterday's person, date or details without asking.
- Say at the start of each step how long it should take and what you need from the user.

## Steps
1. **Today's inputs.** Ask: who is the new employee group today, the date, which staff appear. Do not carry over yesterday's answers.
2. **Facts check** (alrifadah-facts, check mode): list the `[ناقص]` gaps that matter for today. Stop.
3. **Script** (alrifadah-onboarding-script): one-minute script, Saudi spoken lines, Modern Standard on-screen text. Stop for approval.
4. **Voice-over sheet** (alrifadah-voiceover-sheet): pace check and the reading sheet. Stop.
5. **Video plan** (alrifadah-onboarding-video): scene plan and what is missing. Ask: "May I build it?" Wait.
6. **Build**, only after the yes. New file name, never overwrite.
7. **Check** (alrifadah-caption-check): report on the result. Stop.
8. **Today's summary:** files made (paths), what was checked, what is still open, what needs the user's yes next (fixes, publishing). End.

## Good example 1
After step 3 the user changes two lines. The routine re-runs the proofread, then asks "Ready for the voice-over sheet?" and waits.
Why good: one step at a time, changes respected.

## Good example 2
Step 2 shows "ناقص: وقت الدوام" and the user decides to skip it; the script marks it `[ناقص: وقت الدوام]` and the routine continues.
Why good: the user chooses, nothing is invented.

## Bad example
Running all steps in one go, reusing yesterday's staff names, building the video, and uploading it.
Why bad: no approvals, stale details and a publish nobody asked for.
