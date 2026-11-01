#!/usr/bin/env python3
"""Prepara las copias de entrega de un reel para TikTok e Instagram (stdlib + ffmpeg).

  export_reel.py <reel.mp4> --slug <tema> [--platforms tiktok instagram]
                 [--out out/export] [--date AAAA-MM-DD] [--reencode]

Comprueba 1080x1920, 30 fps, h264 yuv420p y audio aac. Si cumple, copia el
archivo; si solo falla el codec, pixel format o audio, `--reencode` lo
corrige. Una resolucion o un fps distintos nunca se "arreglan" aqui: se
vuelve a renderizar. No sube ni publica nada y no sobrescribe archivos.
"""
import argparse
import datetime
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

PLATFORMS = ("tiktok", "instagram")
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
                       capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"ffprobe fallo: {r.stderr.strip()}")
    return json.loads(r.stdout)


def problems(info, width=1080, height=1920, fps=30):
    """Devuelve (fatales, recodificables)."""
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    fatal, fixable = [], []
    if not v:
        return ["sin pista de video"], []
    n, d = v["r_frame_rate"].split("/")
    got_fps = float(n) / float(d or 1)
    if (v["width"], v["height"]) != (width, height):
        fatal.append(f"resolucion {v['width']}x{v['height']}, deberia ser {width}x{height}: vuelve a renderizar")
    if abs(got_fps - fps) > 0.01:
        fatal.append(f"fps {got_fps:g}, deberia ser {fps}: vuelve a renderizar")
    if v.get("codec_name") != "h264":
        fixable.append(f"codec {v.get('codec_name')}, deberia ser h264")
    if v.get("pix_fmt") != "yuv420p":
        fixable.append(f"pix_fmt {v.get('pix_fmt')}, deberia ser yuv420p")
    if a is None:
        fatal.append("sin audio: confirma con el usuario si es intencionado")
    elif a.get("codec_name") != "aac":
        fixable.append(f"audio {a.get('codec_name')}, deberia ser aac")
    return fatal, fixable


def target_name(date, slug, platform):
    return f"{date}_{slug}_{platform}.mp4"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--platforms", nargs="+", choices=PLATFORMS, default=list(PLATFORMS))
    ap.add_argument("--out", default="out/export")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    ap.add_argument("--reencode", action="store_true")
    a = ap.parse_args(argv)

    if not SLUG.match(a.slug):
        print(f"slug invalido {a.slug!r}: usa minusculas, numeros y guiones (ej. 3-errores-de-caja)")
        return 2
    src = Path(a.video)
    if not src.is_file():
        print(f"no existe {src}")
        return 2
    out = Path(a.out)
    dests = {p: out / target_name(a.date, a.slug, p) for p in a.platforms}
    existing = [str(d) for d in dests.values() if d.exists()]
    if existing:
        print("ya existen (no se sobrescribe): " + ", ".join(existing))
        return 2

    fatal, fixable = problems(probe(src))
    for m in fatal + fixable:
        print(f"- {m}")
    if fatal:
        print("NO SE EXPORTA: corrige lo anterior en el proyecto y renderiza otra vez.")
        return 1
    if fixable and not a.reencode:
        print("Se puede corregir con --reencode (recodifica; pide permiso al usuario antes).")
        return 1

    out.mkdir(parents=True, exist_ok=True)
    first = None
    for p, dest in dests.items():
        if first is None:
            if fixable:
                subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(src), "-c:v", "libx264", "-pix_fmt", "yuv420p",
                                "-c:a", "aac", "-movflags", "+faststart", str(dest)], check=True)
            else:
                shutil.copyfile(src, dest)
            first = dest
        else:
            shutil.copyfile(first, dest)
        print(f"{dest}  sha256={sha256(dest)[:16]}  ({dest.stat().st_size / 1e6:.1f} MB)")
    print("Listo en disco. Nada se ha subido ni publicado: eso lo haces tu.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
