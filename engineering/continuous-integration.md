# Ready-PR full verification

The authorized `.github/workflows/ready-pr-check.yml` runs the standard
equivalent of `npm run check` plus `npm run build` on isolated standard GitHub-hosted Ubuntu VMs. Four test shards preserve every discovered test and the existing C2/C1 resource policy; one quality/build job runs the other gates exactly once. A non-skippable `Full check` job validates all five source-bound receipts.
It does not deploy, record new parity, run original-game binaries, or replace
native, rendered-browser or hardware-performance acceptance.

## Working sequence

1. While editing, run affected focused checks and complete substantive review and
   any native/browser/performance evidence. Push a coherent candidate as a draft.
2. Mark the PR ready when its candidate is ready for the full gate. `Full check`
   requires typecheck, every discovered top-level test across four shards, parity and
   orchestration checks, and a production build of the exact synthetic candidate. Do not launch a duplicate local full gate while this
   one is pending; continue independent work in another branch or review/research.
3. Repair failures with focused feedback and push. After review of the exact new
   head, return an already-ready PR to draft and mark it ready once. A synchronize
   event does not start this workflow. Never weaken assertions, omit test files or
   regenerate reference evidence to obtain a pass.
4. Before merging, verify the current reviewed PR head, current main base and exact
   tested merge match the successful check. Keep the run URL/attempt, source SHAs,
   command results and raw job logs with the PR's evidence. Source changes invalidate
   earlier coverage. A canceled, missing or failed check is not a full pass.

## Events and draft behavior

PRs targeting main trigger only on `ready_for_review`. Opening, reopening,
synchronizing, converting to draft or retargeting a PR does not admit this
workflow. There is no push trigger, path filter or dispatch path. The only job conditions are
the aggregate’s `always()` dependency-failure guard and the activation-only
diagnostic described below.
The reviewed-candidate coordinator must issue one draft-to-ready transition after
reviewing each exact candidate that lacks a matching full pass. This includes
repairs, main refreshes and PRs opened or reopened already ready. Reuse an existing
genuine pass when it exactly matches the reviewed head/base/merge; opening or
reopening alone is not a reason to rerun it. New heads without a successful gate
remain blocked by required checks; a missing run is not success.

The strict readiness guard remains defense in depth. Only the boolean `false`
permits the required `Full check` name and passes the guard. A missing/malformed
value or the string `"false"` fails before checkout under `Draft PR (not validated)`.
Normal draft activity now creates no Full-workflow run; the guard is not a separate
draft-admission service. Every worker retains this guard. The aggregate uses `if: always()` with explicit
success checks for both dependencies, so failed, cancelled, missing or skipped
workers cannot manufacture a passing required check. A workflow-wide cancellation
can cancel the aggregate too; cancellation is never accepted as success.

Concurrency remains partitioned by workflow, PR number, event head, event base,
proposed merge SHA and draft/ready lane. Duplicate ready events for the same
candidate may supersede each other. Converting to draft does not cancel existing
ready validation. Separate candidates can consume obsolete compute; the coordinator
must avoid unnecessary transitions and never cancel current work during cleanup.

The earlier split-name pilot proved draft/ready cancellation isolation but failed
newer-suite eligibility: a companion's non-required draft failure appeared in
#502's rollup and the primary remained blocked despite a successful required Full
check. Closing the companion did not restore eligibility. The precise internal
blocking rule was not exposed. See the retained results and revised bounded pilot
in [ci-event-race-pilot.md](ci-event-race-pilot.md). The trigger correction prevents
new draft admissions; it does not retroactively repair that tested SHA or establish
hosted success before its own pilot passes.

Main moving independently does not start a run. Update/rebase the PR, review its
new candidate, and transition it from draft to ready before accepting the new
combined tree. Retargeting to main follows the same reviewed transition contract.
A future merge queue needs a separately reviewed `merge_group` trigger.

## Reproducible inputs

Checkout pins the PR event's synthetic merge SHA (`github.sha`), with full history
and credentials persistence disabled. It does not test only the unmerged head.
Full history is needed because `tests/erosion-observation.test.mjs` reads the
accepted `app/erosion.ts` from commit `3b899125cc8cedef938823718ad5d44f49957b66`.
The workflow verifies that blob exists and records the head, base, merge and
runtime identities. An unexpected tracked-file mutation fails the final step.

Node 24.19.0, npm 11.9.0 and Python 3.12.14 are explicit. `npm ci` installs the
tracked lockfile. Portable Python fixture tests require Pillow; the CI requirement
pins the CPython 3.12 Linux x64 Pillow 12.3.0 wheel and its PyPI SHA-256. This is
separate from optional native-research dependencies in `decomp/requirements.txt`.
The shards use tracked imported assets and synthetic/historical fixtures;
original installation files, Ghidra, Wine and private credentials are not inputs.
A new missing prerequisite must fail visibly rather than silently skip a test.

