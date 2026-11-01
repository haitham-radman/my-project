# Changelog: reel-script-ar

## 2026-11-01 — v1
- Creada. `script_tool.py` (`check` y `captions`) con 11 pruebas; plantilla `script.md`.
- Caso de prueba con un guion de PRUEBA (tema inventado solo para probar, no es del usuario): versión mala = 106 palabras (~46 s), 8 FAIL de líneas, dialecto y cifras mezcladas; versión corregida siguiendo la skill = 0 FAIL, 0 WARN y `captions.json` generado.
- Fallo hallado en la 2.ª pasada: no detectaba `ودلوقتي`/`ومش` (prefijo `و`) ni `لازم`, `كويس`, `جوا`, `شي`, `كمان`. Ahora quita el prefijo `و`/`ف` y la lista es más amplia (heurística: solo avisa).
- Pendiente de confirmar: ritmo (palabras por segundo), caracteres por línea, tipo de cifras, tema habitual, público y llamada a la acción.
- Límite: la lista de dialecto es una heurística y puede avisar de palabras legítimas; no sustituye la lectura de una persona.

## 2026-11-01 — v1.2
- Aprobado por el usuario (el cambio se propuso con un `diff`): `--max-chars` por defecto 26 -> 20, también en la función `check()` (la propuesta solo cambiaba la línea de comandos). Motivo: en el primer reel real, una previsualización en Chromium a 72 px (DejaVu Sans Bold como aproximación de Cairo) mostró 2 subtítulos de 3 líneas que `check` aceptaba con 26; con 20 se detectan las 3 frases problemáticas y el guion final sigue en 0 FAIL. 1 prueba nueva (12 en total). Recalibrar con Cairo en un render real.
