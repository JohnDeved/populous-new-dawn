# Ordinary current-source campaign continuity

Source checkpoint for a fresh Mission 1 → 2 → 3 journey on accepted main
`71b3860e7025a9534d56248c194aa18610b5df4d` (tree
`397a0e31a5232fa479e8d0972a4a929343ecec67`). No fresh gameplay outcome is claimed.
The tracked run policy deliberately disables launch until source review and the
final application/runtime gate. All changes are under this QA directory.

The maintained `scripts/local-render/harness.mjs` owns the game-only profile,
exclusive lease, source/runtime receipts, origin restriction and cleanup. It is
unchanged. Use this directory's `scenario.mjs` as its named scenario only after
coordinator release. Never use an old Mission 3 profile or its recovery records.

## Reuse and new boundaries

`reuse.json` identifies every carried source file and each unchanged action body
by its original commit/path/hash. The four passive observation/probe/control
modules are copied byte-for-byte from accepted `5de3c57`. Their historical unit
fixtures are source tests, not gameplay evidence. The current scenario reuses the
ordinary selection, actual canvas/minimap picking, clone-only legality probes,
construction/training, prospective sermon, cancellation, conversion and Erosion
bodies. Browser import paths and observer aliases now name this directory.

Removed: the historical source manifest, copied-profile admission, preparation
admission, recovery/successor records, one-use claims, inherited Run14 milestones,
old lifetime totals, direct All-missions entry, fallback Save, and standalone M3
finish. No historical branch is merged. The original application, scripts and
all profile bytes stay outside this change.

Added: a real campaign selector opening, level-scoped route marks, actual Continue
transitions, source-bound mission-boundary records, additive campaign accounting
and ordinary committed Save/Load wrappers. Continue keeps the store and must
replace both World and scene, with `scene.world === store.getWorld()`. The old
observer is disposed and the new one chains the shipped callback exactly once.

Load captures the replacement synchronously in a read-only subscription, clicks
visible Pause immediately, then binds diagnostics. Actor/terrain/stock projections
are compared at replacement; the full saved-record digest is compared at storage
boundaries. Current worship presentation is observed separately after Load:
its UI clock may advance while the simulation is paused. No clock rate is changed.

## Finite ordinary inputs

The existing task-owned numbered command-file protocol remains bounded to 500
batches of at most 32 actions. There is no eval, model command, direct selection,
tick, World construction or storage-write action. Every accepted command is
archived with exact bytes/hash. `routes.mjs` lists the finite mission objectives
and source references; it is guidance for actual observed tactical inputs.

Actions: pause/resume/clear, select or select-units, map/rotate/move,
order-entity/build/cast, wait/snapshot, mark, checkpoint/reload-checkpoint,
prove-victory/continue/finish, and the retained M3 acquisition/sermon/Erosion
wrappers. IDs come from actual current snapshots. Two-person shrine groups use
visible Control-click selection and exact selected-ID readback. Training uses
one finite order, a first-new-kind wait with pre-order IDs and named training
building, then a paused count/queue snapshot before further decisions.

An arbitrary `mark` can only request a fixed M1/M2 route predicate. Save/Load,
victory and M3 sermon/Erosion marks require their proof wrappers. Repeated names
from a different mission cannot satisfy a later mission. Current actor IDs are
compared within a saved mission; no cross-mission identity equivalence is claimed.

A sole `stop-preserve-latest` command at the exact next ordinal is authenticated
before diagnostics and every polling sample. Wrong-run, mixed, malformed or unsafe
control input is terminal with preservation intent. Ordinary future batches stay
unconsumed during an active batch. An already-issued Save finishes bounded actual
committed readback before a pending stop is serviced. Failure never triggers Save.
Before the first Save, preserving the initial empty checkpoint is explicit.

## Segments and budgets proposed for review

Continue defaults to closing a segment after ordinary entry/readiness and a real
Save in the next mission. `suspend: false` permits staying in the same session
within its wall cap. Resume is limited to this completed Continue→Save boundary.
The actual terminal harness receipt binds the emitted `segment-boundary.json`
hash; its verified profile/source/cleanup and latest digest must match. The record
also binds the intended terminal status and exact deliberately thrown error hash.
A later cleanup, readback, runtime or source override rejects admission. All past
milestones, epochs, input provenance, failures, stops and browser errors carry
forward. Overall failed status does not erase a valid boundary; a separate
prior-harness-failure entry preserves that failure. Missing or arbitrary
mid-mission provenance rejects. There is no general recovery/adoption facility.

Proposed active caps: M1 900 seconds, M2 1500, M3 2400; total 4800. M3 additionally
retains its 900-second pre-conversion cap and at most 1800 seconds after the actual
conversion. Save/Load rewinds never refund time. Each new mission resets only its
own subtotal. Named-objective progress must change within 120 active seconds;
unrelated movements, births, combat and clocks cannot renew a wait.

Proposed owned wall caps: M1 30 minutes, M2 90, M3 90, campaign 210; each execution
segment has a 95-minute cap. Closed time awaiting the shared browser lane is not
owned wall time; every actual segment's wall cost is retained. These are resource
ceilings, not timing equivalence claims. Historical M1 won at world time403.08s
(902.702s receipt wall), M2 at743s (4766.618s receipt wall including later M3 entry),
and the recovered historical M3 cumulative total was1936.25s. M1/M2 world times
are not cumulative active measurements across reload, and their failed receipts
do not satisfy this new campaign.

## Source checks and remaining gates

Focused Node tests cover retained observers/probes, authenticated stops, actual
scenario Save/Load and Continue control ordering, scene/store mismatches,
checkpoint substitution, prior failed-envelope retention, mission mark isolation
and cumulative limits. Run `node --test qa/campaign-continuity/*.test.mjs`.
The orchestration planner selects conservative checks for this new QA path;
independent review must approve that boundary. Standard check/build and actual
rendered campaign gates remain not-run pending shared-resource release and final
source review. No dependency acquisition or browser/profile mutation is part of
this source checkpoint.

Fresh M1/M2 Save/Load, each actual Continue and committed completion prefix,
fresh M3 owned sermon cancellation/reload/singleton conversion, prospective
shrine-linked Erosion onset/countdown/removal and victory all remain to be earned.
Three campaign victories would prove observed browser continuity. Whole native
parity, calibrated animation timing (#214), original pixel comparison and hardware
GPU performance remain separate.
