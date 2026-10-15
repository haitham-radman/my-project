// Usage: node render.js <width> <height> <out.mp4> [--stills t1,t2,...]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const [w, h, out] = process.argv.slice(2);
  const stillsArg = process.argv.indexOf('--stills');
  const fps = 30;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e));
  await page.goto('file://' + path.join(__dirname, 'src/index.html') + `?w=${w}&h=${h}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 30000 });
  const dur = await page.evaluate('window.__dur');

  if (stillsArg > 0) {
    for (const t of process.argv[stillsArg + 1].split(',').map(Number)) {
      await page.evaluate(t => window.seek(t), t);
      await page.screenshot({ path: `${out}_${t}.png` });
    }
    await browser.close();
    return;
  }

  fs.writeFileSync(out.replace(/\.mp4$/, '') + '.sfx.json', JSON.stringify({ dur, sfx: await page.evaluate('window.__sfx') }));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(dur * fps);
  for (let i = 0; i < N; i++) {
    await page.evaluate(t => window.seek(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`${out}: frame ${i}/${N}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
})();
