#!/usr/bin/env python3
"""Build a short text reel locally from a scenes JSON file.

Slides are rendered with a local headless Chrome/Chromium (correct Arabic
shaping), animated and joined with ffmpeg, with word-by-word captions (ASS) and
a synthetic whoosh at each cut. No network access, no downloads, no installs.

  build_reel.py scenes.json OUT_DIR

scenes.json: {"width": 720, "height": 1280, "scenes": [
  {"seconds": 3, "bg": "#1d4ed8", "title": "...", "caption": "...", "kind": "title"},
  {"seconds": 5, "bg": "#111827", "caption": "...", "kind": "diagram",
   "heading": "...", "hub": "MCP", "left": "AI", "items": ["a", "b", "c"]}]}
kind is "title" (big text), "text" (default) or "diagram". OUT_DIR must not
exist or must be empty; nothing is overwritten.
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

CSS = """*{margin:0;box-sizing:border-box}body{width:%dpx;height:%dpx;font-family:'DejaVu Sans',sans-serif;direction:rtl;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px}
h1{font-size:76px;line-height:1.35}.t h1{font-size:96px}.row{display:flex;gap:18px;align-items:center;direction:ltr;margin-top:40px}
.box{background:#fff;color:#111;border-radius:24px;padding:22px 26px;font-size:38px;font-weight:700}.col{display:flex;flex-direction:column;gap:18px}
.hub{background:#f59e0b;color:#111;border-radius:30px;padding:70px 26px;font-size:54px;font-weight:800}.ar{font-size:60px}"""


def find_browser():
    env = os.environ.get("REEL_CLONE_BROWSER")
    if env:
        return env
    for name in ("google-chrome", "chromium", "chromium-browser", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    for pattern in ("/opt/pw-browsers/chromium-*/chrome-linux/chrome",):
        hits = sorted(Path("/").glob(pattern.lstrip("/")))
        if hits:
            return str(hits[-1])
    sys.exit("No Chrome/Chromium found. Set REEL_CLONE_BROWSER or install one (ask the user first).")


COLOR = re.compile(r"#[0-9a-fA-F]{3,8}|[a-z]{3,20}")


def check_scenes(spec):
    """Validate JSON before it reaches CSS or ffmpeg filter strings."""
    w, h = int(spec.get("width", 720)), int(spec.get("height", 1280))
    if not (100 <= w <= 4000 and 100 <= h <= 4000):
        sys.exit("width/height must be 100-4000")
    scenes = spec["scenes"]
    if not (1 <= len(scenes) <= 60):
        sys.exit("1-60 scenes required")
    for sc in scenes:
        sc["seconds"] = float(sc["seconds"])
        if not (1 <= sc["seconds"] <= 60):
            sys.exit("each scene must last 1-60 seconds")
        if not COLOR.fullmatch(str(sc.get("bg", ""))):
            sys.exit(f"bg must be #hex or a colour name, got {sc.get('bg')!r}")
    return w, h, scenes


def slide_html(scene, w, h):
    e = html.escape
    kind = scene.get("kind", "text")
    if kind == "diagram":
        items = "".join(f'<div class=box>{e(i)}</div>' for i in scene.get("items", []))
        body = (f'<h1 style="font-size:60px">{e(scene.get("heading", ""))}</h1><div class=row>'
                f'<div class=box>{e(scene.get("left", ""))}</div><span class=ar>⇄</span>'
                f'<div class=hub>{e(scene.get("hub", ""))}</div><span class=ar>⇄</span>'
                f'<div class=col>{items}</div></div>')
    else:
        body = f'<h1>{e(scene.get("title", ""))}</h1>'
    cls = "t" if kind == "title" else ""
    return (f'<meta charset=utf-8><style>{CSS % (w, h)}body{{background:{e(scene["bg"])}}}</style>'
            f'<body class="{cls}">{body}')


def ts(t):
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def caption_events(scenes):
    """One ASS event per word: whole line shown, current word highlighted."""
    events, t0 = [], 0.0
    for sc in scenes:
        words = [re.sub(r"[{}\\]", "", w) for w in sc.get("caption", "").split()]
        words = [w for w in words if w]
        d = sc["seconds"]
        if words:
            start, step = t0 + 0.3, (d - 0.6) / len(words)
            for j in range(len(words)):
                text = " ".join(("{\\c&H00C8FF&}" + w + "{\\c&HFFFFFF&}") if i == j else w
                                for i, w in enumerate(words))
                end = t0 + d - 0.15 if j == len(words) - 1 else start + (j + 1) * step
                events.append(f"Dialogue: 0,{ts(start + j * step)},{ts(end)},C,,0,0,0,,{text}")
        t0 += d
    return events


def ass_file(scenes, w, h):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: C,DejaVu Sans,54,&H00FFFFFF,&H00FFFFFF,&H99000000,&H99000000,1,0,0,0,100,100,0,0,3,14,0,2,40,40,230,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    return head + "\n".join(caption_events(scenes)) + "\n"


def run(cmd):
    subprocess.run(cmd, check=True, capture_output=True)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        sys.exit(f"{out} is not empty; refusing to overwrite. Pick a new folder.")
    for sub in ("html", "png", "clips"):
        (out / sub).mkdir(parents=True, exist_ok=True)
    w, h, scenes = check_scenes(spec)
    browser = find_browser()
    for i, sc in enumerate(scenes, 1):
        d = sc["seconds"]
        page = out / f"html/s{i}.html"
        page.write_text(slide_html(sc, w, h), encoding="utf-8")
        run([browser, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--disable-background-networking",
             f"--window-size={w},{h}", f"--screenshot={out}/png/s{i}.png", page.resolve().as_uri()])
        run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", f"{out}/png/s{i}.png", "-t", str(d),
             "-vf", f"zoompan=z='1+0.0008*on':d={int(d * 30)}:s={w}x{h}:fps=30,fade=t=in:st=0:d=0.15,format=yuv420p",
             "-r", "30", f"{out}/clips/c{i}.mp4"])
    (out / "list.txt").write_text("".join(f"file 'clips/c{i}.mp4'\n" for i in range(1, len(scenes) + 1)))
    total = sum(s["seconds"] for s in scenes)
    cuts, t = [], 0
    for s in scenes[:-1]:
        t += s["seconds"]
        cuts.append(t)
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-i", f"{out}/list.txt", "-c", "copy", f"{out}/silent.mp4"])
    (out / "cap.ass").write_text(ass_file(scenes, w, h), encoding="utf-8")
    inputs = ["-f", "lavfi", "-i", f"sine=f=110:d={total},volume=0.08"]
    graph, mix = [], "[0]"
    for j, c in enumerate(cuts):
        ms = max(0, int((c - 0.3) * 1000))
        inputs += ["-f", "lavfi", "-i", "anoisesrc=d=0.5:c=pink,highpass=f=800,lowpass=f=6000,"
                   "afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.25,volume=1.5"]
        graph.append(f"[{j + 1}]adelay={ms}|{ms}[w{j}]")
        mix += f"[w{j}]"
    graph.append(f"{mix}amix=inputs={len(cuts) + 1}:normalize=0,volume=2,alimiter=limit=0.7:level=0[a]")
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(graph),
         "-map", "[a]", "-t", str(total), f"{out}/audio.wav"])
    # run inside out/ so the ass= filter gets a plain relative name (no path escaping)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "silent.mp4", "-i", "audio.wav",
                    "-vf", "ass=cap.ass", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
                    "-shortest", "final.mp4"], check=True, capture_output=True, cwd=out)
    print(json.dumps({"final": f"{out}/final.mp4", "seconds": total, "cuts": cuts}))


if __name__ == "__main__":
    main()
