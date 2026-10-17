'use strict';
/* End-to-end check of Demux.open + Demux.Reader with the browser's real VideoDecoder (headless Chromium via
   Playwright). Skipped when Playwright or a browser is not available.
   Every fixture frame N is flat gray with luma code value 20 + 7*N, so the decoded pixels say which frame came back.
   H.264 fixtures are skipped where the browser build has no H.264 decoder (e.g. Playwright's Chromium). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.join(__dirname, '..');
let playwright = null;
for (const p of ['playwright', 'playwright-core', '/opt/node22/lib/node_modules/playwright']) {
  try { playwright = require(p); break; } catch { /* try next */ }
}

const PAGE = '<!doctype html><meta charset="utf-8"><script src="/demux.js"></script><body>ok</body>';
const FILES = ['vp9.webm', 'vp8.webm', 'vp9_unknown_size.webm', 'vp9.mp4', 'h264_bframes.mp4', 'h264_moov_at_end.mp4', 'h264.mkv'];

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      if (req.url === '/') { res.setHeader('content-type', 'text/html'); return res.end(PAGE); }
      const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(root) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
      res.end(fs.readFileSync(f));
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

test('real VideoDecoder: right frame for sequential, skipping, backwards and out-of-range requests', async (t) => {
  if (!playwright) return t.skip('playwright not installed');
  let browser;
  try { browser = await playwright.chromium.launch(); } catch (e) { return t.skip('no browser: ' + String(e.message).split('\n')[0]); }
  const srv = await serve();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${srv.address().port}/`);
    const results = await page.evaluate(async (files) => {
      const gray = (f) => {
        const c = new OffscreenCanvas(16, 9), g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(f, 0, 0, 16, 9);
        const d = g.getImageData(8, 4, 1, 1).data; return d[0];
      };
      const out = {};
      for (const name of files) {
        const blob = await (await fetch('/test/fixtures/' + name)).blob();
        const tr = await Demux.open(blob);
        if (!tr) { out[name] = { unsupported: true }; continue; }
        // limited-range YUV -> RGB: R = (Y - 16) * 255 / 219
        const idxAt = async (r, t) => {
          const f = await r.frameAt(t), v = gray(f), y = v * 219 / 255 + 16, idx = Math.round((y - 20) / 7);
          return { idx, err: Math.abs(y - (20 + 7 * idx)), ts: f.timestamp };
        };
        const r = new Demux.Reader(tr);
        if (!(await r.start())) { out[name] = { unsupported: true }; continue; }
        const log = [];
        const want = (k) => k / 30 + 0.003; // +3 ms: WebM timestamps are rounded to milliseconds
        for (let k = 0; k < 30; k++) log.push(['seq', k, await idxAt(r, want(k))]);
        for (let k = 28; k >= 0; k -= 7) log.push(['back', k, await idxAt(r, want(k))]);
        for (let k = 0; k < 30; k += 3) log.push(['skip', k, await idxAt(r, want(k))]);
        log.push(['before', 0, await idxAt(r, -1)], ['after', 29, await idxAt(r, 50)]);
        r.close();
        // a second reader straight into the middle of the file
        const r2 = new Demux.Reader(tr); await r2.start();
        log.push(['mid', 17, await idxAt(r2, want(17))]); r2.close();
        out[name] = { log };
      }
      return out;
    }, FILES);

    let decoded = 0;
    for (const name of FILES) {
      const r = results[name];
      if (r.unsupported) { console.log(`  (skipped ${name}: browser cannot decode it)`); continue; }
      decoded++;
      for (const [kind, k, got] of r.log) {
        assert.equal(got.idx, k, `${name} ${kind}: asked for frame ${k}, got ${got.idx}`);
        assert.ok(got.err <= 2.5, `${name} ${kind} ${k}: luma off by ${got.err}`);
      }
    }
    assert.ok(decoded >= 3, `expected the VP8/VP9 fixtures to decode, got ${decoded}`);
  } finally { await browser.close(); srv.close(); }
});
