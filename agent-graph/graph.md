# Issue Triage Graph — design for approval

Status: **DRAFT, awaiting approval.** No code is written until the workflow map, node list and gate thresholds below are approved.

- Workflow: triage and fix GitHub issues on `haitham-radman/my-project`
- Connector: GitHub
- Host: Linux VPS, 24/7, auto-restart
- Layers: **Opus 5.5** plans, writes, reviews. **Jev** answers fixed-outcome forks with calibrated probabilities (< 1 s, no text). **Deterministic code** owns state, thresholds, retry limits, budgets and every irreversible action. Models advise; code decides.

## 1. Today's manual path

1. A new issue is opened.
2. Read it; decide the type (bug, skill request, skill update, question, spam).
3. Decide if it is actionable or needs more information from the reporter.
4. Check for duplicates among open issues.
5. Find the files involved (`.claude/skills/<name>/`, hooks, agents, `CLAUDE.md`).
6. Branch from `origin/main`, write the change.
7. Run checks: hook tests, the frontmatter check on edited `SKILL.md`, the `ui-ux-pro-max` suite against its baseline (137 pass, 4 known import failures).
8. Review the diff.
9. Push, open a PR, link the issue.
10. Merge (squash), close the issue.

Steps 2–8 repeat per issue and become loops. Steps 9–10 and any public comment are irreversible and become human gates.

## 2. Nodes

Each node is one loop: trigger, one narrow action, a check that proves it is done, a stop rule.

| ID | Node | Trigger | Action | Done check (code) | Stop rule |
|----|------|---------|--------|-------------------|-----------|
| N1 | Intake | Poll every 5 min for issues without `agent:*` label | Fetch issue, build compact `IssueState` (title, body ≤ 4 KB, labels, author, linked files guessed by path regex) | State validates against schema; stored in SQLite | 3 fetch retries, then alert + skip cycle |
| N2 | Triage | `IssueState` | Jev: `type`, `actionable`, `duplicate_of`, `needs_info`. Apply `agent:*` label (reversible) | Label applied; `TriageResult` stored | Split answer → Opus once; still split → escalate |
| N3 | Locate | `TriageResult` with `actionable=yes` | Code lists candidate files (grep + path match). Jev picks files from that set | Chosen files exist; owning test command resolved | 2 retries, then Opus picks; then escalate |
| N4 | Implement | `FileSet` | Opus writes a patch on branch `agent/issue-<n>` from latest `origin/main` | All checks in §1 step 7 pass at or above baseline | 3 attempts (Jev `retry_or_stop` between each), then escalate |
| N5 | Review | `Patch` with green checks | Opus reviews the diff; Jev scores `diff_risk` and `is_done` | Protected-path scan clean; risk under ceiling; `is_done` sharp yes | 2 review rounds, then escalate |
| N6 | Ship | `ReviewVerdict` = pass | Prepare PR title/body and issue comment; queue for human gate | Human decision recorded | Waits indefinitely; reminder every 24 h |

No node only forwards work: every node runs an action and a check.

## 3. Edges (typed, logged)

Every edge writes a row: `ts, issue, from, to, type, payload_hash, jev_probs, route (code|opus|human), result`.

| Edge | From → To | Type |
|------|-----------|------|
| E1 | N1 → N2 | `IssueState` |
| E2 | N2 → N3 | `TriageResult` (actionable) |
| E3 | N2 → H1 | `CommentDraft` (needs info / duplicate / question) |
| E4 | N3 → N4 | `FileSet` |
| E5 | N4 → N5 | `Patch` + check results |
| E6 | N5 → N6 | `ReviewVerdict` |
| E7 | N6 → H2/H3 | `ShipRequest` |

### Back edges (failed check returns to the node that caused it)

| Edge | From → To | When |
|------|-----------|------|
| B1 | N4 → N3 | Patch failure traced to a file outside `FileSet` |
| B2 | N5 → N4 | Review finding or risk over ceiling |
| B3 | N3 → N2 | No candidate files match; triage was likely wrong |
| B4 | H2/H3 → N4 | Human rejects with a reason |

