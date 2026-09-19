# Evidence-driven engineering workflow

This directory routes a bounded task to current policy, implementation, evidence,
and checks. It is not a second parity ledger or a workflow engine. `parity.json`
remains the only gameplay and game-mechanics parity percentage and project-progress
source; context resolves its current status at run time.

## Supported integration

Codex 0.153.4 supports root `AGENTS.md`, repository skills under `.agents/skills/`,
standalone project agents in `.codex/agents/*.toml`, and
`agents.max_concurrent_threads_per_session`. This repository caps child agents at
three and omits model/reasoning fields so children inherit the user's choices.

Project `.codex/config.toml` is loaded only for a trusted project. Skills are
auto-detected; start a new Codex task if new root instructions, config, or agent
definitions are not visible. Permission mode is still supplied by the active
session. Agent instructions and path contracts are workflow agreements, not
filesystem isolation.

Use `$populous-engineering` explicitly, or inspect available skills with `/skills`.

## Commands

```sh
npm run orchestration:check
npm run orchestration:index
npm run orchestration:context -- --subsystem selection --query "native drag selection"
npm run orchestration:context -- --subsystem selection --query "native drag selection" --role native --contract work/orchestration/task-contract.json
npm run orchestration:plan -- --base "$(git rev-parse HEAD)"
npm run orchestration:prepare -- --spec work/orchestration/task-spec.json --task-id task --contract work/orchestration/task-contract.json
npm run orchestration:verify -- --contract work/orchestration/task-contract.json
npm run orchestration:audit -- --contract work/orchestration/task-contract.json
npm run orchestration:review-bundle -- create --task-id task --base origin/main --output /absolute/review-bundle
npm run orchestration:closeout -- --source-project /absolute/source --bundle-project /absolute/review-bundle --active-project /absolute/neutral --bundle-preflight open
```

- `check` validates manifest shapes, duplicate/cross references, safe canonical
  repository paths, check commands, generated ownership, and exact current parity
  IDs. It neither requires a cache nor writes tracked files. Structural success is
  not evidence certification or sandbox enforcement.
- `index` creates ignored `work/orchestration/index.json`. It discovers candidates
  from Git plus relevant untracked workflow files, stores source hashes and full
  Markdown heading ancestry, and adds no timestamps.
- `context` validates the cached source fingerprints and rebuilds a missing/stale
  cache. It emits reviewed mappings, live parity scope/limitations, source excerpts,
  selected checks, unresolved questions, provenance, and an omission list. With
  `--role` and `--contract`, it projects the validated task into one specialist
  assignment (native scratch writes require `--research-output`); reviewer packets include the actual change manifest and
  tracked full-diff command plus every untracked path.
- `plan` reads branch, staged, unstaged, deleted, renamed, and relevant untracked
  paths. It explains check selection and reports unknown paths explicitly. It never
  runs the checks.
- `verify` executes exactly the contract's required checks when their manifest entry
  explicitly permits automation. It verifies the external executable once, rejects
  recording commands, owns one browser server when needed, detects checkout/input
  mutation, writes ignored logs, and atomically saves each result as it completes.
  New runs clear old passes first; an interrupted check stays blocked and pending
  checks stay not-run. It does not reuse results automatically.
- `prepare` validates a human-written task spec, captures actual base/baseline and
  policy/evidence hashes, and writes a new ignored contract without overwriting one.
  It recognizes only the two reviewed orchestration checks included in `npm run check`
  when both the registered commands and npm scripts match. Coverage remains explicit;
  the receipt records the aggregate command and fingerprints all covered inputs.
- `audit` validates a compact task contract, compares current changes with the
  recorded baseline, reports both rename endpoints, detects prohibited/generated
  writes, verifies relevant input hashes, and invalidates stale verification
  fingerprints. It reports violations; it never reverts files.
- `review-bundle` exports an exact committed diff plus source/receipt SHA-256 identities
  to a non-overlapping directory that a reviewer can bind independently. Explicit
  receipt inputs are bounded text files; secret-like inputs are rejected and local
  source/home paths are redacted in copied receipts.
- `closeout` verifies the Local Dev source and review-bundle bindings have both been
  released after a reviewer-open preflight. The required binding-switch sequence and
  worker-state rules live in `worker-handoff.md`.

