// Runs Whisper locally in the browser (transformers.js). The library and the
// model weights are downloaded once from jsdelivr / huggingface.co, then cached
// by the browser; the audio itself never leaves the device.
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1';

let asr = null;
let loaded = '';

async function load(model, device, post) {
  const key = model + '|' + device;
  if (asr && loaded === key) return;
  asr = null;
  const files = {};
  asr = await pipeline('automatic-speech-recognition', model, {
    device,
    progress_callback: (p) => {
      if (p.status === 'progress' && p.file) {
        files[p.file] = { loaded: p.loaded, total: p.total };
        const all = Object.values(files);
        const total = all.reduce((s, f) => s + (f.total || 0), 0);
        const done = all.reduce((s, f) => s + (f.loaded || 0), 0);
        post({ type: 'load', pct: total ? done / total : 0 });
      }
    },
  });
  loaded = key;
}

self.onmessage = async (e) => {
  const { audio, language, task, model } = e.data;
  const post = (m) => self.postMessage(m);
  try {
    const device = self.navigator && self.navigator.gpu ? 'webgpu' : 'wasm';
    try { await load(model, device, post); }
    catch (err) { if (device === 'wasm') throw err; await load(model, 'wasm', post); }
    post({ type: 'run' });
    const out = await asr(audio, {
      language: language === 'auto' ? null : language,
      task,
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    post({ type: 'result', chunks: out.chunks || [{ text: out.text, timestamp: [0, null] }] });
  } catch (err) {
    post({ type: 'error', message: String((err && err.message) || err) });
  }
};
