#!/usr/bin/env python3
"""Lint de subtitulos en arabe para proyectos Remotion/HyperFrames (stdlib).

Busca los fallos que desconectan las letras o cortan el texto:
  A1 split('') / Array.from / [...texto]  -> letras sueltas (error)
  A2 letterSpacing / textTransform         -> rompe la union de letras
  A3 inline-block sin dir/direction        -> frase al reves
  A4 sin fuente arabe explicita            -> cae a la fuente del sistema
  A5 white-space: nowrap sin maxWidth      -> texto cortado por el borde

Uso: check_arabic.py <carpeta-o-archivo> [--strict]
Salida 1 si hay errores (o avisos con --strict).
"""
import argparse
import re
import sys
from pathlib import Path

ARABIC = re.compile(r"[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]")
RELEVANT = re.compile(r"arabic|\blang=[\"']ar|dir=[\"']rtl|direction:\s*[\"']rtl", re.I)
CAPTION_HINT = re.compile(r"caption|subtitle|karaoke", re.I)
ARABIC_FONT = re.compile(r"Arabic|Cairo|Tajawal|Amiri|Almarai|Alexandria|Readex|Harmattan|Lateef|Scheherazade|Vazirmatn", re.I)
EXTS = {".tsx", ".ts", ".jsx", ".js", ".html"}
SKIP = {"node_modules", ".git", "out", "build", "dist", ".next"}

SPLIT_EMPTY = re.compile(r"\.split\(\s*(['\"`])\1\s*\)")
ARRAY_FROM = re.compile(r"Array\.from\(\s*[\w.]*(?:text|label|title|caption|word|line|sentence)\w*\s*\)", re.I)
SPREAD = re.compile(r"\[\s*\.\.\.\s*[\w.]*(?:text|label|title|caption|sentence)\w*\s*\]", re.I)
SPACING = re.compile(r"(letterSpacing|letter-spacing|textTransform|text-transform)\s*:\s*([^,;}\n]+)")
NOWRAP = re.compile(r"(whiteSpace\s*:\s*['\"]nowrap|white-space\s*:\s*nowrap)")


def check_text(text):
    """Devuelve [(linea, nivel, codigo, mensaje)] para un archivo."""
    has_arabic = bool(ARABIC.search(text)) or bool(RELEVANT.search(text))
    caption_file = bool(CAPTION_HINT.search(text))
    if not (has_arabic or caption_file):
        return []
    out = []
    for n, line in enumerate(text.splitlines(), 1):
        if SPLIT_EMPTY.search(line) or ARRAY_FROM.search(line) or SPREAD.search(line):
            out.append((n, "error" if has_arabic else "aviso", "A1",
                        "parte el texto en letras sueltas: en arabe cada letra se dibuja aislada. Anima por palabra."))
        m = SPACING.search(line)
        if m and has_arabic and m.group(2).strip().strip("'\"") not in ("0", "0px", "normal", "none"):
            out.append((n, "aviso", "A2", f"{m.group(1)} rompe la union de letras arabes."))
    if has_arabic:
        if "inline-block" in text and not re.search(r"dir=|direction\s*:", text):
            out.append((1, "aviso", "A3", "inline-block sin dir=\"rtl\" ni direction: la frase se coloca de izquierda a derecha."))
        if not ARABIC_FONT.search(text):
            out.append((1, "aviso", "A4", "no se ve una fuente arabe explicita; el render usara la del sistema."))
    nowrap = NOWRAP.search(text)
    if nowrap and not re.search(r"maxWidth|max-width", text):
        n = text[: nowrap.start()].count("\n") + 1
        out.append((n, "aviso", "A5", "nowrap sin maxWidth: una frase larga se sale del cuadro y se corta."))
    return out


def scan(path):
    path = Path(path)
    files = [path] if path.is_file() else [
        p for p in sorted(path.rglob("*"))
        if p.suffix in EXTS and not (set(p.parts) & SKIP)
    ]
    results = []
    has_font = False
    for f in files:
        try:
            text = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        has_font = has_font or bool(ARABIC_FONT.search(text))
        for n, level, code, msg in check_text(text):
            results.append((f, n, level, code, msg))
    if has_font:  # A4 se evalua por proyecto: basta una fuente arabe cargada
        results = [r for r in results if r[3] != "A4"]
    return results


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path")
    ap.add_argument("--strict", action="store_true", help="los avisos tambien fallan")
    args = ap.parse_args(argv)
    results = scan(args.path)
    for f, n, level, code, msg in results:
        print(f"{f}:{n}: {level.upper()} {code} {msg}")
    errors = sum(1 for r in results if r[2] == "error")
    warns = len(results) - errors
    print(f"{errors} errores, {warns} avisos")
    return 1 if errors or (args.strict and warns) else 0


if __name__ == "__main__":
    sys.exit(main())
