#!/usr/bin/env python3
"""Comprueba una lista de ganchos de reel en arabe (stdlib).

  hook_tool.py check hooks.md [--max-words 8] [--max-chars 26]

Formato: una linea por gancho, `tipo | texto`. Tipos: pregunta, error,
promesa, contraste, lista. Las lineas que empiezan por # o ( se ignoran.
Reutiliza el conteo de palabras, el ajuste de linea y la lista de dialecto de
reel-script-ar, y la regla de afirmaciones de reel-caption-post. Solo lee.
"""
import argparse
import importlib.util
import re
import sys
from pathlib import Path

TYPES = ("pregunta", "error", "promesa", "contraste", "lista")
NUMBER_WORDS = ("اثنان", "اثنين", "ثلاث", "أربع", "اربع", "خمس", "ست", "سبع", "ثمان", "تسع", "عشر")
CLICHES = ("هل تعلم", "لن تصدق", "صدمة", "اسرار", "أسرار")
SKILLS = Path(__file__).resolve().parents[2]


def load(skill, script):
    p = SKILLS / skill / "scripts" / script
    if not p.exists():
        return None
    spec = importlib.util.spec_from_file_location(p.stem, p)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def parse(text):
    """Devuelve ([(n, tipo, texto)], [errores de formato])."""
    hooks, errs = [], []
    for n, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("("):
            continue
        if "|" not in line:
            errs.append((n, "falta `tipo | texto`"))
            continue
        t, _, body = line.partition("|")
        t, body = t.strip().lower(), body.strip()
        if t not in TYPES:
            errs.append((n, f"tipo {t!r} desconocido (usa {', '.join(TYPES)})"))
        elif not body:
            errs.append((n, "gancho vacio"))
        else:
            hooks.append((n, t, body))
    return hooks, errs


def tokens(s, norm):
    return {norm(w) for w in s.split() if norm(w)}


def check(hooks, errs, max_words=8, max_chars=26):
    st, post = load("reel-script-ar", "script_tool.py"), load("reel-caption-post", "post_tool.py")
    rows = [("FAIL", f"linea {n}: {m}") for n, m in errs]
    if st is None or post is None:
        rows.append(("WARN", "faltan reel-script-ar o reel-caption-post: no se revisan dialecto ni afirmaciones"))
    if not hooks:
        return rows + [("FAIL", "no hay ganchos validos")]
    if len(hooks) < 5:
        rows.append(("WARN", f"solo {len(hooks)} ganchos: pide al menos 5 para poder elegir"))
    types = [t for _, t, _ in hooks]
    if len(set(types)) < 3 and len(hooks) >= 3:
        rows.append(("WARN", f"solo {len(set(types))} tipos distintos ({', '.join(sorted(set(types)))}): usa al menos 3"))
    elif len(hooks) >= 4 and max(types.count(t) for t in set(types)) / len(hooks) > 0.5:
        rows.append(("WARN", "mas de la mitad de los ganchos son del mismo tipo"))
    norm = st.norm if st else (lambda w: re.sub(r"\W", "", w))
    sets = []
    for n, t, body in hooks:
        tag = f"[linea {n}, {t}]"
        words = st.words(body) if st else body.split()
        if "[VERIFICAR]" in body:
            rows.append(("FAIL", f"{tag} queda [VERIFICAR]: confirma el dato con el usuario o quitalo"))
        if len(words) > max_words:
            rows.append(("FAIL", f"{tag} {len(words)} palabras (maximo {max_words})"))
        if st and len(st.wrap(body, max_chars)) > 2:
            rows.append(("FAIL", f"{tag} ocupa mas de 2 lineas de subtitulo"))
        if st:
            hits = st.dialect_hits(words)
            if hits:
                rows.append(("WARN", f"{tag} posible dialecto ({', '.join(hits)})"))
            if st.AR_DIGITS.search(body) and st.W_DIGITS.search(body):
                rows.append(("WARN", f"{tag} mezcla cifras arabes y occidentales"))
        if post:
            claims = sorted({m.group(0) for m in post.CLAIM.finditer(body)})
            if claims:
                rows.append(("WARN", f"{tag} afirmacion con cifra o promesa ({', '.join(claims)}): confirma que hay dato"))
        if t == "pregunta" and "؟" not in body and "?" not in body:
            rows.append(("WARN", f"{tag} es de tipo pregunta pero no lleva ؟"))
        if t == "lista" and not (re.search(r"[0-9\u0660-\u0669]", body) or any(w in body for w in NUMBER_WORDS)):
            rows.append(("WARN", f"{tag} es de tipo lista pero no lleva ningun numero"))
        for c in CLICHES:
            if c in body:
                rows.append(("WARN", f"{tag} formula gastada o sensacionalista ({c})"))
        sets.append((n, tokens(body, norm)))
    for i, (n1, a) in enumerate(sets):
        for n2, b in sets[i + 1:]:
            if a and b and len(a & b) / len(a | b) >= 0.6:
                rows.append(("WARN", f"lineas {n1} y {n2}: casi iguales; sobra una"))
    if not any(lv == "FAIL" for lv, _ in rows):
        rows.append(("OK", f"{len(hooks)} ganchos, {len(set(types))} tipos, todos de {max_words} palabras o menos"))
    return rows


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["check"])
    ap.add_argument("hooks")
    ap.add_argument("--max-words", type=int, default=8)
    ap.add_argument("--max-chars", type=int, default=26)
    a = ap.parse_args(argv)
    try:
        text = Path(a.hooks).read_text(encoding="utf-8")
    except OSError as ex:
        print(f"no se puede leer {a.hooks}: {ex}")
        return 2
    hooks, errs = parse(text)
    rows = check(hooks, errs, a.max_words, a.max_chars)
    for lv, m in rows:
        print(f"[{lv:4}] {m}")
    print(f"\n{sum(1 for lv, _ in rows if lv == 'FAIL')} FAIL, {sum(1 for lv, _ in rows if lv == 'WARN')} WARN")
    return 1 if any(lv == "FAIL" for lv, _ in rows) else 0


if __name__ == "__main__":
    sys.exit(main())
