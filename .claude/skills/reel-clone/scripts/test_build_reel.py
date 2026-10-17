import unittest

from build_reel import caption_events, check_scenes, slide_html, ts

SCENES = [
    {"seconds": 3, "bg": "#000", "title": "a<b", "caption": "في 24 ثانية"},
    {"seconds": 2, "bg": "#111", "caption": "x {bad\\} y"},
]


class BuildReelTest(unittest.TestCase):
    def test_one_event_per_word_and_ends_before_scene_end(self):
        ev = caption_events(SCENES)
        self.assertEqual(len(ev), 6)
        self.assertEqual(ev[2].split(",")[2], "0:00:02.85")
        self.assertEqual(ev[-1].split(",")[2], "0:00:04.85")

    def test_override_characters_stripped(self):
        text = "".join(caption_events(SCENES)[3:])
        self.assertNotIn("{bad", text)
        self.assertNotIn("bad\\}", text)

    def test_html_escaped(self):
        self.assertIn("a&lt;b", slide_html(SCENES[0], 720, 1280))

    def test_bg_must_be_a_plain_colour(self):
        bad = {"scenes": [{"seconds": 3, "bg": "red;}body{background:url(https://x/y)}"}]}
        with self.assertRaises(SystemExit):
            check_scenes(bad)
        ok = {"scenes": [{"seconds": "3", "bg": "#1d4ed8"}]}
        self.assertEqual(check_scenes(ok)[2][0]["seconds"], 3.0)

    def test_seconds_bounded(self):
        with self.assertRaises(SystemExit):
            check_scenes({"scenes": [{"seconds": 999, "bg": "red"}]})

    def test_timestamp(self):
        self.assertEqual(ts(65.5), "0:01:05.50")


if __name__ == "__main__":
    unittest.main()
