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
- Export: H.264 MP4 where the browser supports it, otherwise WebM (VP9/Opus), with mixed audio.
- Autosave: project in `localStorage`, media in IndexedDB (restored on reload).

## Limits

- Auto captions need network on first use: `cdn.jsdelivr.net` (transformers.js 3.7.1) and `huggingface.co` (model weights, cached afterwards). The user is asked before the download; audio stays on the device. Whisper translation targets English only. Only the surrounding pipeline was tested with a stub engine; Whisper itself could not be reached from the build sandbox.
- Export records in real time (a 60 s video takes 60 s) and the tab must stay visible.
- WebM files from `MediaRecorder` carry no duration metadata; seeking in some players is rough. Re-mux with `ffmpeg -i in.webm -c copy out.webm` if needed.
- Filters rely on canvas `ctx.filter` (not in Safari).

## Layout

- `index.html`, `style.css`, `app.js`: the whole app; `captions-worker.js`: Whisper worker. `window.__studio` exposes helpers for tests.
