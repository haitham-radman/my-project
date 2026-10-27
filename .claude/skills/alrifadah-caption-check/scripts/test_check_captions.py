import os
import tempfile
import unittest

import check_captions as cc


def srt(*cues):
    return "\n\n".join("%d\n%s --> %s\n%s" % (i + 1, a, b, t) for i, (a, b, t) in enumerate(cues)) + "\n"


def check(text, **kw):
    with tempfile.NamedTemporaryFile("w", suffix=".srt", delete=False, encoding="utf-8") as f:
        f.write(text)
    try:
        return cc.run(f.name, **kw)
    finally:
        os.unlink(f.name)


def has(res, level, part):
    return any(l == level and part in m for l, _, m in res)


class CaptionChecks(unittest.TestCase):
    def test_clean_file_has_no_findings(self):
        t = srt(("00:00:00,000", "00:00:04,000", "أهلاً بكم في شركة الرفادة"),
                ("00:00:04,000", "00:01:00,000", "نتمنى لكم بداية موفقة"))
        self.assertEqual(check(t), [])

    def test_dialect_on_screen_is_flagged(self):
        t = srt(("00:00:00,000", "00:00:04,000", "هلا والله نورتونا"))
        self.assertTrue(has(check(t), "CHECK", "Saudi dialect"))

    def test_dialect_with_attached_and(self):
        t = srt(("00:00:00,000", "00:00:06,000", "ونبغاكم تحضرون بدري"))
        self.assertTrue(has(check(t), "CHECK", "Saudi dialect"))

    def test_presentation_forms_are_a_fix(self):
        t = srt(("00:00:00,000", "00:00:04,000", "ﻣﺎ"))
        self.assertTrue(has(check(t), "FIX", "pre-joined"))

    def test_misspelled_company_name(self):
        t = srt(("00:00:00,000", "00:00:04,000", "أهلاً بكم في شركة الرفاضة"))
        self.assertTrue(has(check(t), "FIX", "misspelled"))

    def test_too_long_and_too_many_words(self):
        t = srt(("00:00:00,000", "00:00:02,000", "كلمة " * 12))
        r = check(t)
        self.assertTrue(has(r, "CHECK", "words"))
        self.assertTrue(has(r, "CHECK", "too fast"))

    def test_overlap_and_length(self):
        t = srt(("00:00:00,000", "00:00:05,000", "مرحباً بكم"),
                ("00:00:04,000", "00:01:10,000", "نتمنى لكم التوفيق"))
        r = check(t)
        self.assertTrue(has(r, "FIX", "Overlaps"))
        self.assertTrue(has(r, "FIX", "must be 60"))

    def test_mixed_digits(self):
        t = srt(("00:00:00,000", "00:00:04,000", "الدوام ٨ صباحاً"),
                ("00:00:04,000", "00:00:08,000", "حتى 4 مساءً"))
        self.assertTrue(has(check(t), "CHECK", "digits"))

    def test_not_utf8(self):
        with tempfile.NamedTemporaryFile("wb", suffix=".srt", delete=False) as f:
            f.write("أهلاً".encode("cp1256"))
        try:
            self.assertTrue(has(cc.run(f.name), "FIX", "UTF-8"))
        finally:
            os.unlink(f.name)


if __name__ == "__main__":
    unittest.main()
