---
name: reel-asset-inventory
description: Hacer el inventario (الجرد) de los assets de un proyecto de reel antes de montar - clips, música, imágenes, logos y fuentes - con duración, resolución, fps y si el código los usa, marcando archivos que faltan, sin uso, que no son verticales o fuentes sin letras árabes. Úsala al empezar un montaje, al recibir una carpeta de material, o cuando el usuario diga "inventario", "qué material tengo", "revisa los assets", "falta algo?", "جرد الملفات", "الجرد". Solo lee; no mueve ni borra.
---

# Inventario de assets de un reel

Una sola tarea: saber qué material hay, cuál sirve y qué falta antes de montar. Solo lectura.

## Pasos

1. Localiza la carpeta del proyecto (la que contiene `public/` y `src/`). Si los assets están en otra carpeta, pásala con `--assets`.
2. Ejecuta:
   `python3 .claude/skills/reel-asset-inventory/scripts/inventory.py <proyecto>`
   (usa `ffprobe` si está disponible y lee la tabla de caracteres de las fuentes `.ttf`/`.otf` para saber si tienen letras árabes; `.woff2` queda "no verificada").
3. Presenta la tabla al usuario y agrupa los hallazgos:
   - **FALTA**: el código referencia un archivo que no existe. Bloquea el montaje; pregunta de dónde sale.
   - **AVISO**: clip horizontal o con fps distinto de 30, música más corta que el reel (30 s), fuente sin letras árabes.
   - **SIN USO**: archivos que ningún código referencia. Solo informa; **nunca los borres ni los muevas sin permiso**.
4. Propón el siguiente paso: `reel-setup` si el formato no está fijado, o `arabic-captions-fix` si hay una fuente sin árabe.

## Reglas del usuario

- Reel de 30 s, 9:16, 30 fps. Un clip horizontal no es un error, pero se avisa del recorte (`objectFit: "cover"`).
- Música y SFX: solo los que el usuario aporte o tengan licencia clara. No descargues material nuevo desde aquí.
- Fuente árabe preferida y logo: **pendientes de confirmar**.

## Ejemplo correcto 1: carpeta nueva

`inventory.py reel-caja` → 6 archivos; un clip 1920×1080 a 24 fps con AVISO, una fuente solo latina con AVISO, nada FALTA. Se informa y se pregunta cómo encuadrar el clip.

## Ejemplo correcto 2: archivo referenciado que no existe

La tabla marca `logo.png` como FALTA. Se pregunta al usuario dónde está en lugar de crear un logo de relleno.

## Ejemplo incorrecto

Ver tres archivos "SIN USO" y borrarlos para "limpiar el proyecto". Evítalo: el inventario es informativo; pueden ser material para otro reel o referencias que el escáner no ve (rutas construidas con variables). Borrar exige permiso explícito.
