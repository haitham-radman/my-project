import os
import subprocess
import tempfile
import unittest

import add_voice as av


def tone(path, seconds):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
                    "sine=frequency=440:duration=%s" % seconds, path], check=True)


def silent_video(path, seconds=60):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
                    "color=c=black:s=320x180:d=%s" % seconds, "-pix_fmt", "yuv420p", path], check=True)


class AddVoice(unittest.TestCase):
    def test_plan_flags_long_and_missing(self):
        with tempfile.TemporaryDirectory() as d:
            tone(os.path.join(d, "scene1.wav"), 4)
            tone(os.path.join(d, "scene2.wav"), 12)
            found, problems = av.plan(d)
            self.assertEqual([f[0] for f in found], [1, 2])
            self.assertTrue(any(l == "FIX" and "scene2" in t for l, t in problems))
            self.assertTrue(any(l == "CHECK" and "scene3" in t for l, t in problems))

    def test_builds_audio_at_the_right_times(self):
        with tempfile.TemporaryDirectory() as d:
            vid = os.path.join(d, "v.mp4")
            silent_video(vid)
            rec = os.path.join(d, "rec")
            os.mkdir(rec)
            for n, s in [(1, 4), (2, 9), (3, 14), (4, 14), (5, 14)]:
                tone(os.path.join(rec, "scene%d.wav" % n), s)
            out = os.path.join(d, "out.mp4")
            self.assertEqual(av.main(["--video", vid, "--audio-dir", rec, "--out", out]), 0)
            streams = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type",
                                      "-of", "csv=p=0", out], capture_output=True, text=True).stdout.split()
            self.assertIn("audio", streams)
            self.assertAlmostEqual(av.duration(out), 60.0, delta=0.6)
            # quiet gap between scene 1 (ends 4 s) and scene 2 (starts 5 s)
            vol = subprocess.run(["ffmpeg", "-ss", "4.2", "-t", "0.5", "-i", out, "-vn", "-af", "volumedetect",
                                  "-f", "null", "-"], capture_output=True, text=True).stderr
            self.assertIn("mean_volume: -91", vol)
            loud = subprocess.run(["ffmpeg", "-ss", "5.5", "-t", "0.5", "-i", out, "-vn", "-af", "volumedetect",
                                   "-f", "null", "-"], capture_output=True, text=True).stderr
            self.assertNotIn("mean_volume: -91", loud)

    def test_refuses_existing_output_and_long_scene(self):
        with tempfile.TemporaryDirectory() as d:
            vid = os.path.join(d, "v.mp4")
            silent_video(vid, 10)
            rec = os.path.join(d, "rec")
            os.mkdir(rec)
            tone(os.path.join(rec, "scene1.wav"), 9)
            out = os.path.join(d, "out.mp4")
            self.assertEqual(av.main(["--video", vid, "--audio-dir", rec, "--out", out]), 1)
            self.assertFalse(os.path.exists(out))
            open(out, "w").close()
            tone(os.path.join(rec, "scene1.wav"), 3)
            self.assertEqual(av.main(["--video", vid, "--audio-dir", rec, "--out", out]), 1)
            self.assertEqual(os.path.getsize(out), 0)


if __name__ == "__main__":
    unittest.main()
