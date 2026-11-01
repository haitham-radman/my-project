import json
import tempfile
import unittest
from pathlib import Path
import script_tool as st

OK = """## gancho
هل تخسر وقتك في المونتاج
## desarrollo
اجعل الصيغة عمودية دائما
ثم اختر خطا عربيا واضحا
وابق النص داخل المنطقة الآمنة
## cierre
جرب هذا في ريلك القادم
"""


def levels(rows):
    return [lv for lv, _ in rows]


class Script(unittest.TestCase):
    def test_parse_sections_and_pages(self):
        p = st.parse(OK)
        self.assertEqual(len(p), 5)
        self.assertEqual(p[0][0], "gancho")

    def test_words_and_norm(self):
        self.assertEqual(len(st.words("كلمة  أخرى ، 3")), 3)
        self.assertEqual(st.norm("دَلوقتي،"), "دلوقتي")

    def test_wrap_two_lines_max(self):
        self.assertEqual(len(st.wrap("كلمة " * 4, 12)), 2)
        self.assertEqual(len(st.wrap("كلمة " * 12, 12)), 6)

    def test_short_script_warns_not_fails(self):
        rows, total = st.check(st.parse(OK))
        self.assertNotIn("FAIL", levels(rows))
        self.assertTrue(any("faltan" in m and "palabras" in m for _, m in rows))

    def test_too_long_fails(self):
        long = "## gancho\n" + "\n".join("كلمة " * 8 for _ in range(12))
        rows, _ = st.check(st.parse(long))
        self.assertIn("FAIL", levels(rows))

    def test_page_over_two_lines_fails(self):
        rows, _ = st.check(st.parse("## gancho\n" + "كلمة " * 14))
        self.assertTrue(any(lv == "FAIL" and "lineas" in m for lv, m in rows))

    def test_dialect_flagged(self):
        rows, _ = st.check(st.parse("## gancho\nشو هيك المونتاج"))
        self.assertTrue(any("dialecto" in m for _, m in rows))

    def test_dialect_with_prefix_and_new_markers(self):
        self.assertEqual(st.dialect_hits(["ودلوقتي", "ومش", "لازم", "كويس"]), ["دلوقتي", "كويس", "لازم", "مش"])
        self.assertEqual(st.dialect_hits(["والمونتاج", "فيديو", "وفي"]), [])

    def test_mixed_digits_and_latin(self):
        rows, _ = st.check(st.parse("## gancho\nاستخدم Remotion في ٣ خطوات ثم 5"))
        msgs = " ".join(m for _, m in rows)
        self.assertIn("mezcla cifras", msgs)
        self.assertIn("Remotion", msgs)

    def test_captions_cover_duration_without_overlap(self):
        caps = st.to_captions(st.parse(OK), seconds=30, wps=2.3)
        self.assertEqual(caps[0]["startMs"], 0)
        self.assertTrue(all(a["endMs"] <= b["startMs"] + 1 for a, b in zip(caps, caps[1:])))
        self.assertLessEqual(caps[-1]["endMs"], 30000)
        self.assertEqual(set(caps[0]), {"text", "startMs", "endMs", "timestampMs", "confidence"})

    def test_default_max_chars_catches_three_line_pages_measured_at_72px(self):
        for t in ("فالحروف المنفصلة تصعب القراءة على المشاهد", "احفظ المنشور وراجع الخطوات قبل ريلك القادم",
                  "الخطوة الثانية: اجعل الاتجاه من اليمين إلى اليسار"):
            rows, _ = st.check([("desarrollo", t)])
            self.assertTrue(any(lv == "FAIL" and "lineas" in m for lv, m in rows), t)

    def test_empty_and_overwrite(self):
        self.assertEqual(st.check([])[0][0][0], "FAIL")
        with tempfile.TemporaryDirectory() as d:
            s = Path(d, "s.md"); s.write_text(OK, encoding="utf-8"); o = Path(d, "c.json")
            self.assertEqual(st.main(["captions", str(s), "--out", str(o)]), 0)
            self.assertEqual(len(json.loads(o.read_text(encoding="utf-8"))), 5)
            self.assertEqual(st.main(["captions", str(s), "--out", str(o)]), 2)


if __name__ == "__main__":
    unittest.main()
