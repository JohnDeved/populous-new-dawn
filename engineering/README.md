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
   branch/worktree. The current usage budget is four active workers across the whole
   delegation tree, including nested workers and reviewers, plus the coordinating
   parent (five active agents total), not a platform ceiling. Commit coherent
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
   Complete the [PR template](../.github/pull_request_template.md), including
   [visual evidence](#visual-evidence-before-review), before marking ready for review.
   Workers own repairs and evidence publication through review.
7. **Review and integrate.** A fresh internal reviewer inspects the actual full diff
   and evidence, returning findings plus ACCEPT/REJECT. The parent reviews the PR,
   resolves findings, validates the combined tree, and performs authorized main
   merges. A changed head requires review of substantive repairs and affected checks.
   Stop or clean only processes owned by this task; retain useful evidence.

Before expensive preparation or validation, apply the [resource budget](resource-budget.md):
one heavy execution owner, measured disk/tmpfs/memory admission, preserve-before-cleanup,
and source-bound outcomes. Recover capacity before retrying; a blocked launch is not
a failed build or permission to weaken acceptance.

Use existing labels: `release-gate`, `overdue`, `unblocks`, `priority:critical`, and
one applicable `status:in-progress`, `status:needs-review`, or `status:blocked`.
Record the worker owner honestly in an issue/PR note; do not impersonate a GitHub
assignee. Update status at meaningful changes and remove stale labels. A blocker
names its dependency, owner, next action, and acceptance; a closed prerequisite does
not automatically complete its dependent gate. Reuse existing issues, labels, and
repository access. No new Projects credentials, paid tools, or additional GitHub Actions without
separate authorization. The approved ready-PR workflow is described in
[continuous integration](continuous-integration.md).

For narrow read-only research or a small docs fix, a compact issue/PR brief is enough.
Do not create another contract just to delegate. An optional contract helps when scope,
generated ownership, or multi-step verification needs mechanical checks.

## Bound source-only workspace recovery

Use the [cloud workspace bootstrap](cloud-bootstrap.md) for an explicit owned-storage
binding and a read-only plan; source-only apply creates a sparse local source
workspace without installing dependencies or materializing shared game assets.
Runtime mode remains plan-only. The implementation has scoped source-only review,
not acceptance of current-main integration, historical native recovery, runtime
execution, startup adoption, permanent storage survival or RAM savings. Continue
using [native setup](native-setup.md) separately when native prerequisites are needed.

## Visual evidence before review

- Any UI or game visual change requires actual rendered screenshots attached or
  embedded in the PR body or a PR comment before marking it ready for review.
  Keep the PR draft if capture or publication is blocked, and state the blocker.
- Include comparable before/after views when useful; label both commits and explain
  an unavailable before view. Never fabricate one. For animation changes, also
  include a short ordered screenshot sequence or recording showing the changed motion.
- Caption captures with the exact tested commit SHA, scene/scenario, viewport,
  renderer, and what they demonstrate. Disclose supplied fixtures, seeded/injected
  state, crops, and other capture limitations. Distinguish original-game references.
  Refresh affected captures after visual changes; old-head images are not new-head proof.
- Inspect actual pixels before publication. Generated mockups are not validation
  evidence, and screenshots do not replace native, behavioral, or performance checks.
  Use the existing [media attachment workflow](local-render-harness.md#put-visual-evidence-directly-in-github-reviews);
  link relevant issues to the PR evidence rather than duplicating uploads.
- Keep raw screenshots, recordings, and logs out of main when they exist only as
  review evidence; retain them in ignored `work/` or outside the checkout and publish
  on the PR. Preserve intentional fixtures under [artifact retention](artifact-retention.md).
- Nonvisual PRs may mark visual evidence `not-applicable` with a brief reason.
  This is a reviewer readiness requirement, not automated CI screenshot detection
  or permission to bypass existing capture, publication, or verification safeguards.

## Useful local commands

```sh
pnpm run orchestration:context --subsystem selection --query "native drag selection"
pnpm run orchestration:plan --base <actual-base>
pnpm run orchestration:check
pnpm run orchestration:receipt --output work/orchestration/task/check.json -- pnpm run check
pnpm run orchestration:receipt --output work/orchestration/task/build.json -- pnpm run build
```

- `context` retrieves bounded mapped evidence, current parity scope, source hashes,
  and omitted paths/headings. It rebuilds a stale ignored index. Follow relevant
  omitted sources; a packet is not an exhaustive proof inventory.
- Optional `research-view`, `research-read`, and `research-claims` commands add
  hash-linked raw retrieval and finite proof bindings; see [research evidence](research-evidence.md).
  They retain evidence limits and never replace full review or award parity.
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
- Keep generated command logs, receipts, captures, timing samples, and review bundles
  in ignored `work/` or outside the checkout. Publish needed review artifacts on the
  issue/PR, not in development commits. Preserve consumed fixtures, native proof,
  reusable probes, and concise findings; see [artifact retention](artifact-retention.md).
- `review-bundle` exports a committed full diff and bounded redacted receipts for a
  reviewer in another worktree/executor. [Handoff](worker-handoff.md) describes trusted
  caller-supplied identity verification and deletion coverage.
- Optional `prepare`, `verify`, `audit`, and specialist role packets are documented in
  [contracts](contracts.md). They check scope/fingerprints and execute allowlisted
  checks; they never grant recording authority. Their use is not an acceptance claim.
  Production verification retains raw-only command capture; decoded diagnostics are
  optional allowance-bounded derivatives, not automatic duplicate files. See
  [command diagnostics](contracts.md#on-demand-command-diagnostics) for safe materialization.

There is no mandatory Local Dev binding, source-release handshake, delivery-clock
ledger, separate reviewer chat, or browser-driven worker watcher. Use the executor's
normal task controls and report useful results directly to the parent.

## Fast feedback and full verification

Use `pnpm run test:focus tests/example.test.mjs` while editing. It accepts exact,
unique existing top-level test paths only, runs them with Node file isolation and
concurrency one, and rejects empty lists, unknown paths and extra Node flags.
`orchestration:plan` now adds an advisory `feedback` command from the existing
reviewed mappings and directly changed tests. Broad/shared, deleted, unmapped and
unresolved cases suggest the full suite. These suggestions are deliberately
partial; they do not establish dependency completeness or reuse a previous pass.

For explicitly bounded scene-fixture startup, see
[optional precompilation](scene-fixture-precompilation.md). It separates the exact
TypeScript emitter from a later direct fixture process; it is off by default.
Standard test plans/execution and shard certification reject either cache setting
by presence (including empty values), rather than certify an unbound external cache.

`pnpm test` discovers the same top-level `tests/*.test.mjs` set as before. It runs
content-reviewed, in-memory/read-only files with at most two isolated Node workers,
then every other file serially. `engineering/test-resources.json` binds each
parallel file, all other regular files under `tests/`, the whole `app/` tree,
package/installed-lock/TypeScript configuration, and Node version/platform/architecture
to a reviewed resource inventory. New/changed/unclassified tests run serially;
shared-helper, production/config/runtime drift makes the whole suite serial until
reviewed. The shared boundary includes helper code of any extension, fixtures and
documentation; even data/docs-only changes deliberately require renewed review.
Only discovered top-level test files retain individual classification.
Any nonempty `NODE_OPTIONS`, `NODE_PATH`, `NODE_COMPILE_CACHE`, or
`NODE_V8_COVERAGE` also forces serial execution;
test-selection/isolation options in `NODE_OPTIONS` are rejected. The inventory never excludes a discovered test. Review
transitive production/runtime resource changes too: this classification is not a
sandbox or a general proof that imported code has no side effects. Installed
dependencies must remain trusted/read-only: lockfile hashes do not attest arbitrary
manually altered package JavaScript; formal comparisons bind actual package bytes. Script consumers,
filesystem mutators, subprocess/socket tests and environment-controlled witnesses
are conservatively serial in the initial inventory. Browser, build and performance
jobs still hold the shared lane separately.

After reviewing a production change for resource side effects, deliberately refresh
`productionSha256` using the exported `productionFingerprint(repo)`; likewise use
`helperFingerprint(repo)` after shared-helper review. Commit the reviewed policy before freezing the final
candidate; do not edit it during verification. Inspect new/changed test
imports and writes before adding/updating that file's SHA-256 in `parallel`.
Do not refresh hashes merely to regain concurrency after an unexplained drift.
For example, this prints candidate shared fingerprints without writing the policy:

```sh
node --input-type=module -e "import {productionFingerprint,helperFingerprint} from './scripts/orchestration/test-runner.mjs'; console.log(JSON.stringify({productionSha256:productionFingerprint(process.cwd()),helpersSha256:helperFingerprint(process.cwd())},null,2))"
```

`PND_TEST_CONCURRENCY=1 pnpm run check` uses the same file groups/order with the
parallel group reduced to one worker. Only values `1` and `2` are accepted.
`pnpm run test:serial` provides the same serial test phase directly.
On an executor with an inherited global module path, the conservative default is
serial. After verifying that this checkout resolves its installed dependencies
without a custom loader/path, use `NODE_PATH= NODE_OPTIONS= NODE_COMPILE_CACHE= NODE_V8_COVERAGE= pnpm run check` for
that one invocation; use the same empty environment for both measurement profiles. This also prevents
shared cache/coverage writes from qualifying for the parallel inventory.
Do not change persistent settings or discard an intentional custom loader silently.
`pnd-test-plan.parallelEligibility` explains any shared/runtime fallback. Focus always
uses one worker. No new transform/result cache or runtime migration is involved.
The standard `pnpm run check` and `pnpm run build` final gates remain required.
For ready PRs targeting main, the approved [hosted full gate](continuous-integration.md)
runs both on the exact proposed merge. Use focused local checks while editing;
do not duplicate a current hosted full run locally merely to wait for it. Keep
affected native, rendered-browser and performance evidence separate.

The runner prints JSON `pnd-test-plan`, `pnd-test-group` and `pnd-test-result`
markers on stderr with exact file lists, commands, concurrency, native exits and
wall time. Stdout retains Node's TAP stream for each group. Node owns assertion,
skip and failure accounting; the wrapper does not parse nested diagnostics as
additional tests. Ordinary failed groups do not omit later groups. A signal,
launch error or interruption is non-passing and stops new groups; the wrapper
never certifies cleanup of detached descendants. A successful focused command is
explicitly not a full-suite result, and a full-suite result is still only one
component of the final gate.

Use the existing command receipt wrapper with a fresh output for every attempt;
commit the candidate first or explicitly fingerprint all untracked inputs with
`--input`. Preserve raw logs and failed/unknown attempts. There is no automatic
receipt reuse: unchanged inputs, exact selection, command/profile/runtime and
required coverage must be checked before reusing any evidence. An interrupted or
drift-invalidated attempt cannot become a pass. The aggregate inclusion rule is
narrowly extended to this full-discovery runner and its own regression suite;
`test:focus` never qualifies for aggregate coverage.

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

For save changes, follow [the development save contract](../README.md#development-save-contract).
Verify current-format durability, new-game/restart/save/load continuation, malformed
input checks, and clear incompatible-save rejection without stored-data changes.
Classic/native fixtures are scoped research evidence, not an old-save obligation.

Standard code-change gates are `pnpm run check` and `pnpm run build`, plus affected
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

## Automatic evidence report

`pnpm run parity:measure` derives local JSON/HTML/history from source-bound receipts,
without running game checks or editing completion flags. Normal receipt/verification
commands refresh it automatically. See [automatic parity evidence](automatic-parity.md)
for the initially incomplete Mission 1–3 bindings, freshness rules and evidence limits.
