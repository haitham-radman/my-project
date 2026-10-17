'use strict';
/* Tests for Demux.Reader (the sequential WebCodecs frame reader) against a fake VideoDecoder that
   reorders frames like a real H.264 decoder, so no browser is needed:
   node --test "studio/test/*.test.js" */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

global.window = global;
require('../demux.js');
const { Demux } = global;
const FX = path.join(__dirname, 'fixtures');
const track = async (f) => Demux.parse(new Blob([fs.readFileSync(path.join(FX, f))]));

/** Fake decoder: outputs asynchronously, in presentation order, holding back `holdback` frames until more input arrives. */
function installFake({ holdback = 2, failAfter = Infinity, supported = true, latency = 0 } = {}) {
  const log = { fed: [], resets: 0, flushes: 0, open: 0, maxOpen: 0, frames: [] };
  class FakeFrame {
    constructor(ts) { this.timestamp = ts; this.closed = false; log.open++; log.maxOpen = Math.max(log.maxOpen, log.open); log.frames.push(this); }
    close() { if (!this.closed) { this.closed = true; log.open--; } }
  }
  class FakeDecoder {
    constructor(init) { this.init = init; this.state = 'unconfigured'; this.decodeQueueSize = 0; this.pending = []; this.epoch = 0; this.needKey = true; }
    static async isConfigSupported() { return { supported }; }
    configure() { this.state = 'configured'; this.needKey = true; }
    reset() { this.epoch++; this.pending = []; this.state = 'unconfigured'; log.resets++; }
    emit(ts) { const ep = this.epoch; setTimeout(() => { if (ep === this.epoch && this.state !== 'closed') this.init.output(new FakeFrame(ts)); }, latency); }
    decode(chunk) {
      assert.ok(this.state === 'configured', 'decode() on an unconfigured decoder');
      if (this.needKey) assert.equal(chunk.type, 'key', 'first chunk after configure/reset must be a key frame');
      this.needKey = false;
      log.fed.push({ type: chunk.type, ts: chunk.timestamp });
      if (log.fed.length > failAfter) { setTimeout(() => this.init.error(new Error('decoder exploded')), 0); return; }
      this.pending.push(chunk.timestamp); this.pending.sort((a, b) => a - b);
      while (this.pending.length > holdback) this.emit(this.pending.shift());
    }
    async flush() { while (this.pending.length) this.emit(this.pending.shift()); await new Promise((r) => setTimeout(r, latency + 5)); } // like the real flush(): resolves only after every output was delivered
    close() { this.state = 'closed'; }
  }
  class FakeChunk { constructor(o) { Object.assign(this, o); } }
  global.VideoDecoder = FakeDecoder; global.EncodedVideoChunk = FakeChunk;
  return log;
}
const uninstall = () => { delete global.VideoDecoder; delete global.EncodedVideoChunk; };
const us = (s) => Math.round(s * 1e6);
const wanted = (tr, t) => Math.max(...tr.samples.map((s) => us(s.pts)).filter((p) => p <= us(t) + 1e-6));
const grid = (k) => us(k / 30);

for (const [file, holdback] of [['h264_bframes.mp4', 2], ['vp9.mp4', 0], ['vp8.webm', 0]]) {
  test(`${file}: sequential access returns the right frame for every output frame`, async () => {
    const log = installFake({ holdback });
    try {
      const tr = await track(file), r = new Demux.Reader(tr);
      assert.ok(await r.start());
      for (let k = 0; k < 30; k++) {
        const f = await r.frameAt(k / 30 + 0.002);
        assert.ok(Math.abs(f.timestamp - grid(k)) < 1100, `frame ${k}: got ${f.timestamp}`);
        assert.equal(f.closed, false, 'returned frame stays open for the caller');
        assert.ok(log.open <= 6, `open frames ${log.open} at k=${k}`);
      }
      assert.ok(log.fed.length <= 30, 'each sample is fed once during a forward pass');
      assert.equal(log.fed.filter((c) => c.type === 'key').length >= 3, true);
      r.close();
      assert.equal(log.open, 0, 'close() releases every frame');
    } finally { uninstall(); }
  });
}

test('output frames repeat while the requested time stays inside one source frame (slow motion / upsampling)', async () => {
  installFake();
  try {
    const r = new Demux.Reader(await track('h264_bframes.mp4')); await r.start();
    const a = await r.frameAt(0.5 + 0.001), b = await r.frameAt(0.5 + 0.02);
    assert.equal(a, b);
    assert.equal(a.closed, false);
    r.close();
  } finally { uninstall(); }
});

