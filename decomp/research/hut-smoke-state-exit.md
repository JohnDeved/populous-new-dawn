# Hut smoke release when a building starts burning

Source audit for [issue 214](https://github.com/JohnDeved/populous-new-dawn/issues/214),
2026-10-06, base `1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`.
This identifies a concrete unbound state-transition consumer. It is not a
failure-first runtime result, an implemented repair, or a global timing finding.

Later bounded execution: [attempt 02](../../references/verification/hut-smoke-state-exit-2026-10-06/attempt-02/result.md)
passed the one full-root/child original-byte composition after the explicitly
retained [attempt-01 ABI-checker failure](../../references/verification/hut-smoke-state-exit-2026-10-06/attempt-01/result.md).
Its [independent result review](../../references/verification/hut-smoke-state-exit-2026-10-06/attempt-02/result-review.md)
accepts the bounded composition; supporting live and ordinary rendered comparisons
have separate acceptance. The [controlled live baseline](../../references/verification/hut-smoke-state-exit-2026-10-06/live-baseline-01/result.md)
reached the intended missing-root-retirement assertion with18 retained samples;
ordinary rendered comparison remains unrun. The native supplied fire/terrain/initialization boundaries
must remain attached to any claim.

## Finding

The original building class initializer removes its retained chimney-smoke root
as soon as the building leaves completed state 2. Burning enters state 4 while
residents are still inside. The live smoke owner checks kind, team, progress and
health, but not the building's native state. Its renderer repeats that eligibility
check. An occupied completed hut can consequently retain and process ordinary
chimney smoke during the initial burn interval, until actual evacuation removes
the occupants. The existing tests do not compose this transition.

This is the next bounded proof candidate. Do not change admission, evacuation,
burn duration, primary allocation phase, frame frequency, or child lifetimes to
fix it. Already-created child puffs have independent ownership and must survive
root release until their own expiry.

## Original producer and consumer

- [00408cb0](../generated/00408cb0.c) rejects protected/already-burning models;
  otherwise it sets building `+0x2c` to 4 and calls `004ed640`.
- [004ed640](../generated/004ed640.c) dispatches class 2 to
  [004030c0](../generated/004030c0.c). Its state-4 arm calls
  [00408840](../generated/00408840.c), which initializes the burn timer to 127
  and creates fire. Its common tail then handles the retained smoke root.
- Instructions `00403227..0040325d` read the `+0x92` root handle, require state 2
  and player ownership to retain it, otherwise call `004ef180` at `0040324f`
  and zero the handle at `00403254`. This is immediate state initialization,
  not the later 32-count occupancy sample.
- [00408ab0](../generated/00408ab0.c) ejects occupants when the separately
  decremented burn timer reaches 119. Thus root removal and evacuation have
  different owners and boundaries.

The canonical EXE was read only as static data. Its verified SHA-256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The two scoped disassemblies and source/input fingerprint are retained in
[hut-smoke-state-exit/](hut-smoke-state-exit/). No Ghidra project or emulated
native/application/browser process was started for this audit.

## Current live binding and ordinary reachability

The shipped Lightning path reaches `world-turn.ts`'s first bolt visit, then
`igniteLightningScenery` / `igniteBuildingAt` in `spell-effects-runtime.ts`.
`igniteBuilding` in `building-damage.ts` sets `damageState.state = 4`; its live
callback initializes `burn.remaining = 127` and fire sockets without changing
completed progress or calling the smoke owner. `buildingFirePeople` explicitly
excludes residents, so this callback does not itself evacuate the hut.

`hut-smoke-runtime.ts::eligible` still accepts the occupied burning hut. The
end-of-turn `stepSecondaryEffects` retains its root slot and runs its root
processor. `scene-entities.ts::updateHutOccupancySmoke` still renders it.
`world-turn.ts` skips the normal building occupancy sample while burning, and
`building-runtime.ts::stepBurningBuilding` eventually releases residents through
the real evacuation/admission owner at timer 119.

No late-game acquisition is required: Mission 1 contains Blue model-1 huts at
authored records 41 and 42 (zero-based), and linked reward record 29 supplies
spell model 3, Lightning (`settings` begins `[11,3,3,1]`). The normal worship,
gift, spell-selection and target-click paths already exist. Missions 2–3 also
have authored Blue huts, but this proof should begin with the explicit Mission 1
reward route instead of injecting stock or assuming cross-mission unlocks.
Full and partial occupancy are normal command-8/admission outcomes.

## Existing evidence to reuse, and why it misses this boundary

- [Shared secondary owner](hut-smoke-secondary-owner.md): slots, prepend order,
  root/child processing, lifetime and checkpoint ownership already have evidence.
- [First visit](hut-smoke-first-visit.md) and
  [attachment correction](hut-occupancy-smoke.md#attachment-selector-correction-2026-10-03)
  remain unchanged; repeat only affected regression checks.
- `check-native-building-fire.py` intercepts `004ed640` and jumps directly to
  `00408840` for ignition. It therefore skips the class-2 initializer's common
  `+0x92` cleanup tail. This probe verifies its declared burn/socket scope, not
  root cleanup. Extend composition rather than rewriting its expected results.
- `check-native-hut-smoke-owner.py` supplies the root and compares one secondary
  traversal. It does not enter the building state initializer.
- `check-browser-building-fire.mjs` injects spell stock and first samples burn
  timer 110, after the 119 evacuation boundary; it does not inspect root state.
- Existing smoke browser checks cover occupancy/removal, pause, restored state
  and children. They do not acquire Lightning and observe the occupied state-4
  transition before evacuation.

The retained [logical-visit research](sprite-logical-visits.md) already samples
model-74/75 smoke initializers with the logical-animation gate clear. Current
smoke frames use the separate 24 Hz presentation owner, with 16-frame wrapping;
root/child lifetimes use logical turns. This audit supports no cadence change.
Complete primary class-7 stream equivalence and matched original raster/elapsed
timing remain explicitly unproved and are not needed to isolate root release.

## Smallest failure-first proof and render witness

1. Extend the existing fire harness with a valid retained root handle and a
   separately allocated child. Execute `00408cb0 -> 004ed640 -> 004030c0` without
   replacing the class-2 initializer with its state-4 arm. Supply only the
   documented fire/terrain/audio leaves. Observe `004ef180` and the zeroed root
   handle. Retain resident count and timer 127; neither is the cleanup condition.
   Cover partial/full roots, protected/no-transition control, and a missing root.
2. Use the existing normal admission scene support to obtain an occupied hut,
   then call the actual Lightning/ignition consumer for a source-bound baseline
   comparison. This supporting runtime fixture may supply the spell boundary;
   label it accordingly. Compare root handle/slot immediately after ignition,
   through the next secondary pass and until evacuation. Do not replace state,
   occupancy or root fields to obtain the transition. Track existing children
   separately and prove that no retired root produces new children.
3. Run one ordinary Mission 1 browser route: acquire the authored Lightning
   reward, house followers, and cast on the occupied Blue hut through HUD/input.
   Capture before ignition, the first rendered state-4 frame with timer above
   119 and unchanged residents, and post-evacuation. Retain root/child IDs,
   actual atlas/frame selection, timer/occupancy, source fingerprint and pixels.
   A second view is useful only if fire occludes the chimney witness.

The runtime repair should be scoped only after the red comparison and independent
review establish the required live ownership boundary. The full/partial/empty,
allocation-turn, restored-child and pause regressions remain acceptance gates.

Resource proposal: one bounded native child using the existing harness, one
sequential portable caller run, then one coordinated browser session. No shared
Ghidra project, importer, fixture recording, build server or browser is reserved
by this audit. Executable proof, browser pixels and code gates are **not run**.
Docs-only validation is limited to static fingerprints, JSON/link structure and
`git diff --check`; no gameplay or parity claim is added.
