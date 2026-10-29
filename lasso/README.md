# Lasso

Static prompt-improver site, inspired by the idea of promptcowboy.ai (own name, code, layout and prompt library). Type a rough idea, get a structured prompt. Arabic (RTL, default) and English. No build, no dependencies, no network at load.

## Run

```bash
cd lasso && python3 -m http.server 8000   # then open http://localhost:8000
```

## What it does

- **Prompt / Template modes.** Free text, or a form (role, audience, task, context, format, tone, constraints).
- **Rule-based enhancer** (`engine.js`): detects language and task type (writing, email, coding, analysis, research, marketing, image), keeps the user's own words, and adds only what is missing: role, context slots in `[brackets]`, steps, output format, constraints, and a "ask me clarifying questions" line. `Claude` gets XML-tagged sections, the other targets get Markdown.
- **Before/after score** (0-100): counts structure traits (role, context, steps, format, constraints, clarifying line, length). It is a heuristic, not a measure of answer quality.
- **Discover**: about 40 starter prompts across 12 roles (`data.js`), searchable across all roles.
- **Library**: saved prompts in `localStorage` (this device only). Language choice is stored too.
- Copy, and open in ChatGPT / Claude with the prompt in the URL (only when the user clicks).

## Limits

- It does not call an AI model. Output is a template filled from rules, so it improves structure, not facts or domain depth. For model-written rewrites, `engine.enhance` would be replaced by a call to an LLM API behind a server (never put an API key in this static page).
- Fonts are the system stack (no webfont download). Arabic looks best where Noto Sans Arabic or similar is installed.
- Very long prompts in the "open in" links can exceed URL limits; use Copy instead.

## Tests

```bash
node --test lasso/engine.test.js   # 10 tests, plain Node
```

## Layout

`index.html`, `style.css`, `app.js` (UI, i18n, storage), `engine.js` (enhancer, also loadable from Node), `data.js` (library), `favicon.svg`.
