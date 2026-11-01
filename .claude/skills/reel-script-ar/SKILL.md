---
name: reel-script-ar
description: Escribir el guion de un reel de 30 segundos en árabe estándar simplificado (فصحى مبسطة), tono directo, con gancho, desarrollo y cierre, ya partido en subtítulos de máximo dos líneas, y comprobar duración, dialecto y longitud de línea. Úsala cuando el usuario pida "guion", "script", "texto para el reel", "ماذا أقول في الريل", "اكتب لي سكربت", "نص الريل", o dé un tema y quiera el texto hablado y los subtítulos. No graba la voz, no monta el vídeo ni escribe la descripción para publicar.
---

# Guion de reel en فصحى مبسطة

Una sola tarea: de un tema a un guion hablado de 30 s, ya dividido en subtítulos, que se pueda comprobar antes de grabar o montar. No publica nada.

## Pasos

1. Pide el **tema**, a quién va dirigido y la **llamada a la acción** del cierre (si no los da, pregunta una vez; no los inventes). No escribas hechos, cifras ni afirmaciones sobre el tema que el usuario no haya dado; si hacen falta datos, pregunta o marca `[VERIFICAR]`.
2. Copia `templates/script.md` a `guion.md` y escribe en árabe, **una línea = un subtítulo**:
   - `## gancho`: una frase de hasta 8 palabras que frena el dedo (pregunta, error común o promesa concreta).
   - `## desarrollo`: frases cortas (hasta 12 palabras), una idea por línea, en orden lógico.
   - `## cierre`: una frase con la llamada a la acción elegida.
3. Comprueba: `python3 .claude/skills/reel-script-ar/scripts/script_tool.py check guion.md`.
   Corrige todo FAIL (duración excedida, más de 2 líneas por subtítulo). Los WARN se arreglan salvo que el usuario diga que son intencionados (por ejemplo, una palabra de dialecto citada).
4. Si el guion es corto (WARN de palabras que faltan), añade contenido útil; no lo estires con relleno ni repeticiones.
5. Genera los subtítulos provisionales: `script_tool.py captions guion.md --out captions.json`. Es el tipo `Caption` de Remotion con tiempos **estimados** por número de palabras; cuando exista la voz real, hay que transcribirla (`remotion-captions`) y sustituir los tiempos.
6. Antes de montar, pasa `arabic-captions-fix` (código) y `reel-preflight` (formato).
7. Entrega el guion en árabe y un resumen breve en español: palabras, duración estimada y avisos. Anota en `CHANGELOG.md` lo que el usuario corrija.

## Reglas del usuario

- Idioma: فصحى مبسطة, sin dialecto. Tono directo: verbos de acción, segunda persona, sin rodeos ni saludos largos.
- Sin tashkeel salvo que evite una ambigüedad real. Sin emojis en el texto hablado.
- Marcas o términos en inglés (Remotion, TikTok) se dejan en letras latinas; el subtítulo los pone en su propio `span`.
- Cifras: un solo tipo por guion. Tipo preferido (٣ o 3): **pendiente de confirmar**.
- Ritmo: 2,3 palabras por segundo es un valor de partida, **pendiente de confirmar** con una grabación del usuario (`--wps`). 20 caracteres por línea (`--max-chars`) viene de medir subtítulos a 72 px: con 26 pasaban frases que en el render ocupaban 3 líneas; recalibrar con Cairo cuando haya un render real.
- Tema habitual, público y llamada a la acción: **pendientes de confirmar**.
- Nunca prometas resultados ("ganarás X") ni pongas datos inventados.

## Ejemplo correcto 1

```
## gancho
لماذا يبدو فيديوك غير احترافي؟
## desarrollo
اجعل الصيغة عمودية دائما
اختر خطا عربيا واضحا ومريحا
## cierre
جرب هذه الخطوات في ريلك القادم
```

Gancho de 5 palabras, líneas cortas en فصحى, una idea por subtítulo y cierre con acción.

## Ejemplo correcto 2: término en inglés

`استخدم Remotion لتحريك النص` → la palabra latina queda tal cual y el subtítulo la envuelve en su propio `span`, sin romper el orden de derecha a izquierda.

## Ejemplo incorrecto

`شو رأيك اليوم نتكلم عن موضوع مهم جدا جدا في المونتاج ولازم تعمل الفيديو عمودي كده عشان يظهر كويس` en una sola línea. Evítalo: gancho de 11 palabras que no engancha, dialecto (`شو`, `لازم`, `كده`, `عشان`, `كويس`) cuando se pidió فصحى, una frase de 20 palabras que ocupa 3 líneas de subtítulo, y relleno ("جدا جدا").
