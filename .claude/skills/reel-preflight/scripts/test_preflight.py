import unittest
from argparse import Namespace
import preflight as pf

A = Namespace(width=1080, height=1920, fps=30, seconds=30)
ROOT = '<Composition id="Reel" component={R} width={1920} height={1080} fps={24} durationInFrames={450} />'
CFG = "export const FPS = 30;\nexport const SECONDS = 30;\nexport const D = FPS * SECONDS;\nconst W = 1080;"


class Preflight(unittest.TestCase):
    def test_parse_composition(self):
        c = pf.parse_compositions(ROOT)[0]
        self.assertEqual((c["id"], c["width"], c["fps"]), ("Reel", "1920", "24"))

    def test_bad_composition_fails(self):
        levels = [lv for lv, _ in pf.check_composition(pf.parse_compositions(ROOT)[0], 1080, 1920, 30, 30)]
        self.assertEqual(levels.count("FAIL"), 4)

    def test_consts_resolve_in_chain(self):
        self.assertEqual(pf.parse_consts(CFG), {"FPS": 30, "SECONDS": 30, "D": 900, "W": 1080})

    def test_expression_props_use_consts(self):
        pf.CONSTS.clear(); pf.CONSTS.update(pf.parse_consts(CFG + "\nconst H = 1920;"))
        c = {"width": "W", "height": "H", "fps": "FPS", "durationInFrames": "D"}
        self.assertEqual({lv for lv, _ in pf.check_composition(c, 1080, 1920, 30, 30)}, {"OK"})

    def test_unknown_expression_warns(self):
        pf.CONSTS.clear()
        c = {"width": "props.w", "height": "1920", "fps": "30", "durationInFrames": "900"}
        self.assertEqual(pf.check_composition(c, 1080, 1920, 30, 30)[0][0], "WARN")

    def test_video_clipping_and_quiet(self):
        info = {"streams": [{"codec_type": "video", "width": 1080, "height": 1920, "r_frame_rate": "30/1", "pix_fmt": "yuv420p"},
                            {"codec_type": "audio"}], "format": {"duration": "30.0"}}
        self.assertIn(("FAIL", "pico 0.0 dB: audio recortado"), pf.check_video(info, -12.0, 0.0, A))
        self.assertTrue(any(lv == "WARN" and "muy bajo" in m for lv, m in pf.check_video(info, -40.0, -20.0, A)))
        self.assertFalse(any(lv in ("FAIL", "WARN") for lv, _ in pf.check_video(info, -18.0, -3.0, A)))

    def test_video_no_audio_warns(self):
        info = {"streams": [{"codec_type": "video", "width": 1080, "height": 1920, "r_frame_rate": "30/1", "pix_fmt": "yuv420p"}],
                "format": {"duration": "30.0"}}
        self.assertIn(("WARN", "sin pista de audio"), pf.check_video(info, None, None, A))

    def test_brand_overrides_safe_and_audio(self):
        import json, tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            f = Path(d, "brand.json")
            f.write_text(json.dumps({"safe": {"top": 100, "bottom": 300, "left": 50, "right": 90},
                                     "audio": {"peakMaxDb": -2, "meanMinDb": -25, "meanMaxDb": -12}}))
            a = Namespace(width=1080, height=1920, fps=30, seconds=30, safe=None)
            self.assertIsNone(pf.load_brand(f, a))
            self.assertEqual((a.safe, a.peak_max, a.mean_min, a.mean_max), ("100,300,50,90", -2, -25, -12))
            info = {"streams": [{"codec_type": "video", "width": 1080, "height": 1920, "r_frame_rate": "30/1", "pix_fmt": "yuv420p"},
                                {"codec_type": "audio"}], "format": {"duration": "30.0"}}
            self.assertIn(("FAIL", "pico -1.0 dB: audio recortado"), pf.check_video(info, -18.0, -1.0, a))

    def test_explicit_safe_beats_brand_and_bad_brand_errors(self):
        import json, tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            f = Path(d, "brand.json"); f.write_text(json.dumps({"safe": {"top": 1, "bottom": 2, "left": 3, "right": 4}}))
            a = Namespace(safe="9,9,9,9")
            pf.load_brand(f, a)
            self.assertEqual(a.safe, "9,9,9,9")
            self.assertIn("no se puede leer", pf.load_brand(Path(d, "nope.json"), Namespace(safe=None)))

    # --- modo audio ---
    @staticmethod
    def _db(spans, total=10.0, step=0.02, voice=-20.0, noise=-50.0):
        out = []
        for i in range(int(total / step)):
            t = i * step
            out.append(voice if any(a <= t < b for a, b in spans) else noise)
        return out

    def test_voice_segments_counts_bursts_and_ignores_blips(self):
        spans = [(0.5, 1.5), (2.0, 3.0), (3.5, 4.5)]
        segs, floor = pf.voice_segments(self._db(spans + [(6.0, 6.04)]), 0.02)
        self.assertEqual(len(segs), 3)
        self.assertAlmostEqual(segs[0][0], 0.5, places=1)
        self.assertEqual(floor, -50.0)

    def test_voice_segments_merges_tiny_gaps_and_handles_empty(self):
        segs, _ = pf.voice_segments(self._db([(1.0, 2.0), (2.1, 3.0)]), 0.02)
        self.assertEqual(len(segs), 1)
        self.assertEqual(pf.voice_segments([], 0.02), ([], None))

    def test_check_audio_good_take(self):
        a = Namespace(seconds=30)
        segs = [(i * 2.0, i * 2.0 + 1.5) for i in range(14)]
        rows = pf.check_audio(29.0, -20.0, -6.0, segs, a, 14)
        self.assertEqual({lv for lv, _ in rows}, {"OK"})

    def test_check_audio_first_real_take(self):
        a = Namespace(seconds=30)
        segs = [(0.58, 2.5), (2.68, 3.1), (3.26, 3.48), (4.34, 5.74), (6.24, 6.56),
                (7.06, 7.66), (7.96, 8.4), (9.12, 10.22), (10.9, 12.34), (13.62, 14.64)]
        rows = pf.check_audio(16.2, -31.1, -12.5, segs, a, 14)
        self.assertEqual([lv for lv, _ in rows if lv != "OK"], ["FAIL", "WARN", "WARN"])

    def test_check_audio_duration_limits_and_clipping(self):
        a = Namespace(seconds=30)
        segs = [(i * 2.0, i * 2.0 + 1.5) for i in range(14)]
        self.assertEqual(pf.check_audio(31.5, -20, -6, segs, a)[0][0], "FAIL")
        self.assertEqual(pf.check_audio(26.9, -20, -6, segs, a)[0][0], "FAIL")
        self.assertEqual(pf.check_audio(31.0, -20, -6, segs, a)[0][0], "OK")
        self.assertIn(("FAIL", "pico 0.0 dB: audio recortado"), pf.check_audio(29, -10, 0.0, segs, a))

    def test_check_audio_short_fragments_and_short_pauses(self):
        a = Namespace(seconds=30)
        short = [(i * 2.0, i * 2.0 + 0.3) for i in range(14)]
        self.assertTrue(any("demasiado cortos" in m for _, m in pf.check_audio(29, -20, -6, short, a)))
        tight = [(i * 1.6, i * 1.6 + 1.5) for i in range(14)]  # pausas de 0,1 s
        self.assertTrue(any("alinear" in m for _, m in pf.check_audio(29, -20, -6, tight, a)))

    def test_check_audio_uses_brand_thresholds(self):
        a = Namespace(seconds=30, mean_min=-25, mean_max=-12, peak_max=-2)
        segs = [(i * 2.0, i * 2.0 + 1.5) for i in range(14)]
        rows = pf.check_audio(29, -27, -3, segs, a)
        self.assertTrue(any(lv == "WARN" and "muy bajo" in m for lv, m in rows))
        self.assertEqual([lv for lv, m in rows if "pico" in m], ["OK"])  # -3 < -2


if __name__ == "__main__":
    unittest.main()
