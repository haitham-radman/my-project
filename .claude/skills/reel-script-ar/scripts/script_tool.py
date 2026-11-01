#!/usr/bin/env python3
"""Guion de reel en arabe: comprueba duracion y subtitulos, y genera captions.json (stdlib).

  script_tool.py check script.md [--seconds 30] [--wps 2.3] [--max-chars 20]
  script_tool.py captions script.md --out captions.json [--seconds 30] [--wps 2.3] [--max-chars 20] [--force]

Formato: cada linea no vacia es UN subtitulo (maximo 2 lineas visuales).
Las lineas `## gancho`, `## desarrollo` y `## cierre` marcan secciones.
`captions.json` sigue el tipo Caption de Remotion, con tiempos ESTIMADOS por
numero de palabras: sustituyelos por los de la voz real cuando exista.
Valores por confirmar con el usuario: --wps 2.3 (valor de partida). --max-chars 20 sale de medir
subtitulos a 72 px: con 26 pasaban frases que ocupaban 3 lineas; recalibrar con Cairo.
"""
import argparse
import json
import re
import sys
from pathlib import Path

TASHKEEL = re.compile(r"[ً-ٰٟۖ-ۭـ]")
ARABIC = re.compile(r"[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]")
LATIN = re.compile(r"[A-Za-z]")
AR_DIGITS = re.compile(r"[٠-٩۰-۹]")
W_DIGITS = re.compile(r"[0-9]")
SECTIONS = ("gancho", "desarrollo", "cierre")
# Marcas frecuentes de dialecto (heuristica: solo avisa; decide el usuario).
DIALECT = {
    "ده", "دي", "دا", "كده", "دلوقتي", "ازاي", "إزاي", "عشان", "مش", "فين", "ليه", "بقى",
    "شو", "هيك", "كتير", "هلق", "ليش", "شلون", "وش", "ايش", "إيش", "زين", "الحين", "بزاف", "واش", "دابا", "هادي",
    "لازم", "كويس", "جوا", "شي", "كمان", "هلأ", "بدي", "بدك",
}


def dialect_hits(tokens):
    """Marcas de dialecto, tambien con prefijo و/ف pegado (ودلوقتي, ومش)."""
    hits = set()
    for t in tokens:
        n = norm(t)
        if n in DIALECT:
            hits.add(n)
        elif len(n) > 2 and n[0] in "وف" and n[1:] in DIALECT:
            hits.add(n[1:])
    return sorted(hits)
MAX_PAGE_WORDS = 12
MAX_HOOK_WORDS = 8


def words(text):
    return [w for w in re.split(r"\s+", text.strip()) if re.search(r"\w", w)]


def norm(w):
    return re.sub(r"[^\w]", "", TASHKEEL.sub("", w))


def wrap(text, max_chars):
    lines, cur = [], ""
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > max_chars:
            lines.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    return lines + ([cur] if cur else [])


def parse(text):
    """Devuelve [(seccion|None, texto)]."""
    pages, sec = [], None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"^##\s*(\w+)", line)
        if m:
            sec = m.group(1).lower()
            continue
        if line.startswith("#") or line.startswith("("):
            continue
        pages.append((sec, line))
    return pages


def check(pages, seconds=30, wps=2.3, max_chars=20):
    rows = []
    if not pages:
        return [("FAIL", "el guion esta vacio")], 0
    total = sum(len(words(t)) for _, t in pages)
    est = total / wps
    if est > seconds + 2:
        rows.append(("FAIL", f"{total} palabras = ~{est:.0f} s a {wps} pal/s; el reel dura {seconds} s: recorta ~{int(total - seconds * wps)} palabras"))
    elif est < seconds - 5:
        rows.append(("WARN", f"{total} palabras = ~{est:.0f} s: faltan ~{int(seconds * wps - total)} palabras para llegar a {seconds} s"))
    else:
        rows.append(("OK", f"{total} palabras = ~{est:.0f} s (objetivo {seconds} s)"))
    secs = {s for s, _ in pages}
    missing = [s for s in SECTIONS if s not in secs]
    if missing:
        rows.append(("WARN", "faltan secciones: " + ", ".join(missing)))
    first = next((t for s, t in pages if s in (None, "gancho")), pages[0][1])
    if len(words(first)) > MAX_HOOK_WORDS:
        rows.append(("WARN", f"el gancho tiene {len(words(first))} palabras (maximo {MAX_HOOK_WORDS}): hazlo mas corto"))
    for i, (_, t) in enumerate(pages, 1):
        n = len(words(t))
        lines = wrap(t, max_chars)
        if len(lines) > 2:
            rows.append(("FAIL", f"subtitulo {i}: {len(lines)} lineas (maximo 2): parte la frase"))
        if n > MAX_PAGE_WORDS:
            rows.append(("WARN", f"subtitulo {i}: {n} palabras, frase larga (maximo {MAX_PAGE_WORDS})"))
        hits = dialect_hits(words(t))
        if hits:
            rows.append(("WARN", f"subtitulo {i}: posible dialecto ({', '.join(hits)}); el usuario pidio فصحى مبسطة"))
        if any(len(w) > max_chars for w in t.split()):
            rows.append(("WARN", f"subtitulo {i}: una palabra supera {max_chars} caracteres"))
    body = " ".join(t for _, t in pages)
    if AR_DIGITS.search(body) and W_DIGITS.search(body):
        rows.append(("WARN", "mezcla cifras arabes (٣) y occidentales (3): usa un solo tipo (pendiente de confirmar cual)"))
    latin = sorted({w for w in body.split() if LATIN.search(w) and not ARABIC.search(w)})
    if latin:
        rows.append(("OK", "palabras latinas (van en su propio span en el subtitulo): " + ", ".join(latin)))
    return rows, total


def to_captions(pages, seconds=30, wps=2.3):
    total = sum(len(words(t)) for _, t in pages)
    dur_ms = min(seconds, total / wps) * 1000 if total else 0
    out, t = [], 0.0
    for _, text in pages:
        d = dur_ms * len(words(text)) / total
        out.append({"text": text, "startMs": round(t), "endMs": round(t + d), "timestampMs": None, "confidence": None})
        t += d
    return out


def report(rows):
    for lv, m in rows:
        print(f"[{lv:4}] {m}")
    fails = sum(1 for lv, _ in rows if lv == "FAIL")
    print(f"\n{fails} FAIL, {sum(1 for lv, _ in rows if lv == 'WARN')} WARN")
    return 1 if fails else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["check", "captions"])
    ap.add_argument("script")
    ap.add_argument("--seconds", type=float, default=30)
    ap.add_argument("--wps", type=float, default=2.3)
    ap.add_argument("--max-chars", type=int, default=20)
    ap.add_argument("--out")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args(argv)
    try:
        pages = parse(Path(a.script).read_text(encoding="utf-8"))
    except OSError as ex:
        print(f"no se puede leer {a.script}: {ex}")
        return 2
    rows, _ = check(pages, a.seconds, a.wps, a.max_chars)
    if a.cmd == "check":
        return report(rows)
    if not a.out:
        print("falta --out")
        return 2
    if any(lv == "FAIL" for lv, _ in rows):
        report(rows)
        print("NO SE GENERA captions.json: corrige los FAIL.")
        return 1
    out = Path(a.out)
    if out.exists() and not a.force:
        print(f"{out} ya existe; usa --force solo si el usuario lo aprueba.")
        return 2
    out.write_text(json.dumps(to_captions(pages, a.seconds, a.wps), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"generado {out} ({len(pages)} subtitulos; tiempos ESTIMADOS)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
