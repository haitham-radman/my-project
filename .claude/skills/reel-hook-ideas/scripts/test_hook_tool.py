import unittest
import hook_tool as ht

GOOD = """# cabecera
pregunta | لماذا يبدو فيديوك غير احترافي؟
error | أخطاء تفسد كل ريل عمودي
promesa | رتب ريلك في خمس خطوات
contraste | نص صغير أم كبير؟ اختر الأوضح
lista | ثلاثة أخطاء في خط الترجمة
"""


def msgs(rows):
    return " ".join(m for _, m in rows)


class Hooks(unittest.TestCase):
    def test_parse(self):
        hooks, errs = ht.parse(GOOD + "sin barra\nraro | نص\nlista |\n")
        self.assertEqual(len(hooks), 5)
        self.assertEqual(len(errs), 3)

    def test_good_is_clean(self):
        hooks, errs = ht.parse(GOOD)
        rows = ht.check(hooks, errs)
        self.assertEqual({lv for lv, _ in rows}, {"OK"}, msgs(rows))

    def test_too_long_fails(self):
        hooks, errs = ht.parse("pregunta | " + "كلمة " * 9)
        self.assertTrue(any(lv == "FAIL" and "palabras" in m for lv, m in ht.check(hooks, errs)))

    def test_three_lines_fails(self):
        hooks, errs = ht.parse("pregunta | " + "كلمةطويلةجدا " * 6)
        self.assertTrue(any(lv == "FAIL" and "2 lineas" in m for lv, m in ht.check(hooks, errs, max_words=10)))

    def test_dialect_claim_cliche(self):
        hooks, errs = ht.parse("pregunta | شو رأيك؟\npromesa | يزيد مشاهداتك 10 اضعاف\nerror | هل تعلم هذا الخطأ")
        m = msgs(ht.check(hooks, errs))
        self.assertIn("dialecto", m)
        self.assertIn("afirmacion", m)
        self.assertIn("formula gastada", m)

    def test_verificar_fails(self):
        hooks, errs = ht.parse("lista | ثلاثة أرقام [VERIFICAR]")
        self.assertTrue(any(lv == "FAIL" for lv, _ in ht.check(hooks, errs)))

    def test_near_duplicates_and_type_diversity(self):
        hooks, errs = ht.parse("pregunta | لماذا ريلك غير واضح؟\npregunta | لماذا ريلك غير واضح جدا؟\npregunta | لماذا فيديوك مظلم؟\npregunta | كيف أضبط الصوت؟\npregunta | متى أصدر الريل؟")
        m = msgs(ht.check(hooks, errs))
        self.assertIn("casi iguales", m)
        self.assertIn("tipos distintos", m)

    def test_type_must_match_form(self):
        hooks, errs = ht.parse("pregunta | لماذا ريلك غير واضح\nlista | أخطاء في خط الترجمة\nlista | 3 أخطاء في الخط")
        m = msgs(ht.check(hooks, errs))
        self.assertIn("no lleva ؟", m)
        self.assertEqual(m.count("ningun numero"), 1)

    def test_empty(self):
        self.assertTrue(any(lv == "FAIL" for lv, _ in ht.check([], [])))


if __name__ == "__main__":
    unittest.main()
