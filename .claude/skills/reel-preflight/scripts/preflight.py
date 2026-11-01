#!/usr/bin/env python3
"""Revision antes de renderizar o entregar un reel (stdlib; Pillow solo para --sheet).

  preflight.py project <src>            composicion Remotion + linter de arabe
  preflight.py video <archivo.mp4>      formato, duracion, audio
        [--sheet hoja.png]              hoja de fotogramas con la zona segura dibujada

Con --brand brand.json (de reel-brand-kit) la zona segura y los umbrales de
audio salen de ese archivo; --safe explicito tiene prioridad sobre la marca.

Opciones comunes: --width 1080 --height 1920 --fps 30 --seconds 30
                  --safe 150,380,60,120   (arriba,abajo,izquierda,derecha; por confirmar)
                  --brand brand.json
Salida 1 si hay algun FAIL. Solo lee archivos; no renderiza ni sube nada.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

CHECKER = Path(__file__).resolve().parents[2] / "arabic-captions-fix" / "scripts" / "check_arabic.py"
LOUD_PEAK_DB = -0.5   # por encima: recorte
QUIET_MEAN_DB = -30   # por debajo: demasiado bajo (valores de partida, por confirmar)
LOUD_MEAN_DB = -10    # por encima: demasiado alto
DEFAULT_SAFE = "150,380,60,120"  # por confirmar; brand.json lo sustituye


def parse_compositions(text):
    """Devuelve [{id,width,height,fps,durationInFrames}] de los <Composition .../>."""
    comps = []
    for block in re.findall(r"<Composition\b(.*?)/>", text, re.S):
        c = {}
        for m in re.finditer(r"\b(id|width|height|fps|durationInFrames)=(?:\{\s*([^}]*?)\s*\}|\"([^\"]*)\")", block):
            c[m.group(1)] = m.group(2) if m.group(2) is not None else m.group(3)
        comps.append(c)
    return comps


def parse_consts(text):
    """Constantes numericas `const X = 30;` o `const Y = X * 30;` (se resuelven en cadena)."""
    raw = dict(re.findall(r"\bconst\s+(\w+)\s*=\s*([\w\s*+\-/()]+?)\s*;", text))
    vals = {}
    for _ in range(len(raw) + 1):
        for k, expr in raw.items():
            if k in vals:
                continue
            e = re.sub(r"[A-Za-z_]\w*", lambda m: str(vals.get(m.group(0), "?")), expr)
            if "?" not in e:
                try:
                    vals[k] = int(eval(e, {"__builtins__": {}}, {}))  # solo digitos y + - * / ( )
                except (SyntaxError, ZeroDivisionError, TypeError):
                    pass
    return vals


CONSTS = {}


def num(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return CONSTS.get(v)  # None si es una expresion que no se puede resolver


def check_composition(c, w, h, fps, secs):
    out = []
    for key, want in (("width", w), ("height", h), ("fps", fps)):
        v = num(c.get(key))
        if v is None:
            out.append(("WARN", f"{key}={c.get(key)!r} es una expresion; comprueba que viene de reel.config"))
        elif v != want:
            out.append(("FAIL", f"{key}={v}, deberia ser {want}"))
        else:
            out.append(("OK", f"{key}={v}"))
    d, f = num(c.get("durationInFrames")), num(c.get("fps")) or fps
    if d is None:
        out.append(("WARN", f"durationInFrames={c.get('durationInFrames')!r} es una expresion"))
    elif abs(d / f - secs) > 1:
        out.append(("FAIL", f"duracion {d / f:.1f} s, deberia ser {secs} s"))
    else:
        out.append(("OK", f"duracion {d / f:.1f} s"))
    return out


def run_project(src, a):
    rows = []
    comps = []
    CONSTS.clear()
    for p in sorted(Path(src).rglob("*.ts*")):
        if "node_modules" in p.parts:
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        CONSTS.update(parse_consts(text))
        if p.suffix == ".tsx":
            comps += parse_compositions(text)
    if not comps:
        rows.append(("FAIL", "no se encontro ningun <Composition>"))
    for c in comps:
        rows += [(lv, f"[{c.get('id', '?')}] {m}") for lv, m in check_composition(c, a.width, a.height, a.fps, a.seconds)]
    if CHECKER.exists():
        r = subprocess.run([sys.executable, str(CHECKER), str(src)], capture_output=True, text=True)
        last = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else "sin salida"
        rows.append(("FAIL" if r.returncode else ("WARN" if not last.startswith("0 errores, 0") else "OK"),
                     f"subtitulos arabes: {last}" + ("" if not r.returncode and last.startswith("0 errores, 0") else f" (ver {CHECKER.name})")))
    else:
        rows.append(("WARN", "falta la skill arabic-captions-fix; no se reviso el arabe"))
    return rows


def ffprobe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
                       capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"ffprobe fallo: {r.stderr.strip()}")
    return json.loads(r.stdout)


def volume(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn", "-af", "volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True)
    mean = re.search(r"mean_volume:\s*(-?[\d.]+) dB", r.stderr)
    peak = re.search(r"max_volume:\s*(-?[\d.]+) dB", r.stderr)
    return (float(mean.group(1)), float(peak.group(1))) if mean and peak else (None, None)


def check_video(info, mean, peak, a):
    rows = []
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    au = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    if not v:
        return [("FAIL", "sin pista de video")]
    n, d = (v.get("r_frame_rate") or "0/1").split("/")
    fps = float(n) / float(d or 1)
    for label, got, want in (("ancho", v["width"], a.width), ("alto", v["height"], a.height)):
        rows.append(("OK" if got == want else "FAIL", f"{label} {got}" + ("" if got == want else f", deberia ser {want}")))
    rows.append(("OK" if abs(fps - a.fps) < 0.01 else "FAIL", f"fps {fps:g}" + ("" if abs(fps - a.fps) < 0.01 else f", deberia ser {a.fps}")))
    dur = float(info["format"].get("duration", 0))
    rows.append(("OK" if abs(dur - a.seconds) <= 1 else "FAIL", f"duracion {dur:.1f} s" + ("" if abs(dur - a.seconds) <= 1 else f", deberia ser {a.seconds} s")))
    rows.append(("OK" if v.get("pix_fmt") == "yuv420p" else "WARN", f"pix_fmt {v.get('pix_fmt')} (las apps esperan yuv420p)"))
    if not au:
        rows.append(("WARN", "sin pista de audio"))
    elif mean is None:
        rows.append(("WARN", "no se pudo medir el volumen"))
    else:
        peak_max = getattr(a, "peak_max", LOUD_PEAK_DB)
        mean_min = getattr(a, "mean_min", QUIET_MEAN_DB)
        mean_max = getattr(a, "mean_max", LOUD_MEAN_DB)
        if peak >= peak_max:
            rows.append(("FAIL", f"pico {peak} dB: audio recortado"))
        else:
            rows.append(("OK", f"pico {peak} dB"))
        if mean < mean_min:
            rows.append(("WARN", f"volumen medio {mean} dB: muy bajo"))
        elif mean > mean_max:
            rows.append(("WARN", f"volumen medio {mean} dB: muy alto, puede tapar la voz"))
        else:
            rows.append(("OK", f"volumen medio {mean} dB"))
    return rows


def contact_sheet(path, out, safe, a, n=6):
    from PIL import Image, ImageDraw
    top, bottom, left, right = safe
    dur = float(ffprobe(path)["format"]["duration"])
    with tempfile.TemporaryDirectory() as tmp:
        frames = []
        for i in range(n):
            f = Path(tmp) / f"f{i}.png"
            t = dur * (i + 0.5) / n
            subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", str(path), "-frames:v", "1",
                            "-vf", "scale=360:-1", str(f)], check=True)
            frames.append(Image.open(f).convert("RGB"))
        w, h = frames[0].size
        k = w / a.width
        sheet = Image.new("RGB", (w * n, h), "black")
        for i, im in enumerate(frames):
            d = ImageDraw.Draw(im)
            d.rectangle([left * k, top * k, w - right * k, h - bottom * k], outline=(255, 0, 0), width=2)
            sheet.paste(im, (i * w, 0))
        sheet.save(out)


def load_brand(path, a):
    """Aplica safe y audio de brand.json a los argumentos. Devuelve un mensaje de error o None."""
    try:
        brand = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as ex:
        return f"no se puede leer {path}: {ex}"
    safe = brand.get("safe") or {}
    vals = [safe.get(k) for k in ("top", "bottom", "left", "right")]
    if a.safe is None and all(isinstance(v, int) and v >= 0 for v in vals):
        a.safe = ",".join(str(v) for v in vals)
    audio = brand.get("audio") or {}
    for attr, key in (("peak_max", "peakMaxDb"), ("mean_min", "meanMinDb"), ("mean_max", "meanMaxDb")):
        if isinstance(audio.get(key), (int, float)):
            setattr(a, attr, audio[key])
    return None


def report(rows):
    for lv, msg in rows:
        print(f"[{lv:4}] {msg}")
    fails = sum(1 for lv, _ in rows if lv == "FAIL")
    warns = sum(1 for lv, _ in rows if lv == "WARN")
    print(f"\n{fails} FAIL, {warns} WARN")
    return 1 if fails else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["project", "video"])
    ap.add_argument("target")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1920)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--seconds", type=float, default=30)
    ap.add_argument("--safe", default=None)
    ap.add_argument("--brand")
    ap.add_argument("--sheet")
    a = ap.parse_args(argv)
    if a.brand:
        err = load_brand(a.brand, a)
        if err:
            print(err)
            return 2
    if a.safe is None:
        a.safe = DEFAULT_SAFE
    if a.mode == "project":
        return report(run_project(a.target, a))
    info = ffprobe(a.target)
    mean, peak = volume(a.target)
    rows = check_video(info, mean, peak, a)
    if a.sheet:
        contact_sheet(a.target, a.sheet, [int(x) for x in a.safe.split(",")], a)
        rows.append(("OK", f"hoja de fotogramas con zona segura: {a.sheet} (mirala: nada rojo cortado)"))
    return report(rows)


if __name__ == "__main__":
    sys.exit(main())
