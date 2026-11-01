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


if __name__ == "__main__":
    unittest.main()
