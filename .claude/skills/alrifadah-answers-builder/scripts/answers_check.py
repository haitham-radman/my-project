#!/usr/bin/env python3
"""Two helpers for the Al-Rifadah approved-answers list.

  python3 answers_check.py scan  pasted.txt        # private details in material you are about to use
  python3 answers_check.py lint  answers.md [--today YYYY-MM-DD]   # problems in the answers list

scan: finds emails, Saudi mobile numbers, 10-digit ID numbers, IBANs and amounts in riyals.
      Lines are printed with the match hidden, so the report itself carries no private data.
lint: checks every block of the answers list (format of answers-template.md).
FIX = must be corrected before the answer is used. CHECK = needs the user's look.
Exit code 1 if any FIX. Standard library only.
"""
import datetime
import re
import sys

DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
PRIVATE = [
    ("email address", re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")),
    ("mobile number", re.compile(r"(?<!\d)(?:\+?966|00966|0)5\d{8}(?!\d)")),
    ("ID or iqama number", re.compile(r"(?<!\d)[12]\d{9}(?!\d)")),
    ("IBAN", re.compile(r"\bSA\d{2}[0-9A-Z]{18,22}\b")),
]
AMOUNT = re.compile(r"\d[\d,.]*\s*(?:ريال|ر\.س|SAR)")
STALE_DAYS = 183
LONG_ANSWER_WORDS = 120


def private_hits(text):
    t = text.translate(DIGITS)
    hits = []
    for label, rx in PRIVATE:
        if rx.search(t):
            hits.append(label)
    return hits


def scan(text):
    out = []
    for no, line in enumerate(text.splitlines(), 1):
        t = line.translate(DIGITS)
        for label, rx in PRIVATE:
            if rx.search(t):
                out.append(("FIX", no, "%s found; remove it before using this material." % label))
        if AMOUNT.search(t):
            out.append(("CHECK", no, "an amount in riyals; keep it only if it is the policy, not one person's pay."))
    return out


def parse_blocks(text):
    found, cur = [], None
    for line in text.splitlines():
        if line.startswith("## "):
            cur = {"title": line[3:].strip(), "fields": {}}
            found.append(cur)
        elif cur is not None and line.startswith("- ") and ":" in line:
            key, val = line[2:].split(":", 1)
            cur["fields"][key.strip().lower()] = val.strip()
    return found


def field(b, prefix):
    for k, v in b["fields"].items():
        if k.startswith(prefix):
            return v
    return ""


def lint(text, today=None):
    today = today or datetime.date.today()
    out, seen = [], set()
    for b in parse_blocks(text):
        t = b["title"]
        if t.startswith("[") or not t:
            continue  # the empty template block
        if t in seen:
            out.append(("CHECK", t, "the same question appears twice."))
        seen.add(t)
        answer = field(b, "approved answer")
        source = field(b, "source")
        confirmed = field(b, "confirmed on")
        person = field(b, "needs a person").lower()
        if "[ناقص" in "".join(b["fields"].values()) or not answer:
            out.append(("CHECK", t, "not finished: a field is empty or still [ناقص]."))
        if person.startswith("yes") and answer and "[ناقص" not in answer:
            out.append(("FIX", t, "this question needs a person to decide, so no answer should be stored."))
        if not source or "[ناقص" in source:
            out.append(("CHECK", t, "no source (policy name or document)."))
        try:
            d = datetime.date.fromisoformat(confirmed)
            if (today - d).days > STALE_DAYS:
                out.append(("CHECK", t, "confirmed on %s, more than 6 months ago; is it still true?" % confirmed))
        except ValueError:
            out.append(("FIX", t, "'Confirmed on' must be a date like 2026-10-27."))
        for label in private_hits(" ".join(b["fields"].values()) + " " + t):
            out.append(("FIX", t, "contains a %s; the list must hold no personal details." % label))
        if len(answer.split()) > LONG_ANSWER_WORDS:
            out.append(("CHECK", t, "the answer is longer than %d words; a reply should be short." % LONG_ANSWER_WORDS))
    return out


def report(rows):
    for lvl, where, msg in rows:
        print("%-5s %s: %s" % (lvl, where, msg))
    fixes = sum(1 for r in rows if r[0] == "FIX")
    print("%d FIX, %d CHECK" % (fixes, len(rows) - fixes))
    return 1 if fixes else 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    today = None
    if "--today" in argv:
        i = argv.index("--today")
        today = datetime.date.fromisoformat(argv[i + 1])
        del argv[i:i + 2]
    if len(argv) != 2 or argv[0] not in ("scan", "lint"):
        print(__doc__)
        return 2
    with open(argv[1], encoding="utf-8-sig") as f:
        text = f.read()
    if argv[0] == "scan":
        return report([(l, "line %d" % n, m) for l, n, m in scan(text)])
    return report(lint(text, today))


if __name__ == "__main__":
    sys.exit(main())
