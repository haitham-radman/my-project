---
name: alrifadah-caption-check
description: Check a finished Al-Rifadah onboarding video and its captions before the user sees it - Arabic text direction and joined letters, Modern Standard on-screen text, company name spelling, length of 60 seconds, reading speed, and only red, black and white. Use when the user has a video file and/or an SRT or VTT caption file and asks to check, review or approve it, or says "راجع الفيديو / الترجمة". Report only; does not edit or publish the video.
---

# Al-Rifadah caption and video check

One job: find the mistakes the user usually fixes by hand, and report them.

## My rules (fixed, from the user)
- Video length: 60 seconds. Colors: red, black, white only (exact codes in `.claude/alrifadah-facts.local.md`, see alrifadah-facts).
- On-screen text: Modern Standard Arabic, right to left. Spoken voice may be Saudi.
- Company name: الرفادة, full form شركة الرفادة in formal text.
- Report only. Never edit, re-render, upload or send the video. Fixes happen after the user says yes, in the video skill.

## Steps
1. Ask for the video file and the caption file (SRT or VTT). If only a video exists, say the text check needs the captions and continue with the picture check.
2. Run the text check:
   `python3 .claude/skills/alrifadah-caption-check/scripts/check_captions.py captions.srt --video final.mp4`
   FIX = certain mistake. CHECK = look at it yourself (a dialect word may be fine on purpose). The limits (8 words, 15 characters per second) are defaults the user can change.
3. Picture check with ffmpeg, into a new folder: one frame at the start of each caption (`ffmpeg -ss <time> -i final.mp4 -frames:v 1 frame_<n>.png`). Look at every frame and tick:
   - Letters joined and reading right to left, nothing reversed or broken into separate letters.
   - Text not cut off, not too close to the edge, readable on the background.
   - Only red, black and white in the design. Staff photos and clips may have other colors.
   - Staff on screen match the plan, and each agreed to appear (facts sheet).
   - Logo is the right file.
4. Report as a table: where | what is wrong | FIX or CHECK | suggested fix in plain words. Say what could not be checked (for example sound and voice dialect need a person to listen).
5. Stop. Ask which fixes to make.

## Good example 1
Caption 2 says "ونبغاكم تحضرون بدري". Report: CHECK, Saudi words on screen, suggest "ونرجو حضوركم مبكراً".
Why good: finds the dialect even with the attached "و" and proposes Modern Standard.

## Good example 2
"Video is 58.0 s; it must be 60 s" and "Last caption ends after the video does".
Why good: exact numbers, two real problems.

## Bad example
"Looks good!" after reading the caption file only, without viewing any frame, or fixing and re-exporting the video without asking.
Why bad: joined letters, colors and cut-off text show only in the picture, and the user never approved an edit.
