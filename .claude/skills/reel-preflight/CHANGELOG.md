# Changelog: reel-preflight

## 2026-11-01 — v1
- Creada. `preflight.py` (modos `project` y `video`, `--sheet`) con 7 pruebas.
- Caso de prueba: proyecto 1920×1080 a 24 fps → 4 FAIL; tras `reel-setup` → 0 FAIL. Vídeo horizontal de 8 s → 4 FAIL; vídeo 9:16 de 30 s → 0 FAIL.
- Fallo hallado en la 2.ª pasada: tras `reel-setup` salían 4 WARN porque las propiedades eran constantes (`WIDTH`). `preflight.py` ahora resuelve constantes de `reel.config.ts`.
- Pendiente de confirmar: umbrales de audio y zona segura.

## 2026-11-01 — v1.1 (aprobado por el usuario)
- Nueva opción `--brand brand.json`: la zona segura y los umbrales de audio salen de la marca; `--safe` explícito tiene prioridad; un `brand.json` ilegible da error (código 2). 2 pruebas nuevas (9 en total).

## 2026-11-01 — v1.2 (aprobado por el usuario)
- Nuevo modo `audio` (`preflight.py audio voz.m4a --lines N`): duración, pico y volumen medio (umbrales de la marca), fragmentos de voz contra líneas del guion, fragmentos demasiado cortos y pausas insuficientes. 7 pruebas nuevas (16 en total).
- Origen: la primera grabación real del usuario (16,2 s, 8,9 s de voz en 10 fragmentos, −31,1 dB de media) se analizó a mano; el modo reproduce ese resultado (1 FAIL, 2 WARN). Pruebas con tomas sintéticas: correcta 0/0; saturada FAIL de pico; sin pausas FAIL de duración y WARN de fragmentos.
- Límite: no transcribe ni "escucha". Detecta voz por energía; un ruido fuerte o una voz muy baja puede contarse mal.
