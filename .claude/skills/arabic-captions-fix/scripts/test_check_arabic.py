import unittest
from check_arabic import check_text

BAD = '''
import {loadFont} from "@remotion/google-fonts/Cairo";
const Cap = ({text}) => (
  <div style={{whiteSpace: "nowrap", letterSpacing: 4}}>
    {text.split("").map((c, i) => <span style={{display: "inline-block"}}>{c}</span>)}
  </div>
);
const label = "مرحبا";
'''

GOOD = '''
import {loadFont} from "@remotion/google-fonts/Cairo";
const Cap = ({words}) => (
  <div dir="rtl" lang="ar" style={{maxWidth: 900, whiteSpace: "normal"}}>
    {words.map((w) => <span style={{display: "inline-block"}}>{w}</span>)}
  </div>
);
const label = "مرحبا";
'''


def codes(text):
    return {c for _, _, c, _ in check_text(text)}


class CheckArabic(unittest.TestCase):
    def test_bad_sample_hits_every_rule(self):
        self.assertEqual(codes(BAD), {"A1", "A2", "A3", "A5"})

    def test_a1_is_error_with_arabic(self):
        levels = {c: lv for _, lv, c, _ in check_text(BAD)}
        self.assertEqual(levels["A1"], "error")

    def test_good_sample_is_clean(self):
        self.assertEqual(check_text(GOOD), [])

    def test_missing_arabic_font(self):
        self.assertIn("A4", codes('<div dir="rtl">مرحبا</div>'))

    def test_english_only_file_is_ignored(self):
        self.assertEqual(check_text('const x = "hello".split("");'), [])

    def test_letterspacing_zero_is_fine(self):
        self.assertNotIn("A2", codes(GOOD + "\nconst s = {letterSpacing: 0};"))


class ScanProject(unittest.TestCase):
    def test_a4_is_per_project(self):
        import tempfile
        from pathlib import Path
        from check_arabic import scan
        with tempfile.TemporaryDirectory() as d:
            Path(d, "Reel.tsx").write_text('<div dir="rtl">مرحبا</div>', encoding="utf-8")
            self.assertIn("A4", {r[3] for r in scan(d)})
            Path(d, "Captions.tsx").write_text('import "@remotion/google-fonts/Cairo";', encoding="utf-8")
            self.assertNotIn("A4", {r[3] for r in scan(d)})


if __name__ == "__main__":
    unittest.main()
