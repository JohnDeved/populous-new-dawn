# Populous New Dawn engineering

This repository recreates Populous: The Beginning for modern desktop browsers.
Preserve playable behavior and existing user work. Do not publish, deploy, record
parity, mass-regenerate evidence, or change credentials unless the user explicitly asks.
Scoped native exports, probes, and durable research handoffs follow
`engineering/native-research.md` as part of authorized engineering work.

## Start here

1. The parent reads `GOAL.md` for current direction and execution order. Delegated
   specialists start from their supplied brief or role packet and expand relevant sources.
2. Record `git rev-parse HEAD` and `git status --short`; never reset, clean, or
   overwrite pre-existing staged, unstaged, or untracked work.
3. Continue a valid feature lock from `GOAL.md`. If no objective is fixed, have the
   parent or `pnd-scout` rank a bounded candidate set once and recommend one before
   choosing a subsystem. Behavior-neutral changes do not reopen selection.
4. After choosing the feature, run
   `npm run orchestration:context -- --subsystem <id> --query "<question>"`.
5. Run `npm run orchestration:plan -- --base <actual-base-ref>` before claiming a
   check set. The plan selects checks; it does not execute them.
6. For substantial work, use `orchestration:prepare` to capture mechanical fields
   from the compact task spec in `engineering/contracts.md`,
   run its allowlisted checks with
   `npm run orchestration:verify -- --contract <path>`, then audit it with
   `npm run orchestration:audit -- --contract <path>`.

Invoke the repository workflow explicitly with `$populous-engineering`. Detailed
architecture, task flow, resource serialization, and evidence rules live in
`engineering/README.md`.

## Governing sources

- Direction and modern compatibility: `GOAL.md` and
  `references/modern-performance.md`.
- Gameplay and game-mechanics parity percentage/progress ledger: `parity.json`;
  assessments: `parity-history.json`.
- `PARITY.md` is generated only by `scripts/parity.mjs`; never hand-edit it.
- Native evidence: `references/reverse-engineering.md`, `decomp/README.md`,
  `decomp/exports.json`, reviewed exports, and native comparison scripts.
- Workflow mappings and checks: `engineering/project-map.json`,
  `engineering/checks.json`, and `engineering/generated-files.json`.

Policy, historical interpretation, executable evidence, and current implementation
status are distinct. Community symbols are hypotheses. Ghidra pseudocode is not
recovered source. A helper comparison does not prove live-game integration, and a
browser consistency check does not prove native equivalence.

## Scope and ownership

Trace the player/system entry point, changed code, and relevant integration check.
Resolve current parity percentage and status from `parity.json`; do not duplicate
that progress measure in another ledger. Keep shared files such as `app/model.ts`
and `app/scene.ts` cross-cutting.
An unknown changed path requires an explicit unmapped result, never an empty plan.

A new feature is complete only when absent behavior is reachable through the shipped
UI, campaign, or normal system path; test-created entities and isolated helpers are
supporting evidence, not delivery. Do not substitute cleanup for a selected feature.
Permit at most one behavior-neutral prerequisite refactor commit for a named blocker,
then return immediately to the feature. Old model/scene extraction plans are not a
standing backlog.

Source files are human-owned. Generated outputs and recording procedures are listed
in `engineering/generated-files.json`. Keep disposable indexes and receipts under
ignored `work/orchestration/`. Leave `.openai/hosting.json` untouched.

## Delegation

Small tasks stay with the parent. Delegate only a bounded, independent question or
a fresh review:

- `pnd-scout`: read-only entry points and bounded next-work triage when needed.
- `pnd-native`: native proof and reusable findings; scratch artifacts only when assigned.
- `pnd-reviewer`: final diff and acceptance challenge; no source repair.
- `pnd-performance`: paired workload and measurement review; no source repair.

Apply `engineering/efficiency-review.md` automatically at resumption and progress
boundaries, including during unfinished slices. Detect stalled gameplay delivery,
diagnose it directly or with read-only `pnd-scout`, apply the smallest supported local
correction, and resume gameplay without waiting for user prompting. Keep required
verification and final code review.
The parent also owns autonomous priority and workflow decisions under `GOAL.md`;
revise ineffective procedural defaults and work around blocked paths without making
routine human steering a dependency.
Use `npm run orchestration:progress -- status` at those boundaries and every 10 minutes
of active work. Start, annotate, and finish feature timers as described in the guide;
act on elapsed-time warnings and retain approaches that deliver verified progress faster.

