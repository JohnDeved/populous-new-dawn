# Informational controlled browser CPU comparison

## Protocol status

V2 is a proposed, explicitly different paused snapshot workload. Portable tests
are not browser qualification. Admission requires reviewed trusted-base support,
then an actual two-shard comparison and same-runtime-source control. Before landing,
one candidate-only functional smoke validates the proposed implementation itself. No new ready
cycle, automatic rerun, or relaxed guard is implied by this source change.

The two workflows are already active. Their reviewed files/templates, permissions,
triggers and caps are unchanged here. The common capture/build code always comes
from the exact PR base, so a PR proposing V2 cannot run its own untrusted harness.
The reporter selects V2 explicitly from trusted source, never from artifact input.
An old V1 report is not silently reinterpreted as V2.

The original live capture, protocol and renderer remain unchanged; `run-live.mjs`
retains the V1 entry point. See [the original contract](README-live-v1.md), whose
historical staged-activation description is retained as history, not current status.
V1 hosted run 39144578788 executed 12 fresh sessions and 30 valid captures, but all
comparisons were workload-mismatched. Startup simulation, moving target and held
camera-input scheduling drift made those results unsuitable for speed claims.
V2 does not erase or reinterpret that evidence.

## Fixed controlled workload

- Exact-base production `createWorld(2)`, 140 `advanceGame` calls at 1/24 seconds,
  and the genuine introduction-skip transition author one fixed turn-70 fixture.
  This is declared test setup, not a browser-recorded save or campaign proof.
- Both arms load exactly the same lossless checkpoint bytes through IndexedDB and
  the public Load path. Full pre-input migrated bytes must match. A setup-only
  pause property latch spans Home's forced unpause, then is removed and verified
  before measurement. No renderer, picker, clock, RAF, or tick is replaced.
- Public focus, +32/-32 integer-pixel right drags and a public right-click normalize
  camera/selection. Genuine cancellation's selected-bit change is declared in a
  separate admitted-world hash. Both arms must match that authored state.
- Ordinary pause preserves real production renderer/picker callbacks. Presentation
  clocks may advance. Simulation and water-advance speed are explicitly unsupported;
  render/callback/RAF are observations, not speed claims or GPU/presented FPS.
- Viewport 1440×1000 CSS pixels, DPR 1, two-second warmup, six declared inputs per
  phase. No held camera keys or wall-clock target timing. Each input selects exactly
  the next four contiguous completed F8 samples: first 1 and settled 3 separately.
  The six first samples are a tiny sample, not a significance estimate.

Two concurrent scenario shards, never concurrent arms on one runner:

1. `world`: `native-view-release` then `ordinary-hover`. Native target is the fixed
   authored Shaman ID 54, not whichever person is convenient. Each ±1 pixel right
   drag is unmeasured preparation; release is the anchored input. Actual first
   release route/query/native work and production hovered ID must pass, otherwise
   unsupported/incomplete. Held drag can suppress hover and is never relabeled.
2. `recovery`: `hud`, `world-recovery`, `menu-recovery`. HUD is the prerequisite to
   world return. Menu recovery means subsequent world-pointer inputs after opening
   and closing the real settings menu, not the first post-close callback. Initial
   pointer/setup callbacks are explicitly unmeasured, with raw preparation receipts.

Loaded checkpoint cells can intentionally take a fallback instead of a fresh-world
factory-ownership optimization (for example the owned-cell rank cache in PR591).
This protocol does not inject ownership to manufacture a win. An unchanged/noisy
loaded-snapshot result is not evidence of no effect in fresh gameplay or in a
separate factory-owned Painter workload. Those cohorts require separate evidence.

## Attribution and input matching

A capture-phase trusted pointer listener synchronously records the recorder serial
before the public event handler, not after a remote mouse command returns. A
read-only, preallocated, bounded RAF sidecar witnesses the exact next completed
recorder serial and its supplied RAF timestamp. That timestamp can precede the
input event's performance.now; no timestamp inequality discards the true first
responsive callback. Raw chronological index and timestamp must both match every
serial, with exact 4/4 contiguous coverage. Reset, replacement, full ring, missing
first/intermediate sample, changed route, or wrong actual camera/input fails closed.
No readiness predicate may skip the first callback to find later favorable work.

