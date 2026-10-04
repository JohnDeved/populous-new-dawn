# Shared secondary smoke owner

Issue 73 successor to the [authored initial contribution](hut-smoke-initial-phase.md).
The existing socket correction and partial-root first processing visit remain
required regressions. This slice adds full-root children using an explicit shared
secondary owner. It does not claim full original allocation-stream or UI parity.

## Original pool and ordering

New byte-verified Ghidra 12.1.3 exports bind these boundaries:

- `004ed820` establishes secondary addresses `00930ab8..00937a98`: 160 records
  of 179 bytes, native indices 1840–1999. `004ed880` initializes physical indices.
- `004ee300` reconstructs free and allocated lists by prepending physical records
  in ascending index order. The resulting visit/free order is descending index.
- `004edbd0` prepends every secondary allocation, across class 7 and class 10.
  It copies the appropriate primary class seed without incrementing it.
- `004edae0` allows full-root model74 at count <=150 and model75 at count <=140.
  Pool exhaustion can independently reject an allocation. These are inclusive
  prechecks, not a maximum of 140 smoke sprites.
- `004ef180` -> `004ed530` returns secondary markers/smoke to the free list
  immediately. They do not incur the primary pool's three-turn release delay.

The new pool probe executes actual bounds/index initialization and list building,
then 160 mixed allocations, 320 prechecks, one exhausted-pool failure and five
immediate reuse cases (head, interior, oldest, a panel record and a child's final
processor visit). Only model initialization and sunlight bookkeeping are supplied.
The existing [producer probe](hut-smoke-secondary-phase.md) remains authoritative
for its 8,192 phase/RNG cases, reserve boundaries, deferral and sixteen-visit expiry.

## Runtime contract

`secondary-effects.ts` owns 160 stable slots, a free stack, newest-first visitation
and separate presentation serials. Smoke never consumes gameplay IDs or advances
the primary phase. `hut-smoke-runtime.ts` owns building root references and children.

- Ordinary real admission/removal reconciles roots immediately. The building pass
  also samples its 32-count phase. The later secondary pass visits an earlier
  root allocation in the same turn, preserving the merged first-visit repair.
- A traversal snapshots its visit order, increments each entry before processing,
  and excludes children created during that traversal. Model74 draws only when
  `counter & 7 == 0`; low-five-bit outcomes 0/1 request model75. The draw precedes
  shared-capacity or free-pool failure.
- Children retain the parent position and HFX1385–1400 sequence. They have their
  own sixteen visits and survive root replacement/removal. No drift, particle
  density, wall-clock emitter or new artwork is introduced.
- Existing destination markers enter the same visit/expiry list. A newer marker's
  final visit can release capacity before an older root; the reverse order does
  not backdate that release.
- Sprite animation uses the existing 24 Hz presentation clock; lifecycle/counter
  visits use game turns. Scene rendering only samples state and does not consume
  smoke RNG or add visits. Partial roots reuse the existing lifetime/restart code.

The primary byte is the existing `world.effectCounter` allocation adapter, with
its proved early-level authored omission fixed separately. The conditional native
comparison supplies this byte explicitly. Other original producer composition is
still incomplete; this work does not relabel it complete or claim an exact
whole-game puff timeline from an original saved game.

### Explicit UI adapter reservations

The native pool is also used by object panels (`00504060`, class10/model3),
placement/control records, marker feedback and some renderer-created dust/sparks.
The bounded browser owner counts its supported effects plus actual current
person/head panels, visible building panels and the visible placement-preview
adapter. These reservations are recalculated from active owners, never an invented
constant reserve. Marker effects use actual allocated slots.

Current building-panel visibility and placement-preview lifetime are pre-existing
browser adapters, not recovered native UI allocation/lifetime. Their reservations
make that ownership explicit without changing their displayed contents. Unsupported
native dust/control producers are not fabricated. This is therefore **not** a
whole-game original shared-capacity equivalence claim.

## Draw RNG is intentionally shared

Original `004673b0` draw-polygons case19 invokes `00475350`, consuming `0089bc72`.
The smoke processor `0050c260` consumes that same value. A new 145-case composition
executes zero through 144 supplied bolt submissions before one eligible root visit
and matches the TypeScript RNG and child decision in every case. With seed1,
zero submissions yields no child; thirteen yields one.

The browser retains its existing draw/turn ordering: elapsed game turns are
processed before that frame's effect draw. Lightning still advances its existing
shared cosmetic RNG during rendering. Consequently changing intervening bolt
submissions can change puff identities, just as the native primitives demonstrate.
Do not call this a native frame-invariant sequence. The probe does not execute or
claim the original entire outer render loop, culling or raster output.

## Checkpoints and reconstruction

The original state block beginning `0089d178` with length `0xd1964` covers primary
seed bytes and secondary records. The scoped snapshot helper `00442cd0` passes
that block to its file helper, then reconstructs lists; `00443260` reconstructs
lists after its load helper succeeds. These exports establish the local state/list
boundaries, not a complete native file-format or manual-save UI execution.

The browser stores root/child counters, partial visibility/lifetimes, positions,
animation phase, physical slots and free/visit ownership in the existing World
checkpoint. List reconstruction uses the proved descending physical order at
save/restore. Scene creation does not allocate or age a restored child. Transient
DOM panel/preview reservations are rebuilt from their actual adapters.

Legacy checkpoints without this owner have no historical child/phase data. They
retain the established root reconstruction from current occupancy and register
any existing destination markers. No past puff history or elapsed visits are
invented. Existing browser cosmetic-RNG persistence remains unchanged; no native
whole-save parity claim is made.

## Evidence and limitations

The original EXE SHA256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
All probes use bounded original-byte emulation, not Wine or whole EXE execution.

- `check-native-secondary-pool.py`: real pool setup, capacity, reuse and rebuild.
- `check-native-hut-smoke-owner.py`: 8,203 native/runtime traversal comparisons.
  A source-bound red run against the pre-owner helper fails on a real native
  child allocation; the new owner matches counter/lifetime/position and both RNG
  ownership fields for all cases. Supplied counters/reservations are explicit.
- `check-native-hut-smoke-render-rng.py`: shared native draw/processor RNG boundary.
- `secondary-hut-smoke.test.mjs`: gates, cross-kind order, deferral, independent
  expiry, current UI reservations and physical-slot reconstruction.
- `secondary-hut-smoke-scene.test.mjs`: real command8 capacity admission through
  the scene binding, original atlas UV/size, repeated-render/pause invariance and
  restored child expiry. It is a supplied scene/terrain fixture, not shipped-input
  browser acceptance.

Browser screenshots, ordinary fresh-hut controls, final standard/quality gates and
fresh review remain required before acceptance. No assets, parity ledger, hardware
performance claim, deployment or GitHub Actions are part of this work.