When no task is fixed, compare no more than five candidates and return the top three
plus one recommendation. Prioritize player-visible/playability impact and unblock
value, then live integration gap, evidence/check confidence, effort, risk, and
prerequisites. Use the parity percentage to measure delivered progress, but do not
rank candidates from checkpoint weight or document position alone. When the user
prefers new features, exclude candidates that only refine already-live behavior.
Priority triage is advisory and needs no task contract, receipt, or generated role
packet; assign a compact question directly and reuse the result until gameplay or
evidence changes a candidate.

The parent owns final priority, scope, integration, acceptance, and any authorized ledger update.
Use one source writer. Keep that feature owner through implementation, focused checker
repair, evidence publication, branch/PR update, and final handoff when practical;
transfer ownership only for an explicit scope/resource conflict or reassignment.
Subagents share the checkout unless separate worktrees are demonstrated; recursive
delegation is out of scope. Artifact-producing review must write only to an agreed
ignored path and is not a read-only security boundary. Before final review, export the
bounded evidence needed by the reviewer using `engineering/worker-handoff.md` so the
review does not depend on opening the worker-owned ignored directory.

Start native, performance, and reviewer specialists with `fork_turns: "none"`, one
bounded assignment, and a role packet generated from the implementation contract.
Supply the packet once; begin with its exact omitted paths/headings and follow relevant
callers, dependencies, or contradictory evidence as needed. Do not send whole task
history, `GOAL.md`, `decomp/README.md`, or the performance log. A reviewer must inspect
the packet's actual change manifest and full-diff command. Dispatch a fresh final
reviewer once for substantive gameplay, parity, performance, or high-risk architecture
changes, with the final diff, acceptance criteria, and completed receipts together.
Repeat review only for substantive repairs or unresolved findings.
Use each packet's compact response format. Scouts return ranked path/line findings;
native and performance specialists return evidence, limits, live gap/workload, and
stop status; reviewers return finding lines, receipt status, and ACCEPT/REJECT.
Do not request narrative or copied logs when the structured result is sufficient.
Before native research, verify live prerequisites and reuse existing topic notes.
For artifact-producing native assignments, use `--research-output` with a contract-
allowed ignored task directory. The parent reviews and commits useful exports, probes,
and indexed findings before closing or deferring the work; follow `engineering/native-research.md`.
If optional context is needed, refine the packet query for a disclosed candidate
path instead of loading a whole source.

Serialize Ghidra access to one project, fixture recording, parity recording, shared
build directories, fixed-port browser servers, fixed capture paths, and performance
measurements. Stop bounded repair/review loops and report unresolved failures.

A denied tool operation blocks only that operation. Preserve its reason/fingerprint,
do not retry it unchanged or route around the safeguard, and continue independent
allowed work. Report `BLOCKED` only when no meaningful scoped work remains and no
useful review-ready partial result exists; otherwise use `IN_PROGRESS` or
`NEEDS_REVIEW`. Follow `engineering/worker-handoff.md` for portable review bundles
and deterministic Local Dev project-release verification before the final reply.

## Verification and evidence

Inspect a command before running it. Never add `--record` generically. Report each
attempted or required check as `passed`, `failed`, `blocked`, `not-run`, or
`not-applicable`, with command, exit code when run, tested-code fingerprint,
artifacts, and reason for non-passing status.

`npm run check` and `npm run build` are standard gates, not substitutes for native,
browser, or performance evidence. Native checks may require the documented Python
environment, a hash-verified user-supplied executable, and adjacent game data.
Browser checks require their actual server/channel setup. Do not weaken expected
pixels or invent performance results.

`orchestration:verify` executes only contract-required checks explicitly marked
safe in `engineering/checks.json`. Unclassified, recording, or tracked-output
checks remain manual; the verifier never grants recording authority. Each result
is saved as it completes. Preparation can replace the two reviewed orchestration
checks with their coverage inside `repository-check`; the actual aggregate command
and all covered inputs remain in the receipt. Browser/native/performance checks
remain separate. Use focused tests during editing and one sufficient final check set.

Performance work starts with a bounded context packet and reads its applicable
sections from `references/modern-performance.md`; expand only for relevant
corrections or an explicitly broad audit. Preserve simulation clock/RNG ownership,
use paired comparable workloads, separate headed/headless from renderer identity,
and state limitations and noise.

Do not change parity scope/status for infrastructure or research alone. Later parity
recording requires appropriate evidence, fresh review, authorized ledger edits,
`npm run parity:record -- "..."`, and the normal checks, committed together only
when committing is authorized.
