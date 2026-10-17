#!/usr/bin/env python3
"""Local web UI for Raw to Reel. Listens on 127.0.0.1 only.

usage: server.py FOLDER [--port 8765] [--allow-download]
FOLDER receives uploads and the `reel/` outputs. Originals are never modified.
"""
import argparse
import json
import os
import re
import secrets
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pipeline  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
JOBS = {}
MAX_BYTES = 4 * 1024 ** 3


def safe_name(name):
    base = re.sub(r"[^\w.\- ]", "_", os.path.basename(name)) or "video.mp4"
    return base if base.lower().endswith((".mp4", ".mov", ".m4v", ".mkv", ".webm")) else base + ".mp4"


def unique(path):
    root, ext = os.path.splitext(path)
    k, p = 1, path
    while os.path.exists(p):
        k += 1
        p = f"{root}-{k}{ext}"
    return p


def make_handler(folder, allow_download, port):
    allowed_hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}

    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, body, ctype="application/json", extra=None):
            if isinstance(body, (dict, list)):
                body = json.dumps(body, ensure_ascii=False)
            if isinstance(body, str):
                body = body.encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)

        def _guard(self):
            """Block DNS rebinding and cross-site requests to this local server."""
            if self.headers.get("Host") not in allowed_hosts:
                self._send(403, "bad host", "text/plain")
                return False
            origin = self.headers.get("Origin")
            if origin and origin.split("://", 1)[-1] not in allowed_hosts:
                self._send(403, "bad origin", "text/plain")
                return False
            return True

        def do_GET(self):
            if not self._guard():
                return
            u = urlparse(self.path)
            q = parse_qs(u.query)
            job = JOBS.get(q.get("id", [""])[0])
            if u.path == "/":
                with open(os.path.join(HERE, "ui.html"), "rb") as f:
                    self._send(200, f.read(), "text/html; charset=utf-8")
            elif u.path == "/job" and job:
                self._send(200, {k: job.get(k) for k in ("status", "log", "error", "path")})
            elif u.path == "/download" and job and job["status"] == "done":
                with open(job["path"], "rb") as f:
                    data = f.read()
                self._send(200, data, "video/mp4",
                           {"Content-Disposition": f'attachment; filename="{os.path.basename(job["path"])}"'})
            else:
                self._send(404, "not found", "text/plain")

        def do_POST(self):
            if not self._guard():
                return
            u = urlparse(self.path)
            if u.path != "/edit":
                return self._send(404, "not found", "text/plain")
            q = parse_qs(u.query)
            opts = {k: k in q for k in ("badtakes", "silence", "captions", "sfx")}
            n = int(self.headers.get("Content-Length") or 0)
            if not any(opts.values()):
                return self._send(400, "choose at least one edit", "text/plain")
            if not 0 < n <= MAX_BYTES:
                return self._send(400, "bad size", "text/plain")
            os.makedirs(os.path.join(folder, "uploads"), exist_ok=True)
            src = unique(os.path.join(folder, "uploads", safe_name(q.get("name", ["video.mp4"])[0])))
            with open(src, "wb") as f:
                left = n
                while left:
                    chunk = self.rfile.read(min(1 << 20, left))
                    if not chunk:
                        break
                    f.write(chunk)
                    left -= len(chunk)
            jid = secrets.token_urlsafe(8)
            job = JOBS[jid] = {"status": "running", "log": ["تم الرفع"], "error": None, "path": None}
            threading.Thread(target=work, args=(job, src, opts), daemon=True).start()
            self._send(200, {"id": jid})

    def work(job, src, opts):
        try:
            outdir = os.path.join(folder, "reel", f"{os.path.splitext(os.path.basename(src))[0]}-{int(time.time())}")
            job["path"], _ = pipeline.run_job(src, outdir, opts, job["log"].append, allow_download)
            job["status"] = "done"
        except Exception as e:  # surfaced to the UI as a plain message
            job["status"], job["error"] = "error", str(e)

    return H


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--allow-download", action="store_true", help="let faster-whisper download its model")
    a = ap.parse_args()
    folder = os.path.abspath(a.folder)
    os.makedirs(folder, exist_ok=True)
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(folder, a.allow_download, a.port))
    print(f"Raw to Reel: http://localhost:{a.port}  (folder: {folder})", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