The existing resource policy still decides C2 versus C1. A fresh CI install can
produce a different installed lockfile; all tests then safely run serially.
Inspect `pnd-test-plan.parallelEligibility` and the logged counts. Never refresh
resource hashes automatically simply to recover concurrency. The 120-minute job
timeout is a safety bound; a timeout is a failure, not partial acceptance.

## Four-shard receipt contract

The fixed matrix uses zero-based indices 0–3 internally and visible labels 1–4.
Sorted top-level test paths are assigned round-robin. `fail-fast: false` allows all
four isolated workers to finish; `max-parallel: 4` caps the matrix. Each shard
retains reviewed C2 execution and conservative C1 fallback within its own VM.
Shard child processes disable Python bytecode writes, avoiding incidental
`__pycache__` changes in fingerprinted script inputs. Local full/focus commands
retain their previous behavior.

Every job checks out the same event synthetic merge with full history and verifies
its exact `[base, head]` parents. Node, npm, Python, Pillow and lockfile identities
are identical across workers and aggregate. Before/after snapshots reject tracked
mutation or inventory drift; shard fingerprints additionally bind tests, scripts,
production/configuration, installed lock, resource policy and runtime inputs.

Only successful workers upload receipts. Artifact names include run ID, attempt,
and quality/shard label. Downloads preserve separate directories, and the
aggregate rejects missing/extra directories, extra files, wrong labels, old
attempts, differing source/runtime/install identities, duplicate/missing test
coverage, nonzero/signal/error results or any mismatch with freshly derived plans.
The aggregate executes no tests or build again. It emits the validated
`PND_FULL_CHECK_RECEIPT_CHUNK=` records and a decoded-JSON SHA-256 only after all checks pass. This is evidence for
the trusted integration driver, not permission to merge an unreviewed candidate.

Re-running only failed jobs is intentionally insufficient when it mixes attempts:
all five current-attempt receipts are required. Re-run the whole workflow for a
fresh complete attempt. A green matrix alone is never a full pass.

This activation is implemented and locally fixture-tested. Hosted lifecycle,
coverage and wall-time comparisons must be recorded against the actual rollout
candidate; no speedup or hosted acceptance is claimed from local fixtures alone.
The rollout first lands runner/dual-policy verifier support under the old gate,
then activates this workflow with an explicit reviewed workflow-hash transition.
Normal integration still requires unchanged trusted/candidate workflow hashes.

## One activation-only baseline

PR #516 additionally runs `Legacy test baseline (diagnostic)` after the required
sharded `Full check` succeeds, on the same immutable event merge, run and attempt.
It repeats only `npm test`, with the unchanged legacy full-suite C2/C1 runner and
`PYTHONDONTWRITEBYTECODE=1` matching shard children. Checkout, runtime, locked
install and before/after source checks match the gate. Typecheck, parity,
orchestration and production build are not repeated. Other PR numbers skip this
job; no extra trigger, token permission or repository setting is introduced.

This baseline cannot satisfy aggregate coverage and is not a dependency of
`Full check`. The trusted integration policy explicitly pins activation PR 516:
the diagnostic must succeed there, and must be skipped without executed steps on
later PRs. Any failure is retained for investigation, not described as a benchmark
pass or silently omitted before merge.

The single controlled pair measures test-stage timing only. Report baseline test
duration, each shard’s test duration, maximum shard duration, observed earliest
shard-start to latest shard-end span, actual sharded gate latency and summed runner
minutes separately. Setup/queue skew and VM variability remain limitations; one
pair is not a statistical speedup claim or a whole-legacy-gate comparison. Cost is
one extra standard Ubuntu installation and one full test-suite execution. Existing
logs retain source identities and complete legacy plan/group/result records; no
additional artifact upload or committed raw evidence is needed.

## Permissions and cost

The workflow uses only official SHA-pinned actions and `contents: read`.
It has no secrets, token write scopes, persisted checkout credentials, deployments,
self-hosted/larger runners, Actions caches or custom images. Official SHA-pinned
artifact actions store five small JSON receipts for seven days. Downloads are
limited to the current workflow run and attempt; no token, run override or
cross-run artifact reuse is permitted.
Do not introduce private data into its public logs.

