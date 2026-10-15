# رحلة الحاج – Hajj Journey Motion Graphics (Alrifada)

- `hajj-journey-alrifada.mp4` – final video (1920×1080, 30 fps, 85 s, with ambient soundtrack).
- `index.html` – the animation (SVG, driven by `render(t)`), using the logo palette: `#A80713`, black, white.
- `render.js` – frame renderer (Playwright + ffmpeg). `node render.js worker out.mp4 <startFrame> <endFrame>`.
- `assets/` – logo and Cairo font.
