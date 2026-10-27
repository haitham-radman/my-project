#!/usr/bin/env python3
"""Check that every number in a policy summary also appears in the policy.

Usage: python3 numbers_check.py policy.txt summary.txt
Arabic-Indic digits (٠١٢) and Western digits (012) are treated the same.
Also reports numbers in the policy that the summary leaves out (CHECK).
Exit code 1 if the summary has a number the policy does not contain (FIX).
"""
import re
import sys

TABLE = str.maketrans("٠١٢٣٤٥٦٧٨٩٫٬", "0123456789.,")
NUM = re.compile(r"\d+(?:[.,]\d+)*")


def numbers(text):
    found = set()
    for m in NUM.findall(text.translate(TABLE)):
        found.add(m.replace(",", ""))
    return found


def compare(policy, summary):
    p, s = numbers(policy), numbers(summary)
    return sorted(s - p), sorted(p - s)


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 2:
        print(__doc__)
        return 2
    texts = []
    for path in argv:
        with open(path, encoding="utf-8-sig") as f:
            texts.append(f.read())
    extra, missing = compare(*texts)
    for n in extra:
        print("FIX   %s is in the summary but not in the policy." % n)
    for n in missing:
        print("CHECK %s is in the policy but not in the summary. Is it needed?" % n)
    print("%d FIX, %d CHECK" % (len(extra), len(missing)))
    return 1 if extra else 0


if __name__ == "__main__":
    sys.exit(main())
