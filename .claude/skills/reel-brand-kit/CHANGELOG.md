# Changelog: reel-brand-kit

## 2026-11-01 — v1
- Creada. `brand.py` (`check` y `emit`) con 8 pruebas; plantilla `brand.json` con todos los valores de marca en `null`.
- Caso de prueba con valores de PRUEBA (no del usuario): plantilla vacía → 5 obligatorios pendientes y `emit` rechazado; valores con texto gris sobre fondo oscuro (1,4:1), fuente solo latina, logo inexistente y demasiado ancho → 4 errores; corregidos → 0 errores y `brand.config.ts` generado; `reel-preflight project` sigue en 0 FAIL.
- Pendiente de confirmar con el usuario: todos los valores de marca.

## 2026-11-01 — v1.1
- Integrada con `reel-setup` (plantilla con marca) y `reel-preflight` (`--brand`), con aprobación del usuario.
