# Training movement composition and formation lifetime

This candidate addresses issue [29](https://github.com/JohnDeved/populous-new-dawn/issues/29).
It restores retained person phases, formation construction RNG, and the distinct
allocation/tribe-list lifetime used by ordinary marching and training approach.
Capacity remains five. This is not a new one-person doorway semaphore, a visual
crossing claim, or a native allocator/save-format parity claim.

## Source and representation

The original executable SHA-256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The bounded eight-Brave Temple comparison is documented in research
[PR 321](https://github.com/JohnDeved/populous-new-dawn/pull/321).
Relevant reviewed pseudocode is explanatory evidence, not recovered source:

- [`00500a30`](../generated/00500a30.c) initializes class-10/model-1 formations:
  publish the tribe link and consume one game-RNG draw for `(draw & 31) + 32`.
  The browser constructor now makes exactly this draw once. Its `model` property
  represents the recruited person's type at native `+0x2d`, which
  [`005018c0`](../generated/005018c0.c) assigns after allocation; it is not the
  native object's constant model 1 at `+0x2b`.
- [`004ed8a0`](../generated/004ed8a0.c) prepends the primary allocation list.
  The browser's `marchingAllocations` retains this newest-first lifetime order.
  `marching` retains the separately mutable tribe traversal. New groups prepend
  both immediately, making them available to later same-turn recruitment.
- [`004edcf0`](../../references/verification/training-movement-2026-10-10/native-retirement/retirement-static.txt) marks a retired group class zero and
  immediately unlinks primary allocation. The tribe link remains until rebuild;
  [`00501ab0`](../generated/00501ab0.c) explicitly excludes class-zero groups.
  The browser likewise removes primary ownership immediately and leaves the
  inactive traversal record until the completed object turn.
- [`004ecac0`](../generated/004ecac0.c) clears tribe lists, traverses primary
  newest-first, and prepends eligible groups. `rebuildLiveMarchingFormations`
  produces that oldest-live-allocation-first order after ordinary object/death
  work beside the existing construction-list rebuild. Repeated rebuilds do not
  alternate the current traversal, and no numeric ID sort determines age.
- `stepLiveRoute` still synchronizes legacy route-only adapters to world time.
  It no longer overwrites the already-incremented retained entry person's counter.

The [retained retirement trace and audit](../../references/verification/training-movement-2026-10-10/README.md)
show that the original creates 1831 then 1830 on turn 25; same-turn tribe
order is 1830→1831, then rebuild yields 1831→1830. Original retirement removes
1831 from primary at header 26 and 1830 at header 31, while each remains inactive
in its tribe chain until rebuild. Deferred-free counters run 3→2→1→0, releasing
these slots at ends 28 and 33. The observation-only extension preserves all six
original comparison outputs and all three captured initialization artifacts.

The browser uses unlimited monotonic allocation IDs. No runtime formation reader
uses the original deferred pool: current readers are recruitment, formation
stepping, checkpoint retagging/migration, and the new allocation/rebuild owner.
Consequently this patch does not emulate unused deferred storage or claim slot
reuse/capacity equivalence. Original reuse is source-derived and was not exercised
in the 48-turn native fixture.

## Checkpoint policy

New checkpoints clone both arrays as one world graph, preserving order, timers,
RNG, and shared group identities. Loading never runs the constructor.

Historical browser checkpoints have one marching array, maintained solely by
`unshift(newGroup)` and stable `filter(active)`. Its order therefore already is
newest surviving browser allocation first. Migration copies this order into the
new primary owner while retaining the saved first traversal; the next real turn
performs the normal rebuild. This is a browser compatibility policy, not an
inference about original native save/load or native numeric IDs.

## Interruption defects found by acceptance

The new actual-caller tests also exposed two existing defects when an ordinary
ground order interrupts training while the person belongs to a formation:

1. `cancelBuildingEntry` used an unsupported formation-release callback and threw.
   [`004364d0`](../generated/004364d0.c) ends cancellation through
   [`00501be0`](../generated/00501be0.c), clearing assignment bit 32 before calling
   [`004d4f40`](../generated/004d4f40.c). The cancellation path now reuses the
   existing live movement `orderEffects(w)` speed/animation recovery consumer.
2. The public ground-order fallback discarded the entry owner and manufactured
   another person. It now carries the same entry person across cancellation and
   `startLiveOrder`, preserving its counter and registered identity.

Only this cancellation path shares the effects consumer. Other initialization
contexts with distinct local RNG owners are not generalized by this patch.

## Test boundaries and results

`training-movement-composition.test.mjs` uses real public human training commands,
shared AI training orders, and ordinary ground movement. It does not inject
formations, timer values, membership, recovery phases, or constructor RNG.
Observation covers exactly one allocation draw, native timer range/formula,
creation chronology, same-turn retirement visibility, head/middle removal with three live groups, surviving primary order,
new allocation interleaved with retirement, command interruption, death, target
destruction, legacy migration, and continued new-checkpoint equivalence.
The fixture supplies an unobstructed landscape, so it does not replace ordinary
rendered campaign acceptance.

`training-route-phase.test.mjs` retains the prior actual-caller counter tests
from `bd420fd2`, without importing that rejected product patch as an accepted fix.
Its phase injection deliberately checks byte wrap and independent retained phases;
its world-turn route-only compatibility branch is a separate isolated check.

The pre-existing `formation-phase` native fixture stubs every world processor,
including the tribe rebuild, and its primary list contains only supplied ordinary
objects, not its supplied groups. Its recorded second-turn group order cannot be
used as a real lifetime oracle. The test now explicitly supplies those captured
start-of-turn lists for each phase while keeping every recorded expected event
unchanged. It retains the independent actual-recruitment next-turn steering test.
No native fixture, recorder, capacity assertion, or Mission 2 acceptance was changed.

Before product edits, actual-caller counter and constructor/list tests failed.
A replay of the initial 31 new tests against clean baseline `50aefe1d` confirms
29 failures / 2 passes. The narrow interruption RED also preserves the real
unsupported-consumer stack. Candidate focused coverage passes **68/68** tests
across eight test files. Parent exact-fixture replay reports no control, counter,
or position difference over 48 turns, with original admissions 33/40/43/46/48
and queue 1839→1836→1838. Raw displacement/cellNext representation, supplied animation stamp, and building
entryDelay/entryTimer clock differences remain qualified by the diagnostic adapter.
Matching person position/control is narrower than full raw state, scheduler, or
rendered equivalence. Full gates, unchanged Mission 2, rendered gameplay, quality,
and fresh review remain required; focused/model evidence alone is not acceptance.

Raw local source-bound receipts are under
`work/orchestration/training-movement-composition/`:
`interruption-red.json`, `final-tests-baseline-red.json`, and
`focused-green-01.json`, and `focused-middle-green.json`, with retained stdout/stderr artifacts. The baseline
replay loader redirects only application imports to the independently verified
clean `50aefe1d` checkout; it does not replace gameplay functions. Earlier failed
phase-test and test-authoring attempts are retained under
`work/training-movement-composition/`. Parent verification owns the exact-fixture
raw evidence and the remaining serialized acceptance gates.
