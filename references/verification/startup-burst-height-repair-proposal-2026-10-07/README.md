# Issue252: actual birth-height regression and unapplied root-boundary repair

Status: source proposal only. No new test, world simulation or browser run; no
runtime edit. The accepted native source, single-run receipts and independent
result review remain unchanged. PR253 angle files and its captured inputs are
untouched. This packet is for independent source review before any execution grant.

## Proposed field ownership

`stoneBurst` receives the stone's native point, including signed native h. The
burst root owns `max(short(point.h), current native ground)` before its default
+90 offset. Each model3 child keeps its existing `createSpellTrail` ground clamp.
The [unapplied patch](proposed-runtime.patch) creates that one root position just
**after** the existing effect9 counter increment and **before** the child loop.

The root expression is
`short(Math.max(short(point.h), terrainPointHeight(w.land, point)) + 90)`.
Children receive the same immutable birth coordinates; `createSpellTrail` copies
those fields and does not mutate its supplied position. The parent stone/dust h,
effect allocation calls, loop count, IDs/counters, RNG calls and phase owners are
unchanged. This is a root initialization repair, not a rendering offset. Existing
`burst.height = trail.h / 45` continues to expose the actual physical height.

For fresh stones the native component proved G-240→G→G+90. The optional old-stone
branch still supplies its current port estimate of stone h. Applying the same
root clamp there preserves the native clamp primitive but does not establish that
estimate's equivalence after terrain changes. No old-stone origin recovery or
checkpoint migration is proposed. The new ordinary regression covers fresh starts.

The maintained runtime is **not modified**. Its before SHA256 remains
`cce900dc4e08ce890ac88060d7db41bb1cde578f80c2424317d4842d8884451b`.
The patch changes only that root-position construction in `app/level-start-runtime.ts`.

## Actual-caller regression

[tests/startup-burst-height.test.mjs](../../../tests/startup-burst-height.test.mjs)
extends the existing `tests/startup-burst-angles.test.mjs` RNG-write observation,
without changing that file or adding a browser/native harness. The original birth
oracle is decoded directly from the accepted raw capture, whose SHA256 is pinned
as `ecec70d64abcfedd06ea1146462b6f7d86e35a3e8b77652f5cea0587b058c957`.
Root common/offset and32 model3 heights are decoded from the original `+0x41`
bytes. The expected offset is their observed difference,90; no browser helper
creates expected native records. Current arrival ground is sampled separately.

On ordinary `createWorld(1..3)` plus70 existing fixed ticks, the observer:

1. Preserves every actual `world.randomState` assignment value and records the
   already-allocated effect before its three gameplay draws, as the angle test does.
2. Installs a one-time `animation` accessor only on that pending effect. The actual
   production assignment first restores a normal data property with the assigned
   value and original/default attributes, then snapshots native XY/h, current
   `w.land` ground, age/state/lifetime/speed/velocity and gameplay state. It neither
   supplies an animation nor changes any stored field. Observation errors are
   retained rather than thrown through production assignment.
3. Restores its own RNG descriptor in `finally`, preserving the final actual RNG
   value. Any still-pending animation interceptor is removed/restored only while
   its exact getter/setter still owns that property; assigned fields are left alone.
4. Requires the assignment's producer turn, age0, state3, zero velocity, three
   gameplay draws, first-draw lifetime and the third-draw gameplay state. This
   binds birth before `stepSpellTrail` can move or ground-contact the child.
   The existing effect loop is earlier in `world-turn.ts` than `stepLevelStarts`;
   the assignment snapshot additionally avoids relying on end-of-turn terrain.
5. Matches the actual XY against the separately reviewed authored inventory and
   requires32 children at each enabled fresh stone:8/8/16 stones,1,024 births.
   Every site starts with null stone turns, reaches phase4 and drains its carriers.
   Disabled Mission1 Dakini/Mission2 Matak do not acquire particles. Exact existing
   gameplay/native phase regressions remain separate acceptance checks.

The comparison is actual birth h minus the ground sampled **at assignment**, not
shader height, nominal site target, retained origin346, or terrain sampled after
later particle motion. Expected failure on unchanged runtime is offset0 versus
native offset90 for the three mission tests. This is a predeclared source-based
prediction; no test has run. The retained-native oracle test is expected to pass.

Each mission emits one compact integrity diagnostic before height assertions:
final gameplay/cosmetic RNG words, effectCounter, nextId, stone-turn arrays and
phase-transition history. A later failure-first/candidate pair must compare those
three diagnostics exactly. This preserves a reviewable allocation/RNG/phase witness
without supplying state or adding another capture runner. These diagnostics do not
claim native whole-mission RNG equality. Existing child cosmetic/draw and angle
regressions should also remain unchanged and pass on the integrated angle source.

## Source review and finite later execution sequence

1. Independently review this exact test, observer ownership/restoration, original
   byte oracle and unapplied patch. Verify the runtime and PR253 source inputs
   remain unchanged. Only syntax/hash/patch validation is performed now.
2. Select the accepted integrated base after the angle work lands; retain/review
   any source correspondence before execution. Do not modify or delay PR253.
3. With a separate parent resource grant, run the new test alone on the unchanged
   runtime through the existing command-receipt workflow. Retain all four TAP
   results and all three integrity diagnostics. A different failure is a blocker
   to inspect, not permission to weaken the height contract or retry automatically.
4. After the red result is accepted and runtime editing is granted, apply only the
   reviewed root-boundary patch. Run the unchanged new test and affected existing
   startup/angle regressions on the exact candidate; compare the integrity
   diagnostics with the red source. No new original-code invocation is needed to
   regenerate the accepted birth oracle.
5. Ordinary public Mission/Skip rendered before/after and startup/checkpoint
   checks, standard check/build and TypeScript quality gates remain necessary
   before runtime acceptance. Reuse the existing ordinary startup observer and
   coordinated check lane. No rendering/performance or complete-startup claim
   follows from this source preparation or the portable birth test alone.

Proposed focused command (unexecuted):
`node --test tests/startup-burst-height.test.mjs`.

The parent must grant the concrete resource window and retained receipt location
before execution. This proposal does not create another launcher or authorize a
runtime edit. `source-validation.json` records only syntax, fingerprints, the
unapplied patch and native-evidence preservation.
