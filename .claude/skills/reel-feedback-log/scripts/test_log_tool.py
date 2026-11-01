import json
import tempfile
import unittest
from pathlib import Path
import log_tool as lt


def base():
    recs = []
    lt.add(recs, "caja", "tema de prueba", "pregunta", "لماذا؟", "2026-11-01")
    return recs


class Log(unittest.TestCase):
    def test_add_and_duplicate(self):
        recs = base()
        with self.assertRaises(ValueError):
            lt.add(recs, "caja", "x", "pregunta", "y", "2026-11-01")
        lt.add(recs, "caja", "x", "pregunta", "y", "2026-11-02")  # otro dia: valido
        self.assertEqual(len(recs), 2)

    def test_add_validates(self):
        for args in (("Mi Reel", "t", "pregunta", "h", "2026-11-01"), ("a", "t", "raro", "h", "2026-11-01"),
                     ("a", "t", "pregunta", "h", "ayer")):
            with self.assertRaises(ValueError):
                lt.add([], *args)

    def test_metrics_partial_update_and_errors(self):
        recs = base()
        lt.set_metrics(recs, "caja", "tiktok", {"views": 100, "likes": None}, "2026-11-03")
        lt.set_metrics(recs, "caja", "tiktok", {"saves": 7}, "2026-11-04")
        self.assertEqual(recs[0]["metrics"]["tiktok"], {"views": 100, "saves": 7, "as_of": "2026-11-04"})
        for bad in (("youtube", {"views": 1}), ("tiktok", {"views": -1}), ("tiktok", {"views": None})):
            with self.assertRaises(ValueError):
                lt.set_metrics(recs, "caja", bad[0], bad[1], "2026-11-04")
        with self.assertRaises(KeyError):
            lt.set_metrics(recs, "nope", "tiktok", {"views": 1}, "2026-11-04")

    def test_correction_needs_real_skill_and_status_flow(self):
        recs = base()
        with self.assertRaises(ValueError):
            lt.add_correction(recs, "caja", "skill-que-no-existe", "x")
        lt.add_correction(recs, "caja", "arabic-captions-fix", "letras sueltas")
        lt.set_status(recs, "caja", 1, "aplicada")
        self.assertEqual(recs[0]["corrections"][0]["status"], "aplicada")
        with self.assertRaises(ValueError):
            lt.set_status(recs, "caja", 2, "aplicada")

    def test_report_small_sample_and_recurrence(self):
        recs = base()
        lt.set_metrics(recs, "caja", "tiktok", {"views": 200}, "2026-11-03")
        lt.add(recs, "otro", "t", "pregunta", "h", "2026-11-02")
        lt.set_metrics(recs, "otro", "tiktok", {"views": 400}, "2026-11-03")
        for s in ("caja", "otro"):
            lt.add_correction(recs, s, "arabic-captions-fix", "texto cortado")
        out = lt.report(recs)
        self.assertIn("media=300", out)
        self.assertIn("muestra pequena", out)
        self.assertIn("RECURRENTE", out)

    def test_report_flags_unequal_ages(self):
        recs = base()
        lt.set_metrics(recs, "caja", "tiktok", {"views": 100}, "2026-11-02")   # 1 dia
        lt.add(recs, "viejo", "t", "pregunta", "h", "2026-10-01")
        lt.set_metrics(recs, "viejo", "tiktok", {"views": 900}, "2026-11-02")  # 32 dias
        out = lt.report(recs)
        self.assertIn("no comparables", out)
        self.assertIn("no una causa", out)

    def test_applied_corrections_are_not_recurrent(self):
        recs = base()
        lt.add_correction(recs, "caja", "reel-export", "a"); lt.add_correction(recs, "caja", "reel-export", "b")
        lt.set_status(recs, "caja", 1, "aplicada"); lt.set_status(recs, "caja", 2, "descartada")
        self.assertNotIn("RECURRENTE", lt.report(recs))

    def test_validate(self):
        recs = base()
        self.assertEqual(lt.validate(recs), [])
        recs[0]["metrics"] = {"tiktok": {"views": "mucho"}, "x": {}}
        recs[0]["corrections"] = [{"skill": "no-existe", "what": "x", "status": "rara"}]
        self.assertEqual(len(lt.validate(recs)), 4)

    def test_roundtrip_and_bad_json(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d, "sub", "log.jsonl")
            lt.write(p, base())
            self.assertEqual(lt.read(p)[0]["hook"], "لماذا؟")
            p.write_text("{no json}\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                lt.read(p)
            self.assertEqual(lt.main(["check", str(p)]), 2)


if __name__ == "__main__":
    unittest.main()