Standard hosted runner use is free for this public repository. Larger runners are
paid even for public repositories. Workflow logs and job summaries do not count
against artifact storage. Receipt artifacts use storage, unlike logs; keep their short retention and public
repository allowance under review. This change does not authorize paid runners or
purchased storage. The earlier no-artifact cost statement no longer describes
this workflow;
changing the repository visibility, runner or storage choices requires revisiting
that conclusion. [GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

## Enforcing the merge gate

A workflow file alone does not require a passing check. Branch protection/ruleset
configuration is a separate owner-authorized administration action, not performed
by this workflow. Do not claim enforcement until the actual settings are verified.
Until then, the parent must explicitly wait for the matching successful gate.

Read-only verification on 2026-10-16 confirmed strict main protection requiring
`Full check` from GitHub Actions app `15368`, with administrator enforcement and
no force pushes/deletions. This event-race change does not alter those settings or
token permissions. Keep that required name stable for real candidate validation;
draft admission and other workflows must not reuse it.

Verify the settings against the PR's mergeability before claiming enforcement.
A denied administration endpoint is not permission to retry with another identity.
Keep existing fork-run approvals; a first-time contributor may need approval before
CI can execute. Workflow results do not substitute for substantive code review.

## GitHub semantics

- [PR events and merge SHA](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)
- [Required checks and skipped jobs](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [Workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

## Initial rollout evidence

On 2026-10-16, the [first draft run](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38869175179)
for PR #475 at head `737b84399c62a25cc2d3f809aef38f719ddd3045` failed only the
readiness guard. Checkout, runtime setup, dependency installs, full checks and
build were all skipped. This verifies the cheap draft boundary, not a full pass.
Historical ready/synchronize runs and that reviewed candidate's full results are
recorded on [PR #475](https://github.com/JohnDeved/populous-new-dawn/pull/475).

## Optional per-file timing diagnostics (summary-v1)

A separately reviewed genuine shard invocation may append `--timings=summary-v1`
to `scripts/orchestration/test-runner.mjs shard`. It does not launch additional
runs or change partitioning, order, resource classification, concurrency or test
selection. Default invocation remains the exact legacy TAP command. The hosted ready-PR
workflow opts into this reviewed diagnostic mode for its four existing shards.

The opt-in command adds only the fixed source-controlled timing reporter, retaining
TAP on stdout and a silent diagnostic reporter on stderr. The aggregate admits
only these two exact command forms, never arbitrary reporter/destination flags.
Reporter source is hashed into the candidate runtime identity; scripts remain in
the before/after shard input fingerprint. Timing data is not a receipt input,
permission, scheduling weight or evidence that tests passed. Missing diagnostic
data cannot satisfy any gate, and genuine test failure still fails unchanged.

Each group writes a fresh, bounded file under ignored
`work/ci/timings/shard-N-group-N.jsonl` (zero-based indices). No configurable path
is accepted. Existing files/symlink directories are refused, never overwritten;
diagnostic I/O/validation errors emit a bounded notice and omit further diagnostics
without altering test outcomes. A partial file must not be treated as a complete
inventory. Outputs are limited to 2,048 unique file summaries and 1 MiB per group.
Keep them outside committed source; collection/upload needs its own reviewed step,
not an extra file inside the mandatory receipt artifact.

Rows contain a relative test path, file/reporter hashes, Node version, success flag
and Node `test:summary` duration in milliseconds. This is **Node test-summary run
duration**, not OS process lifetime or total startup/import/cleanup time. Per-file
summaries are supported by the pinned Node 24.19.0 runtime; cumulative summaries
are excluded. Use exact candidate/runtime receipts alongside diagnostics, account
for concurrency and runner variance, and never convert test-name duration sums
into claimed whole-file wall time. Before enabling weighted scheduling, separately
review completeness, source-bound samples and immutable deterministic partitioning.


### Hosted timing collection

Each existing shard opts into `summary-v1`; there are no additional test runs,
shards, workers or scheduling weights. A separate `test-timings-RUN-ATTEMPT-shard-N`
artifact retains the before-source snapshot, available shard/gate receipts and
bounded JSONL files for seven days. It is uploaded after a successful or failed
test step. Upload failure is non-gating; cancellation, setup failure or reporter
failure may leave missing/partial diagnostics. Missing rows are never zero-cost
measurements or evidence that a test passed.

The required `full-check-*` artifacts still contain only their single mandatory
receipt. The aggregate's download pattern and strict five-artifact validation are
unchanged and do not consume timing files. Match diagnostic file/reporter hashes,
Node version, complete inventory and source identities against the accompanying
receipts before comparing samples. A before snapshot alone is not a successful
or source-stable run; failed/partial samples cannot establish complete costs.

Job finish order also includes setup variance. For example, in
[run 39064882062](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39064882062)
the shard-2 test step took 6m14, but shard 3 finished last after a setup delay even
though its test step took 3m05. In
[run 39064081889](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39064081889),
shard 3's test step took 5m16 versus shard 2's 5m06. These are GitHub step timings,
not per-file cost estimates. Collect source-bound samples before proposing a
separately reviewed balancing change; preserve resource limits and all coverage.

The external integration validator independently admits only the original TAP
command or the exact `summary-v1` reporter/destination argument list. For the
latter it hashes the reporter from the exact proposed merge's Git bytes and
requires the receipt's reporter hash to match. It never imports executable
candidate policy, accepts arbitrary reporter flags, or uses timing rows as gate
proof. Legacy baseline command validation remains unchanged.
