---
name: reel-setup
description: Dejar listo el formato de un reel vertical nuevo (9:16, 1080×1920, 30 fps, 30 s, zona segura de TikTok e Instagram) en un proyecto Remotion, o corregir una composición que tiene otro formato. Úsala al empezar un reel, al crear una composición, o cuando el usuario diga "nuevo reel", "configura el reel", "formato vertical", "el vídeo sale horizontal", "ريل جديد", "إعداد الريل". No monta ni renderiza el vídeo.
---

# Configuración inicial de un reel

Una sola tarea: que la composición nazca con el formato correcto y con la zona segura definida, para no repetirlo en cada vídeo.

## Valores del usuario

| Ajuste | Valor | Estado |
|---|---|---|
| Herramienta | Remotion (HyperFrames solo si el usuario lo pide) | confirmado |
| Resolución | 1080×1920 (9:16) | confirmado |
| fps | 30 | confirmado |
| Duración | 30 s = 900 fotogramas | confirmado |
| Plataformas | TikTok e Instagram Reels | confirmado |
| Zona segura (px) | arriba 150, abajo 380, izquierda 60, derecha 120 (valores de partida; con `brand.json` manda el archivo) | **pendiente de confirmar** |
| Colores, fuente árabe, tamaño de subtítulo | fondo `#101010`, texto `#FFFFFF`, resaltado `#FFD400`, Cairo, 72 px (en `reel-brand-kit`) | confirmado |
| Logo, fuente latina, acento | los guarda `reel-brand-kit` en `brand.json` | **pendiente de confirmar** |
| Música y nivel de audio | — | **pendiente de confirmar** |

Si una tarea necesita un valor pendiente, pregunta una vez, usa la respuesta y anótala aquí y en `CHANGELOG.md`. No lo inventes.

## Pasos

1. Si no hay proyecto Remotion, pregunta antes de crearlo (`npx create-video` instala paquetes; la política del repo exige consentimiento).
2. Si existe `src/brand.config.ts` (lo genera `reel-brand-kit`), copia `templates/reel.config.with-brand.ts` a `src/reel.config.ts`: la zona segura sale de la marca. Si no existe, copia `templates/reel.config.ts`.
3. En `src/Root.tsx` usa la composición de `templates/Root.snippet.tsx`; no escribas `1920`, `1080` ni `24` a mano.
4. Coloca los subtítulos con `SAFE`: el borde inferior del texto nunca por debajo de `HEIGHT - SAFE.bottom`, y `maxWidth` = `CAPTION_MAX_WIDTH`.
5. Antes de seguir, ejecuta `python3 .claude/skills/reel-preflight/scripts/preflight.py project <carpeta-src>` y confirma que el formato sale OK.

## Ejemplo correcto 1: proyecto nuevo

`Root.tsx` importa las constantes de `reel.config.ts`; la composición mide 1080×1920, 30 fps, 900 fotogramas.

## Ejemplo correcto 2: proyecto horizontal heredado

Un `Composition` con `width={1920} height={1080} fps={24}` se sustituye por las constantes; el vídeo horizontal de origen se coloca con `objectFit: "cover"` dentro de 1080×1920 y se avisa al usuario del recorte.

## Ejemplo incorrecto

```tsx
<Composition id="Reel" width={1920} height={1080} fps={24} durationInFrames={450} ... />
```

Evítalo: formato horizontal, 24 fps y 18,75 s; el vídeo saldría con barras negras y no cumpliría 9:16 ni 30 s. Los números van siempre desde `reel.config.ts`.

## Límites

No instales dependencias ni renderices sin pedir permiso. No guardes claves ni cuentas en el proyecto.
