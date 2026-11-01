# Changelog: reel-caption-post

## 2026-11-01 — v1
- Creada. `post_tool.py check` con 10 pruebas; plantilla `post.md`.
- Límites de partida (2.200 caracteres, 5 hashtags) tomados de búsqueda web: fuentes secundarias coinciden en 2.200; para hashtags hay conflicto (5 según Instagram y guías de 2026, 30 según la referencia de Meta). Configurables y pendientes de confirmar en la app.
- Caso de prueba con un borrador de PRUEBA (no es del usuario): versión mala = 4 FAIL y 7 WARN (9 hashtags, repetido, mal formado, `[VERIFICAR]`, dialecto, textos idénticos); versión corregida = 0 FAIL, 0 WARN.
- Fallo hallado en la 2.ª pasada: no señalaba "10 اضعاف", una afirmación con cifra sin dato. Nueva regla `CLAIM` (cifra + multiplicador/porcentaje, `مضمون`, `ضمان`) con prueba.
- Pendiente de confirmar: hashtags habituales, emojis, horario, hashtags en primer comentario, idioma (árabe o árabe + inglés).
- Límite: la regla de afirmaciones es heurística; no detecta todas las promesas.

## 2026-11-01 — v1.1
- Corregido el frontmatter: el `description` tenía un `:` sin comillas ("aprobación: nunca") y el YAML no era válido. Cambiado por punto y coma. Lección: pasar el hook de frontmatter y parar si falla, antes de commit.

## 2026-11-01 — v1.2
- Confirmados por el usuario: hashtags `#ترجمة_عربية #مونتاج #ريلز` (coinciden con los del borrador del primer reel). `SKILL.md` los usa como base. Siguen pendientes: emojis, horario y hashtags en el primer comentario.
