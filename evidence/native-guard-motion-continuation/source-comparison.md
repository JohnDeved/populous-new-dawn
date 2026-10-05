# Read-only port comparison

Compared source: `c20a297f5f815ce404f796b08f77ea56396f96da`, PR220's frozen candidate.
This is static source correspondence, not a TypeScript/native equality run or a
browser witness. No source, index, ref, parity ledger, or candidate receipt changed.

- `app/world-turn.ts:1508` dispatches an active command30 or genuine pending Guard
  to `stepLiveMovement`; earlier competing combat/work branches still own their
  documented cases. This does not establish every busy-controller handoff.
- `app/live-movement.ts:775` calls `stepLivePhysics`, then `stepLiveRoute`, then
  `stepLiveOrderQueue`, with command30 calling `stepShamanGuard` at line873.
- `app/live-people.ts:899` increments the class counter and calls preparation,
  reaction and airborne checks, then actual port physics. Its generic physics
  `path` callback is empty because `stepLiveMovement` separately advances the
  route immediately afterward. That composition matches the native ordering
  relevant here; do not infer a missing route call from the empty inner callback.
- `app/live-pathfinding.ts:374` advances the route following position update.
  Its exact-goal cleanup and the broader route adapter remain untested in this
  packet; this mapping alone earns no route-equivalence claim.
- `app/live-movement.ts:650` reproduces command30's first-visit recovery/plan,
  four-counter cadence, signed-coordinate near test and >=440 replan gate.
  The near branch clears pursuit and returns. It does not stop speed, release
  the route or select a resting animation. That agrees with the directly traced
  native near callback. This packet gives no basis for adding such a setter.
- `app/game-clock.ts:91` invokes logical object animation after a completed
  logical turn. `app/live-people.ts:1195` stamps the current authoritative source
  and executes `stepObjectAnimation`; `app/animation.ts:94` owns phase advancement.
  This is the port's elapsed-time adapter, not a claim to duplicate original
  wall-clock/render scheduling. Native class stamping and animation-list ordering
  were executed, while the original outer draw/timer loop was only read statically.

No production defect is established. No global movement-order rewrite or PR220
scope expansion is recommended from this four-case, flat-world witness.
