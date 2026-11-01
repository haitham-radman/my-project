# Changelog: reel-export

## 2026-11-01 — v1
- Creada. `export_reel.py` con 7 pruebas: valida formato, nombra, copia o recodifica con `--reencode`, nunca sobrescribe ni sube.
- Casos: clip 1920×1080 a 24 fps → rechazado; reel 9:16 a 30 fps → 2 copias; yuv444p + MP3 → rechazado sin `--reencode`, corregido con él (h264/yuv420p/aac).
- Pendiente de confirmar: convención de nombres y carpeta de entrega. El render real con Remotion no se probó (requiere instalar paquetes).
