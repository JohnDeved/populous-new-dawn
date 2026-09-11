# Populous New Dawn engineering

This repository recreates Populous: The Beginning for modern desktop browsers.
Preserve playable behavior and existing user work. Do not publish, deploy, record
parity, regenerate evidence, or change credentials unless the user explicitly asks.

## Start here

1. Read `GOAL.md` for current direction and execution order.
2. Record `git rev-parse HEAD` and `git status --short`; never reset, clean, or
   overwrite pre-existing staged, unstaged, or untracked work.
3. If the objective is not fixed, have the parent or `pnd-scout` rank a bounded
   candidate set and recommend one before choosing a subsystem.
4. Run `npm run orchestration:context -- --subsystem <id> --query "<question>"`.
5. Run `npm run orchestration:plan -- --base <actual-base-ref>` before claiming a
   check set. The plan selects checks; it does not execute them.
6. For substantial work, use the compact contract in `engineering/contracts.md`,
   run its allowlisted checks with
   `npm run orchestration:verify -- --contract <path>`, then audit it with
   `npm run orchestration:audit -- --contract <path>`.

Invoke the repository workflow explicitly with `$populous-engineering`. Detailed
architecture, task flow, resource serialization, and evidence rules live in
`engineering/README.md`.

## Governing sources

- Direction and modern compatibility: `GOAL.md` and
  `references/modern-performance.md`.
- Parity ledger: `parity.json`; assessments: `parity-history.json`.
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
Resolve current parity status from `parity.json`; do not duplicate it in another
ledger. Keep shared files such as `app/model.ts` and `app/scene.ts` cross-cutting.
An unknown changed path requires an explicit unmapped result, never an empty plan.

Source files are human-owned. Generated outputs and recording procedures are listed
in `engineering/generated-files.json`. Keep disposable indexes and receipts under
ignored `work/orchestration/`. Leave `.openai/hosting.json` untouched.

## Delegation

Small tasks stay with the parent. Delegate only a bounded, independent question or
a fresh review:

- `pnd-scout`: read-only entry points and bounded next-work triage when needed.
- `pnd-native`: read-only native proof, intercepted leaves, and open boundaries.
- `pnd-reviewer`: final diff and acceptance challenge; no source repair.
- `pnd-performance`: paired workload and measurement review; no source repair.

When no task is fixed, compare no more than five candidates and return the top three
plus one recommendation. Prioritize player-visible/playability impact and unblock
value, then live integration gap, evidence/check confidence, effort, risk, and
prerequisites. Do not rank from parity percentage or document position alone.

The parent owns final priority, scope, integration, acceptance, and any authorized ledger update.
Use one source writer. Subagents share the checkout unless separate worktrees are
demonstrated; recursive delegation is out of scope. Artifact-producing review must
write only to an agreed ignored path and is not a read-only security boundary.

Serialize Ghidra access to one project, fixture recording, parity recording, shared
build directories, fixed-port browser servers, fixed capture paths, and performance
measurements. Stop bounded repair/review loops and report unresolved failures.

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
checks remain manual; the verifier never grants recording authority.

Performance work starts with a bounded context packet and reads its applicable
sections from `references/modern-performance.md`; expand only for relevant
corrections or an explicitly broad audit. Preserve simulation clock/RNG ownership,
use paired comparable workloads, separate headed/headless from renderer identity,
and state limitations and noise.

Do not change parity scope/status for infrastructure or research alone. Later parity
recording requires appropriate evidence, fresh review, authorized ledger edits,
`npm run parity:record -- "..."`, and the normal checks, committed together only
when committing is authorized.
