# Changelog: arabic-captions-fix

## 2026-11-01 — v1
- Creada. Linter `check_arabic.py` (reglas A1-A5) con 6 pruebas; guía corta sobre `remotion-markup/arabic-text.md`.
- Pendiente de confirmar con el usuario: fuente árabe y estilo de subtítulos.

## 2026-11-01 — v1.1
- Prueba con un caso de reel (subtítulos con `split('')`, `nowrap`, 1920×1080): 1 error + 4 avisos antes, 0 después de aplicar la skill.
- Fallo hallado en la 2.ª pasada: A4 (sin fuente árabe) avisaba en `Reel.tsx` aunque `Captions.tsx` cargaba Cairo. Ahora A4 se evalúa por proyecto, con prueba nueva (7 pruebas).
