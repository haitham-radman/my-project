# Graph Report - scope  (2026-10-30)

## Corpus Check
- Corpus is ~33,124 words - fits in a single context window. You may not need a graph.

## Summary
- 349 nodes · 706 edges · 20 communities (18 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Lasso Engine Tests
- Skill Search CLI
- Studio App Core
- Studio Demux Tests
- Studio Page and Captions
- Frontmatter Hook
- Studio Input and Export
- MP4/WebM Demuxer
- Lasso App UI
- Studio Controls and Clips
- Lasso Page Structure
- Studio Timeline UI
- Mods Hooks
- Lasso Engine
- Studio Rendering
- Studio Frame Seeking
- Mods Overview
- Studio Undo/Redo
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
- `folders()` --calls--> `search()`  [EXTRACTED]
  tools/skill-search/skill-search.test.mjs → tools/skill-search/index.mjs
- `Result section with scores and actions` --implements--> `Before/after heuristic score`  [INFERRED]
  lasso/index.html → lasso/README.md
- `buildIndex()` --calls--> `tokenize()`  [EXTRACTED]
  tools/skill-search/index.mjs → tools/skill-search/normalize.mjs
- `search()` --calls--> `parseQuery()`  [EXTRACTED]
  tools/skill-search/index.mjs → tools/skill-search/parse-query.mjs
- `parseQuery()` --calls--> `tokenize()`  [EXTRACTED]
  tools/skill-search/parse-query.mjs → tools/skill-search/normalize.mjs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Claude Code mods set** — mods_readme_token_weather, mods_readme_blast_radius, mods_readme_replay_theater [EXTRACTED 1.00]
- **Lasso static app scripts** — lasso_index_scripts, lasso_readme_engine, lasso_readme_discover [INFERRED 0.85]
- **Studio test suite sharing fixtures** — studio_test_demux_test, studio_test_reader_test, studio_test_decode_test, studio_test_history_test, studio_readme_fixtures [EXTRACTED 1.00]
- **Studio app source files** — studio_readme_index_html, studio_readme_style_css, studio_readme_app_js, studio_demux, studio_captions_worker [EXTRACTED 1.00]

## Communities (20 total, 2 thin omitted)

### Community 0 - "Lasso Engine Tests"
Cohesion: 0.05
Nodes (30): assert, test, Test fixtures (make-fixtures.js), assert, FILES, fs, http, path (+22 more)

### Community 1 - "Skill Search CLI"
Cohesion: 0.09
Nodes (29): index, limit, query, skillsDir, bm25(), buildIndex(), FIELDS, FIELDS_OF (+21 more)

### Community 2 - "Studio App Core"
Cohesion: 0.11
Nodes (24): applyRes(), autoCaption(), bindWindow(), boot(), clipAudio(), clipEl(), computePeaks(), decodeMedia() (+16 more)

### Community 3 - "Studio Demux Tests"
Cohesion: 0.11
Nodes (19): assert, block(), CONTAINERS, el(), expected, fs, FX, good (+11 more)

### Community 4 - "Studio Page and Captions"
Cohesion: 0.08
Nodes (20): Studio index.html, Export modal, Header (project name, aspect, undo/redo, export), Media and text side panel, Stage canvas and transport, Timeline section, Montage Studio README, app.js (+12 more)

### Community 5 - "Frontmatter Hook"
Cohesion: 0.13
Nodes (5): check(), main(), parse(), CheckSkillFrontmatter, run_hook()

### Community 6 - "Studio Input and Export"
Cohesion: 0.17
Nodes (22): bindImport(), buildTextPresets(), closeReaders(), concatBytes(), ensureAudio(), exposeTestHook(), importFiles(), init() (+14 more)

### Community 7 - "MP4/WebM Demuxer"
Cohesion: 0.18
Nodes (7): boxes(), ByteSource, demuxMp4(), demuxWebm(), open(), parse(), Reader

### Community 8 - "Lasso App UI"
Cohesion: 0.27
Nodes (18): applyLang(), copyText(), fillSelect(), generate(), grow(), h(), init(), paintResult() (+10 more)

### Community 9 - "Studio Controls and Clips"
Cohesion: 0.22
Nodes (16): addMediaClip(), addText(), bindControls(), bindKeyboard(), dupSel(), newClip(), newProject(), removeMedia() (+8 more)

### Community 10 - "Lasso Page Structure"
Cohesion: 0.21
Nodes (12): Lasso index.html, Composer (prompt/template panes), Discover section, Library view, Result section with scores and actions, Scripts engine.js, data.js, app.js, Lasso README, Discover starter prompts (data.js) (+4 more)

### Community 11 - "Studio Timeline UI"
Cohesion: 0.38
Nodes (13): buildLanes(), cancelCaption(), captionSection(), chkRow(), colorRow(), commit(), el(), numRow() (+5 more)

### Community 12 - "Mods Hooks"
Cohesion: 0.22
Nodes (3): EDIT_TOOLS, register(), weather()

### Community 13 - "Lasso Engine"
Cohesion: 0.50
Nodes (8): cleanTask(), detectLang(), detectType(), enhance(), fromTemplate(), score(), section(), words()

### Community 14 - "Studio Rendering"
Cohesion: 0.29
Nodes (7): drawText(), drawVisual(), filterStr(), render(), roundRect(), visualSource(), wrapText()

### Community 15 - "Studio Frame Seeking"
Cohesion: 0.40
Nodes (6): calibrateColor(), elFor(), openReaders(), prepareFrames(), seekClip(), seekEl()

### Community 16 - "Mods Overview"
Cohesion: 0.40
Nodes (4): Claude Code mods README, blast-radius mod, replay-theater mod, token-weather mod

### Community 17 - "Studio Undo/Redo"
Cohesion: 0.60
Nodes (5): afterChange(), redo(), restore(), scheduleSave(), undo()

## Knowledge Gaps
- **17 isolated node(s):** `NVM_DIR`, `Lasso README`, `Composer (prompt/template panes)`, `token-weather mod`, `blast-radius mod` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 112 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `app.js` connect `Studio Page and Captions` to `Lasso Engine Tests`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `commit()` (e.g. with `colorRow()` and `renderInspector()`) actually correct?**
  _`commit()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NVM_DIR`, `Lasso README`, `Composer (prompt/template panes)` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lasso Engine Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.051418439716312055 - nodes in this community are weakly interconnected._
- **Are the 15 inferred relationships involving `exposeTestHook()` (e.g. with `addMediaClip()` and `autoCaption()`) actually correct?**
  _`exposeTestHook()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Should `Skill Search CLI` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._
- **Should `Studio App Core` be split into smaller, more focused modules?**
  _Cohesion score 0.10685483870967742 - nodes in this community are weakly interconnected._