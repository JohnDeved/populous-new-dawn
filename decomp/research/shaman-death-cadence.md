# Shaman model-12 death cadence (#30)

## Bounded integration

Built from fetched main4897ea93833b5062aabc357a9aa54787f150c44e in a separate
worktree. Reviewed f62e996 remains untouched; this branch includes its required
last-frame rise/hidden-wait behavior because that change is not yet on main.
It is a bounded successor, not a second effect emitter or full #30 closure.

`shaman-death-vfx.ts` owns only phase-entry animation resets, a displayed-frame
latch and read-only frame/visibility selection. The ordinary Shaman producer and
existing processed-phase assignment notify it. `Effect.animation`,
`setAnimationObject`, `stepObjectAnimation` and the existing chronological24Hz
presentation clock are reused. A single guarded call inside the existing
`animateLiveObjects` effect loop latches f2 before its existing animation step.
The scene consumes the latch, never mutating it or advancing an animation clock.

No changes to global scheduling, effect age/duration, death eligibility, kill
credit, outcomes, either RNG, respawn timers/spawning, camera, worship acquisition,
model149, #22, follower corpses or non-reincarnating deaths. No importer, original
asset, generic animation helper, checkpoint migration or parity-ledger change.

## Reused original proof

The read-only cadence handoff/probe/report is retained at
`/Users/johann/pnd-worktrees/worker5-30-cadence-research/work/orchestration/worker5-30-cadence/`.
Original probe receipt:7725e40c-c706-4379-b9c7-a3a4b5b85ed8. The earlier #30 note
and native lifecycle/animation checkers were reused; no new native export needed.
EXE SHA256:3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f.

`00502910 -> 004ed640 -> 00500e20 -> 005029d0` installs the first body pose during
normal initialization. Phase0/1/2 entry selects source680/352/360 and explicitly
resets f2; `004ee700` alone retains f2. Descriptor14 is mode2, hold0, step0;
`004ee7b0` advances once per eligible presentation visit and wraps at the original
VSTART/VFRA counts8/1/10. Phase3 freezes source360's last frame9; phase4 hides it.

`004a4c07` draws before `004a4c9a` advances the animation lists. Current browser
clock advancement precedes GPU rendering, so the effect-local latch preserves
the current display frame before increment. First/second presentation visits
therefore render0/1 while the next counters are1/2. Simply rendering the updated
counter would incorrectly begin at1. World-turn or age*12 timing is also wrong:
with two supplied presentation visits per simulation visit, the original displays
body0..7 and transition0..5, then held9; additional visits can wrap both sequences.

Phase entry here follows the existing `stepReincarnation` processed-phase output,
not the native controller's next-phase flag. No lifecycle threshold is shifted.
Pause and land-pause already gate the shared effect traversal. The original
readiness/visibility/rate configuration remains a wider boundary:24Hz is the
existing browser adapter, not a universal native wall-clock/FPS assertion.
The prior probe's unclassified sentinel is not used as RNG-equivalence evidence.

## Checkpoints and verification

New checkpoints naturally serialize animation counters plus optional
`reincarnation.displayedFrame`. Existing migrations retain them. Old checkpoints
without these fields display deterministic0 for phases0..2 or9 for rise; the
next eligible effect-animation visit initializes the same fallback without
replaying death, sound, reward or spawning. Historical draw counts cannot be
recovered from simulation age. Existing global fractional-clock persistence is
unchanged; this patch owns only the serialized effect counters/latch.

`tests/shaman-death-cadence.test.mjs` starts with authored Mission2 combat reached
by normal command/tick without HP, position, entity, RNG or AI injection. It checks
actual `advanceGame` first/second presentation visits, phase resets and looping,
new/legacy checkpoint continuation, pause, and30/60/120/144Hz plus irregular render
schedules at0/0.25/1/4/400 simulation speeds. A control disables only this effect's
animation through the existing stamp gate; complete world snapshots, including
RNG, outcome and respawn, must match after removing only presentation fields.

The canonical browser checker enters Mission2 through the shipped UI, selects H,
uses the normal attack-command API against authored warrior13 and lets combat
kill the real Shaman. Deterministic pacing supplies the scene's actual presentation
visits; it verifies rendered0/1 for body and transition, body checkpoint shown1 /
next2 / resumed2, held9, hidden wait, GPU contribution and ordinary respawn/cleanup.
Target submission is a normal command API adapter, not a pointer/picking claim.
Pause/speed/camera are test-controlled; death, positions, timers and outcome are not.

The retained original CPU report is hash-bound in the ignored implementation
receipts; `compare-cadence.mjs` compares the new helper and existing live traversal
against its70 captured animation snapshots over544 phase visits. This is reuse of
executed native evidence, not a claim of a fresh native/GPU run. Exact final-head
check commands/results and any repository baseline failures are in
`work/orchestration/worker5-30-cadence-impl/handoff.json` and its receipts.

```sh
node --test tests/shaman-death-cadence.test.mjs
# Under an owned server through the canonical queue supervisor:
node scripts/check-browser-shaman-death-cadence.mjs
```