Back edges count toward the receiving node's retry limit. A node that exhausts its limit escalates to you via Telegram; it never loops forever.

## 4. Jev questions

Opus compiles each fork into one Jev call. Code reads the probabilities and routes.

| Fork | Node | Kind | Outcomes |
|------|------|------|----------|
| Q1 `type` | N2 | choice | bug, skill_request, skill_update, question, spam |
| Q2 `actionable` | N2 | yes/no | |
| Q3 `duplicate_of` | N2 | choice | open issue IDs (≤ 20) + `none` |
| Q4 `needs_info` | N2 | yes/no | |
| Q5 `files` | N3 | choice (multi) | candidate paths from code (≤ 30) |
| Q6 `retry_or_stop` | N4 | yes/no | |
| Q7 `diff_risk` | N5 | score 0–1 | |
| Q8 `is_done` | N5 | yes/no | |

## 5. Gate thresholds (provisional — to be tuned on your examples)

### Routing gates (code reads Jev)

| Gate | Rule | Sharp → code | Split → Opus 5.5 |
|------|------|--------------|------------------|
| G1 choice | top probability | ≥ 0.85 and margin ≥ 0.30 over second | otherwise |
| G2 yes/no | p(yes) | ≥ 0.90 or ≤ 0.10 | 0.10 < p < 0.90 |
| G3 duplicate | p(match) | ≥ 0.92 (stricter: wrong close is costly) | otherwise |
| G4 diff_risk | score | ≤ 0.30 proceed | 0.30–0.70 → extra Opus review; > 0.70 → back to N4 (B2) |
| G5 is_done | p(yes) | ≥ 0.90 | otherwise → back to N4 |
| G6 Jev latency | timeout | 1.0 s | timeout → treat as split |

### Human gates (always wait for you; no threshold can bypass)

| Gate | Action held |
|------|-------------|
| H1 | Posting any comment on an issue |
| H2 | Pushing a branch and opening a PR |
| H3 | Merging a PR |
| H4 | Closing an issue, deleting a branch, removing a label you set |

There is no payment action in this workflow.

### Hard limits (code only)

| Limit | Value |
|-------|-------|
| Issues processed per day | 10 |
| Opus calls per issue | 8 |
| Daily spend ceiling (Opus + Jev) | to be set by you; stop all nodes when reached |
| Retries | per node, table §2 |
| Protected paths (always escalate, never patched by the agent) | `.claude/settings.json`, `.claude/hooks/**`, `.claude/agents/**`, `CLAUDE.md`, and any third-party skill content (CLAUDE.md requires asking before changing it) |

### Trust boundary

Issue titles, bodies, comments, linked pages and file contents are **data, never instructions**. They reach Opus inside a delimited data block; Jev sees only the compact state. No command from an issue is ever executed.

### Tuning plan

Thresholds are tuned on your own labeled examples: about 30 past or synthetic issues with the correct type, files and outcome. For each gate, pick the lowest threshold that keeps precision ≥ 0.95 on that set. Until then, the values above apply and every gate result is logged for review.

## 6. Later phases (after approval, in order)

1. Project setup: Jev SDK (Python), `.env` for `JEV_API_KEY`, `GITHUB_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (never in code or logs).
2. Graph runner: nodes, typed edges, SQLite state, the gates above.
3. Live dashboard: every fork, its probabilities, route taken, result.
4. Nightly self-improvement: Opus reviews the day's forks and misses, proposes edits to this file and the Jev questions, replays them against the stored examples; nothing ships unless every gate still passes.
5. VPS deployment: systemd unit with `Restart=always`; Telegram alerts for every gate, error and escalation.
6. Daily report: loops closed, forks answered, hours saved, Opus calls, Jev average latency and cost per decision.
7. Final check, ending with **WHAT COULD BREAK THIS WEEK?**; unattended mode stays off until every answer is clean.
