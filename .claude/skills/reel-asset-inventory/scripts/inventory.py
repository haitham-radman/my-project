#!/usr/bin/env python3
"""Inventario de assets de un proyecto de reel (stdlib; usa ffprobe si esta).

  inventory.py <proyecto> [--assets public] [--src src] [--seconds 30] [--json]

Lista clips, audios, imagenes y fuentes con sus datos y marca:
  FALTA    archivo referenciado en el codigo que no existe
  SIN USO  archivo que ningun codigo referencia
  AVISO    clip que no es 9:16, fps distinto de 30, audio mas corto que el reel,
           fuente sin letras arabes
Solo lee; no mueve ni borra nada.
"""
import argparse
import json
import re
import struct
import subprocess
import sys
from pathlib import Path

VIDEO = {".mp4", ".mov", ".webm", ".mkv", ".m4v"}
AUDIO = {".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"}
IMAGE = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
FONT = {".ttf", ".otf", ".woff", ".woff2"}
ARABIC_PROBE = [0x0627, 0x0628, 0x0644, 0x0645, 0x064A]  # ا ب ل م ي
REF = re.compile(r"""staticFile\(\s*['"`]([^'"`]+)['"`]\s*\)|['"`]([\w./@-]+\.(?:mp4|mov|webm|mkv|m4v|mp3|wav|m4a|aac|ogg|flac|png|jpe?g|webp|gif|svg|ttf|otf|woff2?))['"`]""")


def cmap_codepoints(path):
    """Conjunto de puntos de codigo de un TTF/OTF (cmap formatos 4 y 12); None si no se puede leer."""
    try:
        data = Path(path).read_bytes()
        if data[:4] not in (b"\x00\x01\x00\x00", b"OTTO", b"true"):
            return None
        n = struct.unpack(">H", data[4:6])[0]
        off = next(struct.unpack(">4sIII", data[12 + 16 * i:28 + 16 * i])[2] for i in range(n) if data[12 + 16 * i:16 + 16 * i] == b"cmap")
        cps = set()
        for i in range(struct.unpack(">H", data[off + 2:off + 4])[0]):
            _, _, sub = struct.unpack(">HHI", data[off + 4 + 8 * i:off + 12 + 8 * i])
            fmt = struct.unpack(">H", data[off + sub:off + sub + 2])[0]
            if fmt == 4:
                segx2 = struct.unpack(">H", data[off + sub + 6:off + sub + 8])[0]
                seg = segx2 // 2
                ends = struct.unpack(f">{seg}H", data[off + sub + 14:off + sub + 14 + segx2])
                starts = struct.unpack(f">{seg}H", data[off + sub + 16 + segx2:off + sub + 16 + 2 * segx2])
                for s, e in zip(starts, ends):
                    if s <= 0x06FF and e >= 0x0600:
                        cps.update(range(max(s, 0x0600), min(e, 0x06FF) + 1))
            elif fmt == 12:
                ng = struct.unpack(">I", data[off + sub + 12:off + sub + 16])[0]
                for g in range(ng):
                    s, e, _ = struct.unpack(">III", data[off + sub + 16 + 12 * g:off + sub + 28 + 12 * g])
                    if s <= 0x06FF and e >= 0x0600:
                        cps.update(range(max(s, 0x0600), min(e, 0x06FF) + 1))
        return cps
    except (StopIteration, struct.error, OSError, IndexError):
        return None


