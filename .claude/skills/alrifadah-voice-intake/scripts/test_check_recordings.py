import os
import subprocess
import tempfile
import unittest

import check_recordings as cr


def tone(path, seconds, volume=1.0, lead=0.0, total=None):
    """A sine tone `seconds` long at `volume`, optionally preceded by silence and padded to `total`."""
    flt = ["volume=%s" % volume]
    if lead:
        flt.append("adelay=%d:all=1" % int(lead * 1000))
    if total:
        flt.append("apad=whole_dur=%s" % total)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
                    "sine=frequency=300:sample_rate=44100:duration=%s" % seconds,
                    "-af", ",".join(flt), path], check=True)


def has(problems, level, scene, part):
    return any(l == level and n == scene and part in t for l, n, t in problems)


class Recordings(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def p(self, n):
        return os.path.join(self.d, "scene%d.wav" % n)

    def test_good_set_has_no_problems(self):
        for n, s in [(1, 4), (2, 9), (3, 14), (4, 14), (5, 14)]:
            tone(self.p(n), s, volume=4.0)
        found, problems = cr.check(self.d)
        self.assertEqual(found, 5)
        self.assertEqual(problems, [])

    def test_too_long_is_a_fix(self):
        tone(self.p(1), 7, volume=4.0)
        _, problems = cr.check(self.d)
        self.assertTrue(has(problems, "FIX", 1, "longer than its 5 s slot"))

    def test_missing_scenes_are_reported(self):
        tone(self.p(1), 4, volume=4.0)
        _, problems = cr.check(self.d)
        self.assertTrue(has(problems, "CHECK", 2, "no file found"))

    def test_quiet_and_clipped(self):
        tone(self.p(1), 4, volume=0.01)
        tone(self.p(2), 9, volume=40.0)
        _, problems = cr.check(self.d)
        self.assertTrue(has(problems, "CHECK", 1, "very quiet"))
        self.assertTrue(has(problems, "CHECK", 2, "distorted"))

    def test_leading_silence_and_short_file(self):
        tone(self.p(3), 3, volume=4.0, lead=2.5, total=15)
        tone(self.p(4), 2, volume=4.0)
        _, problems = cr.check(self.d)
        self.assertTrue(has(problems, "CHECK", 3, "before the first word"))
        self.assertTrue(has(problems, "CHECK", 4, "some words may be missing"))

    def test_uneven_loudness(self):
        tone(self.p(1), 4, volume=4.0)
        tone(self.p(2), 9, volume=0.5)
        _, problems = cr.check(self.d)
        self.assertTrue(has(problems, "CHECK", 0, "loudness differs"))

    def test_unreadable_file_is_a_fix(self):
        with open(self.p(1), "wb") as f:
            f.write(b"not audio")
        _, problems = cr.check(self.d)
        self.assertTrue(has(problems, "FIX", 1, "cannot be read"))

    def test_exit_codes(self):
        self.assertEqual(cr.main([self.d]), 1)  # nothing found
        tone(self.p(1), 4, volume=4.0)
        self.assertEqual(cr.main([self.d]), 0)  # missing scenes are only CHECK
        tone(self.p(2), 12, volume=4.0)
        self.assertEqual(cr.main([self.d]), 1)  # too long


if __name__ == "__main__":
    unittest.main()
