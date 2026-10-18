# Informational browser performance comparison

## Status and two-stage rollout

This directory is **support code, not an active CI workflow**. Its reviewed workflow
sources are in `workflows/`, where GitHub does not execute them. First land these
scripts/tests/docs on main. In a second reviewed PR, copy the two workflow files
unchanged into `.github/workflows/`. The benchmark then loads the already-landed
base harness, never its own proposed harness. The `workflow_run` reporter starts
only after its workflow is on the default branch. Verify one hosted base-repeat
and paired run before making any performance claim. No branch protection,
required-check name, existing validation, deployment, or merge permission changes.

The benchmark is informational. A failed measurement is a missing measurement,
not a game regression. Its comment cannot satisfy code review, `Full check`, or
any merge approval. Stable data/noise qualification is future work, not a reason
to turn these initial thresholds into a merge gate.

## Initial cost and sampling budget

- Two standard `ubuntu-24.04` runners, `max-parallel: 2`, 15-minute hard cap each.
  The trusted reporter is a separate job capped at three minutes. Maximum occupied
  runner budget is 33 minutes; timeout means incomplete, not success.
- `world`: world-hover then camera-world. `recovery`: HUD, world-recovery,
  menu-recovery, with the preceding world-hover and camera actions executed as
  unmeasured setup in their original order. No injected game state or fake clocks.
- Each shard builds exact event base/head once with the same trusted base builder,
  parser, scenario, browser configuration and lockfile. Dependency changes are
  explicitly incompatible with this initial common-install protocol.
- Within each runner: B/H, H/B, B/H, sequentially. Every arm uses a new browser
  process, context and fresh HOME/config/cache directories. The normal authored
  world initialization starts deterministic randomState at 1; no seed or clock
  override is installed. No concurrent arms on one runner, no cross-runner
  pairing, no pooled frame-based statistical significance, no sum of shard times.
- This is 12 fresh sessions and 30 measured phase captures across two runners,
  plus prerequisite setup phases. Browser sessions cap at 90 seconds, builds at
  120 seconds. Failed sessions retain available evidence and do not remove pairs.
- Upload separate small reporter inputs and raw captures/phase summaries/screenshot
  and execution receipts for seven days. Built bundles/dependencies are excluded.
  Do not commit logs or captures. Do not add private user recordings to public CI.

Only ready-for-review events launch comparisons. Synchronize/open/draft events do
not create repeated benchmark cost. Review/re-ready an updated exact candidate
as with the existing gates. This is deliberately not a benchmark on every push.
Use actual hosted durations/storage to decide whether to expand the matrix.

## What is measured

The existing production Home/store/scene is bundled through plain Vite, not
Vinext/Cloudflare/RSC. Authored Level 2 uses public controls, 1440×1000 CSS pixels,
DPR 1, normal game speed, a two-second warmup, fixed pointer/camera actions, and
1.6-second requested phases. F8 is enabled during all measured windows. Original
browser downloads are unchanged; only complete in-phase RAF intervals are selected.
The capture checks real turns, visible scene, pointer route, draw/query work,
correct build/schema, and at least 75% coverage of the observed phase duration.

For each phase/arm, the bounded report contains:

- CPU wall-time distributions for simulation, render submission, pointer,
  callback, ordinary visibility/projection/triangles, native key/projection/triangles,
  object/model picking, and RAF interval distinctly labeled **not FPS**.
- All-frame and nonzero-time mean/p50/p95/max, with their sample counts. A nonzero
  timer is not proof of a simulation tick or active work: timer resolution and
  scheduling can change zero fractions. Missing observations remain unknown.
- For nested terrain/object pick sections, per-query frame-average distributions
  and counts. Each frame's duration is divided by its actual corresponding query
  count; this is not a distribution of individually instrumented query times.
- Per-frame draw/query/projected-vertex/triangle/model-face counts, movement/camera
  fractions, phase turns, actual duration, pointer target and observed input times.
  Internal counters can decrease because of the intended optimization, not merely
  because workload disappeared. The comment shows per-query geometry too.

If any shard is missing/incomplete, available measurements stay observation-only
and receive no possible-improvement/regression label.

Matching guards cover source/protocol/runtime, completeness, target/point, starting
and ending turns, actual input timing, before/after camera, duration, and query
presence. They do not require identical internal projection/cache counts. A phase
with insufficient/mismatched evidence cannot receive a speed signal. Independent
runner identities remain in raw provenance; matching software/runtime metadata is
required across shards, while within-shard browser/renderer/host identity must stay
constant. No whole-program-equivalence claim follows from this workload matching.

