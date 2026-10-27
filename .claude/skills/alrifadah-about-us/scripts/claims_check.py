#!/usr/bin/env python3
"""Check an Al-Rifadah "about us" draft against what the user actually said.

Usage: python3 claims_check.py source.txt draft.txt [--spoken-max 22] [--screen-max 8]

source.txt = the user's own words (what the company does, values, things to avoid).
draft.txt  = lines starting with `spoken:` (Saudi voice, scene 2), `screen:` (on-screen,
             Modern Standard) or `text:` (a longer paragraph for documents).
FIX   = a claim the user never made: a number, or a boast such as "the best" or "leading".
CHECK = too long for its use, or Latin letters.
Exit code 1 if any FIX. Standard library only.
"""
import re
import sys

DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩٫٬", "0123456789.,")
NUM = re.compile(r"\d+(?:[.,]\d+)*")
# Stems of boasts. A draft may use one only if the user's own words contain it.
BOASTS = ["أفضل", "رائد", "الأكبر", "أكبر", "أعرق", "الأقدم", "معتمد", "حاصل", "جائز", "جوائز", "عالمي", "الأولى", "الوحيد", "رقم 1", "متميز"]
ARABIC_PUNCT = re.compile(r"[،؛؟.,!:;()\"'«»]")


def numbers(text):
    return {n.replace(",", "") for n in NUM.findall(text.translate(DIGITS))}


def parse(draft):
    rows = []
    for no, line in enumerate(draft.splitlines(), 1):
        for kind in ("spoken", "screen", "text"):
            if line.startswith(kind + ":"):
                rows.append((kind, no, line[len(kind) + 1:].strip()))
    return rows


def words(s):
    return [w for w in ARABIC_PUNCT.sub(" ", s).split() if w]


def check(source, draft, spoken_max=22, screen_max=8):
    out = []
    src_nums = numbers(source)
    for kind, no, body in parse(draft):
        where = "line %d (%s)" % (no, kind)
        for n in sorted(numbers(body) - src_nums):
            out.append(("FIX", where, "the number %s is not in your words." % n))
        for b in BOASTS:
            if b in body and b not in source:
                out.append(("FIX", where, "'%s' is a claim you did not make." % b))
        n_words = len(words(body))
        if kind == "spoken" and n_words > spoken_max:
            out.append(("CHECK", where, "%d words; scene 2 fits about %d in 10 seconds." % (n_words, spoken_max)))
        if kind == "screen" and n_words > screen_max:
            out.append(("CHECK", where, "%d words on screen; keep it to %d." % (n_words, screen_max)))
        if re.search(r"[A-Za-z]", body):
            out.append(("CHECK", where, "contains Latin letters."))
    if not parse(draft):
        out.append(("FIX", "draft", "no `spoken:`, `screen:` or `text:` lines found."))
    return out


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    smax, cmax = 22, 8
    for flag, name in (("--spoken-max", "s"), ("--screen-max", "c")):
        if flag in argv:
            i = argv.index(flag)
            v = int(argv[i + 1])
            del argv[i:i + 2]
            if name == "s":
                smax = v
            else:
                cmax = v
    if len(argv) != 2:
        print(__doc__)
        return 2
    texts = []
    for p in argv:
        with open(p, encoding="utf-8-sig") as f:
            texts.append(f.read())
    rows = check(texts[0], texts[1], smax, cmax)
    for lvl, where, msg in rows:
        print("%-5s %s: %s" % (lvl, where, msg))
    fixes = sum(1 for r in rows if r[0] == "FIX")
    print("%d FIX, %d CHECK" % (fixes, len(rows) - fixes))
    return 1 if fixes else 0


if __name__ == "__main__":
    sys.exit(main())
