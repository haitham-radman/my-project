# Graph Report - scope  (2026-10-30)

## Corpus Check
- Corpus is ~32,715 words - fits in a single context window. You may not need a graph.

## Summary
- 333 nodes · 681 edges · 20 communities (17 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Skill Search CLI
- Lasso Engine Tests
- Studio App Core
- Lasso Page Structure
- Studio Demux Tests
- Frontmatter Hook
- MP4/WebM Demuxer
- Lasso App UI
- Studio Export
- Studio Input Bindings
- Studio Timeline UI
- Studio Clips and Boot
- Mods Hooks
- Lasso Engine
- Studio Zoom and Waveform
- Studio Rendering
- Mods Overview
- Session Start Hook

## God Nodes (most connected - your core abstractions)
1. `commit()` - 22 edges
2. `renderInspector()` - 19 edges
3. `startFastExport()` - 19 edges
4. `exposeTestHook()` - 18 edges
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

### Community 2 - "Studio App Core"
Cohesion: 0.10
Nodes (24): afterChange(), autoCaption(), bindImport(), calibrateColor(), clipAudio(), decodeMedia(), elFor(), finishExport() (+16 more)

### Community 3 - "Lasso Page Structure"
Cohesion: 0.09
Nodes (27): Lasso index.html, Composer (prompt/template panes), Discover section, Library view, Result section with scores and actions, Scripts engine.js, data.js, app.js, Lasso README, Discover starter prompts (data.js) (+19 more)

### Community 4 - "Studio Demux Tests"
Cohesion: 0.11
Nodes (19): assert, block(), CONTAINERS, el(), expected, fs, FX, good (+11 more)

### Community 5 - "Frontmatter Hook"
Cohesion: 0.13
Nodes (5): check(), main(), parse(), CheckSkillFrontmatter, run_hook()

### Community 6 - "MP4/WebM Demuxer"
Cohesion: 0.18
Nodes (7): boxes(), ByteSource, demuxMp4(), demuxWebm(), open(), parse(), Reader

### Community 7 - "Lasso App UI"
Cohesion: 0.27
Nodes (18): applyLang(), copyText(), fillSelect(), generate(), grow(), h(), init(), paintResult() (+10 more)

### Community 8 - "Studio Export"
Cohesion: 0.21
Nodes (18): closeReaders(), concatBytes(), ensureAudio(), exposeTestHook(), ivfBytes(), loadFfmpeg(), openExport(), pause() (+10 more)

### Community 9 - "Studio Input Bindings"
Cohesion: 0.19
Nodes (13): applyRes(), bindKeyboard(), bindWindow(), buildTextPresets(), drawRuler(), dupSel(), fitStage(), init() (+5 more)

### Community 10 - "Studio Timeline UI"
Cohesion: 0.38
Nodes (13): buildLanes(), cancelCaption(), captionSection(), chkRow(), colorRow(), commit(), el(), numRow() (+5 more)

### Community 11 - "Studio Clips and Boot"
Cohesion: 0.29
Nodes (11): addMediaClip(), addText(), boot(), newClip(), newProject(), removeMedia(), renderAll(), renderBin() (+3 more)

### Community 12 - "Mods Hooks"
Cohesion: 0.22
Nodes (3): EDIT_TOOLS, register(), weather()

### Community 13 - "Lasso Engine"
Cohesion: 0.50
Nodes (8): cleanTask(), detectLang(), detectType(), enhance(), fromTemplate(), score(), section(), words()

### Community 14 - "Studio Zoom and Waveform"
Cohesion: 0.29
Nodes (7): bindControls(), clipEl(), computePeaks(), drawWave(), removeSel(), renderTimeline(), setZoom()

### Community 15 - "Studio Rendering"
Cohesion: 0.29
Nodes (7): drawText(), drawVisual(), filterStr(), render(), roundRect(), visualSource(), wrapText()

### Community 16 - "Mods Overview"
Cohesion: 0.40
Nodes (4): Claude Code mods README, blast-radius mod, replay-theater mod, token-weather mod

## Knowledge Gaps
- **14 isolated node(s):** `NVM_DIR`, `Lasso README`, `Composer (prompt/template panes)`, `token-weather mod`, `blast-radius mod` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 101 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `commit()` (e.g. with `colorRow()` and `renderInspector()`) actually correct?**
  _`commit()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NVM_DIR`, `Lasso README`, `Composer (prompt/template panes)` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Skill Search CLI` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._
- **Are the 15 inferred relationships involving `exposeTestHook()` (e.g. with `addMediaClip()` and `autoCaption()`) actually correct?**
  _`exposeTestHook()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Should `Lasso Engine Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.06258890469416785 - nodes in this community are weakly interconnected._
- **Should `Studio App Core` be split into smaller, more focused modules?**
  _Cohesion score 0.1028225806451613 - nodes in this community are weakly interconnected._
- **Should `Lasso Page Structure` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._