The default context budget is 24,000 UTF-8 bytes, or 12,000 for a role packet.
Override either with `--budget N`.
`contextBytes` counts the emitted formatted JSON and trailing newline, excluding
npm's banner. Add `--output work/orchestration/<task>/reviewer-packet.json` to save
the exact JSON atomically, including an explicit `incomplete` result when context
overflows. Unknown command options fail instead of silently leaving an old packet.
These are UTF-8 bytes, not model tokens.
Whole evidence sections are admitted only when they fit; omitted sections appear in
`omissions` with exact source headings. Mandatory assignment or evidence overflow
marks a role packet `incomplete`; it is never silently treated as sufficient. A
limitation is kept with its mapped claim. Native addresses are query hints, never
confidence labels. Role packets also disclose their candidate paths and bounded
optional-section selection plus a fingerprinted heading index. A specialist can
identify the exact heading before refining the query without loading an entire log
or assuming the packet is an exhaustive source inventory.

## Architecture and sources of truth

The browser composition root remains `app/scene.ts`; simulation state and its fixed
turn loop remain centered in `app/model.ts`. The reviewed map deliberately marks
both as cross-cutting. It also reviews five useful slices: selection/picking,
movement/orders, construction/resources, camera/clocks, and terrain/presentation
performance. Other areas are mechanically inventoried as inferred or unmapped.
Unknown files are not treated as having no checks.

Construction has a material boundary: `app/building-workers.ts`,
`app/building-work.ts`, `app/building-preparation.ts`, and `app/timber.ts` participate
in live flows through `app/model.ts`. `app/construction-order.ts`,
`app/building-fetch.ts`, and `app/timber-search.ts` are reviewed research modules
with portable/native harnesses but no live app caller. Their supplied consumers,
path costs, scheduling, and persistent plan/person/route ownership remain open.

Direction comes from `GOAL.md`. Modern timing/display/performance rules come from
both `GOAL.md` and `references/modern-performance.md`. Native claims require the
limitations recorded in `decomp/README.md`, `decomp/exports.json`, and
`references/reverse-engineering.md`. A heading, address, community name, generated
index, or old assessment is never sufficient on its own.

## Priority triage

Use this only when the user has not already fixed the objective. The parent or a
read-only `pnd-scout` compares at most five candidates drawn from the exact current
`GOAL.md` execution order, reviewed mappings, current parity scope, live callers,
and available checks. Return the top three and recommend one. This advisory triage
needs no task contract, receipt, or generated role packet. Reuse it while its gameplay
and evidence assumptions remain valid.
Verify a candidate's actual object class, mission availability, acquisition path,
and missing implementation before commissioning detailed native research.

Rank player-visible/playability impact and work that unblocks other important
behavior first. Then weigh the live integration gap, evidence and regression-check
confidence, implementation effort, risk, and prerequisites. Each candidate reports
the intended player-visible outcome, live entry point, exact parity IDs, evidence,
required proof, blockers, and uncertainty. Unmapped work stays explicit. Use the
parity percentage to measure delivered progress; do not choose work from checkpoint
weight, a recent heading, address match, filename, or easy test count alone. The
parent owns the final choice.

## Task flow

Apply the progress-boundary stall checks and automatic local recovery in
`efficiency-review.md` throughout active work, including unfinished slices.

1. Record HEAD and every existing working-tree path. Establish relevant baseline
   results before editing.
2. Continue a valid feature lock. If no objective is fixed, complete the bounded
   priority triage once and choose one candidate; otherwise preserve the user's stated
   priority. Behavior-neutral changes do not reopen selection.
3. Retrieve a focused context packet. Read cited source sections when the packet
   exposes ambiguity or truncation. For long logs, cite exact headings and omit the
   whole file from `inputPaths` unless every section is required. Narrow mandatory
   context before raising a packet budget.
4. After selection, write one compact implementation contract for substantial work.
   Its acceptance reaches absent behavior through the shipped UI, campaign, or normal
   system path; injection and isolated helpers are not stopping conditions. The parent
   owns objective, non-goals, acceptance, risk, allowed/prohibited/generated paths,
   integration, and any later authorized ledger update.
5. Keep one source writer and, when practical, the same feature owner through
   implementation, focused checker repair, evidence publication, branch/PR update,
   and final handoff. Use focused agents only for independent evidence gathering or
   fresh review. Each assignment states a bounded question/deliverable, allowed
   writes, evidence, and stop condition. Start new specialists without inherited
   thread history. Supply native, performance, and reviewer specialists one role
   packet from the implementation contract; they start with cited omissions and
   follow relevant callers, dependencies, or contradictions as needed.
6. Re-run `plan` on the actual base. Inspect implementations before executing any
   selected command; do not add `--record` as a generic option.
7. Probe declared external prerequisites, then run the smallest sufficient
   allowlisted checks with `orchestration:verify`; run manual checks only after
   inspecting them. Do not rerun unchanged portable/build checks merely to discover
   a missing native/browser asset. Any later relevant source/fixture/input change
   invalidates the receipt.
