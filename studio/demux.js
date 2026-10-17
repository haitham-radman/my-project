'use strict';
/* Minimal demuxers (MP4/MOV and WebM/MKV) plus a sequential WebCodecs reader.
   Used by export to decode source video frames without seeking a <video> element.
   Anything unusual (fragmented MP4, rotated video, lacing, HEVC/AV1, ...) returns null so the caller falls back. */
(() => {
  const fourcc = (u, o) => String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]);
  const hex2 = (n) => n.toString(16).padStart(2, '0');

  /** Random-access reader over a Blob with an 8 MB read window. */
  class ByteSource {
    constructor(blob) { this.blob = blob; this.size = blob.size; this.w0 = 0; this.w = new Uint8Array(0); }
    async get(off, len) {
      len = Math.min(len, this.size - off);
      if (len <= 0) return new Uint8Array(0);
      if (off >= this.w0 && off + len <= this.w0 + this.w.length) return this.w.subarray(off - this.w0, off - this.w0 + len);
      const end = Math.min(this.size, off + Math.max(len, 8 << 20));
      this.w = new Uint8Array(await this.blob.slice(off, end).arrayBuffer()); this.w0 = off;
      return this.w.subarray(0, len);
    }
  }

  /* ---------------- MP4 ---------------- */
  function* boxes(u, start, end) {
    const dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
    let o = start;
    while (o + 8 <= end) {
      let size = dv.getUint32(o), hdr = 8;
      const type = fourcc(u, o + 4);
      if (size === 1) { size = Number(dv.getBigUint64(o + 8)); hdr = 16; } else if (size === 0) size = end - o;
      if (size < hdr || o + size > end) return;
      yield { type, start: o + hdr, end: o + size };
      o += size;
    }
  }
  const child = (u, b, type) => { for (const c of boxes(u, b.start, b.end)) if (c.type === type) return c; return null; };

  async function demuxMp4(src) {
    let off = 0, moov = null;
    while (off + 8 <= src.size) {
      const h = await src.get(off, 16), dv = new DataView(h.buffer, h.byteOffset, h.byteLength);
      let size = dv.getUint32(0), hdr = 8; const type = fourcc(h, 4);
      if (size === 1) { size = Number(dv.getBigUint64(8)); hdr = 16; } else if (size === 0) size = src.size - off;
      if (size < hdr) return null;
      if (type === 'moov') { moov = new Uint8Array(await src.blob.slice(off + hdr, off + size).arrayBuffer()); break; }
      if (type === 'moof') return null;
      off += size;
    }
    if (!moov) return null;
    const dv = new DataView(moov.buffer);
    const root = { start: 0, end: moov.length };
    if (child(moov, root, 'mvex')) return null; // fragmented

    let trak = null;
    for (const t of boxes(moov, 0, moov.length)) {
      if (t.type !== 'trak') continue;
      const mdia = child(moov, t, 'mdia'), hdlr = mdia && child(moov, mdia, 'hdlr');
      if (hdlr && fourcc(moov, hdlr.start + 8) === 'vide') { trak = t; break; }
    }
    if (!trak) return null;

    // rotation / mirroring would not be applied to decoded frames
    const tkhd = child(moov, trak, 'tkhd');
    if (tkhd) {
      const m = tkhd.start + (moov[tkhd.start] === 1 ? 48 : 40);
      if (dv.getInt32(m) !== 0x10000 || dv.getInt32(m + 16) !== 0x10000 || dv.getInt32(m + 4) !== 0 || dv.getInt32(m + 12) !== 0) return null;
    }
    const mdia = child(moov, trak, 'mdia'), mdhd = child(moov, mdia, 'mdhd');
    const timescale = dv.getUint32(mdhd.start + (moov[mdhd.start] === 1 ? 20 : 12));
    let mediaTime = 0;
    const edts = child(moov, trak, 'edts'), elst = edts && child(moov, edts, 'elst');
    if (elst) {
      const v = moov[elst.start], n = dv.getUint32(elst.start + 4);
      if (n !== 1) return null;
      mediaTime = v === 1 ? Number(dv.getBigInt64(elst.start + 16)) : dv.getInt32(elst.start + 12);
      if (mediaTime < 0) return null;
    }
    const minf = child(moov, mdia, 'minf'), stbl = child(moov, minf, 'stbl');
    const stsd = child(moov, stbl, 'stsd');
    const e0 = stsd.start + 8, entryType = fourcc(moov, e0 + 4), entryEnd = e0 + dv.getUint32(e0);
    const width = dv.getUint16(e0 + 8 + 8 + 16), height = dv.getUint16(e0 + 8 + 8 + 18);
    let codec = null, description = null;
    for (const c of boxes(moov, e0 + 86, entryEnd)) {
      if (c.type === 'avcC' && (entryType === 'avc1' || entryType === 'avc3')) {
        description = moov.slice(c.start, c.end);
        codec = 'avc1.' + hex2(description[1]) + hex2(description[2]) + hex2(description[3]);
      } else if (c.type === 'vpcC' && entryType === 'vp09') {
        const p = c.start + 4;
        const lv = [10, 11, 20, 21, 30, 31, 40, 41, 50, 51, 52, 60, 61, 62].includes(moov[p + 1]) ? moov[p + 1] : vp9Level(width, height);
        codec = `vp09.${hex2(moov[p])}.${lv}.${hex2(moov[p + 2] >> 4)}`;
      }
    }
    if (!codec) return null;

    const full = (b) => ({ v: moov[b.start], p: b.start + 4 });
    const stts = full(child(moov, stbl, 'stts')), sttsN = dv.getUint32(stts.p);
    const stszB = child(moov, stbl, 'stsz'), stsz = dv.getUint32(stszB.start + 4), count = dv.getUint32(stszB.start + 8);
    const sizes = new Array(count);
    for (let i = 0; i < count; i++) sizes[i] = stsz || dv.getUint32(stszB.start + 12 + i * 4);
    const stscB = child(moov, stbl, 'stsc'), stscN = dv.getUint32(stscB.start + 4);
    const stcoB = child(moov, stbl, 'stco') || child(moov, stbl, 'co64'), is64 = stcoB.type === 'co64', chunkN = dv.getUint32(stcoB.start + 4);
    const chunkOff = (i) => (is64 ? Number(dv.getBigUint64(stcoB.start + 8 + i * 8)) : dv.getUint32(stcoB.start + 8 + i * 4));

    const offs = new Array(count); let si = 0;
    for (let e = 0; e < stscN; e++) {
      const first = dv.getUint32(stscB.start + 8 + e * 12), per = dv.getUint32(stscB.start + 12 + e * 12);
      const last = e + 1 < stscN ? dv.getUint32(stscB.start + 8 + (e + 1) * 12) - 1 : chunkN;
      for (let ch = first; ch <= last; ch++) {
        let o = chunkOff(ch - 1);
        for (let k = 0; k < per && si < count; k++, si++) { offs[si] = o; o += sizes[si]; }
      }
    }
    const dts = new Array(count); let t = 0; si = 0;
    for (let e = 0; e < sttsN; e++) {
      const n = dv.getUint32(stts.p + 4 + e * 8), d = dv.getUint32(stts.p + 8 + e * 8);
      for (let k = 0; k < n && si < count; k++, si++) { dts[si] = t; t += d; }
    }
    const cttsB = child(moov, stbl, 'ctts'), cto = new Array(count).fill(0);
    if (cttsB) {
      const signed = moov[cttsB.start] === 1, n = dv.getUint32(cttsB.start + 4); si = 0;
      for (let e = 0; e < n; e++) {
        const c = dv.getUint32(cttsB.start + 8 + e * 8), d = signed ? dv.getInt32(cttsB.start + 12 + e * 8) : dv.getUint32(cttsB.start + 12 + e * 8);
        for (let k = 0; k < c && si < count; k++, si++) cto[si] = d;
      }
    }
    const stssB = child(moov, stbl, 'stss'), key = new Array(count).fill(!stssB);
    if (stssB) { const n = dv.getUint32(stssB.start + 4); for (let i = 0; i < n; i++) key[dv.getUint32(stssB.start + 8 + i * 4) - 1] = true; }

    const samples = [];
    for (let i = 0; i < count; i++) samples.push({ off: offs[i], size: sizes[i], pts: (dts[i] + cto[i] - mediaTime) / timescale, key: key[i] });
    return { src, codec, description, width, height, samples };
  }

  /* ---------------- WebM / Matroska ---------------- */
  const DESCEND = new Set([0x18538067, 0x1f43b675, 0x1654ae6b, 0xae, 0xe0, 0xa0, 0x1549a966]);
  // Level is only a hint, but invalid values make isConfigSupported say no.
  const vp9Level = (w, h) => (w * h <= 2088960 ? 41 : 51);
  const vlen = (b) => (b === 0 ? 0 : Math.clz32(b) - 24 + 1);

  async function demuxWebm(src) {
    let pos = 0, tcScale = 1e6, clusterTc = 0, vnum = -1, lastGroup = -1;
    const tracks = [], samples = [];
    const uint = async (o, n) => { const b = await src.get(o, n); let v = 0; for (let i = 0; i < b.length; i++) v = v * 256 + b[i]; return v; };
    while (pos < src.size) {
      const h = await src.get(pos, 12);
      const n = vlen(h[0]); if (!n || n > 4) return null;
      let id = 0; for (let i = 0; i < n; i++) id = id * 256 + h[i];
      const m = vlen(h[n]); if (!m) return null;
      let size = h[n] & (0xff >> m), unknown = size === (0xff >> m);
      for (let i = 1; i < m; i++) { size = size * 256 + h[n + i]; unknown = unknown && h[n + i] === 0xff; }
      const payload = pos + n + m;
      if (DESCEND.has(id)) {
        if (id === 0xae) tracks.push({});
        pos = payload; continue;
      }
      if (unknown) return null;
      const cur = tracks[tracks.length - 1];
      if (id === 0x2ad7b1) tcScale = await uint(payload, size);
      else if (id === 0xe7) clusterTc = await uint(payload, size);
      else if (cur && id === 0xd7) cur.num = await uint(payload, size);
      else if (cur && id === 0x83) cur.type = await uint(payload, size);
      else if (cur && id === 0xb0) cur.w = await uint(payload, size);
      else if (cur && id === 0xba) cur.h = await uint(payload, size);
      else if (cur && id === 0x86) cur.codec = String.fromCharCode(...await src.get(payload, size));
      else if (cur && id === 0x63a2) cur.priv = new Uint8Array(await src.blob.slice(payload, payload + size).arrayBuffer());
      else if (id === 0xa3 || id === 0xa1) {
        if (vnum < 0) { const v = tracks.find((x) => x.type === 1); if (!v) return null; vnum = v.num; }
        const b = await src.get(payload, 16), l = vlen(b[0]);
        const num = b[0] & (0xff >> l);
        let tn = num; for (let i = 1; i < l; i++) tn = tn * 256 + b[i];
        const flags = b[l + 2];
        if (tn === vnum) {
          if (flags & 0x06) return null; // lacing
          const tc = ((b[l] << 8) | b[l + 1]) << 16 >> 16;
          samples.push({ off: payload + l + 3, size: size - l - 3, pts: (clusterTc + tc) * tcScale / 1e9, key: id === 0xa3 ? !!(flags & 0x80) : true });
          lastGroup = id === 0xa1 ? samples.length - 1 : -1;
        }
      } else if (id === 0xfb && lastGroup >= 0) samples[lastGroup].key = false;
      pos = payload + size;
    }
    const v = tracks.find((x) => x.type === 1);
    if (!v || !samples.length) return null;
    let codec = null, description = null;
    if (v.codec === 'V_VP9') codec = `vp09.00.${vp9Level(v.w || 0, v.h || 0)}.08`;
    else if (v.codec === 'V_VP8') codec = 'vp8';
    else if (v.codec === 'V_MPEG4/ISO/AVC' && v.priv) { description = v.priv; codec = 'avc1.' + hex2(v.priv[1]) + hex2(v.priv[2]) + hex2(v.priv[3]); }
    if (!codec) return null;
    return { src, codec, description, width: v.w || 0, height: v.h || 0, samples };
  }

  /* ---------------- sequential reader ---------------- */
  // Decoders stall when too many output frames stay unclosed, so the reader keeps only the frame it will
  // return plus the lookahead it needs, closing the rest as soon as they arrive, and feeds in small batches.
  class Reader {
    constructor(track) {
      this.t = track; this.dec = null; this.buf = []; this.idx = 0; this.eof = false; this.err = null;
      this.curTs = null; this.target = null; this.waiters = []; this.started = false; this.warm = false;
      this.keys = []; track.samples.forEach((s, i) => { if (s.key) this.keys.push(i); });
    }
    config() {
      const t = this.t, cfg = { codec: t.codec, optimizeForLatency: true };
      if (t.description) cfg.description = t.description;
      if (t.colorSpace) cfg.colorSpace = t.colorSpace;
      if (t.width) { cfg.codedWidth = t.width; cfg.codedHeight = t.height; }
      return cfg;
    }
    async start() {
      const sup = await VideoDecoder.isConfigSupported(this.config());
      if (!sup.supported) return false;
      this.dec = new VideoDecoder({
        output: (f) => {
          this.warm = true; // the decoder has caught up with its reordering delay
          this.buf.push(f); this.prune(); this.wake();
        },
        error: (e) => { this.err = e; this.wake(); },
      });
      this.dec.configure(this.config());
      return true;
    }
    wake() { const w = this.waiters; this.waiters = []; w.forEach((r) => r()); }
    wait(ms) { return new Promise((r) => { const to = setTimeout(r, ms); this.waiters.push(() => { clearTimeout(to); r(); }); }); }
    bestFor(us) {
      let best = null;
      for (const f of this.buf) if (f.timestamp <= us && (!best || f.timestamp > best.timestamp)) best = f;
      return best;
    }
    /** Close every buffered frame older than the best candidate for the current target. */
    prune() {
      if (this.target == null) return;
      const best = this.bestFor(this.target); if (!best) return;
      this.buf = this.buf.filter((f) => { if (f !== best && f.timestamp < best.timestamp) { f.close(); return false; } return true; });
    }
    drop() { this.buf.forEach((f) => f.close()); this.buf = []; this.curTs = null; }
    async seekTo(sec) {
      let k = this.keys[0] || 0;
      for (const i of this.keys) { if (this.t.samples[i].pts <= sec + 1e-6) k = i; else break; }
      this.drop(); this.dec.reset(); this.dec.configure(this.config()); this.idx = k; this.eof = false; this.warm = false;
    }
    // Feed in small steps and let outputs arrive before feeding more (a few samples until the first frame
    // appears, because decoders hold frames back for reordering; then one at a time), with decodeQueueSize as backpressure.
    async pump() {
      const s = this.t.samples;
      if (this.idx >= s.length) { await this.dec.flush(); this.eof = true; return; }
      const batch = this.warm ? 1 : 4;
      for (let n = 0; n < batch && this.idx < s.length; n++, this.idx++) {
        const smp = s[this.idx];
        const data = await this.t.src.get(smp.off, smp.size);
        this.dec.decode(new EncodedVideoChunk({ type: smp.key ? 'key' : 'delta', timestamp: Math.round(smp.pts * 1e6), data }));
        if (this.dec.decodeQueueSize > 8) await this.wait(200);
      }
      await this.wait(this.warm ? 20 : 30);
    }
    /** Latest frame whose timestamp is <= sec (sequential access; restarts from a keyframe if asked to go back).
        The returned frame stays open until the next call that returns a different frame, or close(). */
    async frameAt(sec) {
      const us = sec * 1e6;
      this.target = us;
      if (!this.started) { await this.seekTo(sec); this.started = true; }
      else if (this.curTs != null && us < this.curTs - 1) await this.seekTo(sec);
      for (;;) {
        if (this.err) throw this.err;
        if (this.eof || this.buf.some((f) => f.timestamp > us)) break;
        await this.pump();
      }
      let best = this.bestFor(us);
      if (!best) best = this.buf.reduce((a, f) => (!a || f.timestamp < a.timestamp ? f : a), null);
      if (!best) throw new Error('no frame decoded');
      this.buf = this.buf.filter((f) => { if (f !== best && f.timestamp < best.timestamp) { f.close(); return false; } return true; });
      this.curTs = best.timestamp;
      return best;
    }
    close() { try { this.target = null; this.drop(); if (this.dec && this.dec.state !== 'closed') this.dec.close(); } catch { /* ignore */ } }
  }

  async function parse(blob) {
    const src = new ByteSource(blob), head = await src.get(0, 12);
    let track = null;
    if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) track = await demuxWebm(src);
    else if (['ftyp', 'moov', 'mdat', 'free', 'wide'].includes(fourcc(head, 4))) track = await demuxMp4(src);
    return track && track.samples.length ? track : null;
  }

  /** Parse a file once; returns null when it can't be decoded this way. */
  async function open(blob) {
    if (!window.VideoDecoder || !window.EncodedVideoChunk) return null;
    try {
      const track = await parse(blob);
      if (!track) return null;
      const sup = await VideoDecoder.isConfigSupported(new Reader(track).config());
      return sup.supported ? track : null;
    } catch { return null; }
  }

  window.Demux = { open, parse, Reader };
})();
