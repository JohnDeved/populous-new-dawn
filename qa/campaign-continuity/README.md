# Ordinary current-source campaign continuity

Source checkpoint for a fresh Mission 1 → 2 → 3 journey on accepted main
`3b899125cc8cedef938823718ad5d44f49957b66` (tree
`5228a79f26b90d3daeffe65498c01ada077ba132`). No fresh gameplay outcome is claimed.
The adopted app subtree is `20b5894d4c17f120cd7608b4138953ea6c5f243f`,
identical to reviewed PR218 candidate `d97c370`. The run policy pins actual accepted
main ancestry, current app tree and eight helper imports, and requires clean
source. The explicit `launchEnabled: true` policy still requires exact source review.
No browser/profile execution occurs before the coordinator grants the exact run.
All changes relative to accepted main are under this QA directory.

The maintained `scripts/local-render/harness.mjs` owns the game-only profile,
exclusive lease, source/runtime receipts, origin restriction and cleanup. It is
unchanged. Use this directory's `scenario.mjs` as its named scenario only after
coordinator release. Never use an old Mission 3 profile or its recovery records.

## Reuse and new boundaries

`reuse.json` identifies every carried source file and each unchanged action body
by its original commit/path/hash. The observation, Erosion and queued-stop
modules are copied byte-for-byte from accepted `5de3c57`. The command-probe module
retains its original clone-only bodies and adds the bounded entity-input checks
described below; its changed hash is explicit. Their historical unit
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

PR217 now advances eligible ordinary-person and Splash animation after each
logical turn's afterTurn observer and queued callbacks. This QA hook remains a
simulation-state witness before that logical animation visit. Sermon ownership,
conversion identities and Erosion lifecycle evidence do not claim post-animation
frames/stamps. The global animationFrame watchdog still observes presentation
liveness. Synchronous Load actor/terrain/stock checks do not independently prove
animation-alias/frame restoration; the accepted PR217 clock/migration evidence
owns that separate claim. PR218 adds gated model45 Stone Head body visits after that same observer/queued-callback boundary; ungated transitions retain their presentation owner. This changes rendered body phase, not the first batch's shrine-use/delivered-stock predicates. Its controlled geometry fixture suspends RAF and is separate from ordinary elapsed-clock evidence. Neither prior input miss is attributed to that gate.

The staged tick-only Erosion fixture remains simulation
coverage, while live readiness and worship are awaited through actual RAF/UI.

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

## Finite mission segments and review boundary

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

Retained active caps: M1 900 seconds, M2 1500, M3 2400; total 4800. M3 additionally
retains its 900-second pre-conversion cap and at most 1800 seconds after the actual
conversion. Save/Load rewinds never refund time. Each new mission resets only its
own subtotal. Named-objective progress must change within 120 active seconds;
unrelated movements, births, combat and clocks cannot renew a wait.

Retained owned wall caps: M1 30 minutes, M2 90, M3 90, campaign 210; each execution
segment has a 95-minute cap. Closed time awaiting the shared browser lane is not
owned wall time; every actual segment's wall cost is retained. These are resource
ceilings, not timing equivalence claims. Historical M1 won at world time403.08s
(902.702s receipt wall), M2 at743s (4766.618s receipt wall including later M3 entry),
and the recovered historical M3 cumulative total was1936.25s. M1/M2 world times
are not cumulative active measurements across reload, and their failed receipts
do not satisfy this new campaign.

The tracked `mission-one-first-batch.json` is a prepared first batch, not an
already queued input. After the real opening snapshot and lane grant, it selects
the ready Shaman, orders the uniquely observed Bridge shrine, awaits that shrine's
use and then four actual delivered shots, and pauses before recording the first
milestone. It contains no assumed spawned ID, coordinates, synthetic state or
presentation-derived payout. Subsequent actions use the new paused observation.

## Source checks and remaining gates

Focused Node tests cover retained observers/probes, authenticated stops, actual
scenario Save/Load and Continue control ordering, scene/store mismatches,
checkpoint substitution, prior failed-envelope retention, mission mark isolation
and cumulative limits. Run `node --test qa/campaign-continuity/*.test.mjs`.
The orchestration planner selects conservative checks for this new QA path;
independent review must approve that boundary. The exact PR218 standard
check/build receipts and its accepted final-head correspondence are inputs,
not claims that those commands ran on this combined QA head. A reviewer must
explicitly accept any carry. Tailwind scans added QA text, so a fresh combined
build is required. Fresh QA/structural checks and the actual rendered campaign
remain separate gates. Any dependency transfer and required build have their own
receipts; no browser/profile mutation is part of this source checkpoint.

Fresh M1/M2 Save/Load, each actual Continue and committed completion prefix,
fresh M3 owned sermon cancellation/reload/singleton conversion, prospective
shrine-linked Erosion onset/countdown/removal and victory all remain to be earned.
Three campaign victories would prove observed browser continuity. Whole native
parity, calibrated animation timing (#214), original pixel comparison and hardware
GPU performance remain separate.

## First-attempt input repair

The first fresh run on `901a4e1` reached readiness but failed its initial shrine
command with no dispatch or acknowledgement. Its one failure, one preserving
stop, unchanged empty checkpoint and verified normal cleanup are retained in the
[reviewed failed-attempt packet](https://github.com/JohnDeved/populous-new-dawn/blob/940768091071b3f8123e12b1f8c63bb384268aa6/references/verification/current-campaign-continuity-source-2026-10-05/adoption-901a4e1/README.md).
The original dispatch-time cause is unresolved and no application regression is
claimed. That profile has no mission-boundary record and cannot be resumed here.

Entity picking now chooses an integer canvas point whose whole sampled 5×5 pixel
neighborhood still identifies the named object. Existing person-bound/model-triangle
interior anchors are tried nearest the projected object anchor first; the previous
broad scan remains a fallback when those anchors are occluded. After the expensive before-state
read, a detached clone supplies a separately labelled command-context diagnostic;
disabled contexts reject. The final synchronous picker then revalidates the same
integer point, live selection and orderable state immediately before ordinary
input. A stale point rejects rather than changing or forcing the order.

For that click only, lightweight capture records delivered pointer coordinates,
buttons and DOM ownership. Temporary picker wrappers call each original exactly
once with its original receiver/arguments, preserve its result and observe the
actual handler's returned IDs. They perform no ahead-of-handler clone/validation
work and are restored in `finally`, including failed input. The existing fresh
dispatch, pointer acknowledgement and selected-recipient assertions are unchanged.
Focused tests cover fractional edges, stale targets, disabled contexts, actual
scenario routing and noninterfering wrapper restoration. This is a QA robustness
repair awaiting independent review and a new exact runtime grant; no replay or
profile transition is performed by the source change.

The [second attempt](https://github.com/JohnDeved/populous-new-dawn/blob/e9fb3b1f5931bf631b05e59391346689f70e4828/references/verification/current-campaign-continuity-source-2026-10-05/attempt-02-c56e98a/README.md)
proved trusted same-coordinate canvas delivery but the actual world-object picker
returned null after the prior probe accepted the shrine. Cause remains unknown;
neither morph timing nor a cache fault was proved. The new passive observations
copy existing rect/projection/scene-frame/body-version/cache fields at probe and
delivery, and the actual mixed and terrain picker returns. They never re-pick,
initialize geometry, update rendering or clear caches inside the real handler.
Original receiver/arguments, return/error identity and property descriptors are
preserved. These diagnostics do not supply retrospective evidence for either miss.
