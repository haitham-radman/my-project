import unittest

import numbers_check as nc


class NumberChecks(unittest.TestCase):
    def test_same_numbers_pass(self):
        self.assertEqual(nc.compare("الإجازة 30 يوماً", "الإجازة ٣٠ يوماً"), ([], []))

    def test_invented_number_is_extra(self):
        extra, _ = nc.compare("الإجازة 30 يوماً", "الإجازة 21 يوماً")
        self.assertEqual(extra, ["21"])

    def test_left_out_number_is_missing(self):
        _, missing = nc.compare("قبل 5 أيام وبعد 10 أيام", "قبل 5 أيام")
        self.assertEqual(missing, ["10"])

    def test_decimals_and_thousands(self):
        self.assertEqual(nc.compare("مبلغ 1,250.5", "مبلغ ١٢٥٠٫٥"), ([], []))


if __name__ == "__main__":
    unittest.main()
