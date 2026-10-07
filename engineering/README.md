# Engineering protocol

GitHub issues, labels, and linked draft PRs are the project-management surface.
Local tools support implementation and evidence; they do not own a parallel board.
`GOAL.md` retains product direction and `parity.json` retains verified gameplay
coverage. Historical research and acceptance records remain evidence, not live queues.

## Issue to reviewed PR

1. **Choose an outcome.** Continue the assigned issue or valid feature lock. Otherwise
   inspect current GitHub release gates and recommend bounded, high-impact work.
   Prefer playable impact and unblock value, then evidence, effort, and risk. An issue
   names the live entry point, acceptance, owner, and concrete dependencies.
2. **Isolate the writer.** Record the base/head and dirty status. Use one writer per
   branch/worktree, with up to six workers coordinated by the parent. Commit coherent
   checkpoints as Johann Berger <johann@objekt.stream>. Never overwrite another
   worker's work or push directly to main. Parent integration may use an explicitly
   supplied reviewed base; disclose dependencies in the PR.
3. **Research locally.** Reuse indexed findings before opening Ghidra or writing a
   probe. Follow [native research](native-research.md), including original EXE hash,
   tool provenance, adjacent data, exact routines, and supplied/intercepted leaves.
4. **Implement the live path.** A feature must be reachable through shipped controls,
   campaign flow, or its normal system caller. Isolated helpers, test injection, and
   plumbing alone do not complete it. Keep changes readable and proportional.
5. **Verify the candidate.** Plan from the actual base, inspect commands, and run
   relevant portable, native, local rendered browser, and performance checks. Retain
   exact source/input-bound receipts; changed inputs invalidate them. Use the shared
   [execution model](performance-queue.md) for competing expensive workloads:
   isolated foreground receipts in fresh cloud tool scopes; the detached queue
   only when controller, jobs and recovery share a stable execution scope.
6. **Open/update a draft PR.** Link the issue; include outcome, scope, base/head,
   acceptance, check statuses, evidence, and remaining limits. For partial or dependent
   PRs, use `Refs #N`; use `Closes #N` only when the complete issue acceptance is met.
   For visual changes, include before/after images in the PR and relevant issue
   whenever possible (or link the same retained pair from both). Use comparable
   scenarios/viewports and caption each with its exact commit SHA, what it shows,
   and renderer/capture limitations. Distinguish original-game references; never
   fabricate a before image. If a pair is unavailable, state why. Docs/tooling-only
   changes need no images. Workers own repairs and evidence publication through review.
7. **Review and integrate.** A fresh internal reviewer inspects the actual full diff
   and evidence, returning findings plus ACCEPT/REJECT. The parent reviews the PR,
   resolves findings, validates the combined tree, and performs authorized main
   merges. A changed head requires review of substantive repairs and affected checks.
   Stop or clean only processes owned by this task; retain useful evidence.

Use existing labels: `release-gate`, `overdue`, `unblocks`, `priority:critical`, and
one applicable `status:in-progress`, `status:needs-review`, or `status:blocked`.
Record the worker owner honestly in an issue/PR note; do not impersonate a GitHub
assignee. Update status at meaningful changes and remove stale labels. A blocker
names its dependency, owner, next action, and acceptance; a closed prerequisite does
not automatically complete its dependent gate. Reuse existing issues, labels, and
repository access. No new Projects credentials, paid tools, or GitHub Actions.

For narrow read-only research or a small docs fix, a compact issue/PR brief is enough.
Do not create another contract just to delegate. An optional contract helps when scope,
generated ownership, or multi-step verification needs mechanical checks.

## Useful local commands

```sh
npm run orchestration:context -- --subsystem selection --query "native drag selection"
npm run orchestration:plan -- --base <actual-base>
npm run orchestration:check
npm run orchestration:receipt -- --output work/orchestration/task/check.json -- npm run check
npm run orchestration:receipt -- --output work/orchestration/task/build.json -- npm run build
```

- `context` retrieves bounded mapped evidence, current parity scope, source hashes,
  and omitted paths/headings. It rebuilds a stale ignored index. Follow relevant
  omitted sources; a packet is not an exhaustive proof inventory.
- `plan` routes branch/staged/unstaged/deleted/renamed/untracked changes to reviewed
  checks. Unknown paths stay explicit. It does not execute checks.
