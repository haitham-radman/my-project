# رحلة الحاج – Hajj Journey Motion Graphics (Alrifada)

- `hajj-journey-alrifada-subtitled.mp4` – final video (1920×1080, 30 fps, 85 s, with ambient soundtrack).
- `index.html` – the animation (SVG, driven by `render(t)`), using the logo palette: `#A80713`, black, white.
- `render.js` – frame renderer (Playwright + ffmpeg). `node render.js worker out.mp4 <startFrame> <endFrame>`.
- `assets/` – logo and Cairo font.

## Audio
- `make_sfx.py` builds the sound-effects track (plane landing, buses, footsteps, pebbles at the Jamarat, crickets, whooshes…) and mixes the Talbiyah/Takbeer clips in `external/clips/`.
- `cut_chants.py <talbiyah.mp3> <takbeer.mp3>` cuts those clips from the full recordings (snapped to quiet points, with fades).
- Mixing: music pad + `sfx-track.m4a` → video (see git history for the ffmpeg command).
