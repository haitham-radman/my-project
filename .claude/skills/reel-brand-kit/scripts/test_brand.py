import copy
import json
import tempfile
import unittest
from pathlib import Path
import brand as b

FULL = {
    "colors": {"background": "#101010", "text": "#FFFFFF", "highlight": "#FFD400", "accent": None},
    "fonts": {"arabic": {"family": "IBM Plex Sans Arabic", "file": None}, "latin": {"family": None, "file": None}},
    "logo": {"file": None, "position": None, "maxWidth": None},
    "captions": {"fontSize": 72, "maxLines": 2, "highlight": "word"},
    "safe": {"top": 150, "bottom": 380, "left": 60, "right": 120},
    "audio": {"peakMaxDb": -0.5, "meanMinDb": -30, "meanMaxDb": -10},
}
EMPTY = {
    "colors": {"background": None, "text": None, "highlight": None, "accent": None},
    "fonts": {"arabic": {"family": None, "file": None}, "latin": {"family": None, "file": None}},
    "logo": {"file": None, "position": None, "maxWidth": None},
    "captions": {"fontSize": None, "maxLines": 2, "highlight": "word"},
    "safe": {"top": 150, "bottom": 380, "left": 60, "right": 120},
    "audio": {"peakMaxDb": -0.5, "meanMinDb": -30, "meanMaxDb": -10},
}
TEMPLATE = json.loads((Path(__file__).resolve().parents[1] / "templates" / "brand.json").read_text(encoding="utf-8"))


def run(brand, base="."):
    return b.check(brand, Path(base))


class Brand(unittest.TestCase):
    def test_template_is_all_pending_and_valid(self):
        pending, problems, _ = run(EMPTY)
        self.assertEqual(problems, [])
        self.assertEqual(sum(1 for _, req in pending if req), len(b.REQUIRED))

    def test_shipped_template_has_the_confirmed_brand_and_is_valid(self):
        pending, problems, _ = run(TEMPLATE)
        self.assertEqual([n for n, req in pending if req], [])
        self.assertEqual(problems, [])
        self.assertEqual((TEMPLATE["colors"]["background"], TEMPLATE["colors"]["text"], TEMPLATE["colors"]["highlight"]),
                         ("#101010", "#FFFFFF", "#FFD400"))
        self.assertEqual((TEMPLATE["fonts"]["arabic"]["family"], TEMPLATE["captions"]["fontSize"]), ("Cairo", 72))

    def test_full_is_valid(self):
        pending, problems, _ = run(FULL)
        self.assertEqual([n for n, req in pending if req], [])
        self.assertEqual(problems, [])

    def test_bad_hex_and_low_contrast(self):
        x = copy.deepcopy(FULL); x["colors"]["text"] = "blanco"
        self.assertTrue(any("#RRGGBB" in p for p in run(x)[1]))
        y = copy.deepcopy(FULL); y["colors"]["text"] = "#202020"
        self.assertTrue(any("contraste text" in p for p in run(y)[1]))

    def test_contrast_values(self):
        self.assertAlmostEqual(b.contrast("#000000", "#FFFFFF"), 21.0, places=1)

    def test_safe_and_logo_width(self):
        x = copy.deepcopy(FULL); x["safe"]["bottom"] = 1800
        self.assertTrue(any("area util" in p for p in run(x)[1]))
        y = copy.deepcopy(FULL); y["logo"]["maxWidth"] = 1000
        self.assertTrue(any("logo.maxWidth" in p for p in run(y)[1]))

    def test_missing_font_file(self):
        x = copy.deepcopy(FULL); x["fonts"]["arabic"]["file"] = "nope.ttf"
        self.assertTrue(any("no existe" in p for p in run(x, tempfile.gettempdir())[1]))

    def test_google_module(self):
        self.assertEqual(b.google_module("IBM Plex Sans Arabic"), "IBMPlexSansArabic")
        self.assertIn('"googleFontsModule": "IBMPlexSansArabic"', b.emit_ts(FULL))

    def test_emit_refuses_pending_and_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            bj = Path(d, "brand.json"); out = Path(d, "src", "brand.config.ts")
            bj.write_text(json.dumps(EMPTY)); self.assertEqual(b.main(["emit", str(bj), "--out", str(out)]), 1)
            self.assertFalse(out.exists())
            bj.write_text(json.dumps(FULL)); self.assertEqual(b.main(["emit", str(bj), "--out", str(out)]), 0)
            self.assertEqual(b.main(["emit", str(bj), "--out", str(out)]), 2)


if __name__ == "__main__":
    unittest.main()
