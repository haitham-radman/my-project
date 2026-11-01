---
name: reel-caption-post
description: Redactar el borrador de la descripción y los hashtags de un reel para TikTok e Instagram, en فصحى مبسطة y tono directo, y comprobar límite de caracteres, número de hashtags y afirmaciones sin verificar. Úsala cuando el usuario diga "descripción del reel", "caption", "hashtags", "texto para publicar", "اكتب وصف الريل", "هاشتاقات", "كابشن التيك توك". Solo deja un borrador para aprobación del usuario; nunca publica, programa ni envía nada.
---

# Descripción y hashtags de un reel

Una sola tarea: un borrador por plataforma, comprobado, que el usuario copia y publica él. **Nunca publiques, programes ni envíes** (ni con conectores de TikTok, Instagram, Postiz, Gmail o Slack).

## Pasos

1. Reúne el contexto: el guion del reel (`reel-script-ar`) o el tema, la llamada a la acción y si el usuario quiere solo árabe o árabe e inglés. Lo que no sepas, pregúntalo una vez.
2. Copia `templates/post.md` a `post.md` y escribe una sección `## tiktok` y otra `## instagram`: una o dos frases + llamada a la acción + hashtags al final. Adapta cada plataforma; no copies el mismo texto.
3. Escribe solo lo que el reel dice o el usuario aportó. Si necesitas una cifra, un resultado o una promesa que no tienes, **no la inventes**: pregunta, o deja `[VERIFICAR]` y el script bloqueará el borrador.
4. Comprueba: `python3 .claude/skills/reel-caption-post/scripts/post_tool.py check post.md`
   Corrige todo FAIL (límite de caracteres, demasiados hashtags, `[VERIFICAR]` sin resolver, sección que falta) y los WARN (hashtags mal formados o repetidos, dialecto, afirmaciones con cifra o promesa).
5. Entrega el borrador en árabe con un resumen en español (caracteres, hashtags, avisos) y la frase "borrador: no publicado". Anota en `CHANGELOG.md` lo que el usuario corrija.

## Reglas del usuario

- Idioma: فصحى مبسطة, tono directo, sin dialecto. Árabe e inglés solo si el usuario lo pide.
- Límites de partida: 2.200 caracteres y 5 hashtags por plataforma. Salen de fuentes secundarias de 2026; la referencia de Meta para desarrolladores aún lista 30 hashtags para Instagram. **Pendiente de confirmar** en la app (`--max-chars`, `--max-hashtags`).
- Hashtags: 3 a 5, ni repetidos ni con espacios ni con tashkeel; usa `_` para unir palabras (`#تيك_توك`). Mezcla temáticos y de nicho. Cuáles usa el usuario habitualmente: **pendiente de confirmar**.
- Emojis, horario de publicación y si el primer comentario lleva hashtags: **pendientes de confirmar**.
- Nada de promesas ("نتائج مضمونة") ni cifras sin dato (`10 أضعاف`). No menciones marcas ni personas que el usuario no haya nombrado.

## Ejemplo correcto 1: TikTok

```
## tiktok
خطوات بسيطة تجعل الريل أوضح وأسهل في القراءة. جرب ذلك في ريلك القادم.
#مونتاج #ريلز #تيك_توك
```

Dos frases, acción al final, 3 hashtags bien formados.

## Ejemplo correcto 2: Instagram con texto distinto

```
## instagram
اجعل ريلك عموديا وواضحا بخمس خطوات قصيرة. احفظ المنشور وجرب الخطوات اليوم.
#مونتاج #ريلز #إنستغرام
```

Mismo tema, redacción propia y llamada a "guardar", adaptada a la plataforma.

## Ejemplo incorrecto

`شو رأيكم بهالطريقة؟ هذا الريل يزيد مشاهداتك 10 اضعاف 🔥🔥🔥` con 9 hashtags (uno repetido y otro con guion), igual en las dos plataformas. Evítalo: dialecto, una cifra sin respaldo que puede ser falsa, hashtags de más y mal formados, y copiar el texto sin adaptarlo.
