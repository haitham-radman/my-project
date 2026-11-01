# Reel: كيف تجعل الترجمة العربية واضحة في الريل

Primer reel real hecho con las skills de reels. Tema y llamada a la acción (احفظ المنشور) dados por el usuario.

| Archivo | Qué es | Estado |
|---|---|---|
| `ganchos.md` | 6 ganchos; elegido: «اجعل ترجمتك العربية واضحة بثلاث خطوات» | comprobado (`reel-hook-ideas`) |
| `guion.md` | Guion de 30 s, 66 palabras, 14 subtítulos | comprobado (`reel-script-ar`, con 20 caracteres por línea) |
| `captions.json` | Subtítulos con tiempos **estimados** | provisional: sustituir por los de la voz real |
| `brand.json`, `src/brand.config.ts` | Marca del usuario | validada (`reel-brand-kit`) |
| `src/` | Proyecto Remotion (1080×1920, 30 fps, 900 fotogramas) | escrito, **no instalado ni renderizado** |
| `post.md` | Descripción y hashtags para TikTok e Instagram | **borrador, no publicado** |

## Lo que falta

- Voz: no hay grabación. Los tiempos de `captions.json` son estimados.
- Metraje: el reel es solo texto sobre el fondo de marca y una barra de progreso.
- Render: requiere `npm install` (Remotion 4.0.537 fijado en `package.json`) y la descarga de Chrome; se hace solo con permiso del usuario. Sin renderizar, la fuente Cairo no se ha cargado y el aspecto se comprobó con una aproximación (DejaVu Sans Bold).
- Publicación: la hace el usuario.

## Comprobaciones

```bash
python3 .claude/skills/reel-hook-ideas/scripts/hook_tool.py check reels/subtitulos-claros/ganchos.md
python3 .claude/skills/reel-script-ar/scripts/script_tool.py check reels/subtitulos-claros/guion.md
python3 .claude/skills/reel-preflight/scripts/preflight.py project reels/subtitulos-claros/src
python3 .claude/skills/reel-caption-post/scripts/post_tool.py check reels/subtitulos-claros/post.md
```
