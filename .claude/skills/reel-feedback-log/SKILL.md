---
name: reel-feedback-log
description: Llevar el registro de los reels publicados (tema, tipo de gancho, métricas que da el usuario) y de las correcciones que hizo sobre el trabajo de Claude, para detectar errores repetidos y proponer mejoras concretas a la skill responsable. Úsala cuando el usuario corrija un resultado, pegue métricas de un reel, pregunte "qué reels funcionaron", "qué suelo corregir", "registra este reel", "سجل الريل", "تصحيحاتي", "ماذا نجح". No lee cuentas de TikTok ni Instagram y no publica nada.
---

# Registro de reels y correcciones

Una sola tarea: guardar lo que el usuario cuenta y convertir sus correcciones repetidas en mejoras de las skills, siempre con su aprobación.

## Datos

El registro es un archivo JSON Lines en el proyecto del usuario (ruta por defecto `reel-log/log.jsonl`, **pendiente de confirmar**; no lo subas a git sin preguntar, porque son sus métricas). Guarda solo lo que el usuario da: **nunca inventes métricas ni las leas de una cuenta o conector**, y no guardes claves, enlaces privados ni datos personales.

## Pasos

1. **Registrar un reel** cuando se publique:
   `python3 .claude/skills/reel-feedback-log/scripts/log_tool.py add reel-log/log.jsonl --slug <tema> --topic "<tema>" --hook-type <pregunta|error|promesa|contraste|lista> --hook "<texto>" [--date AAAA-MM-DD]`
2. **Métricas**: cuando el usuario las pegue, `log_tool.py metrics reel-log/log.jsonl --slug <tema> --platform tiktok --views N [--likes N --comments N --shares N --saves N --avg-watch-s X] [--as-of AAAA-MM-DD]`. Pregunta la fecha de medición si no la dice.
3. **Cada vez que el usuario corrige tu trabajo** (bucle de aprendizaje):
   1. Identifica qué skill debió evitar el error y regístralo: `log_tool.py correction reel-log/log.jsonl --slug <tema> --skill <skill> --what "<qué corrigió>"`.
   2. Analiza por qué sus instrucciones no bastaron.
   3. Propón un cambio concreto en formato `diff` y **espera su aprobación** antes de tocar la skill (`log_tool.py status ... --status aprobada`).
   4. Con la aprobación, edita la skill, anota el cambio en su `CHANGELOG.md` y marca `--status aplicada`. Si el usuario lo rechaza, `descartada`.
4. **Informe**: `log_tool.py report reel-log/log.jsonl`. Si una skill acumula 2 o más correcciones abiertas, el informe la marca como RECURRENTE: propón el cambio al usuario con un `diff`.
5. `log_tool.py check reel-log/log.jsonl` valida el archivo antes de dar un informe.

## Reglas del usuario

- Nunca aplicar un cambio a una skill sin mostrar el `diff` y esperar su aprobación.
- Con menos de 5 reels por grupo no hay tendencia: dilo ("n=3, muestra pequeña"). No digas que un tipo de gancho "funciona mejor".
- Las vistas crecen con el tiempo: no compares reels medidos a edades distintas. El informe lo avisa.
- Las métricas describen; no prueban que el gancho, el tema o la hora sean la causa.
- Qué métricas importan al usuario (vistas, guardados, retención): **pendiente de confirmar**.

## Ejemplo correcto 1: una corrección

El usuario dice que el subtítulo se corta por la derecha. Se registra contra `arabic-captions-fix`, se explica por qué no bastó (no comprobaba el margen derecho de la zona segura), se muestra el `diff` y se espera su "adelante" antes de editar la skill y su `CHANGELOG.md`.

## Ejemplo correcto 2: informe honesto

`report` muestra `tiktok pregunta n=2 media=1000 (muestra pequeña, no concluyas)`. La respuesta al usuario: "Hay 2 reels con gancho de pregunta; es poco para decir si funciona mejor. Con 5 por tipo ya se puede mirar."

## Ejemplo incorrecto

Entrar en la cuenta de TikTok para "completar" las vistas, o decir "los ganchos de lista rinden un 40 % más" con tres reels de edades distintas. Evítalo: son datos que el usuario no dio y una conclusión que la muestra no sostiene. Tampoco edites una skill "porque es obvio" sin enseñar antes el `diff`.
