'use strict';
/* Unit tests for studio/demux.js that run in plain Node (no browser):
   node --test "studio/test/*.test.js"
   Fixtures are committed (see make-fixtures.js); ffmpeg/ffprobe are only used for optional cross-checks. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

global.window = global;
require('../demux.js');
const { Demux } = global;

const FX = path.join(__dirname, 'fixtures');
const expected = JSON.parse(fs.readFileSync(path.join(FX, 'expected.json'), 'utf8'));
const bytes = (f) => fs.readFileSync(path.join(FX, f));
const blobOf = (buf) => new Blob([buf]);
const have = (cmd) => spawnSync(cmd, ['-version']).status === 0;
const summary = (t) => t && {
  codec: t.codec, width: t.width, height: t.height, descriptionBytes: t.description ? t.description.length : 0,
  samples: t.samples.map((s) => [s.off, s.size, +s.pts.toFixed(5), s.key ? 1 : 0]),
};
const good = Object.entries(expected).filter(([, v]) => v).map(([k]) => k);
const rejected = Object.entries(expected).filter(([, v]) => !v).map(([k]) => k);

/* ---------- golden files ---------- */
for (const f of good) {
  test(`parse ${f} matches the golden sample table`, async () => {
    assert.deepEqual(summary(await Demux.parse(blobOf(bytes(f)))), expected[f]);
  });
}

for (const f of rejected) {
  test(`parse ${f} is refused`, async () => {
    // garbage / audio-only / fragmented / rotated must come back as null (caller falls back to <video> seeking)
    let r;
    try { r = await Demux.parse(blobOf(bytes(f))); } catch { r = null; }
    assert.equal(r, null);
  });
}

/* ---------- structural invariants ---------- */
for (const f of good) {
  test(`${f}: 30 frames, presentation times on the 30 fps grid, key frame first, data inside the file`, async () => {
    const t = await Demux.parse(blobOf(bytes(f)));
    const size = bytes(f).length;
    assert.equal(t.samples.length, 30);
    assert.ok(t.samples[0].key, 'first sample in decode order must be a key frame');
    assert.ok(t.samples.filter((s) => s.key).length >= 3, 'GOP of 10 frames gives at least 3 key frames');
    const pts = t.samples.map((s) => s.pts).sort((a, b) => a - b);
    pts.forEach((p, i) => assert.ok(Math.abs(p - i / 30) < 0.0011, `pts[${i}]=${p}`)); // WebM rounds to ms
    let prev = -1;
    for (const s of t.samples) {
      assert.ok(s.size > 0 && s.off >= 0 && s.off + s.size <= size, 'sample range inside file');
      assert.ok(s.off > prev, 'sample data offsets increase in decode order');
      prev = s.off + s.size - 1;
    }
  });
}

test('codec strings', async () => {
  const c = async (f) => (await Demux.parse(blobOf(bytes(f)))).codec;
  assert.equal(await c('vp8.webm'), 'vp8');
  assert.match(await c('vp9.webm'), /^vp09\.00\.(41|51)\.08$/);
  assert.match(await c('vp9.mp4'), /^vp09\.\d\d\.(10|11|20|21|30|31|40|41|50|51|52|60|61|62)\.08$/);
  for (const f of ['h264_bframes.mp4', 'h264_moov_at_end.mp4', 'h264.mkv']) {
    const t = await Demux.parse(blobOf(bytes(f)));
    assert.match(t.codec, /^avc1\.[0-9a-f]{6}$/);
    assert.equal(t.description[0], 1, 'avcC configurationVersion');
    assert.equal(t.description.length, expected[f].descriptionBytes);
  }
  assert.equal((await Demux.parse(blobOf(bytes('vp9.mp4')))).description, null);
});

test('B-frame H.264 is reordered: decode order differs from presentation order, and the edit list is applied', async () => {
  const t = await Demux.parse(blobOf(bytes('h264_bframes.mp4')));
  const order = t.samples.map((s) => s.pts);
  assert.notDeepEqual(order, [...order].sort((a, b) => a - b));
  assert.ok(Math.min(...order) >= -1e-9, 'first presented frame is at time 0');
});

/* ---------- payload bytes (needs ffmpeg) ---------- */
function ivfFrames(buf) {
  const out = []; let o = 32;
  while (o + 12 <= buf.length) { const n = buf.readUInt32LE(o); out.push(buf.subarray(o + 12, o + 12 + n)); o += 12 + n; }
  return out;
}
for (const f of ['vp9.webm', 'vp8.webm', 'vp9.mp4', 'vp9_unknown_size.webm']) {
  test(`${f}: sample offsets point at the same payload bytes ffmpeg extracts`, { skip: !have('ffmpeg') && 'ffmpeg not installed' }, async () => {
    const r = spawnSync('ffmpeg', ['-v', 'error', '-i', path.join(FX, f), '-c:v', 'copy', '-f', 'ivf', '-'], { maxBuffer: 1e8 });
    assert.equal(r.status, 0);
    const frames = ivfFrames(r.stdout), file = bytes(f), t = await Demux.parse(blobOf(file));
    assert.equal(frames.length, t.samples.length);
    t.samples.forEach((s, i) => assert.ok(file.subarray(s.off, s.off + s.size).equals(frames[i]), `sample ${i}`));
  });
}