- `check` validates manifests, paths, ownership, and parity references; it does not
  certify evidence semantics or provide a sandbox.
- `receipt` records a real command, source HEAD, exit status, raw stdout/stderr and
  their hashes, plus tracked-diff and explicit `--input` hashes before/after the run.
  Use a fresh output path for every attempt. Prelaunch state is `unknown`; interrupted
  runs retain their raw logs without inventing a terminal result. Accept `status:
  passed`, not merely exit zero, because source drift invalidates evidence. Prefer
  a committed candidate. Never substitute a summary for the underlying evidence.
- `review-bundle` exports a committed full diff and bounded redacted receipts for a
  reviewer in another worktree/executor. [Handoff](worker-handoff.md) describes trusted
  caller-supplied identity verification and deletion coverage.
- Optional `prepare`, `verify`, `audit`, and specialist role packets are documented in
  [contracts](contracts.md). They check scope/fingerprints and execute allowlisted
  checks; they never grant recording authority. Their use is not an acceptance claim.

There is no mandatory Local Dev binding, source-release handshake, delivery-clock
ledger, separate reviewer chat, or browser-driven worker watcher. Use the executor's
normal task controls and report useful results directly to the parent.

## Sources and evidence boundaries

`app/scene.ts` is the browser composition root; `app/model.ts` owns simulation state
and fixed turns. Both are cross-cutting. `engineering/project-map.json` is a reviewed
routing aid, not an exhaustive implementation inventory. Trace actual callers.

`GOAL.md` and `references/modern-performance.md` govern modern timing/display goals.
`references/reverse-engineering.md`, `decomp/README.md`, `decomp/exports.json`, topic
notes, and executable probes establish native evidence and its limits. Community
symbols are hypotheses. Ghidra pseudocode is not recovered source. Supplied consumers
and intercepted leaves cannot prove full native composition or live integration.

`engineering/generated-files.json` records asset, fixture, export, parity, and
performance ownership. Never mass-regenerate evidence, hand-edit `PARITY.md`, shrink
parity scope, or use `parity:record` to conceal a failure. Later authorized parity
updates require appropriate proof and review, committed with generated history.
Leave `.openai/hosting.json` untouched.

## Verification

Standard code-change gates are `npm run check` and `npm run build`, plus affected
native/browser/performance checks. Maintained TypeScript also follows
[README's quality workflow](../README.md#typescript-quality-workflow). Focused checks
are useful during editing; run one sufficient final set on the reviewed candidate.
For policy/metadata-only work, state why focused structural/regression checks suffice.

Inspect a check before running it: some historical probes/importers write tracked
outputs even without `--record`. Confirm external prerequisites before costly checks.
Keep each attempted or required result as `passed`, `failed`, `blocked`, `not-run`, or
`not-applicable`, with command, exit code, fingerprints, artifacts, and limits.
Missing required evidence prevents the corresponding acceptance claim.

Browser QA uses a local server and actual rendered pixels, including relevant
interruptions/repetition, resizing, and checkpoint flows. Node-only logic does not
establish visual correctness. The shared Linux environment verified on 2026-10-03
supports sandboxed Chrome
Headless Shell 154 via remote-debugging-pipe; this is an environment example, not
a portable version requirement. Do not add `--no-sandbox` or
`--enable-unsafe-swiftshader`; use the reviewed local harness available in the checkout
and retain browser/renderer identity. Do not import unreviewed harness changes merely
to satisfy a workflow instruction. Report software/headless limitations honestly.

Performance evidence separates microbenchmarks, simulation visits, browser frames,
and play sessions. Predeclare a paired comparable workload; preserve simulation
clock/RNG ownership. Record source/input fingerprints, seed/workload, runtime,
hardware/OS, browser mode and actual renderer, viewport/DPR, warmup, samples, order,
noise, p95/spikes, allocations, and raw artifacts as relevant. Headless/software
rendering cannot certify hardware frame performance. Never invent speedups or FPS.

Serialize shared Ghidra projects, full-check/build resources, fixed ports/capture
paths, fixture/parity recording, and measurements. A worktree isolates edits, not CPU,
GPU, shared files, or services. Keep process ownership and cleanup explicit.

## Approved delivery experiment

The bounded [five-product-PR trial](delivery-trial.md) adds a cheap preflight and
compact transition evidence to existing PRs/receipts. It does not replace final
gates or GitHub ownership, and speed targets remain unproven until measured.
