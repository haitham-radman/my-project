"""Edit steps for Raw to Reel. Pure helpers are unit-tested; ffmpeg steps are thin wrappers."""
import difflib
import json
import os
import re
import subprocess
import tempfile

from cut_silence import cut, duration, keep_segments, run, silences


class Unavailable(Exception):
    """A requested edit needs something that is not installed or not allowed."""


def transcribe(path, allow_download=False):
    """Return [{start, end, text, words:[{start, end, word}]}] using a local faster-whisper."""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise Unavailable("faster-whisper is not installed (ask the user before `pip install faster-whisper`)")
    try:
        model = WhisperModel("small", local_files_only=not allow_download)
    except Exception as e:
        raise Unavailable(f"Whisper model not available locally; start the server with --allow-download ({e})")
    segs, _ = model.transcribe(path, word_timestamps=True)
    return [{"start": s.start, "end": s.end, "text": s.text.strip(),
             "words": [{"start": w.start, "end": w.end, "word": w.word.strip()} for w in s.words or []]}
            for s in segs]


def _norm(t):
    return re.sub(r"[^\w\s]", "", t.lower()).split()


def drop_bad_takes(segments, ratio=0.6):
    """Drop a sentence when the next one is a retake: same opening words or very similar text."""
    drop = set()
    for i in range(len(segments) - 1):
        a, b = _norm(segments[i]["text"]), _norm(segments[i + 1]["text"])
        if len(a) < 2 or not b:
            continue
        same_start = a[:3] == b[:3] if min(len(a), len(b)) >= 3 else a[:2] == b[:2]
        if same_start or difflib.SequenceMatcher(None, a, b).ratio() >= ratio:
            drop.add(i)
    return [(s["start"], s["end"]) for i, s in enumerate(segments) if i not in drop], len(drop)


def _ass_time(t):
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def words_to_ass(words, width, height, per_line=4):
    """Karaoke-style ASS: each line is a few words, the spoken word is highlighted."""
    head = (
        "[Script Info]\nScriptType: v4.00+\n"
        f"PlayResX: {width}\nPlayResY: {height}\n\n"
        "[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,"
        "Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,"
        "MarginL,MarginR,MarginV,Encoding\n"
        f"Style: Default,Noto Sans Arabic,{height // 18},&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,"
        f"1,0,0,0,100,100,0,0,1,4,0,2,40,40,{height // 6},1\n\n"
        "[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n")
    lines = []
    for i in range(0, len(words), per_line):
        grp = words[i:i + per_line]
        text = "".join(f"{{\\k{max(1, round((w['end'] - w['start']) * 100))}}}{w['word']} " for w in grp)
        lines.append(f"Dialogue: 0,{_ass_time(grp[0]['start'])},{_ass_time(grp[-1]['end'])},"
                     f"Default,,0,0,0,,{text.strip()}")
    return head + "\n".join(lines) + "\n"


def join_times(segs):
    """Output-timeline times where two kept ranges are stitched together."""
    t, out = 0.0, []
    for s, e in segs[:-1]:
        t += e - s
        out.append(round(t, 3))
    return out


def video_size(path):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
             "-of", "csv=p=0", path])
    w, h = r.stdout.strip().split(",")
    return int(w), int(h)


def add_sfx(src, dst, times, limit=30):
    """Mix a short synthetic whoosh at each stitch time. No external audio files needed."""
    times = times[:limit]
    if not times:
        os.replace(src, dst) if src != dst else None
        return 0
    n = len(times)
    whoosh = ("anoisesrc=d=0.3:c=pink:a=0.5,highpass=f=700,afade=t=in:d=0.12,afade=t=out:st=0.12:d=0.18")
    parts = [f"[1:a]asplit={n}" + "".join(f"[w{i}]" for i in range(n))]
    parts += [f"[w{i}]adelay={int(t * 1000)}|{int(t * 1000)}[d{i}]" for i, t in enumerate(times)]
    mix = "[0:a]" + "".join(f"[d{i}]" for i in range(n)) + f"amix=inputs={n + 1}:normalize=0:duration=first[a]"
    r = run(["ffmpeg", "-y", "-hide_banner", "-i", src, "-f", "lavfi", "-i", whoosh,
             "-filter_complex", ";".join(parts + [mix]), "-map", "0:v", "-map", "[a]",
             "-c:v", "copy", "-c:a", "aac", dst])
    if r.returncode:
        raise RuntimeError(r.stderr[-600:])
    return n


def burn_captions(src, dst, ass_text):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "c.ass")
        open(p, "w", encoding="utf-8").write(ass_text)
        r = subprocess.run(["ffmpeg", "-y", "-hide_banner", "-i", os.path.abspath(src), "-vf", "ass=c.ass",
                            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "copy", os.path.abspath(dst)],
                           cwd=d, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr[-600:])


def run_job(src, outdir, opts, log, allow_download=False):
    """Apply the chosen edits in order. Returns (final_path, edit_list). Never touches src."""
    os.makedirs(outdir, exist_ok=True)
    cur, edits, n = src, [], 0

    def nxt():
        nonlocal n
        n += 1
        return os.path.join(outdir, f"step{n}.mp4")

    stitches = []
    if opts.get("badtakes"):
        log("transcribing to find bad takes")
        segs, dropped = drop_bad_takes(transcribe(cur, allow_download))
        if dropped and segs:
            out = nxt()
            err = cut(cur, out, segs)
            if err:
                raise RuntimeError(err)
            cur, stitches = out, join_times(segs)
        edits.append({"edit": "badtakes", "dropped": dropped})
        log(f"bad takes removed: {dropped}")
    if opts.get("silence"):
        log("removing silence")
        total = duration(cur)
        segs = keep_segments(total, silences(cur, -35, 0.5), 0.08)
        out = nxt()
        err = cut(cur, out, segs) if segs else "no speech found"
        if err:
            raise RuntimeError(err)
        cur, stitches = out, join_times(segs)
        edits.append({"edit": "silence", "before": round(total, 2), "after": round(duration(cur), 2)})
        log(f"silence removed: {total:.1f}s -> {duration(cur):.1f}s")
    if opts.get("captions"):
        log("transcribing for captions")
        words = [w for s in transcribe(cur, allow_download) for w in s["words"]]
        if not words:
            raise Unavailable("no words recognised")
        out = nxt()
        burn_captions(cur, out, words_to_ass(words, *video_size(cur)))
        cur = out
        edits.append({"edit": "captions", "words": len(words)})
        log(f"captions added: {len(words)} words")
    if opts.get("sfx"):
        out = nxt()
        count = add_sfx(cur, out, stitches)
        if count:
            cur = out
        edits.append({"edit": "sfx", "count": count})
        log(f"sound effects added: {count}")
    if cur == src:
        raise Unavailable("nothing was changed")
    k, final = 1, os.path.join(outdir, "final.mp4")
    while os.path.exists(final):
        k += 1
        final = os.path.join(outdir, f"final-{k}.mp4")
    os.replace(cur, final)
    with open(final[:-4] + ".edit.json", "w") as f:
        json.dump({"source": os.path.basename(src), "edits": edits}, f, ensure_ascii=False, indent=1)
    return final, edits
