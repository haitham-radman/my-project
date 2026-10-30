'use strict';
/* End-to-end check of the editor's undo/redo in headless Chromium via Playwright: the Undo/Redo buttons must enable and
   disable with the history, whether the change is made with the buttons or the keyboard. Skipped when Playwright or a
   browser is not available. */
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

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(root, url === '/' ? 'index.html' : url);
      if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.statusCode = 404; return res.end(); }
      res.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream');
      res.end(fs.readFileSync(f));
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

test('Undo and Redo buttons follow the history for button and keyboard changes', async (t) => {
  if (!playwright) return t.skip('playwright not installed');
  let browser;
  try { browser = await playwright.chromium.launch(); } catch (e) { return t.skip('no browser: ' + String(e.message).split('\n')[0]); }
  const srv = await serve();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${srv.address().port}/`);
    await page.waitForFunction(() => window.__studio);
    const state = () => page.evaluate(() => ({
      clips: window.__studio.S.clips.length,
      undo: !document.querySelector('#btnUndo').disabled,
      redo: !document.querySelector('#btnRedo').disabled,
    }));

    assert.deepEqual(await state(), { clips: 0, undo: false, redo: false }, 'fresh project');

    await page.evaluate(() => window.__studio.addText());
    assert.deepEqual(await state(), { clips: 1, undo: true, redo: false }, 'after adding a clip');

    await page.click('#btnUndo');
    assert.deepEqual(await state(), { clips: 0, undo: false, redo: true }, 'after Undo button');

    await page.click('#btnRedo');
    assert.deepEqual(await state(), { clips: 1, undo: true, redo: false }, 'after Redo button');

    await page.keyboard.press('Control+z');
    assert.deepEqual(await state(), { clips: 0, undo: false, redo: true }, 'after Ctrl+Z');

    await page.keyboard.press('Control+Shift+z');
    assert.deepEqual(await state(), { clips: 1, undo: true, redo: false }, 'after Ctrl+Shift+Z');

    assert.deepEqual(errors, [], 'no page errors');
  } finally {
    await browser.close();
    srv.close();
  }
});
