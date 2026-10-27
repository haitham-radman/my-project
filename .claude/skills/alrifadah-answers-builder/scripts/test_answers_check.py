import datetime
import unittest

import answers_check as ac

TODAY = datetime.date(2026, 10, 27)

GOOD = """# شركة الرفادة - ردود معتمدة
Last updated: 2026-10-27   Confirmed by: user

## أين أجد نموذج الإجازة؟
- Approved answer (Modern Standard Arabic): النموذج متوفر لدى الموارد البشرية.
- Source (policy name or document, where the full text is): سياسة الإجازات
- Confirmed on: 2026-10-20
- Who decides if the case is special: مدير الموارد البشرية
- Needs a person to decide before any reply? (yes / no): no
"""


def kinds(rows, level):
    return [m for l, _, m in rows if l == level]


class Scan(unittest.TestCase):
    def test_finds_private_details_and_hides_them(self):
        text = "راسلني على ahmed@example.com أو 0551234567\nهويتي ١٠٢٣٤٥٦٧٨٩\nالراتب 9,000 ريال"
        rows = ac.scan(text)
        msgs = " | ".join(m for _, _, m in rows)
        self.assertIn("email address", msgs)
        self.assertIn("mobile number", msgs)
        self.assertIn("ID or iqama number", msgs)
        self.assertIn("amount in riyals", msgs)
        self.assertNotIn("ahmed@example.com", msgs)
        self.assertNotIn("0551234567", msgs)

    def test_clean_text_has_no_hits(self):
        self.assertEqual(ac.scan("متى يبدأ الدوام؟ يبدأ الدوام الساعة التاسعة."), [])


class Lint(unittest.TestCase):
    def test_good_list_is_clean(self):
        self.assertEqual(ac.lint(GOOD, TODAY), [])

    def test_template_block_is_skipped(self):
        self.assertEqual(ac.lint(GOOD + "\n## [السؤال بصيغة عامة]\n- Approved answer (Modern Standard Arabic): [ناقص]\n", TODAY), [])

    def test_stale_and_bad_date(self):
        old = GOOD.replace("2026-10-20", "2026-01-02")
        self.assertTrue(any("6 months" in m for m in kinds(ac.lint(old, TODAY), "CHECK")))
        bad = GOOD.replace("2026-10-20", "قريباً")
        self.assertTrue(any("must be a date" in m for m in kinds(ac.lint(bad, TODAY), "FIX")))

    def test_person_must_decide_means_no_stored_answer(self):
        s = GOOD.replace("(yes / no): no", "(yes / no): yes")
        self.assertTrue(any("needs a person" in m for m in kinds(ac.lint(s, TODAY), "FIX")))

    def test_private_details_inside_an_answer(self):
        s = GOOD.replace("لدى الموارد البشرية.", "اتصل على 0551234567.")
        self.assertTrue(any("mobile number" in m for m in kinds(ac.lint(s, TODAY), "FIX")))

    def test_unfinished_duplicate_and_missing_source(self):
        s = GOOD + "\n## أين أجد نموذج الإجازة؟\n- Approved answer (Modern Standard Arabic): [ناقص]\n- Confirmed on: 2026-10-20\n"
        rows = ac.lint(s, TODAY)
        msgs = " | ".join(m for _, _, m in rows)
        self.assertIn("twice", msgs)
        self.assertIn("not finished", msgs)
        self.assertIn("no source", msgs)


if __name__ == "__main__":
    unittest.main()
