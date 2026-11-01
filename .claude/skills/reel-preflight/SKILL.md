---
name: reel-preflight
description: Revisión final de un reel antes de renderizar o entregar, para detectar formato incorrecto (no 1080×1920, 30 fps, 30 s), subtítulos árabes mal hechos, texto fuera de la zona segura de TikTok/Instagram y audio recortado o demasiado bajo. Úsala justo antes de `remotion render`, al terminar un montaje o cuando el usuario diga "revisa el reel", "está listo?", "antes de exportar", "QC", "راجع الريل", "فحص قبل التصدير". No arregla nada por sí sola y no sube ni publica.
---

# Revisión antes de renderizar

Una sola tarea: encontrar los fallos que el usuario suele corregir a mano, antes de que lleguen al vídeo final. Solo lee archivos y no renderiza ni publica.

## Pasos

1. **Proyecto** (antes de renderizar):
   `python3 .claude/skills/reel-preflight/scripts/preflight.py project <carpeta-src>`
   Comprueba ancho, alto, fps y duración de cada `<Composition>` (resuelve constantes de `reel.config.ts`) y ejecuta el linter de `arabic-captions-fix`.
2. **Vídeo** (después de renderizar):
   `python3 .claude/skills/reel-preflight/scripts/preflight.py video <reel.mp4> --sheet <hoja.png> [--brand brand.json]`
   Con `--brand`, la zona segura y los umbrales de audio salen de `brand.json` (`reel-brand-kit`); un `--safe` explícito manda sobre la marca.
   Comprueba formato, duración, `yuv420p`, pico y volumen medio del audio, y crea una hoja de 6 fotogramas con la zona segura en rojo.
3. **Mira la hoja** con la herramienta de lectura de imágenes. Busca: texto o subtítulo cruzando el borde rojo, letras árabes separadas, orden de palabras invertido, fotogramas vacíos. El script no puede detectar esto solo; hace falta mirar.
4. Informa en una tabla: comprobación, resultado, qué cambiar. Cada FAIL se corrige en el proyecto (con `reel-setup` o `arabic-captions-fix`), nunca editando el vídeo final.
5. Repite hasta 0 FAIL. Los WARN se explican al usuario y decide él.

## Reglas del usuario

- Formato: 1080×1920, 30 fps, 30 s (±1 s). Zona segura por defecto `150,380,60,120` (**pendiente de confirmar**; se pasa con `--safe` o `--brand`).
- Audio: los umbrales (pico máximo −0,5 dB; volumen medio entre −30 y −10 dB) son valores de partida, **pendientes de confirmar**; `--brand` los sustituye. Un WARN de volumen no bloquea.
- No des un reel por listo si queda un FAIL, y no digas "revisado" sin haber mirado la hoja.

## Ejemplo correcto 1: antes de renderizar

`preflight.py project src` → `[FAIL] width=1920, deberia ser 1080` … Se corrige `Root.tsx` con `reel-setup` y se repite hasta `0 FAIL, 0 WARN`.

## Ejemplo correcto 2: reel renderizado

`preflight.py video out/reel.mp4 --sheet hoja.png` → todo OK; se abre `hoja.png`, ningún subtítulo cruza el rectángulo rojo, se entrega el resultado a `reel-export`.

## Ejemplo incorrecto

Renderizar, ver que el comando termina sin error y decir "listo". Evítalo: un render sin errores puede ser horizontal, a 24 fps, con audio recortado o con el subtítulo tapado por los botones de la app. Sin mirar la hoja de fotogramas no hay revisión.
