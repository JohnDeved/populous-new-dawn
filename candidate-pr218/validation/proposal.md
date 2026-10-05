# Bounded model45 logical-animation repair

Base:3cc9e830d2e7d2aa9844e8104fa51017d65dd171. Scope is the existing authored
model45 decorative body only. Native proof and independent review are pinned at
https://github.com/JohnDeved/populous-new-dawn/tree/e76091766dd2db9d21b6d28ba2075f77a99284df/stone-head-logical-gate.

The native class5/model9 producer supplies0x40000, its real state10 processor
receives logical visits and stamps afterward, and ordinary draw4 consumes that
stamp. Current body flags/stamp/counter bypass the gate. The global24Hz owner,
Vault/HFX, other head/scenery families, allocator and Firewarrior fallback stay
outside this change.

## Small runtime delta

- app/stone-head-animation.ts: create45 state with0x40000. Lazy initialize also
  ORs only this missing bit into an existing family45 record, preserving all saved
  counters/flags/phase and supported null/undefined distinctions. Vault and
  non-model45 records still return null. No game-store schema is added.
- Retain stepStoneHeadAnimation as one explicit eligible native/per-visit helper
  for raw morph/geometry comparisons. Add an optional visit counter, defaulting to
  the state's existing stamp, and pass the matching counter through the existing
  stepObjectAnimation. Callers simulating elapsed time must use the world clock.
- Give animateStoneHeads a logical/presentation phase (default presentation).
  Synchronize enabled/hold/refill first, then use the already reviewed
  animationUsesLogicalVisits predicate to choose exactly one owner. The logical
  phase stamps World.turn; an ungated mode3/mode4-transition presentation visit
  retains the prior stamp. Held ordinary mode4 still receives its logical stamp
  without advancing f1. A flag-only migration is insufficient and is not the fix.
- app/game-clock.ts: in the existing post-turn block, animate live objects then
  Stone Heads logically. Preserve turn body→afterTurn→queued callbacks→logical
  animations→coincident24Hz presentation. Direct tick remains simulation-only.
  There is no new accumulator, tick partition or World timing constant.

Post-turn enumeration follows the existing adapter boundary. A surviving body
allocated before/within/after the completed turn gets one logical visit; a removed
body gets none. Initialization between logical turns may establish state but does
not itself advance a frame. The independent body remains eligible after its reward
trigger becomes inactive; do not gate on shrine.active. Missing old saves get the
existing deterministic phase0/disabled-hold1 policy; existing saves retain phase.
New Scene clocks cannot replay that saved logical visit. Mode4 transitions remain
presentation-only even when carrying0x40000; no double call at coincident boundaries.

## Failure-first and fixture changes

New portable tests pin the first half-turn hold, normal/speed0/catch-up visits,
observer ordering, transition negative control, lazy/allocation/removal boundaries,
legacy flags/stamp retention, disable/refill, pause/land pause, trigger exhaustion
and uint32 turn wrap. Existing native coordinates, morph phases, face/UV assertions,
gameplay/RNG equality, real worship/reward and checkpoint assertions stay intact.

The old exhausted-trigger test must require a completed logical turn, rather than
asserting every1/24 advances. Its next half-turn must hold. The old browser helper
that freezes speed0 while advancing1/24 will explicitly become a controlled1x
logical-turn fixture (one World turn per step); keep all18 phase/geometry/frame
assertions and its existing non-ordinary fixture disclosures. Do not preserve
speed0 body advancement or relax pixel/geometry assertions to obtain a pass.

Compare the candidate's actual phase adapter against the accepted retained native
producer/dispatcher timelines; that avoids re-executing the original proof solely
for a scheduling change. Keep the old proof's source/command labels intact. Run
focused built-in-node regressions on CPU4, then freeze for fresh source review.
Full check/build/scoped quality and browser require a separate coordinated grant.
No new ordinary browser or whole-family parity claim is made by portable fixtures.
