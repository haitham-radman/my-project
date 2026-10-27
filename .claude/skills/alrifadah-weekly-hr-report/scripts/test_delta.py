import unittest

import delta


class DeltaChecks(unittest.TestCase):
    def test_up_down_same(self):
        self.assertEqual(delta.change(12, 10), "up 2 (20%)")
        self.assertEqual(delta.change(9, 12), "down 3 (25%)")
        self.assertEqual(delta.change(5, 5), "no change")

    def test_zero_last_week_has_no_percent(self):
        self.assertIn("no percent", delta.change(3, 0))

    def test_missing_values(self):
        self.assertEqual(delta.change(3, None), "no last-week figure")
        self.assertEqual(delta.change(None, 3), "no figure this week")

    def test_arabic_digits_and_commas(self):
        self.assertEqual(delta.num("١٢"), 12.0)
        self.assertEqual(delta.num("1,250"), 1250.0)
        self.assertIsNone(delta.num("-"))

    def test_decimal_formatting(self):
        self.assertEqual(delta.change(10.5, 10), "up 0.5 (5%)")


if __name__ == "__main__":
    unittest.main()
