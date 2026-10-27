#!/usr/bin/env python3
"""Check an SRT or VTT caption file for an Al-Rifadah onboarding video.

Usage: python3 check_captions.py captions.srt [--video final.mp4]
       [--target-seconds 60] [--max-words 8] [--max-cps 15]

FIX    = certain mistake. CHECK = needs a human look. Exit code 1 if any FIX.
Standard library only; ffprobe is used only when --video is given.
"""
import argparse
import re
import subprocess
import sys

# Common Saudi/Gulf spoken words. On-screen text must be Modern Standard.
DIALECT = ["وش", "ايش", "إيش", "شلون", "شلونك", "بغيت", "نبغى", "نبغا", "نبغاكم",
           "الحين", "دحين", "عشان", "دايم", "شي", "هلا",
           "ابغى", "أبغى", "بيكون", "تشيل", "بدري", "يخلص", "ليش", "وين", "كذا", "ابي"]
DIALECT_PHRASES = ["هلا والله", "نورتونا", "نورتنا"]
PRESENTATION = re.compile("[ﭐ-﷿ﹰ-﻿]")
ARABIC = re.compile("[؀-ۿ]")
LATIN = re.compile("[A-Za-z]")
ARABIC_DIGITS = re.compile("[٠-٩]")
WESTERN_DIGITS = re.compile("[0-9]")
TIME = re.compile(r"(\d+):(\d+):(\d+)[,.](\d+)")


def secs(stamp):
    m = TIME.search(stamp)
    h, mi, s, ms = (int(x) for x in m.groups())
    return h * 3600 + mi * 60 + s + ms / 10 ** len(m.group(4))


def parse(text):
    cues = []
    for block in re.split(r"\n\s*\n", text.replace("\r\n", "\n").strip()):
        lines = [l for l in block.split("\n") if l.strip()]
        for i, l in enumerate(lines):
            if "-->" in l and TIME.search(l):
                a, b = l.split("-->")[:2]
                cues.append({"n": len(cues) + 1, "start": secs(a), "end": secs(b),
                             "lines": lines[i + 1:]})
                break
    return cues


def words(cue):
    return len(" ".join(cue["lines"]).split())


def run(path, video=None, target=60.0, max_words=8, max_cps=15.0):
    out = []  # (level, cue number or 0, message)
    with open(path, "rb") as f:
        raw = f.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        return [("FIX", 0, "File is not UTF-8; Arabic will break. Save it as UTF-8.")]
    cues = parse(text)
    if not cues:
        return [("FIX", 0, "No captions found. Is this an SRT or VTT file?")]
    all_text = " ".join(" ".join(c["lines"]) for c in cues)
    if ARABIC_DIGITS.search(all_text) and WESTERN_DIGITS.search(all_text):
        out.append(("CHECK", 0, "Both Arabic-Indic (٠١٢) and Western (012) digits are used. Pick one."))
    prev_end = 0.0
    for c in cues:
        n, body = c["n"], " ".join(c["lines"])
        dur = c["end"] - c["start"]
        if dur <= 0:
            out.append(("FIX", n, "Caption ends before it starts."))
            continue
        if c["start"] < prev_end - 0.001:
            out.append(("FIX", n, "Overlaps the previous caption."))
        prev_end = max(prev_end, c["end"])
        if dur < 1.0:
            out.append(("CHECK", n, "On screen %.1f s, too short to read." % dur))
        if words(c) > max_words:
            out.append(("CHECK", n, "%d words (limit %d)." % (words(c), max_words)))
        if len(c["lines"]) > 2:
            out.append(("CHECK", n, "%d lines; use at most 2." % len(c["lines"])))
        cps = len(body.replace(" ", "")) / dur
        if cps > max_cps:
            out.append(("CHECK", n, "%.0f characters per second (limit %.0f); too fast." % (cps, max_cps)))
        if PRESENTATION.search(body):
            out.append(("FIX", n, "Letters are in pre-joined form (pasted from a design tool). Retype with normal letters."))
        if not ARABIC.search(body):
            out.append(("CHECK", n, "No Arabic letters."))
        if LATIN.search(body):
            out.append(("CHECK", n, "Contains Latin letters."))
        toks = set(re.split(r"[\s،.!؟?:]+", body))
        toks |= {t[1:] for t in toks if t.startswith("و") and len(t) > 2}
        hit = [w for w in DIALECT if w in toks]
        if "هلا والله" in body and "هلا" in hit:
            hit.remove("هلا")
        hit += [p for p in DIALECT_PHRASES if p in body]
        if hit:
            out.append(("CHECK", n, "Looks like Saudi dialect (%s). On-screen text must be Modern Standard." % "، ".join(hit)))
        if re.search(r"رفاضة|الرفاده|الرفاضه", body):
            out.append(("FIX", n, "Company name misspelled. Write الرفادة."))
        first = c["lines"][0].lstrip() if c["lines"] else ""
        if first[:1] in ".،؟!?" and ARABIC.search(body):
            out.append(("CHECK", n, "Starts with punctuation; the text may be reversed."))
    last = cues[-1]["end"]
    if last > target + 0.5:
        out.append(("FIX", 0, "Captions run to %.1f s; the video must be %d s." % (last, target)))
    if video:
        try:
            d = float(subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=nw=1:nk=1", video],
                capture_output=True, text=True, check=True).stdout.strip())
            if abs(d - target) > 1.0:
                out.append(("FIX", 0, "Video is %.1f s; it must be %d s." % (d, target)))
            if last > d + 0.1:
                out.append(("FIX", 0, "Last caption ends after the video does."))
        except (OSError, subprocess.CalledProcessError, ValueError):
            out.append(("CHECK", 0, "Could not read the video length with ffprobe."))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("captions")
    ap.add_argument("--video")
    ap.add_argument("--target-seconds", type=float, default=60.0)
    ap.add_argument("--max-words", type=int, default=8)
    ap.add_argument("--max-cps", type=float, default=15.0)
    a = ap.parse_args(argv)
    res = run(a.captions, a.video, a.target_seconds, a.max_words, a.max_cps)
    for lvl, n, msg in res:
        print("%-5s %s %s" % (lvl, ("caption %d:" % n) if n else "file:", msg))
    fixes = sum(1 for r in res if r[0] == "FIX")
    print("%d FIX, %d CHECK" % (fixes, len(res) - fixes))
    return 1 if fixes else 0


if __name__ == "__main__":
    sys.exit(main())
