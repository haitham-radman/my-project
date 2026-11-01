---
name: reel-export
description: Renderizar un reel de Remotion y dejar las copias de entrega listas para TikTok e Instagram, con nombre estándar y comprobación del archivo final. Úsala cuando el usuario diga "exporta el reel", "renderiza", "deja listo para TikTok e Instagram", "entrega", "صدّر الريل", "جهّز الملف للنشر". Deja los archivos en disco; nunca sube ni publica.
---

# Exportar un reel para TikTok e Instagram

Una sola tarea: del proyecto terminado a dos archivos de entrega correctos. **No publica nada.** Subir a TikTok o Instagram lo hace el usuario.

## Pasos

1. Ejecuta `reel-preflight` en modo `project`. Si hay un FAIL, para y corrige antes de renderizar.
2. Pide permiso para renderizar (consume CPU y puede tardar) y muestra el comando exacto:
   `npx remotion render Reel out/reel.mp4 --codec=h264`
   (`Reel` es el `id` de la composición. Si falta `@remotion/renderer` o Chrome, informa; no instales sin permiso.)
3. Ejecuta `reel-preflight` en modo `video` sobre `out/reel.mp4` y mira la hoja de fotogramas.
4. Elige un `slug` corto del tema (minúsculas y guiones) y ejecuta:
   `python3 .claude/skills/reel-export/scripts/export_reel.py out/reel.mp4 --slug <tema>`
   Crea `out/export/AAAA-MM-DD_<tema>_tiktok.mp4` y `..._instagram.mp4`. No sobrescribe: si ya existen, cambia el slug o la fecha.
5. Si el script pide `--reencode` (solo codec, `yuv420p` o audio `aac`), explica qué cambia y pide permiso. Resolución o fps incorrectos nunca se arreglan recodificando: se vuelve al proyecto.
6. Entrega la lista de archivos, tamaño y los 16 primeros caracteres del SHA-256, y di claramente: "listo en disco, sin publicar".

## Reglas del usuario

- Plataformas: TikTok e Instagram Reels. Formato 1080×1920, 30 fps, H.264, `yuv420p`, AAC.
- Nombre: `AAAA-MM-DD_<tema>_<plataforma>.mp4`. Convención **pendiente de confirmar**.
- Descripción, hashtags y horario de publicación: fuera de esta skill.
- Carpeta de entrega por defecto `out/export/`: **pendiente de confirmar**.

## Ejemplo correcto 1: reel que cumple

`export_reel.py out/reel.mp4 --slug 3-errores-de-caja` → dos copias, mismo SHA-256, "listo en disco, sin publicar".

## Ejemplo correcto 2: codec incorrecto

El render salió con audio MP3. El script lista el problema; se explica al usuario, se acepta, se repite con `--reencode` y se vuelve a pasar `reel-preflight video` sobre la copia.

## Ejemplo incorrecto

Renderizar con `--codec=h265`, renombrar a `final_v2_definitivo.mp4` y "subirlo" con un script de la API de la plataforma. Evítalo: nombre sin fecha ni tema, codec que las apps recomprimen o rechazan, y publicar sin aprobación explícita está prohibido para esta biblioteca.
