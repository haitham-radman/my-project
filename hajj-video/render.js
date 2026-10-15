// Usage:
//   node render.js preview out_dir t1 t2 ...      -> PNG stills
//   node render.js worker out.mp4 startFrame endFrame
const { chromium } = require(process.env.PW_PATH || 'playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const FPS = 30;

async function open() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files', '--disable-gpu'] });
  const page = await browser.newPage({ viewport: process.env.VERT ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + (process.env.VERT ? '?v=1' : ''));
  await page.evaluate(() => window.ready);
  return { browser, page };
}

(async () => {
  const [mode, out, a, b] = process.argv.slice(2);
  if (mode === 'preview') {
    const { browser, page } = await open();
    for (const t of process.argv.slice(4)) {
      await page.evaluate(t => render(t), parseFloat(t));
      await page.screenshot({ path: path.join(out, `t${t}.png`) });
    }
    await browser.close();
  } else if (mode === 'worker') {
    const { browser, page } = await open();
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = +a; f < +b; f++) {
      await page.evaluate(t => render(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    await browser.close();
  }
})();