for (const f of good) {
  test(`${f}: sample table agrees with ffprobe`, { skip: !have('ffprobe') && 'ffprobe not installed' }, async () => {
    const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_packets', '-of', 'json', path.join(FX, f)], { maxBuffer: 1e8 });
    const pk = JSON.parse(r.stdout).packets, t = await Demux.parse(blobOf(bytes(f)));
    assert.equal(pk.length, t.samples.length);
    t.samples.forEach((s, i) => {
      assert.equal(s.size, +pk[i].size, `size ${i}`);
      assert.ok(Math.abs(s.pts - +(pk[i].pts_time ?? pk[i].dts_time)) < 1e-3, `pts ${i}`);
      assert.equal(s.key, pk[i].flags.includes('K'), `key ${i}`);
    });
  });
}

/* ---------- synthetic WebM (EBML built by hand) ---------- */
const vint = (n) => {
  for (let len = 1; len <= 8; len++) {
    if (n < 2 ** (7 * len) - 1) { const b = []; let v = n; for (let i = 0; i < len; i++) { b.unshift(v % 256); v = Math.floor(v / 256); } b[0] |= 0x80 >> (len - 1); return Buffer.from(b); }
  }
  throw new Error('too big');
};
const el = (id, ...parts) => { const p = Buffer.concat(parts); return Buffer.concat([Buffer.from(id, 'hex'), vint(p.length), p]); };
const unknownSize = (id, ...parts) => Buffer.concat([Buffer.from(id, 'hex'), Buffer.from('01ffffffffffffff', 'hex'), ...parts]);
const uint = (id, n) => { const b = []; do { b.unshift(n % 256); n = Math.floor(n / 256); } while (n); return el(id, Buffer.from(b)); };
const str = (id, s) => el(id, Buffer.from(s));
const block = (id, track, tc, flags, data) => el(id, vint(track), Buffer.from([(tc >> 8) & 255, tc & 255, flags]), Buffer.from(data));
const trackEntry = (num, type, codec, ...extra) => el('ae', uint('d7', num), uint('83', type), str('86', codec), ...extra);
const webm = (...clusters) => Buffer.concat([
  el('1a45dfa3', str('4282', 'webm')),
  unknownSize('18538067',
    el('1549a966', uint('2ad7b1', 1000000)),
    el('1654ae6b',
      trackEntry(2, 2, 'A_OPUS'),
      trackEntry(1, 1, 'V_VP8', el('e0', uint('b0', 160), uint('ba', 90)))),
    ...clusters),
]);

test('synthetic WebM: unknown-size segment and clusters, audio track first, BlockGroup keyframe inference', async () => {
  const buf = webm(
    unknownSize('1f43b675', uint('e7', 0),
      block('a3', 1, 0, 0x80, 'AA'),
      block('a3', 2, 5, 0x80, 'audio!'),
      block('a3', 1, 33, 0x00, 'BB'),
      el('a0', block('a1', 1, 66, 0x00, 'CC'), uint('fb', 1)), // has a reference -> delta frame
      el('a0', block('a1', 1, 100, 0x00, 'DD'))), // no reference -> key frame
    unknownSize('1f43b675', uint('e7', 1000), block('a3', 1, 0, 0x80, 'EE')));
  const t = await Demux.parse(blobOf(buf));
  assert.equal(t.codec, 'vp8');
  assert.equal(t.width, 160); assert.equal(t.height, 90);
  assert.deepEqual(t.samples.map((s) => [+s.pts.toFixed(3), s.key]), [[0, true], [0.033, false], [0.066, false], [0.1, true], [1, true]]);
  assert.deepEqual(t.samples.map((s) => buf.subarray(s.off, s.off + s.size).toString()), ['AA', 'BB', 'CC', 'DD', 'EE']);
});

test('synthetic WebM: custom TimecodeScale is honoured', async () => {
  const buf = Buffer.concat([
    el('1a45dfa3', str('4282', 'webm')),
    unknownSize('18538067',
      el('1549a966', uint('2ad7b1', 500000)),
      el('1654ae6b', trackEntry(1, 1, 'V_VP9', el('e0', uint('b0', 64), uint('ba', 64)))),
      unknownSize('1f43b675', uint('e7', 10), block('a3', 1, 4, 0x80, 'x'))),
  ]);
  const t = await Demux.parse(blobOf(buf));
  assert.ok(Math.abs(t.samples[0].pts - 14 * 0.0005) < 1e-9);
  assert.equal(t.codec, 'vp09.00.41.08');
});

