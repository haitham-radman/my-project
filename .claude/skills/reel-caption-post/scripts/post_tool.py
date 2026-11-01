#!/usr/bin/env python3
"""Comprueba el borrador de descripcion y hashtags de un reel (stdlib).

  post_tool.py check post.md [--max-chars 2200] [--max-hashtags 5]

Formato: secciones `## tiktok` y `## instagram`; las lineas que empiezan por
`(` son notas y se ignoran. Comprueba limite de caracteres, numero y forma de
los hashtags, repetidos, marcas [VERIFICAR] sin resolver y posible dialecto.

Los limites por defecto (2200 caracteres, 5 hashtags) salen de fuentes
secundarias de 2026 y de la nota de Instagram sobre 5 hashtags; la referencia
de Meta para desarrolladores aun lista 30. Verificalos en la app y cambialos
con --max-chars / --max-hashtags. Solo lee: no publica nada.
"""
import argparse
import importlib.util
import re
import sys
from pathlib import Path

PLATFORMS = ("tiktok", "instagram")
HASHTAG = re.compile(r"#\S*")
VALID_TAG = re.compile(r"^#[\w]+$")
# Cifras con efecto ("10 اضعاف", "50%") y promesas ("مضمون"): exigen un dato verificado.
CLAIM = re.compile(r"(?:[0-9\u0660-\u0669]+\s*(?:%|\u066a|[\u0623\u0627]?\u0636\u0639\u0627\u0641|\u0636\u0639\u0641|\u0645\u0631\u0629)|\u0645\u0636\u0645\u0648\u0646|\u0636\u0645\u0627\u0646)")
TASHKEEL = re.compile(r"[ً-ٰٟۖ-ۭ]")
SCRIPT_TOOL = Path(__file__).resolve().parents[2] / "reel-script-ar" / "scripts" / "script_tool.py"


def dialect_fn():
    if not SCRIPT_TOOL.exists():
        return None
    spec = importlib.util.spec_from_file_location("script_tool", SCRIPT_TOOL)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.dialect_hits


def parse(text):
    """Devuelve {plataforma: texto} sin notas ni cabeceras."""
    out, cur = {}, None
    for raw in text.splitlines():
        line = raw.rstrip()
        m = re.match(r"^##\s*(\w+)", line.strip())
        if m:
            cur = m.group(1).lower()
            out.setdefault(cur, [])
        elif cur is not None and not line.strip().startswith("("):
            out[cur].append(line)
    return {k: "\n".join(v).strip() for k, v in out.items()}


def length(text):
    """Cuenta como las apps: unidades UTF-16 (un emoji suma 2)."""
    return len(text.encode("utf-16-le")) // 2


def check(sections, max_chars=2200, max_hashtags=5, dialect=None):
    rows = []
    missing = [p for p in PLATFORMS if p not in sections]
    if missing:
        rows.append(("FAIL", "faltan secciones: " + ", ".join(missing)))
    for plat in PLATFORMS:
        t = sections.get(plat)
        if t is None:
            continue
        tag = f"[{plat}]"
        if not t:
            rows.append(("FAIL", f"{tag} esta vacio"))
            continue
        n = length(t)
        rows.append(("FAIL" if n > max_chars else "OK", f"{tag} {n} caracteres (maximo {max_chars})"))
        tags = HASHTAG.findall(t)
        rows.append(("FAIL" if len(tags) > max_hashtags else "OK", f"{tag} {len(tags)} hashtags (maximo {max_hashtags})"))
        bad = [h for h in tags if not VALID_TAG.match(h) or TASHKEEL.search(h)]
        if bad:
            rows.append(("WARN", f"{tag} hashtags mal formados (espacios, signos o tashkeel): {' '.join(bad)}"))
        dup = sorted({h.lower() for h in tags if [x.lower() for x in tags].count(h.lower()) > 1})
        if dup:
            rows.append(("WARN", f"{tag} hashtags repetidos: {' '.join(dup)}"))
        claims = sorted({m.group(0) for m in CLAIM.finditer(t)})
        if claims and "[VERIFICAR]" not in t:
            rows.append(("WARN", f"{tag} afirmacion con cifra o promesa ({', '.join(claims)}): confirma que el usuario aporto el dato"))
        if "[VERIFICAR]" in t:
            rows.append(("FAIL", f"{tag} queda una marca [VERIFICAR]: confirma el dato con el usuario o quitalo"))
        body = HASHTAG.sub(" ", t)
        if dialect:
            hits = dialect(body.split())
            if hits:
                rows.append(("WARN", f"{tag} posible dialecto ({', '.join(hits)}); el usuario pidio فصحى مبسطة"))
    if len(sections) == 2 and all(sections.get(p) for p in PLATFORMS):
        if sections["tiktok"] == sections["instagram"]:
            rows.append(("WARN", "las dos descripciones son identicas: ajusta cada una a su plataforma o confirma que es intencionado"))
    return rows


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["check"])
    ap.add_argument("post")
    ap.add_argument("--max-chars", type=int, default=2200)
    ap.add_argument("--max-hashtags", type=int, default=5)
    a = ap.parse_args(argv)
    try:
        text = Path(a.post).read_text(encoding="utf-8")
    except OSError as ex:
        print(f"no se puede leer {a.post}: {ex}")
        return 2
    rows = check(parse(text), a.max_chars, a.max_hashtags, dialect_fn())
    for lv, m in rows:
        print(f"[{lv:4}] {m}")
    fails = sum(1 for lv, _ in rows if lv == "FAIL")
    print(f"\n{fails} FAIL, {sum(1 for lv, _ in rows if lv == 'WARN')} WARN")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