8. Give a fresh reviewer the final diff, acceptance criteria, and receipts together.
   Export a portable review bundle when the reviewer would otherwise depend on the
   worker's ignored directory or source binding. Re-review substantive repairs and
   unresolved findings; receipt formatting alone does not justify another review. If
   independent review is unavailable, do a separate review pass and state that it was
   not independent.
9. Audit the contract and report every check status honestly. A denied operation blocks
   only that operation: do not retry/circumvent it, and continue independent allowed
   work. Use `BLOCKED` only when no meaningful scoped work or useful review-ready
   partial remains; otherwise report `IN_PROGRESS` or `NEEDS_REVIEW`. Before the final
   reply, perform the Local Dev binding release/verification checklist in
   `worker-handoff.md`.

Do not use cleanup as fallback work. A locked feature may cross files or subsystems.
Permit at most one independently revertible behavior-neutral prerequisite refactor
commit for a named blocker, then return immediately to the feature. Old extraction
plans are not a standing backlog.

## Evidence and verification

Native research reuse, scoped scratch exports/probes, and durable parent handoff are
defined in `native-research.md`. Preserve useful findings even when gameplay is deferred.

Every check definition records an executable and argument array, working directory,
required environment/input files, prerequisites, side effects, resource conflicts,
expected exit code/artifacts, behavior, and limits. `$POPULOUS_EXE` is a placeholder
for an external read-only user input, not a credential or tracked artifact.

Native CPU checks use the documented Python environment and hash-verified PE/data.
They execute isolated original instructions while often intercepting system calls or
supplying world consumers. Read each script before running it: a few historical
native checks write tracked fixtures even without `--record`.

Browser checks do not start the server. Most use Playwright Chromium and
`POPULOUS_URL` or `http://localhost:3000`; QA scripts may instead require installed
Chrome. They use internal React fibers and are integration-coupled. Some write fixed
temporary paths or tracked performance files unconditionally, so inspect and
serialize them.

Report each required or attempted check as one of:

```text
passed | failed | blocked | not-run | not-applicable
```

Include command, actual exit code when run, artifacts, tested-code fingerprint, and
reason for every non-passing result. Required blocked/not-run evidence prevents the
corresponding acceptance claim, but need not block an unrelated metadata delivery.
An advisory command's nonzero findings are distinct from an execution error.

Evidence records describe method, provenance, scope/cases, live entry points,
limitations/intercepts/approximations, artifacts, reviewer assessment, and remaining
gaps. They do not collapse these dimensions into a single strength rank.

## Performance

Start with `orchestration:context` for the relevant subsystem and bounded question.
Read the cited current policy, measurement rules, workload, corrections, and
limitations from `references/modern-performance.md`; expand to adjacent sections
only when needed, and read the whole historical log only for an explicitly broad
audit. Predeclare a comparable workload and acceptance criteria. Preserve simulation
clock, RNG, and state ownership separately from presentation. Prefer paired runs and
alternate order where useful.

Record measurement scope (microbenchmark, simulation visit, browser frame, or play
session), browser mode (headed/headless/not applicable), and renderer
(hardware/software/unknown plus actual identity) independently. Include fingerprints,
seed/workload, hardware, OS, Node/browser versions, viewport/DPR, warmup, sample
count, repetitions/order, timer resolution/noise, raw artifacts, p95, spikes, draw
calls, allocations, and memory when relevant. Zero measured milliseconds is not zero
work; a local microbenchmark is not a whole-game speedup.

## Generated outputs and scarce resources

`engineering/generated-files.json` records parity output, reviewed Ghidra exports,
native-derived fixtures, imported runtime assets, performance artifacts, and the
ignored orchestration cache. It is intentionally explicit about cooperative or
unresolved ownership rather than inferring producers from names.

Serialize operations against one Ghidra project, fixture or parity recording,
shared build directories, fixed-port servers, fixed screenshot/report paths, and
performance resources. Browser/native checks can mutate tracked artifacts; source
read-only analysis and artifact-producing verification are separate assignments.

Prepared competing commands can use the [shared test queue](performance-queue.md)
for automatic FIFO execution across worktrees, bounded runtime, verified cleanup
and durable results. Transition existing reservations before enabling the queue;
commands outside it still require explicit coordination.

Never hand-edit `PARITY.md`, mass-regenerate evidence, shrink parity scope, or run
`parity:record` to hide an unrelated failure. `.openai/hosting.json` remains outside
this workflow. Runtime module extraction/refactoring is allowed only as the single
prerequisite commit for a named blocker in the locked feature and must protect
TypeScript, embedded/browser imports, assets, benchmark source extraction, evidence
paths, and ordering/rounding.
