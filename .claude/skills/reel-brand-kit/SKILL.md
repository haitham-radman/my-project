---
name: reel-brand-kit
description: Guardar y aplicar la marca de los reels del usuario (colores, fuente árabe y latina, logo y su posición, estilo de subtítulos, zona segura, umbrales de audio) en un único archivo brand.json, validarlo y generar src/brand.config.ts para Remotion. Úsala cuando el usuario diga "mi marca", "mis colores", "mi logo", "estilo de subtítulos", "brand kit", "cambia el color/la fuente", "هوية الريل", "ألوان وخط الريل", o cuando otra skill necesite un valor de marca marcado como pendiente. No diseña un logo ni elige colores por su cuenta.
---

# Brand kit de los reels

Una sola tarea: que los valores de marca vivan en un solo archivo, validados, y que el proyecto los lea de ahí. **Nunca inventes un valor de marca**: si falta, se pregunta.

## Pasos

1. Si el proyecto no tiene `brand.json`, copia `templates/brand.json` a la raíz del proyecto. Todo lo que se desconoce está en `null`.
2. Ejecuta `python3 .claude/skills/reel-brand-kit/scripts/brand.py check brand.json`. Lista lo `PENDIENTE` (obligatorio u opcional) y los `ERROR`.
3. Pregunta al usuario **solo** por los obligatorios pendientes, en una sola pregunta agrupada: `colors.background`, `colors.text`, `colors.highlight`, `fonts.arabic.family`, `captions.fontSize`. Los opcionales (acento, fuente latina, logo) se preguntan si el reel los usa.
4. Escribe las respuestas en `brand.json`; repite `check` hasta 0 errores. El script comprueba formato `#RRGGBB`, contraste mínimo 4,5:1 de texto y resaltado contra el fondo, que la fuente árabe tenga letras árabes, que los archivos existan y que el logo quepa en la zona segura.
5. Genera la configuración: `python3 .claude/skills/reel-brand-kit/scripts/brand.py emit brand.json --out src/brand.config.ts`. Se niega si queda un obligatorio pendiente y no sobrescribe sin `--force` (que solo se usa con permiso).
6. En el código, importa `BRAND` y carga la fuente con `@remotion/google-fonts/<googleFontsModule>`; no escribas colores ni fuentes a mano. Después pasa `arabic-captions-fix` y `reel-preflight`.
7. Registra en `CHANGELOG.md` cada valor que el usuario confirme o cambie.

## Reglas del usuario

- Mientras `check` no dé 0 obligatorios pendientes, `reel-setup` y `reel-preflight` siguen usando sus valores de partida (zona segura 150/380/60/120, audio −0,5 / −30 / −10 dB).
- Subtítulos: máximo 2 líneas, resaltado por palabra por defecto. Estilo definitivo: lo decide el usuario.
- Ni claves, ni tokens, ni cuentas de redes dentro de `brand.json`.
- Logos y fuentes: solo archivos que el usuario aporte, con licencia clara. No los descargues desde aquí.

## Ejemplo correcto 1: primera vez

`check` muestra 5 obligatorios pendientes. Se pregunta una vez: "¿Color de fondo, de texto y de resaltado (hex), fuente árabe y tamaño de subtítulo?". Con las respuestas, `check` da 0 errores y `emit` crea `src/brand.config.ts`.

## Ejemplo correcto 2: cambio de color

El usuario pide otro resaltado. Se edita `brand.json`, `check` valida el contraste (13,3:1), se genera de nuevo con `--force` tras su aprobación y se anota en `CHANGELOG.md`. Ningún componente se toca.

## Ejemplo incorrecto

Rellenar `#FFD400` y "Cairo" "porque suelen quedar bien" para que `check` pase. Evítalo: son decisiones de marca del usuario, no una suposición razonable. Un valor inventado se propaga a todos los reels y luego hay que corregirlo uno por uno.
