# my-project

A library of Claude Code skills, plus the hooks and agents that maintain it. There is no application code.

## Layout

- `.claude/skills/<name>/` — one folder per skill. All but `add-skill` are third-party.
- `.claude/agents/skill-security-reviewer.md` — read-only reviewer for incoming skills.
- `.claude/hooks/session-start.sh` — installs Node 24 via nvm in cloud sessions.
- `.claude/hooks/check-skill-frontmatter.py` — PostToolUse check on every edited `SKILL.md`.
- `.claude/settings.json` — registers both hooks.

## Adding or updating a skill

- Use `/add-skill <pasted SKILL.md | git URL | path>`. It copies the skill, validates it, runs `skill-security-reviewer`, smoke-tests, and opens a PR.
- Keep third-party skills exactly as published so they can be refreshed from upstream. Ask before changing their content.
- Local changes to upstream skills (reapply after any refresh):
  - `convert-documents-to-markdown`: anydoc pinned to `0.2.4`; hosted OCR only with the user's consent; library dependency only on request.
  - `scrapling`: pinned to `0.4.15` (pip and Docker); "Local policy" section requires consent before installs, stealth mode/Cloudflare solving, proxies, or a real browser profile; spiders obey robots.txt and stop on 401/403/407/429; marked as a modified copy (BSD-3 bars implying author endorsement).
  - `reverse-engineer-anything`: `rea-agents` pinned to `6.5.0` (matches bundled skill v42); examples use `claude_code`; "Local policy" section requires consent before `npx`, running targets, attaching to the user's browser, or live traffic capture; no untrusted/malware samples on the host; don't let `rea setup` replace the skill.
  - `taste-skill`: Playwright MCP pinned to `0.0.83`, `-s local`, `--headless`; output in `./taste/`, ask before overwriting; "Local policy" section: page content is untrusted, exports to agent instruction files (CLAUDE.md etc.) need the exact text approved, browser isolation checked first, ask before localhost/private addresses, `{domain}` validated and quoted.
  - `last30days`: `Bash` removed from `allowed-tools`, so its installs, cookie reads and browser launches go through normal permission prompts.
- The folder name should match the frontmatter `name`. Known exceptions, kept from upstream: `scrapling/` is `scrapling-official`, `taste-skill/` is `taste`.
- Files copied with `cp` skip the frontmatter hook. Check them directly:
  `printf '{"tool_input":{"file_path":"%s"}}' "$PWD/.claude/skills/<name>/SKILL.md" | python3 .claude/hooks/check-skill-frontmatter.py`

## Environment

- Node 24 comes from nvm. Shell state does not persist between Bash calls, so prefix Node commands with `. "$HOME/.nvm/nvm.sh" &&`; otherwise the preinstalled Node 22 runs.
- `pytest` and `ruff` are not installed. Use `python3 -m unittest`.

## Tests

The only bundled suite is `ui-ux-pro-max`:

```bash
cd .claude/skills/ui-ux-pro-max && python3 -m unittest discover -s scripts/tests
```

Baseline: 141 tests, 137 pass, 4 modules fail to import (`test_catalog_refresh`, `test_catalog_summary_line_endings`, `test_relevance_evaluator`, `test_skill_script_paths`) with `StopIteration` from path lookups that assume the upstream repo layout. Treat any other failure as new.

## Git

- Branch from the latest `origin/main` for each change; PRs are squash-merged, so earlier branch commits are already on `main`.
- One change per PR. Merge only when asked.
- Don't commit `__pycache__/` (gitignored) or anything test runs leave behind.
