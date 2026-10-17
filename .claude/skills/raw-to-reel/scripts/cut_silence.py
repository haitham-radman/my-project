#!/usr/bin/env python3
"""Remove silent stretches from a talking-head video with ffmpeg.

usage: cut_silence.py INPUT OUTPUT [--noise-db -35] [--min-silence 0.5] [--pad 0.08]
Writes OUTPUT (re-encoded H.264/AAC) and prints the kept segments as JSON.
"""
import argparse
import json
import re
import subprocess
import sys


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", path])
    return float(r.stdout.strip())


def silences(path, noise_db, min_silence):
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-vn", "-af",
             f"silencedetect=noise={noise_db}dB:d={min_silence}", "-f", "null", "-"])
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    if len(starts) > len(ends):
        ends.append(duration(path))
    return list(zip(starts, ends))


def keep_segments(total, sil, pad):
    segs, cur = [], 0.0
    for s, e in sil:
        if s - cur > 0.05:
            segs.append((cur, min(s + pad, total)))
        cur = max(e - pad, 0.0)
    if total - cur > 0.05:
        segs.append((cur, total))
    return segs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--noise-db", type=float, default=-35)
    ap.add_argument("--min-silence", type=float, default=0.5)
    ap.add_argument("--pad", type=float, default=0.08)
    a = ap.parse_args()

    total = duration(a.input)
    segs = keep_segments(total, silences(a.input, a.noise_db, a.min_silence), a.pad)
    if not segs:
        sys.exit("no speech found; lower --noise-db")
    sel = "+".join(f"between(t,{s:.3f},{e:.3f})" for s, e in segs)
    r = run(["ffmpeg", "-y", "-hide_banner", "-i", a.input,
             "-vf", f"select='{sel}',setpts=N/FRAME_RATE/TB",
             "-af", f"aselect='{sel}',asetpts=N/SR/TB",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", a.output])
    if r.returncode:
        sys.exit(r.stderr[-800:])
    print(json.dumps({"original": round(total, 2),
                      "kept": round(sum(e - s for s, e in segs), 2),
                      "segments": [[round(s, 2), round(e, 2)] for s, e in segs]}))


if __name__ == "__main__":
    main()
