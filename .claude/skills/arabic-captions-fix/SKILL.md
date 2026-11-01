---
name: arabic-captions-fix
description: Crear o corregir subtítulos en árabe (فصحى مبسطة) en una composición Remotion o HyperFrames para que las letras salgan conectadas, el texto vaya de derecha a izquierda y no se corte. Úsala cuando se escriba, revise o anime cualquier subtítulo, kinetic text o texto en árabe de un reel, o cuando el usuario diga "subtítulos desconectados", "letras separadas", "el texto se corta", "الحروف مقطعة", "الترجمة مقطوعة". No sirve para transcribir audio ni para subtítulos en inglés.
---

# Subtítulos en árabe que se leen bien

Una sola tarea: que el árabe de un reel salga conectado, en el orden correcto y dentro del cuadro. La teoría completa está en `.claude/skills/remotion-markup/arabic-text.md`; esta skill es la lista de comprobación corta y un linter.

## Pasos

1. Localiza el componente de subtítulos (`Captions.tsx`, `Subtitle*`, o el HTML de HyperFrames).
2. Ejecuta el linter antes de tocar nada:
   `python3 .claude/skills/arabic-captions-fix/scripts/check_arabic.py <carpeta-src>`
3. Corrige cada hallazgo en el código, no en el texto:
   - **A1 (error)**: nada de `split('')`, `Array.from(texto)` ni `[...texto]`. Divide por espacios y anima por palabra. Si hace falta animar por letra, usa `splitArabicLetters` de `arabic-text.md`.
   - **A2**: quita `letterSpacing` y `textTransform` del texto árabe.
   - **A3**: pon `dir="rtl"` y `lang="ar"` en el contenedor de las palabras.
   - **A4**: carga una fuente árabe explícita (`@remotion/google-fonts/Cairo`, `IBMPlexSansArabic`, `NotoSansArabic` o `Tajawal`). Fuente confirmada por el usuario: **Cairo** (`@remotion/google-fonts/Cairo`).
   - **A5**: contenedor con `maxWidth` dentro de la zona segura (ver `reel-setup`), `whiteSpace: "normal"` y `textWrap: "balance"`; sin `nowrap`.
4. Repite el linter hasta 0 errores y 0 avisos.
5. Renderiza un fotograma y míralo (`npx remotion still`): letras unidas, primera palabra a la derecha, nada pegado al borde.

## Reglas del usuario

- Árabe estándar simplificado (فصحى مبسطة), tono directo. No cambies las palabras del guion al corregir el formato.
- Máximo dos líneas por subtítulo; frases largas se parten en páginas, no se reducen a letra pequeña.
- Mezcla de árabe e inglés en una línea: marcas y cifras latinas dentro de su propio `span`.
- Estilo confirmado (`reel-brand-kit`): texto `#FFFFFF` sobre `#101010`, resaltado `#FFD400`, 72 px. Cómo se resalta (palabra a palabra o línea) sigue **pendiente de confirmar**: no lo inventes; pregunta una vez y anótalo en `CHANGELOG.md`.

## Ejemplo correcto 1: palabra por palabra

```tsx
const words = text.split(" ");
<div dir="rtl" lang="ar" style={{maxWidth: 840, textAlign: "center", fontFamily: cairo}}>
  {words.map((w, i) => (
    <span key={i} style={{display: "inline-block", margin: "0 8px", opacity: frame >= i * 6 ? 1 : 0}}>{w}</span>
  ))}
</div>
```

## Ejemplo correcto 2: línea completa con palabra resaltada

```tsx
<p dir="rtl" lang="ar" style={{maxWidth: 840, textWrap: "balance", fontFamily: cairo}}>
  {words.map((w, i) => (
    <span key={i} style={{color: i === active ? "#FFD400" : "#fff"}}>{w}{" "}</span>
  ))}
</p>
```

## Ejemplo incorrecto

```tsx
<div style={{whiteSpace: "nowrap", letterSpacing: 3}}>
  {text.split("").map((c) => <span style={{display: "inline-block"}}>{c}</span>)}
</div>
```

Evítalo: cada letra queda en su caja y se dibuja aislada (letras desconectadas), sin `dir` la frase se coloca de izquierda a derecha, `letterSpacing` rompe la unión y `nowrap` sin `maxWidth` hace que la frase se salga del cuadro y se corte.

## Límites

Nunca renderices a una plataforma ni publiques desde esta skill. El linter solo lee archivos.
