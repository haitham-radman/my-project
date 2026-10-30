# Graph Report - scope  (2026-10-30)

## Corpus Check
- Corpus is ~32,715 words - fits in a single context window. You may not need a graph.

## Summary
- 327 nodes · 658 edges · 20 communities (17 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Skill Search CLI
- Lasso Engine Tests
- Lasso Page Structure
- Studio Demux Tests
- Studio App Core
- Frontmatter Hook
- Studio Timeline UI
- MP4 Demuxer
- Lasso App UI
- Studio Playback
- Mods Hooks
- Lasso Engine
- Studio Captions
- Studio Frame Seeking
- Studio Rendering
- Mods Overview
- Studio Text Clips
- Session Start Hook

## God Nodes (most connected - your core abstractions)
1. `init()` - 35 edges
2. `commit()` - 21 edges
3. `renderInspector()` - 19 edges
4. `startFastExport()` - 19 edges
5. `renderAll()` - 17 edges
6. `el()` - 14 edges
7. `Reader` - 14 edges
8. `autoCaption()` - 12 edges
9. `startExport()` - 12 edges
10. `init()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Lasso prompt-improver site` --semantically_similar_to--> `Montage Studio video editor`  [INFERRED] [semantically similar]
  lasso/README.md → studio/README.md
- `folders()` --calls--> `search()`  [EXTRACTED]
  tools/skill-search/skill-search.test.mjs → tools/skill-search/index.mjs
- `Result section with scores and actions` --implements--> `Before/after heuristic score`  [INFERRED]
  lasso/index.html → lasso/README.md
- `Export modal` --implements--> `Export modes (WebCodecs, live, ffmpeg.wasm x264)`  [EXTRACTED]
  studio/index.html → studio/README.md
- `buildIndex()` --calls--> `tokenize()`  [EXTRACTED]
  tools/skill-search/index.mjs → tools/skill-search/normalize.mjs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Claude Code mods set** — mods_readme_token_weather, mods_readme_blast_radius, mods_readme_replay_theater [EXTRACTED 1.00]
- **Studio export pipeline** — studio_readme_export, studio_readme_demux, studio_readme_ffmpegwasm [EXTRACTED 1.00]
- **Lasso static app scripts** — lasso_index_scripts, lasso_readme_engine, lasso_readme_discover [INFERRED 0.85]

## Communities (20 total, 3 thin omitted)

### Community 0 - "Skill Search CLI"
Cohesion: 0.09
Nodes (29): index, limit, query, skillsDir, bm25(), buildIndex(), FIELDS, FIELDS_OF (+21 more)

### Community 1 - "Lasso Engine Tests"
Cohesion: 0.06
Nodes (22): assert, test, assert, FILES, fs, http, path, root (+14 more)

### Community 2 - "Lasso Page Structure"
Cohesion: 0.09
Nodes (27): Lasso index.html, Composer (prompt/template panes), Discover section, Library view, Result section with scores and actions, Scripts engine.js, data.js, app.js, Lasso README, Discover starter prompts (data.js) (+19 more)

### Community 3 - "Studio Demux Tests"
Cohesion: 0.11
Nodes (19): assert, block(), CONTAINERS, el(), expected, fs, FX, good (+11 more)

### Community 4 - "Studio App Core"
Cohesion: 0.13
Nodes (17): clipEl(), computePeaks(), decodeMedia(), drawRuler(), drawWave(), finishExport(), importFiles(), importOne() (+9 more)

### Community 5 - "Frontmatter Hook"
Cohesion: 0.13
Nodes (5): check(), main(), parse(), CheckSkillFrontmatter, run_hook()

### Community 6 - "Studio Timeline UI"
Cohesion: 0.20
Nodes (22): addMediaClip(), afterChange(), buildLanes(), chkRow(), colorRow(), commit(), dupSel(), el() (+14 more)

### Community 7 - "MP4 Demuxer"
Cohesion: 0.18
Nodes (7): boxes(), ByteSource, demuxMp4(), demuxWebm(), open(), parse(), Reader

### Community 8 - "Lasso App UI"
Cohesion: 0.27
Nodes (18): applyLang(), copyText(), fillSelect(), generate(), grow(), h(), init(), paintResult() (+10 more)

### Community 9 - "Studio Playback"
Cohesion: 0.20
Nodes (19): applyRes(), closeReaders(), concatBytes(), ensureAudio(), fitStage(), frame(), init(), ivfBytes() (+11 more)

### Community 10 - "Mods Hooks"
Cohesion: 0.22
Nodes (3): EDIT_TOOLS, register(), weather()

### Community 11 - "Lasso Engine"
Cohesion: 0.50
Nodes (8): cleanTask(), detectLang(), detectType(), enhance(), fromTemplate(), score(), section(), words()

### Community 12 - "Studio Captions"
Cohesion: 0.28
Nodes (9): autoCaption(), cancelCaption(), captionSection(), clipAudio(), runAsr(), setCap(), srtFor(), toast() (+1 more)

### Community 13 - "Studio Frame Seeking"
Cohesion: 0.29
Nodes (8): calibrateColor(), elFor(), openReaders(), prepareFrames(), seekClip(), seekEl(), syncMedia(), wire()

### Community 14 - "Studio Rendering"
Cohesion: 0.29
Nodes (7): drawText(), drawVisual(), filterStr(), render(), roundRect(), visualSource(), wrapText()

### Community 15 - "Mods Overview"
Cohesion: 0.40
Nodes (4): Claude Code mods README, blast-radius mod, replay-theater mod, token-weather mod

### Community 16 - "Studio Text Clips"
Cohesion: 0.40
Nodes (5): addText(), buildTextPresets(), newClip(), placeCaptions(), seek()

## Knowledge Gaps
- **14 isolated node(s):** `NVM_DIR`, `Lasso README`, `Composer (prompt/template panes)`, `token-weather mod`, `blast-radius mod` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 101 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `init()` connect `Studio Playback` to `Studio Text Clips`, `Studio App Core`, `Studio Captions`, `Studio Timeline UI`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `init()` (e.g. with `addMediaClip()` and `autoCaption()`) actually correct?**
  _`init()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NVM_DIR`, `Lasso README`, `Composer (prompt/template panes)` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Skill Search CLI` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._
- **Are the 2 inferred relationships involving `commit()` (e.g. with `colorRow()` and `renderInspector()`) actually correct?**
  _`commit()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Lasso Engine Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.06258890469416785 - nodes in this community are weakly interconnected._
- **Should `Lasso Page Structure` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._