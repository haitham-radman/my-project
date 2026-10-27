#!/usr/bin/env python3
"""Check how much spoken Arabic fits in each scene.

Input file: one scene per line, `scene | seconds | spoken line`.
Usage: python3 pace.py scenes.txt [--target-seconds 60] [--min-wps 1.5] [--max-wps 2.5]
Words per second are defaults for a warm, unhurried voice; change them if the
speaker is faster or slower. Exit code 1 if any scene is FIX.
"""
import argparse
import sys


def load(path):
    rows = []
    with open(path, encoding="utf-8-sig") as f:
        for no, line in enumerate(f, 1):
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            parts = [p.strip() for p in line.split("|", 2)]
            if len(parts) != 3:
                raise ValueError("line %d: expected `scene | seconds | text`" % no)
            rows.append((parts[0], float(parts[1]), parts[2]))
    return rows


def run(rows, target=60.0, lo=1.5, hi=2.5):
    out, total = [], sum(r[1] for r in rows)
    if abs(total - target) > 0.01:
        out.append(("FIX", "all", "Scenes add up to %g s; the video must be %g s." % (total, target)))
    for scene, sec, text in rows:
        if sec <= 0:
            out.append(("FIX", scene, "Scene has no time."))
            continue
        n = len(text.split())
        wps = n / sec
        if wps > hi:
            out.append(("FIX", scene, "%d words in %g s (%.1f/s): too fast. Cut about %d words." % (n, sec, wps, round(n - hi * sec) or 1)))
        elif wps < lo:
            out.append(("CHECK", scene, "%d words in %g s (%.1f/s): slow or empty. Add a pause on purpose or a few warm words." % (n, sec, wps)))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("scenes")
    ap.add_argument("--target-seconds", type=float, default=60.0)
    ap.add_argument("--min-wps", type=float, default=1.5)
    ap.add_argument("--max-wps", type=float, default=2.5)
    a = ap.parse_args(argv)
    rows = load(a.scenes)
    print("scene | seconds | words | words/s")
    for scene, sec, text in rows:
        n = len(text.split())
        print("%s | %g | %d | %.1f" % (scene, sec, n, n / sec if sec else 0))
    print("total words: %d" % sum(len(r[2].split()) for r in rows))
    res = run(rows, a.target_seconds, a.min_wps, a.max_wps)
    for lvl, scene, msg in res:
        print("%-5s scene %s: %s" % (lvl, scene, msg))
    fixes = sum(1 for r in res if r[0] == "FIX")
    print("%d FIX, %d CHECK" % (fixes, len(res) - fixes))
    return 1 if fixes else 0


if __name__ == "__main__":
    sys.exit(main())
