#!/usr/bin/env python3
"""Check the speaker's five recordings before they go on the Al-Rifadah video.

Usage: python3 check_recordings.py recordings/

Looks for scene1..scene5 (.wav, .m4a, .mp3, .aac). Scene slots are 5, 10, 15, 15, 15 s.
FIX   = the file cannot go on the video as it is (longer than its slot, empty, unreadable).
CHECK = a person should listen (too quiet, clipped, long silence, uneven loudness).
Exit code 1 if any FIX. Analysis only: no file is changed. Needs ffmpeg and ffprobe.
"""
import os
import re
import subprocess
import sys

SLOTS = [5, 10, 15, 15, 15]
EXTS = (".wav", ".m4a", ".mp3", ".aac")
TOLERANCE = 0.3            # seconds a recording may run over its slot
SHORT_RATIO = 0.4          # shorter than this share of the slot: words may be missing
QUIET_DB = -32.0           # mean volume below this is too quiet
CLIP_DB = -0.1             # peak at or above this is clipped
LEAD_MAX = 1.5             # seconds of silence before the first word
TAIL_MAX = 2.5             # seconds of silence after the last word
GAP_MAX = 2.5              # seconds of silence inside the recording
SPREAD_DB = 6.0            # loudest vs quietest scene
MIN_RATE = 22050


def find(audio_dir, n):
    for ext in EXTS:
        p = os.path.join(audio_dir, "scene%d%s" % (n, ext))
        if os.path.isfile(p):
            return p
    return None


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
         "stream=sample_rate,channels:format=duration", "-of", "default=nw=1", path],
        capture_output=True, text=True)
    info = dict(l.split("=", 1) for l in out.stdout.split() if "=" in l)
    if "duration" not in info:
        return None
    return {"duration": float(info["duration"]),
            "rate": int(info.get("sample_rate", 0) or 0),
            "channels": int(info.get("channels", 0) or 0)}


def analyse(path):
    err = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
         "volumedetect,silencedetect=noise=-40dB:d=0.3", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    mean = re.search(r"mean_volume: (-?[\d.]+|-inf) dB", err)
    peak = re.search(r"max_volume: (-?[\d.]+|-inf) dB", err)
    to_f = lambda m: (float(m.group(1)) if m and m.group(1) != "-inf" else -91.0)
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", err)]
    ends = [(float(a), float(b)) for a, b in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", err)]
    return {"mean": to_f(mean), "peak": to_f(peak), "starts": starts, "ends": ends}


def silences(a, duration):
    """Return (lead, tail, longest_gap) in seconds from silencedetect results."""
    spans = []
    ends = list(a["ends"])
    for s in a["starts"]:
        s = max(s, 0.0)
        match = [e for e, d in ends if abs((e - d) - s) < 0.05]
        spans.append((s, match[0] if match else duration))
    lead = tail = gap = 0.0
    for s, e in spans:
        if s <= 0.05:
            lead = e - s
        elif e >= duration - 0.05:
            tail = e - s
        else:
            gap = max(gap, e - s)
    return lead, tail, gap


def check(audio_dir):
    problems, means = [], {}
    found = 0
    for i, slot in enumerate(SLOTS):
        n = i + 1
        p = find(audio_dir, n)
        if not p:
            problems.append(("CHECK", n, "no file found; this scene stays silent."))
            continue
        found += 1
        info = probe(p)
        if not info:
            problems.append(("FIX", n, "the file cannot be read as audio."))
            continue
        d = info["duration"]
        if d < 0.5:
            problems.append(("FIX", n, "the file is almost empty (%.1f s)." % d))
            continue
        if d > slot + TOLERANCE:
            problems.append(("FIX", n, "%.1f s is longer than its %d s slot. Re-record a little faster; do not drop words." % (d, slot)))
        elif d < slot * SHORT_RATIO:
            problems.append(("CHECK", n, "only %.1f s for a %d s slot; some words may be missing. Listen and compare with the sheet." % (d, slot)))
        if 0 < info["rate"] < MIN_RATE:
            problems.append(("CHECK", n, "low sample rate (%d Hz); the voice may sound dull." % info["rate"]))
        a = analyse(p)
        means[n] = a["mean"]
        if a["mean"] < QUIET_DB:
            problems.append(("CHECK", n, "very quiet (mean %.0f dB). Record closer to the microphone." % a["mean"]))
        if a["peak"] >= CLIP_DB:
            problems.append(("CHECK", n, "the loudest point touches the limit (%.1f dB): the voice may be distorted. Listen, and re-record a little further from the microphone." % a["peak"]))
        lead, tail, gap = silences(a, d)
        if lead > LEAD_MAX:
            problems.append(("CHECK", n, "%.1f s of silence before the first word." % lead))
        if tail > TAIL_MAX:
            problems.append(("CHECK", n, "%.1f s of silence after the last word." % tail))
        if gap > GAP_MAX:
            problems.append(("CHECK", n, "a %.1f s silence inside the recording; a pause that long may be a mistake." % gap))
    if len(means) >= 2 and max(means.values()) - min(means.values()) > SPREAD_DB:
        loud = max(means, key=means.get)
        quiet = min(means, key=means.get)
        problems.append(("CHECK", 0, "loudness differs between scenes by %.0f dB (scene%d loudest, scene%d quietest). Ask the speaker to keep the same distance to the microphone." % (means[loud] - means[quiet], loud, quiet)))
    return found, problems


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 1 or not os.path.isdir(argv[0]):
        print(__doc__)
        return 2
    found, problems = check(argv[0])
    for lvl, n, text in problems:
        print("%-5s %s %s" % (lvl, ("scene%d:" % n) if n else "all scenes:", text))
    fixes = sum(1 for p in problems if p[0] == "FIX")
    print("%d of 5 scene files found. %d FIX, %d CHECK" % (found, fixes, len(problems) - fixes))
    return 1 if fixes or not found else 0


if __name__ == "__main__":
    sys.exit(main())