Simulation p50/p95 is observation-only: the frame export has no per-frame turn
count, so different tick/no-tick mixtures cannot prove faster simulation. Other
nested pick comparisons use per-query frame averages. Per-frame callback/render
changes still require interpreting work counts and zero fractions. CPU buckets
are nested and overlap. Never add them or convert RAF cadence into presented FPS,
GPU timings, or hardware smoothness acceptance.

## Preliminary signal policy

Each phase/section compares the three paired session p50s and separately the three
paired p95s. It does not pool correlated frames into a larger independent sample.
The effect threshold is the maximum of 0.1 ms, 5% of the baseline session median,
and twice the range of the baseline repeats. Every paired difference must exceed
that threshold in the same direction for `possible-regression` or
`possible-improvement`. A repeat range exceeding max(0.1 ms, 15% of its median) on
either arm is `noisy`. Other cases are within-noise, inconclusive, unknown,
incomplete, or mismatch. Zero baselines have no percent change. Three pairs do not
establish confidence intervals, statistical significance, or absence of regression.

This is intentionally conservative and preliminary. Show raw distributions and
counter changes, investigate a signal in another run, then qualify stability and
thresholds with retained same-build repeats before considering any stronger use.
Harness or app measurement/export changes are flagged from GitHub source metadata:
the common base harness excludes proposed harness changes, while app instrumentation
is still part of the PR build and may change timing boundaries.

## Trust boundary and comment admission

The benchmark has only `contents: read`, no secrets/write token, no persisted
checkout credentials, no cache and no deployment. Candidate code is untrusted,
including code that a build dependency might evaluate. The write-capable reporter
runs on a new runner, checking out only workflow_run's trusted default-branch SHA.
It does not install packages, check out the PR, extract an artifact, execute a
candidate script, import a report, or evaluate strings from reports.

The reporter re-fetches the run/workflow/PR and verifies fixed repository,
pull-request event, exact workflow path, run/attempt, unique GitHub PR association used only for routing,
immutable run head equal to the current PR head, artifact base equal to the
current GitHub PR base, and the original benchmark workflow bytes at both source
commits against its trusted checkout. Its only accepted artifact names are the two
fixed run/attempt/shard names. Artifact input is a single regular `report.json`,
max 512 KiB uncompressed, read in memory from a bounded ZIP. Path traversal,
symlinks, encryption, extra entries, unsupported formats and corrupt CRCs fail
closed. Strict exact-field schemas admit only bounded numbers, digests, fixed
phase/metric/status enums. Reports cannot supply executable text, markdown, URLs,
repository names, comment IDs, or a target PR independent of GitHub metadata.

GitHub run PR associations can change after execution; they are not immutable
event-base attestations. The source-bound artifact must match the current GitHub
base, otherwise the old run is skipped.

Reports are untrusted observations, not attestations that malicious PR code
performed honest work. The design prevents their data from becoming privileged
code or arbitrary communications; it cannot prove the PR did not falsify its own
runtime metrics. Suspicious instrumentation/source changes require review.

The reporter updates one marker-identified comment authored by the immutable
GitHub Actions bot identity. It refuses ambiguous duplicate bot comments and older
runs/attempts. A fresh PR/head/base check immediately precedes the sole POST/PATCH;
per-PR reporter concurrency serializes upserts without displacing other PRs. Closed or stale PRs are skipped. Artifact
links are constructed from validated GitHub run IDs, not report URLs. No reviews,
labels, statuses, ready transitions, merges or repository settings are written.

Activation introduces only ephemeral job permissions necessary for that comment:
`contents: read`, `actions: read`, `pull-requests: write`. No persistent credential,
OAuth grant, repository secret or protection change is created. Keep reporter
source trusted and re-review any expansion of that permission/action boundary.

References: [GitHub workflow_run security warning](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run),
[secure use of Actions](https://docs.github.com/en/actions/reference/security/secure-use).

## Portable checks

`node --test tests/browser-performance.test.mjs tests/gameplay-frame-recording.test.mjs`
checks synthetic aggregation, malformed data, noise/unknown cases, archive limits,
GitHub metadata admission, stale heads and comment targeting. These are not actual
browser measurements. The normal check/build gates remain required. Local browser
access restrictions must not be bypassed; hosted sandboxed Chrome is the supported
execution route. Preserve exact source-bound command receipts and raw CI artifacts.
