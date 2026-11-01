# Changelog: reel-feedback-log

## 2026-11-01 — v1
- Creada. `log_tool.py` (`add`, `metrics`, `correction`, `status`, `report`, `check`) con 9 pruebas. Formato JSON Lines, escritura atómica, correcciones vinculadas a skills existentes.
- Caso de prueba con DATOS FICTICIOS (reels y cifras inventados para probar, no del usuario): 3 reels, 2 con métricas, 3 correcciones; el informe marca `arabic-captions-fix` como RECURRENTE (2 abiertas) y `reel-export` no (1 aplicada); rechaza una skill inexistente.
- Mejora de la 2.ª pasada: el informe comparaba vistas medias de reels medidos a edades muy distintas. Ahora avisa ("no comparables") y recuerda que es una descripción, no una causa.
- Pendiente de confirmar: ruta del registro, si se versiona en git, y qué métricas importan.
- Límite: no lee cuentas ni conectores; solo guarda lo que el usuario escribe.
