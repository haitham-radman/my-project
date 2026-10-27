import unittest

import pace


class PaceChecks(unittest.TestCase):
    def test_fits(self):
        rows = [("1", 30, " ".join(["كلمة"] * 60)), ("2", 30, " ".join(["كلمة"] * 60))]
        self.assertEqual(pace.run(rows), [])

    def test_too_fast_is_a_fix(self):
        rows = [("1", 10, " ".join(["كلمة"] * 40)), ("2", 50, " ".join(["كلمة"] * 100))]
        r = pace.run(rows)
        self.assertEqual(r[0][0], "FIX")
        self.assertIn("too fast", r[0][2])

    def test_wrong_total(self):
        r = pace.run([("1", 50, " ".join(["كلمة"] * 100))])
        self.assertTrue(any("must be 60" in m for _, _, m in r))

    def test_slow_is_a_check(self):
        r = pace.run([("1", 30, "كلمة"), ("2", 30, " ".join(["كلمة"] * 60))])
        self.assertEqual(r[0][0], "CHECK")

    def test_bad_line_raises(self):
        import tempfile, os
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("only one field\n")
        try:
            with self.assertRaises(ValueError):
                pace.load(f.name)
        finally:
            os.unlink(f.name)


if __name__ == "__main__":
    unittest.main()