test('synthetic WebM: laced blocks, missing video track, and unsupported codecs are refused', async () => {
  const laced = webm(unknownSize('1f43b675', uint('e7', 0), block('a3', 1, 0, 0x82, 'AA')));
  assert.equal(await Demux.parse(blobOf(laced)), null);
  const audioOnly = Buffer.concat([el('1a45dfa3', str('4282', 'webm')), unknownSize('18538067', el('1654ae6b', trackEntry(1, 2, 'A_OPUS')), unknownSize('1f43b675', uint('e7', 0), block('a3', 1, 0, 0x80, 'a')))]);
  assert.equal(await Demux.parse(blobOf(audioOnly)), null);
  const av1 = Buffer.concat([el('1a45dfa3', str('4282', 'webm')), unknownSize('18538067', el('1654ae6b', trackEntry(1, 1, 'V_AV1')), unknownSize('1f43b675', uint('e7', 0), block('a3', 1, 0, 0x80, 'a')))]);
  assert.equal(await Demux.parse(blobOf(av1)), null);
});

/* ---------- synthetic MP4: 64-bit chunk offsets ---------- */
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts']);
function rewriteBoxes(buf, fn) {
  const out = [];
  for (let o = 0; o < buf.length;) {
    const size = buf.readUInt32BE(o), type = buf.toString('latin1', o + 4, o + 8), payload = buf.subarray(o + 8, o + size);
    const body = CONTAINERS.has(type) ? rewriteBoxes(payload, fn) : payload;
    const r = fn(type, body);
    const nb = Buffer.alloc(8); nb.writeUInt32BE(r.body.length + 8); nb.write(r.type, 4, 'latin1');
    out.push(nb, r.body); o += size;
  }
  return Buffer.concat(out);
}
test('synthetic MP4: co64 gives the same sample table as stco', async () => {
  // moov sits after mdat in this fixture, so growing it does not move any sample data
  const src = bytes('h264_moov_at_end.mp4');
  const out = rewriteBoxes(src, (type, body) => {
    if (type !== 'stco') return { type, body };
    const n = body.readUInt32BE(4), nb = Buffer.alloc(8 + n * 8);
    nb.writeUInt32BE(n, 4);
    for (let i = 0; i < n; i++) nb.writeBigUInt64BE(BigInt(body.readUInt32BE(8 + i * 4)), 8 + i * 8);
    return { type: 'co64', body: nb };
  });
  assert.ok(out.includes('co64') && !out.includes('stco'));
  assert.deepEqual(summary(await Demux.parse(blobOf(out))), expected['h264_moov_at_end.mp4']);
});

test('MP4 with several chunks per stsc entry (interleaved layout) keeps sample offsets', async () => {
  // Split the single video chunk into 3 chunks by rewriting stsc/stco, which exercises the chunk walk.
  const src = bytes('h264_moov_at_end.mp4');
  const base = expected['h264_moov_at_end.mp4'].samples;
  const out = rewriteBoxes(src, (type, body) => {
    if (type === 'stsc') { const b = Buffer.alloc(8 + 12); b.writeUInt32BE(1, 4); b.writeUInt32BE(1, 8); b.writeUInt32BE(10, 12); b.writeUInt32BE(1, 16); return { type, body: b }; }
    if (type === 'stco') {
      const b = Buffer.alloc(8 + 12); b.writeUInt32BE(3, 4);
      [0, 10, 20].forEach((k, i) => b.writeUInt32BE(base[k][0], 8 + i * 4)); return { type, body: b };
    }
    return { type, body };
  });
  const t = await Demux.parse(blobOf(out));
  // chunk starts are the original offsets; samples inside a chunk are contiguous, so the table is unchanged
  // only when the original samples were contiguous (they are, in a single-track file)
  assert.deepEqual(t.samples.map((s) => [s.off, s.size]), base.map((s) => [s[0], s[1]]));
});

/* ---------- robustness ---------- */
test('open() never throws and returns null for refused or damaged input', async () => {
  global.VideoDecoder = class { static async isConfigSupported() { return { supported: true }; } };
  global.EncodedVideoChunk = class {};
  try {
    const full = bytes('h264_moov_at_end.mp4'), web = bytes('vp9.webm');
    const cases = [
      ['garbage.bin', bytes('garbage.bin')], ['empty', Buffer.alloc(0)], ['one byte', Buffer.from([0x1a])],
      ['mp4 cut before moov', full.subarray(0, 200)], ['mp4 cut inside moov', full.subarray(0, full.length - 40)],
      ['webm cut in the middle', web.subarray(0, Math.floor(web.length / 2))], ['webm header only', web.subarray(0, 60)],
    ];
    for (const [name, buf] of cases) {
      const r = await Demux.open(blobOf(buf));
      assert.ok(r === null || (r && Array.isArray(r.samples)), name);
    }
    assert.equal(await Demux.open(blobOf(bytes('garbage.bin'))), null);
    assert.equal(await Demux.open(blobOf(bytes('rotated.mp4'))), null);
    assert.ok(await Demux.open(blobOf(bytes('vp9.mp4'))), 'good file opens when the decoder claims support');
    global.VideoDecoder = class { static async isConfigSupported() { return { supported: false }; } };
    assert.equal(await Demux.open(blobOf(bytes('vp9.mp4'))), null, 'codec the browser cannot decode is refused');
  } finally { delete global.VideoDecoder; delete global.EncodedVideoChunk; }
});
