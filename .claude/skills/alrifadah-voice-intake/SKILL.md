---
name: alrifadah-voice-intake
description: Receive the speaker's recordings for an Al-Rifadah onboarding video (scene1 to scene5), check each file (length against its scene, too quiet, distorted, long silences, uneven loudness, missing files), then put the voice on the silent video after the user says yes. Use when the user says the recordings are ready, shares audio files for the video, or asks to add the voice. Local only; never uploads, clones or changes a voice.
---

# Al-Rifadah voice intake

One job: make sure the recordings are usable, then put them on the video.

## My rules (fixed, from the user)
- Voice is Saudi, warm, read from the approved sheet. Words are never cut or changed to fit the time. If a recording is too long, the speaker re-reads faster.
- Ask the user to confirm the speaker agreed to be recorded and to appear in this video. Never clone, imitate or generate a voice from the recordings, and never send them anywhere.
- Report first, change nothing: no trimming, noise removal or loudness change without the user's yes. Say what each fix would do.
- Output goes to a new file name; never overwrite the silent video or a previous result.

## Steps
1. Get the five files named `scene1` to `scene5` (wav, m4a, mp3 or aac) and the silent video. If the files are not in this session yet, ask the user to attach them; do not guess or generate.
2. Check them:
   `python3 .claude/skills/alrifadah-voice-intake/scripts/check_recordings.py recordings/`
   FIX = cannot go on the video as is (longer than its 5, 10, 15, 15, 15 second slot, empty, unreadable). CHECK = someone should listen (too quiet, touching the limit, long silence, a very short file, uneven loudness between scenes, a missing scene). The limits are defaults I chose; tell me the speaker's real pace or setup and I will change them.
3. Report as a table: scene | what is wrong | FIX or CHECK | what the speaker should do. Say that the check cannot hear dialect, wording or mistakes, so a person must listen to every scene once.
4. If there are FIX items, stop and send the speaker's list. If only CHECK items remain, ask: "Add the voice as is?"
5. After yes, run the add step from `alrifadah-onboarding-video`:
   `python3 .claude/skills/alrifadah-onboarding-video/scripts/add_voice.py --video silent.mp4 --audio-dir recordings --out with-voice.mp4`
6. Run the alrifadah-caption-check skill on the result. Send the file to the user and stop. Publishing is a separate yes.

## Good example 1
Report: "FIX scene3: 16.4 s is longer than its 15 s slot. Re-record a little faster; do not drop words." and nothing is added until a new scene3 arrives.
Why good: exact numbers, the speaker's job is clear, the words stay.

## Good example 2
Report: "CHECK all scenes: loudness differs by 9 dB (scene2 loudest, scene4 quietest)." The skill asks, then offers to level them only if the user says yes.
Why good: finds a real problem and does not change the voice silently.

## Bad example
Shortening scene3 by cutting a sentence, raising the volume with no mention, and uploading the result to a shared drive.
Why bad: approved words were cut, the voice was changed without a yes, and it was published.
