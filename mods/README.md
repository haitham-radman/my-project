# Claude Code mods

Three mods for Claude Code, built from the "Mods" demo in an @aipro.arabi TikTok (on-screen text only; the audio was not transcribed). Each folder is a complete mod.

| Mod | What it does |
| --- | --- |
| `token-weather` | Band above the prompt showing how full the context window is; `/token-weather` prints the same reading as text. |
| `blast-radius` | Denies a destructive Bash command (recursive `rm`, `git clean`, `git reset --hard`, `find` with the delete flag, ...) the first time, so Claude lists what it would remove and asks you; the same command is allowed when run again. |
| `replay-theater` | Records every file edit of the last turn and shows a running count in the status line; `/replay` lists them in order. |

These are original implementations of the three ideas, not the demo's code.

## Check

```bash
claude plugin validate mods/<mod>
claude plugin test mods/blast-radius   # the only mod with a test
```

Validation passes with "gating hook without .catch" warnings for `blast-radius` and `replay-theater`.

Known limit: `blast-radius` matches the command text, so a destructive pattern quoted inside a heredoc or string also triggers it (it did while this PR was prepared). The repeat-to-confirm step covers that.

## Use

Run with `claude --plugin-dir mods/<mod>`. Nothing is installed or enabled by default. The engine regenerates each mod's `.claude-plugin/types/` and `tsconfig.json` on load; they are not committed.
