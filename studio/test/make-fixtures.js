'use strict';
/* Regenerates fixtures/ and fixtures/expected.json. Needs ffmpeg and ffprobe on PATH.
   Usage: node studio/test/make-fixtures.js
   Every clip is 1 s, 160x90, 30 fps; frame N is flat gray with luma code value 20 + 7*N (inside the limited range 16..235), so a decoded frame
   identifies its own index. The expected sample tables are produced by demux.js and cross-checked
   against ffprobe (size, pts, keyframe flag, and for MP4 the file offset) before being written. */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'fixtures');
fs.mkdirSync(dir, { recursive: true });
const SRC = "color=c=black:s=160x90:r=30:d=1,format=yuv420p,geq=lum='20+7*N':cb=128:cr=128";
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', SRC, ...a], { stdio: 'inherit' });
const out = (n) => path.join(dir, n);

ff('-c:v', 'libvpx-vp9', '-g', '10', '-b:v', '200k', out('vp9.webm'));
ff('-c:v', 'libvpx', '-g', '10', '-b:v', '200k', out('vp8.webm'));
ff('-c:v', 'libvpx-vp9', '-g', '10', '-b:v', '200k', '-f', 'webm', '-live', '1', out('vp9_unknown_size.webm'));
ff('-c:v', 'libvpx-vp9', '-g', '10', '-b:v', '200k', out('vp9.mp4'));
ff('-c:v', 'libx264', '-g', '10', '-bf', '2', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out('h264_bframes.mp4'));
ff('-c:v', 'libx264', '-g', '10', '-bf', '2', '-pix_fmt', 'yuv420p', out('h264_moov_at_end.mp4'));
ff('-c:v', 'libx264', '-g', '10', '-bf', '2', '-pix_fmt', 'yuv420p', out('h264.mkv'));
ff('-c:v', 'libx264', '-g', '10', '-pix_fmt', 'yuv420p', '-movflags', 'frag_keyframe+empty_moov', out('fragmented.mp4'));
ff('-c:v', 'libx264', '-g', '10', '-pix_fmt', 'yuv420p', out('rotated.mp4'));
// 90 degree rotation: overwrite the tkhd transformation matrix
{
  const b = fs.readFileSync(out('rotated.mp4')), i = b.indexOf('tkhd'), m = i + 4 + (b[i + 4] === 1 ? 48 : 40);
  b.writeInt32BE(0, m); b.writeInt32BE(0x10000, m + 4); b.writeInt32BE(-0x10000, m + 12); b.writeInt32BE(0, m + 16);
  fs.writeFileSync(out('rotated.mp4'), b);
}
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=d=1', '-c:a', 'aac', out('audio_only.mp4')], { stdio: 'inherit' });
fs.writeFileSync(out('garbage.bin'), Buffer.from('this is not a media file '.repeat(40)));

global.window = global;
require('../demux.js');
const parsed = {};
(async () => {
  for (const f of fs.readdirSync(dir).filter((x) => !x.endsWith('.json')).sort()) {
    const t = await window.Demux.parse(new Blob([fs.readFileSync(out(f))]));
    if (!t) { parsed[f] = null; continue; }
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_packets', '-of', 'json', out(f)], { maxBuffer: 1e8 })).packets;
    if (probe.length !== t.samples.length) throw new Error(`${f}: ${t.samples.length} samples vs ${probe.length} packets`);
    t.samples.forEach((s, i) => {
      const p = probe[i], pts = +(p.pts_time ?? p.dts_time);
      const bad = s.size !== +p.size || Math.abs(s.pts - pts) > 1e-3 || s.key !== p.flags.includes('K') || (f.endsWith('.mp4') && s.off !== +p.pos);
      if (bad) throw new Error(`${f}: sample ${i} differs from ffprobe`);
    });
    parsed[f] = {
      codec: t.codec, width: t.width, height: t.height, descriptionBytes: t.description ? t.description.length : 0,
      samples: t.samples.map((s) => [s.off, s.size, +s.pts.toFixed(5), s.key ? 1 : 0]),
    };
  }
  fs.writeFileSync(path.join(dir, 'expected.json'), JSON.stringify(parsed, null, 1) + '\n');
  console.log('wrote', Object.keys(parsed).length, 'fixtures;', 'null for:', Object.entries(parsed).filter(([, v]) => !v).map(([k]) => k).join(', '));
})();