The full authored simulation/unit/terrain/geometry state is hashed outside selected
callbacks. Actual terrain submission geometry is separately bounded and checked;
World state alone is not proof of submitted index/drawRange/instance equivalence.
The bounded proof covers terrain, not every model mesh: pointer-total/object/model/inclusive-native-occlusion
CPU stays observation-only. Only matched terrain-specific buckets may show possible
signals; no whole-picker or whole-program equivalence is claimed.
Geometry fingerprints are taken outside selected callbacks at each input block's
boundaries, after genuine held-drag/render setup where applicable. Fixed-size
identity/version/count/transform witnesses guard the selected callbacks. Versions
are intra-block guards, not cross-arm implementation-state equality. A first query
that changes the admitted geometry is unsupported, not a reason to skip it.
Transient unversioned mutation reverted between boundaries is not proved absent.
Hashing can warm CPU caches; identical preparation/sidecar overhead is part of this
protocol, not overhead-free measurement.

Exact per-frame query inventory, actual submitted native triangles, geometry hashes,
fixed target, view/input sequence, snapshot/protocol/runtime and complete inventories
must match. Internal projections, visited triangles and model/cache builds remain
reported outcomes, not substitutes for input geometry. A legitimate geometry
optimization may require a separately reviewed workload contract rather than
weakening these conservative guards.

## Pairing, budget and reporting

- Per shard: B/H, H/B, B/H, sequential fresh browser processes/profiles/contexts,
  one exact base/head build each with the same trusted harness and locked install.
  Changed dependency manifests remain incompatible. No cross-runner timing pairing.
- Unchanged caps: two 15-minute benchmark runners plus one 3-minute reporter,
  maximum 33 occupied runner-minutes; 90 seconds/session and 120 seconds/build.
  12 sessions, 30 phase captures, no retries. Only ready-for-review triggers run.
- Exact snapshot transport/expected/source receipts are retained under
  `session-fixture/*.json`, inside existing artifact upload globs. Raw F8 bytes,
  sidecars, preparation observations, selected indices and summaries remain in
  seven-day CI artifacts. No logs/captures/private user data are committed.
- Per first/settled stratum: all/nonzero/per-query frame-average CPU distributions,
  sample/query/work counts and paired session p50/p95. Never pool frames as
  independent trials, sum nested timers, or claim FPS from RAF cadence.
- Three pairs yield preliminary possible signals only. Classification retains
  the 0.1 ms / 5% / twice-baseline-range effect floor, same direction in all pairs,
  and 15% repeat-spread noise rule with 0.1 ms floor. Missing metrics are unknown.
  Missing/noisy/mismatched shards are explicit, never a game regression or approval.

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

## Candidate-only hosted functional admission

The Tutorial-browser matrix includes one `snapshot-protocol` case, capped at six
minutes including the existing 120-second build cap and a 90-second total browser
deadline. It runs the exact proposed merge once in two sequential fresh contexts,
world then recovery, and attempts all five phase captures without retries. Its
fixture is authored from candidate source and explicitly labeled as such, not as
trusted common-base comparative evidence. This adds at most six occupied runner
minutes; the two comparative runners and reporter caps/permissions are unchanged.

The `candidate-snapshot-functional-smoke` artifact retains snapshot transport,
expected/source receipts, raw F8 captures, sidecars and per-block geometry/serial
attribution. It never writes `report.json`, pairs timings, calls a classifier, or
invokes the write-capable reporter. Partial failure remains incomplete. Passing
proves this candidate's functional setup/attribution route, not performance or
comparability. The exact-base benchmark still cannot execute its own unmerged
harness changes. Full plus this functional smoke precede support merge; a trusted
comparative control follows only afterward.

## Portable checks and hosted admission

Run `node --test tests/browser-snapshot-*.test.mjs tests/browser-performance.test.mjs
 tests/gameplay-frame-recording.test.mjs` plus focused lint/typecheck. These are
synthetic/portable proofs only. Preserve source-bound receipts. No local browser
security bypass, downloaded replacement browser, or user Chrome fallback is allowed.

After source review and trusted support land, audit the first hosted run: exact
base/head/harness commits, fixture/source hashes, runtime metadata, two independent
runner IDs, all 12 fresh sessions/30 raw captures, raw-to-summary recomputation,
serial/geometry/query/target guards, noise outcomes, elapsed runner cost and caps.
Then use an ordinary no-op PR with verified identical consumed app/assets/dependency
bytes, allowing only distinct revision/build labels. It is same-runtime-source,
not identical-commit A/A. Reporter lifecycle and one-comment identity remain
independent of whether any performance comparison is useful. No automatic merge
approval, stronger guarantee, matrix expansion or qualified thresholds follows.