def ffprobe(path):
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
                           capture_output=True, text=True, timeout=60)
        return json.loads(r.stdout) if r.returncode == 0 else None
    except (FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return None


def describe(path):
    ext = path.suffix.lower()
    row = {"file": None, "kind": None, "info": "", "flags": []}
    if ext in VIDEO | AUDIO:
        info = ffprobe(path)
        row["kind"] = "video" if ext in VIDEO else "audio"
        if not info:
            row["info"] = "ffprobe no disponible o fallo"
            return row
        v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
        has_a = any(s["codec_type"] == "audio" for s in info["streams"])
        dur = float(info["format"].get("duration", 0))
        row["duration"] = dur
        if v:
            n, d = v["r_frame_rate"].split("/")
            fps = float(n) / float(d or 1)
            row.update(width=v["width"], height=v["height"], fps=round(fps, 2))
            row["info"] = f"{v['width']}x{v['height']} {fps:g} fps {dur:.1f} s {'con audio' if has_a else 'sin audio'}"
        else:
            row["kind"] = "audio"
            row["info"] = f"{dur:.1f} s"
    elif ext in IMAGE:
        row["kind"] = "imagen"
        try:
            from PIL import Image
            with Image.open(path) as im:
                row["info"] = f"{im.size[0]}x{im.size[1]}"
        except Exception:
            row["info"] = f"{path.stat().st_size // 1024} KB"
    elif ext in FONT:
        row["kind"] = "fuente"
        cps = cmap_codepoints(path) if ext in (".ttf", ".otf") else None
        if cps is None:
            row["info"] = "cobertura arabe no verificada"
            row["arabic"] = None
        else:
            ok = all(c in cps for c in ARABIC_PROBE)
            row["arabic"] = ok
            row["info"] = "con letras arabes" if ok else "SIN letras arabes"
    else:
        row["kind"] = "otro"
        row["info"] = f"{path.stat().st_size // 1024} KB"
    return row


def referenced(src_dir):
    refs = set()
    for p in Path(src_dir).rglob("*"):
        if p.suffix in {".ts", ".tsx", ".js", ".jsx", ".html", ".json"} and "node_modules" not in p.parts and p.is_file():
            for m in REF.finditer(p.read_text(encoding="utf-8", errors="ignore")):
                refs.add((m.group(1) or m.group(2)).lstrip("./"))
    return refs


def build(project, assets="public", src="src", seconds=30):
    project = Path(project)
    adir = project / assets
    rows = []
    files = sorted(p for p in adir.rglob("*") if p.is_file()) if adir.is_dir() else []
    refs = referenced(project / src) if (project / src).is_dir() else set()
    names = set()
    for p in files:
        rel = p.relative_to(adir).as_posix()
        names.add(rel)
        row = describe(p)
        row["file"] = rel
        used = any(r == rel or r.endswith("/" + rel) or rel.endswith("/" + r) for r in refs)
        row["used"] = used
        if not used:
            row["flags"].append("SIN USO")
        if row["kind"] == "video" and "width" in row:
            if row["height"] <= row["width"]:
                row["flags"].append("AVISO no es vertical 9:16")
            if abs(row["fps"] - 30) > 0.01:
                row["flags"].append(f"AVISO {row['fps']:g} fps (el reel va a 30)")
        if row["kind"] == "audio" and used and row.get("duration", seconds) < seconds:
            row["flags"].append(f"AVISO dura {row['duration']:.0f} s, menos que el reel")
        if row["kind"] == "fuente" and row.get("arabic") is False:
            row["flags"].append("AVISO sin letras arabes")
        rows.append(row)
    missing = sorted(r for r in refs if not any(r == n or r.endswith("/" + n) or n.endswith("/" + r) for n in names)
                     and Path(r).suffix.lower() in VIDEO | AUDIO | IMAGE | FONT)
    return rows, missing


def render(rows, missing):
    lines = ["| Archivo | Tipo | Datos | Estado |", "|---|---|---|---|"]
    for r in rows:
        lines.append(f"| {r['file']} | {r['kind']} | {r['info']} | {'; '.join(r['flags']) or 'OK'} |")
    for m in missing:
        lines.append(f"| {m} | - | referenciado en el codigo | FALTA |")
    n = lambda k: sum(1 for r in rows for f in r["flags"] if f.startswith(k)) + (len(missing) if k == "FALTA" else 0)
    lines.append(f"\n{len(rows)} archivos: {n('FALTA')} FALTA, {n('AVISO')} AVISO, {n('SIN USO')} SIN USO")
    return "\n".join(lines)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("--assets", default="public")
    ap.add_argument("--src", default="src")
    ap.add_argument("--seconds", type=float, default=30)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    if not Path(a.project, a.assets).is_dir():
        print(f"no existe la carpeta de assets {Path(a.project, a.assets)}")
        return 2
    rows, missing = build(a.project, a.assets, a.src, a.seconds)
    print(json.dumps({"files": rows, "missing": missing}, ensure_ascii=False, indent=1) if a.json else render(rows, missing))
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
