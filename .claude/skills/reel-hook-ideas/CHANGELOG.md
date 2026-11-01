# Changelog: reel-hook-ideas

## 2026-11-01 — v1
- Creada. `hook_tool.py check` con 9 pruebas; plantilla `hooks.md`. Reutiliza funciones de `reel-script-ar` y `reel-caption-post` (dialecto, líneas, afirmaciones).
- Caso de prueba con ganchos de PRUEBA (no son del usuario): versión mala = 5 FAIL y 6 WARN (9 y 13 palabras, 3 líneas, `[VERIFICAR]`, dialecto, cifra sin dato, fórmulas gastadas, ganchos casi iguales, línea sin tipo); versión corregida = 6 ganchos, 5 tipos, 0 FAIL, 0 WARN.
- Mejora de la 2.ª pasada: un `pregunta` sin ؟ o una `lista` sin número se colaban como correctos; ahora avisan.
- Límite: no detecta registro dialectal cuando solo está en la sintaxis (p. ej. `ممكن يزيد`). La skill no mide ni predice rendimiento.
- Pendiente de confirmar: estilo preferido de gancho, tipos descartados, uso de datos de reels publicados.
