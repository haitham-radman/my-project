# استوديو المونتاج (Montage Studio)

Browser-based video editor. No build step, no dependencies, nothing uploaded: files stay on the device.

## Run

```bash
cd studio && python3 -m http.server 8000   # then open http://localhost:8000
```

Use Chrome or Edge (needs `MediaRecorder`, `AudioContext`, canvas `filter`).

## Features

- Multi-track timeline: 2 text, 2 video/image, 2 audio tracks; drag, trim, snap, cross-track moves, waveforms, zoom (Ctrl+wheel).
- Split (S), duplicate (Ctrl+D), delete / ripple delete (Delete / Shift+Delete), undo / redo, frame stepping (arrows).
- Per clip: position, scale, rotation, opacity, fit, speed, volume, fade in/out, colour filters and presets. Drag clips directly on the preview.
- Text/captions: Arabic (RTL) and Latin, fonts, outline, shadow, background box, animations (fade, slide, pop, typewriter).
- Auto captions: select a video/audio clip, then "كابشن تلقائي". Whisper (tiny/base/small) runs in a Web Worker via transformers.js, with language choice, transcribe or translate-to-English, caption style and animation, and SRT download. Lines become editable text clips.
- Aspect presets: 16:9, 9:16, 1:1, 4:5, 4:3 (1080p-class output).
- Export, three modes: WebCodecs (browser encoder, H.264 -> MP4 or VP9 -> WebM, muxed with the mixed audio by ffmpeg.wasm without re-encoding), live recording (MediaRecorder; H.264 MP4 where supported, else WebM), or the experimental ffmpeg.wasm x264 mode (each frame rendered deterministically, mixed audio rendered offline, x264 + AAC in an MP4; resolution full / ~720p / ~540p; cancellable).
- Autosave: project in `localStorage`, media in IndexedDB (restored on reload).

## Limits

- WebCodecs export still renders frame by frame (one video seek per frame), and so is bounded by seek speed, not by encoding. Measured in the same headless sandbox: 6 s at ~720p in about 14 s and 4 s at 1080p in about 15 s, against 19 s and 23 s for the x264 mode; that sandbox had no GPU and only offered VP9 (no H.264 encoder), so the H.264 path was checked only for its mux step, with a stream encoded by native ffmpeg. It needs `VideoEncoder` (Chrome/Edge). The VP9 branch muxes with Vorbis because the bundled libopus hangs on real audio.
- ffmpeg.wasm (used by both ffmpeg modes for muxing) downloads ffmpeg.wasm 0.12 (about 32 MB, `cdn.jsdelivr.net`) after the user confirms; every file is checked against a pinned SHA-384 before use. It is the single-thread core (the multi-thread core needs COOP/COEP headers a plain static server doesn't send), so x264 runs on one thread. Measured in a 4-core headless Chromium without GPU: a 6 s project at ~720p took about 19 s (frame rendering about 75 ms/frame, dominated by per-frame video seeks and JPEG encoding), and a 4 s project at 1080p about 23 s. That is slower than live recording there; expect it to beat real time only with the smaller resolutions on a faster machine. Verify on your hardware before relying on it.

- Auto captions need network on first use: `cdn.jsdelivr.net` (transformers.js 3.7.1) and `huggingface.co` (model weights, cached afterwards). The user is asked before the download; audio stays on the device. Whisper translation targets English only. Only the surrounding pipeline was tested with a stub engine; Whisper itself could not be reached from the build sandbox.
- Export records in real time (a 60 s video takes 60 s) and the tab must stay visible.
- WebM files from `MediaRecorder` carry no duration metadata; seeking in some players is rough. Re-mux with `ffmpeg -i in.webm -c copy out.webm` if needed.
- Filters rely on canvas `ctx.filter` (not in Safari).

## Layout

- `index.html`, `style.css`, `app.js`: the whole app; `captions-worker.js`: Whisper worker. ffmpeg.wasm is loaded from the CDN at run time (no vendored binaries). `window.__studio` exposes helpers for tests.
