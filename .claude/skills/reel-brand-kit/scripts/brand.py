#!/usr/bin/env python3
"""Marca de un reel: valida brand.json y genera src/brand.config.ts (stdlib).

  brand.py check brand.json          valida; lista lo que sigue PENDIENTE
  brand.py emit brand.json --out src/brand.config.ts [--force]

`check` sale con 1 si hay valores invalidos (los pendientes no fallan).
`emit` se niega si queda algun campo obligatorio pendiente o invalido, y no
sobrescribe sin --force. Nunca inventa valores: lo que no esta, se pregunta.
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path

REQUIRED = [
    ("colors", "background"), ("colors", "text"), ("colors", "highlight"),
    ("fonts", "arabic", "family"),
    ("captions", "fontSize"),
]
OPTIONAL = [("colors", "accent"), ("fonts", "latin", "family"), ("logo", "file"), ("logo", "position"), ("logo", "maxWidth")]
POSITIONS = {"top-left", "top-right", "bottom-left", "bottom-right"}
HIGHLIGHTS = {"word", "line", "none"}
WIDTH, HEIGHT = 1080, 1920
MIN_CONTRAST = 4.5  # WCAG AA para texto normal
INVENTORY = Path(__file__).resolve().parents[2] / "reel-asset-inventory" / "scripts" / "inventory.py"


def get(d, path):
    for k in path:
        if not isinstance(d, dict) or k not in d:
            return None
        d = d[k]
    return d


def is_hex(v):
    return isinstance(v, str) and len(v) == 7 and v[0] == "#" and all(c in "0123456789abcdefABCDEF" for c in v[1:])


def luminance(h):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (int(h[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def arabic_coverage(font_path):
    if not INVENTORY.exists():
        return None
    spec = importlib.util.spec_from_file_location("inventory", INVENTORY)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    cps = mod.cmap_codepoints(font_path)
    return None if cps is None else all(c in cps for c in mod.ARABIC_PROBE)


def check(brand, base):
    """Devuelve (pendientes, problemas, notas)."""
    pending, problems, notes = [], [], []
    for path in REQUIRED + OPTIONAL:
        if get(brand, path) is None:
            pending.append(("." .join(path), path in REQUIRED))
    for key in ("background", "text", "highlight", "accent"):
        v = get(brand, ("colors", key))
        if v is not None and not is_hex(v):
            problems.append(f"colors.{key}={v!r}: usa #RRGGBB")
    bg, tx, hl = (get(brand, ("colors", k)) for k in ("background", "text", "highlight"))
    for name, c in (("text", tx), ("highlight", hl)):
        if is_hex(bg) and is_hex(c):
            r = contrast(bg, c)
            (notes if r >= MIN_CONTRAST else problems).append(
                f"contraste {name}/background {r:.1f}:1" + ("" if r >= MIN_CONTRAST else f" (minimo {MIN_CONTRAST}:1 para leerse en el movil)"))
    fs = get(brand, ("captions", "fontSize"))
    if fs is not None and not (isinstance(fs, int) and 40 <= fs <= 140):
        problems.append(f"captions.fontSize={fs!r}: entero entre 40 y 140")
    ml = get(brand, ("captions", "maxLines"))
    if ml is not None and ml not in (1, 2, 3):
        problems.append(f"captions.maxLines={ml!r}: 1, 2 o 3")
    hlmode = get(brand, ("captions", "highlight"))
    if hlmode is not None and hlmode not in HIGHLIGHTS:
        problems.append(f"captions.highlight={hlmode!r}: {sorted(HIGHLIGHTS)}")
    pos = get(brand, ("logo", "position"))
    if pos is not None and pos not in POSITIONS:
        problems.append(f"logo.position={pos!r}: {sorted(POSITIONS)}")
    safe = get(brand, ("safe",)) or {}
    vals = [safe.get(k) for k in ("top", "bottom", "left", "right")]
    if not all(isinstance(v, int) and v >= 0 for v in vals):
        problems.append("safe: top, bottom, left y right deben ser enteros >= 0")
    else:
        if safe["top"] + safe["bottom"] >= HEIGHT or safe["left"] + safe["right"] >= WIDTH:
            problems.append("safe: los margenes no dejan area util")
        mw = get(brand, ("logo", "maxWidth"))
        if mw is not None and (not isinstance(mw, int) or mw > WIDTH - safe["left"] - safe["right"]):
            problems.append(f"logo.maxWidth={mw!r}: debe ser entero y caber en {WIDTH - safe['left'] - safe['right']} px")
    a = get(brand, ("audio",)) or {}
    if not (isinstance(a.get("peakMaxDb"), (int, float)) and isinstance(a.get("meanMinDb"), (int, float))
            and isinstance(a.get("meanMaxDb"), (int, float)) and a["meanMinDb"] < a["meanMaxDb"] <= 0 and a["peakMaxDb"] <= 0):
        problems.append("audio: peakMaxDb, meanMinDb < meanMaxDb <= 0 (dB)")
    for label, path in (("fonts.arabic.file", ("fonts", "arabic", "file")), ("fonts.latin.file", ("fonts", "latin", "file")),
                        ("logo.file", ("logo", "file"))):
        f = get(brand, path)
        if f is None:
            continue
        p = (base / f)
        if not p.is_file():
            problems.append(f"{label}={f!r}: no existe")
        elif label == "fonts.arabic.file":
            cov = arabic_coverage(p)
            if cov is False:
                problems.append(f"{label}={f!r}: la fuente no tiene letras arabes")
            elif cov is None:
                notes.append(f"{label}: cobertura arabe no verificada")
    return pending, problems, notes


def google_module(family):
    return "".join(family.split()) if family else None


def emit_ts(brand):
    out = json.loads(json.dumps(brand))
    out["fonts"]["arabic"]["googleFontsModule"] = google_module(get(brand, ("fonts", "arabic", "family")))
    out["fonts"]["latin"]["googleFontsModule"] = google_module(get(brand, ("fonts", "latin", "family")))
    body = json.dumps(out, ensure_ascii=False, indent=2)
    return ("// Generado por reel-brand-kit desde brand.json. No editar a mano: cambia brand.json y vuelve a generar.\n"
            f"export const BRAND = {body} as const;\n")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check"); c.add_argument("brand")
    e = sub.add_parser("emit"); e.add_argument("brand"); e.add_argument("--out", required=True); e.add_argument("--force", action="store_true")
    a = ap.parse_args(argv)
    path = Path(a.brand)
    try:
        brand = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as ex:
        print(f"no se puede leer {path}: {ex}")
        return 2
    pending, problems, notes = check(brand, path.parent)
    for n in notes:
        print(f"[OK     ] {n}")
    for name, req in pending:
        print(f"[PENDIENTE] {name}" + (" (obligatorio)" if req else " (opcional)"))
    for p in problems:
        print(f"[ERROR  ] {p}")
    blocking = [n for n, req in pending if req]
    if a.cmd == "check":
        print(f"{len(blocking)} obligatorios pendientes, {len(problems)} errores")
        return 1 if problems else 0
    if problems or blocking:
        print("NO SE GENERA: completa los obligatorios y corrige los errores (pregunta al usuario, no inventes).")
        return 1
    out = Path(a.out)
    if out.exists() and not a.force:
        print(f"{out} ya existe; usa --force solo si el usuario lo aprueba.")
        return 2
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(emit_ts(brand), encoding="utf-8")
    print(f"generado {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
