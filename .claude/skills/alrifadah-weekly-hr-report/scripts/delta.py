#!/usr/bin/env python3
"""Week-over-week changes for the HR report, so no one calculates by hand.

Input file: one metric per line, `name | this week | last week`.
Usage: python3 delta.py figures.txt
A missing last-week value (`-`) gives no change. Arabic-Indic digits are accepted.
"""
import sys

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩٫", "0123456789.")


def num(text):
    t = text.strip().translate(ARABIC_DIGITS).replace(",", "")
    if t in ("", "-"):
        return None
    return float(t)


def fmt(x):
    return ("%d" % x) if float(x).is_integer() else ("%.1f" % x)


def rows(path):
    out = []
    with open(path, encoding="utf-8-sig") as f:
        for no, line in enumerate(f, 1):
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            p = [x.strip() for x in line.split("|")]
            if len(p) != 3:
                raise ValueError("line %d: expected `name | this week | last week`" % no)
            out.append((p[0], num(p[1]), num(p[2])))
    return out


def change(this, last):
    if this is None:
        return "no figure this week"
    if last is None:
        return "no last-week figure"
    d = this - last
    if d == 0:
        return "no change"
    word = "up" if d > 0 else "down"
    if last == 0:
        return "%s %s (last week was 0, no percent)" % (word, fmt(abs(d)))
    return "%s %s (%s%%)" % (word, fmt(abs(d)), fmt(abs(d) / abs(last) * 100))


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 1:
        print(__doc__)
        return 2
    print("metric | this week | last week | change")
    for name, this, last in rows(argv[0]):
        print("%s | %s | %s | %s" % (name, "-" if this is None else fmt(this),
                                      "-" if last is None else fmt(last), change(this, last)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
