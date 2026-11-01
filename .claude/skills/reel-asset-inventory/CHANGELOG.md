# Changelog: reel-asset-inventory

## 2026-11-01 — v1
- Creada. `inventory.py` con 5 pruebas: ffprobe, lectura de cmap de fuentes (verificado: DejaVu con árabe, Liberation sin él), referencias `staticFile`/rutas, FALTA/SIN USO/AVISO.
- Caso de prueba: 5 archivos + 2 referencias rotas → detecta 2 FALTA, clip horizontal a 24 fps, fuente sin árabe.
- Límite conocido: no ve rutas construidas con variables (`staticFile(\`${name}.mp3\`)`) y las marcaría SIN USO.
