---
name: add-skill
description: Import a third-party skill into .claude/skills, validate its frontmatter, review its scripts for risky behavior, smoke-test it, and open a PR. Use when the user pastes a SKILL.md, gives a repo URL or path to a skill, or asks to add a skill to this repo.
disable-model-invocation: true
argument-hint: "<pasted SKILL.md | git URL | repo path to a skill folder>"
---

# Add a skill to this repo

Source: $ARGUMENTS

This repo is a library of Claude Code skills in `.claude/skills/<name>/`. Third-party skills are kept as published so they can be updated from upstream later.

## 1. Start from the latest `main`

```bash
git fetch origin main
git checkout -B <working-branch> origin/main
```

If the working branch on the remote only holds commits already squash-merged into `main`, a later push needs `--force-with-lease=<branch>:<old-sha>`. Say so before pushing.

## 2. Get the skill

- **Pasted SKILL.md**: write it unchanged to `.claude/skills/<name>/SKILL.md`, where `<name>` is the frontmatter `name`.
- **Git URL**: clone into the scratchpad, not the repo. For a large repo use `git clone --depth 1 --filter=blob:none --sparse <url>` and `git sparse-checkout set <path>`. Copy only the skill folder (SKILL.md plus its `scripts/`, `references/`, `assets/`).
- **Plugin**: a plugin's skills live under `plugins/<plugin>/skills/<skill>/`. Copy each skill folder you were asked for.

Rules:
- Do not edit upstream content. If something must change for this repo, say what and ask first.
- The folder name should match `name`. If upstream uses a different `name`, keep it and mention the mismatch.
- If a skill with that `name` already exists, stop and ask whether to replace it.

## 3. Validate the frontmatter

The PostToolUse hook checks SKILL.md on every Write or Edit. Files copied with `cp` bypass it, so run the check directly:

```bash
printf '{"tool_input":{"file_path":"%s"}}' "$PWD/.claude/skills/<name>/SKILL.md" \
  | python3 .claude/hooks/check-skill-frontmatter.py
```

Exit 0 means valid. Exit 2 lists the problems.

## 4. Review what it runs

```bash
.claude/skills/add-skill/scripts/scan.sh .claude/skills/<name>
```

The scan lists bundled files by type and greps for downloads, package installs, shell execution, network calls, uploads, and references to credentials. A hit is not a verdict. Read each one and report:

- What the skill executes, and whether that code is bundled or fetched at run time (e.g. `npx`, `pip install`, `curl | bash`).
- Every place it sends data off the machine, and what data.
- Any secrets or API keys it reads or asks for.

If anything sends user data to a third party or runs code fetched at run time, state it plainly in the summary and the PR body.

For a skill with bundled scripts, delegate this step to the `skill-security-reviewer` subagent with the skill folder path, and use its report (verdict, findings, PR notes). If its verdict is "Do not import", stop and ask the user before committing.

## 5. Smoke-test

Run the cheapest real invocation the skill documents, with a tiny input in the scratchpad (e.g. a 3-line CSV). Node comes from nvm: run `. "$HOME/.nvm/nvm.sh"` first. If the skill bundles tests, run them with whatever is installed (`python3 -m unittest discover` if `pytest` is missing) and report pass/fail counts. Skip this step only if the skill has nothing runnable, and say so.

Delete anything the test left behind in the repo (`__pycache__/` is already gitignored).

## 6. Commit, PR, merge

- Commit only the new skill folder: `Add <name> skill (<upstream author or source>)`.
- Push the working branch.
- Open a PR against `main` with:
  - **Summary**: what the skill does, where it came from, licence.
  - **Review notes**: findings from step 4.
  - **Test plan**: the frontmatter check, the smoke test, bundled test results.
- Merge only if the user asked. This repo squash-merges.

## 7. Report

Tell the user the skill name and path, the PR link and whether it merged, anything risky from step 4, and that the skill loads in new sessions (and in the current one once its folder exists).
