import unittest

import claims_check as cc

SOURCE = "نخدم الحجاج بالاحترام والتعاون. نعمل كفريق واحد منذ 2015."


def run(draft, **kw):
    return cc.check(SOURCE, draft, **kw)


def kinds(rows, level):
    return [m for l, _, m in rows if l == level]


class Claims(unittest.TestCase):
    def test_faithful_draft_is_clean(self):
        draft = "spoken: نخدم الحجاج بالاحترام والتعاون\nscreen: خدمة بالاحترام والتعاون\ntext: نعمل كفريق واحد منذ ٢٠١٥."
        self.assertEqual(run(draft), [])

    def test_invented_number(self):
        rows = run("text: خدمنا 50000 حاج منذ 2015.")
        self.assertTrue(any("50000" in m for m in kinds(rows, "FIX")))
        self.assertFalse(any("2015" in m for m in kinds(rows, "FIX")))

    def test_boasts_not_said_by_the_user(self):
        rows = run("spoken: نحن الشركة الرائدة وأفضل مقدم للخدمة")
        msgs = " ".join(kinds(rows, "FIX"))
        self.assertIn("رائد", msgs)
        self.assertIn("أفضل", msgs)

    def test_boast_allowed_when_the_user_said_it(self):
        rows = cc.check("نحن شركة رائدة", "text: نحن شركة رائدة")
        self.assertEqual(rows, [])

    def test_length_limits_and_latin(self):
        rows = run("spoken: " + " ".join(["كلمة"] * 30) + "\nscreen: " + " ".join(["كلمة"] * 12) + " AB")
        checks = " ".join(kinds(rows, "CHECK"))
        self.assertIn("30 words", checks)
        self.assertIn("13 words on screen", checks)  # 12 Arabic words plus the Latin "AB"
        self.assertIn("Latin", checks)

    def test_empty_draft_is_a_fix(self):
        self.assertTrue(kinds(run("hello"), "FIX"))


if __name__ == "__main__":
    unittest.main()
