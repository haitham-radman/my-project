---
name: reel-hook-ideas
description: Proponer variantes del gancho (los primeros 3 segundos) de un reel en فصحى مبسطة para un mismo tema, de tipos distintos (pregunta, error, promesa, contraste, lista), y comprobar que cada una cabe en 8 palabras y 2 líneas de subtítulo, sin dialecto ni afirmaciones sin respaldo. Úsala cuando el usuario pida "ganchos", "hook", "cómo empiezo el reel", "ideas para el inicio", "افتتاحية الريل", "هوك", "أول ثلاث ثواني". No predice el rendimiento ni escribe el guion completo.
---

# Ideas de gancho para un reel

Una sola tarea: varias aperturas distintas para el mismo tema, comprobadas, para que el usuario elija. El gancho elegido entra en `## gancho` de `reel-script-ar`.

## Pasos

1. Pide el **tema** y, si el usuario lo conoce, a quién va dirigido. Si falta, pregunta una vez; no lo inventes. Usa solo hechos que el usuario haya dado: si un gancho necesita un dato, déjalo como `[VERIFICAR]` o no lo uses.
2. Copia `templates/hooks.md` a `ganchos.md` y escribe **6 a 8 ganchos** en árabe, uno por línea con el formato `tipo | texto`, mezclando al menos 3 tipos:
   - `pregunta`: termina en ؟ y toca un problema real del tema.
   - `error`: nombra un fallo común que el espectador reconoce.
   - `promesa`: una acción concreta y alcanzable, nunca un resultado garantizado.
   - `contraste`: dos opciones o un antes y después.
   - `lista`: lleva un número ("ثلاثة أخطاء…").
3. Comprueba: `python3 .claude/skills/reel-hook-ideas/scripts/hook_tool.py check ganchos.md`. Corrige todo FAIL (más de 8 palabras, más de 2 líneas, `[VERIFICAR]`, formato) y los WARN (dialecto, cifra o promesa sin dato, fórmula gastada, ganchos casi iguales, tipo que no coincide con la forma).
4. Presenta al usuario **3 favoritos** con una razón de una línea cada uno (claridad, relación con el tema, facilidad de leer en pantalla) y el resto como reserva.
5. Cuando el usuario elija, ponlo en `## gancho` del guion (`reel-script-ar`) y repite `script_tool.py check`. Anota en `CHANGELOG.md` lo que corrija.

## Reglas del usuario

- فصحى مبسطة, tono directo, segunda persona, verbo en las primeras palabras.
- Máximo 8 palabras y 2 líneas de subtítulo (26 caracteres por línea es un valor de partida, **pendiente de confirmar**).
- Sin "هل تعلم" ni "لن تصدق", sin "أسرار", sin promesas ("مضمون") ni cifras sin dato.
- No digas que un gancho "funcionará mejor": sin datos del usuario (visualizaciones, retención) solo se puede juzgar claridad. Cuando existan datos de reels publicados, **pendiente de confirmar** cómo usarlos.
- Estilo preferido de gancho y tipos que el usuario descarta: **pendiente de confirmar**.

## Ejemplo correcto 1

```
pregunta | لماذا يبدو فيديوك غير احترافي؟
error | خطأ واحد يفسد ترجمة ريلك
lista | ثلاثة أخطاء في خط الترجمة
contraste | نص صغير أم كبير؟ اختر الأوضح
promesa | رتب ريلك في خمس خطوات
```

Cinco tipos distintos, entre 4 y 6 palabras, sin dialecto ni cifras sin respaldo.

## Ejemplo correcto 2: elegir

Favoritos: 1) `error`: concreto y reconocible; 2) `pregunta`: invita a quedarse; 3) `lista`: promete orden. El usuario elige el 2; pasa a `## gancho` y se vuelve a comprobar el guion completo.

## Ejemplo incorrecto

`هل تعلم أن ريلك ممكن يزيد مشاهداتك 10 اضعاف؟` Evítalo: fórmula gastada, una cifra sin dato que puede ser falsa, 9 palabras (pasa de 8) y un registro cercano al dialecto. Tampoco entregues cinco ganchos casi iguales y del mismo tipo: no dan para elegir.
