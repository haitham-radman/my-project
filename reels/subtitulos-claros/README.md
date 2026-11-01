# Reel: كيف تجعل الترجمة العربية واضحة في الريل

Primer reel real hecho con las skills de reels. Tema y llamada a la acción (احفظ المنشور) dados por el usuario.

| Archivo | Qué es | Estado |
|---|---|---|
| `ganchos.md` | 6 ganchos; elegido: «اجعل ترجمتك العربية واضحة بثلاث خطوات» | comprobado (`reel-hook-ideas`) |
| `guion.md` | Guion de 30 s, 66 palabras, 14 subtítulos | comprobado (`reel-script-ar`, con 20 caracteres por línea) |
| `captions.json` | Subtítulos con tiempos **estimados** | provisional: sustituir por los de la voz real |
| `brand.json`, `src/brand.config.ts` | Marca del usuario | validada (`reel-brand-kit`) |
| `src/` | Proyecto Remotion (1080×1920, 30 fps, 900 fotogramas) | instalado (Remotion 4.0.537, sin scripts de instalación) y **renderizado**: `npm run render` → `out/reel.mp4` (505 kB, H.264 `yuv420p`, 30,0 s, sin audio) |
| `post.md` | Descripción para TikTok e Instagram; hashtags `#ترجمة_عربية #مونتاج #ريلز` confirmados por el usuario | **borrador, no publicado** |

## Decisiones del usuario en este reel

- Subtítulos centrados verticalmente dentro de la zona segura (centro en y = 845 px de 1920), no pegados al borde inferior. Solo vale para este reel de solo texto: con metraje o una persona en pantalla, el centro taparía la cara; habría que volver a decidirlo.
- Resaltado palabra por palabra, Cairo 72 px, marca de `reel-brand-kit`.

## Lo que falta

- Voz: no hay grabación. Los tiempos de `captions.json` son estimados.
- Metraje: el reel es solo texto sobre el fondo de marca y una barra de progreso.
- Render: hecho una vez en el entorno de pruebas con el Chromium local (`--browser-executable`); `out/` no se sube a git. Con Cairo real el texto sale conectado y centrado. Para repetirlo: `npm install --ignore-scripts && npm run render` (en otra máquina, Remotion descarga Chrome).
- Audio: el MP4 no tiene pista de audio; `reel-export` lo rechazará hasta que exista la voz, a propósito.
- Publicación: la hace el usuario.

## Nota de render

Para obtener `yuv420p` hace falta `--image-format=png`: con las capturas JPEG por defecto el MP4 sale `yuvj420p` (rango completo) aunque se pida `--pixel-format=yuv420p`. Ya está en `package.json`.

## Comprobaciones

```bash
python3 .claude/skills/reel-hook-ideas/scripts/hook_tool.py check reels/subtitulos-claros/ganchos.md
python3 .claude/skills/reel-script-ar/scripts/script_tool.py check reels/subtitulos-claros/guion.md
python3 .claude/skills/reel-preflight/scripts/preflight.py project reels/subtitulos-claros/src
python3 .claude/skills/reel-caption-post/scripts/post_tool.py check reels/subtitulos-claros/post.md
```
