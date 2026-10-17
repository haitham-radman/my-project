import unittest

from build_card_reel import bar_filter, check_spec, offsets, plan, rich, slide_html, step_count

SPEC = {"brand": "B", "scenes": [
    {"kind": "hook", "seconds": 6, "title": "a<b *x* ~y~", "subtitle": "s", "pill": "p"},
    {"seconds": 4, "tag": {"text": "t", "color": "orange"}, "title": "T",
     "blocks": [{"type": "quote", "text": "<q>"}, {"type": "chips", "items": ["c"]}]},
]}


class BuildCardReelTest(unittest.TestCase):
    def test_rich_escapes_then_highlights(self):
        self.assertEqual(rich("a<b *x* ~y~"), "a&lt;b <b>x</b> <i>y</i>")

    def test_html_escaped_and_blocks_revealed_stepwise(self):
        sc = SPEC["scenes"][1]
        self.assertNotIn("&lt;q&gt;", slide_html(SPEC, "DejaVu Sans", sc, 0))
        self.assertIn("&lt;q&gt;", slide_html(SPEC, "DejaVu Sans", sc, 1))
        self.assertNotIn("class=chips", slide_html(SPEC, "DejaVu Sans", sc, 1))
        self.assertIn("class=chips", slide_html(SPEC, "DejaVu Sans", sc, 2))

    def test_plan_splits_scene_seconds_evenly(self):
        font, scenes = check_spec(SPEC)
        steps = plan(scenes)
        self.assertEqual([step_count(s) for s in scenes], [3, 3])
        self.assertEqual(len(steps), 6)
        self.assertAlmostEqual(sum(d for _, _, d in steps), 10.0)

    def test_offsets_account_for_crossfades(self):
        starts, total = offsets([2, 2, 2])
        self.assertEqual(starts[0], 0)
        self.assertAlmostEqual(starts[1], 1.75)
        self.assertAlmostEqual(total, 5.5)

    def test_bar_filter_has_100_segments_ending_at_total(self):
        f = bar_filter(40)
        self.assertEqual(f.count("drawbox="), 100)
        self.assertIn("gte(t,40.000)", f)

    def test_bad_input_rejected(self):
        for bad in (
            {"font": "x';}body{background:url(https://x)}", "scenes": SPEC["scenes"]},
            {"scenes": [{"seconds": 999}]},
            {"scenes": [{"seconds": 6, "blocks": [{"type": "script"}]}]},
            {"scenes": [{"seconds": 2, "blocks": [{"type": "note"}] * 3}]},
        ):
            with self.assertRaises(SystemExit):
                check_spec(bad)

    def test_unknown_colour_rejected(self):
        sc = {"seconds": 6, "tag": {"text": "t", "color": "red;}"}, "title": "x"}
        with self.assertRaises(SystemExit):
            slide_html(SPEC, "DejaVu Sans", sc, 0)


if __name__ == "__main__":
    unittest.main()
