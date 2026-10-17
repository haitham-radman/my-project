#!/usr/bin/env python3
"""Build a dark Arabic "card explainer" reel locally from a JSON spec.

Style: near-black background with teal and orange glow, small header strip,
big right-aligned Arabic headlines with highlighted words, rounded cards that
appear one after another, and a thin orange-to-teal progress bar at the bottom.
Slides are rendered by a local headless Chrome/Chromium (correct Arabic shaping)
and joined with ffmpeg cross-fades plus a soft tick on each reveal.
No network access, no downloads, no installs.

  build_card_reel.py spec.json OUT_DIR

spec.json: {"brand": "...", "kicker": "AI TOOLS · REAL RESULTS", "font": "DejaVu Sans",
 "scenes": [
  {"kind": "hook", "seconds": 8, "icon": "AI", "title": "تستخدمه *للسوالف* بس؟",
   "subtitle": "خلّه ~مدربك~ الشخصي!", "pill": "أقوى أوامر"},
  {"seconds": 7, "tag": {"text": "٠١ • الإنتاجية", "color": "orange"},
   "title": "خطة *سنة*", "blocks": [
     {"type": "quote", "text": "..."}, {"type": "stat", "big": "٩٠", "text": "..."},
     {"type": "note", "text": "..."}, {"type": "chips", "items": ["a", "b"], "color": "orange"},
     {"type": "pill", "text": "..."},
     {"type": "checklist", "items": [{"text": "...", "mark": "check|cross|bang"}]},
     {"type": "mindmap", "root": "...", "branches": [{"text": "...", "color": "teal"}]}]},
  {"kind": "outro", "seconds": 6, "title": "تابع *الاسم*", "subtitle": "...", "button": "+ تابع", "done": "تمت المتابعة"}]}

In titles, *word* is teal and ~word~ is orange. Colours are teal, orange or white.
Each scene first shows its tag and title, then reveals one block per step, the
scene's seconds split evenly. OUT_DIR must not exist or must be empty.
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

W, H = 1080, 1920
FADE = 0.25
COLORS = {"teal": "#19d3b5", "orange": "#ff8a3d", "white": "#ffffff"}
MARKS = {"check": ("✓", "teal"), "cross": ("✕", "orange"), "bang": ("!", "teal")}
BLOCKS = {"quote", "stat", "note", "chips", "pill", "checklist", "mindmap"}
FONT = re.compile(r"[\w][\w \-]{0,40}")
# branch centres inside the 900x520 mind-map box: right-near, left-mid, lower-centre
SLOTS = [(780, 130), (270, 270), (560, 440)]

CSS = """*{margin:0;box-sizing:border-box}
body{width:%(w)dpx;height:%(h)dpx;font-family:'%(font)s',sans-serif;direction:rtl;color:#fff;position:relative;overflow:hidden;
background:radial-gradient(ellipse 900px 700px at 92%% 72%%,rgba(255,138,61,.20),transparent 70%%),
radial-gradient(ellipse 800px 700px at 8%% 40%%,rgba(25,211,181,.12),transparent 70%%),#050b0d}
.head{position:absolute;top:56px;left:70px;right:70px;display:flex;justify-content:space-between;align-items:center}
.kick{direction:ltr;font-size:19px;letter-spacing:5px;color:#7d8b90;font-family:'DejaVu Sans Mono',monospace}
.brand{display:flex;align-items:center;gap:16px;font-size:34px;font-weight:700}
.ring{width:62px;height:62px;border-radius:50%%;border:3px solid transparent;background:linear-gradient(#0a1417,#0a1417) padding-box,
linear-gradient(135deg,#19d3b5,#ff8a3d) border-box;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}
.track{position:absolute;left:80px;right:80px;top:1845px;height:6px;border-radius:3px;background:#1c2a2e}
.main{position:absolute;left:70px;right:70px;top:330px;display:flex;flex-direction:column;align-items:flex-start;gap:34px}
.main.mid{top:430px;align-items:center;text-align:center}
.tag{font-size:30px;font-weight:700;padding:8px 26px;border-radius:30px;color:#06201c}
.tag.teal{background:#19d3b5}.tag.orange{background:#ff8a3d;color:#2a1304}.tag.white{background:#fff;color:#111}
h1{font-size:92px;line-height:1.3;font-weight:800}h1 b{color:#19d3b5}h1 i{color:#ff8a3d;font-style:normal}
.sub{font-size:52px;font-weight:700}.sub b{color:#19d3b5}.sub i{color:#ff8a3d;font-style:normal}
.icon{width:210px;height:210px;border-radius:50px;background:#000;box-shadow:0 0 70px rgba(255,138,61,.35);display:flex;align-items:center;justify-content:center;font-size:80px;font-weight:800}
.pill{background:#fff;color:#111;font-size:40px;font-weight:700;padding:14px 44px;border-radius:50px}
.quote{align-self:stretch;border:2px solid #19d3b5;background:rgba(25,211,181,.08);color:#19d3b5;border-radius:22px;padding:30px 38px;font-size:44px;font-weight:700;line-height:1.5}
.stat{align-self:stretch;display:flex;align-items:center;gap:36px;background:#0a1014;border:1px solid #1e2c30;border-radius:22px;padding:28px 40px;font-size:40px;line-height:1.5}
.stat .big{font-size:96px;font-weight:800;color:#19d3b5;min-width:130px;text-align:center}
.note{font-size:38px;color:#aab6ba;padding:0 8px}
.chips{display:flex;gap:18px;flex-wrap:wrap}
.chip{border:2px solid;border-radius:40px;padding:12px 32px;font-size:32px;font-weight:600}
.chip.teal{color:#19d3b5;border-color:#19d3b5}.chip.orange{color:#ff8a3d;border-color:#ff8a3d}.chip.white{color:#fff;border-color:#fff}
.list{align-self:stretch;display:flex;flex-direction:column;gap:22px}
.item{display:flex;align-items:center;gap:26px;background:#0a1014;border:1px solid #1e2c30;border-radius:20px;padding:24px 30px;font-size:38px}
.mk{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:#06201c}
.mk.teal{background:#19d3b5}.mk.orange{background:#ff8a3d;color:#2a1304}
.map{position:relative;margin-top:50px;width:900px;height:520px;direction:ltr;align-self:center}
.map svg{position:absolute;inset:0}.node{position:absolute;transform:translate(-50%%,-50%%);white-space:nowrap;direction:rtl;font-size:32px;font-weight:700}
.root{background:#fff;color:#111;border-radius:40px;padding:14px 40px;font-size:40px}
.leaf{background:#0a1014;border:2px solid;border-radius:16px;padding:12px 28px}
.leaf.teal{border-color:#19d3b5}.leaf.orange{border-color:#ff8a3d}.leaf.white{border-color:#fff}
.btn{font-size:40px;font-weight:700;padding:16px 60px;border-radius:50px;background:#19d3b5;color:#06201c}
.btn.done{background:transparent;border:2px solid #19d3b5;color:#19d3b5}"""


def fail(msg):
    sys.exit(msg)


def find_browser():
    env = os.environ.get("CARD_REEL_BROWSER")
    if env:
        return env
    for name in ("google-chrome", "chromium", "chromium-browser", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    hits = sorted(Path("/").glob("opt/pw-browsers/chromium-*/chrome-linux/chrome"))
    if hits:
        return str(hits[-1])
    fail("No Chrome/Chromium found. Set CARD_REEL_BROWSER or install one (ask the user first).")


def color(name, default="teal"):
    name = name or default
    if name not in COLORS:
        fail(f"colour must be one of {sorted(COLORS)}, got {name!r}")
    return name


def rich(text):
    """Escape, then turn *word* into teal and ~word~ into orange."""
    t = html.escape(str(text), quote=False)
    t = re.sub(r"\*([^*]+)\*", r"<b>\1</b>", t)
    return re.sub(r"~([^~]+)~", r"<i>\1</i>", t)


def check_spec(spec):
    font = spec.get("font", "DejaVu Sans")
    if not FONT.fullmatch(font):
        fail(f"font must be a plain family name, got {font!r}")
    scenes = spec.get("scenes") or fail("scenes is required")
    if not 1 <= len(scenes) <= 20:
        fail("1-20 scenes required")
    for sc in scenes:
        sc["seconds"] = float(sc.get("seconds", 6))
        if not 2 <= sc["seconds"] <= 60:
            fail("each scene must last 2-60 seconds")
        if sc.get("kind", "cards") not in ("cards", "hook", "outro"):
            fail("kind must be cards, hook or outro")
        blocks = sc.get("blocks", [])
        if len(blocks) > 6:
            fail("at most 6 blocks per scene")
        for b in blocks:
            if b.get("type") not in BLOCKS:
                fail(f"block type must be one of {sorted(BLOCKS)}")
            if b["type"] == "mindmap" and len(b.get("branches", [])) > len(SLOTS):
                fail(f"mindmap supports at most {len(SLOTS)} branches")
        if sc["seconds"] / step_count(sc) < 0.8:
            fail("too many blocks for this scene length (need >= 0.8 s per step)")
    return font, scenes


def block_html(b):
    e = lambda v: html.escape(str(v), quote=False)
    t = b["type"]
    if t == "quote":
        return f'<div class=quote>{e(b.get("text", ""))}</div>'
    if t == "stat":
        return f'<div class=stat><div class=big>{e(b.get("big", ""))}</div><div>{e(b.get("text", ""))}</div></div>'
    if t == "note":
        return f'<div class=note>{e(b.get("text", ""))}</div>'
    if t == "pill":
        return f'<div class=pill>{e(b.get("text", ""))}</div>'
    if t == "chips":
        c = color(b.get("color"), "orange")
        return '<div class=chips>' + "".join(f'<span class="chip {c}">{e(i)}</span>' for i in b.get("items", [])) + '</div>'
    if t == "checklist":
        rows = ""
        for it in b.get("items", []):
            sym, c = MARKS[it.get("mark", "check")] if it.get("mark", "check") in MARKS else fail("mark must be check, cross or bang")
            rows += f'<div class=item><span class="mk {c}">{sym}</span><span>{e(it.get("text", ""))}</span></div>'
        return f'<div class=list>{rows}</div>'
    branches = b.get("branches", [])
    paths = nodes = ""
    for (x, y), br in zip(SLOTS, branches):
        c = color(br.get("color"), "teal")
        paths += (f'<path d="M620 36 C620 {y // 2} {x} {y // 2 - 20} {x} {y - 30}" fill="none" stroke="{COLORS[c]}" stroke-width="3"/>')
        nodes += f'<div class="node leaf {c}" style="left:{x}px;top:{y}px">{e(br.get("text", ""))}</div>'
    return (f'<div class=map><svg width=900 height=520>{paths}</svg>'
            f'<div class="node root" style="left:620px;top:0">{e(b.get("root", ""))}</div>{nodes}</div>')


def slide_html(spec, font, sc, step):
    """HTML for one scene at reveal `step` (0 = tag and title only)."""
    kind = sc.get("kind", "cards")
    brand = html.escape(spec.get("brand", ""), quote=False)
    kick = html.escape(spec.get("kicker", "AI TOOLS · REAL RESULTS"), quote=False)
    head = (f'<div class=head><div class=brand>{brand}'
            f'<span class=ring>{brand[:2]}</span></div><div class=kick>{kick}</div></div><div class=track></div>')
    parts = []
    if kind == "hook":
        parts.append(f'<div class=icon>{html.escape(sc.get("icon", "AI"), quote=False)}</div>')
        parts.append(f'<h1>{rich(sc.get("title", ""))}</h1>')
        if step >= 1 and sc.get("subtitle"):
            parts.append(f'<div class=sub>{rich(sc["subtitle"])}</div>')
        if step >= 2 and sc.get("pill"):
            parts.append(f'<div class=pill>{html.escape(sc["pill"], quote=False)}</div>')
        main = "main mid"
    elif kind == "outro":
        parts.append(f'<div class=ring style="width:240px;height:240px;font-size:70px">{brand[:2]}</div>')
        parts.append(f'<h1>{rich(sc.get("title", ""))}</h1>')
        if sc.get("subtitle"):
            parts.append(f'<div class=note>{html.escape(sc["subtitle"], quote=False)}</div>')
        if step == 1 and sc.get("button"):
            parts.append(f'<div class=btn>{html.escape(sc["button"], quote=False)}</div>')
        if step >= 2 and sc.get("done"):
            parts.append(f'<div class="btn done">✓ {html.escape(sc["done"], quote=False)}</div>')
        main = "main mid"
    else:
        tag = sc.get("tag")
        if tag:
            parts.append(f'<div class="tag {color(tag.get("color"))}">{html.escape(tag.get("text", ""), quote=False)}</div>')
        if sc.get("title"):
            parts.append(f'<h1>{rich(sc["title"])}</h1>')
        parts += [block_html(b) for b in sc.get("blocks", [])[:step]]
        main = "main"
    return (f'<meta charset=utf-8><style>{CSS % {"w": W, "h": H, "font": font}}</style>'
            f'<body>{head}<div class="{main}">{"".join(parts)}</div></body>')


def step_count(sc):
    kind = sc.get("kind", "cards")
    if kind == "hook":
        return 1 + bool(sc.get("subtitle")) + bool(sc.get("pill"))
    if kind == "outro":
        return 1 + bool(sc.get("button")) + bool(sc.get("done"))
    return len(sc.get("blocks", [])) + 1


def plan(scenes):
    """Flat list of (scene_index, step, seconds); seconds split evenly per scene."""
    out = []
    for i, sc in enumerate(scenes):
        n = step_count(sc)
        out += [(i, s, sc["seconds"] / n) for s in range(n)]
    return out


def offsets(durs):
    """Start time of each clip after cross-fading, and the total length."""
    starts, t = [], 0.0
    for k, d in enumerate(durs):
        starts.append(max(0.0, t))
        t += d - FADE
    return starts, t + FADE


def bar_filter(total):
    """100 drawbox segments (orange to teal) switched on over time = a progress bar."""
    a, b = (255, 138, 61), (25, 211, 181)
    x0, width, segs = 80, W - 160, 100
    parts = []
    for k in range(segs):
        c = "0x%02x%02x%02x" % tuple(int(a[j] + (b[j] - a[j]) * k / (segs - 1)) for j in range(3))
        parts.append(f"drawbox=x={x0 + width * k / segs:.1f}:y=1845:w={width / segs + 1:.1f}:h=6:color={c}:t=fill:"
                     f"enable='gte(t,{total * (k + 1) / segs:.3f})'")
    return ",".join(parts)


def run(cmd, **kw):
    subprocess.run(cmd, check=True, capture_output=True, **kw)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        fail(f"{out} is not empty; refusing to overwrite. Pick a new folder.")
    font, scenes = check_spec(spec)
    steps = plan(scenes)
    if len(steps) > 80:
        fail("too many reveal steps (max 80)")
    for sub in ("html", "png"):
        (out / sub).mkdir(parents=True, exist_ok=True)
    browser = find_browser()
    for k, (i, s, _) in enumerate(steps):
        page = out / f"html/{k:03d}.html"
        page.write_text(slide_html(spec, font, scenes[i], s), encoding="utf-8")
        run([browser, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--disable-background-networking",
             f"--window-size={W},{H}", f"--screenshot={out}/png/{k:03d}.png", page.resolve().as_uri()])
    durs = [d for _, _, d in steps]
    starts, total = offsets(durs)
    inputs = []
    for k, d in enumerate(durs):
        inputs += ["-loop", "1", "-framerate", "30", "-t", f"{d + FADE:.3f}", "-i", f"png/{k:03d}.png"]
    chain, last = [], "[0:v]"
    for k in range(1, len(durs)):
        chain.append(f"{last}[{k}:v]xfade=transition=fade:duration={FADE}:offset={starts[k]:.3f}[x{k}]")
        last = f"[x{k}]"
    if len(durs) == 1:
        chain.append("[0:v]null[x0]")
        last = "[x0]"
    chain.append(f"{last}{bar_filter(total)},format=yuv420p[v]")
    tick = "sine=f=1400:d=0.12,afade=t=in:d=0.01,afade=t=out:st=0.02:d=0.1,volume=0.5"
    audio = ["-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo:d={total:.3f}"]
    mix = "[%d:a]" % len(durs)
    for k in range(1, len(durs)):
        ms = int(starts[k] * 1000)
        audio += ["-f", "lavfi", "-i", tick]
        chain.append(f"[{len(durs) + k}:a]aformat=channel_layouts=stereo,adelay={ms}|{ms}[t{k}]")
        mix += f"[t{k}]"
    chain.append(f"{mix}amix=inputs={len(durs)}:normalize=0[a]")
    run(["ffmpeg", "-v", "error", "-y", *inputs, *audio, "-filter_complex", ";".join(chain), "-map", "[v]", "-map", "[a]",
         "-t", f"{total:.3f}", "-r", "30", "-c:v", "libx264", "-c:a", "aac", "final.mp4"], cwd=out)
    print(json.dumps({"final": f"{out}/final.mp4", "seconds": round(total, 2), "steps": len(durs)}))


if __name__ == "__main__":
    main()
