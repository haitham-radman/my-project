# Changelog: reel-brand-kit

## 2026-11-01 — v1
- Creada. `brand.py` (`check` y `emit`) con 8 pruebas; plantilla `brand.json` con todos los valores de marca en `null`.
- Caso de prueba con valores de PRUEBA (no del usuario): plantilla vacía → 5 obligatorios pendientes y `emit` rechazado; valores con texto gris sobre fondo oscuro (1,4:1), fuente solo latina, logo inexistente y demasiado ancho → 4 errores; corregidos → 0 errores y `brand.config.ts` generado; `reel-preflight project` sigue en 0 FAIL.
- Pendiente de confirmar con el usuario: todos los valores de marca.

## 2026-11-01 — v1.1
- Integrada con `reel-setup` (plantilla con marca) y `reel-preflight` (`--brand`), con aprobación del usuario.

## 2026-11-01 — v1.2 (valores confirmados por el usuario)
- Confirmados: fondo `#101010`, texto `#FFFFFF`, resaltado `#FFD400`, fuente árabe Cairo, subtítulo de 72 px. Guardados en `templates/brand.json` (la plantilla es ahora su marca). Contrastes: 19,0:1 y 13,3:1.
- `check`: 0 obligatorios pendientes, 0 errores; `emit` genera `brand.config.ts` (`googleFontsModule: "Cairo"`); `reel-preflight project` y `video --brand`: 0 FAIL, 0 WARN.
- Tests: la prueba de "plantilla vacía" usa ahora un diccionario vacío propio y hay una prueba nueva que fija los valores confirmados (9 en total).
- Sigue sin confirmar: acento, fuente latina, logo y posición; el modo de resaltado `word` es un valor de partida mío, no una decisión del usuario.

## 2026-11-01 — v1.3
- Confirmado el modo de resaltado: palabra por palabra (`captions.highlight: "word"`), que hasta ahora era un valor de partida. Prueba de plantilla ampliada. Sigue sin confirmar: acento, fuente latina, logo, zona segura y audio.
