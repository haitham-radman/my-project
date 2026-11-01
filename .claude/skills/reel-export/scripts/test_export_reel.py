import tempfile
import unittest
from pathlib import Path
import export_reel as ex


def info(w=1080, h=1920, fps="30/1", vc="h264", pix="yuv420p", ac="aac"):
    s = [{"codec_type": "video", "width": w, "height": h, "r_frame_rate": fps, "codec_name": vc, "pix_fmt": pix}]
    if ac:
        s.append({"codec_type": "audio", "codec_name": ac})
    return {"streams": s, "format": {}}


class Export(unittest.TestCase):
    def test_ok(self):
        self.assertEqual(ex.problems(info()), ([], []))

    def test_wrong_resolution_and_fps_are_fatal(self):
        fatal, fixable = ex.problems(info(w=1920, h=1080, fps="24/1"))
        self.assertEqual((len(fatal), fixable), (2, []))

    def test_codec_is_fixable(self):
        fatal, fixable = ex.problems(info(vc="hevc", pix="yuv444p", ac="mp3"))
        self.assertEqual((fatal, len(fixable)), ([], 3))

    def test_no_audio_is_fatal(self):
        self.assertEqual(len(ex.problems(info(ac=None))[0]), 1)

    def test_name(self):
        self.assertEqual(ex.target_name("2026-11-01", "caja", "tiktok"), "2026-11-01_caja_tiktok.mp4")

    def test_bad_slug_rejected(self):
        self.assertEqual(ex.main(["x.mp4", "--slug", "Mi Reel"]), 2)

    def test_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            v = Path(d, "r.mp4"); v.write_bytes(b"x")
            Path(d, "o").mkdir(); Path(d, "o", "2026-11-01_a_tiktok.mp4").write_bytes(b"old")
            self.assertEqual(ex.main([str(v), "--slug", "a", "--out", str(Path(d, "o")), "--date", "2026-11-01"]), 2)


if __name__ == "__main__":
    unittest.main()