test('speed 2 (skipping every other frame) and the superseded frame is closed', async () => {
  const log = installFake();
  try {
    const tr = await track('h264_bframes.mp4'), r = new Demux.Reader(tr); await r.start();
    let prev = null;
    for (let k = 0; k < 30; k += 2) {
      const f = await r.frameAt(k / 30 + 0.002);
      assert.ok(Math.abs(f.timestamp - grid(k)) < 1100);
      if (prev) assert.equal(prev.closed, true, 'older frame was closed once replaced');
      prev = f;
    }
    r.close(); assert.equal(log.open, 0);
  } finally { uninstall(); }
});

test('starting in the middle begins decoding at the key frame before the requested time', async () => {
  const log = installFake();
  try {
    const tr = await track('h264_bframes.mp4'), r = new Demux.Reader(tr); await r.start();
    const f = await r.frameAt(0.55);
    assert.equal(f.timestamp, wanted(tr, 0.55));
    assert.equal(log.fed[0].type, 'key');
    const keyPts = tr.samples.filter((s) => s.key).map((s) => us(s.pts)).filter((p) => p <= us(0.55));
    assert.equal(log.fed[0].ts, Math.max(...keyPts), 'started at the last key frame at or before the target');
    assert.ok(log.fed.length < 25, 'did not decode from the start of the file');
    assert.ok(log.maxOpen <= 6, `frames before the target are closed as they arrive (max open ${log.maxOpen})`);
    r.close();
  } finally { uninstall(); }
});

test('asking for an earlier time restarts from a key frame', async () => {
  const log = installFake();
  try {
    const tr = await track('h264_bframes.mp4'), r = new Demux.Reader(tr); await r.start();
    await r.frameAt(0.9);
    const resets = log.resets, fed = log.fed.length;
    const f = await r.frameAt(0.1);
    assert.equal(f.timestamp, wanted(tr, 0.1));
    assert.equal(log.resets, resets + 1);
    assert.equal(log.fed[fed].type, 'key');
    r.close(); assert.equal(log.open, 0);
  } finally { uninstall(); }
});

test('before the first frame gives the first frame; past the end gives the last', async () => {
  installFake();
  try {
    const tr = await track('vp9.mp4'), r = new Demux.Reader(tr); await r.start();
    assert.equal((await r.frameAt(-1)).timestamp, 0);
    const last = await r.frameAt(10);
    assert.equal(last.timestamp, grid(29));
    assert.equal((await r.frameAt(99)).timestamp, grid(29));
    r.close();
  } finally { uninstall(); }
});

test('a decoder error rejects frameAt so the caller can fall back', async () => {
  installFake({ failAfter: 5 });
  try {
    const r = new Demux.Reader(await track('vp9.mp4')); await r.start();
    await assert.rejects(() => r.frameAt(0.8), /exploded/);
    r.close();
  } finally { uninstall(); }
});

test('start() reports false when the browser cannot decode the codec', async () => {
  installFake({ supported: false });
  try {
    assert.equal(await new Demux.Reader(await track('vp9.mp4')).start(), false);
  } finally { uninstall(); }
});

test('hundreds of sequential requests keep a bounded number of frames open', async () => {
  const log = installFake();
  try {
    const r = new Demux.Reader(await track('h264_bframes.mp4')); await r.start();
    for (let i = 0; i < 300; i++) await r.frameAt((i / 300) * 0.99);
    assert.ok(log.maxOpen <= 8, `max open frames ${log.maxOpen}`);
    r.close(); assert.equal(log.open, 0);
  } finally { uninstall(); }
});

test('a slow decoder (high output latency, deep reordering) does not make the reader over-feed', async () => {
  const log = installFake({ holdback: 3, latency: 40 });
  try {
    const tr = await track('h264_bframes.mp4'), r = new Demux.Reader(tr); await r.start();
    for (let k = 0; k < 30; k++) {
      const f = await r.frameAt(k / 30 + 0.002);
      assert.ok(Math.abs(f.timestamp - grid(k)) < 1100, `frame ${k}`);
    }
    assert.ok(log.maxOpen <= 12, `max open frames ${log.maxOpen}`); // a few frames of lookahead, nowhere near the whole file
    assert.ok(log.fed.length <= 30);
    r.close(); assert.equal(log.open, 0);
  } finally { uninstall(); }
});
