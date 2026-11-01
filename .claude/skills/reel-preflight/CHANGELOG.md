# Changelog: reel-preflight

## 2026-11-01 — v1
- Creada. `preflight.py` (modos `project` y `video`, `--sheet`) con 7 pruebas.
- Caso de prueba: proyecto 1920×1080 a 24 fps → 4 FAIL; tras `reel-setup` → 0 FAIL. Vídeo horizontal de 8 s → 4 FAIL; vídeo 9:16 de 30 s → 0 FAIL.
- Fallo hallado en la 2.ª pasada: tras `reel-setup` salían 4 WARN porque las propiedades eran constantes (`WIDTH`). `preflight.py` ahora resuelve constantes de `reel.config.ts`.
- Pendiente de confirmar: umbrales de audio y zona segura.
