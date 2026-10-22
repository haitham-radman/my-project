---
name: using-superpowers
description: Use when starting a conversation to find and use the right Superpowers skill - invoke a relevant skill when the request clearly matches it. Local copy, so the user's instructions and this repo's CLAUDE.md take precedence.
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<IMPORTANT>
If a skill clearly matches what the user asked for, invoke it before acting. The user's direct instructions, this repo's CLAUDE.md and each skill's "Local policy" section take precedence over any "must", "no choice" or "not negotiable" wording in a Superpowers skill.
</IMPORTANT>

## The Rule

**Invoke a skill that clearly matches the request before acting.** Clarifying questions may come first. If it turns out wrong for the situation, you don't have to use it.

Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.

## Skill Priority

When multiple skills apply, process skills come first — they set the approach, then implementation skills (frontend-design, etc.) carry it out. Brainstorming and systematic-debugging are Superpowers' most common process skills, but the rule holds for any of them.

- "Let's build X" → superpowers:brainstorming first, then implementation skills.
- "Fix this bug" → superpowers:systematic-debugging first, then domain skills.

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Platform Adaptation

If your harness appears here, read its reference file for special instructions:

- Claude Code: `references/claude-code-tools.md`
- Codex: `references/codex-tools.md`
- Pi: `references/pi-tools.md`
- Antigravity: `references/antigravity-tools.md`
- Hermes Agent: `references/hermes-tools.md`
- Muse: `references/muse-tools.md`

## User Instructions

User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.

## Local policy

This is a modified copy (upstream: obra/superpowers, MIT, `2ce8aa1`). Changed: the `description`, the forced-invocation block and "The Rule" above (upstream forces a skill before any reply and brainstorming before plan mode). Reapply after any refresh.

- Do not follow the other-harness config edits in `references/` (e.g. `~/.codex/config.toml`, `~/.hermes/`, `~/.gemini/`, `~/.agents/skills/`).
- Never run `npx skills add`/`update` or any plugin refresh; it would overwrite these reviewed copies.
