#!/usr/bin/env python3
"""Add recorded voice files to the silent Al-Rifadah onboarding video.

Usage: python3 add_voice.py --video silent.mp4 --audio-dir recordings/ --out video-with-voice.mp4

Looks for scene1..scene5 (.wav, .m4a, .mp3, .aac) in --audio-dir and places each
at its scene start: 0, 5, 15, 30, 45 seconds. Scene slots are 5, 10, 15, 15, 15 s.
Never overwrites: refuses if --out exists. A recording longer than its slot is
reported and nothing is written (the speaker re-reads faster; no words are cut).
Missing scenes are reported and the rest are added. Needs ffmpeg and ffprobe.
"""
import argparse
import os
import subprocess
import sys

STARTS = [0, 5, 15, 30, 45]
SLOTS = [5, 10, 15, 15, 15]
EXTS = (".wav", ".m4a", ".mp3", ".aac")
TOLERANCE = 0.3


def find(audio_dir, n):
    for ext in EXTS:
        p = os.path.join(audio_dir, "scene%d%s" % (n, ext))
        if os.path.isfile(p):
            return p
    return None


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", path],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def plan(audio_dir, dur=duration):
    """Return (found, problems): found = [(scene, path, start)], problems = [(level, text)]."""
    found, problems = [], []
    for i in range(5):
        n = i + 1
        p = find(audio_dir, n)
        if not p:
            problems.append(("CHECK", "scene%d: no file found; that scene stays silent." % n))
            continue
        d = dur(p)
        if d > SLOTS[i] + TOLERANCE:
            problems.append(("FIX", "scene%d: %.1f s is longer than its %d s slot. Re-record a little faster; do not drop words." % (n, d, SLOTS[i])))
        elif d < 0.5:
            problems.append(("FIX", "scene%d: file is almost empty (%.1f s)." % (n, d)))
        found.append((n, p, STARTS[i]))
    return found, problems


def build(video, found, out):
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-i", video]
    for _, p, _ in found:
        cmd += ["-i", p]
    parts = ["[%d:a]adelay=%d|%d[a%d]" % (k + 1, s * 1000, s * 1000, k) for k, (_, _, s) in enumerate(found)]
    mix = "".join("[a%d]" % k for k in range(len(found)))
    parts.append("%samix=inputs=%d:normalize=0:duration=longest[aout]" % (mix, len(found)))
    cmd += ["-filter_complex", ";".join(parts), "-map", "0:v", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", "60", out]
    subprocess.run(cmd, check=True)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--audio-dir", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args(argv)
    if os.path.exists(a.out):
        print("FIX   %s already exists. Choose a new name; nothing was changed." % a.out)
        return 1
    found, problems = plan(a.audio_dir)
    for lvl, text in problems:
        print("%-5s %s" % (lvl, text))
    if any(l == "FIX" for l, _ in problems):
        print("Nothing written.")
        return 1
    if not found:
        print("FIX   no scene files found. Nothing written.")
        return 1
    build(a.video, found, a.out)
    print("Written: %s (%d of 5 scenes added)" % (a.out, len(found)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
