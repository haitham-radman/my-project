import tempfile
import unittest
from pathlib import Path
import inventory as inv

DEJAVU = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
LIBERATION = Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf")


class Inventory(unittest.TestCase):
    @unittest.skipUnless(DEJAVU.exists() and LIBERATION.exists(), "fuentes del sistema no disponibles")
    def test_font_arabic_coverage(self):
        self.assertTrue(all(c in inv.cmap_codepoints(DEJAVU) for c in inv.ARABIC_PROBE))
        self.assertFalse(all(c in inv.cmap_codepoints(LIBERATION) for c in inv.ARABIC_PROBE))

    def test_unreadable_font_is_none(self):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d, "x.ttf"); f.write_bytes(b"not a font")
            self.assertIsNone(inv.cmap_codepoints(f))

    def test_missing_and_unused(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d, "public").mkdir(); Path(d, "src").mkdir()
            Path(d, "public", "used.png").write_bytes(b"x")
            Path(d, "public", "spare.png").write_bytes(b"x")
            Path(d, "src", "A.tsx").write_text('staticFile("used.png"); staticFile("gone.mp3");', encoding="utf-8")
            rows, missing = inv.build(d)
            flags = {r["file"]: r["flags"] for r in rows}
            self.assertEqual(flags["used.png"], [])
            self.assertIn("SIN USO", flags["spare.png"])
            self.assertEqual(missing, ["gone.mp3"])

    def test_missing_assets_dir(self):
        self.assertEqual(inv.main(["/nonexistent-project"]), 2)

    def test_render_summary(self):
        text = inv.render([{"file": "a.png", "kind": "imagen", "info": "1x1", "flags": ["SIN USO"]}], ["b.mp3"])
        self.assertIn("1 FALTA", text)
        self.assertIn("| b.mp3 |", text)


if __name__ == "__main__":
    unittest.main()
