#!/usr/bin/env python3
"""Search and fetch openly licensed audio from Openverse (api.openverse.org).

  openverse.py search "rain" [--category sound_effect|music] [--commercial]
                       [--max-seconds N] [--limit N] [--json]
  openverse.py get <id> [--out-dir ./openverse-audio]

Standard library only; anonymous access, no API key. `search` lists results
with their licence and credit line. `get` downloads one result into --out-dir
and appends its credit to ATTRIBUTION.txt there. Never overwrites a file.
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.openverse.org/v1/audio/"
UA = "openverse-sfx-skill/1.0 (Claude Code skill)"
MAX_BYTES = 50 * 1024 * 1024
CATEGORIES = ("sound_effect", "music", "podcast", "audiobook", "news", "pronunciation")
# Licences that bar commercial use or carry extra conditions.
NONCOMMERCIAL = ("by-nc", "by-nc-sa", "by-nc-nd")


def _open(url, timeout=30):
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != "https":
        raise SystemExit(f"refusing non-https URL: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json, audio/*"})
    return urllib.request.urlopen(req, timeout=timeout)


def fetch_json(url, opener=_open):
    try:
        with opener(url) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        hint = " (anonymous rate limit; wait and retry)" if e.code == 429 else ""
        raise SystemExit(f"Openverse returned HTTP {e.code}{hint}")
    except urllib.error.URLError as e:
        raise SystemExit(f"cannot reach Openverse: {e.reason}")


def build_search_url(query, category=None, commercial=False, limit=10):
    params = {"q": query, "page_size": max(1, min(limit, 20))}
    if category:
        params["category"] = category
    if commercial:
        params["license_type"] = "commercial"
    return API + "?" + urllib.parse.urlencode(params)


def credit(item):
    if item.get("attribution"):
        return item["attribution"]
    title = item.get("title") or "Untitled"
    who = item.get("creator") or "unknown"
    lic = f'{(item.get("license") or "?").upper()} {item.get("license_version") or ""}'.strip()
    return f'"{title}" by {who} is licensed under {lic}. {item.get("foreign_landing_url") or ""}'.strip()


def flags(item):
    lic = (item.get("license") or "").lower()
    out = []
    if lic in NONCOMMERCIAL:
        out.append("NON-COMMERCIAL")
    if "nd" in lic.split("-"):
        out.append("NO-DERIVATIVES")
    if lic != "cc0" and lic != "pdm":
        out.append("CREDIT-REQUIRED")
    return out


def search(query, category=None, commercial=False, max_seconds=None, limit=10, opener=_open):
    data = fetch_json(build_search_url(query, category, commercial, limit), opener)
    results = data.get("results") or []
    if max_seconds:
        results = [r for r in results if not r.get("duration") or r["duration"] / 1000 <= max_seconds]
    return results


def format_row(item):
    secs = (item.get("duration") or 0) / 1000
    lic = f'{item.get("license", "?")} {item.get("license_version") or ""}'.strip()
    return (f'{item.get("id")}  {secs:6.1f}s  {item.get("filetype") or "?":4}  {lic:10}  '
            f'{(item.get("title") or "")[:50]}  [{", ".join(flags(item)) or "free"}]')


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", (text or "audio").lower()).strip("-")[:60] or "audio"


def download(item, out_dir, opener=_open):
    url = item.get("url")
    if not url:
        raise SystemExit("result has no download URL")
    ext = (item.get("filetype") or os.path.splitext(urllib.parse.urlsplit(url).path)[1].lstrip(".") or "mp3").lower()
    ext = re.sub(r"[^a-z0-9]", "", ext)[:5] or "mp3"
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f'{slugify(item.get("title"))}-{str(item["id"])[:8]}.{ext}')
    if os.path.exists(path):
        raise SystemExit(f"refusing to overwrite {path}")
    try:
        with opener(url, 60) as r:
            ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
            if ctype and not (ctype.startswith("audio/") or ctype == "application/octet-stream"):
                raise SystemExit(f"unexpected content type {ctype}; not saving")
            body = r.read(MAX_BYTES + 1)
    except urllib.error.URLError as e:
        raise SystemExit(f"download failed: {e}")
    if len(body) > MAX_BYTES:
        raise SystemExit("file exceeds 50 MB; not saving")
    with open(path, "xb") as f:
        f.write(body)
    with open(os.path.join(out_dir, "ATTRIBUTION.txt"), "a", encoding="utf-8") as f:
        f.write(f"{os.path.basename(path)}: {credit(item)}\n")
    return path


def get(item_id, out_dir, opener=_open):
    if not re.fullmatch(r"[0-9a-fA-F-]{8,40}", item_id):
        raise SystemExit("id must be the Openverse id shown by `search`")
    item = fetch_json(API + item_id + "/", opener)
    return item, download(item, out_dir, opener)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("--category", choices=CATEGORIES, default="sound_effect")
    s.add_argument("--commercial", action="store_true", help="only licences allowing commercial use")
    s.add_argument("--max-seconds", type=float)
    s.add_argument("--limit", type=int, default=10)
    s.add_argument("--json", action="store_true")
    g = sub.add_parser("get")
    g.add_argument("id")
    g.add_argument("--out-dir", default="./openverse-audio")
    a = p.parse_args(argv)
    if a.cmd == "search":
        res = search(a.query, a.category, a.commercial, a.max_seconds, a.limit)
        if a.json:
            json.dump(res, sys.stdout, ensure_ascii=False, indent=2)
        else:
            print("\n".join(format_row(r) for r in res) or "no results")
    else:
        item, path = get(a.id, a.out_dir)
        print(f"saved {path}\ncredit: {credit(item)}\nflags: {', '.join(flags(item)) or 'none'}")


if __name__ == "__main__":
    main()
