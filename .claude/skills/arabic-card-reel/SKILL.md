---
name: arabic-card-reel
description: Make a vertical 1080x1920 Arabic explainer reel in a dark "card" style (near-black background with teal and orange glow, big right-aligned headlines with highlighted words, rounded cards revealed one by one, thin progress bar) from the user's own text. Style template only; it does not edit or convert existing footage. Use when the user says "card reel", "dark Arabic reel", "same style as the صنعة AI video", or asks for a tips/steps/prompts reel in this look (Arabic requests included, e.g. ريل بطاقات، ستايل الكروت الداكن، نفس ستايل الفيديو).
---

# Arabic Card Reel

Local skill (written for this repo, not upstream). It reproduces the **visual style** of a ~67 s Arabic TikTok explainer the user liked (dark background, teal and orange accents, header strip, cards that appear step by step, progress bar, follow outro). The reference was studied from frames the user uploaded; its audio, script, brand name, logo and handle are not reused. Brand text is a placeholder until the user gives theirs.

## Local policy

Ask the user and wait for a yes before you:
1. Install anything (`pip`, `npm`, `npx`, `brew`, `apt`), including fonts or a browser.
2. Download or fetch anything, or send text or frames to an online service. The builder needs no network.
3. Write into an existing output folder. Output goes to `./arabic-card-reel/<slug>/`; the script refuses a non-empty folder.
4. Use someone else's brand, logo, handle or script. Use the user's own brand text and content.

## What the style is

- Canvas 1080x1920, 30 fps. Background `#050b0d` with a faint teal glow on the left and an orange glow at lower right.
- Header: brand and small ring monogram on the right, spaced-out English kicker on the left (default `AI TOOLS · REAL RESULTS`).
- Headline: very large, bold, right-aligned; `*word*` is teal `#19d3b5`, `~word~` orange `#ff8a3d`.
- Tag pill above the headline (teal, orange or white), e.g. `٠١ • الإنتاجية`.
- Blocks revealed one per step: `quote` (teal outlined prompt box), `stat` (big number plus line), `note` (grey line), `chips` (outlined pills), `pill` (white pill), `checklist` (rows with a check, cross or bang square), `mindmap` (white root pill and up to three branches).
- Scene kinds: `hook` (icon, title, subtitle, pill; centred), `cards` (default), `outro` (ring logo, "follow" title, button that flips to a "followed" state).
- Bottom progress bar fills orange to teal over the whole video; a soft tick sounds on each reveal; steps cross-fade for 0.25 s. No music or voice-over; mix the user's own audio in afterwards if wanted.

## Steps

1. **Inputs.** Get the topic, the user's brand text, language (Arabic is right-to-left) and rough length. Check `ffmpeg -version` and that a Chrome/Chromium exists (`CARD_REEL_BROWSER` overrides the search).
2. **Write the spec.** Copy `examples/demo.json` and replace the content. Keep one idea per scene: hook, then 3-5 tip scenes (tag, headline, one or two blocks), then an outro. Aim for 5-8 s per scene and at least 0.8 s per reveal step. Show the user the text and get approval before rendering.
3. **Render.**
   ```bash
   python3 .claude/skills/arabic-card-reel/scripts/build_card_reel.py spec.json ./arabic-card-reel/<slug>
   ```
   About 40 s for a 40 s video. Tests: `cd .claude/skills/arabic-card-reel/scripts && python3 -m unittest test_build_card_reel`.
4. **QC.** Check duration, a 1080x1920 frame size and that audio exists. Make a contact sheet (`ffmpeg -i final.mp4 -vf "fps=1/2.5,scale=270:480,tile=8x2" -frames:v 1 sheet.png`), view it, and look for text overflow, wrong Arabic direction, and cards overlapping the progress bar. Fix the spec and re-render into a new folder.
5. **Deliver.** Give the path to `final.mp4`, say what was checked and what was not.

## Known limits

- The only installed Arabic-capable font here is DejaVu Sans, so headlines look heavier and plainer than the reference (a rounded geometric Arabic face such as Tajawal or Cairo). With the user's consent install one and set `"font": "Tajawal"` in the spec.
- Reveals are cross-fades between stills, not per-element slide-ins.
- The reference's circular logo animation, the flying mind-map lines and the TikTok handle watermark are not reproduced (TikTok adds the watermark on download).
