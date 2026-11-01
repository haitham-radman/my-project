import unittest
import post_tool as pt

GOOD = """## tiktok
(nota que se ignora)
اجعل ريلك عموديا وواضحا، وجرب هذه الخطوات اليوم.
#مونتاج #ريلز #تيك_توك

## instagram
خطوات بسيطة تجعل الريل أوضح وأسهل في القراءة.
#مونتاج #ريلز
"""


def lv(rows):
    return [a for a, _ in rows]


class Post(unittest.TestCase):
    def test_parse_ignores_notes(self):
        s = pt.parse(GOOD)
        self.assertNotIn("nota", s["tiktok"])
        self.assertEqual(set(s), {"tiktok", "instagram"})

    def test_good_is_clean(self):
        self.assertEqual({x for x in lv(pt.check(pt.parse(GOOD)))}, {"OK"})

    def test_missing_section_fails(self):
        self.assertIn("FAIL", lv(pt.check({"tiktok": "نص #وسم"})))

    def test_too_many_hashtags_and_chars(self):
        s = {"tiktok": "نص " + " ".join(f"#وسم{i}" for i in range(6)), "instagram": "نص"}
        self.assertTrue(any(l == "FAIL" and "hashtags" in m for l, m in pt.check(s)))
        s2 = {"tiktok": "ا" * 2201, "instagram": "نص"}
        self.assertTrue(any(l == "FAIL" and "caracteres" in m for l, m in pt.check(s2)))

    def test_emoji_counts_two(self):
        self.assertEqual(pt.length("😀"), 2)
        self.assertEqual(pt.length("ابج"), 3)

    def test_bad_and_duplicate_hashtags(self):
        s = {"tiktok": "نص #مونتاج #مونتاج #سرِيع #بدون-فراغ", "instagram": "نص آخر"}
        msgs = " ".join(m for _, m in pt.check(s))
        self.assertIn("repetidos", msgs)
        self.assertIn("mal formados", msgs)

    def test_verificar_blocks(self):
        s = {"tiktok": "يزيد المشاهدات [VERIFICAR] #وسم", "instagram": "نص"}
        self.assertTrue(any(l == "FAIL" and "VERIFICAR" in m for l, m in pt.check(s)))

    def test_dialect_and_identical(self):
        d = pt.dialect_fn()
        self.assertIsNotNone(d)
        s = {"tiktok": "شو رأيك؟ #وسم", "instagram": "شو رأيك؟ #وسم"}
        msgs = " ".join(m for _, m in pt.check(s, dialect=d))
        self.assertIn("dialecto", msgs)
        self.assertIn("identicas", msgs)

    def test_unverified_claims_warn(self):
        for txt in ("يزيد مشاهداتك 10 اضعاف", "نتائج مضمونة بنسبة 50%", "ضمان النجاح"):
            rows = pt.check({"tiktok": txt, "instagram": "نص آخر"})
            self.assertTrue(any(l == "WARN" and "afirmacion" in m for l, m in rows), txt)
        self.assertFalse(any("afirmacion" in m for _, m in pt.check(pt.parse(GOOD))))

    def test_tag_in_arabic_with_underscore_is_valid(self):
        self.assertTrue(pt.VALID_TAG.match("#تيك_توك"))


if __name__ == "__main__":
    unittest.main()
