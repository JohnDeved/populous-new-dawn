# Mission 3 Temple automatic-training QA

## Current maintained route

The model-5 automatic consumer shipped in [PR293](https://github.com/JohnDeved/populous-new-dawn/pull/293).
The reusable scenario is `scripts/local-render/temple-training-auto.mjs`. It earns
Temple knowledge and builds a Temple through the unchanged public Mission 3 route,
closes that setup observer, then records one Brave's training, active public
Save/Load and natural panel retirement in a fresh observation epoch.

Run from a clean checkout with the repository dependencies already installed,
an installed official sandbox-capable Chrome Headless Shell, an unused supported
port and an exclusive browser/server lane. Choose new output and owned-profile
paths for each attempt; the setup requires a newly created profile with no saved
checkpoint. Freeze the actual checkout, helper/browser/dependency inputs and
absolute deadlines before admission. For example, after setting
`POPULOUS_BROWSER` to that executable and confirming port 4193 is available:

```sh
timeout --signal=TERM --kill-after=15s 1540s env \
  CLOUDFLARE_CF_FETCH_ENABLED=false WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false \
  node scripts/local-render/harness.mjs \
  --game-root "$PWD" \
  --scenario "$PWD/scripts/local-render/temple-training-auto.mjs" \
  --browser "$POPULOUS_BROWSER" --port 4193 --mission 3 --timeout 1500000 \
  --output work/orchestration/temple-training-fresh-01 \
  --profile work/local-render-profiles/temple-training-fresh-01
```

The harness cap is 1,500 seconds, with a 1,540-second outer cap and 15-second
termination grace. The unchanged setup bounds are 60/420/300/420 seconds for
Shaman readiness/knowledge/return/construction. The driver requires 120 seconds
remaining before training and retains the 20-second readiness/entry,
10-second committed Save, 15-second Load and 45-second restored conversion bounds.
Walking, funding, activity and genuine UI readiness decide success; these caps do
not guarantee it. Failed predicates stop the attempt and retain its report and
cleanup evidence. No state reconstruction, accelerated ticks or automatic retry
is part of this route. Existing evidence-discovery limits remain unchanged.

The dependency-free supporting contracts use the current checkout by default:

```sh
env -u PND_TEMPLE_RUNTIME_ROOT node --test \
  tests/temple-training-cache.test.mjs \
  tests/temple-training-checkpoint.test.mjs \
  tests/temple-training-witness.test.mjs
```

These 47 cases compose actual consumer, renderer, command and checkpoint callers
with explicit model/DOM/storage fixtures. They are not ordinary gameplay proof.
The optional `PND_TEMPLE_RUNTIME_ROOT` adapter is retained only for the exact
historical product54f comparison; leave it unset for normal local-source tests.

[Accepted ordinary evidence and retained failed01](https://github.com/JohnDeved/populous-new-dawn/blob/994063c15c3a06b20982419443582ddd27cd142e/references/verification/temple-automatic-2026-10-09/ordinary02/README.md)
bind the genuine construction Save and successful public Load continuation. The
initial full route stopped before training because its old checker rejected a
hidden legacy DOM cache. The corrected full fresh route has not been rerun end
to end; the accepted continuation demonstrates the unchanged four reusable
training helpers. The one-run private-profile recovery is preserved on immutable
[QA7da](https://github.com/JohnDeved/populous-new-dawn/blob/7da59ae56f29ac01ed2dc625be6eda9105e9e1ed/scripts/local-render/temple-training-continuation.mjs)
and [execution61a](https://github.com/JohnDeved/populous-new-dawn/tree/61a200838719857677a73f4ae480b8a46d40f591),
not maintained as a fresh-checkout scenario or prerequisite. Raw reports and the
private profile remain local. Native cadence/raster/physical allocation and wider
issue #25 completion remain outside this witness.

## Historical feasibility proposal at b2990fe5

The remainder records the original pre-implementation assessment. Statements about
blocked consumers, missing observers and absent profiles apply to that historical
base only. [The public input pins](temple-auto-public-inputs.json) preserve its
exact source inputs; they are not a manifest for current execution.


Refs #25. This is a source-only proposal on merged public base
`b2990fe5312b0a0da7e9dc1c23bb3bc071bb0d13`, not browser admission or an ordinary
PASS. No held QA `df0f42b0` source is imported, copied, linked or published.

**The ordinary construction/training route is feasible, but the automatic Temple
consumer is currently blocked.** `ObjectPanels.trainingIdentity` only accepts
`camp`/class 2/model 7, and `retainedBuildingPanel` only completed huts/camps.
Actual model 5 Temple training calls the shared callback but receives
`automatic:rejected`. Its legacy activity/hover DOM is insufficient evidence of a
retained automatic record. A separately reviewed runtime extension must resolve
both guards and the corresponding rendering/retirement/reservation behavior before
an ordinary acceptance attempt. No browser should launch against the current red
consumer merely to rediscover that source-proved rejection.

## Reuse the genuine setup, then begin a fresh epoch

Use `scripts/local-render/mission3-temple-checkpoint.mjs` unchanged as the prefix
of one small scenario wrapper under the existing local-render harness. It requires
a new owned game-only profile (`mode: created`, no initial checkpoint), uses the
public All missions → Mission 3 route, earns Temple knowledge at the authored
Vault, returns the Shaman home, Control-selects five living Braves, places the
Temple through the Buildings / Temple, 8 wood controls, waits for natural progress
1/stage 4/eight logs, then clicks public Save. Its typed committed checkpoint and
trusted input summary establish genuine setup. This is direct mission QA entry,
not proof of campaign unlocking or the Mission 2 continuation.

The prefix asserts `stats.trained === 0` throughout, ends paused with settings
open, and closes `window.m3TempleRoute` in `finally` before returning. A wrapper
can await it, retain its complete report and exact committed-checkpoint digest,
and only then install a new training-only observation epoch. Construction history
never enters that new collector. Do not change the prefix's zero-training health
assertion or continue calling it after training begins. No old profile survives
with verified provenance, so historical continuation constants are inapplicable.

Prefer this same owned run and same Scene after setup. A split follow-on run is
only an optional recovery if its actual preceding terminal receipt verifies
checkpoint identity, profile/origin/runtime inputs and cleanup through
`owned-profile.mjs`; changed source/checker needs its existing correspondence
review. A report or detached World cannot be written into storage to create that
prerequisite. Never weaken the owned-profile gate or adopt a leftover profile.

## Public helpers and missing narrow observations

The exact base blobs and SHA256 values are in
[the public input pins](temple-auto-public-inputs.json).

- Setup and Save: `mission3-temple-checkpoint.mjs`, `mission3-temple-witness.mjs`,
  `browser-game.mjs`, `checkpoint-readback.mjs` and the maintained harness/profile.
- Public controls, camera and rendered target: `createMission1VaultInput` in
  `mission1-vault-input.mjs`; integer canvas/triangle picking, actual dispatch
  picker wrappers and restoration in `qa/erosion-ordinary/input.mjs`; existing
  minimap inverse and actual minimap clicks. Validators operate on detached clones.
- New-Scene attachment: public `armBuildingSceneStart` in
  `mission3-building-lifecycle.mjs` attaches only after real successful start,
  synchronously before its scheduled RAF; the existing changed-World subscription
  demonstrates the correct Load boundary. Its Temple-art-specific observer is not
  the required training observer and should not be installed as a substitute.
- Typed committed/storage boundary: unchanged `checkpointObservation` supports
  IDB reads or a synchronous detached record via `observationName`. No held
  training-digest extension is required by the proposal below.

A narrow target-specific collector is still needed. Install it after prefix
cleanup while paused; observe only the selected Temple, selected trainee, actual
replacement Preacher and shared UI/controller owners. Wrap actual
`requestAutomaticTraining` and `stepBuildingInspections` synchronously, forwarding
receiver/arguments/return/exception exactly once. Copy primitives/arrays before
host serialization; record every actual controller visit and callback in this
epoch. Use lightweight status predicates while waiting and one terminal export;
there is no construction history to filter or transfer. Predeclare a finite row
cap (8,192) that fails rather than truncates, and keep snapshots scoped rather than
copying whole Worlds per tick. Restore descriptors/listeners/subscriptions on
success and error, preserving any foreign replacement. This is a small scenario
observer, not a new runner or general observation framework.

## Readiness and the actual one-Brave order

After closing settings through `Close menu`, verify ordinary speed 1, playing
Mission 3, current Scene/World/store, live original Shaman, active renderer/clock,
no modal/overview/input mask, and unlocked Temple knowledge. Require the exact
saved completed local Temple to remain alive, class 2/model 5/Blue, with all
construction crew, inside occupants, entry queue and training activity cleared.
Let old manual inspection ownership expire with the pointer/focus away. Do not
assume prefix progress 1 alone proves crew departure or empty admission.

Read the actual roster, native player type, game flags, all active Blue schools,
Preacher count, model-5 training cost, stored/available mana, trained statistic,
occupants and queue. Require at least five living nonghost ordinary Blue Braves,
one live Shaman, zero current Preachers and no other active Blue school for the
conditional source estimate below. Natural births are allowed and recorded.

Clear selection with the public Escape path, then the unmodified `Select brave`
control selects exactly one living eligible outside Brave. Prepare the actual
rendered Temple target *after* that HUD selection and final camera settling.
`input.clickEntity('buildings', templeId, 8, false, [traineeId])` supplies fresh
command-context/picker checks and one actual trusted pointerdown/up. Its existing
command-8 success check only checks work ownership, so supplement it at synchronous
pointerup with `unit.entry.person`, `entry.orders === world.buildingOrders`, eight
command slots/cursor, registered person identity and the shared model-8 order
(target Temple, flags clear, reference count 1). The generic helper's native-first
snapshot precedence is not sufficient to prove training ownership. The real
`adoptLiveOrders` moves ownership to `entry.person` and nulls `unit.native`.

Move to a verified non-panel HUD point immediately. Admission must name that exact
Brave as the Temple's sole living occupant. A new callback must synchronously own
record -1/remaining 0/hold 16, latch and exactly one `building-panel:<id>` reservation
before conversion, with no immediate DOM paint. Require four actual phase-1 visits
with remaining 15 and pointer/focus away; DOM visibility alone earns no ownership
credit. Initial Preacher count and the complete selected-person identity are retained.

## Conditional timing and finite proposal

Model 5 trains model-4 Preachers. Price is derived from the current destination-model
count, not the Warrior-specific `world-state.trainingCost` helper. Zero existing
Preachers gives native cost 3,500. Five Braves (one training, four idle) and one
Shaman conservatively generate floor((15 + 4×4 + 30)×320/256) = 76 mana every four
turns. With one active school, the first half allocation is 38, below the
3,500 >> 5 cap of 109. Starting with zero stored mana, 93 pulses fund training in
at most 372 turns, or 31 game seconds at 12 turns/second.

This is a **conditional conservative source estimate**, not a runtime guarantee.
Actual roster, life/ownership, activity, flags (`gameFlags & 32 === 0`), available
funding and allocation still control admission. Renderer throughput, walking,
menus and Save/Load consume real time. Unexpected costs, competing schools,
failed allocation, lost trainee or changed ownership are explicit failures, never
reasons to inject mana/activity or accelerate ticks.

Keep the prefix's existing 60-second Shaman readiness, 420-second knowledge,
300-second return and 420-second construction limits. Do not reuse Mission 2's
300-second overall budget. Proposed single-attempt harness cap: 1,500 seconds;
outer cap: 1,540 seconds with the existing bounded termination grace. Admit the
training tail only with 120 seconds remaining. Within it allow at most 20 seconds
for crew/empty readiness and real entry/four held visits, 10 seconds for committed
Save readback, 15 seconds for Load/new Scene, and 45 seconds after Load for natural
conversion and retirement; all actions share the earlier absolute deadline.
Menus, target preparation and screenshots consume the remaining margin. These
are proposed admission caps requiring method/lane review, not launch authority.
There is one selected trainee and no automatic retry or changed input after failure.

## Active Save, first Load publication and retirement

The prefix already exposes the Save button. Prewarm remaining module/control
lookups before ordering training. If four active visits cannot be captured before
conversion, report that prerequisite failure; do not silently omit active Save.
Public settings pauses play, then public Save triggers a synchronous store update
*after* `rebuildSecondaryLists` and cloning. A scoped subscription gated by that
trusted Save event captures `{version: 1, world: structuredClone(currentWorld)}`
at that publication. Compare its complete typed digest to the transaction-complete
IDB `latest` read and retain both. This proves the exact Save; a pre-click snapshot
alone can precede secondary-list normalization.

For public in-session Load, capture the first changed-World store publication
before Page's separate update unpauses it. Compare it with
`{version: 1, world: migrateCheckpoint(structuredClone(savedWorld))}` made only on a
detached clone, using the unchanged full typed encoder. Preserve aliases, property
and Map iteration order. Original Save/IDB equality is separate from this migrated
Load equality; do not claim that reservation clearing is the sole normalization.
The current public actors/terrain/stock digests alone omit training/queue state.
Require old Scene disposal, new empty record/latch/reservation ownership, retained
page tooltip-session state, and a fresh actual active callback before its first
conversion. Fresh-page restoration adds a migration and is outside this episode.

Finally require exactly one trained increment, retirement of the clicked Brave
and exactly one new living Blue Preacher (no assumed numeric ID relationship),
stable living Temple identity within the epoch, activity clear, phase-2 visits
2→1→0→retirement, and empty occupancy/queue plus record/latch/reservation/DOM.
Capture active and released images, with camera/frame differences stated. Preserve
every raw row/failure, observer restoration and owned browser/server cleanup result.
Native cadence, physical secondary slots, all frontend histories, audio, hardware
performance and whole-issue #25 completion remain outside this bounded claim.

## Cheap source checks and remaining admission

Three dependency-free CPU4 Node checks passed in 1.15 seconds on the exact base:
actual current consumer rejection for active local model5; public setup health's
zero-training contract; and actual `createGameStore` Load publication versus
production migration of a detached saved fresh-M3 World using the public typed
encoder. The last is a controlled model composition, not active training, UI or
committed IDB proof (Node's absent IndexedDB is explicitly observed). Its raw output,
warning and command are in `work/orchestration/temple-auto-feasibility-01/checks.json`,
SHA256 `bb7eb1734b2bd17c805c8749be0f3c32d07d1f0881bc96ef1e9747c3daf849f9`.
The source-executed funding calculation is preserved as an explicitly retrospective
note at `work/temple-feasibility-caller/caller-funding-retrospective.json`, SHA256
`f066eb305212c4c5016b984006447acef91c809d339509ac720ad527716c556c`.

Before browser admission: accept the model5 runtime/caller fix; implement/review
the small fresh-epoch wrapper and its active-training Save/Load/cleanup contracts;
freeze exact runtime/helper/observer pins; establish an unused allowed port and
new owned profile/output; then obtain the coordinator's exclusive lane. No browser,
native executable, build, dependency action or game-state setup ran for this plan.
