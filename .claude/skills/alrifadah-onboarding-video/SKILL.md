---
name: alrifadah-onboarding-video
description: Plan and build the one-minute Al-Rifadah onboarding video from an approved script - scene plan, red, black and white look, Saudi voice, Modern Standard on-screen text, staff on screen. Use when the user has an approved onboarding script and wants the video made, a storyboard, or a shot list. Needs a script first (use alrifadah-onboarding-script). Never publishes or sends the video.
---

# Al-Rifadah onboarding video

One job: turn an approved script into a video plan, then build it only after the user says yes.

## My rules (fixed, from the user)
- Facts come from `.claude/alrifadah-facts.local.md` (see alrifadah-facts). Read it first; use only what it says; anything missing stays `[ناقص]`.
- Full company name: شركة الرفادة لخدمات الحجاج (as written on the logo). Use it in documents, signatures and the first on-screen mention; the short form الرفادة is fine in spoken lines and warm messages.
- One minute. Colors: red, black, white only. Ask once for the exact brand codes and logo file; until given, write `[ناقص: كود اللون الأحمر]`.
- Voice: Saudi. On-screen text: Modern Standard, right to left, large and readable.
- Company staff appear. Before using any person's face, photo or voice, ask the user to confirm that person agreed. Never copy or clone a voice without that person's consent.
- Never publish, upload, send or pay without the user's explicit yes, for each of these separately. Paid generation: show the cost first.

## Steps
1. Check there is an approved script with 60 seconds in total. If not, stop and ask for it.
2. Make the plan table: scene | seconds | picture | who appears | on-screen text | voice line | colors used.
3. List what is missing: logo, staff photos or clips, brand color codes, voice source (a real person or a generated voice, with consent).
4. Show the plan. Ask: "May I build it?" Wait.
5. After yes, build with a video skill already installed here (ask which one if unsure). Save to a new file name, never overwrite.
   With hyperframes: use only a CLI version the user approved, with `HYPERFRAMES_SKIP_SKILLS=1 HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 npm_config_ignore_scripts=true`. In cloud sessions the animation library's CDN is blocked, so keep a local copy of the file in the project and name the local browser with `HYPERFRAMES_BROWSER_PATH`. Put the title on screen at second 0, keep every scene slowly moving, run `check`, and look at snapshot frames before rendering.
   Recorded voice (one file per scene, `scene1` to `scene5`): `python3 .claude/skills/alrifadah-onboarding-video/scripts/add_voice.py --video silent.mp4 --audio-dir recordings --out with-voice.mp4`. It places each file at its scene start, refuses a recording longer than its slot, never overwrites, and keeps the picture unchanged. The user can run it themselves.
6. Check the result frame by frame: Arabic letters joined and right to left, only the three colors, 60 seconds, staff match the plan.
7. Run the alrifadah-caption-check skill on the result. Show the file path and its report. Stop. Publishing is a separate yes.

## Good example 1
Plan row: `3 | 15 s | الموظف يستقبل الزميل عند المكتب | [اسم، دور] | الدوام يبدأ [ناقص: الوقت] | "تبدأ يومك من هنا" | أبيض خلفية، أحمر عنوان`
Why good: everything is on one row and the gap is marked.

## Good example 2
"Staff photo for scene 4 is missing and I need your confirmation that the person agreed. I will not build scene 4 until then."
Why good: asks about consent and does not invent.

## Bad example
Building and uploading the video right after the script, with a blue background and a generated voice that copies a manager.
Why bad: wrong colors, no approval, no consent, and it published.
