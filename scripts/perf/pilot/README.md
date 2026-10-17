# One-shot hosted centers research pilot

Source-only preparation. No workflow has been pushed, opened or run. No local benchmark rerun was performed while preparing these files.

## Fixed scope

- Only a newly opened draft pull request from the exact same-repository branch `perf/hosted-centers-pilot-474` to main can run this job. No synchronize, reopened, dispatch, push or target trigger.
- Standard ubuntu-24.04, Node 24.19.0, npm 11.9.0, read-only contents permission, no secrets or persisted Git credentials. Existing required checks are untouched. No deployment, merge, host tuning or paid runner.
- Baseline `0b94142bd83fc4b6c961d44e8c7338cf452139dd`; centers-only candidate `ac53c9c9d0df311431aa6dc264c46399e73860d7` (draft PR486). The water-point candidate is absent.
- Sources are extracted by exact Git SHA into separate directories. All 335 expected source/asset hashes are checked. Runtime differences are restricted to app/painter.ts. Both package and lock files must be identical; one shared locked dependency tree is installed with lifecycle scripts disabled. Resolved dependency hashes must match across every process.

## Deterministic workload

Actual terrain-only Painter.update plus afterRender, Mission 1, original assets, production visibility and 1920×1080 projection. No browser/GPU, models/sprites/alpha execution or full-frame claim. Water, camera and visibility preparation remain outside the timed call.

Each process first validates the seven archived baseline checks, then records an untimed 256-phase oracle. Every later process must match the first baseline's complete phase/output record, source hashes and dependency closure. This is a current-engine regression oracle, not independent native visual parity. Candidate same-size storage identity is checked outside timing.

Every process resets to the same phase 0, fixed heading/focus, one active terrain instance and retained 1024×64 depth texture before sampling. There is only one measured case. It uses 128 warmups and 256 measured calls with original production water preparation. Warmups are recorded separately. The first warmup uses turn 0 after the explicit reset and therefore hits the water unchanged-key gate; the following 127 warmups change the phase. Every measured call changes the phase. This fixed behavior is identical for all processes. Raw rows flush in 64-call blocks outside measured intervals; that I/O can perturb execution and is identical in all processes. No profiler or per-call CPU probes run. Case-boundary CPU/thread/context/heap observations include the surrounding prepared workload, not just timed painter calls.

## Predeclared decisions

Four baseline processes qualify only if median and p95 max/min spread are both at most 1.05; every process must also pass 5% ratio guards for first/last measured 64-call medians, the two 64-call warmup medians, and last warmup versus first measured window. Failure skips all candidate runs and reports inconclusive.

If qualified, run exactly baseline/candidate/candidate/baseline. All four must pass the same within-run/warmup guards, and both new baselines must stay within 5% median/p95 spread with qualification baselines. A positive screen requires candidate median at least 10% lower in both adjacent opposite-order pairs and candidate p95 at most 10% higher in either. Otherwise report negative evidence or inconclusive as appropriate, never automatic causal regression or acceptance. Report p99/max/total and all quarter-window medians; no outlier removal. P99 represents about three upper-tail observations, and correlated inner samples are not independent experimental replications.

At most eight fresh processes, each capped at 120 seconds. Job cap is 15 minutes; an additional ten-minute budget from preparation start refuses another process unless its full 120 seconds remain, leaving room for evidence upload. Resource/source/correctness failure stops the batch, preserving previous raw files and marking remaining runs skipped. No retry or search for a favorable host. A positive result only motivates separately reviewed stable-host/browser validation; it never merges code or claims FPS.

## Evidence and limits

Only explicit safe host metadata is recorded: runtime/OS/kernel, runner image identifiers, CPU/topology/allowed affinity, memory/disk, accessible cgroup counters and process/thread CPU/context switches. Missing data is null, not inferred. No environment dump, credentials or tokens are uploaded.

Artifacts include preparation/report/host records, per-process JSONL (warmups, timings, complete phase oracle, source/dependency hashes and boundary metadata) and stderr. Upload allowlist excludes dependency/source trees and retains files for seven days on success or failure where the service allows. A job killed at the service boundary may prevent final upload; no successful upload is assumed. Durable publication of the resulting compact evidence requires a separate review.

The workflow may not be triggered by some authentication mechanisms. If opening the reviewed draft produces no expected event, report that limitation; do not broaden credentials, permissions or triggers.
